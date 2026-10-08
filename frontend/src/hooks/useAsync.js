import { useCallback, useEffect, useRef, useState } from 'react';

/** Runs an async loader on mount and exposes `reload` for manual or realtime refreshes. */
export default function useAsync(loader, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async ({ silent = true } = {}) => {
    if (!silent) setLoading(true);
    try {
      const result = await loaderRef.current();
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      setError(err.message || 'Something went wrong');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload({ silent: false });
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, setData, error, loading, reload };
}
