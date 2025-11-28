// frontend/src/features/portal/context/PortalAuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { PortalAuthContextValue, PortalUser, PortalLoginCredentials } from '../types/portal.types';
import { portalAuthService } from '../services/portalAuthService';
import { portalTokenStorage } from '../utils/portalTokenStorage';
import { toast } from 'sonner';

const PortalAuthContext = createContext<PortalAuthContextValue | undefined>(undefined);

export const PortalAuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadUser = useCallback(async () => {
    const token = portalTokenStorage.getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await portalAuthService.getCurrentUser(token);
      setUser(userData);
      portalTokenStorage.saveUser(userData);
    } catch {
      portalTokenStorage.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (credentials: PortalLoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await portalAuthService.login(credentials);
      portalTokenStorage.saveToken(response.access_token);
      
      // Kullanıcı bilgilerini kaydet
      const userData: PortalUser = {
        id: response.user_id,
        email: response.email,
        full_name: response.full_name,
        cari_id: response.cari_id,
        cari_code: response.cari_code,
        is_admin: response.is_admin,
        is_active: true,
        must_change_password: response.must_change_password || false,
        created_at: response.created_at,
      };
      
      setUser(userData);
      portalTokenStorage.saveUser(userData);
      toast.success('Giriş başarılı');
    } catch (e: any) {
      toast.error(e?.message || 'Giriş başarısız');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    portalTokenStorage.clear();
    setUser(null);
    toast.info('Çıkış yapıldı');
  }, []);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    const token = portalTokenStorage.getToken();
    if (!token) {
      throw new Error('Oturum bulunamadı');
    }

    await portalAuthService.changePassword(token, oldPassword, newPassword);
    toast.success('Şifre başarıyla değiştirildi');
  }, []);

  const value: PortalAuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    changePassword,
  };

  return <PortalAuthContext.Provider value={value}>{children}</PortalAuthContext.Provider>;
};

export function usePortalAuth(): PortalAuthContextValue {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error('usePortalAuth PortalAuthProvider içinde kullanılmalı');
  return ctx;
}
