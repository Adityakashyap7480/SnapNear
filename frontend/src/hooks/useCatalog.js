import { useEffect, useState } from 'react';
import { catalogApi } from '../api/services';

let cache = null;

export default function useCatalog() {
  const [catalog, setCatalog] = useState(cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cache) return;
    catalogApi
      .get()
      .then((res) => {
        cache = res.catalog;
        setCatalog(res.catalog);
      })
      .catch((err) => setError(err.message));
  }, []);

  return { catalog, loading: !catalog && !error, error };
}
