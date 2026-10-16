import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

/**
 * On web, Google OAuth opens a popup that returns to this origin with
 * `#id_token=...` (or `?code=`). That popup boots the full Expo app, which
 * would otherwise Redirect → /login and drop the auth params.
 *
 * Call this as early as possible (root layout module load + mount) so the
 * popup closes and hands the token back to the opener signup/login screen.
 */
export function completeAuthSessionIfNeeded() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return { type: 'failed' as const, message: 'not-web' };
  }
  try {
    return WebBrowser.maybeCompleteAuthSession();
  } catch {
    return { type: 'failed' as const, message: 'complete-threw' };
  }
}

/** True while the OAuth popup is landing with Google's token/code in the URL. */
export function isAuthCallbackUrl(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  const blob = `${hash}${search}`;
  return /id_token=/.test(blob) || /access_token=/.test(blob) || /[?&#]code=/.test(blob);
}
