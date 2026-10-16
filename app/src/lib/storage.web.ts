import { TOKEN_KEY } from '../config/constants';

// Same localStorage key as the admin app on this domain, so one login works for both.
export const tokenStore = {
  load: async () => localStorage.getItem(TOKEN_KEY),
  get: () => localStorage.getItem(TOKEN_KEY),
  set: async (token: string) => localStorage.setItem(TOKEN_KEY, token),
  remove: async () => localStorage.removeItem(TOKEN_KEY),
};

/** Small synchronous key-value store for per-device flags. */
export const kv = {
  hydrate: async () => {},
  get: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage unavailable */
    }
  },
};
