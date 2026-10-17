import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, inArray, lte, notExists, sql } from 'drizzle-orm';
import type { AppUser } from '../auth/auth.guard.js';
import { ApiError } from '../common/api-error.js';
import { serializeBooking } from '../common/serializers.js';
import { CLEARED_START_OTP, isStartOtpMatch, newStartOtp, shootMinutesFor } from '../common/shoot-otp.js';
import type { CancelBookingInput, UpdateCreatorProfileInput } from '../common/validation.js';
import { env } from '../config/env.js';
import { ADMIN_EVENTS, BOOKING_EVENTS, BOOKING_EVENT_BY_STATUS } from '../constants/events.js';
import {
  ACTIVE_JOB_STATUSES,
  BOOKING_STATUS,
  type BookingStatus,
  CREATOR_TRANSITIONS,
  PAYMENT_STATUS,
  SETTLEMENT_STATUS,
} from '../constants/roles.js';
import { countOf, minOf, sumOf } from '../database/aggregates.js';
import { DatabaseService } from '../database/database.service.js';
import { type NewBooking, bookingDeclines, bookings, payouts } from '../database/schema.js';
import { PushService } from '../notifications/push.service.js';
import { PaymentsService, isPaymentDue } from '../payments/payments.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { BookingsRepository } from '../repositories/bookings.repository.js';
import { withinRadiusKm } from '../common/geo.js';
import {
  type User,
  UsersRepository,
  hasPartnerLocation,
  needsPartnerLocation,
  needsPartnerTerms,
  toPublicUser,
} from '../repositories/users.repository.js';

const TIMESTAMP_FOR_STATUS: Partial<Record<BookingStatus, 'arrivedAt' | 'startedAt' | 'completedAt'>> = {
  [BOOKING_STATUS.ARRIVED]: 'arrivedAt',
  [BOOKING_STATUS.SHOOTING]: 'startedAt',
  [BOOKING_STATUS.COMPLETED]: 'completedAt',
};

const TERMS_REQUIRED_MESSAGE = 'Please accept the SnapNear Partner Terms to continue';

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const ownJob = (id: string, creator: AppUser) => and(eq(bookings.id, id), eq(bookings.creatorId, creator.doc.id));

@Injectable()
export class CreatorService {
  constructor(
    private readonly database: DatabaseService,
    private readonly bookings: BookingsRepository,
    private readonly users: UsersRepository,
    private readonly payments: PaymentsService,
    private readonly realtime: RealtimeGateway,
    private readonly push: PushService
  ) {}

  private get db() {
    return this.database.db;
  }

  private async computeStats(creatorId: string) {
    const today = gte(bookings.completedAt, startOfToday());
    // Count only paid completed shoots — shoot count rises after the customer pays.
    const paidDone = and(eq(bookings.status, BOOKING_STATUS.COMPLETED), eq(bookings.paymentStatus, PAYMENT_STATUS.PAID));
    const [row] = await this.db
      .select({
        completed: countOf(),
        lifetimeEarnings: sumOf(bookings.creatorPayout),
        platformFeePaid: sumOf(bookings.platformFee),
        todayEarnings: sumOf(bookings.creatorPayout, today),
        todayCompleted: countOf(today),
      })
      .from(bookings)
      .where(and(eq(bookings.creatorId, creatorId), paidDone));
    return row;
  }

  /** The partner's SnapNear wallet: paid shoots waiting for the manual UPI payout, and what's already been sent. */
  private async computeWallet(creator: User) {
    const isDue = eq(bookings.paymentStatus, PAYMENT_STATUS.DUE);
    const isUnsettled = and(
      eq(bookings.paymentStatus, PAYMENT_STATUS.PAID),
      eq(bookings.settlementStatus, SETTLEMENT_STATUS.PENDING)
    );

    const [[row], recentPayouts] = await Promise.all([
      this.db
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
      this.db.select().from(payouts).where(eq(payouts.creatorId, creator.id)).orderBy(desc(payouts.paidAt)).limit(5),
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

  private openRequests(creator: User) {
    return and(
      eq(bookings.status, BOOKING_STATUS.SEARCHING),
      inArray(bookings.serviceType, creator.creatorProfile?.services || []),
      notExists(
        this.db
          .select({ one: sql`1` })
          .from(bookingDeclines)
          .where(and(eq(bookingDeclines.bookingId, bookings.id), eq(bookingDeclines.creatorId, creator.id)))
      )
    );
  }

  /** Service/decline filter first, then keep only shoots within MATCH_RADIUS_KM of the partner. */
  private async nearbyOpenRequests(creator: User, limit = 20) {
    if (!hasPartnerLocation(creator)) return [];
    const rows = await this.db
      .select()
      .from(bookings)
      .where(this.openRequests(creator))
      .orderBy(desc(bookings.createdAt))
      .limit(100);
    return rows
      .filter((b) =>
        withinRadiusKm(
          { latitude: creator.latitude, longitude: creator.longitude },
          { latitude: b.latitude, longitude: b.longitude },
          env.matchRadiusKm
        )
      )
      .slice(0, limit);
  }

  async dashboard(current: AppUser) {
    const creator = current.doc;
    const isOnline = Boolean(creator.creatorProfile?.isOnline);
    const mine = eq(bookings.creatorId, creator.id);

    const dueJobs = await this.db
      .select()
      .from(bookings)
      .where(and(mine, eq(bookings.paymentStatus, PAYMENT_STATUS.DUE)))
      .orderBy(desc(bookings.completedAt))
      .limit(10);
    const awaitingPayment = (await Promise.all(dueJobs.map((b) => this.payments.syncPaymentQuietly(b)))).filter(
      isPaymentDue
    );

    const [requests, [activeJob], history, stats, wallet] = await Promise.all([
      isOnline ? this.nearbyOpenRequests(creator, 20) : Promise.resolve([]),
      this.db
        .select()
        .from(bookings)
        .where(and(mine, inArray(bookings.status, ACTIVE_JOB_STATUSES)))
        .orderBy(desc(bookings.acceptedAt))
        .limit(1),
      this.db
        .select()
        .from(bookings)
        .where(and(mine, inArray(bookings.status, [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED])))
        .orderBy(desc(bookings.updatedAt))
        .limit(20),
      this.computeStats(creator.id),
      this.computeWallet(creator),
    ]);

    return {
      success: true,
      profile: toPublicUser(creator),
      requests: requests.map((b) => serializeBooking(b, { hideClientContact: true })),
      activeJob: activeJob ? serializeBooking(activeJob) : null,
      awaitingPayment: awaitingPayment.map((b) => serializeBooking(b)),
      history: history.map((b) => serializeBooking(b)),
      stats,
      wallet,
    };
  }

  async acceptTerms(current: AppUser) {
    let creator = current.doc;
    if (needsPartnerTerms(creator)) {
      creator = await this.users.updateCreatorProfile(creator, {
        termsVersion: env.partnerTermsVersion,
        termsAcceptedAt: new Date(),
      });
    }
    return { success: true, user: toPublicUser(creator) };
  }

  async setDutyStatus(current: AppUser, isOnline: boolean) {
    if (isOnline && needsPartnerTerms(current.doc)) throw ApiError.forbidden(TERMS_REQUIRED_MESSAGE);
    if (isOnline && needsPartnerLocation(current.doc)) {
      throw ApiError.forbidden('Share your current location before going online');
    }
    const creator = await this.users.updateCreatorProfile(current.doc, { isOnline });

    this.realtime.notifyAdmins(ADMIN_EVENTS.CREATOR_DUTY, { creatorId: creator.id, isOnline });
    return { success: true, profile: toPublicUser(creator) };
  }

  async updateProfile(current: AppUser, input: UpdateCreatorProfileInput) {
    const changes = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
    const creator = await this.users.updateCreatorProfile(current.doc, changes);
    return { success: true, profile: toPublicUser(creator) };
  }

  async acceptRequest(id: string, current: AppUser) {
    const creator = current.doc;

    if (needsPartnerTerms(creator)) throw ApiError.forbidden(TERMS_REQUIRED_MESSAGE);
    if (needsPartnerLocation(creator)) throw ApiError.forbidden('Share your current location before accepting shoots');
    if (!creator.creatorProfile?.upiId?.trim()) {
      throw ApiError.forbidden('Add your UPI ID in My Wallet before you can accept shoots');
    }
    if (!creator.creatorProfile?.isOnline) {
      throw ApiError.badRequest('Go online to accept shoot requests');
    }

    const activeJob = await this.bookings.find(
      and(eq(bookings.creatorId, creator.id), inArray(bookings.status, ACTIVE_JOB_STATUSES))
    );
    if (activeJob) {
      throw ApiError.conflict('Finish your current shoot before accepting a new one');
    }

    const candidate = await this.bookings.find(and(eq(bookings.id, id), this.openRequests(creator)));
    if (!candidate) throw ApiError.notFound('This shoot is no longer available');
    if (
      !withinRadiusKm(
        { latitude: creator.latitude, longitude: creator.longitude },
        { latitude: candidate.latitude, longitude: candidate.longitude },
        env.matchRadiusKm
      )
    ) {
      throw ApiError.forbidden(`This shoot is outside your ${env.matchRadiusKm} km range`);
    }

    const booking = await this.bookings.update(and(eq(bookings.id, id), this.openRequests(creator)), {
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

    this.realtime.notifyBookingChange(booking, BOOKING_EVENTS.ACCEPTED);
    // Customer gets a phone banner + app-icon badge even if SnapNear is closed.
    void this.push.notifyShootAccepted(booking);
    return { success: true, booking: serializeBooking(booking) };
  }

  async declineRequest(id: string, current: AppUser) {
    const booking = await this.bookings.find(and(eq(bookings.id, id), eq(bookings.status, BOOKING_STATUS.SEARCHING)));
    if (!booking) throw ApiError.notFound('Request is no longer available');

    await this.db
      .insert(bookingDeclines)
      .values({ bookingId: booking.id, creatorId: current.doc.id })
      .onConflictDoNothing();

    return { success: true };
  }

  /** Partner may cancel before the shoot OTP (assigned or arrived only). */
  async cancelJob(id: string, current: AppUser, data: CancelBookingInput) {
    const booking = await this.bookings.update(
      and(
        ownJob(id, current),
        inArray(bookings.status, [BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.ARRIVED])
      ),
      {
        status: BOOKING_STATUS.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: 'creator',
        cancelReason: data.reason,
        cancelRemark: data.remark.trim(),
      }
    );

    if (!booking) {
      throw ApiError.conflict('You can only cancel before the shoot starts (before OTP)');
    }

    this.realtime.notifyBookingChange(booking, BOOKING_EVENTS.CANCELLED);
    return { success: true, booking: serializeBooking(booking) };
  }

  async advanceJob(id: string, current: AppUser) {
    const booking = await this.bookings.find(ownJob(id, current));
    if (!booking) throw ApiError.notFound('Job not found');

    const next = CREATOR_TRANSITIONS[booking.status];
    if (!next) throw ApiError.conflict(`Job is already ${booking.status}`);
    if (next === BOOKING_STATUS.SHOOTING) {
      throw ApiError.badRequest("Enter the customer's OTP to start the shoot");
    }

    const changes: Partial<NewBooking> = { status: next };
    const timestampField = TIMESTAMP_FOR_STATUS[next];
    if (timestampField) changes[timestampField] = new Date();
    if (next === BOOKING_STATUS.ARRIVED) Object.assign(changes, newStartOtp());
    if (next === BOOKING_STATUS.COMPLETED) changes.paymentStatus = PAYMENT_STATUS.DUE;

    const updated = await this.bookings.update(
      and(eq(bookings.id, booking.id), eq(bookings.status, booking.status)),
      changes
    );
    if (!updated) throw ApiError.conflict('Job status changed, please refresh');

    const event = BOOKING_EVENT_BY_STATUS[next];
    if (event) this.realtime.notifyBookingChange(updated, event);
    return { success: true, booking: serializeBooking(updated) };
  }

  /** Partner enters the OTP the customer reads out; a match starts the shoot and its countdown. */
  async startShoot(id: string, current: AppUser, otp: string) {
    const booking = await this.bookings.find(ownJob(id, current));
    if (!booking) throw ApiError.notFound('Job not found');

    const { maxAttempts } = env.startOtp;
    if (booking.status === BOOKING_STATUS.SHOOTING) throw ApiError.conflict('This shoot has already started');
    if (booking.status !== BOOKING_STATUS.ARRIVED) {
      throw ApiError.conflict('Tap "Reached Venue" when you arrive, then ask the customer for the OTP');
    }
    if (!booking.startOtpCode) {
      throw ApiError.conflict('Ask the customer to open SnapNear and tap "New OTP"');
    }
    if (booking.startOtpAttempts >= maxAttempts) {
      throw ApiError.tooManyRequests('Too many wrong OTPs. Ask the customer to tap "New OTP" in their SnapNear app.');
    }

    const isArrived = and(eq(bookings.id, booking.id), eq(bookings.status, BOOKING_STATUS.ARRIVED));

    if (!isStartOtpMatch(booking.startOtpCode, otp)) {
      const counted = await this.bookings.update(isArrived, { startOtpAttempts: sql`${bookings.startOtpAttempts} + 1` });
      const left = Math.max(0, maxAttempts - (counted?.startOtpAttempts ?? maxAttempts));
      throw ApiError.badRequest(
        left > 0
          ? `Wrong OTP. ${left} attempt${left === 1 ? '' : 's'} left.`
          : 'Wrong OTP. Ask the customer to tap "New OTP" in their SnapNear app.'
      );
    }

    const startedAt = new Date();
    const minutes = shootMinutesFor(booking);
    const updated = await this.bookings.update(and(isArrived, eq(bookings.startOtpCode, booking.startOtpCode)), {
      status: BOOKING_STATUS.SHOOTING,
      startedAt,
      durationMinutes: minutes,
      endsAt: new Date(startedAt.getTime() + minutes * 60 * 1000),
      ...CLEARED_START_OTP,
    });
    if (!updated) throw ApiError.conflict('The OTP changed or the shoot already started. Please refresh.');

    this.realtime.notifyBookingChange(updated, BOOKING_EVENTS.SHOOTING);
    return { success: true, booking: serializeBooking(updated) };
  }
}
