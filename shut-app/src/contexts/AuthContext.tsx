import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, AuthState } from '../types';
import { UserRole } from '../config/constants';
import { getStoredData, setStoredData, removeStoredData } from '../utils/storage';
import { authService } from '../services';

const STORAGE_KEY = '@shut_auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, displayName: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isGuest: false,
  });

  // Restore auth state on mount
  useEffect(() => {
    (async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setState({ user, isAuthenticated: true, isLoading: false, isGuest: false });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.login(email, password);
    if (result.success && result.user) {
      setState({ user: result.user, isAuthenticated: true, isLoading: false, isGuest: false });
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
  ) => {
    const result = await authService.register(email, password, displayName, role);
    if (result.success && result.user) {
      setState({ user: result.user, isAuthenticated: true, isLoading: false, isGuest: false });
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setState({ user: null, isAuthenticated: false, isLoading: false, isGuest: false });
  }, []);

  const refreshUser = useCallback(async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      setState(prev => ({ ...prev, user }));
    }
  }, []);

  const enterGuestMode = useCallback(() => {
    setState({ user: null, isAuthenticated: false, isLoading: false, isGuest: true });
  }, []);

  const exitGuestMode = useCallback(() => {
    setState(prev => ({ ...prev, isGuest: false }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, enterGuestMode, exitGuestMode, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
