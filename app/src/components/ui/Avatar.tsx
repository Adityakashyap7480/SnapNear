import { View } from 'react-native';
import Gradient from './Gradient';
import Text from './Text';
import { colors } from '../../theme/colors';
import { initials } from '../../utils/format';

const PALETTES = [
  { colors: [colors.brand.orange, colors.brand.yellow], text: 'text-slate-950' },
  { colors: [colors.brand.violet, colors.indigo[400]], text: 'text-white' },
  { colors: [colors.emerald[500], colors.teal[400]], text: 'text-white' },
  { colors: [colors.sky[500], colors.cyan[400]], text: 'text-white' },
  { colors: [colors.rose[500], colors.pink[400]], text: 'text-white' },
] as const;

const SIZES = {
  sm: { box: 'h-8 w-8 rounded-lg', text: 'text-[11px]', radius: 8 },
  md: { box: 'h-10 w-10 rounded-xl', text: 'text-xs', radius: 12 },
  lg: { box: 'h-14 w-14 rounded-2xl', text: 'text-base', radius: 16 },
};

interface AvatarProps {
  name?: string | null;
  size?: keyof typeof SIZES;
  /** Colour of a ring with a white gap, like ring-2 ring-offset-2 */
  ring?: string;
}

export default function Avatar({ name = '', size = 'md', ring }: AvatarProps) {
  const label = name || '';
  const p = PALETTES[[...label].reduce((n, ch) => n + ch.charCodeAt(0), 0) % PALETTES.length];
  const s = SIZES[size];
  const face = (
    <Gradient colors={p.colors} to="br" className={`shrink-0 items-center justify-center ${s.box}`}>
      <Text className={`font-display font-bold ${p.text} ${s.text}`}>{initials(label)}</Text>
    </Gradient>
  );
  if (!ring) return face;
  return (
    <View className="shrink-0 p-0.5" style={{ borderWidth: 2, borderColor: ring, borderRadius: s.radius + 4 }}>
      {face}
    </View>
  );
}
