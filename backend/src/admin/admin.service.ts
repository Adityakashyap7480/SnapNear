import { Injectable } from '@nestjs/common';
import { type SQL, and, asc, desc, eq, gte, ilike, inArray, isNotNull, or, sql } from 'drizzle-orm';
import { ApiError } from '../common/api-error.js';
import { accountNotice } from '../common/account-status.js';
import { serializeBooking } from '../common/serializers.js';
import type { AdminBookingQuery, AdminListQuery, UpdateUserStatusInput } from '../common/validation.js';
import { ADMIN_EVENTS, BOOKING_EVENTS } from '../constants/events.js';
import {
  ACCOUNT_STATUS,
  ACTIVE_JOB_STATUSES,
  BOOKING_STATUS,
  type BookingStatus,
  PAYMENT_STATUS,
  ROLES,
} from '../constants/roles.js';
import { countOf, likePattern, maxOf, sumOf } from '../database/aggregates.js';
import { DatabaseService } from '../database/database.service.js';
import { accountDeletions, bookings, creatorProfiles, users } from '../database/schema.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { BookingsRepository } from '../repositories/bookings.repository.js';
import { type User, UsersRepository } from '../repositories/users.repository.js';

const accountFields = (u: User) => ({
  accountStatus: u.accountStatus || ACCOUNT_STATUS.ACTIVE,
  statusReason: u.statusReason || '',
  statusChangedAt: u.statusChangedAt || null,
});

const LIVE_SHOOTS_LIMIT = 20;
const OPEN_OR_ACTIVE: BookingStatus[] = [BOOKING_STATUS.SEARCHING, ...ACTIVE_JOB_STATUSES];

/** Paid + completed — matches partner shoot count on the profile. */
const isCompleted = and(
  eq(bookings.status, BOOKING_STATUS.COMPLETED),
  eq(bookings.paymentStatus, PAYMENT_STATUS.PAID)
);

const daysAgo = (n: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

type Totals = { count: number; value: number };

@Injectable()
export class AdminService {
  constructor(
    private readonly database: DatabaseService,
    private readonly bookings: BookingsRepository,
    private readonly users: UsersRepository,
    private readonly realtime: RealtimeGateway
  ) {}

  private get db() {
    return this.database.db;
  }

  async overview() {
    const istDay = sql<string>`to_char(${bookings.completedAt} at time zone 'Asia/Kolkata', 'YYYY-MM-DD')`;

    const [[completed], statusRows, [today], dailyRows, clients, creators, onlineCreators, liveShoots] =
      await Promise.all([
        this.db
          .select({
            count: countOf(),
            gross: sumOf(bookings.total),
            creatorTotal: sumOf(bookings.creatorPayout),
            platformTotal: sumOf(bookings.platformFee),
          })
          .from(bookings)
          .where(isCompleted),
        this.db
          .select({ status: bookings.status, count: countOf(), value: sumOf(bookings.total) })
          .from(bookings)
          .groupBy(bookings.status),
        this.db
          .select({ gross: sumOf(bookings.total), platform: sumOf(bookings.platformFee), count: countOf() })
          .from(bookings)
          .where(and(isCompleted, gte(bookings.completedAt, daysAgo(0)))),
        this.db
          .select({ date: istDay, gross: sumOf(bookings.total), platform: sumOf(bookings.platformFee), count: countOf() })
          .from(bookings)
          .where(and(isCompleted, gte(bookings.completedAt, daysAgo(6))))
          .groupBy(istDay),
        this.db.$count(users, eq(users.role, ROLES.CLIENT)),
        this.db.$count(users, eq(users.role, ROLES.CREATOR)),
        this.db.$count(creatorProfiles, eq(creatorProfiles.isOnline, true)),
        this.db
          .select()
          .from(bookings)
          .where(eq(bookings.status, BOOKING_STATUS.SHOOTING))
          .orderBy(asc(bookings.endsAt))
          .limit(LIVE_SHOOTS_LIMIT)
          .then((list) => this.bookings.withCreators(list)),
      ]);

    const byStatus = Object.fromEntries(
      Object.values(BOOKING_STATUS).map((s) => [s, { count: 0, value: 0 }])
    ) as Record<BookingStatus, Totals>;
    statusRows.forEach((s) => {
      byStatus[s.status] = { count: s.count, value: s.value };
    });

    const pipeline = OPEN_OR_ACTIVE.reduce<Totals>(
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

    return {
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
    };
  }

  async listBookings({ status, q, page, limit }: AdminBookingQuery) {
    const filters: (SQL | undefined)[] = [];
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
      this.db
        .select()
        .from(bookings)
        .where(where)
        .orderBy(desc(bookings.createdAt))
        .offset((page - 1) * limit)
        .limit(limit)
        .then((list) => this.bookings.withCreators(list)),
      this.db.$count(bookings, where),
    ]);

    return {
      success: true,
      bookings: items.map((b) => serializeBooking(b)),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  /** userId -> deletion record, so scrubbed rows still show the real name to admins. */
  private async deletionMap() {
    const rows = await this.db.select().from(accountDeletions);
    return Object.fromEntries(rows.map((d) => [d.userId, d]));
  }

  private paginate<T>(items: T[], page: number, limit: number) {
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, pages);
    return {
      items: items.slice((safePage - 1) * limit, safePage * limit),
      pagination: { page: safePage, limit, total, pages },
    };
  }

  /** Filter by account lifecycle — deleted = self-deleted (account_deletions row). */
  private matchesAccountFilter<T extends { deletedAt: Date | string | null; accountStatus: string }>(
    row: T,
    account: AdminListQuery['account']
  ) {
    const deleted = Boolean(row.deletedAt);
    if (account === 'deleted') return deleted;
    if (deleted) return account === 'all';
    if (account === 'all') return true;
    return row.accountStatus === account;
  }

  async listClients({ q, page, limit, account }: AdminListQuery) {
    const [clients, deletions, stats] = await Promise.all([
      this.users.listWithProfiles(eq(users.role, ROLES.CLIENT), desc(users.createdAt)),
      this.deletionMap(),
      this.db
        .select({
          clientId: bookings.clientId,
          bookings: countOf(),
          completed: countOf(isCompleted),
          active: countOf(inArray(bookings.status, OPEN_OR_ACTIVE)),
          spent: sumOf(bookings.total, isCompleted),
          lastBookingAt: maxOf(bookings.createdAt),
          // Latest shoot doorstep — used when the customer has no profile GPS yet
          lastBookingAddress: sql<string | null>`(array_agg(${bookings.address} order by ${bookings.createdAt} desc))[1]`,
          lastBookingLatitude: sql<number | null>`(array_agg(${bookings.latitude} order by ${bookings.createdAt} desc))[1]`,
          lastBookingLongitude: sql<number | null>`(array_agg(${bookings.longitude} order by ${bookings.createdAt} desc))[1]`,
        })
        .from(bookings)
        .groupBy(bookings.clientId),
    ]);

    const statMap = Object.fromEntries(stats.map((s) => [s.clientId, s]));
    const needle = q.trim().toLowerCase();
    const all = clients.map((c) => {
      const s = statMap[c.id];
      const d = deletions[c.id];
      const address = (c.address || s?.lastBookingAddress || '').trim();
      const latitude = c.latitude ?? s?.lastBookingLatitude ?? null;
      const longitude = c.longitude ?? s?.lastBookingLongitude ?? null;
      const fields = accountFields(c);
      return {
        id: c.id,
        // Prefer pre-deletion identity so Super Admin still knows who left
        name: d?.name ?? c.name,
        email: d?.email ?? c.email,
        phone: d?.phone || c.phone,
        city: c.city,
        address,
        latitude,
        longitude,
        locationUpdatedAt: c.locationUpdatedAt || null,
        joinedAt: c.createdAt,
        deletedAt: d?.deletedAt ?? null,
        bookings: s?.bookings || 0,
        completed: s?.completed || 0,
        active: s?.active || 0,
        spent: s?.spent || 0,
        lastBookingAt: s?.lastBookingAt || null,
        ...fields,
      };
    });
    const mapped = all.filter((c) => {
      if (!this.matchesAccountFilter(c, account)) return false;
      return (
        !needle ||
        [c.name, c.email, c.phone, c.city, c.address].some((v) => v?.toLowerCase().includes(needle))
      );
    });

    const { items, pagination } = this.paginate(mapped, page, limit);
    const summary = {
      total: all.length,
      bookings: all.reduce((n, c) => n + c.bookings, 0),
      active: all.reduce((n, c) => n + c.active, 0),
      spent: all.reduce((n, c) => n + c.spent, 0),
      deleted: all.filter((c) => c.deletedAt).length,
    };
    return { success: true, clients: items, pagination, summary };
  }

  async listCreators({ q, page, limit, duty, account }: AdminListQuery) {
    const [creators, stats, deletions] = await Promise.all([
      this.users.listWithProfiles(eq(users.role, ROLES.CREATOR), desc(users.createdAt)),
      this.db
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
      this.deletionMap(),
    ]);

    const statMap = Object.fromEntries(stats.map((s) => [s.creatorId, s]));
    const needle = q.trim().toLowerCase();
    const all = creators.map((c) => {
      const s = statMap[c.id];
      const d = deletions[c.id];
      const fields = accountFields(c);
      return {
        id: c.id,
        name: d?.name ?? c.name,
        email: d?.email ?? c.email,
        phone: d?.phone || c.phone,
        city: c.city,
        address: (c.address || '').trim(),
        latitude: c.latitude ?? null,
        longitude: c.longitude ?? null,
        locationUpdatedAt: c.locationUpdatedAt || null,
        joinedAt: c.createdAt,
        deletedAt: d?.deletedAt ?? null,
        services: c.creatorProfile?.services || [],
        experienceYears: c.creatorProfile?.experienceYears || 0,
        gear: c.creatorProfile?.gear || '',
        rating: c.creatorProfile?.rating ?? 5,
        ratingCount: c.creatorProfile?.ratingCount ?? 0,
        isOnline: Boolean(c.creatorProfile?.isOnline),
        accepted: s?.accepted || 0,
        completed: s?.completed || 0,
        active: s?.active || 0,
        earnings: s?.earnings || 0,
        platformFee: s?.platformFee || 0,
        ...fields,
      };
    });
    const mapped = all.filter((c) => {
      if (duty === 'online' && !c.isOnline) return false;
      if (duty === 'offline' && c.isOnline) return false;
      if (!this.matchesAccountFilter(c, account)) return false;
      return (
        !needle ||
        [c.name, c.email, c.phone, c.city, c.address].some((v) => v?.toLowerCase().includes(needle))
      );
    });

    const { items, pagination } = this.paginate(mapped, page, limit);
    const summary = {
      total: all.length,
      online: all.filter((c) => c.isOnline).length,
      activeJobs: all.reduce((n, c) => n + c.active, 0),
      earnings: all.reduce((n, c) => n + c.earnings, 0),
      deleted: all.filter((c) => c.deletedAt).length,
    };
    return { success: true, creators: items, pagination, summary };
  }

  async cancelBooking(id: string) {
    const booking = await this.bookings.update(
      and(eq(bookings.id, id), inArray(bookings.status, OPEN_OR_ACTIVE)),
      { status: BOOKING_STATUS.CANCELLED, cancelledAt: new Date(), cancelledBy: 'superadmin' }
    );
    if (!booking) throw ApiError.conflict('Only open or in-progress bookings can be cancelled');

    this.realtime.notifyBookingChange(booking, BOOKING_EVENTS.CANCELLED);
    return { success: true, booking: serializeBooking(booking) };
  }

  async updateUserStatus(id: string, { status, reason }: UpdateUserStatusInput) {
    const existing = await this.users.findById(id);
    if (!existing) throw ApiError.notFound('User not found');

    const isActive = status === ACCOUNT_STATUS.ACTIVE;
    const user = await this.db.transaction(async (tx) => {
      const updated = await this.users.update(
        existing,
        { accountStatus: status, statusReason: isActive ? '' : reason, statusChangedAt: new Date() },
        tx
      );
      return !isActive && updated.role === ROLES.CREATOR
        ? this.users.updateCreatorProfile(updated, { isOnline: false }, tx)
        : updated;
    });

    let cancelledRequests = 0;
    if (!isActive) {
      // Open requests from a restricted customer must not reach partners anymore
      if (user.role === ROLES.CLIENT) {
        const cancelled = await this.db
          .update(bookings)
          .set({ status: BOOKING_STATUS.CANCELLED, cancelledAt: new Date(), cancelledBy: 'superadmin' })
          .where(and(eq(bookings.clientId, user.id), eq(bookings.status, BOOKING_STATUS.SEARCHING)))
          .returning();
        cancelled.forEach((b) => this.realtime.notifyBookingChange(b, BOOKING_EVENTS.CANCELLED));
        cancelledRequests = cancelled.length;
      }
      this.realtime.forceLogout(user.id, accountNotice(user));
    }

    this.realtime.notifyAdmins(ADMIN_EVENTS.USER_STATUS, { userId: user.id, status });
    return {
      success: true,
      user: { id: user.id, name: user.name, role: user.role, ...accountFields(user) },
      cancelledRequests,
    };
  }
}
