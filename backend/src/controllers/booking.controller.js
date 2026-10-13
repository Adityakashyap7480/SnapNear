import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateBookingCode } from '../utils/bookingCode.js';
import { serializeBooking } from '../utils/serializers.js';
import { getQuote } from '../constants/pricing.js';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../constants/roles.js';
import { BOOKING_EVENTS } from '../constants/events.js';
import { notifyBookingChange } from '../socket/index.js';
import { isPaymentDue, syncPaymentQuietly } from '../services/payments.js';
import { newStartOtp, shootMinutesFor } from '../services/shootOtp.js';

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

  const unpaid = await Booking.findOne({ client: client._id, 'payment.status': PAYMENT_STATUS.DUE }).select('code total');
  if (unpaid) {
    throw ApiError.conflict(
      `Please pay ₹${unpaid.total.toLocaleString('en-IN')} for your completed shoot ${unpaid.code} before booking a new one.`
    );
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
    durationMinutes: shootMinutesFor(quote),
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

  notifyBookingChange(booking, BOOKING_EVENTS.CREATED);

  res.status(201).json({ success: true, booking: serializeBooking(booking) });
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ client: req.user.doc._id })
    .select('+startOtp.code')
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('creator', CREATOR_FIELDS);

  const synced = await Promise.all(
    bookings.map(async (b) => {
      // A partner who arrived before OTPs existed still needs one to start
      if (b.status === BOOKING_STATUS.ARRIVED && !b.startOtp?.code) {
        b.startOtp = newStartOtp();
        await b.save();
        return b;
      }
      // Catch QR / link payments that completed while nobody was watching
      if (!isPaymentDue(b) || (!b.payment.orderId && !b.payment.linkId)) return b;
      const fresh = await syncPaymentQuietly(b);
      return fresh === b ? b : fresh.populate('creator', CREATOR_FIELDS);
    })
  );

  res.json({ success: true, bookings: synced.map((b) => serializeBooking(b, { includeStartOtp: true })) });
});

/** Issues a fresh start OTP, e.g. after the partner typed the old one wrong too many times. */
export const refreshStartOtp = asyncHandler(async (req, res) => {
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.id, client: req.user.doc._id, status: BOOKING_STATUS.ARRIVED },
    { startOtp: newStartOtp() },
    { new: true }
  )
    .select('+startOtp.code')
    .populate('creator', CREATOR_FIELDS);

  if (!booking) throw ApiError.conflict('A new OTP is available only after your photographer arrives');
  res.json({ success: true, booking: serializeBooking(booking, { includeStartOtp: true }) });
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

  notifyBookingChange(booking, BOOKING_EVENTS.CANCELLED);
  res.json({ success: true, booking: serializeBooking(booking) });
});
