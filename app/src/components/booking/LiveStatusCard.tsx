import { forwardRef } from 'react';
import { Pressable, View } from 'react-native';
import { BellRing, Camera, MapPinned, MessageCircle, PhoneCall, Radar, Star, X } from 'lucide-react-native';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Gradient from '../ui/Gradient';
import StatusBadge from '../ui/StatusBadge';
import Text from '../ui/Text';
import { Ripple, Spin } from '../ui/motion';
import PayNowPanel from '../payment/PayNowPanel';
import ShootTimer from '../shoot/ShootTimer';
import StartOtpPanel from '../shoot/StartOtpPanel';
import { BOOKING_STATUS, type BookingStatus } from '../../config/constants';
import { openLink } from '../../lib/links';
import type { Booking } from '../../types';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { STATUS_META, isCompleted, isSearching } from '../../utils/bookingStatus';
import { formatDate, formatINR } from '../../utils/format';

const STEP_TEXT: Partial<Record<BookingStatus, { label: string; eta: string }>> = {
  [BOOKING_STATUS.ASSIGNED]: { label: 'Photographer is heading to your location', eta: 'ETA ~15 mins' },
  [BOOKING_STATUS.ARRIVED]: { label: 'Photographer arrived at your doorstep', eta: 'Share OTP to start' },
  [BOOKING_STATUS.SHOOTING]: { label: 'Session in progress 📸', eta: 'Timer running' },
  [BOOKING_STATUS.COMPLETED]: { label: 'Shoot completed 🎉', eta: 'Done' },
};

/** Customer can cancel until the shoot OTP starts the timer. */
const CANCELLABLE: BookingStatus[] = [BOOKING_STATUS.SEARCHING, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.ARRIVED];

interface LiveStatusCardProps {
  booking: Booking | null;
  onCancel: (booking: Booking) => void;
  cancelling: boolean;
  onPay: (booking: Booking) => void;
  paying: boolean;
  onRefreshOtp: (booking: Booking) => void;
  refreshingOtp: boolean;
}

const LiveStatusCard = forwardRef<View, LiveStatusCardProps>(function LiveStatusCard(
  { booking, onCancel, cancelling, onPay, paying, onRefreshOtp, refreshingOtp },
  ref
) {
  if (!booking) {
    return (
      <View ref={ref} testID="booking-status" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5" style={shadows.sm}>
        <View className="flex-row items-center justify-between">
          <Text className="font-display text-sm font-bold text-slate-900">Current Shoot Status</Text>
          <Badge size="md">Ready to Book</Badge>
        </View>
        <View className="items-center py-6">
          <View className="mb-2">
            <MapPinned size={32} color={colors.slate[300]} />
          </View>
          <Text className="text-center text-xs text-slate-400">Fill in your shoot details and we&apos;ll find a nearby photographer instantly.</Text>
        </View>
      </View>
    );
  }

  const { status, creator } = booking;
  const step = STEP_TEXT[status];
  const canCancel = CANCELLABLE.includes(status);
  const searching = isSearching(status);
  const completed = isCompleted(status);
  const waPhone = creator?.phone ? `91${creator.phone}` : '';
  const waText = encodeURIComponent(
    `Hi ${creator?.name?.split(' ')[0] || ''}, I booked you on SnapNear (${booking.code}). Can you confirm your arrival time?`
  );

  return (
    <View ref={ref} testID="booking-status" className="gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5" style={shadows.sm}>
      <View className="flex-row flex-wrap items-start justify-between gap-2">
        <View className="min-w-0 shrink">
          <Text className="font-display text-sm font-bold text-slate-900">Current Shoot Status</Text>
          <Text className="text-[11px] text-slate-500">
            {booking.code} • {booking.serviceLabel} ({booking.durationLabel}) • {formatINR(booking.total)}
          </Text>
        </View>
        <StatusBadge status={status} long pulse={searching} />
      </View>

      {searching && (
        <View className="items-center justify-center py-5">
          <View className="mb-3 h-16 w-16 items-center justify-center">
            <Ripple className="absolute inset-0 rounded-full bg-brand-orange/20" />
            <Ripple className="absolute inset-0 rounded-full bg-brand-orange/20" delay={1000} />
            <View className="z-10 h-12 w-12 items-center justify-center rounded-full bg-brand-orange" style={shadows.md}>
              <Spin duration={3000}>
                <Radar size={24} color={colors.white} />
              </Spin>
            </View>
          </View>
          <Text className="text-center text-xs font-bold text-slate-800">Finding nearby photographers...</Text>
          <Text className="mt-0.5 text-center text-[11px] text-slate-500">{booking.address}</Text>
          <View className="mt-3 flex-row items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5">
            <BellRing size={14} color={colors.brand.violet} />
            <Text className="shrink text-[11px] text-brand-violet">You&apos;ll be notified the moment a photographer accepts.</Text>
          </View>
        </View>
      )}

      {creator && status !== BOOKING_STATUS.CANCELLED && (
        <View className="gap-4 border-t border-slate-100 pt-4">
          <View className="flex-row items-start gap-3">
            <Avatar name={creator.name} size="lg" ring={colors.emerald[500]} />
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="min-w-0 shrink truncate text-sm font-bold text-slate-900">{creator.name}</Text>
                <View className="flex-row items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5">
                  <Star size={12} color={colors.amber[500]} fill={colors.amber[500]} />
                  <Text className="text-xs font-bold text-amber-700">{(creator.rating ?? 5).toFixed(1)}</Text>
                </View>
              </View>
              {creator.experienceYears !== undefined && (
                <View className="mt-1 self-start rounded-md bg-indigo-50 px-2 py-0.5">
                  <Text className="text-[11px] font-bold text-indigo-700">{creator.experienceYears}+ Years Experience</Text>
                </View>
              )}
              {creator.gear ? (
                <View className="mt-1 flex-row items-center gap-1">
                  <Camera size={12} color={colors.slate[400]} />
                  <Text className="min-w-0 flex-1 truncate text-[11px] text-slate-600">{creator.gear}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {step && (
            <View className="gap-1.5">
              <View className="flex-row flex-wrap justify-between gap-x-2">
                <Text className="text-[11px] font-semibold text-slate-700">{step.label}</Text>
                <Text className="text-[11px] font-semibold text-emerald-600">{step.eta}</Text>
              </View>
              <View className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <Gradient colors={[colors.brand.orange, colors.emerald[500]]} className="h-2 rounded-full" style={{ width: `${STATUS_META[status].progress}%` }} />
              </View>
            </View>
          )}

          {status === BOOKING_STATUS.ARRIVED && <StartOtpPanel booking={booking} onRefresh={onRefreshOtp} refreshing={refreshingOtp} />}
          {status === BOOKING_STATUS.SHOOTING && booking.endsAt && <ShootTimer booking={booking} />}

          {!completed && creator.phone && (
            <View className="flex-row gap-2">
              <Pressable
                accessibilityRole="link"
                onPress={() => openLink(`tel:+91${creator.phone}`)}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 active:bg-slate-50"
              >
                <PhoneCall size={14} color={colors.emerald[600]} />
                <Text className="text-xs font-semibold text-slate-700">Call Photographer</Text>
              </Pressable>
              <Pressable
                accessibilityRole="link"
                onPress={() => openLink(`https://wa.me/${waPhone}?text=${waText}`)}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 active:bg-emerald-700"
              >
                <MessageCircle size={14} color={colors.white} />
                <Text className="text-xs font-semibold text-white">WhatsApp</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {completed && <PayNowPanel booking={booking} onPay={onPay} paying={paying} />}

      <View className="flex-row flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <Text className="text-[11px] text-slate-500">
          {formatDate(booking.shootDate)} • {booking.timeSlot}
        </Text>
        {canCancel && (
          <Button testID="cancel-booking" variant="danger" size="sm" onPress={() => onCancel(booking)} loading={cancelling} icon={X} iconSize={12}>
            Cancel
          </Button>
        )}
      </View>
    </View>
  );
});

export default LiveStatusCard;
