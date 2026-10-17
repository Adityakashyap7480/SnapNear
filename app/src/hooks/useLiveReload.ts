import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

type Opts = {
  /** When true, poll the server so missed socket events still update the UI. */
  active: boolean;
  reload: () => Promise<unknown> | unknown;
  /** Poll interval while `active` (ms). */
  intervalMs?: number;
};

/**
 * Keeps live booking screens fresh without a manual refresh:
 * - reconnect-friendly refetch when the app returns to foreground
 * - light polling while a shoot is in progress (socket can miss on free hosts / split servers)
 */
export default function useLiveReload({ active, reload, intervalMs = 4000 }: Opts) {
  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') void reloadRef.current();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => void reloadRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
}
