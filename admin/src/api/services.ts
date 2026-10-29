import { request } from './client';
import type {
  AdminCustomer,
  AdminPartner,
  Booking,
  BookingFilterParams,
  Catalog,
  Overview,
  Pagination,
  PayoutRecord,
  PayoutsData,
  Session,
  User,
} from '../types';

const byId = (id: string) => ({ pathParams: { id } });

export const authApi = {
  login: (data: { email: string; password: string }) =>
    request<Session>('POST', '/auth/login', { data, retryOnColdStart: true }),
  me: () => request<{ user: User }>('GET', '/auth/me'),
};

export const catalogApi = {
  get: () => request<{ catalog: Catalog }>('GET', '/catalog'),
};

export const adminApi = {
  overview: () => request<{ overview: Overview }>('GET', '/admin/overview'),
  bookings: (params: BookingFilterParams) =>
    request<{ bookings: Booking[]; pagination: Pagination }>('GET', '/admin/bookings', { params: { ...params } }),
  cancelBooking: (id: string) => request<{ booking: Booking }>('PATCH', '/admin/bookings/:id/cancel', byId(id)),
  clients: (params?: { q?: string; page?: number; limit?: number; account?: string }) =>
    request<{
      clients: AdminCustomer[];
      pagination: Pagination;
      summary: { total: number; bookings: number; active: number; spent: number; deleted: number };
    }>('GET', '/admin/clients', { params: { ...params } }),
  creators: (params?: { q?: string; page?: number; limit?: number; duty?: string; account?: string }) =>
    request<{
      creators: AdminPartner[];
      pagination: Pagination;
      summary: { total: number; online: number; activeJobs: number; earnings: number; deleted: number };
    }>('GET', '/admin/creators', { params: { ...params } }),
  setUserStatus: (id: string, data: { status: string; reason: string }) =>
    request<{ cancelledRequests: number }>('PATCH', '/admin/users/:id/status', { ...byId(id), data }),
  payouts: () => request<PayoutsData>('GET', '/admin/payouts'),
  markPayout: (data: { creatorId: string; reference: string; note: string }) =>
    request<{ payout: PayoutRecord }>('POST', '/admin/payouts', { data }),
};
