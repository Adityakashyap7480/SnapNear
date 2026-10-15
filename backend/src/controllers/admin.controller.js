import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, or, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { bookings, creatorProfiles, users } from '../db/schema.js';
import { countOf, likePattern, maxOf, sumOf } from '../db/aggregates.js';
import { updateBooking, withCreators } from '../models/bookings.js';
import { findUserById, listUsersWithProfiles, updateCreatorProfile, updateUser } from '../models/users.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { serializeBooking } from '../utils/serializers.js';
import { ACCOUNT_STATUS, ACTIVE_JOB_STATUSES, BOOKING_STATUS, PAYMENT_STATUS, ROLES } from '../constants/roles.js';
import { ADMIN_EVENTS, BOOKING_EVENTS } from '../constants/events.js';
import { forceLogout, notifyAdmins, notifyBookingChange } from '../socket/index.js';
import { accountNotice } from '../utils/accountStatus.js';

const accountFields = (u) => ({
  accountStatus: u.accountStatus || ACCOUNT_STATUS.ACTIVE,
  statusReason: u.statusReason || '',
  statusChangedAt: u.statusChangedAt || null,
});

const LIVE_SHOOTS_LIMIT = 20;
const OPEN_OR_ACTIVE = [BOOKING_STATUS.SEARCHING, ...ACTIVE_JOB_STATUSES];

const isCompleted = eq(bookings.status, BOOKING_STATUS.COMPLETED);

const daysAgo = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

export const getOverview = asyncHandler(async (_req, res) => {
  const istDay = sql`to_char(${bookings.completedAt} at time zone 'Asia/Kolkata', 'YYYY-MM-DD')`;

  const [[completed], statusRows, [today], dailyRows, clients, creators, onlineCreators, liveShoots] = await Promise.all([
    db
      .select({
        count: countOf(),
        gross: sumOf(bookings.total),
        creatorTotal: sumOf(bookings.creatorPayout),
        platformTotal: sumOf(bookings.platformFee),
      })
      .from(bookings)
      .where(isCompleted),
    db
      .select({ status: bookings.status, count: countOf(), value: sumOf(bookings.total) })
      .from(bookings)
      .groupBy(bookings.status),
    db
      .select({ gross: sumOf(bookings.total), platform: sumOf(bookings.platformFee), count: countOf() })
      .from(bookings)
      .where(and(isCompleted, gte(bookings.completedAt, daysAgo(0)))),
    db
      .select({ date: istDay, gross: sumOf(bookings.total), platform: sumOf(bookings.platformFee), count: countOf() })
      .from(bookings)
      .where(and(isCompleted, gte(bookings.completedAt, daysAgo(6))))
      .groupBy(istDay),
    db.$count(users, eq(users.role, ROLES.CLIENT)),
    db.$count(users, eq(users.role, ROLES.CREATOR)),
    db.$count(creatorProfiles, eq(creatorProfiles.isOnline, true)),
    db
      .select()
      .from(bookings)
      .where(eq(bookings.status, BOOKING_STATUS.SHOOTING))
      .orderBy(asc(bookings.endsAt))
      .limit(LIVE_SHOOTS_LIMIT)
      .then(withCreators),
  ]);

  const byStatus = Object.fromEntries(Object.values(BOOKING_STATUS).map((s) => [s, { count: 0, value: 0 }]));
  statusRows.forEach((s) => {
    byStatus[s.status] = { count: s.count, value: s.value };
  });

  const pipeline = OPEN_OR_ACTIVE.reduce(
    (acc, s) => ({ count: acc.count + byStatus[s].count, value: acc.value + byStatus[s].value }),
    { count: 0, value: 0 }
  );

  const dailyMap = Object.fromEntries(dailyRows.map((d) => [d.date, d]));
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = daysAgo(6 - i);
    const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date);
    const row = dailyMap[key];
    return { date: key, gross: row?.gross || 0, platform: row?.platform || 0, count: row?.count || 0 };
  });

  res.json({
    success: true,
    overview: {
      gross: completed.gross,
      creatorTotal: completed.creatorTotal,
      platformTotal: completed.platformTotal,
      completedCount: completed.count,
      today,
      pipeline,
      byStatus,
      totalBookings: statusRows.reduce((n, s) => n + s.count, 0),
      users: { clients, creators, onlineCreators },
      last7Days,
      liveShoots: liveShoots.map((b) => serializeBooking(b)),
    },
  });
});

export const listBookings = asyncHandler(async (req, res) => {
  const { status, q, page, limit } = req.validatedQuery;

  const filters = [];
  if (status === 'active') filters.push(inArray(bookings.status, OPEN_OR_ACTIVE));
  else if (status === 'unpaid') filters.push(eq(bookings.paymentStatus, PAYMENT_STATUS.DUE));
  else if (status !== 'all') filters.push(eq(bookings.status, status));

  if (q) {
    const pattern = likePattern(q);
    filters.push(
      or(
        ilike(bookings.code, pattern),
        ilike(bookings.contactName, pattern),
        ilike(bookings.contactPhone, pattern),
        ilike(bookings.clientName, pattern),
        ilike(bookings.clientEmail, pattern),
        ilike(bookings.creatorName, pattern),
        ilike(bookings.address, pattern)
      )
    );
  }
  const where = and(...filters);

  const [items, total] = await Promise.all([
    db
      .select()
      .from(bookings)
      .where(where)
      .orderBy(desc(bookings.createdAt))
      .offset((page - 1) * limit)
      .limit(limit)
      .then(withCreators),
    db.$count(bookings, where),
  ]);

  res.json({
    success: true,
    bookings: items.map((b) => serializeBooking(b)),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});

export const listClients = asyncHandler(async (_req, res) => {
  const [clients, stats] = await Promise.all([
    listUsersWithProfiles(eq(users.role, ROLES.CLIENT), desc(users.createdAt)),
    db
      .select({
        clientId: bookings.clientId,
        bookings: countOf(),
        completed: countOf(isCompleted),
        active: countOf(inArray(bookings.status, OPEN_OR_ACTIVE)),
        spent: sumOf(bookings.total, isCompleted),
        lastBookingAt: maxOf(bookings.createdAt),
      })
      .from(bookings)
      .groupBy(bookings.clientId),
  ]);

  const statMap = Object.fromEntries(stats.map((s) => [s.clientId, s]));
  res.json({
    success: true,
    clients: clients.map((c) => {
      const s = statMap[c.id] || {};
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        city: c.city,
        joinedAt: c.createdAt,
        bookings: s.bookings || 0,
        completed: s.completed || 0,
        active: s.active || 0,
        spent: s.spent || 0,
        lastBookingAt: s.lastBookingAt || null,
        ...accountFields(c),
      };
    }),
  });
});

export const listCreators = asyncHandler(async (_req, res) => {
  const [creators, stats] = await Promise.all([
    listUsersWithProfiles(eq(users.role, ROLES.CREATOR), desc(users.createdAt)),
    db
      .select({
        creatorId: bookings.creatorId,
        accepted: countOf(),
        completed: countOf(isCompleted),
        active: countOf(inArray(bookings.status, ACTIVE_JOB_STATUSES)),
        earnings: sumOf(bookings.creatorPayout, isCompleted),
        platformFee: sumOf(bookings.platformFee, isCompleted),
      })
      .from(bookings)
      .where(isNotNull(bookings.creatorId))
      .groupBy(bookings.creatorId),
  ]);

  const statMap = Object.fromEntries(stats.map((s) => [s.creatorId, s]));
  res.json({
    success: true,
    creators: creators.map((c) => {
      const s = statMap[c.id] || {};
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        city: c.city,
        joinedAt: c.createdAt,
        services: c.creatorProfile?.services || [],
        experienceYears: c.creatorProfile?.experienceYears || 0,
        gear: c.creatorProfile?.gear || '',
        rating: c.creatorProfile?.rating ?? 5,
        isOnline: Boolean(c.creatorProfile?.isOnline),
        accepted: s.accepted || 0,
        completed: s.completed || 0,
        active: s.active || 0,
        earnings: s.earnings || 0,
        platformFee: s.platformFee || 0,
        ...accountFields(c),
      };
    }),
  });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await updateBooking(
    and(eq(bookings.id, req.params.id), inArray(bookings.status, OPEN_OR_ACTIVE)),
    { status: BOOKING_STATUS.CANCELLED, cancelledAt: new Date(), cancelledBy: 'superadmin' }
  );
  if (!booking) throw ApiError.conflict('Only open or in-progress bookings can be cancelled');

  notifyBookingChange(booking, BOOKING_EVENTS.CANCELLED);
  res.json({ success: true, booking: serializeBooking(booking) });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const existing = await findUserById(req.params.id);
  if (!existing) throw ApiError.notFound('User not found');

  const isActive = status === ACCOUNT_STATUS.ACTIVE;
  const user = await db.transaction(async (tx) => {
    const updated = await updateUser(
      existing,
      { accountStatus: status, statusReason: isActive ? '' : reason, statusChangedAt: new Date() },
      tx
    );
    return !isActive && updated.role === ROLES.CREATOR ? updateCreatorProfile(updated, { isOnline: false }, tx) : updated;
  });

  let cancelledRequests = 0;
  if (!isActive) {
    // Open requests from a restricted customer must not reach partners anymore
    if (user.role === ROLES.CLIENT) {
      const cancelled = await db
        .update(bookings)
        .set({ status: BOOKING_STATUS.CANCELLED, cancelledAt: new Date(), cancelledBy: 'superadmin' })
        .where(and(eq(bookings.clientId, user.id), eq(bookings.status, BOOKING_STATUS.SEARCHING)))
        .returning();
      cancelled.forEach((b) => notifyBookingChange(b, BOOKING_EVENTS.CANCELLED));
      cancelledRequests = cancelled.length;
    }
    forceLogout(user.id, accountNotice(user));
  }

  notifyAdmins(ADMIN_EVENTS.USER_STATUS, { userId: user.id, status });
  res.json({
    success: true,
    user: { id: user.id, name: user.name, role: user.role, ...accountFields(user) },
    cancelledRequests,
  });
});
