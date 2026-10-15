import bcrypt from 'bcryptjs';
import { eq, getTableColumns } from 'drizzle-orm';
import { db } from '../db/index.js';
import { creatorProfiles, users } from '../db/schema.js';
import { ACCOUNT_STATUS, ROLES } from '../constants/roles.js';
import { PARTNER_TERMS_VERSION } from '../constants/terms.js';

const { passwordHash: _passwordHash, ...publicColumns } = getTableColumns(users);

const toUser = ({ user, profile }) => ({ ...user, creatorProfile: profile });

async function findUser(where, { withPassword = false } = {}) {
  const [row] = await db
    .select({ user: withPassword ? users : publicColumns, profile: creatorProfiles })
    .from(users)
    .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
    .where(where)
    .limit(1);
  return row ? toUser(row) : null;
}

/** Users always come with `creatorProfile` (null for customers). */
export const findUserById = (id) => findUser(eq(users.id, id));

export const findUserByEmail = (email, options) => findUser(eq(users.email, email), options);

export async function listUsersWithProfiles(where, orderBy) {
  const rows = await db
    .select({ user: publicColumns, profile: creatorProfiles })
    .from(users)
    .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
    .where(where)
    .orderBy(orderBy);
  return rows.map(toUser);
}

export async function emailExists(email) {
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  return Boolean(row);
}

export async function createUser({ creatorProfile, password, ...fields }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return db.transaction(async (tx) => {
    const [{ passwordHash: _hash, ...user }] = await tx
      .insert(users)
      .values({ ...fields, passwordHash })
      .returning();
    const [profile] = creatorProfile
      ? await tx
          .insert(creatorProfiles)
          .values({ ...creatorProfile, userId: user.id })
          .returning()
      : [null];
    return { ...user, creatorProfile: profile };
  });
}

/** Updates account columns and returns the fresh user (keeping the loaded profile). */
export async function updateUser(user, changes, executor = db) {
  const [{ passwordHash: _hash, ...updated }] = await executor
    .update(users)
    .set(changes)
    .where(eq(users.id, user.id))
    .returning();
  return { ...updated, creatorProfile: user.creatorProfile };
}

export async function updateCreatorProfile(user, changes, executor = db) {
  if (Object.keys(changes).length === 0) return user;
  const [profile] = await executor
    .update(creatorProfiles)
    .set(changes)
    .where(eq(creatorProfiles.userId, user.id))
    .returning();
  return { ...user, creatorProfile: profile };
}

export const comparePassword = (user, candidate) => bcrypt.compare(candidate, user.passwordHash);

export const needsPartnerTerms = (user) =>
  user.role === ROLES.CREATOR && user.creatorProfile?.termsVersion !== PARTNER_TERMS_VERSION;

const publicProfile = (p) =>
  p && {
    services: p.services,
    experienceYears: p.experienceYears,
    gear: p.gear,
    bio: p.bio,
    isOnline: p.isOnline,
    isVerified: p.isVerified,
    rating: p.rating,
    upiId: p.upiId,
    termsVersion: p.termsVersion,
    termsAcceptedAt: p.termsAcceptedAt,
  };

export function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    city: user.city,
    creatorProfile: user.role === ROLES.CREATOR ? publicProfile(user.creatorProfile) : undefined,
    needsPartnerTerms: needsPartnerTerms(user),
    accountStatus: user.accountStatus || ACCOUNT_STATUS.ACTIVE,
    createdAt: user.createdAt,
  };
}
