import { Pressable, View } from 'react-native';
import { CheckCircle, Radio, Shield } from 'lucide-react-native';
import Gradient from '../ui/Gradient';
import Spinner from '../ui/Spinner';
import Text from '../ui/Text';
import { Pulse } from '../ui/motion';
import { useCatalog } from '../../context/CatalogContext';
import type { PricingTier } from '../../types';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { formatINR } from '../../utils/format';

interface FareCardProps {
  tier?: PricingTier;
  serviceLabel?: string;
  onBroadcast: () => void;
  submitting: boolean;
  /** True while a shoot is finding / in progress / unpaid — blocks a second broadcast. */
  blocked?: boolean;
  blockedHint?: string;
}

export default function FareCard({ tier, serviceLabel, onBroadcast, submitting, blocked, blockedHint }: FareCardProps) {
  const { platformPct } = useCatalog();
  const disabled = submitting || blocked || !tier;

  return (
    <View className="rounded-2xl border border-slate-800 bg-brand-navy p-4 sm:p-6" style={shadows.xl}>
      <View className="flex-row flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <Text className="text-xs font-semibold text-slate-400">On-Demand Fare Breakdown</Text>
        <View className="rounded-md border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5">
          <Text className="text-[10px] font-bold text-emerald-400">Hyper-local Dispatch</Text>
        </View>
      </View>

      <View className="gap-3 py-4">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="min-w-0 flex-1 text-xs text-slate-300">
            {serviceLabel} • {tier?.label}
          </Text>
          <Text className="text-xs font-bold text-white">{formatINR(tier?.total)}</Text>
        </View>

        <View className="gap-2 rounded-xl border border-slate-700/60 bg-slate-800/70 p-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <CheckCircle size={14} color={colors.emerald[400]} />
              <Text className="text-xs font-medium text-emerald-400">Photographer Payout</Text>
            </View>
            <Text className="text-xs font-bold text-emerald-400">{formatINR(tier?.creatorPayout, { fixed: true })}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Shield size={14} color={colors.slate[400]} />
              <Text className="text-[11px] text-slate-400">Platform & Tech Fee ({platformPct})</Text>
            </View>
            <Text className="text-[11px] font-semibold text-slate-300">{formatINR(tier?.platformFee, { fixed: true })}</Text>
          </View>
        </View>

        <View className="flex-row items-end justify-between gap-3 pt-2">
          <View className="min-w-0 flex-1">
            <Text className="text-xs text-slate-400">Total Amount Payable</Text>
            <Text className="text-[11px] text-amber-400">No surge • Doorstep travel included</Text>
          </View>
          <Text className="shrink-0 font-display text-2xl font-black text-brand-yellow sm:text-3xl">{formatINR(tier?.total)}</Text>
        </View>
      </View>

      <View className="pt-3">
        <Pressable
          testID="broadcast"
          accessibilityRole="button"
          accessibilityState={{ disabled, busy: submitting }}
          onPress={onBroadcast}
          disabled={disabled}
          className="overflow-hidden rounded-xl"
          style={[shadows.glow, disabled ? { opacity: 0.6 } : null]}
        >
          <Gradient colors={[colors.brand.orange, colors.brand.yellow]} className="flex-row items-center justify-center gap-2 px-3 py-3.5 sm:py-4">
            {submitting ? (
              <Spinner size={16} color={colors.slate[950]} />
            ) : (
              <Pulse>
                <Radio size={16} color={colors.slate[950]} />
              </Pulse>
            )}
            <Text className="font-display text-sm font-bold text-slate-950">
              {submitting ? 'Finding photographers...' : blocked ? 'Shoot in progress' : 'Find Nearby Photographer'}
            </Text>
          </Gradient>
        </Pressable>
        <Text className="mt-2.5 text-center text-[11px] text-slate-400">
          {blocked
            ? blockedHint || 'Finish or cancel your current shoot (and pay if due) before booking another.'
            : 'Verified photographers within 10 km get an instant ping. The first to accept comes to you.'}
        </Text>
      </View>
    </View>
  );
}
