import { ActivityIndicator, Pressable, View } from 'react-native';
import Text from '../ui/Text';
import { colors } from '../../theme/colors';

/** Official-looking Google button (web + native). */
export default function GoogleButton({
  label,
  loading,
  disabled,
  onPress,
  testID = 'google-auth',
}: {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      className={`w-full flex-row items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3.5 active:bg-slate-50 ${
        disabled || loading ? 'opacity-60' : ''
      }`}
    >
      {loading ? (
        <ActivityIndicator color={colors.slate[700]} />
      ) : (
        <View className="h-5 w-5 items-center justify-center">
          <Text className="text-[15px] font-bold leading-5">
            <Text style={{ color: '#4285F4' }}>G</Text>
          </Text>
        </View>
      )}
      <Text className="text-sm font-semibold text-slate-800">{loading ? 'Opening Google...' : label}</Text>
    </Pressable>
  );
}
