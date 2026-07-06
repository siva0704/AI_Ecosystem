'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser, AuthState, API_BASE } from '@/lib/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('educore_token');
    const userStr = localStorage.getItem('educore_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as AuthUser;
        setState({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem('educore_token');
        localStorage.removeItem('educore_user');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Login failed' };
      }
      localStorage.setItem('educore_token', data.token);
      localStorage.setItem('educore_user', JSON.stringify(data.user));
      setState({ user: data.user, token: data.token, isAuthenticated: true });
      return { success: true };
    } catch {
      return { success: false, error: 'Cannot connect to EduCore API. Is the backend running?' };
    }
  };

  const logout = () => {
    localStorage.removeItem('educore_token');
    localStorage.removeItem('educore_user');
    setState({ user: null, token: null, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
