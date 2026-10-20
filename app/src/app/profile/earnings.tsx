import { View } from 'react-native';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileHeader from '../../components/profile/ProfileHeader';
import { RequireRole } from '../../components/layout/RouteGuards';
import { ROLES } from '../../config/constants';
import { useAuth } from '../../context/AuthContext';
import ProfileWalletScreen from '../../screens/ProfileWalletScreen';

export default function ProfileEarnings() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isPartner = user?.role === ROLES.CREATOR;
  return (
    <RequireRole roles={[ROLES.CLIENT, ROLES.CREATOR]}>
      <View className="flex-1 bg-slate-50">
        <ProfileHeader title={isPartner ? 'Wallet' : 'My Payments'} />
        <ScrollView contentContainerStyle={{ paddingBottom: 24 + insets.bottom }} keyboardShouldPersistTaps="handled">
          <ProfileWalletScreen />
        </ScrollView>
      </View>
    </RequireRole>
  );
}
