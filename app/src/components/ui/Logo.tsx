import { Image, View } from 'react-native';
import Text from './Text';
import { shadows } from '../../theme/shadows';

const logo = require('../../../assets/logo-mark.png');

interface LogoProps {
  tagline?: string;
  badge?: string;
  dark?: boolean;
  size?: 'md' | 'lg';
}

export default function Logo({ tagline = 'Photographers at your doorstep', badge, dark = false, size = 'md' }: LogoProps) {
  const lg = size === 'lg';
  const box = lg ? 48 : 40;
  const radius = lg ? 16 : 12;

  return (
    <View className="flex-row items-center gap-2.5">
      <View style={[{ width: box, height: box, borderRadius: radius, overflow: 'hidden', backgroundColor: 'transparent' }, shadows.glow]}>
        <Image
          source={logo}
          accessibilityLabel="SnapNear"
          style={{ width: box, height: box, backgroundColor: 'transparent' }}
        />
      </View>
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
