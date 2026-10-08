import Booking from '../models/Booking.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { serializeBooking } from '../utils/serializers.js';
import { ACCOUNT_STATUS, ACTIVE_JOB_STATUSES, BOOKING_STATUS, ROLES } from '../constants/roles.js';
import { forceLogout, notifyAdmins, notifyBookingChange } from '../socket/index.js';
import { accountNotice } from '../utils/accountStatus.js';

const accountFields = (u) => ({
  accountStatus: u.accountStatus || ACCOUNT_STATUS.ACTIVE,
  statusReason: u.statusReason || '',
  statusChangedAt: u.statusChangedAt || null,
});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const daysAgo = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

export const getOverview = asyncHandler(async (_req, res) => {
  const [completedAgg, statusAgg, todayAgg, dailyAgg, clients, creators, onlineCreators] = await Promise.all([
    Booking.aggregate([
      { $match: { status: BOOKING_STATUS.COMPLETED } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          gross: { $sum: '$total' },
          creatorTotal: { $sum: '$creatorPayout' },
          platformTotal: { $sum: '$platformFee' },
        },
      },
    ]),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$total' } } }]),
    Booking.aggregate([
      { $match: { status: BOOKING_STATUS.COMPLETED, completedAt: { $gte: daysAgo(0) } } },
      { $group: { _id: null, gross: { $sum: '$total' }, platform: { $sum: '$platformFee' }, count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { status: BOOKING_STATUS.COMPLETED, completedAt: { $gte: daysAgo(6) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: '+05:30' } },
          gross: { $sum: '$total' },
          platform: { $sum: '$platformFee' },
          count: { $sum: 1 },
        },
      },
    ]),
    User.countDocuments({ role: ROLES.CLIENT }),
    User.countDocuments({ role: ROLES.CREATOR }),
    User.countDocuments({ role: ROLES.CREATOR, 'creatorProfile.isOnline': true }),
  ]);

  const byStatus = Object.fromEntries(Object.values(BOOKING_STATUS).map((s) => [s, { count: 0, value: 0 }]));
  statusAgg.forEach((s) => {
    byStatus[s._id] = { count: s.count, value: s.value };
  });

  const pipeline = [BOOKING_STATUS.SEARCHING, ...ACTIVE_JOB_STATUSES].reduce(
    (acc, s) => ({ count: acc.count + byStatus[s].count, value: acc.value + byStatus[s].value }),
    { count: 0, value: 0 }
  );

  const dailyMap = Object.fromEntries(dailyAgg.map((d) => [d._id, d]));
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = daysAgo(6 - i);
    const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date);
    const row = dailyMap[key];
    return { date: key, gross: row?.gross || 0, platform: row?.platform || 0, count: row?.count || 0 };
  });

  const completed = completedAgg[0] || {};
  res.json({
    success: true,
    overview: {
      gross: completed.gross || 0,
      creatorTotal: completed.creatorTotal || 0,
      platformTotal: completed.platformTotal || 0,
      completedCount: completed.count || 0,
      today: { gross: todayAgg[0]?.gross || 0, platform: todayAgg[0]?.platform || 0, count: todayAgg[0]?.count || 0 },
      pipeline,
      byStatus,
      totalBookings: statusAgg.reduce((n, s) => n + s.count, 0),
      users: { clients, creators, onlineCreators },
      last7Days,
    },
  });
});

export const listBookings = asyncHandler(async (req, res) => {
  const { status, q, page, limit } = req.validatedQuery;

  const filter = {};
  if (status === 'active') filter.status = { $in: [BOOKING_STATUS.SEARCHING, ...ACTIVE_JOB_STATUSES] };
  else if (status !== 'all') filter.status = status;

  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [
      { code: rx },
      { contactName: rx },
      { contactPhone: rx },
      { 'clientSnapshot.name': rx },
      { 'clientSnapshot.email': rx },
      { 'creatorSnapshot.name': rx },
      { address: rx },
    ];
  }

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('creator', 'name phone email creatorProfile'),
    Booking.countDocuments(filter),
  ]);

  res.json({
    success: true,
    bookings: items.map((b) => serializeBooking(b)),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});

export const listClients = asyncHandler(async (_req, res) => {
  const [clients, stats] = await Promise.all([
    User.find({ role: ROLES.CLIENT }).sort({ createdAt: -1 }).lean(),
    Booking.aggregate([
      {
        $group: {
          _id: '$client',
          bookings: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', BOOKING_STATUS.COMPLETED] }, 1, 0] } },
          active: {
            $sum: {
              $cond: [{ $in: ['$status', [BOOKING_STATUS.SEARCHING, ...ACTIVE_JOB_STATUSES]] }, 1, 0],
            },
          },
          spent: { $sum: { $cond: [{ $eq: ['$status', BOOKING_STATUS.COMPLETED] }, '$total', 0] } },
          lastBookingAt: { $max: '$createdAt' },
        },
      },
    ]),
  ]);

  const statMap = Object.fromEntries(stats.map((s) => [s._id.toString(), s]));
  res.json({
    success: true,
    clients: clients.map((c) => {
      const s = statMap[c._id.toString()] || {};
      return {
        id: c._id.toString(),
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
    User.find({ role: ROLES.CREATOR }).sort({ createdAt: -1 }).lean(),
    Booking.aggregate([
      { $match: { creator: { $ne: null } } },
      {
        $group: {
          _id: '$creator',
          accepted: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', BOOKING_STATUS.COMPLETED] }, 1, 0] } },
          active: { $sum: { $cond: [{ $in: ['$status', ACTIVE_JOB_STATUSES] }, 1, 0] } },
          earnings: { $sum: { $cond: [{ $eq: ['$status', BOOKING_STATUS.COMPLETED] }, '$creatorPayout', 0] } },
          platformFee: { $sum: { $cond: [{ $eq: ['$status', BOOKING_STATUS.COMPLETED] }, '$platformFee', 0] } },
        },
      },
    ]),
  ]);

  const statMap = Object.fromEntries(stats.map((s) => [s._id.toString(), s]));
  res.json({
    success: true,
    creators: creators.map((c) => {
      const s = statMap[c._id.toString()] || {};
      return {
        id: c._id.toString(),
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
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.id, status: { $in: [BOOKING_STATUS.SEARCHING, ...ACTIVE_JOB_STATUSES] } },
    { status: BOOKING_STATUS.CANCELLED, cancelledAt: new Date(), cancelledBy: 'superadmin' },
    { new: true }
  );
  if (!booking) throw ApiError.conflict('Only open or in-progress bookings can be cancelled');

  notifyBookingChange(booking, 'booking:cancelled');
  res.json({ success: true, booking: serializeBooking(booking) });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  user.accountStatus = status;
  user.statusReason = status === ACCOUNT_STATUS.ACTIVE ? '' : reason;
  user.statusChangedAt = new Date();
  if (status !== ACCOUNT_STATUS.ACTIVE && user.role === ROLES.CREATOR) {
    user.creatorProfile.isOnline = false;
  }
  await user.save();

  let cancelledRequests = 0;
  if (status !== ACCOUNT_STATUS.ACTIVE) {
    // Open requests from a restricted customer must not reach partners anymore
    if (user.role === ROLES.CLIENT) {
      const open = await Booking.find({ client: user._id, status: BOOKING_STATUS.SEARCHING });
      await Promise.all(
        open.map(async (b) => {
          Object.assign(b, { status: BOOKING_STATUS.CANCELLED, cancelledAt: new Date(), cancelledBy: 'superadmin' });
          await b.save();
          notifyBookingChange(b, 'booking:cancelled');
        })
      );
      cancelledRequests = open.length;
    }
    forceLogout(user._id.toString(), accountNotice(user));
  }

  notifyAdmins('user:status', { userId: user._id.toString(), status });
  res.json({
    success: true,
    user: { id: user._id.toString(), name: user.name, role: user.role, ...accountFields(user) },
    cancelledRequests,
  });
});
