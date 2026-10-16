import { BOOKING_STATUS, type BookingStatus } from './roles.js';

// Must match the apps' socket event names

/** Socket.io channels clients listen on. */
export const SOCKET_EVENTS = Object.freeze({
  BOOKING_UPDATE: 'booking:update',
  FEED_UPDATE: 'feed:update',
  ADMIN_UPDATE: 'admin:update',
  WALLET_PAYOUT: 'wallet:payout',
  ACCOUNT_RESTRICTED: 'account:restricted',
});

/** What happened to a booking; sent as `payload.event`. */
export const BOOKING_EVENTS = Object.freeze({
  CREATED: 'booking:created',
  ACCEPTED: 'booking:accepted',
  ARRIVED: 'booking:arrived',
  SHOOTING: 'booking:shooting',
  COMPLETED: 'booking:completed',
  CANCELLED: 'booking:cancelled',
  PAID: 'booking:paid',
});
export type BookingEvent = (typeof BOOKING_EVENTS)[keyof typeof BOOKING_EVENTS];

export const BOOKING_EVENT_BY_STATUS: Partial<Record<BookingStatus, BookingEvent>> = Object.freeze({
  [BOOKING_STATUS.ARRIVED]: BOOKING_EVENTS.ARRIVED,
  [BOOKING_STATUS.SHOOTING]: BOOKING_EVENTS.SHOOTING,
  [BOOKING_STATUS.COMPLETED]: BOOKING_EVENTS.COMPLETED,
});

/** Admin-only activity, sent as `payload.event` on SOCKET_EVENTS.ADMIN_UPDATE. */
export const ADMIN_EVENTS = Object.freeze({
  USER_NEW: 'user:new',
  USER_STATUS: 'user:status',
  CREATOR_DUTY: 'creator:duty',
  PAYOUT_PAID: 'payout:paid',
});
