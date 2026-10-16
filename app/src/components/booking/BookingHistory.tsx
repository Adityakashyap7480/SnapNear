import { Pressable, View } from 'react-native';
import { CalendarClock, MapPin } from 'lucide-react-native';
import { EmptyState } from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import Text from '../ui/Text';
import PaymentBadge from '../payment/PaymentBadge';
import type { Booking } from '../../types';
import { colors } from '../../theme/colors';
import { OCCASION_EMOJI } from '../../utils/bookingStatus';
import { formatDate, formatINR, timeAgo } from '../../utils/format';

interface BookingHistoryProps {
  bookings: Booking[];
  selectedId?: string;
  onSelect?: (booking: Booking) => void;
}

export default function BookingHistory({ bookings, selectedId, onSelect }: BookingHistoryProps) {
  if (!bookings.length) {
    return <EmptyState icon={CalendarClock} title="No bookings yet" description="Your shoots will appear here once you book your first photographer." />;
  }

  return (
    <View>
      {bookings.map((b, i) => (
        <Pressable
          key={b.id}
          testID={`booking-${b.code}`}
          onPress={() => onSelect?.(b)}
          className={`w-full flex-row items-start gap-3 px-1 py-3 active:bg-slate-50 ${i > 0 ? 'border-t border-slate-100' : ''} ${
            selectedId === b.id ? 'bg-orange-50/50' : ''
          }`}
        >
          <View className="h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <Text className="text-lg">{OCCASION_EMOJI[b.occasion] || '✨'}</Text>
          </View>
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="min-w-0 shrink truncate text-sm font-bold text-slate-900">{b.occasion}</Text>
              <Text className="shrink-0 text-sm font-black text-slate-900">{formatINR(b.total)}</Text>
            </View>
            <Text className="text-[11px] text-slate-500">
              {b.code} • {b.serviceLabel} ({b.durationLabel}) • {formatDate(b.shootDate)}
            </Text>
            <View className="mt-1.5 flex-row flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <View className="min-w-0 flex-1 flex-row items-center gap-1" style={{ minWidth: 120 }}>
                <MapPin size={12} color={colors.slate[500]} />
                <Text className="min-w-0 flex-1 truncate text-[11px] text-slate-500">{b.creator ? `with ${b.creator.name}` : b.address}</Text>
              </View>
              <View className="shrink-0 flex-row items-center gap-2">
                <Text className="text-[10px] text-slate-400">{timeAgo(b.createdAt)}</Text>
                <PaymentBadge payment={b.payment} />
                <StatusBadge status={b.status} />
              </View>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
