import { useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExternalLink, LogOut, ShieldCheck } from 'lucide-react-native';
import { RequireRole } from '../components/layout/RouteGuards';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Logo from '../components/ui/Logo';
import { PageLoader } from '../components/ui/Spinner';
import Text from '../components/ui/Text';
import { ADMIN_URL, ROLES } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import { openLink } from '../lib/links';
import { openOwnerPanel, ownerUsesWebPanel } from '../lib/roleHome';
import { colors } from '../theme/colors';

function OwnerPanelNotice() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (ownerUsesWebPanel) openOwnerPanel();
  }, []);

  if (ownerUsesWebPanel) {
    return (
      <View className="flex-1 bg-slate-50">
        <PageLoader label="Opening the owner panel..." />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-50 px-5" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Logo />
      <Card className="mt-6 w-full max-w-md items-center p-6">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <ShieldCheck size={24} color={colors.brand.violet} />
        </View>
        <Text className="mt-3 text-center font-display text-lg font-bold text-slate-900">Owner panel is on the web</Text>
        <Text className="mt-1 text-center text-sm leading-5 text-slate-500">
          Hi {user?.name.split(' ')[0]}, the SnapNear owner dashboard (customers, partners, bookings and payouts) opens in your browser. Log in there with the
          same email and password.
        </Text>
        <Button className="mt-5 w-full" size="lg" icon={ExternalLink} onPress={() => openLink(ADMIN_URL)}>
          Open Owner Panel
        </Button>
        <Button className="mt-2 w-full" variant="ghost" icon={LogOut} onPress={logout}>
          Log out
        </Button>
      </Card>
    </View>
  );
}

export default function Owner() {
  return (
    <RequireRole roles={[ROLES.SUPER_ADMIN]}>
      <OwnerPanelNotice />
    </RequireRole>
  );
}
