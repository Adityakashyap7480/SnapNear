import { Platform } from 'react-native';
import { ADMIN_URL, ROLES, ROLE_HOME, type Role } from '../config/constants';
import { ROUTES } from '../config/routes';

/** The owner's dashboard is the separate admin web app on the same domain. */
export function openOwnerPanel() {
  window.location.replace(`${ADMIN_URL}/platform`);
}

/**
 * In-app home for a role. The owner gets the admin web app (on the website) or a page
 * pointing to it (in the phone app).
 */
export function homeFor(role: Role): string {
  if (role === ROLES.SUPER_ADMIN) return ROUTES.OWNER;
  return ROLE_HOME[role];
}

export const ownerUsesWebPanel = Platform.OS === 'web';
