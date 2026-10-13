export const ROLES = {
  CLIENT: 'client',
  CREATOR: 'creator',
  SUPER_ADMIN: 'superadmin',
};

export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BLOCKED: 'blocked',
};

export const BOOKING_STATUS = {
  SEARCHING: 'searching',
  ASSIGNED: 'assigned',
  ARRIVED: 'arrived',
  SHOOTING: 'shooting',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Payment is requested only once a shoot is completed; older bookings have no payment status.
export const PAYMENT_STATUS = {
  DUE: 'due',
  PAID: 'paid',
};

export const SETTLEMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
};

export const ACTIVE_JOB_STATUSES = [
  BOOKING_STATUS.ASSIGNED,
  BOOKING_STATUS.ARRIVED,
  BOOKING_STATUS.SHOOTING,
];

// Allowed forward transitions a creator can make on an accepted job
export const CREATOR_TRANSITIONS = {
  [BOOKING_STATUS.ASSIGNED]: BOOKING_STATUS.ARRIVED,
  [BOOKING_STATUS.ARRIVED]: BOOKING_STATUS.SHOOTING,
  [BOOKING_STATUS.SHOOTING]: BOOKING_STATUS.COMPLETED,
};
