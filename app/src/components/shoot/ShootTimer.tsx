import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AlarmClock, Timer } from 'lucide-react-native';
import Text from '../ui/Text';
import { Pulse, Ring } from '../ui/motion';
import useNow from '../../hooks/useNow';
import { SHOOT_WARNING_MINUTES } from '../../config/constants';
import type { Booking } from '../../types';
import { colors } from '../../theme/colors';
import { getShootPhase } from '../../utils/bookingStatus';
import { formatClock, formatMinutes, formatTime } from '../../utils/format';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PHASES = {
  running: { stroke: colors.emerald[500], text: 'text-emerald-600', icon: colors.emerald[600], label: 'remaining' },
  warning: { stroke: colors.amber[500], text: 'text-amber-600', icon: colors.amber[600], label: 'remaining' },
  overtime: { stroke: colors.red[500], text: 'text-red-600', icon: colors.red[600], label: 'overtime' },
};

const TONES = {
  light: { track: colors.slate[100], time: 'text-slate-900', muted: 'text-slate-500', panel: 'border-slate-200 bg-slate-50' },
  dark: { track: colors.slate[700], time: 'text-white', muted: 'text-slate-400', panel: 'border-slate-800 bg-slate-950/60' },
};

interface ShootTimerProps {
  booking: Pick<Booking, 'startedAt' | 'endsAt' | 'durationMinutes'>;
  tone?: keyof typeof TONES;
}

/** Countdown ring for a running shoot; switches to an overtime counter once time is up. */
export default function ShootTimer({ booking, tone = 'light' }: ShootTimerProps) {
  const now = useNow();
  const start = new Date(booking.startedAt || 0).getTime();
  const end = new Date(booking.endsAt || 0).getTime();
  const left = end - now;
  const phase = getShootPhase(left, end - start);
  const meta = PHASES[phase];
  const t = TONES[tone];
  const remainingFraction = phase === 'overtime' ? 1 : Math.min(1, Math.max(0, left / Math.max(1, end - start)));
  const minutes = booking.durationMinutes || Math.round((end - start) / 60000);
  const overtime = phase === 'overtime';

  const progress = (
    <Circle
      cx="60"
      cy="60"
      r={RADIUS}
      fill="none"
      stroke={meta.stroke}
      strokeWidth="9"
      strokeLinecap="round"
      strokeDasharray={`${CIRCUMFERENCE}`}
      strokeDashoffset={CIRCUMFERENCE * (1 - remainingFraction)}
    />
  );

  return (
    <View className={`items-center gap-4 rounded-2xl border p-4 sm:flex-row sm:gap-5 ${t.panel}`}>
      <View className="h-32 w-32 shrink-0">
        <View className="absolute inset-0" style={{ transform: [{ rotate: '-90deg' }] }}>
          <Svg viewBox="0 0 120 120" width="100%" height="100%">
            <Circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="9" stroke={t.track} />
            {!overtime && progress}
          </Svg>
        </View>
        {overtime && (
          <Pulse className="absolute inset-0" style={{ transform: [{ rotate: '-90deg' }] }}>
            <Svg viewBox="0 0 120 120" width="100%" height="100%">
              {progress}
            </Svg>
          </Pulse>
        )}
        <View className="absolute inset-0 items-center justify-center">
          <Text
            role="timer"
            className={`font-display text-2xl font-black leading-none ${overtime ? meta.text : t.time}`}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {overtime ? '+' : ''}
            {formatClock(Math.abs(left))}
          </Text>
          <Text className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${meta.text}`}>{meta.label}</Text>
        </View>
      </View>

      <View className="w-full min-w-0 gap-2 sm:flex-1">
        <View className="flex-row items-center justify-center gap-1.5 sm:justify-start">
          {overtime ? (
            <Ring>
              <AlarmClock size={16} color={meta.icon} />
            </Ring>
          ) : (
            <Timer size={16} color={meta.icon} />
          )}
          <Text className={`font-display text-sm font-bold ${meta.text}`}>
            {overtime ? 'Booked time is over' : phase === 'warning' ? `Less than ${SHOOT_WARNING_MINUTES} minutes left` : 'Shoot in progress'}
          </Text>
        </View>
        <View className="flex-row gap-2">
          {[
            ['Booked', formatMinutes(minutes)],
            ['Started', formatTime(booking.startedAt)],
            ['Ends', formatTime(booking.endsAt)],
          ].map(([label, value]) => (
            <View key={label} className="flex-1 items-center sm:items-start">
              <Text className={`text-[11px] font-semibold ${t.muted}`}>{label}</Text>
              <Text className={`text-[11px] font-bold ${t.time}`}>{value}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
