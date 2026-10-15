import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { findBooking } from '../models/bookings.js';
import { bookings } from '../db/schema.js';

export async function generateBookingCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `SNP-${crypto.randomInt(10000, 99999)}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await findBooking(eq(bookings.code, code));
    if (!exists) return code;
  }
  return `SNP-${Date.now().toString().slice(-7)}`;
}
