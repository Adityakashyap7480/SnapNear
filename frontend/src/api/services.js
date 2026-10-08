import http from './http';

export const authApi = {
  login: (payload) => http.post('/auth/login', payload),
  signup: (payload) => http.post('/auth/signup', payload),
  me: () => http.get('/auth/me'),
};

export const catalogApi = {
  get: () => http.get('/catalog'),
};

export const bookingApi = {
  create: (payload) => http.post('/bookings', payload),
  mine: () => http.get('/bookings/mine'),
  cancel: (id) => http.patch(`/bookings/${id}/cancel`),
};

export const creatorApi = {
  dashboard: () => http.get('/creator/dashboard'),
  setDuty: (isOnline) => http.patch('/creator/status', { isOnline }),
  updateProfile: (payload) => http.patch('/creator/profile', payload),
  accept: (id) => http.post(`/creator/requests/${id}/accept`),
  decline: (id) => http.post(`/creator/requests/${id}/decline`),
  advance: (id) => http.patch(`/creator/jobs/${id}/advance`),
};

export const adminApi = {
  overview: () => http.get('/admin/overview'),
  bookings: (params) => http.get('/admin/bookings', { params }),
  cancelBooking: (id) => http.patch(`/admin/bookings/${id}/cancel`),
  clients: () => http.get('/admin/clients'),
  creators: () => http.get('/admin/creators'),
  setUserStatus: (id, payload) => http.patch(`/admin/users/${id}/status`, payload),
};
