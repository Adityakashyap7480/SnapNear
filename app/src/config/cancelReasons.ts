/** Fixed cancel reasons shown in the cancel modal (pick one + optional remark). */

export const CLIENT_CANCEL_REASONS = [
  'Plans changed — shoot no longer needed',
  'Booked by mistake',
  'Found another photographer',
  'Wrong address, date, or time',
  'Taking too long / photographer delayed',
] as const;

export const PARTNER_CANCEL_REASONS = [
  'Unable to reach the location',
  'Equipment or gear issue',
  'Personal emergency',
  'Customer not responding',
  'Unsafe or unsuitable location',
] as const;

export type ClientCancelReason = (typeof CLIENT_CANCEL_REASONS)[number];
export type PartnerCancelReason = (typeof PARTNER_CANCEL_REASONS)[number];
