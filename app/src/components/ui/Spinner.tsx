import { ActivityIndicator, View } from 'react-native';
import Text from './Text';
import { colors } from '../../theme/colors';

export default function Spinner({ size = 16, color = colors.slate[900] }: { size?: number; color?: string }) {
  return <ActivityIndicator size={size > 24 ? 'large' : 'small'} color={color} style={{ width: size, height: size, transform: [{ scale: size > 24 ? size / 36 : size / 20 }] }} />;
}

export function PageLoader({ label = 'Loading SnapNear...' }: { label?: string }) {
  return (
    <View className="min-h-[60vh] flex-1 items-center justify-center gap-3 py-24">
      <ActivityIndicator size="large" color={colors.brand.orange} />
      <Text className="text-sm font-medium text-slate-500">{label}</Text>
    </View>
  );
}
