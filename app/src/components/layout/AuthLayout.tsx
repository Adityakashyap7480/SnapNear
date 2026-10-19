import type { ReactNode } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IndianRupee, ShieldCheck, Zap } from 'lucide-react-native';
import Logo from '../ui/Logo';
import GradientText from '../ui/GradientText';
import GridPattern from '../ui/GridPattern';
import Text from '../ui/Text';
import { FadeUp, Pulse } from '../ui/motion';
import { colors } from '../../theme/colors';
import { formatINR } from '../../utils/format';

const isWeb = Platform.OS === 'web';

/** Marketing-only (login has no catalog yet). Keep in sync with backend `session-packages.ts` photo 1hr. */
const DEMO = { photoFrom: 5 };

const SHOOT_SHOTS = [
  { src: require('../../../assets/occasions/family.jpg'), label: 'Family' },
  { src: require('../../../assets/occasions/birthday.jpg'), label: 'Birthday' },
  { src: require('../../../assets/occasions/maternity.jpg'), label: 'Maternity' },
  { src: require('../../../assets/occasions/fashion.jpg'), label: 'Fashion' },
  { src: require('../../../assets/occasions/pooja.jpg'), label: 'Pooja' },
  { src: require('../../../assets/occasions/society.jpg'), label: 'Society' },
] as const;

/** Compact premium mosaic — replaces the old fake request / partner cards. */
function ShootGallery() {
  return (
    <View className="mt-8 max-w-[520px] rounded-2xl border border-white/10 bg-white/[0.04] p-2.5">
      <View className="mb-2 flex-row items-center justify-between px-0.5">
        <Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Shoot styles</Text>
        <Text className="text-[10px] font-semibold text-slate-500">Doorstep ready</Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {SHOOT_SHOTS.map(({ src, label }) => (
          <View
            key={label}
            className="overflow-hidden rounded-xl border border-white/10"
            style={{ width: '31.5%', height: 72 }}
          >
            <Image source={src} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityLabel={`${label} shoot`} />
            <View
              pointerEvents="none"
              className="absolute inset-0"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.22)' }}
            />
            <View className="absolute bottom-1.5 left-1.5 rounded-md bg-black/55 px-1.5 py-0.5">
              <Text className="text-[9px] font-bold text-white">{label}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function MarketingPanel() {
  const { width, height } = useWindowDimensions();
  const xl = width >= 1280;
  const short = height <= 820;
  const shorter = height <= 680;
  const pad = shorter ? 'px-8' : xl ? 'px-14' : 'px-10';
  const features = [
    { icon: Zap, title: 'Instant doorstep dispatch', text: 'Verified photographers within 10 km get your request in seconds.' },
    { icon: ShieldCheck, title: 'Verified & experienced', text: 'Every SnapNear Partner is background-checked.' },
    { icon: IndianRupee, title: 'Transparent pricing', text: `Starts at ${formatINR(DEMO.photoFrom)}/hr. No surge, travel included.` },
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
            <Text className="text-[11px] font-semibold text-slate-300">Live in India</Text>
          </View>
          <View className="mt-5 max-w-lg">
            <Text
              className={`font-display font-extrabold text-white ${xl && !shorter ? 'text-4xl' : shorter ? 'text-2xl' : 'text-3xl'}`}
              style={{ lineHeight: (xl && !shorter ? 40 : shorter ? 28 : 34) * 1.15 }}
            >
              Your photographer,
            </Text>
            <Text
              className={`font-display font-extrabold text-white ${xl && !shorter ? 'text-4xl' : shorter ? 'text-2xl' : 'text-3xl'}`}
              style={{ lineHeight: (xl && !shorter ? 40 : shorter ? 28 : 34) * 1.15 }}
              numberOfLines={1}
            >
              <GradientText>at your doorstep</GradientText> in minutes.
            </Text>
          </View>
          <Text className="mt-4 max-w-md text-sm leading-6 text-slate-400">
            Book verified photographers & videographers for birthdays, reels, baby shoots and society events, just like booking a ride.
          </Text>

          <ShootGallery />
        </View>

        {/* Always show — was hidden when height ≤ 820px */}
        <View className={`flex-row gap-4 border-t border-white/10 ${short ? 'px-8 py-6' : xl ? 'px-14 py-10' : 'px-10 py-10'}`}>
          {features.map(({ icon: Icon, title, text }) => (
            <View key={title} className="flex-1 flex-row items-center gap-3">
              <View className="h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <Icon size={18} color={colors.brand.yellow} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-xs font-bold text-white">{title}</Text>
                <Text className="mt-0.5 text-[11px] leading-[18px] text-slate-400">{text}</Text>
              </View>
            </View>
          ))}
        </View>
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
