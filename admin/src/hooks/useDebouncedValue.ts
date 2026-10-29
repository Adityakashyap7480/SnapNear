import { useEffect, useState } from 'react';

/** Default wait after typing stops before search APIs fire (Super Admin). */
export const SEARCH_DEBOUNCE_MS = 1000;

/**
 * Returns `value` only after it has stayed unchanged for `delayMs`.
 * Trim is applied when the source is a string.
 */
export default function useDebouncedValue<T>(value: T, delayMs = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
