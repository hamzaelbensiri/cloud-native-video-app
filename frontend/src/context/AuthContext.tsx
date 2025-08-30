import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { api, attachAuthHandlers } from '@/api/client';
import { me as apiMe } from '@/api/auth';
import type { User, Role, TokenWithUser } from '@/types/api';

type JwtPayload = { role?: string; sub?: string; exp?: number; [k: string]: any };

type AuthContextType = {
  isAuthenticated: boolean;
  authReady: boolean;
  token: string | null;
  user: User | null;
  role: Role | null;

  setAuth: (token: string, user?: User | null) => Promise<void>;
  clearAuth: () => void;
  hydrateUser: () => Promise<void>;

  // NEW
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  authReady: false,
  token: null,
  user: null,
  role: null,
  setAuth: async () => {},
  clearAuth: () => {},
  hydrateUser: async () => {},
  login: async () => {},
  logout: () => {},
});

const LS_KEY = 'access_token';

function normalizeRole(r: string | null | undefined): Role | null {
  if (!r) return null;
  const v = r.toString().trim().toLowerCase();
  if (v === 'admin' || v === 'administrator') return 'admin';
  if (v === 'creator' || v === 'author' || v === 'uploader') return 'creator';
  if (v === 'consumer' || v === 'viewer' || v === 'user') return 'consumer';
  return null;
}

function parseRole(token: string | null, user?: User | null): Role | null {
  if (user?.role) return normalizeRole(user.role);
  if (token) {
    try {
      const payload = jwtDecode<JwtPayload>(token);
      if (payload?.role) return normalizeRole(payload.role);
    } catch {}
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Read token synchronously on first render (avoid redirect flicker)
  const initialToken = (() => {
    try { return localStorage.getItem(LS_KEY); } catch { return null; }
  })();

  const [token, setToken] = useState<string | null>(initialToken);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(parseRole(initialToken, null));
  const [authReady, setAuthReady] = useState<boolean>(false);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    setRole(null);
    setAuthReady(true);
    try { localStorage.removeItem(LS_KEY); } catch {}
  }, []);

  const hydrateUser = useCallback(async () => {
    if (!token) return;
    try {
      const u = await apiMe(); // GET /auth/me (returns User) 
      setUser(u);
      setRole(parseRole(token, u));
    } catch (e) {
      console.warn('[Auth] /auth/me failed, clearing auth.', e);
      clearAuth();
    }
  }, [token, clearAuth]);

  const setAuth = useCallback(async (newToken: string, maybeUser?: User | null) => {
    setToken(newToken);
    try { localStorage.setItem(LS_KEY, newToken); } catch {}
    setRole(parseRole(newToken, maybeUser || null));
    if (maybeUser) setUser(maybeUser);
    await hydrateUser(); // confirm user/role from server
  }, [hydrateUser]);

  // ✅ NEW: login using form-encoded /auth/login (OAuth2PasswordRequestForm) 
  const login = useCallback(async (email: string, password: string) => {
    const body = new URLSearchParams();
    body.set('username', email);   // backend reads 'username' as email
    body.set('password', password);

    const { data } = await api.post<TokenWithUser>('/auth/login', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    await setAuth(data.access_token, data.user);
  }, [setAuth]);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  // Attach axios interceptors once
  useEffect(() => {
    attachAuthHandlers({
      getToken: () => token,
      onUnauthorized: () => clearAuth(),
    });
  }, [token, clearAuth]);

  // Hydrate on mount/token change, then mark ready
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (token) await hydrateUser();
      if (!cancelled) setAuthReady(true);
    })();
    return () => { cancelled = true; };
  }, [token, hydrateUser]);

  const value = useMemo<AuthContextType>(() => ({
    isAuthenticated: !!token,
    authReady,
    token,
    user,
    role,
    setAuth,
    clearAuth,
    hydrateUser,
    login,
    logout,
  }), [token, user, role, setAuth, clearAuth, hydrateUser, authReady, login, logout]);

  // dev debug
  useEffect(() => {
    if (authReady) {
      // eslint-disable-next-line no-console
      console.debug('[Auth] ready:', authReady, 'isAuth:', !!token, 'role:', role, 'user:', user);
    }
  }, [authReady, token, role, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
