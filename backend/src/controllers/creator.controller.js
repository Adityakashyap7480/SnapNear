import { and, desc, eq, gte, inArray, lte, notExists, sql } from 'drizzle-orm';
import env from '../config/env.js';
import { db } from '../db/index.js';
import { bookingDeclines, bookings, payouts } from '../db/schema.js';
import { countOf, minOf, sumOf } from '../db/aggregates.js';
import { findBooking, updateBooking } from '../models/bookings.js';
import { needsPartnerTerms, toPublicUser, updateCreatorProfile } from '../models/users.js';
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
import {
  CLEARED_START_OTP,
  START_OTP_MAX_ATTEMPTS,
  isStartOtpMatch,
  newStartOtp,
  shootMinutesFor,
} from '../services/shootOtp.js';
import { PARTNER_TERMS_VERSION } from '../constants/terms.js';

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

const ownJob = (req) => and(eq(bookings.id, req.params.id), eq(bookings.creatorId, req.user.doc.id));

async function computeStats(creatorId) {
  const today = gte(bookings.completedAt, startOfToday());
  const [row] = await db
    .select({
      completed: countOf(),
      lifetimeEarnings: sumOf(bookings.creatorPayout),
      platformFeePaid: sumOf(bookings.platformFee),
      todayEarnings: sumOf(bookings.creatorPayout, today),
      todayCompleted: countOf(today),
    })
    .from(bookings)
    .where(and(eq(bookings.creatorId, creatorId), eq(bookings.status, BOOKING_STATUS.COMPLETED)));
  return row;
}

/** The partner's SnapNear wallet: paid shoots waiting for the manual UPI payout, and what's already been sent. */
async function computeWallet(creator) {
  const isDue = eq(bookings.paymentStatus, PAYMENT_STATUS.DUE);
  const isUnsettled = and(
    eq(bookings.paymentStatus, PAYMENT_STATUS.PAID),
    eq(bookings.settlementStatus, SETTLEMENT_STATUS.PENDING)
  );

  const [[row], recentPayouts] = await Promise.all([
    db
      .select({
        balance: sumOf(bookings.creatorPayout, isUnsettled),
        balanceCount: countOf(isUnsettled),
        readyToPay: sumOf(bookings.creatorPayout, and(isUnsettled, lte(bookings.settlementEligibleAt, new Date()))),
        awaitingCustomer: sumOf(bookings.creatorPayout, isDue),
        awaitingCount: countOf(isDue),
        withdrawn: sumOf(bookings.creatorPayout, eq(bookings.settlementStatus, SETTLEMENT_STATUS.PAID)),
        nextPayoutAt: minOf(bookings.settlementEligibleAt, isUnsettled),
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.creatorId, creator.id),
          inArray(bookings.paymentStatus, [PAYMENT_STATUS.DUE, PAYMENT_STATUS.PAID])
        )
      ),
    db.select().from(payouts).where(eq(payouts.creatorId, creator.id)).orderBy(desc(payouts.paidAt)).limit(5),
  ]);

  return {
    ...row,
    nextPayoutAt: row.nextPayoutAt || null,
    holdDays: env.payoutHoldDays,
    upiId: creator.creatorProfile?.upiId || '',
    payouts: recentPayouts.map((p) => ({
      id: p.id,
      amount: p.amount,
      bookingCount: p.bookingCount,
      reference: p.reference,
      paidAt: p.paidAt,
    })),
  };
}

function openRequests(creator) {
  return and(
    eq(bookings.status, BOOKING_STATUS.SEARCHING),
    inArray(bookings.serviceType, creator.creatorProfile?.services || []),
    notExists(
      db
        .select({ one: sql`1` })
        .from(bookingDeclines)
        .where(and(eq(bookingDeclines.bookingId, bookings.id), eq(bookingDeclines.creatorId, creator.id)))
    )
  );
}

export const getDashboard = asyncHandler(async (req, res) => {
  const creator = req.user.doc;
  const isOnline = Boolean(creator.creatorProfile?.isOnline);
  const mine = eq(bookings.creatorId, creator.id);

  const dueJobs = await db
    .select()
    .from(bookings)
    .where(and(mine, eq(bookings.paymentStatus, PAYMENT_STATUS.DUE)))
    .orderBy(desc(bookings.completedAt))
    .limit(10);
  const awaitingPayment = (await Promise.all(dueJobs.map((b) => syncPaymentQuietly(b)))).filter(isPaymentDue);

  const [requests, [activeJob], history, stats, wallet] = await Promise.all([
    isOnline
      ? db.select().from(bookings).where(openRequests(creator)).orderBy(desc(bookings.createdAt)).limit(20)
      : Promise.resolve([]),
    db
      .select()
      .from(bookings)
      .where(and(mine, inArray(bookings.status, ACTIVE_JOB_STATUSES)))
      .orderBy(desc(bookings.acceptedAt))
      .limit(1),
    db
      .select()
      .from(bookings)
      .where(and(mine, inArray(bookings.status, [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED])))
      .orderBy(desc(bookings.updatedAt))
      .limit(20),
    computeStats(creator.id),
    computeWallet(creator),
  ]);

  res.json({
    success: true,
    profile: toPublicUser(creator),
    requests: requests.map((b) => serializeBooking(b, { hideClientContact: true })),
    activeJob: activeJob ? serializeBooking(activeJob) : null,
    awaitingPayment: awaitingPayment.map((b) => serializeBooking(b)),
    history: history.map((b) => serializeBooking(b)),
    stats,
    wallet,
  });
});

const TERMS_REQUIRED_MESSAGE = 'Please accept the SnapNear Partner Terms to continue';

export const acceptTerms = asyncHandler(async (req, res) => {
  let creator = req.user.doc;
  if (needsPartnerTerms(creator)) {
    creator = await updateCreatorProfile(creator, { termsVersion: PARTNER_TERMS_VERSION, termsAcceptedAt: new Date() });
  }
  res.json({ success: true, user: toPublicUser(creator) });
});

export const setDutyStatus = asyncHandler(async (req, res) => {
  const { isOnline } = req.body;
  if (isOnline && needsPartnerTerms(req.user.doc)) throw ApiError.forbidden(TERMS_REQUIRED_MESSAGE);
  const creator = await updateCreatorProfile(req.user.doc, { isOnline });

  notifyAdmins(ADMIN_EVENTS.CREATOR_DUTY, { creatorId: creator.id, isOnline });
  res.json({ success: true, profile: toPublicUser(creator) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const changes = Object.fromEntries(Object.entries(req.body).filter(([, value]) => value !== undefined));
  const creator = await updateCreatorProfile(req.user.doc, changes);
  res.json({ success: true, profile: toPublicUser(creator) });
});

export const acceptRequest = asyncHandler(async (req, res) => {
  const creator = req.user.doc;

  if (needsPartnerTerms(creator)) throw ApiError.forbidden(TERMS_REQUIRED_MESSAGE);
  if (!creator.creatorProfile?.isOnline) {
    throw ApiError.badRequest('Go online to accept shoot requests');
  }

  const activeJob = await findBooking(
    and(eq(bookings.creatorId, creator.id), inArray(bookings.status, ACTIVE_JOB_STATUSES))
  );
  if (activeJob) {
    throw ApiError.conflict('Finish your current shoot before accepting a new one');
  }

  const booking = await updateBooking(and(eq(bookings.id, req.params.id), openRequests(creator)), {
    status: BOOKING_STATUS.ASSIGNED,
    creatorId: creator.id,
    creatorName: creator.name,
    creatorPhone: creator.phone,
    creatorEmail: creator.email,
    acceptedAt: new Date(),
  });

  if (!booking) {
    throw ApiError.conflict('This request was already accepted by another partner or cancelled');
  }

  notifyBookingChange(booking, BOOKING_EVENTS.ACCEPTED);
  res.json({ success: true, booking: serializeBooking(booking) });
});

export const declineRequest = asyncHandler(async (req, res) => {
  const booking = await findBooking(and(eq(bookings.id, req.params.id), eq(bookings.status, BOOKING_STATUS.SEARCHING)));
  if (!booking) throw ApiError.notFound('Request is no longer available');

  await db
    .insert(bookingDeclines)
    .values({ bookingId: booking.id, creatorId: req.user.doc.id })
    .onConflictDoNothing();

  res.json({ success: true });
});

export const advanceJob = asyncHandler(async (req, res) => {
  const booking = await findBooking(ownJob(req));
  if (!booking) throw ApiError.notFound('Job not found');

  const next = CREATOR_TRANSITIONS[booking.status];
  if (!next) throw ApiError.conflict(`Job is already ${booking.status}`);
  if (next === BOOKING_STATUS.SHOOTING) {
    throw ApiError.badRequest("Enter the customer's OTP to start the shoot");
  }

  const changes = { status: next, [TIMESTAMP_FOR_STATUS[next]]: new Date() };
  if (next === BOOKING_STATUS.ARRIVED) Object.assign(changes, newStartOtp());
  if (next === BOOKING_STATUS.COMPLETED) changes.paymentStatus = PAYMENT_STATUS.DUE;

  const updated = await updateBooking(
    and(eq(bookings.id, booking.id), eq(bookings.status, booking.status)),
    changes
  );
  if (!updated) throw ApiError.conflict('Job status changed, please refresh');

  notifyBookingChange(updated, BOOKING_EVENT_BY_STATUS[next]);
  res.json({ success: true, booking: serializeBooking(updated) });
});

/** Partner enters the OTP the customer reads out; a match starts the shoot and its countdown. */
export const startShoot = asyncHandler(async (req, res) => {
  const booking = await findBooking(ownJob(req));
  if (!booking) throw ApiError.notFound('Job not found');

  if (booking.status === BOOKING_STATUS.SHOOTING) throw ApiError.conflict('This shoot has already started');
  if (booking.status !== BOOKING_STATUS.ARRIVED) {
    throw ApiError.conflict('Tap "Reached Venue" when you arrive, then ask the customer for the OTP');
  }
  if (!booking.startOtpCode) {
    throw ApiError.conflict('Ask the customer to open SnapNear and tap "New OTP"');
  }
  if (booking.startOtpAttempts >= START_OTP_MAX_ATTEMPTS) {
    throw ApiError.tooManyRequests('Too many wrong OTPs. Ask the customer to tap "New OTP" in their SnapNear app.');
  }

  const isArrived = and(eq(bookings.id, booking.id), eq(bookings.status, BOOKING_STATUS.ARRIVED));

  if (!isStartOtpMatch(booking.startOtpCode, req.body.otp)) {
    const counted = await updateBooking(isArrived, { startOtpAttempts: sql`${bookings.startOtpAttempts} + 1` });
    const left = Math.max(0, START_OTP_MAX_ATTEMPTS - (counted?.startOtpAttempts ?? START_OTP_MAX_ATTEMPTS));
    throw ApiError.badRequest(
      left > 0
        ? `Wrong OTP. ${left} attempt${left === 1 ? '' : 's'} left.`
        : 'Wrong OTP. Ask the customer to tap "New OTP" in their SnapNear app.'
    );
  }

  const startedAt = new Date();
  const minutes = shootMinutesFor(booking);
  const updated = await updateBooking(and(isArrived, eq(bookings.startOtpCode, booking.startOtpCode)), {
    status: BOOKING_STATUS.SHOOTING,
    startedAt,
    durationMinutes: minutes,
    endsAt: new Date(startedAt.getTime() + minutes * 60 * 1000),
    ...CLEARED_START_OTP,
  });
  if (!updated) throw ApiError.conflict('The OTP changed or the shoot already started. Please refresh.');

  notifyBookingChange(updated, BOOKING_EVENTS.SHOOTING);
  res.json({ success: true, booking: serializeBooking(updated) });
});
