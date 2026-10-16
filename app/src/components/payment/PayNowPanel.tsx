import { View } from 'react-native';
import { BadgeCheck, ShieldAlert, Smartphone } from 'lucide-react-native';
import Button from '../ui/Button';
import Gradient from '../ui/Gradient';
import Text from '../ui/Text';
import type { Booking } from '../../types';
import { colors } from '../../theme/colors';
import { isPaid, isPaymentDue, paymentMethodLabel } from '../../utils/bookingStatus';
import { formatDateTime, formatINR } from '../../utils/format';

const PAY_OPTIONS = ['GPay', 'PhonePe', 'Paytm', 'Any UPI', 'Cards'];

interface PayNowPanelProps {
  booking: Booking;
  onPay: (booking: Booking) => void;
  paying: boolean;
}

/** Customer-side payment state for a completed shoot: "Pay now" while due, a receipt once paid. */
export default function PayNowPanel({ booking, onPay, paying }: PayNowPanelProps) {
  if (isPaid(booking)) {
    return (
      <View className="flex-row items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <View className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500">
          <BadgeCheck size={20} color={colors.white} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-bold text-emerald-800">Paid {formatINR(booking.total)}</Text>
          <Text className="text-[11px] text-emerald-700">
            via {paymentMethodLabel(booking.payment?.method)} • {formatDateTime(booking.payment?.paidAt)}
          </Text>
        </View>
      </View>
    );
  }

  if (!isPaymentDue(booking)) return null;

  return (
    <Gradient
      colors={[colors.orange[50], colors.amber[50], colors.white]}
      to="br"
      className="gap-3 overflow-hidden rounded-2xl border border-orange-200 p-4"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-brand-orange">Payment pending</Text>
          <Text className="font-display text-sm font-bold text-slate-900">Your shoot is complete! 🎉</Text>
          <Text className="text-[11px] text-slate-500">Pay securely to wrap up your booking.</Text>
        </View>
        <Text className="shrink-0 font-display text-2xl font-black text-slate-900">{formatINR(booking.total)}</Text>
      </View>

      <Button testID="pay-now" size="lg" className="w-full" onPress={() => onPay(booking)} loading={paying} icon={Smartphone}>
        {`Pay ${formatINR(booking.total)}`}
      </Button>

      <View className="flex-row flex-wrap items-center justify-center gap-1.5">
        {PAY_OPTIONS.map((m) => (
          <View key={m} className="rounded-md border border-slate-200 bg-white px-2 py-0.5">
            <Text className="text-[10px] font-bold text-slate-500">{m}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row items-start gap-1.5 rounded-lg bg-white/80 p-2">
        <View className="mt-0.5">
          <ShieldAlert size={14} color={colors.amber[600]} />
        </View>
        <Text className="min-w-0 flex-1 text-[11px] leading-[18px] text-slate-600">
          Pay only through SnapNear: here, or by scanning the SnapNear QR on your photographer&apos;s phone. Please don&apos;t pay cash; cash
          payments aren&apos;t protected.
        </Text>
      </View>
    </Gradient>
  );
}
