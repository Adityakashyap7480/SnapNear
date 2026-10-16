import { View } from 'react-native';
import BookingHistory from '../components/booking/BookingHistory';
import JobHistory from '../components/partner/JobHistory';
import Card from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';
import Text from '../components/ui/Text';
import { bookingApi, creatorApi } from '../api/services';
import { ROLES } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import useAsync from '../hooks/useAsync';
import type { Booking } from '../types';

export default function ProfileBookingsScreen() {
  const { user } = useAuth();
  const isPartner = user?.role === ROLES.CREATOR;

  const { data, loading, error } = useAsync<Booking[]>(
    () => (isPartner ? creatorApi.dashboard().then((d) => d.history) : bookingApi.mine().then((r) => r.bookings)),
    [isPartner]
  );

  if (loading) return <PageLoader label="Loading bookings..." />;
  if (error) return <Text className="px-4 py-10 text-center text-sm text-red-600">{error}</Text>;

  const list = data || [];

  return (
    <View className="gap-4 px-4 py-5">
      <Text className="text-sm text-slate-500">{isPartner ? 'Completed and past partner jobs.' : 'All shoots you have booked on SnapNear.'}</Text>
      <Card className="p-4">{isPartner ? <JobHistory history={list} /> : <BookingHistory bookings={list} />}</Card>
    </View>
  );
}
