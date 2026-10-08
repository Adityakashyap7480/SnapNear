import { useEffect, useRef } from 'react';
import { useSocketEvent } from '../context/SocketContext';

/** Debounced refresh whenever anything changes on the platform (bookings, signups, duty toggles). */
export default function useAdminLive(onChange, delay = 400) {
  const timer = useRef(null);
  useSocketEvent('admin:update', (payload) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(payload), delay);
  });
  useEffect(() => () => clearTimeout(timer.current), []);
}
