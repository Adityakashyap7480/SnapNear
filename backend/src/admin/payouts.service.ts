import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray, lte, sql } from 'drizzle-orm';
import { ApiError } from '../common/api-error.js';
import type { MarkPayoutInput } from '../common/validation.js';
import { env } from '../config/env.js';
import { ADMIN_EVENTS, SOCKET_EVENTS } from '../constants/events.js';
import { PAYMENT_STATUS, ROLES, SETTLEMENT_STATUS } from '../constants/roles.js';
import { countOf, minOf, sumOf } from '../database/aggregates.js';
import { DatabaseService } from '../database/database.service.js';
import { type Payout, bookings, payouts, users } from '../database/schema.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { UsersRepository } from '../repositories/users.repository.js';

const round2 = (n: number) => Math.round(n * 100) / 100;

const UNSETTLED = and(
  eq(bookings.paymentStatus, PAYMENT_STATUS.PAID),
  eq(bookings.settlementStatus, SETTLEMENT_STATUS.PENDING)
);

const serializePayout = (p: Payout) => ({
  id: p.id,
  creatorId: p.creatorId,
  name: p.creatorName,
  phone: p.creatorPhone,
  upiId: p.creatorUpiId || '',
  amount: p.amount,
  bookingCount: p.bookingCount,
  reference: p.reference,
  note: p.note,
  paidAt: p.paidAt,
});

@Injectable()
export class PayoutsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly users: UsersRepository,
    private readonly realtime: RealtimeGateway
  ) {}

  private get db() {
    return this.database.db;
  }

  async list() {
    const isReady = lte(bookings.settlementEligibleAt, new Date());
    const nextEligibleAt = minOf(bookings.settlementEligibleAt);

    const [pending, collection, [paidOut], history] = await Promise.all([
      this.db
        .select({
          creatorId: bookings.creatorId,
          amount: sumOf(bookings.creatorPayout),
          count: countOf(),
          readyAmount: sumOf(bookings.creatorPayout, isReady),
          readyCount: countOf(isReady),
          oldestPaidAt: minOf(bookings.paidAt),
          nextEligibleAt,
          codes: sql<string[]>`array_agg(${bookings.code} order by ${bookings.paidAt})`,
        })
        .from(bookings)
        .where(UNSETTLED)
        .groupBy(bookings.creatorId)
        .orderBy(asc(nextEligibleAt)),
      this.db
        .select({
          status: bookings.paymentStatus,
          count: countOf(),
          amount: sumOf(bookings.total),
          platform: sumOf(bookings.platformFee),
        })
        .from(bookings)
        .where(inArray(bookings.paymentStatus, [PAYMENT_STATUS.DUE, PAYMENT_STATUS.PAID]))
        .groupBy(bookings.paymentStatus),
      this.db.select({ amount: sumOf(payouts.amount), count: countOf() }).from(payouts),
      this.db.select().from(payouts).orderBy(desc(payouts.paidAt)).limit(30),
    ]);

    const partnerIds = pending.map((p) => p.creatorId).filter((id): id is string => Boolean(id));
    const partners = partnerIds.length ? await this.users.listWithProfiles(inArray(users.id, partnerIds), users.id) : [];
    const partnerMap = Object.fromEntries(partners.map((u) => [u.id, u]));
    const byStatus = Object.fromEntries(collection.map((c) => [c.status, c]));

    return {
      success: true,
      holdDays: env.payoutHoldDays,
      summary: {
        owedToPartners: round2(pending.reduce((n, p) => n + p.amount, 0)),
        owedCount: pending.reduce((n, p) => n + p.count, 0),
        readyToPay: round2(pending.reduce((n, p) => n + p.readyAmount, 0)),
        collected: byStatus[PAYMENT_STATUS.PAID]?.amount || 0,
        collectedCount: byStatus[PAYMENT_STATUS.PAID]?.count || 0,
        platformCollected: round2(byStatus[PAYMENT_STATUS.PAID]?.platform || 0),
        dueFromCustomers: byStatus[PAYMENT_STATUS.DUE]?.amount || 0,
        dueCount: byStatus[PAYMENT_STATUS.DUE]?.count || 0,
        paidOut: round2(paidOut.amount),
        payoutCount: paidOut.count,
      },
      partners: pending.map((p) => {
        const u = p.creatorId ? partnerMap[p.creatorId] : undefined;
        return {
          creatorId: p.creatorId,
          name: u?.name || 'Deleted partner',
          phone: u?.phone || '',
          email: u?.email || '',
          city: u?.city || '',
          upiId: u?.creatorProfile?.upiId || '',
          accountStatus: u?.accountStatus || 'active',
          amount: round2(p.amount),
          count: p.count,
          readyAmount: round2(p.readyAmount),
          readyCount: p.readyCount,
          oldestPaidAt: p.oldestPaidAt,
          nextEligibleAt: p.nextEligibleAt,
          codes: p.codes,
        };
      }),
      history: history.map(serializePayout),
    };
  }

  /** Records that the owner has sent a partner their pending earnings by UPI, clearing their payout balance. */
  async markPaid({ creatorId, reference, note }: MarkPayoutInput) {
    const [creator] = await this.users.listWithProfiles(
      and(eq(users.id, creatorId), eq(users.role, ROLES.CREATOR)),
      users.id
    );
    if (!creator) throw ApiError.notFound('Partner not found');

    const now = new Date();
    // All-or-nothing: a concurrent request waits on the booking rows and then finds nothing left to settle
    const payout = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(payouts)
        .values({
          creatorId: creator.id,
          creatorName: creator.name,
          creatorPhone: creator.phone,
          creatorUpiId: creator.creatorProfile?.upiId || '',
          amount: 0,
          bookingCount: 0,
          reference,
          note,
          paidAt: now,
        })
        .returning();

      const settled = await tx
        .update(bookings)
        .set({ settlementStatus: SETTLEMENT_STATUS.PAID, payoutId: created.id, settledAt: now })
        .where(and(eq(bookings.creatorId, creator.id), UNSETTLED))
        .returning({ creatorPayout: bookings.creatorPayout });
      if (settled.length === 0) throw ApiError.conflict(`${creator.name} has no pending earnings to pay`);

      const [final] = await tx
        .update(payouts)
        .set({ amount: round2(settled.reduce((n, b) => n + b.creatorPayout, 0)), bookingCount: settled.length })
        .where(eq(payouts.id, created.id))
        .returning();
      return final;
    });

    this.realtime.notifyUser(creator.id, SOCKET_EVENTS.WALLET_PAYOUT, {
      amount: payout.amount,
      bookingCount: payout.bookingCount,
      reference: payout.reference,
    });
    this.realtime.notifyAdmins(ADMIN_EVENTS.PAYOUT_PAID, { creatorId: creator.id, amount: payout.amount });

    return { success: true, payout: serializePayout(payout) };
  }
}
