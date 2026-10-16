import { View, useWindowDimensions } from 'react-native';
import { EmptyState } from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import Text from '../ui/Text';
import PaymentBadge from '../payment/PaymentBadge';
import { useCatalog } from '../../context/CatalogContext';
import type { Booking } from '../../types';
import { isCompleted } from '../../utils/bookingStatus';
import { formatDate, formatINR } from '../../utils/format';

const payout = (h: Booking) => (isCompleted(h.status) ? formatINR(h.creatorPayout, { fixed: true }) : '—');

// Relative column widths of the md+ table
const COLS = { code: 1.1, customer: 1.3, shoot: 2.2, date: 1.2, payout: 1.1, status: 1.6 };

export default function JobHistory({ history }: { history: Booking[] }) {
  const { partnerPct } = useCatalog();
  const { width } = useWindowDimensions();

  if (history.length === 0) {
    return <EmptyState title="No completed jobs yet" description="Accepted shoots you finish will show up here with your payout." />;
  }

  if (width < 768) {
    return (
      <View>
        {history.map((h, i) => (
          <View key={h.id} className={`py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
            <View className="flex-row items-start justify-between gap-2">
              <View className="min-w-0 shrink">
                <Text className="text-sm font-bold text-slate-900">{h.client.name}</Text>
                <Text className="text-[11px] text-slate-500">
                  {h.code} • {h.occasion} • {h.durationLabel}
                </Text>
              </View>
              <View className="shrink-0 items-end gap-1">
                <StatusBadge status={h.status} />
                <PaymentBadge payment={h.payment} />
              </View>
            </View>
            <View className="mt-1.5 flex-row items-center justify-between">
              <Text className="text-xs text-slate-500">{formatDate(h.completedAt || h.shootDate)}</Text>
              <Text className="text-xs font-bold text-emerald-600">{payout(h)}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  }

  const head = 'text-[10px] font-semibold uppercase text-slate-500';
  const cell = 'text-xs text-slate-600';
  return (
    <View>
      <View className="flex-row border-b border-slate-100 py-2">
        <Text className={`${head} pr-3`} style={{ flex: COLS.code }}>Booking</Text>
        <Text className={`${head} pr-3`} style={{ flex: COLS.customer }}>Customer</Text>
        <Text className={`${head} pr-3`} style={{ flex: COLS.shoot }}>Shoot</Text>
        <Text className={`${head} pr-3`} style={{ flex: COLS.date }}>Date</Text>
        <Text className={`${head} pr-3 text-right`} style={{ flex: COLS.payout }}>Your {partnerPct}</Text>
        <Text className={`${head} text-right`} style={{ flex: COLS.status }}>Status</Text>
      </View>
      {history.map((h, i) => (
        <View key={h.id} className={`flex-row items-center py-2.5 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
          <Text className="pr-3 text-xs font-semibold text-slate-800" style={{ flex: COLS.code }}>{h.code}</Text>
          <Text className={`${cell} pr-3`} style={{ flex: COLS.customer }}>{h.client.name}</Text>
          <Text className={`${cell} pr-3`} style={{ flex: COLS.shoot }}>
            {h.occasion} • {h.durationLabel}
          </Text>
          <Text className={`${cell} pr-3`} style={{ flex: COLS.date }}>{formatDate(h.completedAt || h.shootDate)}</Text>
          <Text className="pr-3 text-right text-xs font-bold text-emerald-600" style={{ flex: COLS.payout }}>{payout(h)}</Text>
          <View className="flex-row items-center justify-end gap-1.5" style={{ flex: COLS.status }}>
            <PaymentBadge payment={h.payment} />
            <StatusBadge status={h.status} />
          </View>
        </View>
      ))}
    </View>
  );
}
