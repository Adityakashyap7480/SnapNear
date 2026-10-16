import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AlarmClock, CheckCircle2, Clock, VolumeX } from 'lucide-react-native';
import Button from '../ui/Button';
import Gradient from '../ui/Gradient';
import GridPattern from '../ui/GridPattern';
import Overlay from '../ui/Overlay';
import Text from '../ui/Text';
import { PopIn, Ring, Ripple } from '../ui/motion';
import useNow from '../../hooks/useNow';
import { startAlarm, vibrate } from '../../lib/sound';
import type { Booking } from '../../types';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { formatClock, formatMinutes, formatTime } from '../../utils/format';

const VIBRATE_PATTERN = [400, 200, 400, 200, 800];
const VIBRATE_EVERY_MS = 2500;

type AlertRole = 'partner' | 'customer';

function copyFor(role: AlertRole, booking: Booking) {
  const minutes = formatMinutes(booking.durationMinutes || 60);
  if (role === 'partner') {
    const first = booking.client?.name?.split(' ')[0] || 'the customer';
    return {
      title: "Time's up!",
      message: `The ${minutes} shoot for ${first} is complete. Wrap up and mark it completed to collect payment.`,
    };
  }
  const first = booking.creator?.name?.split(' ')[0] || 'Your photographer';
  return {
    title: "Time's up!",
    message: `Your ${minutes} shoot is complete. ${first} will wrap up and mark it completed, then you can pay securely in the app.`,
  };
}

interface TimeUpAlertProps {
  booking: Booking;
  role: AlertRole;
  onDismiss: () => void;
  onComplete?: (booking: Booking) => void;
  completing?: boolean;
}

/**
 * Full-screen alarm shown to both the customer and the partner when the booked
 * shoot time runs out. Keeps ringing and vibrating until dismissed.
 */
export default function TimeUpAlert({ booking, role, onDismiss, onComplete, completing = false }: TimeUpAlertProps) {
  const now = useNow();
  const [muted, setMuted] = useState(false);
  const overtime = Math.max(0, now - new Date(booking.endsAt || 0).getTime());
  const copy = copyFor(role, booking);

  useEffect(() => {
    if (muted) return undefined;
    const stopAlarm = startAlarm();
    vibrate(VIBRATE_PATTERN);
    const buzz = setInterval(() => vibrate(VIBRATE_PATTERN), VIBRATE_EVERY_MS);
    return () => {
      stopAlarm();
      clearInterval(buzz);
      vibrate(0);
    };
  }, [muted]);

  const stats = [
    { label: 'Started', value: formatTime(booking.startedAt), labelClass: 'text-slate-500', valueClass: 'text-slate-900' },
    { label: 'Ended', value: formatTime(booking.endsAt), labelClass: 'text-slate-500', valueClass: 'text-slate-900' },
    { label: 'Overtime', value: `+${formatClock(overtime)}`, labelClass: 'text-red-500', valueClass: 'text-red-600' },
  ];

  return (
    <Overlay onRequestClose={onDismiss}>
      <View className="flex-1 items-center justify-center bg-slate-950/80 p-4" role="alertdialog" aria-modal aria-label={copy.title}>
        <PopIn className="w-full max-w-sm overflow-hidden rounded-3xl bg-white" style={shadows['2xl']}>
          <Gradient colors={[colors.rose[500], colors.red[500], colors.orange[500]]} to="br" className="overflow-hidden px-6 pb-14 pt-9">
            <GridPattern opacity={0.5} />
            <View className="h-24 w-24 items-center justify-center self-center">
              <Ripple className="absolute inset-0 rounded-full bg-white/40" />
              <Ripple className="absolute inset-0 rounded-full bg-white/30" delay={700} />
              <View className="h-24 w-24 items-center justify-center rounded-full bg-white" style={shadows.xl}>
                <Ring enabled={!muted}>
                  <AlarmClock size={48} color={colors.red[500]} strokeWidth={2.4} />
                </Ring>
              </View>
            </View>
            <Text className="mt-4 text-center text-xs font-bold uppercase tracking-widest text-red-100">
              {booking.code} • {booking.occasion}
            </Text>
            <Text role="heading" className="mt-1 text-center font-display text-3xl font-black text-white">
              {copy.title} ⏰
            </Text>
          </Gradient>

          <View className="-mt-8 px-5 pb-6">
            <View className="flex-row rounded-2xl border border-slate-100 bg-white py-3" style={shadows.lg}>
              {stats.map((s, i) => (
                <View key={s.label} className={`flex-1 items-center ${i > 0 ? 'border-l border-slate-100' : ''}`}>
                  <Text className={`text-[10px] font-semibold uppercase tracking-wide ${s.labelClass}`}>{s.label}</Text>
                  <Text className={`text-sm font-bold ${s.valueClass}`} style={{ fontVariant: ['tabular-nums'] }}>
                    {s.value}
                  </Text>
                </View>
              ))}
            </View>

            <Text className="mt-4 text-center text-sm leading-6 text-slate-600">{copy.message}</Text>

            <View className="mt-5 gap-2">
              {role === 'partner' ? (
                <>
                  <Button testID="timeup-complete" variant="success" size="lg" className="w-full" onPress={() => onComplete?.(booking)} loading={completing} icon={CheckCircle2}>
                    Mark Shoot Completed
                  </Button>
                  <Button variant="outline" className="w-full" onPress={onDismiss} disabled={completing} icon={Clock}>
                    Keep shooting (overtime)
                  </Button>
                </>
              ) : (
                <Button testID="timeup-ok" size="lg" className="w-full" onPress={onDismiss}>
                  OK, got it
                </Button>
              )}
              {!muted && (
                <Pressable onPress={() => setMuted(true)} className="flex-row items-center justify-center gap-1 self-center pt-1">
                  <VolumeX size={14} color={colors.slate[400]} />
                  <Text className="text-xs font-semibold text-slate-400">Silence alarm</Text>
                </Pressable>
              )}
            </View>
          </View>
        </PopIn>
      </View>
    </Overlay>
  );
}
