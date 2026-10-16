import { View } from 'react-native';
import { Camera } from 'lucide-react-native';
import Gradient from './Gradient';
import Text from './Text';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface LogoProps {
  tagline?: string;
  badge?: string;
  dark?: boolean;
  size?: 'md' | 'lg';
}

export default function Logo({ tagline = 'Photographers at your doorstep', badge, dark = false, size = 'md' }: LogoProps) {
  const lg = size === 'lg';

  return (
    <View className="flex-row items-center gap-2.5">
      <Gradient
        colors={[colors.brand.orange, colors.brand.yellow]}
        to="tr"
        className={`shrink-0 items-center justify-center ${lg ? 'h-12 w-12 rounded-2xl' : 'h-10 w-10 rounded-xl'}`}
        style={shadows.glow}
      >
        <Camera size={lg ? 24 : 20} color={colors.white} />
      </Gradient>
      <View className="min-w-0 shrink">
        <View className="flex-row items-center gap-1.5">
          <Text className={`font-display font-extrabold tracking-tight ${lg ? 'text-2xl' : 'text-xl'} ${dark ? 'text-white' : 'text-slate-900'}`}>
            Snap<Text className="font-display font-extrabold text-brand-orange">Near</Text>
          </Text>
          {badge && (
            <View className="rounded bg-amber-100 px-1.5 py-0.5">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-amber-800">{badge}</Text>
            </View>
          )}
        </View>
        {tagline && <Text className={`truncate text-[11px] font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{tagline}</Text>}
      </View>
    </View>
  );
}
