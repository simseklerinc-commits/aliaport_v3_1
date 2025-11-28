// frontend/src/features/portal/services/portalAuthService.ts
import { PortalLoginCredentials, PortalTokenResponse, PortalUser } from '../types/portal.types';
import { PORTAL_API_BASE, PORTAL_API_ORIGIN } from '../config';

if (import.meta.env.DEV) {
  console.debug('[PortalAuthService] API origin resolved to', PORTAL_API_ORIGIN);
}

class PortalAuthService {
  async login(credentials: PortalLoginCredentials): Promise<PortalTokenResponse> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username); // OAuth2PasswordRequestForm
    formData.append('password', credentials.password);

    const response = await fetch(`${PORTAL_API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Giriş başarısız' }));
      throw new Error(error.detail || 'E-posta veya şifre hatalı');
    }

    return response.json();
  }

  async getCurrentUser(token: string): Promise<PortalUser> {
    const response = await fetch(`${PORTAL_API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Kullanıcı bilgileri alınamadı');
    }

    return response.json();
  }

  async changePassword(token: string, oldPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${PORTAL_API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Şifre değiştirilemedi' }));
      throw new Error(error.detail || 'Şifre değiştirilemedi');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const response = await fetch(`${PORTAL_API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'İşlem başarısız' }));
      throw new Error(error.detail || 'İşlem başarısız');
    }
  }
}

export const portalAuthService = new PortalAuthService();
