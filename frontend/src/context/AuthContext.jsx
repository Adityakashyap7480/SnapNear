import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authApi } from '../api/services';
import { TOKEN_KEY } from '../config/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(Boolean(token));
  // Why the user was signed out (suspended / blocked), shown on the login page
  const [accountNotice, setAccountNotice] = useState(null);
  const userRef = useRef(null);
  userRef.current = user;

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const persistSession = useCallback(({ token: newToken, user: newUser }) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
    setAccountNotice(null);
    return newUser;
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
    const onRestricted = (e) => {
      setAccountNotice((prev) => ({ ...e.detail, email: userRef.current?.email || prev?.email }));
      logout();
    };
    window.addEventListener('snapnear:unauthorized', onUnauthorized);
    window.addEventListener('snapnear:account-restricted', onRestricted);
    return () => {
      window.removeEventListener('snapnear:unauthorized', onUnauthorized);
      window.removeEventListener('snapnear:account-restricted', onRestricted);
    };
  }, [logout]);

  const login = useCallback(async (credentials) => persistSession(await authApi.login(credentials)), [persistSession]);
  const signup = useCallback(async (payload) => persistSession(await authApi.signup(payload)), [persistSession]);
  const clearAccountNotice = useCallback(() => setAccountNotice(null), []);

  const value = useMemo(
    () => ({
      token,
      user,
      setUser,
      initializing,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
      accountNotice,
      setAccountNotice,
      clearAccountNotice,
    }),
    [token, user, initializing, login, signup, logout, accountNotice, clearAccountNotice]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
