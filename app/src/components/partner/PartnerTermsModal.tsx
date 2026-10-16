import { useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { ArrowRight, BadgeIndianRupee, Ban, Camera, FileCheck2, Handshake, KeyRound, ShieldAlert, Wallet, type LucideIcon } from 'lucide-react-native';
import Button from '../ui/Button';
import { Checkbox } from '../ui/FormField';
import Gradient from '../ui/Gradient';
import Overlay from '../ui/Overlay';
import Text from '../ui/Text';
import { FadeUp } from '../ui/motion';
import { creatorApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../context/CatalogContext';
import toast from '../../lib/toast';
import type { ApiFailure } from '../../types';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { formatINR } from '../../utils/format';

function useTerms(): { icon: LucideIcon; title: string; body: string }[] {
  const { catalog, platformPct, startingPrice } = useCatalog();
  const example = startingPrice.photo;
  const fee = Math.round(example * catalog.platformShare * 100) / 100;
  return [
    {
      icon: BadgeIndianRupee,
      title: `${platformPct} platform fee on every shoot`,
      body: `For every shoot you get through SnapNear, ${platformPct} of the booking amount is the SnapNear platform & service fee and the rest is yours. Example: on a ${formatINR(example)} shoot you earn ${formatINR(example - fee)} and ${formatINR(fee)} goes to SnapNear.`,
    },
    {
      icon: Wallet,
      title: 'Payments only through SnapNear',
      body: 'Customers always pay inside the SnapNear app (UPI, card or the payment QR). Never ask for or accept cash or direct UPI from a SnapNear customer. Your earnings reach your wallet and are paid to your UPI ID after the payout hold period.',
    },
    {
      icon: Handshake,
      title: 'No taking customers outside SnapNear',
      body: 'Do not offer private deals or discounts, ask customers to book you directly, or take repeat shoots offline with customers you met through SnapNear.',
    },
    {
      icon: KeyRound,
      title: 'Honest shoots',
      body: "Start a shoot only with the customer's OTP, and mark it completed only when the shoot is actually done. Fake bookings, fake OTPs or misusing the timer are not allowed.",
    },
    {
      icon: Camera,
      title: 'Professional conduct & privacy',
      body: "Be on time, polite and safe at every venue. Photos and videos belong to the customer: never share, post or sell them without the customer's permission.",
    },
  ];
}

/**
 * Must be accepted before a partner can use the app (shown after signup, and again whenever
 * the terms version changes). Cannot be dismissed, only accepted or logged out of.
 */
export default function PartnerTermsModal() {
  const { setUser, logout } = useAuth();
  const { platformPct, supportEmail } = useCatalog();
  const terms = useTerms();
  const { width, height } = useWindowDimensions();
  const sm = width >= 640;
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  const accept = async () => {
    setSaving(true);
    try {
      const { user } = await creatorApi.acceptTerms();
      setUser(user);
      toast.success('Welcome to SnapNear Partner! Go online to start getting shoots.');
    } catch (err) {
      toast.error((err as ApiFailure).message);
      setSaving(false);
    }
  };

  return (
    <Overlay>
      <View className={`flex-1 bg-slate-950/75 ${sm ? 'items-center justify-center p-4' : 'justify-end'}`} role="dialog" aria-modal aria-label="SnapNear Partner Terms">
        <FadeUp className={`w-full max-w-lg overflow-hidden bg-white ${sm ? 'rounded-3xl' : 'rounded-t-3xl'}`} style={[shadows['2xl'], { maxHeight: height * 0.92 }]}>
          <Gradient colors={[colors.brand.violet, colors.indigo[700]]} to="br" className="shrink-0 px-5 pb-5 pt-6 sm:px-6">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <FileCheck2 size={24} color={colors.white} />
            </View>
            <Text role="heading" className="mt-3 font-display text-xl font-extrabold text-white">
              SnapNear Partner Terms
            </Text>
            <Text className="mt-1 text-xs text-indigo-100">Please read these carefully. You need to accept them before you start taking shoots.</Text>
          </Gradient>

          <ScrollView className="shrink" contentContainerClassName="gap-3 px-5 py-4 sm:px-6">
            {terms.map(({ icon: Icon, title, body }) => (
              <View key={title} className="flex-row gap-3">
                <View className="mt-0.5 h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                  <Icon size={16} color={colors.brand.violet} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-bold text-slate-900">{title}</Text>
                  <Text className="mt-0.5 text-xs leading-5 text-slate-600">{body}</Text>
                </View>
              </View>
            ))}

            <View className="flex-row gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <View className="mt-0.5 h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
                <ShieldAlert size={16} color={colors.red[600]} />
              </View>
              <View className="min-w-0 flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Ban size={14} color={colors.red[700]} />
                  <Text className="shrink text-sm font-bold text-red-700">Breaking these rules will get your account blocked</Text>
                </View>
                <Text className="mt-0.5 text-xs leading-5 text-red-700/90">
                  Fraud, taking SnapNear customers directly, collecting payment outside the app, fake activity or misbehaviour with a customer can lead to your
                  account being suspended or permanently blocked. Payouts linked to a disputed shoot may be held while we investigate.
                </Text>
              </View>
            </View>

            <Text className="text-[11px] text-slate-400">
              Questions? Write to <Text className="text-[11px] font-semibold text-slate-500">{supportEmail}</Text>
            </Text>
          </ScrollView>

          <View className="shrink-0 gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
            <Checkbox name="acceptTerms" tone="violet" checked={agreed} onChange={setAgreed}>
              <Text className="text-xs text-slate-700">
                I have read and agree to the <Text className="text-xs font-bold text-slate-700">SnapNear Partner Terms</Text>, including the {platformPct} platform fee on
                every shoot.
              </Text>
            </Checkbox>
            <View className={`gap-2 ${sm ? 'flex-row' : 'flex-col-reverse'}`}>
              <Button variant="ghost" onPress={logout} disabled={saving} className={sm ? 'w-28' : ''}>
                Log out
              </Button>
              <Button testID="accept-terms" variant="violet" size="lg" onPress={accept} disabled={!agreed} loading={saving} iconAfter={ArrowRight} className="flex-1">
                Next
              </Button>
            </View>
          </View>
        </FadeUp>
      </View>
    </Overlay>
  );
}
