import '../lib/nativewind-setup';
import '../global.css';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CheckoutHost from '../components/payment/CheckoutHost';
import Toaster from '../components/ui/Toaster';
import { AuthProvider } from '../context/AuthContext';
import { CatalogProvider } from '../context/CatalogContext';
import { SocketProvider } from '../context/SocketContext';
import { kv } from '../lib/storage';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    kv.hydrate().finally(() => {
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    });
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View className="flex-1 bg-slate-50">
        <CatalogProvider>
          <AuthProvider>
            <SocketProvider>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f8fafc' } }} />
              <CheckoutHost />
            </SocketProvider>
          </AuthProvider>
        </CatalogProvider>
        <Toaster />
      </View>
    </SafeAreaProvider>
  );
}
