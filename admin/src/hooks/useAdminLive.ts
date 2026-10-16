import { useEffect, useRef } from 'react';
import { useSocketEvent } from '../context/SocketContext';
import { SOCKET_EVENTS } from '../config/events';
import type { AdminUpdate } from '../types';

/** Debounced refresh whenever anything changes on the platform (bookings, signups, duty toggles). */
export default function useAdminLive(onChange: (payload: AdminUpdate) => void, delay = 400) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useSocketEvent<AdminUpdate>(SOCKET_EVENTS.ADMIN_UPDATE, (payload) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(payload), delay);
  });
  useEffect(() => () => clearTimeout(timer.current), []);
}
