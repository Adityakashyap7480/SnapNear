import { ROUTES } from './routes';

export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const API_BASE_URL = `${API_ORIGIN}/api`;
export const API_TIMEOUT_MS = 15000;
export const SOCKET_URL = API_ORIGIN || window.location.origin;

export const TOKEN_KEY = 'snapnear.token';

export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@snapnear.in';

// Role ids stored in the database. User-facing names live in APP_NAMES / ROLE_LABELS.
export const ROLES = {
  CLIENT: 'client',
  CREATOR: 'creator',
  SUPER_ADMIN: 'superadmin',
};

// Status values below must match backend/src/constants/roles.js
export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BLOCKED: 'blocked',
};

export const BOOKING_STATUS = {
  SEARCHING: 'searching',
  ASSIGNED: 'assigned',
  ARRIVED: 'arrived',
  SHOOTING: 'shooting',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  DUE: 'due',
  PAID: 'paid',
};

// Must match backend/src/services/shootOtp.js
export const START_OTP_LENGTH = 4;
export const SHOOT_WARNING_MINUTES = 5;

// Values the admin bookings API accepts as ?status= (see adminBookingQuerySchema)
export const BOOKING_FILTER = {
  ALL: 'all',
  ACTIVE: 'active',
  UNPAID: 'unpaid',
  SEARCHING: BOOKING_STATUS.SEARCHING,
  COMPLETED: BOOKING_STATUS.COMPLETED,
  CANCELLED: BOOKING_STATUS.CANCELLED,
};

export const ROLE_HOME = {
  [ROLES.CLIENT]: ROUTES.BOOK,
  [ROLES.CREATOR]: ROUTES.PARTNER,
  [ROLES.SUPER_ADMIN]: ROUTES.ADMIN_PLATFORM,
};

export const APP_NAMES = {
  client: 'Book a Shoot',
  creator: 'SnapNear Partner',
  platform: 'Platform 20%',
};

export const ROLE_LABELS = {
  [ROLES.CLIENT]: 'Customer',
  [ROLES.CREATOR]: 'Partner',
  [ROLES.SUPER_ADMIN]: 'Owner / Super Admin',
};
