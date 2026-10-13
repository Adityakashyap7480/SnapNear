import { request } from './client';
import { API_ENDPOINTS } from './endpoints';

const { AUTH, CATALOG, BOOKINGS, CREATOR, ADMIN } = API_ENDPOINTS;
const byId = (id) => ({ pathParams: { id } });

export const authApi = {
  login: (data) => request(AUTH.LOGIN, { data }),
  signup: (data) => request(AUTH.SIGNUP, { data }),
  me: () => request(AUTH.ME),
};

export const catalogApi = {
  get: () => request(CATALOG.GET),
};

export const bookingApi = {
  create: (data) => request(BOOKINGS.CREATE, { data }),
  mine: () => request(BOOKINGS.MINE),
  cancel: (id) => request(BOOKINGS.CANCEL, byId(id)),
  startPayment: (id) => request(BOOKINGS.START_PAYMENT, byId(id)),
  verifyPayment: (id, data) => request(BOOKINGS.VERIFY_PAYMENT, { ...byId(id), data }),
  paymentStatus: (id) => request(BOOKINGS.PAYMENT_STATUS, byId(id)),
};

export const creatorApi = {
  dashboard: () => request(CREATOR.DASHBOARD),
  setDuty: (isOnline) => request(CREATOR.SET_DUTY, { data: { isOnline } }),
  updateProfile: (data) => request(CREATOR.UPDATE_PROFILE, { data }),
  accept: (id) => request(CREATOR.ACCEPT_REQUEST, byId(id)),
  decline: (id) => request(CREATOR.DECLINE_REQUEST, byId(id)),
  advance: (id) => request(CREATOR.ADVANCE_JOB, byId(id)),
  collectLink: (id) => request(CREATOR.COLLECT_LINK, byId(id)),
  paymentStatus: (id) => request(CREATOR.PAYMENT_STATUS, byId(id)),
};

export const adminApi = {
  overview: () => request(ADMIN.OVERVIEW),
  bookings: (params) => request(ADMIN.BOOKINGS, { params }),
  cancelBooking: (id) => request(ADMIN.CANCEL_BOOKING, byId(id)),
  clients: () => request(ADMIN.CLIENTS),
  creators: () => request(ADMIN.CREATORS),
  setUserStatus: (id, data) => request(ADMIN.SET_USER_STATUS, { ...byId(id), data }),
  payouts: () => request(ADMIN.PAYOUTS),
  markPayout: (data) => request(ADMIN.MARK_PAYOUT, { data }),
};
