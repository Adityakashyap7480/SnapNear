import crypto from 'crypto';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const API_BASE = 'https://api.razorpay.com/v1';

export const isRazorpayConfigured = () => Boolean(env.razorpay.keyId && env.razorpay.keySecret);

export const toPaise = (rupees) => Math.round(Number(rupees) * 100);

function assertConfigured() {
  if (!isRazorpayConfigured()) {
    throw new ApiError(503, 'Online payments are not set up yet. Please contact SnapNear support.');
  }
}

async function request(method, path, body) {
  assertConfigured();
  const auth = Buffer.from(`${env.razorpay.keyId}:${env.razorpay.keySecret}`).toString('base64');

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
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
  return data;
}

export const createOrder = ({ amount, receipt, notes }) =>
  request('POST', '/orders', { amount: toPaise(amount), currency: 'INR', receipt, notes });

export const fetchOrderPayments = (orderId) => request('GET', `/orders/${orderId}/payments`);

export const fetchPayment = (paymentId) => request('GET', `/payments/${paymentId}`);

export const capturePayment = (paymentId, amountPaise) =>
  request('POST', `/payments/${paymentId}/capture`, { amount: amountPaise, currency: 'INR' });

export const refundPayment = (paymentId, notes) => request('POST', `/payments/${paymentId}/refund`, { notes });

export const createPaymentLink = (payload) => request('POST', '/payment_links', payload);

export const fetchPaymentLink = (linkId) => request('GET', `/payment_links/${linkId}`);

export const cancelPaymentLink = (linkId) => request('POST', `/payment_links/${linkId}/cancel`);

function safeEqualHex(expected, actual) {
  if (typeof actual !== 'string' || actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

export function isCheckoutSignatureValid({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return safeEqualHex(expected, signature);
}

export function isWebhookSignatureValid(rawBody, signature) {
  if (!env.razorpay.webhookSecret) return false;
  const expected = crypto.createHmac('sha256', env.razorpay.webhookSecret).update(rawBody).digest('hex');
  return safeEqualHex(expected, signature);
}
