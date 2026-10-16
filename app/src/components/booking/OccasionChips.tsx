import { useState } from 'react';
import { Image, Pressable, View, useWindowDimensions } from 'react-native';
import Text from '../ui/Text';
import { OCCASION_EMOJI, OCCASION_IMAGES } from '../../utils/bookingStatus';

interface OccasionChipsProps {
  occasions: string[];
  value: string;
  onChange: (occasion: string) => void;
}

export default function OccasionChips({ occasions = [], value, onChange }: OccasionChipsProps) {
  const { width: windowW } = useWindowDimensions();
  const [rowW, setRowW] = useState(0);
  // Narrow (phone / mobile web): 3 · wide desktop: 5 (use windowW so phone browser isn't stuck at 5)
  const cols = windowW >= 768 ? 5 : 3;
  const gap = 10;
  const tileW = rowW > 0 ? Math.floor((rowW - gap * (cols - 1)) / cols) : undefined;
  // Full square tile (image fills the square; label overlays the bottom)
  const size = tileW;

  return (
    <View
      className="w-full flex-row flex-wrap"
      style={{ gap }}
      onLayout={(e) => setRowW(Math.floor(e.nativeEvent.layout.width))}
    >
      {occasions.map((o) => {
        const selected = value === o;
        const thumb = OCCASION_IMAGES[o];
        return (
          <Pressable
            key={o}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(o)}
            style={size ? { width: size, height: size } : { flexGrow: 1, flexBasis: '30%', aspectRatio: 1 }}
            className={`overflow-hidden rounded-xl border ${selected ? 'border-brand-orange' : 'border-slate-200'}`}
          >
            {thumb ? (
              <Image source={thumb} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityIgnoresInvertColors />
            ) : (
              <View className={`h-full w-full items-center justify-center ${selected ? 'bg-orange-100' : 'bg-slate-100'}`}>
                <Text className="text-2xl">{OCCASION_EMOJI[o] || '✨'}</Text>
              </View>
            )}
            <View
              className={`absolute inset-x-0 bottom-0 px-1.5 py-1.5 ${selected ? 'bg-brand-orange/90' : 'bg-slate-950/55'}`}
            >
              <Text numberOfLines={2} className="text-center text-[10px] font-bold leading-4 text-white sm:text-[11px]">
                {OCCASION_EMOJI[o] || '✨'} {o}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
