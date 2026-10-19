import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Check, ShieldCheck, Wallet, type LucideIcon } from 'lucide-react-native';
import Confetti from './Confetti';
import Gradient from '../ui/Gradient';
import GridPattern from '../ui/GridPattern';
import Overlay from '../ui/Overlay';
import Text from '../ui/Text';
import { GiftShake, PopIn, Ripple, Sparkle } from '../ui/motion';
import { useCatalog } from '../../context/CatalogContext';
import { playChime, vibrate } from '../../lib/sound';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { paymentMethodLabel } from '../../utils/bookingStatus';
import { formatINR } from '../../utils/format';

const OPEN_DELAY_MS = 750;
const SPARKLES = [
  { icon: '✨', className: 'top-4 left-6', delay: 0 },
  { icon: '💸', className: 'top-10 right-7', delay: 600 },
  { icon: '🎉', className: 'bottom-16 left-10', delay: 1100 },
  { icon: '⭐', className: 'bottom-20 right-12', delay: 1600 },
];

export interface Celebration {
  role: 'partner' | 'customer';
  amount: number;
  code: string;
  method?: string | null;
  /** Partner: their share credited to earnings / payout balance */
  credited?: number;
  holdDays?: number;
  /** The other party's name */
  counterpart?: string | null;
  viewerName?: string;
}

function useCountUp(target: number, running: boolean, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!running) return undefined;
    let frame: number;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(progress === 1 ? target : target * (1 - (1 - progress) ** 3));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, running, duration]);
  return value;
}

function copyFor(c: Celebration, partnerPct: string) {
  const first = (name?: string | null) => name?.split(' ')[0] || '';
  if (c.role === 'partner') {
    return {
      eyebrow: 'Ka-ching! 💸',
      title: 'Payment Received!',
      amountLabel: `${first(c.counterpart) || 'Customer'} paid`,
      message: `${formatINR(c.credited, { fixed: true })} (your ${partnerPct}) has been added to your payout balance. It will be sent to your UPI within ${c.holdDays || 7} days.`,
      chip: { icon: Wallet as LucideIcon, text: `+${formatINR(c.credited, { fixed: true })} added to your balance`, box: 'bg-emerald-50', text_: 'text-emerald-700', color: colors.emerald[700] },
    };
  }
  return {
    eyebrow: `Thank you${c.viewerName ? `, ${first(c.viewerName)}` : ''}! 💛`,
    title: 'Payment Successful!',
    amountLabel: 'Amount paid',
    message: `Your payment for ${c.code} is confirmed${c.counterpart ? ` and ${first(c.counterpart)} has been notified` : ''}. Enjoy your photos!`,
    chip: { icon: ShieldCheck as LucideIcon, text: 'Paid securely to SnapNear via Razorpay', box: 'bg-indigo-50', text_: 'text-brand-violet', color: colors.brand.violet },
  };
}

/**
 * Full-screen "gift opens -> confetti -> amount counts up" moment shown to both
 * the customer (after paying) and the partner (when the payment lands).
 * Render with a unique `key` per payment so the animation replays.
 */
export default function PaymentCelebration({ celebration, onClose }: { celebration: Celebration; onClose: () => void }) {
  const { partnerPct } = useCatalog();
  const [opened, setOpened] = useState(false);
  const amount = useCountUp(celebration.amount, opened);
  const copy = copyFor(celebration, partnerPct);
  const ChipIcon = copy.chip.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpened(true);
      playChime('success');
      vibrate([60, 40, 120]);
    }, OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Overlay onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal aria-label={copy.title}>
        <PopIn className="w-full max-w-sm overflow-hidden rounded-3xl bg-white" style={shadows['2xl']}>
          <Gradient colors={[colors.emerald[500], colors.teal[500], colors.emerald[700]]} to="br" className="overflow-hidden px-6 pb-14 pt-8">
            <GridPattern opacity={0.6} />
            {SPARKLES.map((s) => (
              <Sparkle key={s.icon} delay={s.delay} className={`absolute ${s.className}`}>
                <Text className="text-lg">{s.icon}</Text>
              </Sparkle>
            ))}

            <View className="h-24 w-24 items-center justify-center self-center">
              {opened ? (
                <>
                  <Ripple className="absolute inset-0 rounded-full bg-white/40" />
                  <Ripple className="absolute inset-0 rounded-full bg-white/30" delay={800} />
                  <PopIn className="h-24 w-24 items-center justify-center rounded-full bg-white" style={shadows.xl}>
                    <Check size={48} color={colors.emerald[600]} strokeWidth={3} />
                  </PopIn>
                </>
              ) : (
                <GiftShake>
                  <Text className="text-7xl" style={{ lineHeight: 84 }} aria-hidden>
                    🎁
                  </Text>
                </GiftShake>
              )}
            </View>

            <Text className="mt-4 text-center text-xs font-bold uppercase tracking-widest text-emerald-100">{opened ? copy.eyebrow : 'Opening your surprise...'}</Text>
            <Text role="heading" className="mt-1 text-center font-display text-2xl font-black text-white">
              {copy.title}
            </Text>
          </Gradient>

          <View className="-mt-8 px-5 pb-6">
            <View className="items-center rounded-2xl border border-slate-100 bg-white p-4" style={shadows.lg}>
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{copy.amountLabel}</Text>
              <Text className="font-display text-4xl font-black text-slate-900" style={{ fontVariant: ['tabular-nums'] }}>
                {formatINR(opened ? Math.round(amount) : 0)}
              </Text>
              <Text className="mt-1 text-[11px] text-slate-500">
                {celebration.code}
                {celebration.method ? ` • via ${paymentMethodLabel(celebration.method)}` : ''}
              </Text>
            </View>

            <Text className="mt-4 text-center text-sm leading-6 text-slate-600">{copy.message}</Text>

            <View className={`mt-3 flex-row items-center gap-1.5 self-center rounded-full px-3 py-1.5 ${copy.chip.box}`}>
              <ChipIcon size={14} color={copy.chip.color} />
              <Text className={`text-xs font-bold ${copy.chip.text_}`}>{copy.chip.text}</Text>
            </View>

            <Pressable testID="celebration-close" accessibilityRole="button" onPress={onClose} className="mt-5 overflow-hidden rounded-xl" style={shadows.glow}>
              <Gradient colors={[colors.brand.orange, colors.brand.yellow]} className="items-center py-3.5">
                <Text className="font-display text-sm font-bold text-slate-950">Awesome! 🎉</Text>
              </Gradient>
            </Pressable>
          </View>
        </PopIn>
        <Confetti fire={opened} />
      </View>
    </Overlay>
  );
}
