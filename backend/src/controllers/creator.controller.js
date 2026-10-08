import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { serializeBooking } from '../utils/serializers.js';
import { ACTIVE_JOB_STATUSES, BOOKING_STATUS, CREATOR_TRANSITIONS } from '../constants/roles.js';
import { notifyAdmins, notifyBookingChange } from '../socket/index.js';

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

  const [requests, activeJob, history, stats] = await Promise.all([
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
  ]);

  res.json({
    success: true,
    profile: creator.toPublicJSON(),
    requests: requests.map((b) => serializeBooking(b, { hideClientContact: true })),
    activeJob: activeJob ? serializeBooking(activeJob) : null,
    history: history.map((b) => serializeBooking(b)),
    stats,
  });
});

export const setDutyStatus = asyncHandler(async (req, res) => {
  const creator = req.user.doc;
  creator.creatorProfile.isOnline = req.body.isOnline;
  await creator.save();

  notifyAdmins('creator:duty', { creatorId: creator._id.toString(), isOnline: req.body.isOnline });
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

  notifyBookingChange(booking, 'booking:accepted');
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

  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: booking.status },
    { status: next, [TIMESTAMP_FOR_STATUS[next]]: new Date() },
    { new: true }
  );
  if (!updated) throw ApiError.conflict('Job status changed, please refresh');

  notifyBookingChange(updated, `booking:${next}`);
  res.json({ success: true, booking: serializeBooking(updated) });
});
