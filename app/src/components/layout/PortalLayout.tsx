import type { ReactNode } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Briefcase, CalendarPlus, Wifi, WifiOff, type LucideIcon } from 'lucide-react-native';
import Logo from '../ui/Logo';
import Avatar from '../ui/Avatar';
import Text from '../ui/Text';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../context/CatalogContext';
import { ScrollPage } from '../../context/ScrollContext';
import { useSocket } from '../../context/SocketContext';
import { APP_NAMES, ROLES, ROLE_LABELS } from '../../config/constants';
import { ROUTES } from '../../config/routes';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { formatINR } from '../../utils/format';

const NAV_BY_ROLE: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  [ROLES.CLIENT]: { label: APP_NAMES.client, icon: CalendarPlus, color: colors.brand.orange },
  [ROLES.CREATOR]: { label: APP_NAMES.creator, icon: Briefcase, color: colors.brand.violet },
};

const TAGLINE: Record<string, string> = {
  [ROLES.CLIENT]: 'Photographers at your doorstep',
  [ROLES.CREATOR]: 'Partner app for photographers',
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { connected } = useSocket();
  const { partnerPct, platformPct, startingPrice } = useCatalog();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  if (!user) return null;
  const nav = NAV_BY_ROLE[user.role];

  const header = (
    <View className="z-40 border-b border-slate-200 bg-white" style={{ paddingTop: insets.top }}>
      <View className="mx-auto w-full max-w-7xl flex-row items-center justify-between gap-3 px-3 py-3 sm:px-4">
        <View className="min-w-0 shrink">
          <Logo tagline={TAGLINE[user.role]} badge="Live" />
        </View>

        {nav && width >= 768 && (
          <View className="flex-row items-center rounded-xl border border-slate-200 bg-slate-100 p-1">
            <View className="flex-row items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 lg:px-3.5" style={shadows.sm}>
              <nav.icon size={14} color={nav.color} />
              <Text className="text-xs font-semibold text-slate-900">{nav.label}</Text>
            </View>
          </View>
        )}

        <View className="shrink-0 flex-row items-center gap-2">
          {width >= 640 && (
            <View className={`flex-row items-center gap-1 rounded-full px-2 py-1 ${connected ? 'bg-emerald-50' : 'bg-slate-100'}`}>
              {connected ? <Wifi size={12} color={colors.emerald[700]} /> : <WifiOff size={12} color={colors.slate[500]} />}
              <Text className={`text-[10px] font-bold ${connected ? 'text-emerald-700' : 'text-slate-500'}`}>{connected ? 'Live' : 'Offline'}</Text>
            </View>
          )}
          <Pressable
            testID="user-menu"
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => router.push(ROUTES.PROFILE)}
            className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-2 active:bg-slate-50"
          >
            <Avatar name={user.name} size="sm" />
            {width >= 1024 && (
              <View>
                <Text className="max-w-[120px] truncate text-xs font-bold text-slate-900">{user.name}</Text>
                <Text className="text-[10px] font-medium text-slate-500">{ROLE_LABELS[user.role]}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <View className="w-full flex-1 bg-slate-50" style={{ width: '100%' }}>
      <ScrollPage header={header}>
        <View className="mx-auto w-full max-w-7xl flex-grow px-3 py-5 sm:px-4 sm:py-6" style={{ width: '100%', alignSelf: 'stretch' }}>
          {children}
        </View>

        <View className="border-t border-slate-200 bg-white py-5" style={{ paddingBottom: 20 + insets.bottom }}>
          <View className={`mx-auto w-full max-w-7xl items-center justify-between gap-2 px-4 ${width >= 640 ? 'flex-row' : ''}`}>
            <Text className={`text-xs text-slate-500 ${width >= 640 ? '' : 'text-center'}`}>
              © {new Date().getFullYear()} SnapNear Technologies. Photographers & videographers at your doorstep from{' '}
              {formatINR(startingPrice.photo)}/hr.
            </Text>
            <View className="flex-row flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <Text className="text-[11px] font-semibold text-emerald-600">• {partnerPct} to Partners</Text>
              <Text className="text-[11px] font-semibold text-brand-orange">• {platformPct} Platform</Text>
              <Text className="text-[11px] text-slate-500">• Verified Partners</Text>
            </View>
          </View>
        </View>
      </ScrollPage>
    </View>
  );
}
