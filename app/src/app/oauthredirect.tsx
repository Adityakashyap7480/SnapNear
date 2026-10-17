import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

/**
 * Google Android OAuth returns to `in.snapnear.app:/oauthredirect`.
 * Without this route Expo Router shows 404 and the signup AuthSession breaks.
 * AuthSession resolves via Linking; this screen only needs to exist.
 */
export default function OAuthRedirect() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-slate-50 px-6">
      <ActivityIndicator size="large" color="#ff8008" />
      <Text style={{ marginTop: 16, fontSize: 15, fontWeight: '600', color: '#0f172a' }}>
        Completing Google sign-in…
      </Text>
      <Text style={{ marginTop: 6, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
        Please wait a moment.
      </Text>
    </View>
  );
}
