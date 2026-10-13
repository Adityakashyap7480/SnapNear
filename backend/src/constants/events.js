import { BOOKING_STATUS } from './roles.js';

// Must match frontend/src/config/events.js

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

export const BOOKING_EVENT_BY_STATUS = Object.freeze({
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
