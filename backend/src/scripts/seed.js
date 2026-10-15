/* Resets the database to one customer and one partner. WARNING: wipes existing users, bookings & payouts. */
import { sql } from 'drizzle-orm';
import { connectDB, db, disconnectDB } from '../db/index.js';
import { createUser } from '../models/users.js';

const CUSTOMER = {
  name: 'Aditya Kashyap',
  email: 'aditya@gmail.com',
  password: 'aditya@gmail.com',
  phone: '9876543210',
  city: 'Greater Noida West',
  role: 'client',
};

const PARTNER = {
  name: 'Suraj',
  email: 'suraj@gmail.com',
  password: 'suraj@gmail.com',
  phone: '9898989898',
  city: 'Greater Noida West',
  role: 'creator',
  creatorProfile: {
    services: ['photo', 'video'],
    experienceYears: 4,
    gear: 'Sony A7 IV, Tamron 28-75 f/2.8, DJI RS3 Gimbal',
    bio: 'Candid & cinematic storyteller for birthdays and society events.',
    isOnline: true,
    rating: 4.9,
  },
};

async function run() {
  await connectDB();

  await db.execute(sql`truncate table booking_declines, bookings, payouts, creator_profiles, users`);
  console.log('[seed] Cleared users, bookings and payouts');

  await createUser(CUSTOMER);
  await createUser(PARTNER);

  console.log('[seed] Created 1 customer and 1 partner');
  console.log(`[seed] Customer: ${CUSTOMER.email} / ${CUSTOMER.password}`);
  console.log(`[seed] Partner : ${PARTNER.email} / ${PARTNER.password}`);

  await disconnectDB();
}

run().catch(async (err) => {
  console.error('[seed] Failed:', err);
  await disconnectDB();
  process.exit(1);
});
