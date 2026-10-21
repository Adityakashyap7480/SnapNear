import { request } from './client';
import type { Booking, BookingForm, Catalog, CreatorDashboard, RazorpayCheckout, RazorpayResult, Session, User } from '../types';

const byId = (id: string) => ({ pathParams: { id } });

export type SignupOtpResponse = {
  success: boolean;
  email: string;
  expiresInSeconds: number;
  message: string;
  /** Present only in local/dev when SMTP is not configured. */
  devOtp?: string;
};

export const authApi = {
  login: (data: { email: string; password: string }) =>
    request<Session>('POST', '/auth/login', { data, retryOnColdStart: true }),
  signup: (data: Record<string, unknown>) => request<Session>('POST', '/auth/signup', { data }),
  requestSignupOtp: (data: Record<string, unknown>) =>
    request<SignupOtpResponse>('POST', '/auth/signup/request-otp', { data }),
  resendSignupOtp: (email: string) =>
    request<SignupOtpResponse>('POST', '/auth/signup/resend-otp', { data: { email } }),
  verifySignupOtp: (data: { email: string; otp: string }) =>
    request<Session>('POST', '/auth/signup/verify-otp', { data }),
  checkEmail: (email: string) => request<{ available: boolean }>('POST', '/auth/check-email', { data: { email } }),
  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string; email: string; expiresInSeconds: number; devOtp?: string }>(
      'POST',
      '/auth/forgot-password',
      { data: { email } }
    ),
  resetPassword: (data: { email: string; otp: string; password: string }) =>
    request<{ success: boolean; message: string }>('POST', '/auth/reset-password', { data }),
  me: () => request<{ user: User }>('GET', '/auth/me'),
  updateMe: (data: {
    name?: string;
    phone?: string;
    city?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  }) => request<{ user: User }>('PATCH', '/auth/me', { data }),
  deleteAccount: () => request<{ success: boolean }>('DELETE', '/auth/me'),
  registerPushToken: (data: { token: string; platform: 'android' | 'ios' | 'web' | 'unknown' }) =>
    request<{ success: boolean }>('POST', '/auth/push-token', { data }),
  clearPushToken: (data: { token?: string } = {}) => request<{ success: boolean }>('POST', '/auth/push-token/clear', { data }),
};

export const catalogApi = {
  get: () => request<{ catalog: Catalog }>('GET', '/catalog'),
};

type BookingRes = { booking: Booking };

export const bookingApi = {
  create: (data: BookingForm) => request<BookingRes>('POST', '/bookings', { data }),
  mine: () => request<{ bookings: Booking[] }>('GET', '/bookings/mine'),
  cancel: (id: string, data: { reason: string; remark?: string }) =>
    request<BookingRes>('PATCH', '/bookings/:id/cancel', { ...byId(id), data }),
  newStartOtp: (id: string) => request<BookingRes>('POST', '/bookings/:id/start-otp', byId(id)),
  startPayment: (id: string) => request<{ checkout: RazorpayCheckout }>('POST', '/bookings/:id/pay', byId(id)),
  verifyPayment: (id: string, data: RazorpayResult) => request<BookingRes>('POST', '/bookings/:id/pay/verify', { ...byId(id), data }),
  paymentStatus: (id: string) => request<BookingRes>('GET', '/bookings/:id/payment', byId(id)),
  rate: (id: string, data: { stars: number; remark?: string }) =>
    request<{ rating: { stars: number; remark: string; bookingId: string } }>('POST', '/bookings/:id/rate', {
      ...byId(id),
      data,
    }),
};

export const creatorApi = {
  dashboard: () => request<CreatorDashboard>('GET', '/creator/dashboard'),
  setDuty: (isOnline: boolean) => request<{ profile: User }>('PATCH', '/creator/status', { data: { isOnline } }),
  updateProfile: (data: Record<string, unknown>) => request<{ profile: User }>('PATCH', '/creator/profile', { data }),
  accept: (id: string) => request<BookingRes>('POST', '/creator/requests/:id/accept', byId(id)),
  decline: (id: string) => request<unknown>('POST', '/creator/requests/:id/decline', byId(id)),
  acceptTerms: () => request<{ user: User }>('POST', '/creator/terms/accept'),
  advance: (id: string) => request<BookingRes>('PATCH', '/creator/jobs/:id/advance', byId(id)),
  cancelJob: (id: string, data: { reason: string; remark?: string }) =>
    request<BookingRes>('PATCH', '/creator/jobs/:id/cancel', { ...byId(id), data }),
  startShoot: (id: string, otp: string) => request<BookingRes>('POST', '/creator/jobs/:id/start', { ...byId(id), data: { otp } }),
  collectLink: (id: string) =>
    request<{ link: { url: string; upi?: string; qrImageUrl?: string } }>('POST', '/creator/jobs/:id/collect', byId(id)),
  paymentStatus: (id: string) => request<BookingRes>('GET', '/creator/jobs/:id/payment', byId(id)),
  collectCash: (id: string) => request<BookingRes>('POST', '/creator/jobs/:id/collect-cash', byId(id)),
  requestPayout: () =>
    request<{ request: { id: string; amount: number; status: string } }>('POST', '/creator/payout-request'),
  startPlatformFee: (id: string) =>
    request<{ checkout: RazorpayCheckout }>('POST', '/creator/jobs/:id/platform-fee/pay', byId(id)),
  verifyPlatformFee: (id: string, data: RazorpayResult) =>
    request<BookingRes>('POST', '/creator/jobs/:id/platform-fee/verify', { ...byId(id), data }),
};
