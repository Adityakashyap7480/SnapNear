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

// OAuth client IDs are public by design; env overrides these defaults for local/prod.
const webClientId =
  parseClientId(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) ||
  parseClientId('476462008168-kqfeep0ivv6ro4rgls0rooprgl01p2iq.apps.googleusercontent.com');
const androidClientId =
  parseClientId(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) ||
  parseClientId('476462008168-pt4pfus3ri2i4vcbh4u9086fnnlvfe2u.apps.googleusercontent.com');
const iosClientId = parseClientId(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);

export const googleAuthConfigured = Boolean(
  webClientId || (Platform.OS === 'android' && androidClientId) || (Platform.OS === 'ios' && iosClientId)
);

/** expo-auth-session throws on web if webClientId is empty — keep a stub so the screen still mounts. */
const WEB_CLIENT_STUB = '000000000000-missing.apps.googleusercontent.com';

/**
 * Google ID-token request for web + native.
 * Web must use the Web OAuth client only — Android client IDs cause invalid_client in the browser.
 * Callers must gate with `googleAuthConfigured` before prompting.
 */
export function useGoogleIdTokenRequest() {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'snapnear',
    preferLocalhost: true,
  });

  const webId = webClientId || (Platform.OS === 'web' ? WEB_CLIENT_STUB : undefined);

  return Google.useIdTokenAuthRequest({
    webClientId: webId,
    androidClientId: androidClientId || undefined,
    iosClientId: iosClientId || undefined,
    // Expo web / Metro: always the Web client
    clientId: Platform.OS === 'web' ? webId : androidClientId || webClientId || undefined,
    redirectUri,
    selectAccount: true,
  });
}

export function googleNotConfiguredMessage() {
  return 'Google sign-in is not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in app/.env';
}
