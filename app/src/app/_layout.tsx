import '../lib/nativewind-setup';
import '../global.css';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CheckoutHost from '../components/payment/CheckoutHost';
import Toaster from '../components/ui/Toaster';
import { AuthProvider } from '../context/AuthContext';
import { CatalogProvider } from '../context/CatalogContext';
import { SocketProvider } from '../context/SocketContext';
import { completeAuthSessionIfNeeded, isAuthCallbackUrl } from '../lib/completeAuthSession';
import { kv } from '../lib/storage';

SplashScreen.preventAutoHideAsync().catch(() => {});

// OAuth popup must complete BEFORE expo-router Redirects wipe the URL hash.
completeAuthSessionIfNeeded();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [authCallback] = useState(() => isAuthCallbackUrl());

  useEffect(() => {
    completeAuthSessionIfNeeded();
    if (authCallback) {
      // Keep retrying briefly — opener may still be wiring the session listener.
      const t = setInterval(() => completeAuthSessionIfNeeded(), 200);
      const stop = setTimeout(() => clearInterval(t), 4000);
      return () => {
        clearInterval(t);
        clearTimeout(stop);
      };
    }
    kv.hydrate().finally(() => {
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    });
  }, [authCallback]);

  // Popup after Google: do not mount RouteGuards (they send guests to /login).
  if (authCallback) {
    SplashScreen.hideAsync().catch(() => {});
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <ActivityIndicator size="large" color="#ff8008" />
        <Text style={{ marginTop: 16, fontSize: 15, fontWeight: '600', color: '#0f172a' }}>
          Completing Google sign-in…
        </Text>
        <Text style={{ marginTop: 6, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
          This window will close automatically.
        </Text>
      </View>
    );
  }

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View className="w-full flex-1 bg-slate-50" style={{ width: '100%', flex: 1 }}>
        <CatalogProvider>
          <AuthProvider>
            <SocketProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#f8fafc', width: '100%', flex: 1 },
                }}
              />
              <CheckoutHost />
            </SocketProvider>
          </AuthProvider>
        </CatalogProvider>
        <Toaster />
      </View>
    </SafeAreaProvider>
  );
}
