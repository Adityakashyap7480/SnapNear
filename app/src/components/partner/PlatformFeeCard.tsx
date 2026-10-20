import { View } from 'react-native';
import { Landmark } from 'lucide-react-native';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Text from '../ui/Text';
import { useCatalog } from '../../context/CatalogContext';
import type { Booking } from '../../types';
import { formatINR } from '../../utils/format';

interface PlatformFeeCardProps {
  jobs: Booking[];
  payingId: string | null;
  onPay: (job: Booking) => void;
  /** Rendered inside the blocking popup: rows only, the popup supplies its own chrome. */
  embedded?: boolean;
}

/**
 * Cash-collected shoots whose platform share is unpaid. Shown in a blocking popup
 * (PlatformFeeModal); the data comes from the server, so it survives logout/login.
 */
export default function PlatformFeeCard({ jobs, payingId, onPay, embedded = false }: PlatformFeeCardProps) {
  const { platformPct } = useCatalog();
  if (jobs.length === 0) return null;

  return (
    <View className={embedded ? 'gap-3' : 'gap-3 rounded-2xl border-2 border-red-300 bg-red-50 p-4 sm:p-5'}>
      {!embedded && (
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-red-100">
            <Landmark size={17} color="#b91c1c" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-display text-sm font-bold text-red-800">Platform fee pending</Text>
            <Text className="text-[11px] font-semibold text-red-600">
              You collected cash for {jobs.length} shoot{jobs.length === 1 ? '' : 's'}. Pay SnapNear&apos;s {platformPct} share to fully settle.
            </Text>
          </View>
          <Badge tone="red">{jobs.length}</Badge>
        </View>
      )}

      <View className="gap-2.5">
        {jobs.map((j) => (
          <View key={j.id} className="gap-3 rounded-xl border border-red-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
            <View className="min-w-0 shrink">
              <Text className="truncate text-sm font-bold text-slate-900">
                {j.code} • Collected {formatINR(j.total)} in cash
              </Text>
              <Text className="text-[11px] text-slate-500">
                {j.client.name} • {j.occasion} • platform fee ({platformPct})
              </Text>
              <Text className="text-[11px] font-bold text-red-700">Fee due: {formatINR(j.platformFee, { fixed: true })}</Text>
            </View>
            <Button
              testID={`pay-fee-${j.code}`}
              variant="danger"
              loading={payingId === j.id}
              disabled={Boolean(payingId && payingId !== j.id)}
              onPress={() => onPay(j)}
              className="shrink-0"
            >
              Pay {formatINR(j.platformFee)}
            </Button>
          </View>
        ))}
      </View>

      <Text className="text-[11px] leading-[18px] text-red-500">
        Jab tak fee pay nahi hoti, naye shoots nahi milenge. Pay karte hi ye popup khud hat jayega.
      </Text>
    </View>
  );
}
