import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateBookingCode } from '../utils/bookingCode.js';
import { serializeBooking } from '../utils/serializers.js';
import { getQuote } from '../constants/pricing.js';
import { BOOKING_STATUS } from '../constants/roles.js';
import { notifyBookingChange } from '../socket/index.js';

const MAX_OPEN_BOOKINGS = 3;
const CREATOR_FIELDS = 'name phone email creatorProfile';

export const createBooking = asyncHandler(async (req, res) => {
  const client = req.user.doc;
  const data = req.body;

  const quote = getQuote(data.serviceType, data.durationId);
  if (!quote) throw ApiError.badRequest('Invalid service or duration');

  const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  if (data.shootDate < todayIST) {
    throw ApiError.badRequest('Shoot date cannot be in the past');
  }

  const openCount = await Booking.countDocuments({
    client: client._id,
    status: { $in: [BOOKING_STATUS.SEARCHING, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.ARRIVED, BOOKING_STATUS.SHOOTING] },
  });
  if (openCount >= MAX_OPEN_BOOKINGS) {
    throw ApiError.conflict(`You can have at most ${MAX_OPEN_BOOKINGS} active bookings at a time`);
  }

  const booking = await Booking.create({
    code: await generateBookingCode(),
    client: client._id,
    clientSnapshot: { name: client.name, phone: client.phone, email: client.email },
    serviceType: quote.serviceType,
    serviceLabel: quote.serviceLabel,
    durationId: quote.durationId,
    durationLabel: quote.durationLabel,
    occasion: data.occasion,
    shootDate: data.shootDate,
    timeSlot: data.timeSlot,
    address: data.address,
    contactName: data.contactName,
    contactPhone: data.contactPhone,
    notes: data.notes,
    total: quote.total,
    creatorPayout: quote.creatorPayout,
    platformFee: quote.platformFee,
  });

  notifyBookingChange(booking, 'booking:created');

  res.status(201).json({ success: true, booking: serializeBooking(booking) });
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ client: req.user.doc._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('creator', CREATOR_FIELDS);

  res.json({ success: true, bookings: bookings.map((b) => serializeBooking(b)) });
});

export const cancelMyBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOneAndUpdate(
    {
      _id: req.params.id,
      client: req.user.doc._id,
      status: { $in: [BOOKING_STATUS.SEARCHING, BOOKING_STATUS.ASSIGNED] },
    },
    { status: BOOKING_STATUS.CANCELLED, cancelledAt: new Date(), cancelledBy: 'client' },
    { new: true }
  ).populate('creator', CREATOR_FIELDS);

  if (!booking) {
    throw ApiError.conflict('This booking can no longer be cancelled');
  }

  notifyBookingChange(booking, 'booking:cancelled');
  res.json({ success: true, booking: serializeBooking(booking) });
});
