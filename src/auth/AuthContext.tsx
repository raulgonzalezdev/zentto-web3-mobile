import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchMe, logout as apiLogout } from '../api/auth';
import { registerForPush } from '../lib/push';
import type { User } from '../api/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  refreshMe: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      /* aunque falle, limpiamos sesión local */
    }
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await fetchMe();
        if (active) setUser(me);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Registrar push tras tener sesión (idempotente; no-op en web; tolerante a
  // falta de config FCM). No envía el token a ningún endpoint todavía.
  useEffect(() => {
    if (user) void registerForPush();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refreshMe, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
