export const HTTP_METHODS = Object.freeze({
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
});

const { GET, POST, PATCH } = HTTP_METHODS;

/**
 * Every backend API the app calls, in one place.
 * `url` is relative to API_BASE_URL; `:params` are filled from `pathParams` in request().
 */
export const API_ENDPOINTS = Object.freeze({
  AUTH: {
    LOGIN: { method: POST, url: '/auth/login' },
    SIGNUP: { method: POST, url: '/auth/signup' },
    ME: { method: GET, url: '/auth/me' },
  },

  CATALOG: {
    GET: { method: GET, url: '/catalog' },
  },

  BOOKINGS: {
    CREATE: { method: POST, url: '/bookings' },
    MINE: { method: GET, url: '/bookings/mine' },
    CANCEL: { method: PATCH, url: '/bookings/:id/cancel' },
    START_PAYMENT: { method: POST, url: '/bookings/:id/pay' },
    VERIFY_PAYMENT: { method: POST, url: '/bookings/:id/pay/verify' },
    PAYMENT_STATUS: { method: GET, url: '/bookings/:id/payment' },
  },

  CREATOR: {
    DASHBOARD: { method: GET, url: '/creator/dashboard' },
    SET_DUTY: { method: PATCH, url: '/creator/status' },
    UPDATE_PROFILE: { method: PATCH, url: '/creator/profile' },
    ACCEPT_REQUEST: { method: POST, url: '/creator/requests/:id/accept' },
    DECLINE_REQUEST: { method: POST, url: '/creator/requests/:id/decline' },
    ADVANCE_JOB: { method: PATCH, url: '/creator/jobs/:id/advance' },
    COLLECT_LINK: { method: POST, url: '/creator/jobs/:id/collect' },
    PAYMENT_STATUS: { method: GET, url: '/creator/jobs/:id/payment' },
  },

  ADMIN: {
    OVERVIEW: { method: GET, url: '/admin/overview' },
    BOOKINGS: { method: GET, url: '/admin/bookings' },
    CANCEL_BOOKING: { method: PATCH, url: '/admin/bookings/:id/cancel' },
    CLIENTS: { method: GET, url: '/admin/clients' },
    CREATORS: { method: GET, url: '/admin/creators' },
    SET_USER_STATUS: { method: PATCH, url: '/admin/users/:id/status' },
    PAYOUTS: { method: GET, url: '/admin/payouts' },
    MARK_PAYOUT: { method: POST, url: '/admin/payouts' },
  },
});
