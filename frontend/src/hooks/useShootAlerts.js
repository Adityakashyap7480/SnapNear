import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BOOKING_STATUS, SHOOT_WARNING_MINUTES } from '../config/constants';
import { serverNow } from '../utils/serverClock';
import { playChime, vibrate } from '../utils/sound';

const WARNING_MS = SHOOT_WARNING_MINUTES * 60 * 1000;
const storageKey = (role, id, kind) => `snapnear.shoot.${role}.${id}.${kind}`;

function wasShown(role, id, kind) {
  try {
    return localStorage.getItem(storageKey(role, id, kind)) === '1';
  } catch {
    return false;
  }
}

function markShown(role, id, kind) {
  try {
    localStorage.setItem(storageKey(role, id, kind), '1');
  } catch {
    /* storage unavailable */
  }
}

/**
 * Watches running shoots: a "5 minutes left" nudge, then a full-screen time-up
 * alert. Each fires once per shoot per device, even across reloads.
 * Pass a memoized `bookings` array.
 */
export default function useShootAlerts(bookings, role) {
  const [alertId, setAlertId] = useState(null);

  useEffect(() => {
    const running = (bookings || []).filter((b) => b.status === BOOKING_STATUS.SHOOTING && b.endsAt);
    if (running.length === 0) {
      setAlertId(null);
      return undefined;
    }

    const check = () => {
      const now = serverNow();
      let timedUp = null;
      running.forEach((b) => {
        const end = new Date(b.endsAt).getTime();
        const left = end - now;
        const longEnoughToWarn = end - new Date(b.startedAt).getTime() > WARNING_MS;
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
    const timer = window.setInterval(check, 1000);
    return () => window.clearInterval(timer);
  }, [bookings, role]);

  const dismiss = useCallback(() => {
    if (alertId) markShown(role, alertId, 'timeup');
    setAlertId(null);
  }, [alertId, role]);

  const alertBooking = (bookings || []).find((b) => b.id === alertId && b.status === BOOKING_STATUS.SHOOTING) || null;
  return { alertBooking, dismiss };
}
