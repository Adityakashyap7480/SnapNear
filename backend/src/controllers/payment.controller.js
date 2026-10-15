import { and, eq } from 'drizzle-orm';
import { bookings } from '../db/schema.js';
import { findBooking, findBookingById, withCreator } from '../models/bookings.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { serializeBooking } from '../utils/serializers.js';
import { createCheckout, finalizePayment, getCollectLink, syncPayment, verifyCheckout } from '../services/payments.js';
import { isWebhookSignatureValid, toPaise } from '../services/razorpay.js';

async function findClientBooking(req) {
  const booking = await findBooking(and(eq(bookings.id, req.params.id), eq(bookings.clientId, req.user.doc.id)));
  if (!booking) throw ApiError.notFound('Booking not found');
  return booking;
}

async function findCreatorBooking(req) {
  const booking = await findBooking(and(eq(bookings.id, req.params.id), eq(bookings.creatorId, req.user.doc.id)));
  if (!booking) throw ApiError.notFound('Job not found');
  return booking;
}

const paymentResponse = async (booking) => ({ success: true, booking: serializeBooking(await withCreator(booking)) });

// ----- Customer -----

export const startCheckout = asyncHandler(async (req, res) => {
  const booking = await findClientBooking(req);
  const checkout = await createCheckout(booking);
  res.json({ success: true, checkout });
});

export const confirmCheckout = asyncHandler(async (req, res) => {
  const booking = await findClientBooking(req);
  const paid = await verifyCheckout(booking, req.body);
  res.json(await paymentResponse(paid));
});

export const clientPaymentStatus = asyncHandler(async (req, res) => {
  const booking = await syncPayment(await findClientBooking(req));
  res.json(await paymentResponse(booking));
});

// ----- Partner -----

export const collectLink = asyncHandler(async (req, res) => {
  const booking = await findCreatorBooking(req);
  const link = await getCollectLink(booking);
  res.json({ success: true, link: { url: link.url, amount: booking.total, code: booking.code } });
});

export const creatorPaymentStatus = asyncHandler(async (req, res) => {
  const booking = await syncPayment(await findCreatorBooking(req));
  res.json(await paymentResponse(booking));
});

// ----- Razorpay webhook (raw body) -----

const PAID_EVENTS = new Set(['payment.captured', 'order.paid', 'payment_link.paid']);

export const razorpayWebhook = asyncHandler(async (req, res) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
  if (!isWebhookSignatureValid(rawBody, req.get('x-razorpay-signature'))) {
    throw ApiError.badRequest('Invalid webhook signature');
  }

  const event = JSON.parse(rawBody.toString('utf8'));
  const payment = event.payload?.payment?.entity;
  if (!PAID_EVENTS.has(event.event) || payment?.status !== 'captured') {
    return res.json({ success: true, ignored: true });
  }

  const bookingId =
    event.payload?.payment_link?.entity?.notes?.bookingId ||
    event.payload?.order?.entity?.notes?.bookingId ||
    payment.notes?.bookingId;

  const booking =
    (typeof bookingId === 'string' && (await findBookingById(bookingId))) ||
    (payment.order_id && (await findBooking(eq(bookings.paymentOrderId, payment.order_id))));

  if (booking && booking.paymentStatus && payment.amount >= toPaise(booking.total)) {
    const via = payment.order_id && payment.order_id === booking.paymentOrderId ? 'app' : 'qr';
    await finalizePayment(booking, payment, via);
  }
  res.json({ success: true });
});
