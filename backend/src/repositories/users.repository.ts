import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { type SQL, eq, getTableColumns } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { env } from '../config/env.js';
import { ACCOUNT_STATUS, ROLES } from '../constants/roles.js';
import { DatabaseService, type Executor } from '../database/database.service.js';
import { type CreatorProfile, type NewCreatorProfile, type UserRow, creatorProfiles, users } from '../database/schema.js';

export type User = Omit<UserRow, 'passwordHash'> & { creatorProfile: CreatorProfile | null };
export type UserWithPassword = User & { passwordHash: string };

export type NewUser = {
  role: UserRow['role'];
  name: string;
  email: string;
  phone: string;
  city?: string;
  creatorProfile: Omit<NewCreatorProfile, 'userId'> | null;
} & ({ password: string; passwordHash?: never } | { passwordHash: string; password?: never });

const { passwordHash: _passwordHash, ...publicColumns } = getTableColumns(users);

const toUser = <T extends object>({ user, profile }: { user: T; profile: CreatorProfile | null }) => ({
  ...user,
  creatorProfile: profile,
});

@Injectable()
export class UsersRepository {
  constructor(private readonly database: DatabaseService) {}

  private get db() {
    return this.database.db;
  }

  /** Users always come with `creatorProfile` (null for customers). */
  async findById(id: string): Promise<User | null> {
    const [row] = await this.db
      .select({ user: publicColumns, profile: creatorProfiles })
      .from(users)
      .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
      .where(eq(users.id, id))
      .limit(1);
    return row ? toUser(row) : null;
  }

  async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
    const [row] = await this.db
      .select({ user: users, profile: creatorProfiles })
      .from(users)
      .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
      .where(eq(users.email, email))
      .limit(1);
    return row ? toUser(row) : null;
  }

  async listWithProfiles(where: SQL | undefined, orderBy: PgColumn | SQL): Promise<User[]> {
    const rows = await this.db
      .select({ user: publicColumns, profile: creatorProfiles })
      .from(users)
      .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
      .where(where)
      .orderBy(orderBy);
    return rows.map(toUser);
  }

  async emailExists(email: string) {
    const [row] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    return Boolean(row);
  }

  async create({ creatorProfile, password, passwordHash: existingHash, ...fields }: NewUser): Promise<User> {
    const passwordHash = existingHash || (await bcrypt.hash(password!, env.bcryptRounds));
    return this.db.transaction(async (tx) => {
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
  async update(user: User, changes: Partial<typeof users.$inferInsert>, executor: Executor = this.db): Promise<User> {
    const [{ passwordHash: _hash, ...updated }] = await executor
      .update(users)
      .set(changes)
      .where(eq(users.id, user.id))
      .returning();
    return { ...updated, creatorProfile: user.creatorProfile };
  }

  async updateCreatorProfile(
    user: User,
    changes: Partial<NewCreatorProfile>,
    executor: Executor = this.db
  ): Promise<User> {
    if (Object.keys(changes).length === 0) return user;
    const [profile] = await executor
      .update(creatorProfiles)
      .set(changes)
      .where(eq(creatorProfiles.userId, user.id))
      .returning();
    return { ...user, creatorProfile: profile };
  }

  comparePassword(user: UserWithPassword, candidate: string) {
    return bcrypt.compare(candidate, user.passwordHash);
  }
}

export const needsPartnerTerms = (user: User) =>
  user.role === ROLES.CREATOR && user.creatorProfile?.termsVersion !== env.partnerTermsVersion;

const publicProfile = (p: CreatorProfile | null) =>
  p && {
    services: p.services,
    experienceYears: p.experienceYears,
    gear: p.gear,
    bio: p.bio,
    isOnline: p.isOnline,
    isVerified: p.isVerified,
    rating: p.rating,
    ratingCount: p.ratingCount,
    upiId: p.upiId,
    termsVersion: p.termsVersion,
    termsAcceptedAt: p.termsAcceptedAt,
  };

export const hasPartnerLocation = (user: User) =>
  typeof user.latitude === 'number' &&
  typeof user.longitude === 'number' &&
  Number.isFinite(user.latitude) &&
  Number.isFinite(user.longitude) &&
  Boolean(user.address?.trim());

export const needsPartnerLocation = (user: User) => user.role === ROLES.CREATOR && !hasPartnerLocation(user);

export function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    city: user.city,
    address: user.address || '',
    latitude: user.latitude ?? null,
    longitude: user.longitude ?? null,
    locationUpdatedAt: user.locationUpdatedAt || null,
    creatorProfile: user.role === ROLES.CREATOR ? publicProfile(user.creatorProfile) : undefined,
    needsPartnerTerms: needsPartnerTerms(user),
    needsPartnerLocation: needsPartnerLocation(user),
    accountStatus: user.accountStatus || ACCOUNT_STATUS.ACTIVE,
    createdAt: user.createdAt,
  };
}
export type PublicUser = ReturnType<typeof toPublicUser>;
