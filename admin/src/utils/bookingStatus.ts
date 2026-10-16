import { BOOKING_STATUS, type BookingStatus, SHOOT_WARNING_MINUTES } from '../config/constants';

const { SEARCHING, ASSIGNED, ARRIVED, SHOOTING, COMPLETED, CANCELLED } = BOOKING_STATUS;

export const STATUS_META: Record<BookingStatus, { label: string; short: string; badge: string; dot: string }> = {
  [SEARCHING]: {
    label: 'Finding Photographer',
    short: 'Searching',
    badge: 'bg-amber-100 text-amber-800 ring-amber-200',
    dot: 'bg-amber-500',
  },
  [ASSIGNED]: {
    label: 'Photographer On The Way',
    short: 'Assigned',
    badge: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
    dot: 'bg-indigo-500',
  },
  [ARRIVED]: {
    label: 'Photographer Arrived',
    short: 'Arrived',
    badge: 'bg-sky-100 text-sky-800 ring-sky-200',
    dot: 'bg-sky-500',
  },
  [SHOOTING]: {
    label: 'Shoot In Progress',
    short: 'Shooting',
    badge: 'bg-orange-100 text-orange-800 ring-orange-200',
    dot: 'bg-orange-500',
  },
  [COMPLETED]: {
    label: 'Shoot Completed',
    short: 'Completed',
    badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  [CANCELLED]: {
    label: 'Cancelled',
    short: 'Cancelled',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  },
};

const ACTIVE_STATUSES: BookingStatus[] = [SEARCHING, ASSIGNED, ARRIVED, SHOOTING];

export const isActive = (status: BookingStatus) => ACTIVE_STATUSES.includes(status);
export const isSearching = (status: BookingStatus) => status === SEARCHING;
export const isCompleted = (status: BookingStatus) => status === COMPLETED;

export type ShootPhase = 'running' | 'warning' | 'overtime';

export function getShootPhase(leftMs: number, totalMs: number): ShootPhase {
  const warnMs = SHOOT_WARNING_MINUTES * 60 * 1000;
  if (leftMs <= 0) return 'overtime';
  return totalMs > warnMs && leftMs <= warnMs ? 'warning' : 'running';
}
