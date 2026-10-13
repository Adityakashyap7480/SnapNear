import { useEffect, useRef } from 'react';
import { useSocketEvent } from '../context/SocketContext';
import { SOCKET_EVENTS } from '../config/events';

/** Debounced refresh whenever anything changes on the platform (bookings, signups, duty toggles). */
export default function useAdminLive(onChange, delay = 400) {
  const timer = useRef(null);
  useSocketEvent(SOCKET_EVENTS.ADMIN_UPDATE, (payload) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(payload), delay);
  });
  useEffect(() => () => clearTimeout(timer.current), []);
}
