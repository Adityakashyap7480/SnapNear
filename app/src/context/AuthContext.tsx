import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { authApi } from '../api/services';
import { APP_EVENTS } from '../config/events';
import { appEvents } from '../lib/emitter';
import { clearAppBadge, registerForPush, unregisterPush } from '../lib/push';
import { tokenStore } from '../lib/storage';
import type { AccountNoticeInfo, Session, User } from '../types';

interface AuthValue {
  token: string | null;
  user: User | null;
  setUser: (user: User) => void;
  initializing: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  signup: (payload: Record<string, unknown>) => Promise<User>;
  verifySignupOtp: (payload: { email: string; otp: string }) => Promise<User>;
  logout: () => void;
  accountNotice: AccountNoticeInfo | null;
  setAccountNotice: (notice: AccountNoticeInfo | null) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  // Why the user was signed out (suspended / blocked), shown on the login page
  const [accountNotice, setAccountNotice] = useState<AccountNoticeInfo | null>(null);
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const logout = useCallback(() => {
    void unregisterPush();
    tokenStore.remove();
    setToken(null);
    setUser(null);
  }, []);

  const persistSession = useCallback(async ({ token: newToken, user: newUser }: Session) => {
    await tokenStore.set(newToken);
    setToken(newToken);
    setUser(newUser);
    setAccountNotice(null);
    // Register device for background shoot alerts (banner + app-icon badge).
    void registerForPush();
    void clearAppBadge();
    return newUser;
  }, []);

  // Only validate the stored token on first load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await tokenStore.load();
      if (cancelled) return;
      if (!stored) {
        setInitializing(false);
        return;
      }
      setToken(stored);
      try {
        const res = await authApi.me();
        if (!cancelled) {
          setUser(res.user);
          void registerForPush();
          void clearAppBadge();
        }
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  useEffect(() => {
    const offUnauthorized = appEvents.on(APP_EVENTS.UNAUTHORIZED, () => logout());
    const offRestricted = appEvents.on<AccountNoticeInfo>(APP_EVENTS.ACCOUNT_RESTRICTED, (detail) => {
      setAccountNotice((prev) => ({ ...detail, email: userRef.current?.email || prev?.email }));
      logout();
    });
    return () => {
      offUnauthorized();
      offRestricted();
    };
  }, [logout]);

  // Clear the launcher badge whenever the user comes back into SnapNear.
  useEffect(() => {
    if (!token) return undefined;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void clearAppBadge();
    });
    return () => sub.remove();
  }, [token]);

  const login = useCallback(
    async (credentials: { email: string; password: string }) => persistSession(await authApi.login(credentials)),
    [persistSession]
  );
  const signup = useCallback(async (payload: Record<string, unknown>) => persistSession(await authApi.signup(payload)), [persistSession]);
  const verifySignupOtp = useCallback(
    async (payload: { email: string; otp: string }) => persistSession(await authApi.verifySignupOtp(payload)),
    [persistSession]
  );

  const value = useMemo(
    () => ({ token, user, setUser, initializing, login, signup, verifySignupOtp, logout, accountNotice, setAccountNotice }),
    [token, user, initializing, login, signup, verifySignupOtp, logout, accountNotice]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
