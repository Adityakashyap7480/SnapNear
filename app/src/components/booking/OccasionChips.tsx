import { Pressable, View } from 'react-native';
import Text from '../ui/Text';
import { OCCASION_EMOJI } from '../../utils/bookingStatus';

interface OccasionChipsProps {
  occasions: string[];
  value: string;
  onChange: (occasion: string) => void;
}

export default function OccasionChips({ occasions = [], value, onChange }: OccasionChipsProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {occasions.map((o) => (
        <Pressable
          key={o}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === o }}
          onPress={() => onChange(o)}
          className={`rounded-lg border px-3 py-1.5 ${value === o ? 'border-brand-orange bg-orange-50' : 'border-slate-200 bg-white'}`}
        >
          <Text className={`text-xs font-medium ${value === o ? 'text-brand-orange' : 'text-slate-700'}`}>
            {OCCASION_EMOJI[o] || '✨'} {o}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
