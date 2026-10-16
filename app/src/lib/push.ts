import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { authApi } from '../api/services';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let cachedToken: string | null = null;
let channelReady = false;

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android' || channelReady) return;
  await Notifications.setNotificationChannelAsync('shoots', {
    name: 'Shoot alerts',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 150, 250],
    lightColor: '#ff8008',
    sound: 'default',
  });
  channelReady = true;
}

function projectId(): string | undefined {
  return Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
}

/** Ask permission, get Expo push token, register it with the SnapNear API. */
export async function registerForPush(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) return null;

  try {
    await ensureAndroidChannel();

    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      const asked = await Notifications.requestPermissionsAsync();
      status = asked.status;
    }
    if (status !== 'granted') return null;

    const id = projectId();
    const tokenRes = id
      ? await Notifications.getExpoPushTokenAsync({ projectId: id })
      : await Notifications.getExpoPushTokenAsync();
    const token = tokenRes.data;
    if (!token) return null;

    cachedToken = token;
    await authApi.registerPushToken({ token, platform: Platform.OS === 'ios' ? 'ios' : 'android' });
    return token;
  } catch {
    return null;
  }
}

export async function unregisterPush() {
  if (Platform.OS === 'web') return;
  const token = cachedToken;
  cachedToken = null;
  try {
    await authApi.clearPushToken(token ? { token } : {});
  } catch {
    // Best-effort on logout
  }
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch {
    // ignore
  }
}

/** Clear the red "1" on the app icon when the user opens SnapNear. */
export async function clearAppBadge() {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch {
    // ignore
  }
}
