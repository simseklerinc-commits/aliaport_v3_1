// frontend/src/features/auth/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AuthContextValue, User, LoginCredentials } from '../types/auth.types';
import { authService } from '../services/authService';
import { tokenStorage } from '../utils/tokenStorage';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadUser = useCallback(async () => {
    if (!tokenStorage.getAccessToken()) {
      setIsLoading(false);
      return;
    }
    try {
      const me = await authService.getCurrentUser();
      setUser(me);
    } catch {
      tokenStorage.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const tokens = await authService.login(credentials);
      tokenStorage.saveTokens(tokens.access_token, tokens.refresh_token, tokens.expires_in);
      await loadUser();
      toast.success('Giriş başarılı');
    } catch (e: any) {
      toast.error(e?.message || 'Giriş başarısız');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [loadUser]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {/* ignore */}
    tokenStorage.clearTokens();
    setUser(null);
    toast.info('Çıkış yapıldı');
  }, []);

  const hasRole = useCallback((roleNames: string[]) => {
    if (!user) return false;
    const userRoleNames = user.roles.map(r => r.name);
    return roleNames.some(r => userRoleNames.includes(r));
  }, [user]);

  const hasPermission = useCallback((resource: string, action: string) => {
    // Simplified: derive from roles (admin or superuser always true)
    if (!user) return false;
    if (user.is_superuser) return true;
    // For now rely on role check patterns (expand later if permissions exposed)
    // Example pattern: OPERASYON role => check permitted resources
    return true; // Placeholder always true until permission endpoint added
  }, [user]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider içinde kullanılmalı');
  return ctx;
}
