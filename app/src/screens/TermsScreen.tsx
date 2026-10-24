import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Text from '../components/ui/Text';
import { ROUTES } from '../config/routes';
import { colors } from '../theme/colors';

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View className="gap-1.5">
      <Text className="font-display text-sm font-bold text-slate-900">{title}</Text>
      <Text className="text-sm leading-6 text-slate-600">{children}</Text>
    </View>
  );
}

/** Public Terms of Service — linked from signup, profile, and the store listing. */
export default function TermsScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="mx-auto w-full max-w-2xl gap-5 px-5 py-8">
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(ROUTES.HOME)}
        className="flex-row items-center gap-1.5 self-start active:opacity-70"
      >
        <ArrowLeft size={16} color={colors.brand.orange} />
        <Text className="text-sm font-semibold text-orange-600">Back to SnapNear</Text>
      </Pressable>

      <View className="gap-1">
        <Text className="font-display text-2xl font-black text-slate-900">Terms of Service</Text>
        <Text className="text-xs text-slate-500">Last updated: 24 October 2026</Text>
      </View>

      <Section title="Agreement">
        {`By creating a SnapNear account or using the SnapNear website or mobile app, you agree to these Terms of Service and our Privacy Policy (snapnear.in/privacy). If you do not agree, do not use SnapNear. SnapNear is for adults aged 18 and above in India.`}
      </Section>

      <Section title="What SnapNear is">
        {`SnapNear connects customers with nearby photographers and videographers for at-home shoots. We provide the booking, matching, messaging and payment tools. We are not the photographer or videographer unless we say otherwise. The partner who accepts your shoot performs the service.`}
      </Section>

      <Section title="Accounts">
        {`You must provide accurate details and keep your login secure. You are responsible for activity on your account. One person or business should not create multiple accounts to evade limits, fees or bans. We may suspend or remove accounts that break these terms or harm other users.`}
      </Section>

      <Section title="Bookings and cancellations">
        {`When you book, you agree to the package, price, date, time and address shown in the app. Follow any in-app rules for changes or cancellations. No-shows, late cancellations or misuse of OTP / shoot timers may lead to fees, blocked bookings or account action as described in the app at the time of booking.`}
      </Section>

      <Section title="Payments">
        {`Customers pay through SnapNear (via Razorpay — UPI, card or other methods we enable). Do not pay partners in cash or by private UPI for SnapNear bookings. Partners are paid according to the partner payout model shown in the app. Platform fees, if any, are disclosed before you confirm. Refunds, if applicable, follow the policy shown for that booking and applicable law.`}
      </Section>

      <Section title="Partners">
        {`Photographers and videographers who join as partners must also accept the SnapNear Partner Terms in the app. Partners must only start and complete shoots honestly, keep customer content private unless the customer allows sharing, and must not take SnapNear customers off-platform for private deals.`}
      </Section>

      <Section title="Acceptable use">
        {`Do not use SnapNear for illegal activity, harassment, fraud, spam, or to upload content you do not have rights to. Do not scrape, reverse-engineer or disrupt the service. We may remove content or restrict access when needed to protect users or comply with law.`}
      </Section>

      <Section title="Content and intellectual property">
        {`SnapNear branding, app design and software belong to us. Photos and videos from a shoot belong to the customer, subject to any licence the customer grants the partner for portfolio use. Do not use SnapNear marks without permission.`}
      </Section>

      <Section title="Disclaimers">
        {`Matching depends on partner availability and location. We work to keep the service reliable but cannot guarantee uninterrupted access, perfect matches, or a specific creative outcome. To the extent allowed by Indian law, SnapNear is provided as-is and our liability for any claim related to the service is limited to the amount you paid SnapNear for the booking at issue (or ₹1,000 if you paid nothing).`}
      </Section>

      <Section title="Changes">
        {`We may update these terms. Material changes will be announced in the app or by email before they take effect. Continued use after that date means you accept the updated terms.`}
      </Section>

      <Section title="Contact">
        {`Questions: support@snapnear.in. Controller: SnapNear, India.`}
      </Section>
    </ScrollView>
  );
}
