import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { UserRole } from '../config/constants';
import { useAuth } from './AuthContext';

interface RoleContextType {
  currentRole: UserRole;
  switchRole: () => void;
  setRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentRole, setCurrentRole] = useState<UserRole>('viewer');

  // Always derive role from Firestore user profile when user identity changes
  useEffect(() => {
    if (user?.role) {
      setCurrentRole(user.role);
    } else if (!user) {
      setCurrentRole('viewer');
    }
  }, [user?.id]);

  const setRole = useCallback((role: UserRole) => {
    setCurrentRole(role);
  }, []);

  const switchRole = useCallback(() => {
    const newRole = currentRole === 'viewer' ? 'broadcaster' : 'viewer';
    setRole(newRole);
  }, [currentRole, setRole]);

  return (
    <RoleContext.Provider value={{ currentRole, switchRole, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
