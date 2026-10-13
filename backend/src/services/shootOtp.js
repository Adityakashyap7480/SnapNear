import crypto from 'crypto';
import { DURATION_MINUTES } from '../constants/pricing.js';

export const START_OTP_LENGTH = 4;
export const START_OTP_MAX_ATTEMPTS = 5;

export function newStartOtp() {
  const code = String(crypto.randomInt(0, 10 ** START_OTP_LENGTH)).padStart(START_OTP_LENGTH, '0');
  return { code, attempts: 0, issuedAt: new Date() };
}

export function isStartOtpMatch(expected, given) {
  const a = Buffer.from(String(expected ?? ''));
  const b = Buffer.from(String(given ?? ''));
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const shootMinutesFor = (booking) => booking.durationMinutes || DURATION_MINUTES[booking.durationId] || 60;
