import { GuestOnly } from '../components/layout/RouteGuards';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

export default function ForgotPassword() {
  return (
    <GuestOnly>
      <ForgotPasswordScreen />
    </GuestOnly>
  );
}
