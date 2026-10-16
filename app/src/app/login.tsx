import { GuestOnly } from '../components/layout/RouteGuards';
import LoginScreen from '../screens/LoginScreen';

export default function Login() {
  return (
    <GuestOnly>
      <LoginScreen />
    </GuestOnly>
  );
}
