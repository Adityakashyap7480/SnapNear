import crypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { type SQL, eq, inArray } from 'drizzle-orm';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { DatabaseService } from '../database/database.service.js';
import { type Booking, type CreatorProfile, type NewBooking, bookings, creatorProfiles, users } from '../database/schema.js';

export interface BookingCreator {
  id: string;
  name: string;
  phone: string;
  email: string;
  creatorProfile: CreatorProfile | null;
}

/** A booking with the assigned partner's live profile attached (see `withCreators`). */
export type BookingWithCreator = Booking & { creator?: BookingCreator | null };

@Injectable()
export class BookingsRepository {
  constructor(private readonly database: DatabaseService) {}

  private get db() {
    return this.database.db;
  }

  async find(where: SQL | undefined): Promise<Booking | null> {
    const [booking] = await this.db.select().from(bookings).where(where).limit(1);
    return booking || null;
  }

  findById(id: string) {
    return this.find(eq(bookings.id, id));
  }

  async insert(values: NewBooking): Promise<Booking> {
    const [booking] = await this.db.insert(bookings).values(values).returning();
    return booking;
  }

  /** Conditional update; returns the updated booking, or null when `where` no longer matches. */
  async update(where: SQL | undefined, changes: PgUpdateSetSource<typeof bookings>): Promise<Booking | null> {
    const [booking] = await this.db.update(bookings).set(changes).where(where).returning();
    return booking || null;
  }

  /** Attaches each assigned partner's current profile as `creator` (for names, gear, rating). */
  async withCreators<T extends Booking>(list: T[]): Promise<(T & { creator?: BookingCreator | null })[]> {
    const ids = [...new Set(list.map((b) => b?.creatorId).filter((id): id is string => Boolean(id)))];
    if (ids.length === 0) return list;

    const rows = await this.db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        email: users.email,
        creatorProfile: creatorProfiles,
      })
      .from(users)
      .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
      .where(inArray(users.id, ids));
    const byId = new Map(rows.map((u) => [u.id, u]));

    return list.map((b) => (b?.creatorId ? { ...b, creator: byId.get(b.creatorId) || null } : b));
  }

  async withCreator<T extends Booking>(booking: T) {
    const [withProfile] = await this.withCreators([booking]);
    return withProfile;
  }

  async generateCode(): Promise<string> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = `SNP-${crypto.randomInt(10000, 99999)}`;
      // eslint-disable-next-line no-await-in-loop
      const exists = await this.find(eq(bookings.code, code));
      if (!exists) return code;
    }
    return `SNP-${Date.now().toString().slice(-7)}`;
  }
}
