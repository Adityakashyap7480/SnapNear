import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { completeAuthSessionIfNeeded } from './completeAuthSession';

// Also completed from root _layout — keep here for screens that import this module first.
completeAuthSessionIfNeeded();

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
 * Web: https origin (Vercel / localhost) — must be on the Web OAuth client.
 * Android/iOS: do NOT pass a custom redirectUri — the Google provider uses
 * `{applicationId}:/oauthredirect` (e.g. in.snapnear.app:/oauthredirect), which Google accepts.
 * Custom schemes like snapnear:// are rejected by Google's Web client ("must contain a domain").
 */
export function useGoogleIdTokenRequest() {
  const webId = webClientId || (Platform.OS === 'web' ? WEB_CLIENT_STUB : undefined);

  if (Platform.OS === 'web') {
    const redirectUri = AuthSession.makeRedirectUri({
      preferLocalhost: typeof __DEV__ !== 'undefined' ? __DEV__ : false,
    });
    return Google.useIdTokenAuthRequest({
      webClientId: webId,
      clientId: webId,
      redirectUri,
      selectAccount: true,
    });
  }

  // Native: let Google.useIdTokenAuthRequest pick Application.applicationId:/oauthredirect
  return Google.useIdTokenAuthRequest({
    webClientId: webId,
    androidClientId: androidClientId || undefined,
    iosClientId: iosClientId || undefined,
    selectAccount: true,
  });
}

export function googleNotConfiguredMessage() {
  return 'Google sign-in is not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in app/.env';
}
