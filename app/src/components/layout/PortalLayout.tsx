import { type ReactNode, useState } from 'react';
import { Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase, CalendarPlus, ChevronDown, LogOut, ShieldCheck, Wifi, WifiOff, type LucideIcon } from 'lucide-react-native';
import Logo from '../ui/Logo';
import Avatar from '../ui/Avatar';
import Text from '../ui/Text';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../context/CatalogContext';
import { ScrollPage } from '../../context/ScrollContext';
import { useSocket } from '../../context/SocketContext';
import { APP_NAMES, ROLES, ROLE_LABELS } from '../../config/constants';
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

function UserMenu({ top }: { top: number }) {
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  return (
    <>
      <Pressable
        testID="user-menu"
        accessibilityRole="button"
        accessibilityLabel="Account menu"
        onPress={() => setOpen((o) => !o)}
        className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-2"
      >
        <Avatar name={user.name} size="sm" />
        {width >= 1024 && (
          <View>
            <Text className="max-w-[120px] truncate text-xs font-bold text-slate-900">{user.name}</Text>
            <Text className="text-[10px] font-medium text-slate-500">{ROLE_LABELS[user.role]}</Text>
          </View>
        )}
        <ChevronDown size={14} color={colors.slate[400]} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1" onPress={() => setOpen(false)}>
          <View
            className="absolute w-60 rounded-2xl border border-slate-200 bg-white p-2"
            style={[shadows.xl, { top, right: Math.max(12, (width - 1280) / 2 + 16) }]}
          >
            <View className="border-b border-slate-100 px-3 py-2.5">
              <Text className="text-sm font-bold text-slate-900">{user.name}</Text>
              <Text className="truncate text-xs text-slate-500">{user.email}</Text>
              <View className="mt-1.5 flex-row items-center gap-1 self-start rounded-md bg-slate-100 px-2 py-0.5">
                <ShieldCheck size={12} color={colors.slate[700]} />
                <Text className="text-[10px] font-bold text-slate-700">{ROLE_LABELS[user.role]}</Text>
              </View>
            </View>
            <Pressable
              testID="logout"
              accessibilityRole="button"
              onPress={() => {
                setOpen(false);
                logout();
              }}
              className="mt-1 flex-row items-center gap-2 rounded-xl px-3 py-2 active:bg-red-50"
            >
              <LogOut size={16} color={colors.red[600]} />
              <Text className="text-sm font-semibold text-red-600">Log out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { connected } = useSocket();
  const { partnerPct, platformPct, startingPrice } = useCatalog();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(64);
  if (!user) return null;
  const nav = NAV_BY_ROLE[user.role];

  const header = (
    <View
      className="z-40 border-b border-slate-200 bg-white"
      style={{ paddingTop: insets.top }}
      onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
    >
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
          <UserMenu top={headerHeight + 8} />
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollPage header={header}>
        <View className="mx-auto w-full max-w-7xl flex-grow px-3 py-5 sm:px-4 sm:py-6">{children}</View>

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
