import { Platform } from 'react-native';
import { ROUTES } from './routes';

const trimSlash = (url = '') => url.replace(/\/$/, '');
const isWeb = Platform.OS === 'web';

/** Backend origin. Empty on web means the same domain (dev proxy); the phone app needs the full URL. */
export const API_ORIGIN = trimSlash(process.env.EXPO_PUBLIC_API_URL);
export const API_BASE_URL = `${API_ORIGIN}/api`;
export const API_TIMEOUT_MS = 15000;

/**
 * Socket.io needs a real backend host in local Expo web — Metro's HTTP proxy does not
 * reliably upgrade ws://localhost:8081/socket.io to Nest.
 */
const localWebHost =
  isWeb && typeof window !== 'undefined'
    ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    : false;
export const SOCKET_URL =
  API_ORIGIN ||
  (localWebHost ? trimSlash(process.env.EXPO_DEV_BACKEND || 'http://localhost:5000') : isWeb ? window.location.origin : '');

/** Public website, used by the phone app to open the owner panel in the browser. */
export const WEB_URL = trimSlash(process.env.EXPO_PUBLIC_WEB_URL) || (isWeb ? window.location.origin : '');
/** Owner panel (the admin app), served at /admin on the same domain unless overridden. */
export const ADMIN_URL = trimSlash(process.env.EXPO_PUBLIC_ADMIN_URL) || `${WEB_URL}/admin`;

// Shared with the admin app on the same domain, so one login works everywhere
export const TOKEN_KEY = 'snapnear.token';

export const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'supportsnear@gmail.com';

/** Partners only see (and get pushed) customer shoots within this radius. */
export const MATCH_RADIUS_KM = Number(process.env.EXPO_PUBLIC_MATCH_RADIUS_KM) || 10;

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

/** Where each role lands after login. The owner panel is a separate web app. */
export const ROLE_HOME: Record<Exclude<Role, 'superadmin'>, string> = {
  [ROLES.CLIENT]: ROUTES.BOOK,
  [ROLES.CREATOR]: ROUTES.PARTNER,
};

export const APP_NAMES = {
  client: 'Book a Shoot',
  creator: 'SnapNear Partner',
};

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.CLIENT]: 'Customer',
  [ROLES.CREATOR]: 'Partner',
  [ROLES.SUPER_ADMIN]: 'Owner / Super Admin',
};
