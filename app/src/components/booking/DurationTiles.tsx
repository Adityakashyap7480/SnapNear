import { Pressable, View, useWindowDimensions } from 'react-native';
import Grid from '../ui/Grid';
import Text from '../ui/Text';
import type { PricingTier } from '../../types';
import { formatINR } from '../../utils/format';

interface DurationTilesProps {
  tiers: PricingTier[];
  value?: string;
  onChange: (id: string) => void;
}

export default function DurationTiles({ tiers = [], value, onChange }: DurationTilesProps) {
  const { width } = useWindowDimensions();
  // grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 (the form is narrower beside the fare card on lg)
  const cols = width >= 1280 ? 4 : width >= 1024 ? 2 : width >= 640 ? 4 : 2;

  return (
    <Grid cols={cols} gap="gap-2.5">
      {tiers.map((t) => {
        const selected = t.id === value;
        return (
          <Pressable
            key={t.id}
            testID={`duration-${t.id}`}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(t.id)}
            className={`min-w-0 rounded-xl p-2.5 sm:p-3 ${selected ? 'border-2 border-brand-orange bg-orange-50/70' : 'border border-slate-200 bg-white'}`}
            style={selected ? undefined : { margin: 1 }}
          >
            <View className="mb-1 flex-row flex-wrap items-baseline justify-between gap-x-1">
              <Text className={`text-xs font-bold ${selected ? 'text-slate-900' : 'text-slate-700'}`}>{t.label}</Text>
              <Text className="text-sm font-black text-slate-900">{formatINR(t.total)}</Text>
            </View>
            <Text className="truncate text-[10px] text-slate-500">{t.subtitle}</Text>
          </Pressable>
        );
      })}
    </Grid>
  );
}
