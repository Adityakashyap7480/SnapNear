import { BOOKING_STATUS, type BookingStatus, PAYMENT_STATUS, SHOOT_WARNING_MINUTES } from '../config/constants';
import type { Booking } from '../types';

const { SEARCHING, ASSIGNED, ARRIVED, SHOOTING, COMPLETED, CANCELLED } = BOOKING_STATUS;

interface StatusMeta {
  label: string;
  short: string;
  /** Pill background + border */
  box: string;
  text: string;
  dot: string;
  progress: number;
}

export const STATUS_META: Record<BookingStatus, StatusMeta> = {
  [SEARCHING]: {
    label: 'Finding Photographer',
    short: 'Searching',
    box: 'bg-amber-100 border-amber-200',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    progress: 15,
  },
  [ASSIGNED]: {
    label: 'Photographer On The Way',
    short: 'Assigned',
    box: 'bg-indigo-100 border-indigo-200',
    text: 'text-indigo-800',
    dot: 'bg-indigo-500',
    progress: 45,
  },
  [ARRIVED]: {
    label: 'Photographer Arrived',
    short: 'Arrived',
    box: 'bg-sky-100 border-sky-200',
    text: 'text-sky-800',
    dot: 'bg-sky-500',
    progress: 70,
  },
  [SHOOTING]: {
    label: 'Shoot In Progress',
    short: 'Shooting',
    box: 'bg-orange-100 border-orange-200',
    text: 'text-orange-800',
    dot: 'bg-orange-500',
    progress: 88,
  },
  [COMPLETED]: {
    label: 'Shoot Completed',
    short: 'Completed',
    box: 'bg-emerald-100 border-emerald-200',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    progress: 100,
  },
  [CANCELLED]: {
    label: 'Cancelled',
    short: 'Cancelled',
    box: 'bg-slate-100 border-slate-200',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    progress: 0,
  },
};

export const ACTIVE_STATUSES: BookingStatus[] = [SEARCHING, ASSIGNED, ARRIVED, SHOOTING];

export const isActive = (status: BookingStatus) => ACTIVE_STATUSES.includes(status);
export const isSearching = (status: BookingStatus) => status === SEARCHING;
export const isCompleted = (status: BookingStatus) => status === COMPLETED;

// ARRIVED -> SHOOTING happens through the customer's start OTP, not a button
export const CREATOR_NEXT_ACTION: Partial<Record<BookingStatus, { label: string; next: BookingStatus }>> = {
  [ASSIGNED]: { label: 'Reached Venue', next: ARRIVED },
  [SHOOTING]: { label: 'Mark Completed', next: COMPLETED },
};

export const OCCASION_EMOJI: Record<string, string> = {
  'Birthday Celebration': '🎂',
  'Instagram / Fashion Shoot': '📸',
  'Baby & Maternity': '👶',
  'Family Portrait': '👨‍👩‍👧',
  'Society / Clubhouse Event': '🏢',
  'Product / Business': '🛍️',
  'Car Shoot': '🚗',
  'Pooja Shoot': '🙏',
  'Vlog Shoot': '🎬',
};

/** Small thumbnails shown under each Shoot Occasion chip (web + Android). */
export const OCCASION_IMAGES: Record<string, number> = {
  'Birthday Celebration': require('../../assets/occasions/birthday.jpg'),
  'Instagram / Fashion Shoot': require('../../assets/occasions/fashion.jpg'),
  'Baby & Maternity': require('../../assets/occasions/maternity.jpg'),
  'Family Portrait': require('../../assets/occasions/family.jpg'),
  'Society / Clubhouse Event': require('../../assets/occasions/society.jpg'),
  'Product / Business': require('../../assets/occasions/product.jpg'),
  'Car Shoot': require('../../assets/occasions/car.jpg'),
  'Pooja Shoot': require('../../assets/occasions/pooja.jpg'),
  'Vlog Shoot': require('../../assets/occasions/vlog.jpg'),
};

export type ShootPhase = 'running' | 'warning' | 'overtime';

export function getShootPhase(leftMs: number, totalMs: number): ShootPhase {
  const warnMs = SHOOT_WARNING_MINUTES * 60 * 1000;
  if (leftMs <= 0) return 'overtime';
  return totalMs > warnMs && leftMs <= warnMs ? 'warning' : 'running';
}

const METHOD_LABELS: Record<string, string> = {
  upi: 'UPI',
  cash: 'Cash',
  card: 'Card',
  netbanking: 'Net Banking',
  wallet: 'Wallet',
  emi: 'EMI',
  paylater: 'Pay Later',
};

export const paymentMethodLabel = (method?: string | null) =>
  (method && METHOD_LABELS[method]) || (method ? method[0].toUpperCase() + method.slice(1) : 'Online');

export const isPaymentDue = (booking?: Pick<Booking, 'payment'> | null) => booking?.payment?.status === PAYMENT_STATUS.DUE;
export const isPaid = (booking?: Pick<Booking, 'payment'> | null) => booking?.payment?.status === PAYMENT_STATUS.PAID;
