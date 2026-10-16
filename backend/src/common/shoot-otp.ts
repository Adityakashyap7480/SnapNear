import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { DURATION_MINUTES } from '../constants/pricing.js';

const { length: OTP_LENGTH } = env.startOtp;

/** Booking columns for a fresh start OTP. */
export function newStartOtp() {
  const code = String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
  return { startOtpCode: code, startOtpAttempts: 0, startOtpIssuedAt: new Date() };
}

export const CLEARED_START_OTP = { startOtpCode: null, startOtpAttempts: 0, startOtpIssuedAt: null };

export function isStartOtpMatch(expected: string | null, given: string) {
  const a = Buffer.from(String(expected ?? ''));
  const b = Buffer.from(String(given ?? ''));
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const shootMinutesFor = (booking: { durationMinutes?: number | null; durationId: string }) =>
  booking.durationMinutes || DURATION_MINUTES[booking.durationId] || 60;
