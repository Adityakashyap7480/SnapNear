import crypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ApiError } from '../common/api-error.js';
import { env } from '../config/env.js';

const API_BASE = 'https://api.razorpay.com/v1';

export const toPaise = (rupees: number) => Math.round(Number(rupees) * 100);

export interface RazorpayPayment {
  id: string;
  amount: number;
  status: string;
  method?: string;
  order_id?: string;
  notes?: Record<string, string>;
}

interface PaymentLink {
  id: string;
  short_url: string;
  payments?: { payment_id: string; amount: number; status: string; method?: string }[];
}

export interface RazorpayQrCode {
  id: string;
  image_url: string;
  /** Present when Razorpay `qr_image_content` is enabled — encode this in our QR for native UPI. */
  image_content?: string;
  status: string;
  payment_amount?: number;
  notes?: Record<string, string>;
}

function safeEqualHex(expected: string, actual: unknown) {
  if (typeof actual !== 'string' || actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

@Injectable()
export class RazorpayService {
  isConfigured() {
    return Boolean(env.razorpay.keyId && env.razorpay.keySecret);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.isConfigured()) {
      throw new ApiError(503, 'Online payments are not set up yet. Please contact SnapNear support.');
    }
    const auth = Buffer.from(`${env.razorpay.keyId}:${env.razorpay.keySecret}`).toString('base64');

    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(env.razorpay.timeoutMs),
      });
    } catch {
      throw new ApiError(502, 'Could not reach the payment gateway. Please try again.');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const reason = data?.error?.description || `HTTP ${res.status}`;
      // Keep the full gateway error in server logs so dashboard-side issues (e.g. a product
      // that is not activated on the live account) are diagnosable from Render logs alone.
      console.error(
        `[razorpay] ${method} ${path} failed: status=${res.status} code=${data?.error?.code || '-'} reason=${data?.error?.reason || '-'}: ${reason}`
      );
      throw new ApiError(502, `Payment gateway error: ${reason}`);
    }
    return data as T;
  }

  createOrder({ amount, receipt, notes }: { amount: number; receipt: string; notes: Record<string, string> }) {
    return this.request<{ id: string }>('POST', '/orders', { amount: toPaise(amount), currency: 'INR', receipt, notes });
  }

  fetchOrderPayments(orderId: string) {
    return this.request<{ items?: RazorpayPayment[] }>('GET', `/orders/${orderId}/payments`);
  }

  fetchPayment(paymentId: string) {
    return this.request<RazorpayPayment>('GET', `/payments/${paymentId}`);
  }

  capturePayment(paymentId: string, amountPaise: number) {
    return this.request<RazorpayPayment>('POST', `/payments/${paymentId}/capture`, {
      amount: amountPaise,
      currency: 'INR',
    });
  }

  refundPayment(paymentId: string, notes: Record<string, string>) {
    return this.request('POST', `/payments/${paymentId}/refund`, { notes });
  }

  createPaymentLink(payload: Record<string, unknown>) {
    return this.request<PaymentLink>('POST', '/payment_links', payload);
  }

  fetchPaymentLink(linkId: string) {
    return this.request<PaymentLink>('GET', `/payment_links/${linkId}`);
  }

  cancelPaymentLink(linkId: string) {
    return this.request('POST', `/payment_links/${linkId}/cancel`);
  }

  /** Native UPI QR (PhonePe/GPay open the pay screen directly — not a hosted payment-link URL). */
  createQrCode(payload: Record<string, unknown>) {
    return this.request<RazorpayQrCode>('POST', '/payments/qr_codes', payload);
  }

  fetchQrCode(qrId: string) {
    return this.request<RazorpayQrCode>('GET', `/payments/qr_codes/${qrId}`);
  }

  fetchQrPayments(qrId: string) {
    return this.request<{ items?: RazorpayPayment[] }>('GET', `/payments/qr_codes/${qrId}/payments`);
  }

  closeQrCode(qrId: string) {
    return this.request('POST', `/payments/qr_codes/${qrId}/close`);
  }

  isCheckoutSignatureValid({ orderId, paymentId, signature }: { orderId: string; paymentId: string; signature: string }) {
    const expected = crypto
      .createHmac('sha256', env.razorpay.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return safeEqualHex(expected, signature);
  }

  isWebhookSignatureValid(rawBody: Buffer, signature: unknown) {
    if (!env.razorpay.webhookSecret) return false;
    const expected = crypto.createHmac('sha256', env.razorpay.webhookSecret).update(rawBody).digest('hex');
    return safeEqualHex(expected, signature);
  }
}
