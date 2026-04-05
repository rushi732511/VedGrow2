'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import axios from 'axios';
import { adminAuthApi, setAccessToken } from './api';
import type { AdminUser } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthState {
  admin: AdminUser | null;
  isLoading: boolean;       // true while checking session on mount
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    admin: null,
    isLoading: true,    // Start as loading — we check session immediately
    isAuthenticated: false,
  });

  // ── Restore Session on Mount ───────────────────────────────────────────────
  // When the page loads/refreshes, the access token is gone (it's in memory).
  // But the refresh token cookie is still there. We call /admin/auth/refresh
  // to silently get a new access token and restore the session.
  useEffect(() => {
    async function restoreSession() {
      try {
        // Try to refresh — this sends the HTTP-only cookie automatically
        const { data: refreshData } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const token = refreshData.data.accessToken as string;
        setAccessToken(token);

        // Now fetch admin details with the new token
        const { data } = await adminAuthApi.me();
        setState({
          admin: data.data.admin,
          isLoading: false,
          isAuthenticated: true,
        });
      } catch {
        // No valid refresh token — user is not logged in
        setState({ admin: null, isLoading: false, isAuthenticated: false });
      }
    }

    restoreSession();
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const { data } = await adminAuthApi.login(email, password);
    setAccessToken(data.data.accessToken);
    setState({
      admin: data.data.admin,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await adminAuthApi.logout();
    } finally {
      // Always clear local state even if the API call fails
      setAccessToken(null);
      setState({ admin: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}