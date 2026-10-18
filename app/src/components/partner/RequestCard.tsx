import { View, useWindowDimensions } from 'react-native';
import { Calendar, Check, MapPin, StickyNote, Timer, X } from 'lucide-react-native';
import Button from '../ui/Button';
import Gradient from '../ui/Gradient';
import Text from '../ui/Text';
import { useCatalog } from '../../context/CatalogContext';
import type { Booking } from '../../types';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { OCCASION_EMOJI } from '../../utils/bookingStatus';
import { formatDate, formatINR, timeAgo } from '../../utils/format';

interface RequestCardProps {
  request: Booking;
  onAccept: (request: Booking) => void;
  onDecline: (request: Booking) => void;
  busy: boolean;
  disabledReason?: string;
}

export default function RequestCard({ request, onAccept, onDecline, busy, disabledReason }: RequestCardProps) {
  const { partnerPct } = useCatalog();
  const { width } = useWindowDimensions();
  const sm = width >= 640;
  const md = width >= 768;
  const isVideo = request.serviceType === 'video';
  const acceptBlocked = Boolean(disabledReason);

  return (
    <View className="overflow-hidden rounded-2xl border-2 border-brand-orange/40" style={shadows.lg}>
      <Gradient colors={[colors.white, 'rgba(255, 247, 237, 0.4)']} to="br" className="p-4 sm:p-5" pointerEvents="box-none">
        <View pointerEvents="none" className="absolute right-0 top-0 flex-row items-center gap-1 rounded-bl-xl bg-brand-orange px-3 py-1">
          <Timer size={12} color={colors.white} />
          <Text className="text-[11px] font-bold text-white">{timeAgo(request.createdAt)}</Text>
        </View>

        <View className={`mt-4 justify-between gap-4 sm:mt-2 ${md ? 'flex-row items-center' : ''}`}>
          <View className="min-w-0 md:flex-1">
            <View className={`mb-1 flex-row flex-wrap items-center gap-2 ${sm ? '' : 'pr-20'}`}>
              <View className={`rounded-md px-2.5 py-0.5 ${isVideo ? 'bg-indigo-100' : 'bg-orange-100'}`}>
                <Text className={`text-xs font-bold ${isVideo ? 'text-brand-violet' : 'text-brand-orange'}`}>
                  {request.serviceLabel} • {request.durationLabel}
                </Text>
              </View>
              <Text className="text-[11px] font-semibold text-slate-500">{request.code}</Text>
            </View>

            <Text className="font-display text-base font-bold text-slate-900 sm:text-lg">
              {OCCASION_EMOJI[request.occasion] || '✨'} {request.occasion}
            </Text>

            <View className="mt-1 flex-row items-start gap-1">
              <View className="mt-0.5">
                <MapPin size={14} color={colors.slate[400]} />
              </View>
              <Text className="min-w-0 flex-1 text-xs text-slate-600">{request.address}</Text>
            </View>
            <View className="mt-1 flex-row items-start gap-1">
              <View className="mt-0.5">
                <Calendar size={14} color={colors.slate[400]} />
              </View>
              <Text className="min-w-0 flex-1 text-xs text-slate-600">
                {formatDate(request.shootDate)} • {request.timeSlot}
              </Text>
            </View>
            {request.notes ? (
              <View className="mt-1 flex-row items-start gap-1">
                <View className="mt-0.5">
                  <StickyNote size={14} color={colors.slate[400]} />
                </View>
                <Text className="min-w-0 flex-1 text-xs italic text-slate-500">{request.notes}</Text>
              </View>
            ) : null}
            <Text className="mt-2 text-xs text-slate-500">
              Customer: <Text className="text-xs font-semibold text-slate-800">{request.client.name}</Text>
              <Text className="text-xs text-slate-400"> • contact shared after you accept</Text>
            </Text>
          </View>

          <View
            className={`shrink-0 gap-3 rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 ${
              md ? '' : sm ? 'flex-row items-center justify-between' : ''
            }`}
            style={shadows.sm}
          >
            <View className={md ? 'items-center' : ''}>
              <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your take-home ({partnerPct})</Text>
              <Text className="font-display text-2xl font-black text-emerald-600">{formatINR(request.creatorPayout, { fixed: true })}</Text>
              <Text className="text-[10px] text-slate-400">(Customer pays: {formatINR(request.total)})</Text>
            </View>
            <View className={`flex-row gap-2 ${sm ? 'min-w-[220px]' : 'w-full'}`}>
              <Button
                testID={`skip-${request.code}`}
                accessibilityLabel="Skip this request"
                variant="outline"
                size="md"
                onPress={() => onDecline(request)}
                disabled={busy}
                icon={X}
              >
                Skip
              </Button>
              <Button
                testID={`accept-${request.code}`}
                accessibilityLabel={disabledReason || 'Accept this shoot'}
                variant="success"
                size="md"
                className="flex-1"
                onPress={() => {
                  if (acceptBlocked || busy) return;
                  onAccept(request);
                }}
                loading={busy}
                disabled={acceptBlocked}
                icon={Check}
                iconSize={16}
              >
                Accept Shoot
              </Button>
            </View>
            {disabledReason ? (
              <Text className="mt-2 text-center text-xs font-medium leading-4 text-amber-700">{disabledReason}</Text>
            ) : null}
          </View>
        </View>
      </Gradient>
    </View>
  );
}
