import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { CalendarDays, ChevronRight, CircleHelp, LogOut, Wallet } from 'lucide-react-native';
import EditProfileModal from '../components/profile/EditProfileModal';
import Avatar from '../components/ui/Avatar';
import Text from '../components/ui/Text';
import { SUPPORT_EMAIL, ROLES } from '../config/constants';
import { ROUTES } from '../config/routes';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { colors } from '../theme/colors';
import { shadows } from '../theme/shadows';
function Tile({
  icon: Icon,
  title,
  subtitle,
  onPress,
}: {
  icon: typeof CalendarDays;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="min-h-[120px] flex-1 rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50"
      style={shadows.sm}
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
        <Icon size={18} color={colors.brand.orange} />
      </View>
      <Text className="mt-3 font-display text-sm font-bold text-slate-900">{title}</Text>
      <Text className="mt-0.5 text-xs text-slate-500">{subtitle}</Text>
      <View className="mt-auto items-end pt-3">
        <ChevronRight size={16} color={colors.slate[400]} />
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { partnerPct } = useCatalog();
  const [editOpen, setEditOpen] = useState(false);
  if (!user) return null;

  const isPartner = user.role === ROLES.CREATOR;
  const support = SUPPORT_EMAIL;

  return (
    <View className="gap-6 px-4 py-6">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit profile"
        onPress={() => setEditOpen(true)}
        className="items-center gap-2"
      >
        <View className="h-24 w-24 items-center justify-center rounded-full bg-slate-100 p-1">
          <Avatar name={user.name} size="lg" />
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="font-display text-xl font-bold text-slate-900">{user.name}</Text>
          <ChevronRight size={18} color={colors.slate[500]} />
        </View>
        <Text className="text-xs text-slate-500">{user.email}</Text>
      </Pressable>

      <View className="flex-row gap-3">
        <Tile
          icon={CalendarDays}
          title="My Bookings"
          subtitle={isPartner ? 'Jobs & shoot history' : 'View all bookings'}
          onPress={() => router.push(ROUTES.PROFILE_BOOKINGS)}
        />
        <Tile
          icon={Wallet}
          title="Earnings & Payouts"
          subtitle={isPartner ? `Your ${partnerPct} payouts` : 'Payments & dues'}
          onPress={() => router.push(ROUTES.PROFILE_WALLET)}
        />
      </View>

      <View className="flex-row gap-3">
        <Tile
          icon={CircleHelp}
          title="Help & Support"
          subtitle="Get quick help"
          onPress={() => Linking.openURL(`mailto:${support}?subject=${encodeURIComponent('SnapNear support')}`)}
        />
      </View>

      <Pressable
        testID="profile-logout"
        accessibilityRole="button"
        onPress={logout}
        className="flex-row items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-3 active:bg-red-100"
      >
        <LogOut size={16} color={colors.red[600]} />
        <Text className="text-sm font-semibold text-red-600">Log out</Text>
      </Pressable>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </View>
  );
}
