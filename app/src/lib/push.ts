import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { isRunningInExpoGo } from 'expo';
import { authApi } from '../api/services';

type NotificationsModule = typeof import('expo-notifications');

/**
 * Expo Go on Android no longer ships remote-push native modules
 * (ExpoTopicSubscriptionModule). Importing expo-notifications there throws
 * and takes down the whole app — skip the package until a dev build.
 */
const pushUnsupported = Platform.OS === 'android' && isRunningInExpoGo();

let Notifications: NotificationsModule | null = null;
let handlerReady = false;
let cachedToken: string | null = null;
let channelReady = false;

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (pushUnsupported) return null;
  if (Notifications) return Notifications;
  try {
    Notifications = await import('expo-notifications');
    if (!handlerReady) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      handlerReady = true;
    }
    return Notifications;
  } catch {
    return null;
  }
}

async function ensureAndroidChannel(n: NotificationsModule) {
  if (Platform.OS !== 'android' || channelReady) return;
  await n.setNotificationChannelAsync('shoots', {
    name: 'Shoot alerts',
    importance: n.AndroidImportance.MAX,
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
    const n = await loadNotifications();
    if (!n) return null;

    await ensureAndroidChannel(n);

    const current = await n.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      const asked = await n.requestPermissionsAsync();
      status = asked.status;
    }
    if (status !== 'granted') return null;

    const id = projectId();
    const tokenRes = id
      ? await n.getExpoPushTokenAsync({ projectId: id })
      : await n.getExpoPushTokenAsync();
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
    const n = await loadNotifications();
    if (n) await n.setBadgeCountAsync(0);
  } catch {
    // ignore
  }
}

/** Clear the red "1" on the app icon when the user opens SnapNear. */
export async function clearAppBadge() {
  if (Platform.OS === 'web') return;
  try {
    const n = await loadNotifications();
    if (n) await n.setBadgeCountAsync(0);
  } catch {
    // ignore
  }
}
