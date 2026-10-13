import { useEffect, useState } from 'react';
import { serverNow } from '../utils/serverClock';

/** Server-synced "now" that re-renders every `intervalMs` while enabled. */
export default function useNow(enabled = true, intervalMs = 1000) {
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    if (!enabled) return undefined;
    const timer = window.setInterval(() => setNow(serverNow()), intervalMs);
    return () => window.clearInterval(timer);
  }, [enabled, intervalMs]);

  return now;
}
