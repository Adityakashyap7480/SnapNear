import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY } from '../config/constants';

// SecureStore keys only allow letters, numbers, ".", "-" and "_"
let token: string | null = null;

/** The login token lives in the device keychain; a copy is kept in memory for synchronous reads. */
export const tokenStore = {
  load: async () => {
    token = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
    return token;
  },
  get: () => token,
  set: async (value: string) => {
    token = value;
    await SecureStore.setItemAsync(TOKEN_KEY, value);
  },
  remove: async () => {
    token = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
  },
};

const KV_PREFIX = 'snapnear.';
const cache = new Map<string, string>();

/** Small synchronous key-value store for per-device flags, persisted to AsyncStorage. */
export const kv = {
  hydrate: async () => {
    try {
      const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(KV_PREFIX));
      const pairs = await AsyncStorage.multiGet(keys);
      pairs.forEach(([k, v]) => v !== null && cache.set(k, v));
    } catch {
      /* storage unavailable */
    }
  },
  get: (key: string) => cache.get(key) ?? null,
  set: (key: string, value: string) => {
    cache.set(key, value);
    AsyncStorage.setItem(key, value).catch(() => {});
  },
};
