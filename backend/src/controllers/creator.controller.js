import mongoose from 'mongoose';
import env from '../config/env.js';
import Booking from '../models/Booking.js';
import Payout from '../models/Payout.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { serializeBooking } from '../utils/serializers.js';
import {
  ACTIVE_JOB_STATUSES,
  BOOKING_STATUS,
  CREATOR_TRANSITIONS,
  PAYMENT_STATUS,
  SETTLEMENT_STATUS,
} from '../constants/roles.js';
import { ADMIN_EVENTS, BOOKING_EVENTS, BOOKING_EVENT_BY_STATUS } from '../constants/events.js';
import { notifyAdmins, notifyBookingChange } from '../socket/index.js';
import { isPaymentDue, syncPaymentQuietly } from '../services/payments.js';

const TIMESTAMP_FOR_STATUS = {
  [BOOKING_STATUS.ARRIVED]: 'arrivedAt',
  [BOOKING_STATUS.SHOOTING]: 'startedAt',
  [BOOKING_STATUS.COMPLETED]: 'completedAt',
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

async function computeStats(creatorId) {
  const [row] = await Booking.aggregate([
    { $match: { creator: new mongoose.Types.ObjectId(creatorId), status: BOOKING_STATUS.COMPLETED } },
    {
      $group: {
        _id: null,
        completed: { $sum: 1 },
        lifetimeEarnings: { $sum: '$creatorPayout' },
        platformFeePaid: { $sum: '$platformFee' },
        todayEarnings: {
          $sum: { $cond: [{ $gte: ['$completedAt', startOfToday()] }, '$creatorPayout', 0] },
        },
        todayCompleted: {
          $sum: { $cond: [{ $gte: ['$completedAt', startOfToday()] }, 1, 0] },
        },
      },
    },
  ]);

  return {
    completed: row?.completed || 0,
    lifetimeEarnings: row?.lifetimeEarnings || 0,
    platformFeePaid: row?.platformFeePaid || 0,
    todayEarnings: row?.todayEarnings || 0,
    todayCompleted: row?.todayCompleted || 0,
  };
}

const sumIf = (condition, value = '$creatorPayout') => ({ $sum: { $cond: [condition, value, 0] } });

/** The partner's SnapNear wallet: paid shoots waiting for the manual UPI payout, and what's already been sent. */
async function computeWallet(creator) {
  const creatorId = creator._id;
  const isPaid = { $eq: ['$payment.status', PAYMENT_STATUS.PAID] };
  const isUnsettled = { $and: [isPaid, { $eq: ['$settlement.status', SETTLEMENT_STATUS.PENDING] }] };

  const [[row], payouts] = await Promise.all([
    Booking.aggregate([
      { $match: { creator: creatorId, 'payment.status': { $in: [PAYMENT_STATUS.DUE, PAYMENT_STATUS.PAID] } } },
      {
        $group: {
          _id: null,
          balance: sumIf(isUnsettled),
          balanceCount: sumIf(isUnsettled, 1),
          readyToPay: sumIf({ $and: [isUnsettled, { $lte: ['$settlement.eligibleAt', new Date()] }] }),
          awaitingCustomer: sumIf({ $eq: ['$payment.status', PAYMENT_STATUS.DUE] }),
          awaitingCount: sumIf({ $eq: ['$payment.status', PAYMENT_STATUS.DUE] }, 1),
          withdrawn: sumIf({ $eq: ['$settlement.status', SETTLEMENT_STATUS.PAID] }),
          nextPayoutAt: { $min: { $cond: [isUnsettled, '$settlement.eligibleAt', null] } },
        },
      },
    ]),
    Payout.find({ creator: creatorId }).sort({ paidAt: -1 }).limit(5).lean(),
  ]);

  return {
    balance: row?.balance || 0,
    balanceCount: row?.balanceCount || 0,
    readyToPay: row?.readyToPay || 0,
    awaitingCustomer: row?.awaitingCustomer || 0,
    awaitingCount: row?.awaitingCount || 0,
    withdrawn: row?.withdrawn || 0,
    nextPayoutAt: row?.nextPayoutAt || null,
    holdDays: env.payoutHoldDays,
    upiId: creator.creatorProfile?.upiId || '',
    payouts: payouts.map((p) => ({
      id: p._id.toString(),
      amount: p.amount,
      bookingCount: p.bookingCount,
      reference: p.reference,
      paidAt: p.paidAt,
    })),
  };
}

function openRequestsQuery(creator) {
  return {
    status: BOOKING_STATUS.SEARCHING,
    serviceType: { $in: creator.creatorProfile?.services || [] },
    declinedBy: { $ne: creator._id },
  };
}

export const getDashboard = asyncHandler(async (req, res) => {
  const creator = req.user.doc;
  const isOnline = Boolean(creator.creatorProfile?.isOnline);

  const dueJobs = await Booking.find({ creator: creator._id, 'payment.status': PAYMENT_STATUS.DUE })
    .sort({ completedAt: -1 })
    .limit(10);
  const awaitingPayment = (await Promise.all(dueJobs.map((b) => syncPaymentQuietly(b)))).filter(isPaymentDue);

  const [requests, activeJob, history, stats, wallet] = await Promise.all([
    isOnline
      ? Booking.find(openRequestsQuery(creator)).sort({ createdAt: -1 }).limit(20)
      : Promise.resolve([]),
    Booking.findOne({ creator: creator._id, status: { $in: ACTIVE_JOB_STATUSES } }).sort({ acceptedAt: -1 }),
    Booking.find({
      creator: creator._id,
      status: { $in: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED] },
    })
      .sort({ updatedAt: -1 })
      .limit(20),
    computeStats(creator._id),
    computeWallet(creator),
  ]);

  res.json({
    success: true,
    profile: creator.toPublicJSON(),
    requests: requests.map((b) => serializeBooking(b, { hideClientContact: true })),
    activeJob: activeJob ? serializeBooking(activeJob) : null,
    awaitingPayment: awaitingPayment.map((b) => serializeBooking(b)),
    history: history.map((b) => serializeBooking(b)),
    stats,
    wallet,
  });
});

export const setDutyStatus = asyncHandler(async (req, res) => {
  const creator = req.user.doc;
  creator.creatorProfile.isOnline = req.body.isOnline;
  await creator.save();

  notifyAdmins(ADMIN_EVENTS.CREATOR_DUTY, { creatorId: creator._id.toString(), isOnline: req.body.isOnline });
  res.json({ success: true, profile: creator.toPublicJSON() });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const creator = req.user.doc;
  Object.entries(req.body).forEach(([key, value]) => {
    if (value !== undefined) creator.creatorProfile[key] = value;
  });
  await creator.save();
  res.json({ success: true, profile: creator.toPublicJSON() });
});

export const acceptRequest = asyncHandler(async (req, res) => {
  const creator = req.user.doc;

  if (!creator.creatorProfile?.isOnline) {
    throw ApiError.badRequest('Go online to accept shoot requests');
  }

  const hasActiveJob = await Booking.exists({ creator: creator._id, status: { $in: ACTIVE_JOB_STATUSES } });
  if (hasActiveJob) {
    throw ApiError.conflict('Finish your current shoot before accepting a new one');
  }

  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.id, ...openRequestsQuery(creator) },
    {
      status: BOOKING_STATUS.ASSIGNED,
      creator: creator._id,
      creatorSnapshot: { name: creator.name, phone: creator.phone, email: creator.email },
      acceptedAt: new Date(),
    },
    { new: true }
  );

  if (!booking) {
    throw ApiError.conflict('This request was already accepted by another partner or cancelled');
  }

  notifyBookingChange(booking, BOOKING_EVENTS.ACCEPTED);
  res.json({ success: true, booking: serializeBooking(booking) });
});

export const declineRequest = asyncHandler(async (req, res) => {
  const creator = req.user.doc;
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.id, status: BOOKING_STATUS.SEARCHING },
    { $addToSet: { declinedBy: creator._id } },
    { new: true }
  );
  if (!booking) throw ApiError.notFound('Request is no longer available');

  res.json({ success: true });
});

export const advanceJob = asyncHandler(async (req, res) => {
  const creator = req.user.doc;
  const booking = await Booking.findOne({ _id: req.params.id, creator: creator._id });
  if (!booking) throw ApiError.notFound('Job not found');

  const next = CREATOR_TRANSITIONS[booking.status];
  if (!next) throw ApiError.conflict(`Job is already ${booking.status}`);

  const update = { status: next, [TIMESTAMP_FOR_STATUS[next]]: new Date() };
  if (next === BOOKING_STATUS.COMPLETED) update['payment.status'] = PAYMENT_STATUS.DUE;

  const updated = await Booking.findOneAndUpdate({ _id: booking._id, status: booking.status }, update, { new: true });
  if (!updated) throw ApiError.conflict('Job status changed, please refresh');

  notifyBookingChange(updated, BOOKING_EVENT_BY_STATUS[next]);
  res.json({ success: true, booking: serializeBooking(updated) });
});
