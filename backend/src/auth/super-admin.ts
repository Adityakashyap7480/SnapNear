import { env } from '../config/env.js';
import { ROLES } from '../constants/roles.js';

export interface SuperAdminUser {
  id: string;
  name: string;
  email: string;
  role: typeof ROLES.SUPER_ADMIN;
}

/** The owner account lives in ENV (SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD), not in the database. */
export const SUPER_ADMIN: SuperAdminUser & { password: string } = {
  id: 'super-admin',
  name: 'Super Admin',
  email: env.superAdmin.email,
  password: env.superAdmin.password,
  role: ROLES.SUPER_ADMIN,
};

export const superAdminProfile = (): SuperAdminUser => ({
  id: SUPER_ADMIN.id,
  name: SUPER_ADMIN.name,
  email: SUPER_ADMIN.email,
  role: ROLES.SUPER_ADMIN,
});
