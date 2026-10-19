import { Redirect } from 'expo-router';
import { ROUTES } from '../../config/routes';

/** Old /profile/wallet links redirect here after the earnings rename. */
export default function ProfileWalletRedirect() {
  return <Redirect href={ROUTES.PROFILE_WALLET} />;
}
