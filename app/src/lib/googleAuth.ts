import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

/** Pull a single Google OAuth client ID out of a possibly corrupted env value. */
function parseClientId(raw: string | undefined): string {
  const m = (raw || '').match(/\d+-[a-z0-9]+\.apps\.googleusercontent\.com/i);
  return m ? m[0] : '';
}

const webClientId = parseClientId(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
const androidClientId = parseClientId(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID);
const iosClientId = parseClientId(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);

export const googleAuthConfigured = Boolean(
  webClientId || (Platform.OS === 'android' && androidClientId) || (Platform.OS === 'ios' && iosClientId)
);

/**
 * Google ID-token request for web + native.
 * Web must use the Web OAuth client only — Android client IDs cause invalid_client in the browser.
 */
export function useGoogleIdTokenRequest() {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'snapnear',
    preferLocalhost: true,
  });

  return Google.useIdTokenAuthRequest({
    webClientId: webClientId || undefined,
    androidClientId: androidClientId || undefined,
    iosClientId: iosClientId || undefined,
    // Expo web / Metro: always the Web client
    clientId: Platform.OS === 'web' ? webClientId || undefined : androidClientId || webClientId || undefined,
    redirectUri,
    selectAccount: true,
  });
}

export function googleNotConfiguredMessage() {
  return 'Google sign-in is not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in app/.env';
}
