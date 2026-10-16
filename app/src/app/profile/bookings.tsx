import { View } from 'react-native';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileHeader from '../../components/profile/ProfileHeader';
import { RequireRole } from '../../components/layout/RouteGuards';
import { ROLES } from '../../config/constants';
import ProfileBookingsScreen from '../../screens/ProfileBookingsScreen';

export default function ProfileBookings() {
  const insets = useSafeAreaInsets();
  return (
    <RequireRole roles={[ROLES.CLIENT, ROLES.CREATOR]}>
      <View className="flex-1 bg-slate-50">
        <ProfileHeader title="My Bookings" />
        <ScrollView contentContainerStyle={{ paddingBottom: 24 + insets.bottom }} keyboardShouldPersistTaps="handled">
          <ProfileBookingsScreen />
        </ScrollView>
      </View>
    </RequireRole>
  );
}
