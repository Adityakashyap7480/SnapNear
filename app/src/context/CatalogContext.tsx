import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { catalogApi } from '../api/services';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import { PageLoader } from '../components/ui/Spinner';
import Text from '../components/ui/Text';
import { SUPPORT_EMAIL } from '../config/constants';
import type { ApiFailure, Catalog } from '../types';
import { pct } from '../utils/format';

interface CatalogValue {
  catalog: Catalog;
  /** "80%" / "20%", from the backend's PLATFORM_FEE_PERCENT */
  partnerPct: string;
  platformPct: string;
  /** Cheapest package per service, e.g. { photo: 500, video: 999 } */
  startingPrice: Record<string, number>;
  supportEmail: string;
  startOtpLength: number;
  payoutHoldDays: number;
}

const CatalogContext = createContext<CatalogValue | null>(null);

/** Loads prices, the revenue split and app settings once so no screen hardcodes them. */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    setCatalog(null);
    catalogApi
      .get()
      .then((res) => {
        if (!res?.catalog) {
          setError('Catalog response was empty. Is the backend running?');
          return;
        }
        setCatalog(res.catalog);
      })
      .catch((err: ApiFailure) => setError(err.message || 'Unable to reach SnapNear servers'));
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
      startOtpLength: catalog.startOtpLength || 4,
      payoutHoldDays: catalog.payoutHoldDays || 7,
    };
  }, [catalog]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-slate-50 px-4">
        <Logo />
        <Text className="text-center text-sm font-semibold text-slate-700">{error}</Text>
        <Button variant="dark" icon={RefreshCw} onPress={load}>
          Try again
        </Button>
      </View>
    );
  }
  if (!value) {
    return (
      <View className="flex-1 bg-slate-50">
        <PageLoader />
      </View>
    );
  }

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider');
  return ctx;
}
