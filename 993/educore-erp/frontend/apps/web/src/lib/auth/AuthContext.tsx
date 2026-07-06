'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { AuthUser, AuthState, API_BASE } from '@/lib/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Proactively refresh the access token 2 minutes before it expires (15m - 2m = 13m)
const REFRESH_BEFORE_EXPIRY_MS = 2 * 60 * 1000;
const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleTokenRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',  // Sends the httpOnly cookie
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.token) {
            localStorage.setItem('educore_token', data.token);
            setState((prev) => ({ ...prev, token: data.token }));
            scheduleTokenRefresh(); // Schedule the next refresh
          } else {
            // Refresh failed — session truly expired
            handleSessionExpired();
          }
        } else {
          handleSessionExpired();
        }
      } catch {
        // Network error during refresh — keep trying until fully offline
        scheduleTokenRefresh();
      }
    }, ACCESS_TOKEN_LIFETIME_MS - REFRESH_BEFORE_EXPIRY_MS);
  }, []);

  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('educore_token');
    localStorage.removeItem('educore_user');
    setState({ user: null, token: null, isAuthenticated: false });
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  // Rehydrate from localStorage on mount — attempt silent refresh to confirm session is alive
  useEffect(() => {
    const token = localStorage.getItem('educore_token');
    const userStr = localStorage.getItem('educore_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as AuthUser;
        setState({ user, token, isAuthenticated: true });
        // Immediately try a silent refresh to extend the session
        // (token may have expired while the browser was closed)
        scheduleTokenRefresh();
      } catch {
        localStorage.removeItem('educore_token');
        localStorage.removeItem('educore_user');
      }
    }
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleTokenRefresh]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',   // Allow cookie to be set from the response
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Login failed' };
      }
      localStorage.setItem('educore_token', data.token);
      localStorage.setItem('educore_user', JSON.stringify(data.user));
      setState({ user: data.user, token: data.token, isAuthenticated: true });
      scheduleTokenRefresh(); // Start the auto-refresh timer
      return { success: true };
    } catch {
      return { success: false, error: 'Cannot connect to EduCore API. Is the backend running?' };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('educore_token');
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
    } catch {
      // Ignore network errors during logout
    }
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    localStorage.removeItem('educore_token');
    localStorage.removeItem('educore_user');
    setState({ user: null, token: null, isAuthenticated: false });
  };

  const getAccessToken = () => state.token;

  return (
    <AuthContext.Provider value={{ ...state, login, logout, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
