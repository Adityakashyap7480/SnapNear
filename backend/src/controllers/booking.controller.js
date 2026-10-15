import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { bookings } from '../db/schema.js';
import { findBooking, updateBooking, withCreator, withCreators } from '../models/bookings.js';
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
const OPEN_STATUSES = [BOOKING_STATUS.SEARCHING, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.ARRIVED, BOOKING_STATUS.SHOOTING];

const ownBooking = (req) => and(eq(bookings.id, req.params.id), eq(bookings.clientId, req.user.doc.id));

export const createBooking = asyncHandler(async (req, res) => {
  const client = req.user.doc;
  const data = req.body;

  const quote = getQuote(data.serviceType, data.durationId);
  if (!quote) throw ApiError.badRequest('Invalid service or duration');

  const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  if (data.shootDate < todayIST) {
    throw ApiError.badRequest('Shoot date cannot be in the past');
  }

  const unpaid = await findBooking(and(eq(bookings.clientId, client.id), eq(bookings.paymentStatus, PAYMENT_STATUS.DUE)));
  if (unpaid) {
    throw ApiError.conflict(
      `Please pay ₹${unpaid.total.toLocaleString('en-IN')} for your completed shoot ${unpaid.code} before booking a new one.`
    );
  }

  const openCount = await db.$count(bookings, and(eq(bookings.clientId, client.id), inArray(bookings.status, OPEN_STATUSES)));
  if (openCount >= MAX_OPEN_BOOKINGS) {
    throw ApiError.conflict(`You can have at most ${MAX_OPEN_BOOKINGS} active bookings at a time`);
  }

  const [booking] = await db
    .insert(bookings)
    .values({
      code: await generateBookingCode(),
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      clientEmail: client.email,
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
    })
    .returning();

  notifyBookingChange(booking, BOOKING_EVENTS.CREATED);

  res.status(201).json({ success: true, booking: serializeBooking(booking) });
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const list = await db
    .select()
    .from(bookings)
    .where(eq(bookings.clientId, req.user.doc.id))
    .orderBy(desc(bookings.createdAt))
    .limit(50);

  const synced = await Promise.all(
    list.map(async (b) => {
      // A partner who arrived before OTPs existed still needs one to start
      if (b.status === BOOKING_STATUS.ARRIVED && !b.startOtpCode) {
        return (await updateBooking(eq(bookings.id, b.id), newStartOtp())) || b;
      }
      // Catch QR / link payments that completed while nobody was watching
      if (!isPaymentDue(b) || (!b.paymentOrderId && !b.paymentLinkId)) return b;
      return syncPaymentQuietly(b);
    })
  );

  const withPartners = await withCreators(synced);
  res.json({ success: true, bookings: withPartners.map((b) => serializeBooking(b, { includeStartOtp: true })) });
});

/** Issues a fresh start OTP, e.g. after the partner typed the old one wrong too many times. */
export const refreshStartOtp = asyncHandler(async (req, res) => {
  const booking = await updateBooking(and(ownBooking(req), eq(bookings.status, BOOKING_STATUS.ARRIVED)), newStartOtp());

  if (!booking) throw ApiError.conflict('A new OTP is available only after your photographer arrives');
  res.json({ success: true, booking: serializeBooking(await withCreator(booking), { includeStartOtp: true }) });
});

export const cancelMyBooking = asyncHandler(async (req, res) => {
  const booking = await updateBooking(
    and(ownBooking(req), inArray(bookings.status, [BOOKING_STATUS.SEARCHING, BOOKING_STATUS.ASSIGNED])),
    { status: BOOKING_STATUS.CANCELLED, cancelledAt: new Date(), cancelledBy: 'client' }
  );

  if (!booking) {
    throw ApiError.conflict('This booking can no longer be cancelled');
  }

  const withPartner = await withCreator(booking);
  notifyBookingChange(withPartner, BOOKING_EVENTS.CANCELLED);
  res.json({ success: true, booking: serializeBooking(withPartner) });
});
