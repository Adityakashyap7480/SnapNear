import { useCallback, useEffect, useState } from 'react';
import { BOOKING_STATUS, SHOOT_WARNING_MINUTES } from '../config/constants';
import { playChime, vibrate } from '../lib/sound';
import { kv } from '../lib/storage';
import toast from '../lib/toast';
import type { Booking } from '../types';
import { serverNow } from '../utils/serverClock';

const WARNING_MS = SHOOT_WARNING_MINUTES * 60 * 1000;
const storageKey = (role: string, id: string, kind: string) => `snapnear.shoot.${role}.${id}.${kind}`;

const wasShown = (role: string, id: string, kind: string) => kv.get(storageKey(role, id, kind)) === '1';
const markShown = (role: string, id: string, kind: string) => kv.set(storageKey(role, id, kind), '1');

/**
 * Watches running shoots: a "5 minutes left" nudge, then a full-screen time-up
 * alert. Each fires once per shoot per device, even across reloads.
 * Pass a memoized `bookings` array.
 */
export default function useShootAlerts(bookings: Booking[] | null, role: 'customer' | 'partner') {
  const [alertId, setAlertId] = useState<string | null>(null);

  useEffect(() => {
    const running = (bookings || []).filter((b) => b.status === BOOKING_STATUS.SHOOTING && b.endsAt);
    if (running.length === 0) {
      setAlertId(null);
      return undefined;
    }

    const check = () => {
      const now = serverNow();
      let timedUp: string | null = null;
      running.forEach((b) => {
        const end = new Date(b.endsAt as string).getTime();
        const left = end - now;
        const longEnoughToWarn = end - new Date(b.startedAt as string).getTime() > WARNING_MS;
        if (left <= 0) {
          if (!timedUp && !wasShown(role, b.id, 'timeup')) timedUp = b.id;
        } else if (longEnoughToWarn && left <= WARNING_MS && !wasShown(role, b.id, 'warn')) {
          markShown(role, b.id, 'warn');
          playChime('warning');
          vibrate(200);
          toast(`⏳ Only ${Math.ceil(left / 60000)} min left in shoot ${b.code}`, { duration: 8000 });
        }
      });
      setAlertId((current) => (current && running.some((b) => b.id === current) ? current : timedUp));
    };

    check();
    const timer = setInterval(check, 1000);
    return () => clearInterval(timer);
  }, [bookings, role]);

  const dismiss = useCallback(() => {
    if (alertId) markShown(role, alertId, 'timeup');
    setAlertId(null);
  }, [alertId, role]);

  const alertBooking = (bookings || []).find((b) => b.id === alertId && b.status === BOOKING_STATUS.SHOOTING) || null;
  return { alertBooking, dismiss };
}
