export const ROLES = {
  CLIENT: 'client',
  CREATOR: 'creator',
  SUPER_ADMIN: 'superadmin',
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BLOCKED: 'blocked',
} as const;
export type AccountStatus = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

export const BOOKING_STATUS = {
  SEARCHING: 'searching',
  ASSIGNED: 'assigned',
  ARRIVED: 'arrived',
  SHOOTING: 'shooting',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

// Payment is requested only once a shoot is completed; older bookings have no payment status.
export const PAYMENT_STATUS = {
  DUE: 'due',
  PAID: 'paid',
} as const;

export const SETTLEMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
} as const;

/** Cash-collected shoots: the partner owes SnapNear its platform share until they pay it online. */
export const PLATFORM_FEE_STATUS = {
  DUE: 'due',
  PAID: 'paid',
} as const;

/** Partner payout requests from the Wallet screen, worked manually by the Super Admin. */
export const PAYOUT_REQUEST_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
} as const;

export const SERVICE_TYPES = ['photo', 'video'] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const ACTIVE_JOB_STATUSES: BookingStatus[] = [
  BOOKING_STATUS.ASSIGNED,
  BOOKING_STATUS.ARRIVED,
  BOOKING_STATUS.SHOOTING,
];

// Allowed forward transitions a creator can make on an accepted job
export const CREATOR_TRANSITIONS: Partial<Record<BookingStatus, BookingStatus>> = {
  [BOOKING_STATUS.ASSIGNED]: BOOKING_STATUS.ARRIVED,
  [BOOKING_STATUS.ARRIVED]: BOOKING_STATUS.SHOOTING,
  [BOOKING_STATUS.SHOOTING]: BOOKING_STATUS.COMPLETED,
};
