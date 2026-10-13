import env from '../config/env.js';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import { PAYMENT_STATUS, SETTLEMENT_STATUS } from '../constants/roles.js';
import { BOOKING_EVENTS } from '../constants/events.js';
import { notifyBookingChange } from '../socket/index.js';
import * as razorpay from './razorpay.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const bookingNotes = (booking) => ({ bookingId: booking._id.toString(), code: booking.code });

export const isPaymentDue = (booking) => booking.payment?.status === PAYMENT_STATUS.DUE;

function assertDue(booking) {
  if (booking.payment?.status === PAYMENT_STATUS.PAID) {
    throw ApiError.conflict('This shoot is already paid. Thank you!');
  }
  if (!isPaymentDue(booking)) {
    throw ApiError.conflict('Payment opens once the shoot is marked completed');
  }
}

/**
 * Marks a booking as paid exactly once and starts the partner's payout hold.
 * A second, different payment for an already-paid booking (e.g. app + QR) is refunded automatically.
 */
export async function finalizePayment(booking, payment, via) {
  const now = new Date();
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, 'payment.status': PAYMENT_STATUS.DUE },
    {
      $set: {
        'payment.status': PAYMENT_STATUS.PAID,
        'payment.paymentId': payment.id,
        'payment.method': payment.method || '',
        'payment.via': via,
        'payment.paidAt': now,
        'settlement.status': SETTLEMENT_STATUS.PENDING,
        'settlement.eligibleAt': new Date(now.getTime() + env.payoutHoldDays * DAY_MS),
      },
    },
    { new: true }
  );

  if (!updated) {
    const current = await Booking.findById(booking._id);
    const isDuplicate =
      current?.payment?.status === PAYMENT_STATUS.PAID && current.payment.paymentId && current.payment.paymentId !== payment.id;
    if (isDuplicate) {
      try {
        await razorpay.refundPayment(payment.id, { reason: 'Duplicate payment', bookingCode: current.code });
        console.warn(`[payments] Refunded duplicate payment ${payment.id} for ${current.code}`);
      } catch (err) {
        console.error(`[payments] Could not refund duplicate payment ${payment.id} for ${current.code}: ${err.message}`);
      }
    }
    return current;
  }

  if (via === 'app' && updated.payment.linkId) {
    razorpay.cancelPaymentLink(updated.payment.linkId).catch(() => {});
  }

  notifyBookingChange(updated, BOOKING_EVENTS.PAID);
  return updated;
}

async function findCapturedPayment(booking) {
  const expected = razorpay.toPaise(booking.total);
  const { orderId, linkId } = booking.payment;

  if (orderId) {
    const { items = [] } = await razorpay.fetchOrderPayments(orderId);
    for (const p of items) {
      let payment = p;
      if (payment.status === 'authorized') payment = await captureSafely(payment);
      if (payment.status === 'captured' && payment.amount >= expected) return { payment, via: 'app' };
    }
  }

  if (linkId) {
    const link = await razorpay.fetchPaymentLink(linkId);
    const paid = (link.payments || []).find((p) => p.status === 'captured' && p.amount >= expected);
    if (paid) return { payment: { id: paid.payment_id, method: paid.method, amount: paid.amount }, via: 'qr' };
  }

  return null;
}

async function captureSafely(payment) {
  try {
    return await razorpay.capturePayment(payment.id, payment.amount);
  } catch {
    // Auto-capture may have won the race; trust the gateway's latest state.
    return razorpay.fetchPayment(payment.id);
  }
}

/** Asks Razorpay whether a due booking has been paid (used when no webhook reached us). */
export async function syncPayment(booking) {
  if (!isPaymentDue(booking) || !razorpay.isRazorpayConfigured()) return booking;
  if (!booking.payment.orderId && !booking.payment.linkId) return booking;

  const found = await findCapturedPayment(booking);
  return found ? finalizePayment(booking, found.payment, found.via) : booking;
}

/** Same as syncPayment but never throws, for read endpoints that must keep working if Razorpay is down. */
export async function syncPaymentQuietly(booking) {
  try {
    return await syncPayment(booking);
  } catch (err) {
    console.error(`[payments] Sync failed for ${booking.code}: ${err.message}`);
    return booking;
  }
}

export async function createCheckout(booking) {
  assertDue(booking);
  const synced = await syncPayment(booking);
  assertDue(synced);

  let orderId = synced.payment.orderId;
  if (!orderId) {
    const order = await razorpay.createOrder({ amount: synced.total, receipt: synced.code, notes: bookingNotes(synced) });
    const saved = await Booking.findOneAndUpdate(
      { _id: synced._id, 'payment.orderId': { $exists: false } },
      { $set: { 'payment.orderId': order.id } },
      { new: true }
    );
    orderId = saved ? order.id : (await Booking.findById(synced._id)).payment.orderId;
  }

  return {
    keyId: env.razorpay.keyId,
    orderId,
    amount: razorpay.toPaise(synced.total),
    currency: 'INR',
    name: 'SnapNear',
    description: `${synced.code} • ${synced.serviceLabel} (${synced.durationLabel})`,
    prefill: {
      name: synced.clientSnapshot?.name || synced.contactName,
      email: synced.clientSnapshot?.email || '',
      contact: synced.contactPhone || synced.clientSnapshot?.phone || '',
    },
    notes: bookingNotes(synced),
  };
}

export async function verifyCheckout(booking, { orderId, paymentId, signature }) {
  if (!booking.payment?.orderId || orderId !== booking.payment.orderId) {
    throw ApiError.badRequest('This payment does not belong to this booking');
  }
  if (!razorpay.isCheckoutSignatureValid({ orderId, paymentId, signature })) {
    throw ApiError.badRequest('Payment verification failed. If money was deducted, it will be refunded automatically.');
  }

  let payment = await razorpay.fetchPayment(paymentId);
  if (payment.order_id !== orderId) throw ApiError.badRequest('This payment does not belong to this booking');
  if (payment.status === 'authorized') payment = await captureSafely(payment);
  if (payment.status !== 'captured' || payment.amount < razorpay.toPaise(booking.total)) {
    throw new ApiError(402, 'Payment is not complete yet. Please try again in a moment.');
  }

  return finalizePayment(booking, payment, 'app');
}

/** Hosted Razorpay payment page the partner shows as a QR code at the venue. */
export async function getCollectLink(booking) {
  assertDue(booking);
  const synced = await syncPayment(booking);
  assertDue(synced);

  if (synced.payment.linkId && synced.payment.linkUrl) {
    return { linkId: synced.payment.linkId, url: synced.payment.linkUrl };
  }

  const link = await razorpay.createPaymentLink({
    amount: razorpay.toPaise(synced.total),
    currency: 'INR',
    accept_partial: false,
    description: `SnapNear ${synced.code} • ${synced.serviceLabel} (${synced.durationLabel})`,
    reference_id: `${synced.code}-${Date.now().toString(36)}`,
    customer: {
      name: synced.clientSnapshot?.name || synced.contactName,
      contact: `+91${synced.contactPhone}`,
      ...(synced.clientSnapshot?.email ? { email: synced.clientSnapshot.email } : {}),
    },
    notify: { sms: false, email: false },
    reminder_enable: false,
    notes: bookingNotes(synced),
  });

  const saved = await Booking.findOneAndUpdate(
    { _id: synced._id, 'payment.linkId': { $exists: false } },
    { $set: { 'payment.linkId': link.id, 'payment.linkUrl': link.short_url } },
    { new: true }
  );
  if (!saved) {
    razorpay.cancelPaymentLink(link.id).catch(() => {});
    const current = await Booking.findById(synced._id);
    return { linkId: current.payment.linkId, url: current.payment.linkUrl };
  }
  return { linkId: link.id, url: link.short_url };
}
