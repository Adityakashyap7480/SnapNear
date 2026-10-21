import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Smartphone, ShieldCheck, Clock } from 'lucide-react-native';
import Text from '../components/ui/Text';
import { ROUTES } from '../config/routes';
import { SUPPORT_EMAIL } from '../config/constants';
import { colors } from '../theme/colors';

function Step({ icon: Icon, title, children }: { icon: typeof Smartphone; title: string; children: string }) {
  return (
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
}

/** Public account-deletion instructions — the URL given to the app stores. */
export default function DeleteAccountScreen() {
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
        <Text className="font-display text-2xl font-black text-slate-900">Delete your SnapNear account</Text>
        <Text className="text-sm leading-6 text-slate-600">
          You can permanently delete your account and personal data in under a minute. There are two ways:
        </Text>
      </View>

      <Step icon={Smartphone} title="1. From the SnapNear app (instant)">
        {`Open SnapNear and sign in, go to Profile, tap "Delete my account" at the bottom and confirm. Your account is deleted immediately and you are logged out.`}
      </Step>

      <Step icon={Mail} title="2. By email">
        {`If you cannot open the app, email ${SUPPORT_EMAIL} from your registered email address with the subject "Delete my account". We verify the request and complete it within 7 days.`}
      </Step>

      <Step icon={ShieldCheck} title="What gets deleted">
        {`Your name, email, phone number, password, profile and portfolio, saved locations and notification tokens are removed or anonymised. Booking and payment records are kept only as totals without your personal details, as tax and accounting law requires.`}
      </Step>

      <Step icon={Clock} title="Before you delete">
        {`An account with an active booking cannot be deleted — complete or cancel the booking first. Partners: request any pending Wallet payout before deleting, because payouts cannot be processed afterwards. Deletion cannot be undone, but you can always sign up again later.`}
      </Step>
    </ScrollView>
  );
}
