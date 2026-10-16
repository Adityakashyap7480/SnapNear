import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { catalogApi } from '../api/services';
import { PageLoader } from '../components/ui/Spinner';
import Logo from '../components/ui/Logo';
import { SUPPORT_EMAIL } from '../config/constants';
import type { ApiFailure, Catalog } from '../types';

interface CatalogValue {
  catalog: Catalog;
  /** "80%" / "20%", from the backend's PLATFORM_FEE_PERCENT */
  partnerPct: string;
  platformPct: string;
  /** Cheapest package per service, e.g. { photo: 500, video: 999 } */
  startingPrice: Record<string, number>;
  supportEmail: string;
}

const CatalogContext = createContext<CatalogValue | null>(null);

const pct = (share: number) => `${Number((share * 100).toFixed(1))}%`;

/** Loads prices & revenue split once so no screen hardcodes them. */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    catalogApi
      .get()
      .then((res) => setCatalog(res.catalog))
      .catch((err: ApiFailure) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  const value = useMemo(() => {
    if (!catalog) return null;
    const startingPrice = Object.fromEntries(
      Object.entries(catalog.tiers).map(([type, tiers]) => [type, Math.min(...tiers.map((t) => t.total))])
    );
    return {
      catalog,
      partnerPct: pct(catalog.creatorShare),
      platformPct: pct(catalog.platformShare),
      startingPrice,
      supportEmail: catalog.supportEmail || SUPPORT_EMAIL,
    };
  }, [catalog]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <Logo />
        <p className="text-sm font-semibold text-slate-700">{error}</p>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    );
  }
  if (!value) return <PageLoader />;

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider');
  return ctx;
}
