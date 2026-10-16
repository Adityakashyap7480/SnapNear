import { request } from './client';
import type { Booking, BookingForm, Catalog, CreatorDashboard, RazorpayCheckout, RazorpayResult, Session, User } from '../types';

const byId = (id: string) => ({ pathParams: { id } });

export const authApi = {
  login: (data: { email: string; password: string }) => request<Session>('POST', '/auth/login', { data }),
  signup: (data: Record<string, unknown>) => request<Session>('POST', '/auth/signup', { data }),
  /** Verified Google ID token → login existing user or create with profile fields. */
  google: (data: Record<string, unknown>) => request<Session>('POST', '/auth/google', { data }),
  me: () => request<{ user: User }>('GET', '/auth/me'),
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
  cancel: (id: string) => request<BookingRes>('PATCH', '/bookings/:id/cancel', byId(id)),
  newStartOtp: (id: string) => request<BookingRes>('POST', '/bookings/:id/start-otp', byId(id)),
  startPayment: (id: string) => request<{ checkout: RazorpayCheckout }>('POST', '/bookings/:id/pay', byId(id)),
  verifyPayment: (id: string, data: RazorpayResult) => request<BookingRes>('POST', '/bookings/:id/pay/verify', { ...byId(id), data }),
  paymentStatus: (id: string) => request<BookingRes>('GET', '/bookings/:id/payment', byId(id)),
};

export const creatorApi = {
  dashboard: () => request<CreatorDashboard>('GET', '/creator/dashboard'),
  setDuty: (isOnline: boolean) => request<{ profile: User }>('PATCH', '/creator/status', { data: { isOnline } }),
  updateProfile: (data: Record<string, unknown>) => request<{ profile: User }>('PATCH', '/creator/profile', { data }),
  accept: (id: string) => request<BookingRes>('POST', '/creator/requests/:id/accept', byId(id)),
  decline: (id: string) => request<unknown>('POST', '/creator/requests/:id/decline', byId(id)),
  acceptTerms: () => request<{ user: User }>('POST', '/creator/terms/accept'),
  advance: (id: string) => request<BookingRes>('PATCH', '/creator/jobs/:id/advance', byId(id)),
  startShoot: (id: string, otp: string) => request<BookingRes>('POST', '/creator/jobs/:id/start', { ...byId(id), data: { otp } }),
  collectLink: (id: string) => request<{ link: { linkId: string; url: string } }>('POST', '/creator/jobs/:id/collect', byId(id)),
  paymentStatus: (id: string) => request<BookingRes>('GET', '/creator/jobs/:id/payment', byId(id)),
};
