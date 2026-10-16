import { GuestOnly } from '../components/layout/RouteGuards';
import SignupScreen from '../screens/SignupScreen';

export default function Signup() {
  return (
    <GuestOnly>
      <SignupScreen />
    </GuestOnly>
  );
}
