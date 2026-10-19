import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { ApiError } from '../common/api-error.js';
import type { VerifyPaymentInput } from '../common/validation.js';
import { env } from '../config/env.js';
import { BOOKING_EVENTS } from '../constants/events.js';
import { PAYMENT_STATUS, SETTLEMENT_STATUS } from '../constants/roles.js';
import { type Booking, bookings } from '../database/schema.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { BookingsRepository } from '../repositories/bookings.repository.js';
import { RazorpayService, type RazorpayPayment, toPaise } from './razorpay.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const bookingNotes = (booking: Booking) => ({ bookingId: booking.id, code: booking.code });

export const isPaymentDue = (booking: Booking) => booking.paymentStatus === PAYMENT_STATUS.DUE;

type PaidVia = 'app' | 'qr';

function assertDue(booking: Booking) {
  if (booking.paymentStatus === PAYMENT_STATUS.PAID) {
    throw ApiError.conflict('This shoot is already paid. Thank you!');
  }
  if (!isPaymentDue(booking)) {
    throw ApiError.conflict('Payment opens once the shoot is marked completed');
  }
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly bookings: BookingsRepository,
    private readonly razorpay: RazorpayService,
    private readonly realtime: RealtimeGateway
  ) {}

  /**
   * Marks a booking as paid exactly once and starts the partner's payout hold.
   * A second, different payment for an already-paid booking (e.g. app + QR) is refunded automatically.
   */
  async finalizePayment(booking: Booking, payment: Pick<RazorpayPayment, 'id' | 'method'>, via: PaidVia) {
    const now = new Date();
    const updated = await this.bookings.update(
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
      const current = await this.bookings.findById(booking.id);
      const isDuplicate =
        current?.paymentStatus === PAYMENT_STATUS.PAID && current.paymentId && current.paymentId !== payment.id;
      if (current && isDuplicate) {
        try {
          await this.razorpay.refundPayment(payment.id, { reason: 'Duplicate payment', bookingCode: current.code });
          console.warn(`[payments] Refunded duplicate payment ${payment.id} for ${current.code}`);
        } catch (err) {
          console.error(
            `[payments] Could not refund duplicate payment ${payment.id} for ${current.code}: ${(err as Error).message}`
          );
        }
      }
      return current as Booking;
    }

    // Close the other collect channels so the customer cannot pay twice.
    if (updated.paymentLinkId) this.razorpay.cancelPaymentLink(updated.paymentLinkId).catch(() => {});
    if (updated.paymentQrId) this.razorpay.closeQrCode(updated.paymentQrId).catch(() => {});

    this.realtime.notifyBookingChange(updated, BOOKING_EVENTS.PAID);
    return updated;
  }

  private async findCapturedPayment(booking: Booking) {
    const expected = toPaise(booking.total);
    const { paymentOrderId: orderId, paymentLinkId: linkId, paymentQrId: qrId } = booking;

    if (orderId) {
      const { items = [] } = await this.razorpay.fetchOrderPayments(orderId);
      for (const p of items) {
        let payment = p;
        // eslint-disable-next-line no-await-in-loop
        if (payment.status === 'authorized') payment = await this.captureSafely(payment);
        if (payment.status === 'captured' && payment.amount >= expected) return { payment, via: 'app' as const };
      }
    }

    if (qrId) {
      const { items = [] } = await this.razorpay.fetchQrPayments(qrId);
      const paid = items.find((p) => p.status === 'captured' && p.amount >= expected);
      if (paid) return { payment: paid, via: 'qr' as const };
    }

    if (linkId) {
      const link = await this.razorpay.fetchPaymentLink(linkId);
      const paid = (link.payments || []).find((p) => p.status === 'captured' && p.amount >= expected);
      if (paid) return { payment: { id: paid.payment_id, method: paid.method, amount: paid.amount }, via: 'qr' as const };
    }

    return null;
  }

  private async captureSafely(payment: RazorpayPayment) {
    try {
      return await this.razorpay.capturePayment(payment.id, payment.amount);
    } catch {
      // Auto-capture may have won the race; trust the gateway's latest state.
      return this.razorpay.fetchPayment(payment.id);
    }
  }

  /** Asks Razorpay whether a due booking has been paid (used when no webhook reached us). */
  async syncPayment(booking: Booking): Promise<Booking> {
    if (!isPaymentDue(booking) || !this.razorpay.isConfigured()) return booking;
    if (!booking.paymentOrderId && !booking.paymentLinkId && !booking.paymentQrId) return booking;

    const found = await this.findCapturedPayment(booking);
    return found ? this.finalizePayment(booking, found.payment, found.via) : booking;
  }

  /** Same as syncPayment but never throws, for read endpoints that must keep working if Razorpay is down. */
  async syncPaymentQuietly(booking: Booking): Promise<Booking> {
    try {
      return await this.syncPayment(booking);
    } catch (err) {
      console.error(`[payments] Sync failed for ${booking.code}: ${(err as Error).message}`);
      return booking;
    }
  }

  async createCheckout(booking: Booking) {
    assertDue(booking);
    const synced = await this.syncPayment(booking);
    assertDue(synced);

    let orderId = synced.paymentOrderId;
    if (!orderId) {
      const order = await this.razorpay.createOrder({
        amount: synced.total,
        receipt: synced.code,
        notes: bookingNotes(synced),
      });
      const saved = await this.bookings.update(and(eq(bookings.id, synced.id), isNull(bookings.paymentOrderId)), {
        paymentOrderId: order.id,
      });
      orderId = saved ? order.id : (await this.bookings.findById(synced.id))?.paymentOrderId ?? null;
    }

    return {
      keyId: env.razorpay.keyId,
      orderId,
      amount: toPaise(synced.total),
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

  async verifyCheckout(booking: Booking, { orderId, paymentId, signature }: VerifyPaymentInput) {
    if (!booking.paymentOrderId || orderId !== booking.paymentOrderId) {
      throw ApiError.badRequest('This payment does not belong to this booking');
    }
    if (!this.razorpay.isCheckoutSignatureValid({ orderId, paymentId, signature })) {
      throw ApiError.badRequest('Payment verification failed. If money was deducted, it will be refunded automatically.');
    }

    let payment = await this.razorpay.fetchPayment(paymentId);
    if (payment.order_id !== orderId) throw ApiError.badRequest('This payment does not belong to this booking');
    if (payment.status === 'authorized') payment = await this.captureSafely(payment);
    if (payment.status !== 'captured' || payment.amount < toPaise(booking.total)) {
      throw new ApiError(402, 'Payment is not complete yet. Please try again in a moment.');
    }

    return this.finalizePayment(booking, payment, 'app');
  }

  /**
   * Partner collect at venue:
   * - `url` = Razorpay payment link (WhatsApp / Copy link — unchanged)
   * - `upi` = native UPI payload for the on-screen QR (PhonePe/GPay open pay screen directly)
   */
  async getCollectLink(booking: Booking) {
    assertDue(booking);
    const synced = await this.syncPayment(booking);
    assertDue(synced);

    const share = await this.ensurePaymentLink(synced);
    const upiQr = await this.ensureUpiQr(share.booking);
    return {
      linkId: share.linkId,
      url: share.url,
      upi: upiQr?.upi || undefined,
      qrImageUrl: upiQr?.imageUrl || undefined,
    };
  }

  private async ensurePaymentLink(booking: Booking) {
    if (booking.paymentLinkId && booking.paymentLinkUrl) {
      return { booking, linkId: booking.paymentLinkId, url: booking.paymentLinkUrl };
    }

    const link = await this.razorpay.createPaymentLink({
      amount: toPaise(booking.total),
      currency: 'INR',
      accept_partial: false,
      description: `SnapNear ${booking.code} • ${booking.serviceLabel} (${booking.durationLabel})`,
      reference_id: `${booking.code}-${Date.now().toString(36)}`,
      customer: {
        name: booking.clientName || booking.contactName,
        contact: `+91${booking.contactPhone}`,
        ...(booking.clientEmail ? { email: booking.clientEmail } : {}),
      },
      notify: { sms: false, email: false },
      reminder_enable: false,
      notes: bookingNotes(booking),
    });

    const saved = await this.bookings.update(and(eq(bookings.id, booking.id), isNull(bookings.paymentLinkId)), {
      paymentLinkId: link.id,
      paymentLinkUrl: link.short_url,
    });
    if (!saved) {
      this.razorpay.cancelPaymentLink(link.id).catch(() => {});
      const current = await this.bookings.findById(booking.id);
      return {
        booking: current || booking,
        linkId: current?.paymentLinkId || link.id,
        url: current?.paymentLinkUrl || link.short_url,
      };
    }
    return { booking: saved, linkId: link.id, url: link.short_url };
  }

  /** Best-effort: if Razorpay UPI QR is not enabled on the account, partners still get the payment-link QR. */
  private async ensureUpiQr(booking: Booking): Promise<{ upi: string; imageUrl: string } | null> {
    if (booking.paymentQrId && booking.paymentQrUpi) {
      return { upi: booking.paymentQrUpi, imageUrl: '' };
    }

    // Re-fetch payload if we already created a QR but UPI string was missing (feature flag lag).
    if (booking.paymentQrId && !booking.paymentQrUpi) {
      try {
        const existing = await this.razorpay.fetchQrCode(booking.paymentQrId);
        if (existing.image_content) {
          await this.bookings.update(eq(bookings.id, booking.id), { paymentQrUpi: existing.image_content });
          return { upi: existing.image_content, imageUrl: existing.image_url || '' };
        }
        if (existing.image_url) return { upi: '', imageUrl: existing.image_url };
      } catch (err) {
        console.error(`[payments] Fetch UPI QR failed for ${booking.code}: ${(err as Error).message}`);
      }
    }

    try {
      const closeBy = Math.floor(Date.now() / 1000) + 2 * 60 * 60; // single_use max ~2h
      const qr = await this.razorpay.createQrCode({
        type: 'upi_qr',
        name: 'SnapNear',
        usage: 'single_use',
        fixed_amount: true,
        payment_amount: toPaise(booking.total),
        description: `SnapNear ${booking.code} • ${booking.serviceLabel}`,
        close_by: closeBy,
        notes: bookingNotes(booking),
      });

      const upi = qr.image_content || '';
      const saved = await this.bookings.update(and(eq(bookings.id, booking.id), isNull(bookings.paymentQrId)), {
        paymentQrId: qr.id,
        paymentQrUpi: upi,
      });
      if (!saved) {
        this.razorpay.closeQrCode(qr.id).catch(() => {});
        const current = await this.bookings.findById(booking.id);
        if (current?.paymentQrUpi) return { upi: current.paymentQrUpi, imageUrl: qr.image_url || '' };
        return qr.image_content || qr.image_url
          ? { upi: qr.image_content || '', imageUrl: qr.image_url || '' }
          : null;
      }
      return { upi, imageUrl: qr.image_url || '' };
    } catch (err) {
      console.error(`[payments] UPI QR create failed for ${booking.code}: ${(err as Error).message}`);
      return null;
    }
  }
}
