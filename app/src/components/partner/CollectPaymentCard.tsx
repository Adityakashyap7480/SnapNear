import { View, useWindowDimensions } from 'react-native';
import { QrCode } from 'lucide-react-native';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Gradient from '../ui/Gradient';
import SwipeButton from '../ui/SwipeButton';
import Text from '../ui/Text';
import { Ripple } from '../ui/motion';
import { useCatalog } from '../../context/CatalogContext';
import type { Booking } from '../../types';
import { colors } from '../../theme/colors';
import { formatINR, timeAgo } from '../../utils/format';

interface CollectPaymentCardProps {
  jobs: Booking[];
  onShowQr: (job: Booking) => void;
  onCollectCash: (job: Booking) => void;
  cashBusyId?: string | null;
}

/** Completed shoots whose customer hasn't paid yet; the partner can show a SnapNear payment QR, or collect cash. */
export default function CollectPaymentCard({ jobs, onShowQr, onCollectCash, cashBusyId }: CollectPaymentCardProps) {
  const { partnerPct } = useCatalog();
  const { width } = useWindowDimensions();
  const sm = width >= 640;

  return (
    <Gradient colors={[colors.orange[50], colors.amber[50], colors.white]} to="br" className="gap-3 overflow-hidden rounded-2xl border-2 border-brand-orange/40 p-4 sm:p-5">
      <View className="flex-row items-center gap-2">
        <View className="h-2.5 w-2.5">
          <Ripple variant="ping" className="absolute inset-0 rounded-full bg-brand-orange" />
          <View className="h-2.5 w-2.5 rounded-full bg-brand-orange" />
        </View>
        <Text className="font-display text-sm font-bold text-slate-900">Collect payment</Text>
        <Badge tone="brand">{jobs.length}</Badge>
      </View>

      <View className="gap-2.5">
        {jobs.map((j) => (
          <View key={j.id} className="gap-3 rounded-xl border border-orange-100 bg-white p-3">
            <View className={`gap-3 ${sm ? 'flex-row items-center justify-between' : ''}`}>
              <View className="min-w-0 shrink">
                <Text className="truncate text-sm font-bold text-slate-900">
                  {j.client.name} • {formatINR(j.total)}
                </Text>
                <Text className="text-[11px] text-slate-500">
                  {j.code} • {j.occasion} • completed {timeAgo(j.completedAt)}
                </Text>
                <Text className="text-[11px] font-semibold text-emerald-700">
                  Your {partnerPct}: {formatINR(j.creatorPayout, { fixed: true })} goes to your payout balance once paid online
                </Text>
              </View>
              <Button testID={`show-qr-${j.code}`} onPress={() => onShowQr(j)} icon={QrCode} className="shrink-0">
                Show Payment QR
              </Button>
            </View>
            <View>
              <SwipeButton
                testID={`cash-${j.code}`}
                label={`Cash Collected • ${formatINR(j.total)}`}
                loading={cashBusyId === j.id}
                disabled={Boolean(cashBusyId && cashBusyId !== j.id)}
                onSwipe={() => onCollectCash(j)}
              />
              <Text className="mt-1 text-center text-[10px] font-semibold text-slate-500">
                Swipe only after {j.client.name?.split(' ')[0] || 'the customer'} hands you the cash. You keep your share; SnapNear&apos;s fee is paid online next.
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Text className="text-[11px] leading-[18px] text-slate-600">
        The customer also sees a &quot;Pay&quot; button in their app for online payment. Cash collected here is recorded instantly for both of you.
      </Text>
    </Gradient>
  );
}
