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
      console.error(`[razorpay] ${method} ${path} failed: ${reason}`);
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
