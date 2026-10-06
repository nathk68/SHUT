import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { deleteObject, ref as storageRef } from 'firebase/storage';
import { deleteUser, getAuth } from 'firebase/auth';
import { db, storage } from '../config/firebase.config';
import { releaseUsername } from '../services/username/username.service';
import { User, AuthState } from '../types';
import { UserRole } from '../config/constants';
import { getStoredData, setStoredData, removeStoredData } from '../utils/storage';
import { authService, userService } from '../services';
import type { UpdateProfilePayload } from '../types/profile';

const STORAGE_KEY = '@shut_auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, displayName: string, role: UserRole) => Promise<{ success: boolean; error?: string; userId?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (patch: UpdateProfilePayload) => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
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
      return { success: true, userId: result.user.id };
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

  const deleteAccount = useCallback(async () => {
    const userId = state.user?.id;
    if (!userId) return;

    // 1. Release username reservation
    if (state.user?.username) {
      try { await releaseUsername(state.user.username); } catch {}
    }

    // 2. Delete Firestore user document
    await deleteDoc(doc(db, 'users', userId));

    // 3. Delete Storage avatar (ignore if missing)
    try {
      await deleteObject(storageRef(storage, `avatars/${userId}.jpg`));
    } catch {}

    // 4. Delete Firebase Auth user
    const fbUser = getAuth().currentUser;
    if (fbUser) await deleteUser(fbUser);

    // 5. Clear local state
    await removeStoredData(STORAGE_KEY);
    setState({ user: null, isAuthenticated: false, isLoading: false, isGuest: false });

    // Note: userFollows + likes cleanup requires a Cloud Function
    // (client-side deletion of others' documents is blocked by Firestore rules)
  }, [state.user]);

  const resetPassword = useCallback(async (email: string) => {
    return authService.resetPassword(email);
  }, []);

  const updateUser = useCallback(async (patch: UpdateProfilePayload) => {
    if (!state.user) return;
    const updated = await userService.updateProfile(state.user.id, patch);
    setState((prev) => ({ ...prev, user: updated }));
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, deleteAccount, enterGuestMode, exitGuestMode, refreshUser, updateUser, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
