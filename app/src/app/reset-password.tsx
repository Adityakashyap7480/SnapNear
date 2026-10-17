import { GuestOnly } from '../components/layout/RouteGuards';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

export default function ResetPassword() {
  return (
    <GuestOnly>
      <ResetPasswordScreen />
    </GuestOnly>
  );
}
