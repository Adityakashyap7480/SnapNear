import env from '../config/env.js';
import Booking from '../models/Booking.js';
import Payout from '../models/Payout.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { PAYMENT_STATUS, ROLES, SETTLEMENT_STATUS } from '../constants/roles.js';
import { ADMIN_EVENTS, SOCKET_EVENTS } from '../constants/events.js';
import { notifyAdmins, notifyUser } from '../socket/index.js';

const round2 = (n) => Math.round(n * 100) / 100;

const UNSETTLED = { 'payment.status': PAYMENT_STATUS.PAID, 'settlement.status': SETTLEMENT_STATUS.PENDING };

const serializePayout = (p) => ({
  id: p._id.toString(),
  creatorId: p.creator.toString(),
  name: p.creatorSnapshot?.name,
  phone: p.creatorSnapshot?.phone,
  upiId: p.creatorSnapshot?.upiId || '',
  amount: p.amount,
  bookingCount: p.bookingCount,
  reference: p.reference,
  note: p.note,
  paidAt: p.paidAt,
});

export const listPayouts = asyncHandler(async (_req, res) => {
  const now = new Date();
  const isReady = { $lte: ['$settlement.eligibleAt', now] };

  const [pending, collection, paidOutAgg, history] = await Promise.all([
    Booking.aggregate([
      { $match: UNSETTLED },
      {
        $group: {
          _id: '$creator',
          amount: { $sum: '$creatorPayout' },
          count: { $sum: 1 },
          readyAmount: { $sum: { $cond: [isReady, '$creatorPayout', 0] } },
          readyCount: { $sum: { $cond: [isReady, 1, 0] } },
          oldestPaidAt: { $min: '$payment.paidAt' },
          nextEligibleAt: { $min: '$settlement.eligibleAt' },
          codes: { $push: '$code' },
        },
      },
      { $sort: { nextEligibleAt: 1 } },
    ]),
    Booking.aggregate([
      { $match: { 'payment.status': { $in: [PAYMENT_STATUS.DUE, PAYMENT_STATUS.PAID] } } },
      {
        $group: {
          _id: '$payment.status',
          count: { $sum: 1 },
          amount: { $sum: '$total' },
          platform: { $sum: '$platformFee' },
        },
      },
    ]),
    Payout.aggregate([{ $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    Payout.find().sort({ paidAt: -1 }).limit(30).lean(),
  ]);

  const partners = await User.find({ _id: { $in: pending.map((p) => p._id) } })
    .select('name phone email city creatorProfile accountStatus')
    .lean();
  const partnerMap = Object.fromEntries(partners.map((u) => [u._id.toString(), u]));
  const byStatus = Object.fromEntries(collection.map((c) => [c._id, c]));

  res.json({
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
      paidOut: round2(paidOutAgg[0]?.amount || 0),
      payoutCount: paidOutAgg[0]?.count || 0,
    },
    partners: pending.map((p) => {
      const u = partnerMap[p._id.toString()] || {};
      return {
        creatorId: p._id.toString(),
        name: u.name || 'Deleted partner',
        phone: u.phone || '',
        email: u.email || '',
        city: u.city || '',
        upiId: u.creatorProfile?.upiId || '',
        accountStatus: u.accountStatus || 'active',
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
  });
});

/** Records that the owner has sent a partner their pending earnings by UPI, emptying the partner's wallet. */
export const markPayoutPaid = asyncHandler(async (req, res) => {
  const { creatorId, reference, note } = req.body;
  const creator = await User.findOne({ _id: creatorId, role: ROLES.CREATOR });
  if (!creator) throw ApiError.notFound('Partner not found');

  const bookings = await Booking.find({ creator: creator._id, ...UNSETTLED }).select('_id creatorPayout');
  if (bookings.length === 0) throw ApiError.conflict(`${creator.name} has no pending earnings to pay`);

  const now = new Date();
  const payout = await Payout.create({
    creator: creator._id,
    creatorSnapshot: { name: creator.name, phone: creator.phone, upiId: creator.creatorProfile?.upiId || '' },
    amount: round2(bookings.reduce((n, b) => n + b.creatorPayout, 0)),
    bookings: bookings.map((b) => b._id),
    bookingCount: bookings.length,
    reference,
    note,
    paidAt: now,
  });

  await Booking.updateMany(
    { _id: { $in: payout.bookings }, ...UNSETTLED },
    { $set: { 'settlement.status': SETTLEMENT_STATUS.PAID, 'settlement.payout': payout._id, 'settlement.paidAt': now } }
  );

  // Another request may have settled some of these bookings first; keep the payout record honest.
  const settled = await Booking.find({ 'settlement.payout': payout._id }).select('_id creatorPayout');
  if (settled.length === 0) {
    await payout.deleteOne();
    throw ApiError.conflict('These earnings were already marked as paid');
  }
  if (settled.length !== payout.bookingCount) {
    payout.bookings = settled.map((b) => b._id);
    payout.bookingCount = settled.length;
    payout.amount = round2(settled.reduce((n, b) => n + b.creatorPayout, 0));
    await payout.save();
  }

  notifyUser(creator._id, SOCKET_EVENTS.WALLET_PAYOUT, {
    amount: payout.amount,
    bookingCount: payout.bookingCount,
    reference: payout.reference,
  });
  notifyAdmins(ADMIN_EVENTS.PAYOUT_PAID, { creatorId: creator._id.toString(), amount: payout.amount });

  res.status(201).json({ success: true, payout: serializePayout(payout) });
});
