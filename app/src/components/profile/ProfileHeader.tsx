import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Text from '../ui/Text';
import { colors } from '../../theme/colors';

export default function ProfileHeader({ title, right }: { title: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="border-b border-slate-200 bg-white" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-2 px-3 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-100"
        >
          <ArrowLeft size={22} color={colors.slate[800]} />
        </Pressable>
        <Text className="flex-1 font-display text-xl font-bold text-slate-900">{title}</Text>
        {right}
      </View>
    </View>
  );
}
