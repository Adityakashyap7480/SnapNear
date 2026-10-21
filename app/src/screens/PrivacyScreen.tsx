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

/** Public privacy policy — linked from the store listing and the app. */
export default function PrivacyScreen() {
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
        <Text className="font-display text-2xl font-black text-slate-900">Privacy Policy</Text>
        <Text className="text-xs text-slate-500">Last updated: 21 October 2026</Text>
      </View>

      <Section title="Who we are">
        {`SnapNear ("we", "us") connects customers with nearby photographers and videographers for at-home shoots in India. This policy explains what personal data we collect, why, and the choices you have. Questions: support@snapnear.in.`}
      </Section>

      <Section title="Information we collect">
        {`Account details: your name, email address, phone number and password (stored securely hashed). Location: your device location so we can match customers and partners within about 10 km; partners share their location while they are online for shoots. Bookings: shoot address, date, occasion, package and messages related to a booking. Content partners upload: portfolio photos, bio and gear details. Payments: payments are processed by Razorpay — we receive payment status and references, never your card or UPI credentials. Device data: push notification tokens and basic app diagnostics so alerts reach you and the app keeps working.`}
      </Section>

      <Section title="How we use it">
        {`To create and secure your account, match you with nearby partners or customers, run bookings end to end, collect payments and pay out partners, send booking alerts, provide support, prevent fraud and abuse, and meet legal obligations. We do not sell your personal data, and we do not use it for third-party advertising.`}
      </Section>

      <Section title="What we share">
        {`With the other side of your booking only what a shoot needs: first name, phone number and the shoot address. With service providers who help us operate (Razorpay for payments, hosting, email and push providers) under their own security obligations. And when the law requires it. Nothing else.`}
      </Section>

      <Section title="Location">
        {`Location is used only to find shoots and partners near you and while a partner is on duty. You can switch it off in your device settings at any time; matching simply will not work without it.`}
      </Section>

      <Section title="How long we keep it">
        {`Personal data is kept while your account is active. When you delete your account, your name, contact details and credentials are removed or anonymised. Booking and payment records are retained, without your personal identifiers, for the period tax and accounting law requires.`}
      </Section>

      <Section title="Your choices">
        {`You can view and update your details in your profile, and delete your account any time from Profile → Delete my account (or see snapnear.in/delete-account). You can also email support@snapnear.in to access, correct or delete your data.`}
      </Section>

      <Section title="Security">
        {`Data travels over encrypted connections, passwords are hashed, and access to systems is restricted. No system is perfectly secure, but we work to protect your information and will tell you about serious incidents as the law requires.`}
      </Section>

      <Section title="Children">
        {`SnapNear is for adults (18+). We do not knowingly collect data from children, and accounts found to belong to minors will be removed.`}
      </Section>

      <Section title="Changes and contact">
        {`If this policy changes materially we will announce it in the app before it takes effect. Controller: SnapNear, India — support@snapnear.in.`}
      </Section>
    </ScrollView>
  );
}
