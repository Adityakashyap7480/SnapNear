import { Linking, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Mail, MessageCircle, Shield } from 'lucide-react-native';
import Text from '../components/ui/Text';
import { SUPPORT_EMAIL } from '../config/constants';
import { ROUTES } from '../config/routes';
import { colors } from '../theme/colors';

function Row({
  icon: Icon,
  title,
  children,
  onPress,
}: {
  icon: typeof Mail;
  title: string;
  children: string;
  onPress?: () => void;
}) {
  const body = (
    <View className="flex-row gap-3">
      <View className="h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
        <Icon size={18} color={colors.brand.orange} />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="font-display text-sm font-bold text-slate-900">{title}</Text>
        <Text className="text-sm leading-6 text-slate-600">{children}</Text>
      </View>
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-70">
      {body}
    </Pressable>
  );
}

/** Public help page — safe URL for Play Console / website support links. */
export default function SupportScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="mx-auto w-full max-w-2xl gap-6 px-5 py-8">
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(ROUTES.HOME)}
        className="flex-row items-center gap-1.5 self-start active:opacity-70"
      >
        <ArrowLeft size={16} color={colors.brand.orange} />
        <Text className="text-sm font-semibold text-orange-600">Back to SnapNear</Text>
      </Pressable>

      <View className="gap-1">
        <Text className="font-display text-2xl font-black text-slate-900">Help & Support</Text>
        <Text className="text-sm leading-6 text-slate-600">
          We usually reply within one business day. Include your registered email and booking code if you have one.
        </Text>
      </View>

      <Row
        icon={Mail}
        title="Email us"
        onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('SnapNear support')}`)}
      >
        {`Tap to email ${SUPPORT_EMAIL}`}
      </Row>

      <Row icon={MessageCircle} title="In the app">
        {`Signed in? Open Profile → Help & Support to email us from your account, or check My Bookings for shoot status.`}
      </Row>

      <Row
        icon={Shield}
        title="Privacy, terms & account deletion"
        onPress={() => router.push(ROUTES.PRIVACY)}
      >
        {`Privacy Policy, Terms of Service and account deletion instructions are linked below.`}
      </Row>

      <View className="gap-2 border-t border-slate-200 pt-4">
        <Pressable accessibilityRole="link" onPress={() => router.push(ROUTES.PRIVACY)} className="active:opacity-70">
          <Text className="text-sm font-semibold text-orange-600">Privacy Policy</Text>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => router.push(ROUTES.TERMS)} className="active:opacity-70">
          <Text className="text-sm font-semibold text-orange-600">Terms of Service</Text>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => router.push(ROUTES.DELETE_ACCOUNT)} className="active:opacity-70">
          <Text className="text-sm font-semibold text-orange-600">Delete your account</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
