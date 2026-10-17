import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeCheck, Bell, Camera, IndianRupee, MapPin, ShieldCheck, Star, Video, Zap } from 'lucide-react-native';
import Logo from '../ui/Logo';
import Gradient from '../ui/Gradient';
import GradientText from '../ui/GradientText';
import GridPattern from '../ui/GridPattern';
import Text from '../ui/Text';
import { FadeUp, Float, Pulse } from '../ui/motion';
import { useCatalog } from '../../context/CatalogContext';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { formatINR } from '../../utils/format';

const isWeb = Platform.OS === 'web';
const glass = 'rounded-2xl border border-white/10 bg-white/[0.07]';

function FloatingPingCard() {
  const { catalog } = useCatalog();
  const photoTiers = catalog.tiers.photo || [];
  const sample = photoTiers[1] || photoTiers[0];

  return (
    <Float className={`${glass} p-4`} style={shadows['2xl']}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Bell size={14} color={colors.brand.yellow} />
          <Text className="text-[11px] font-bold text-brand-yellow">New shoot request</Text>
        </View>
        <View className="rounded-md bg-brand-orange px-2 py-0.5">
          <Text className="text-[10px] font-bold text-white">1.4 km</Text>
        </View>
      </View>
      <Text className="mt-2 font-display text-base font-bold text-white">🎂 Birthday Celebration</Text>
      <View className="mt-0.5 flex-row items-center gap-1">
        <MapPin size={12} color={colors.slate[300]} />
        <Text className="text-[11px] text-slate-300">Gaur City 2, Greater Noida West</Text>
      </View>
      <View className="mt-3 flex-row items-center justify-between border-t border-white/10 pt-3">
        <View>
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Partner earns</Text>
          <Text className="font-display text-xl font-black text-emerald-400">{formatINR(sample?.creatorPayout, { fixed: true })}</Text>
        </View>
        <View className="rounded-lg bg-emerald-500 px-3 py-1.5">
          <Text className="text-[11px] font-bold text-white">Accept</Text>
        </View>
      </View>
    </Float>
  );
}

function FloatingPartnerCard() {
  return (
    <Float delay={1500} className={`${glass} p-3.5`} style={shadows['2xl']}>
      <View className="flex-row items-center gap-3">
        <Gradient colors={[colors.brand.violet, colors.indigo[400]]} to="br" className="h-10 w-10 items-center justify-center rounded-xl">
          <Text className="font-display text-sm font-bold text-white">RK</Text>
        </Gradient>
        <View>
          <View className="flex-row items-center gap-1">
            <Text className="text-sm font-bold text-white">Rohan Kapoor</Text>
            <BadgeCheck size={14} color={colors.sky[400]} />
          </View>
          <View className="flex-row items-center gap-1">
            <Star size={12} color={colors.amber[400]} fill={colors.amber[400]} />
            <Text className="text-[11px] text-amber-300">4.9 • Arriving in 12 min</Text>
          </View>
        </View>
      </View>
    </Float>
  );
}

function MarketingPanel() {
  const { startingPrice } = useCatalog();
  const { width, height } = useWindowDimensions();
  const xl = width >= 1280;
  const short = height <= 820;
  const shorter = height <= 680;
  const pad = shorter ? 'px-8' : xl ? 'px-14' : 'px-10';
  const features = [
    { icon: Zap, title: 'Instant doorstep dispatch', text: 'Verified photographers within 10 km get your request in seconds.' },
    { icon: ShieldCheck, title: 'Verified & experienced', text: 'Every SnapNear Partner is background-checked.' },
    { icon: IndianRupee, title: 'Transparent pricing', text: `Starts at ${formatINR(startingPrice.photo)}/hr. No surge, travel included.` },
  ];
  const blur = (px: number) => (isWeb ? ({ filter: `blur(${px}px)` } as object) : { opacity: 0.5 });

  return (
    <View className="h-full w-[46%] shrink-0 overflow-hidden bg-brand-navy">
      <GridPattern />
      <View pointerEvents="none" className="absolute -left-24 -top-32 h-96 w-96 rounded-full bg-brand-orange/30" style={blur(110)} />
      <View pointerEvents="none" className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-brand-violet/30" style={blur(120)} />

      <ScrollView contentContainerClassName="min-h-full justify-between gap-8" showsVerticalScrollIndicator={false}>
        <View className={`${pad} ${shorter ? 'pt-8' : xl ? 'pt-14' : 'pt-10'}`}>
          <Logo dark size="lg" tagline="Photographers at your doorstep" />
        </View>

        <View className={pad}>
          <View className="flex-row items-center gap-1.5 self-start rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <Pulse>
              <View className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </Pulse>
            <Text className="text-[11px] font-semibold text-slate-300">Live in Noida, Greater Noida & Ghaziabad</Text>
          </View>
          <Text
            className={`mt-5 font-display font-extrabold text-white ${xl && !shorter ? 'text-5xl' : shorter ? 'text-3xl' : 'text-4xl'}`}
            style={{ lineHeight: (xl && !shorter ? 48 : shorter ? 30 : 36) * 1.1 }}
          >
            Your photographer,{'\n'}
            <GradientText>at your doorstep</GradientText> in minutes.
          </Text>
          <Text className="mt-4 max-w-md text-sm leading-6 text-slate-400">
            Book verified photographers & videographers for birthdays, reels, baby shoots and society events, just like booking a ride.
          </Text>

          {!shorter && (
            <View className={`mt-8 max-w-xl gap-4 ${xl ? 'flex-row items-start' : ''}`}>
              <View className={xl ? 'flex-1' : ''}>
                <FloatingPingCard />
              </View>
              <View className={`gap-4 ${xl ? 'flex-1 pt-10' : ''}`}>
                <FloatingPartnerCard />
                <View className="flex-row flex-wrap gap-2">
                  <View className="flex-row items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <Camera size={14} color={colors.brand.orange} />
                    <Text className="text-[11px] font-semibold text-slate-200">Photos from {formatINR(startingPrice.photo)}</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <Video size={14} color={colors.brand.violet} />
                    <Text className="text-[11px] font-semibold text-slate-200">Video from {formatINR(startingPrice.video)}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {short ? (
          <View className="h-2" />
        ) : (
          <View className={`flex-row gap-4 border-t border-white/10 py-10 ${xl ? 'px-14' : 'px-10'}`}>
            {features.map(({ icon: Icon, title, text }) => (
              <View key={title} className="flex-1">
                <Icon size={20} color={colors.brand.yellow} />
                <Text className="mt-2 text-xs font-bold text-white">{title}</Text>
                <Text className="mt-0.5 text-[11px] leading-[18px] text-slate-400">{text}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default function AuthLayout({
  children,
  /** Short screens (login) center vertically; long forms (signup) stay top-aligned with tight bottom. */
  center = true,
}: {
  children: ReactNode;
  center?: boolean;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 1024;

  return (
    <View className="flex-1 flex-row bg-white">
      {wide && <MarketingPanel />}

      <KeyboardAvoidingView
        className="min-w-0 flex-1"
        // Android uses softwareKeyboardLayoutMode: 'resize' — avoid double-shrink with behavior=height
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow"
          contentContainerStyle={{
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 16) + (center ? 24 : 32),
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          {!wide && (
            <View className="px-6 pb-1 pt-2">
              <Logo />
            </View>
          )}
          <View
            className={`flex-1 items-center px-5 sm:px-10 ${center ? 'justify-center py-4' : 'justify-start py-4'}`}
          >
            <FadeUp className="w-full max-w-md">{children}</FadeUp>
          </View>
          <Text className="pb-3 pt-1 text-center text-[11px] text-slate-400">
            © {new Date().getFullYear()} SnapNear Technologies • Verified photographers at your doorstep
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
