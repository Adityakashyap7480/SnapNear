import { BOOKING_STATUS } from '../constants/roles.js';
import { DURATION_MINUTES } from '../constants/pricing.js';

/**
 * Shapes a booking for API responses.
 * `b.creator` is the partner's live profile when attached with `withCreators`, else the saved snapshot is used.
 * `hideClientContact` masks the client's phone for creators who have not accepted the job yet.
 * `includeStartOtp` is only for the customer: the partner must hear the OTP from them.
 */
export function serializeBooking(b, { hideClientContact = false, includeStartOtp = false } = {}) {
  const creator = b.creator || null;

  return {
    id: b.id,
    code: b.code,
    status: b.status,
    serviceType: b.serviceType,
    serviceLabel: b.serviceLabel,
    durationId: b.durationId,
    durationLabel: b.durationLabel,
    durationMinutes: b.durationMinutes || DURATION_MINUTES[b.durationId] || null,
    occasion: b.occasion,
    shootDate: b.shootDate,
    timeSlot: b.timeSlot,
    address: b.address,
    notes: b.notes,
    total: b.total,
    creatorPayout: b.creatorPayout,
    platformFee: b.platformFee,
    client: {
      id: b.clientId,
      name: b.contactName || b.clientName,
      phone: hideClientContact ? null : b.contactPhone || b.clientPhone,
      accountName: b.clientName,
      email: hideClientContact ? null : b.clientEmail,
    },
    creator: b.creatorId
      ? {
          id: b.creatorId,
          name: creator?.name || b.creatorName,
          phone: creator?.phone || b.creatorPhone,
          email: creator?.email || b.creatorEmail,
          experienceYears: creator?.creatorProfile?.experienceYears,
          gear: creator?.creatorProfile?.gear,
          rating: creator?.creatorProfile?.rating,
        }
      : null,
    acceptedAt: b.acceptedAt,
    arrivedAt: b.arrivedAt,
    startedAt: b.startedAt,
    endsAt: b.endsAt || null,
    startOtp: includeStartOtp && b.status === BOOKING_STATUS.ARRIVED ? b.startOtpCode || null : undefined,
    completedAt: b.completedAt,
    cancelledAt: b.cancelledAt,
    cancelledBy: b.cancelledBy,
    payment: b.paymentStatus
      ? { status: b.paymentStatus, method: b.paymentMethod || null, via: b.paymentVia || null, paidAt: b.paidAt || null }
      : null,
    settlement: b.settlementStatus
      ? { status: b.settlementStatus, eligibleAt: b.settlementEligibleAt || null, paidAt: b.settledAt || null }
      : null,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    isOpen: b.status === BOOKING_STATUS.SEARCHING,
  };
}
