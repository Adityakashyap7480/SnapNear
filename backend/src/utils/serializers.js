import { BOOKING_STATUS } from '../constants/roles.js';

const idOf = (ref) => (ref && ref._id ? ref._id.toString() : ref ? ref.toString() : null);

/**
 * Shapes a booking for API responses.
 * `hideClientContact` masks the client's phone for creators who have not accepted the job yet.
 */
export function serializeBooking(booking, { hideClientContact = false } = {}) {
  const b = booking.toObject ? booking.toObject() : booking;
  const creator = b.creator && b.creator._id ? b.creator : null;

  return {
    id: b._id.toString(),
    code: b.code,
    status: b.status,
    serviceType: b.serviceType,
    serviceLabel: b.serviceLabel,
    durationId: b.durationId,
    durationLabel: b.durationLabel,
    occasion: b.occasion,
    shootDate: b.shootDate,
    timeSlot: b.timeSlot,
    address: b.address,
    notes: b.notes,
    total: b.total,
    creatorPayout: b.creatorPayout,
    platformFee: b.platformFee,
    client: {
      id: idOf(b.client),
      name: b.contactName || b.clientSnapshot?.name,
      phone: hideClientContact ? null : b.contactPhone || b.clientSnapshot?.phone,
      accountName: b.clientSnapshot?.name,
      email: hideClientContact ? null : b.clientSnapshot?.email,
    },
    creator: b.creator
      ? {
          id: idOf(b.creator),
          name: creator?.name || b.creatorSnapshot?.name,
          phone: creator?.phone || b.creatorSnapshot?.phone,
          email: creator?.email || b.creatorSnapshot?.email,
          experienceYears: creator?.creatorProfile?.experienceYears,
          gear: creator?.creatorProfile?.gear,
          rating: creator?.creatorProfile?.rating,
        }
      : null,
    acceptedAt: b.acceptedAt,
    arrivedAt: b.arrivedAt,
    startedAt: b.startedAt,
    completedAt: b.completedAt,
    cancelledAt: b.cancelledAt,
    cancelledBy: b.cancelledBy,
    payment: b.payment?.status
      ? { status: b.payment.status, method: b.payment.method || null, via: b.payment.via || null, paidAt: b.payment.paidAt || null }
      : null,
    settlement: b.settlement?.status
      ? { status: b.settlement.status, eligibleAt: b.settlement.eligibleAt || null, paidAt: b.settlement.paidAt || null }
      : null,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    isOpen: b.status === BOOKING_STATUS.SEARCHING,
  };
}
