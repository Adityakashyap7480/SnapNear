import { eq, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { bookings, creatorProfiles, users } from '../db/schema.js';

export async function findBooking(where) {
  const [booking] = await db.select().from(bookings).where(where).limit(1);
  return booking || null;
}

export const findBookingById = (id) => findBooking(eq(bookings.id, id));

/** Conditional update; returns the updated booking, or null when `where` no longer matches. */
export async function updateBooking(where, changes) {
  const [booking] = await db.update(bookings).set(changes).where(where).returning();
  return booking || null;
}

/** Attaches each assigned partner's current profile as `creator` (for names, gear, rating). */
export async function withCreators(list) {
  const ids = [...new Set(list.map((b) => b?.creatorId).filter(Boolean))];
  if (ids.length === 0) return list;

  const rows = await db
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

export async function withCreator(booking) {
  const [withProfile] = await withCreators([booking]);
  return withProfile;
}
