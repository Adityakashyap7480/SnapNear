import { useEffect, useRef } from 'react';
import { BOOKING_STATUS, type BookingStatus } from '../config/constants';
import { BOOKING_EVENTS } from '../config/events';
import { playChime } from '../lib/sound';
import toast from '../lib/toast';
import type { Booking } from '../types';
import { formatINR, formatMinutes } from '../utils/format';

const otpToastId = (bookingId: string) => `start-otp-${bookingId}`;

const STATUS_EVENT: Partial<Record<BookingStatus, string>> = {
  [BOOKING_STATUS.ASSIGNED]: BOOKING_EVENTS.ACCEPTED,
  [BOOKING_STATUS.ARRIVED]: BOOKING_EVENTS.ARRIVED,
  [BOOKING_STATUS.SHOOTING]: BOOKING_EVENTS.SHOOTING,
  [BOOKING_STATUS.COMPLETED]: BOOKING_EVENTS.COMPLETED,
  [BOOKING_STATUS.CANCELLED]: BOOKING_EVENTS.CANCELLED,
};

const TOASTS: Record<string, (b: Booking) => string> = {
  [BOOKING_EVENTS.ACCEPTED]: (b) => `🎉 ${b.creator?.name || 'A photographer'} accepted your shoot!`,
  [BOOKING_EVENTS.ARRIVED]: (b) =>
    `📍 ${b.creator?.name || 'Your photographer'} has arrived!${b.startOtp ? ` Share OTP ${b.startOtp} to start your shoot.` : ''}`,
  [BOOKING_EVENTS.SHOOTING]: (b) => `📸 Your shoot has started! ${formatMinutes(b.durationMinutes || 60)} timer is running.`,
  [BOOKING_EVENTS.COMPLETED]: (b) => `✅ Shoot completed! Please pay ${formatINR(b.total)} to finish your booking.`,
  [BOOKING_EVENTS.CANCELLED]: () => 'Booking was cancelled',
};

type Opts = {
  bookings: Booking[];
  /** Skip the first paint so we don't toast for already-loaded statuses. */
  ready: boolean;
  onPaid?: (b: Booking) => void;
  onSpotlight?: (bookingId: string) => void;
};

/**
 * When bookings refresh via poll (or a late socket), toast status transitions
 * the same way a live `booking:update` would.
 */
export default function useBookingStatusToasts({ bookings, ready, onPaid, onSpotlight }: Opts) {
  const prev = useRef<Record<string, { status: string; paid?: string | null }>>({});
  const primed = useRef(false);

  useEffect(() => {
    if (!ready) return;

    if (!primed.current) {
      for (const b of bookings) {
        prev.current[b.id] = { status: b.status, paid: b.payment?.status ?? null };
      }
      primed.current = true;
      return;
    }

    for (const b of bookings) {
      const was = prev.current[b.id];
      const paidNow = b.payment?.status ?? null;
      prev.current[b.id] = { status: b.status, paid: paidNow };

      if (!was) continue;

      if (was.status !== b.status) {
        const event = STATUS_EVENT[b.status as BookingStatus];
        if (event === BOOKING_EVENTS.SHOOTING) toast.dismiss(otpToastId(b.id));
        const message = event ? TOASTS[event]?.(b) : undefined;
        if (message) {
          playChime(event === BOOKING_EVENTS.ACCEPTED ? 'broadcast' : 'ping');
          const id = event === BOOKING_EVENTS.ARRIVED ? otpToastId(b.id) : undefined;
          const spotlight = event === BOOKING_EVENTS.ARRIVED || event === BOOKING_EVENTS.SHOOTING || event === BOOKING_EVENTS.COMPLETED;
          toast(message, { id, icon: null, duration: spotlight ? 7000 : 4000 });
          if (spotlight) onSpotlight?.(b.id);
        }
      }

      if (was.paid !== 'paid' && paidNow === 'paid') {
        onPaid?.(b);
      }
    }
  }, [bookings, ready, onPaid, onSpotlight]);
}
