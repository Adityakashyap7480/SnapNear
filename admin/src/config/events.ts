/** Realtime channels the backend emits to (must match backend/src/constants/events.ts). */
export const SOCKET_EVENTS = Object.freeze({
  BOOKING_UPDATE: 'booking:update',
  FEED_UPDATE: 'feed:update',
  ADMIN_UPDATE: 'admin:update',
  WALLET_PAYOUT: 'wallet:payout',
  ACCOUNT_RESTRICTED: 'account:restricted',
});

/** What happened to a booking; sent as `payload.event` on booking/feed/admin updates. */
export const BOOKING_EVENTS = Object.freeze({
  CREATED: 'booking:created',
  ACCEPTED: 'booking:accepted',
  ARRIVED: 'booking:arrived',
  SHOOTING: 'booking:shooting',
  COMPLETED: 'booking:completed',
  CANCELLED: 'booking:cancelled',
  PAID: 'booking:paid',
});

/** Browser events used to talk between the API client and React. */
export const APP_EVENTS = Object.freeze({
  UNAUTHORIZED: 'snapnear:unauthorized',
  ACCOUNT_RESTRICTED: 'snapnear:account-restricted',
});
