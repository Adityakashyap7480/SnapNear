import { View } from 'react-native';
import { KeyRound, RefreshCw, ShieldCheck } from 'lucide-react-native';
import Button from '../ui/Button';
import Gradient from '../ui/Gradient';
import Text from '../ui/Text';
import { FadeUp } from '../ui/motion';
import type { Booking } from '../../types';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { formatMinutes } from '../../utils/format';

interface StartOtpPanelProps {
  booking: Booking;
  onRefresh: (booking: Booking) => void;
  refreshing: boolean;
}

/** Customer side: the start OTP they read out to the photographer. */
export default function StartOtpPanel({ booking, onRefresh, refreshing }: StartOtpPanelProps) {
  const otp = booking.startOtp || '';
  const first = booking.creator?.name?.split(' ')[0] || 'your photographer';

  return (
    <FadeUp className="overflow-hidden rounded-2xl border border-sky-200">
      <Gradient colors={[colors.sky[50], colors.white, colors.indigo[50]]} to="br">
        <View className="gap-3 p-4">
          <View className="flex-row items-center justify-center gap-1.5">
            <KeyRound size={14} color={colors.sky[700]} />
            <Text className="text-xs font-bold uppercase tracking-wider text-sky-700">Shoot start OTP</Text>
          </View>

          {otp ? (
            <View testID="start-otp" className="flex-row justify-center gap-2.5" accessibilityLabel={`OTP ${otp.split('').join(' ')}`}>
              {otp.split('').map((d, i) => (
                <View key={i} className="h-14 w-12 items-center justify-center rounded-xl border-2 border-sky-200 bg-white sm:h-16 sm:w-14" style={shadows.sm}>
                  <Text className="font-display text-3xl font-black text-slate-900" style={{ fontVariant: ['tabular-nums'] }}>
                    {d}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="py-3 text-center text-xs text-slate-500">Tap “New OTP” to get your code.</Text>
          )}

          <Text className="text-center text-xs leading-5 text-slate-600">
            Share this OTP with <Text className="text-xs font-bold text-slate-900">{first}</Text> once they&apos;re with you. Your{' '}
            <Text className="text-xs font-bold text-slate-900">{formatMinutes(booking.durationMinutes || 60)}</Text> timer starts the moment they enter
            it.
          </Text>
        </View>

        <View className="flex-row flex-wrap items-center justify-between gap-2 border-t border-sky-100 bg-white/70 px-4 py-2.5">
          <View className="flex-row items-center gap-1">
            <ShieldCheck size={14} color={colors.emerald[600]} />
            <Text className="text-[11px] font-semibold text-slate-500">Only share it in person</Text>
          </View>
          <Button variant="outline" size="sm" onPress={() => onRefresh(booking)} loading={refreshing} icon={RefreshCw} iconSize={12}>
            New OTP
          </Button>
        </View>
      </Gradient>
    </FadeUp>
  );
}
