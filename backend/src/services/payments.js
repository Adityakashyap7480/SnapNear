import { and, eq, isNull } from 'drizzle-orm';
import env from '../config/env.js';
import { bookings } from '../db/schema.js';
import { findBookingById, updateBooking } from '../models/bookings.js';
import ApiError from '../utils/ApiError.js';
import { PAYMENT_STATUS, SETTLEMENT_STATUS } from '../constants/roles.js';
import { BOOKING_EVENTS } from '../constants/events.js';
import { notifyBookingChange } from '../socket/index.js';
import * as razorpay from './razorpay.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const bookingNotes = (booking) => ({ bookingId: booking.id, code: booking.code });

export const isPaymentDue = (booking) => booking.paymentStatus === PAYMENT_STATUS.DUE;

function assertDue(booking) {
  if (booking.paymentStatus === PAYMENT_STATUS.PAID) {
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
  const updated = await updateBooking(
    and(eq(bookings.id, booking.id), eq(bookings.paymentStatus, PAYMENT_STATUS.DUE)),
    {
      paymentStatus: PAYMENT_STATUS.PAID,
      paymentId: payment.id,
      paymentMethod: payment.method || '',
      paymentVia: via,
      paidAt: now,
      settlementStatus: SETTLEMENT_STATUS.PENDING,
      settlementEligibleAt: new Date(now.getTime() + env.payoutHoldDays * DAY_MS),
    }
  );

  if (!updated) {
    const current = await findBookingById(booking.id);
    const isDuplicate =
      current?.paymentStatus === PAYMENT_STATUS.PAID && current.paymentId && current.paymentId !== payment.id;
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

  if (via === 'app' && updated.paymentLinkId) {
    razorpay.cancelPaymentLink(updated.paymentLinkId).catch(() => {});
  }

  notifyBookingChange(updated, BOOKING_EVENTS.PAID);
  return updated;
}

async function findCapturedPayment(booking) {
  const expected = razorpay.toPaise(booking.total);
  const { paymentOrderId: orderId, paymentLinkId: linkId } = booking;

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
  if (!booking.paymentOrderId && !booking.paymentLinkId) return booking;

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

  let orderId = synced.paymentOrderId;
  if (!orderId) {
    const order = await razorpay.createOrder({ amount: synced.total, receipt: synced.code, notes: bookingNotes(synced) });
    const saved = await updateBooking(and(eq(bookings.id, synced.id), isNull(bookings.paymentOrderId)), {
      paymentOrderId: order.id,
    });
    orderId = saved ? order.id : (await findBookingById(synced.id)).paymentOrderId;
  }

  return {
    keyId: env.razorpay.keyId,
    orderId,
    amount: razorpay.toPaise(synced.total),
    currency: 'INR',
    name: 'SnapNear',
    description: `${synced.code} • ${synced.serviceLabel} (${synced.durationLabel})`,
    prefill: {
      name: synced.clientName || synced.contactName,
      email: synced.clientEmail || '',
      contact: synced.contactPhone || synced.clientPhone || '',
    },
    notes: bookingNotes(synced),
  };
}

export async function verifyCheckout(booking, { orderId, paymentId, signature }) {
  if (!booking.paymentOrderId || orderId !== booking.paymentOrderId) {
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

  if (synced.paymentLinkId && synced.paymentLinkUrl) {
    return { linkId: synced.paymentLinkId, url: synced.paymentLinkUrl };
  }

  const link = await razorpay.createPaymentLink({
    amount: razorpay.toPaise(synced.total),
    currency: 'INR',
    accept_partial: false,
    description: `SnapNear ${synced.code} • ${synced.serviceLabel} (${synced.durationLabel})`,
    reference_id: `${synced.code}-${Date.now().toString(36)}`,
    customer: {
      name: synced.clientName || synced.contactName,
      contact: `+91${synced.contactPhone}`,
      ...(synced.clientEmail ? { email: synced.clientEmail } : {}),
    },
    notify: { sms: false, email: false },
    reminder_enable: false,
    notes: bookingNotes(synced),
  });

  const saved = await updateBooking(and(eq(bookings.id, synced.id), isNull(bookings.paymentLinkId)), {
    paymentLinkId: link.id,
    paymentLinkUrl: link.short_url,
  });
  if (!saved) {
    razorpay.cancelPaymentLink(link.id).catch(() => {});
    const current = await findBookingById(synced.id);
    return { linkId: current.paymentLinkId, url: current.paymentLinkUrl };
  }
  return { linkId: link.id, url: link.short_url };
}
