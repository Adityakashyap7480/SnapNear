import { DURATION_MINUTES } from '../constants/pricing.js';

/** Minutes from midnight for each catalog time slot (start inclusive, end exclusive for overlap). */
const SLOT_WINDOWS: Record<string, { start: number; end: number } | 'asap'> = {
  'Immediate / ASAP': 'asap',
  'Morning (10:00 AM - 12:00 PM)': { start: 10 * 60, end: 12 * 60 },
  'Afternoon (02:00 PM - 04:00 PM)': { start: 14 * 60, end: 16 * 60 },
  'Golden Hour (04:30 PM - 06:30 PM)': { start: 16 * 60 + 30, end: 18 * 60 + 30 },
  'Night Party (07:00 PM - 10:00 PM)': { start: 19 * 60, end: 22 * 60 },
};

export const TIME_SLOT_CONFLICT_MESSAGE =
  "You're already booked in this time slot, so you can't accept this shoot.";

type SlotBooking = {
  shootDate: string;
  timeSlot: string;
  durationId: string;
  durationMinutes?: number | null;
};

function minutesFor(b: SlotBooking) {
  return b.durationMinutes || DURATION_MINUTES[b.durationId] || 60;
}

/** Inclusive start / exclusive end in minutes from midnight on shootDate. */
function windowFor(b: SlotBooking): { start: number; end: number } | null {
  const slot = SLOT_WINDOWS[b.timeSlot];
  if (!slot) {
    // Unknown label: treat as full-day so we never double-book by accident
    return { start: 0, end: 24 * 60 };
  }
  if (slot === 'asap') {
    // ASAP can land anywhere that day — conflicts with every other slot the same day
    return { start: 0, end: 24 * 60 };
  }
  const duration = minutesFor(b);
  return { start: slot.start, end: Math.max(slot.end, slot.start + duration) };
}

function rangesOverlap(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && b.start < a.end;
}

/** True when two bookings share a date and their time windows overlap. */
export function timeSlotsConflict(a: SlotBooking, b: SlotBooking): boolean {
  if (a.shootDate !== b.shootDate) return false;
  if (a.timeSlot === b.timeSlot) return true;
  const wa = windowFor(a);
  const wb = windowFor(b);
  if (!wa || !wb) return true;
  return rangesOverlap(wa, wb);
}

/** First existing job that conflicts with the candidate, if any. */
export function findConflictingJob<T extends SlotBooking>(candidate: SlotBooking, jobs: T[]): T | undefined {
  return jobs.find((job) => timeSlotsConflict(candidate, job));
}
