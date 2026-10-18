import crypto from 'node:crypto';
import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import {
  ACCOUNT_STATUS,
  ACTIVE_JOB_STATUSES,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  ROLES,
  SERVICE_TYPES,
  SETTLEMENT_STATUS,
} from '../constants/roles.js';

// Text ids so imported rows keep their original ids; new rows get a UUID
const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const ts = (name: string) => timestamp(name, { withTimezone: true });
const money = (name: string) => numeric(name, { precision: 12, scale: 2, mode: 'number' });
const timestamps = () => ({
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

const values = <T extends Record<string, string>>(o: T) => Object.values(o) as [T[keyof T], ...T[keyof T][]];

export const userRole = pgEnum('user_role', [ROLES.CLIENT, ROLES.CREATOR]);
export const accountStatus = pgEnum('account_status', values(ACCOUNT_STATUS));
export const serviceType = pgEnum('service_type', SERVICE_TYPES);
export const bookingStatus = pgEnum('booking_status', values(BOOKING_STATUS));
export const paymentStatus = pgEnum('payment_status', values(PAYMENT_STATUS));
export const paymentVia = pgEnum('payment_via', ['app', 'qr']);
export const settlementStatus = pgEnum('settlement_status', values(SETTLEMENT_STATUS));
export const cancelledBy = pgEnum('cancelled_by', ['client', 'creator', 'superadmin']);

/** Customers and partners. The Super Admin is not stored in the database. */
export const users = pgTable(
  'users',
  {
    id: id(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    phone: text('phone').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRole('role').notNull(),
    city: text('city').notNull().default(''),
    /** Reverse-geocoded label from the device GPS (partners; clients use booking.address). */
    address: text('address').notNull().default(''),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    locationUpdatedAt: ts('location_updated_at'),
    accountStatus: accountStatus('account_status').notNull().default(ACCOUNT_STATUS.ACTIVE),
    statusReason: text('status_reason').notNull().default(''),
    statusChangedAt: ts('status_changed_at'),
    lastLoginAt: ts('last_login_at'),
    /** SHA-256 of one-time password-reset token (raw token is emailed). */
    passwordResetTokenHash: text('password_reset_token_hash'),
    passwordResetExpiresAt: ts('password_reset_expires_at'),
    ...timestamps(),
  },
  (t) => [index('users_role_idx').on(t.role, t.createdAt)]
);

/** One row per partner (role = creator). */
export const creatorProfiles = pgTable('creator_profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  services: serviceType('services').array().notNull(),
  experienceYears: integer('experience_years').notNull().default(1),
  gear: text('gear').notNull().default(''),
  bio: text('bio').notNull().default(''),
  isOnline: boolean('is_online').notNull().default(false),
  isVerified: boolean('is_verified').notNull().default(true),
  /** Running average of client stars (1–5). Starts at 5 until the first real rating. */
  rating: numeric('rating', { precision: 2, scale: 1, mode: 'number' }).notNull().default(5),
  ratingCount: integer('rating_count').notNull().default(0),
  upiId: text('upi_id').notNull().default(''),
  termsVersion: text('terms_version').notNull().default(''),
  termsAcceptedAt: ts('terms_accepted_at'),
  updatedAt: ts('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** A manual UPI transfer from SnapNear to a partner covering one or more paid bookings. */
export const payouts = pgTable(
  'payouts',
  {
    id: id(),
    creatorId: text('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    creatorName: text('creator_name').notNull(),
    creatorPhone: text('creator_phone').notNull(),
    creatorUpiId: text('creator_upi_id').notNull().default(''),
    amount: money('amount').notNull(),
    bookingCount: integer('booking_count').notNull(),
    reference: text('reference').notNull().default(''),
    note: text('note').notNull().default(''),
    paidAt: ts('paid_at').notNull(),
    ...timestamps(),
  },
  (t) => [index('payouts_creator_idx').on(t.creatorId, t.paidAt), index('payouts_paid_at_idx').on(t.paidAt)]
);

export const bookings = pgTable(
  'bookings',
  {
    id: id(),
    code: text('code').notNull().unique(),

    clientId: text('client_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    // Copied at booking time so history survives profile edits
    clientName: text('client_name').notNull(),
    clientPhone: text('client_phone').notNull(),
    clientEmail: text('client_email').notNull(),

    creatorId: text('creator_id').references(() => users.id, { onDelete: 'restrict' }),
    creatorName: text('creator_name'),
    creatorPhone: text('creator_phone'),
    creatorEmail: text('creator_email'),

    serviceType: serviceType('service_type').notNull(),
    serviceLabel: text('service_label').notNull(),
    durationId: text('duration_id').notNull(),
    durationLabel: text('duration_label').notNull(),
    durationMinutes: integer('duration_minutes'),
    occasion: text('occasion').notNull(),

    shootDate: date('shoot_date', { mode: 'string' }).notNull(),
    timeSlot: text('time_slot').notNull(),
    address: text('address').notNull(),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    contactName: text('contact_name').notNull(),
    contactPhone: text('contact_phone').notNull(),
    notes: text('notes').notNull().default(''),

    total: money('total').notNull(),
    creatorPayout: money('creator_payout').notNull(),
    platformFee: money('platform_fee').notNull(),

    status: bookingStatus('status').notNull().default(BOOKING_STATUS.SEARCHING),
    acceptedAt: ts('accepted_at'),
    arrivedAt: ts('arrived_at'),
    startedAt: ts('started_at'),
    endsAt: ts('ends_at'),
    completedAt: ts('completed_at'),
    cancelledAt: ts('cancelled_at'),
    cancelledBy: cancelledBy('cancelled_by'),
    cancelReason: text('cancel_reason').notNull().default(''),
    cancelRemark: text('cancel_remark').notNull().default(''),

    // Issued when the partner reaches the venue; only the customer sees the code.
    // The partner enters it to start the shoot, which also starts the countdown.
    startOtpCode: text('start_otp_code'),
    startOtpAttempts: integer('start_otp_attempts').notNull().default(0),
    startOtpIssuedAt: ts('start_otp_issued_at'),

    // Customer -> SnapNear (Razorpay). `paymentOrderId` backs in-app checkout, `paymentLinkId` backs the partner's QR.
    paymentStatus: paymentStatus('payment_status'),
    paymentOrderId: text('payment_order_id'),
    paymentLinkId: text('payment_link_id'),
    paymentLinkUrl: text('payment_link_url'),
    paymentId: text('payment_id'),
    paymentMethod: text('payment_method'),
    paymentVia: paymentVia('payment_via'),
    paidAt: ts('paid_at'),

    // SnapNear -> partner (manual UPI payout after the hold period)
    settlementStatus: settlementStatus('settlement_status'),
    settlementEligibleAt: ts('settlement_eligible_at'),
    payoutId: text('payout_id').references(() => payouts.id, { onDelete: 'set null' }),
    settledAt: ts('settled_at'),

    ...timestamps(),
  },
  (t) => [
    index('bookings_feed_idx').on(t.status, t.serviceType, t.createdAt),
    index('bookings_client_idx').on(t.clientId, t.createdAt),
    index('bookings_creator_idx').on(t.creatorId, t.status),
    index('bookings_payment_idx').on(t.paymentStatus, t.settlementStatus),
    index('bookings_order_idx').on(t.paymentOrderId),
    // Active jobs per partner (overlap is enforced in acceptRequest by time slot)
    index('bookings_creator_active_idx')
      .on(t.creatorId)
      .where(sql`${t.status} in (${sql.raw(ACTIVE_JOB_STATUSES.map((s) => `'${s}'`).join(', '))})`),
  ]
);

/** One client rating per paid booking — drives the partner's average rating. */
export const bookingRatings = pgTable(
  'booking_ratings',
  {
    id: id(),
    bookingId: text('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    creatorId: text('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    clientId: text('client_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    stars: integer('stars').notNull(),
    remark: text('remark').notNull().default(''),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('booking_ratings_booking_uidx').on(t.bookingId),
    index('booking_ratings_creator_idx').on(t.creatorId, t.createdAt),
  ]
);

/** Partners who passed on an open request, so it stops showing in their feed. */
export const bookingDeclines = pgTable(
  'booking_declines',
  {
    bookingId: text('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    creatorId: text('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.bookingId, t.creatorId] })]
);

/** Pending email OTP during signup (deleted after verify or expiry). */
export const signupOtps = pgTable('signup_otps', {
  email: text('email').primaryKey(),
  otpHash: text('otp_hash').notNull(),
  /** JSON of validated SignupInput (password stored as bcrypt hash). */
  payload: text('payload').notNull(),
  attempts: integer('attempts').notNull().default(0),
  expiresAt: ts('expires_at').notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
});

/** Expo push tokens so partners/customers get alerts when the app is in the background. */
export const deviceTokens = pgTable(
  'device_tokens',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    platform: text('platform').notNull().default('unknown'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('device_tokens_token_uidx').on(t.token),
    index('device_tokens_user_idx').on(t.userId),
  ]
);

export type UserRow = typeof users.$inferSelect;
export type CreatorProfile = typeof creatorProfiles.$inferSelect;
export type NewCreatorProfile = typeof creatorProfiles.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type BookingRating = typeof bookingRatings.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
