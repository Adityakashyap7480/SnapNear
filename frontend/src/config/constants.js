export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const API_BASE_URL = `${API_ORIGIN}/api`;
export const SOCKET_URL = API_ORIGIN || window.location.origin;

export const TOKEN_KEY = 'snapnear.token';

export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@snapnear.in';

// Role ids stored in the database. User-facing names live in APP_NAMES / ROLE_LABELS.
export const ROLES = {
  CLIENT: 'client',
  CREATOR: 'creator',
  SUPER_ADMIN: 'superadmin',
};

export const ROLE_HOME = {
  [ROLES.CLIENT]: '/book',
  [ROLES.CREATOR]: '/partner',
  [ROLES.SUPER_ADMIN]: '/admin/platform',
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
