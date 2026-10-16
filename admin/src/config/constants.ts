const trimSlash = (url = '') => url.replace(/\/$/, '');

export const API_ORIGIN = trimSlash(import.meta.env.VITE_API_URL);
export const API_BASE_URL = `${API_ORIGIN}/api`;
export const API_TIMEOUT_MS = 15000;
export const SOCKET_URL = API_ORIGIN || window.location.origin;

/** Customer & partner app (login, signup, /book, /partner). Same domain unless overridden. */
export const APP_URL = trimSlash(import.meta.env.VITE_APP_URL);

// Shared with the customer & partner app on the same domain, so one login works everywhere
export const TOKEN_KEY = 'snapnear.token';

export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@snapnear.in';

export const ROLES = {
  CLIENT: 'client',
  CREATOR: 'creator',
  SUPER_ADMIN: 'superadmin',
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

// Status values below must match backend/src/constants/roles.ts
export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BLOCKED: 'blocked',
} as const;
export type AccountStatus = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

export const BOOKING_STATUS = {
  SEARCHING: 'searching',
  ASSIGNED: 'assigned',
  ARRIVED: 'arrived',
  SHOOTING: 'shooting',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const PAYMENT_STATUS = {
  DUE: 'due',
  PAID: 'paid',
} as const;

export const SHOOT_WARNING_MINUTES = 5;

// Values the admin bookings API accepts as ?status= (see adminBookingQuerySchema)
export const BOOKING_FILTER = {
  ALL: 'all',
  ACTIVE: 'active',
  UNPAID: 'unpaid',
  SEARCHING: BOOKING_STATUS.SEARCHING,
  COMPLETED: BOOKING_STATUS.COMPLETED,
  CANCELLED: BOOKING_STATUS.CANCELLED,
} as const;
export type BookingFilter = (typeof BOOKING_FILTER)[keyof typeof BOOKING_FILTER];

/** Where each role lands after login. Customers & partners live in the other app. */
export const APP_HOME: Record<Exclude<Role, 'superadmin'>, string> = {
  client: `${APP_URL}/book`,
  creator: `${APP_URL}/partner`,
};

export const ROLE_LABELS: Record<Role, string> = {
  client: 'Customer',
  creator: 'Partner',
  superadmin: 'Owner / Super Admin',
};
