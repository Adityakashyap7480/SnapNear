import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authApi } from '../api/services';
import { TOKEN_KEY } from '../config/constants';
import { APP_EVENTS } from '../config/events';
import type { AccountNoticeInfo, User } from '../types';

interface AuthValue {
  token: string | null;
  user: User | null;
  initializing: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  logout: () => void;
  accountNotice: AccountNoticeInfo | null;
  setAccountNotice: (notice: AccountNoticeInfo | null) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(Boolean(token));
  // Why the user was signed out (suspended / blocked), shown on the login page
  const [accountNotice, setAccountNotice] = useState<AccountNoticeInfo | null>(null);
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setInitializing(false);
      return;
    }
    let cancelled = false;
    authApi
      .me()
      .then((res) => !cancelled && setUser(res.user))
      .catch(() => !cancelled && logout())
      .finally(() => !cancelled && setInitializing(false));
    return () => {
      cancelled = true;
    };
    // Only validate the stored token on first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onUnauthorized = () => logout();
    const onRestricted = (e: Event) => {
      const detail = (e as CustomEvent<AccountNoticeInfo>).detail;
      setAccountNotice((prev) => ({ ...detail, email: userRef.current?.email || prev?.email }));
      logout();
    };
    window.addEventListener(APP_EVENTS.UNAUTHORIZED, onUnauthorized);
    window.addEventListener(APP_EVENTS.ACCOUNT_RESTRICTED, onRestricted);
    return () => {
      window.removeEventListener(APP_EVENTS.UNAUTHORIZED, onUnauthorized);
      window.removeEventListener(APP_EVENTS.ACCOUNT_RESTRICTED, onRestricted);
    };
  }, [logout]);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    const session = await authApi.login(credentials);
    localStorage.setItem(TOKEN_KEY, session.token);
    setToken(session.token);
    setUser(session.user);
    setAccountNotice(null);
    return session.user;
  }, []);

  const value = useMemo(
    () => ({ token, user, initializing, login, logout, accountNotice, setAccountNotice }),
    [token, user, initializing, login, logout, accountNotice]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
