// frontend/src/features/portal/utils/portalTokenStorage.ts

const PORTAL_TOKEN_KEY = 'portal_access_token';
const PORTAL_USER_KEY = 'portal_user';

export const portalTokenStorage = {
  saveToken(token: string): void {
    localStorage.setItem(PORTAL_TOKEN_KEY, token);
  },

  getToken(): string | null {
    return localStorage.getItem(PORTAL_TOKEN_KEY);
  },

  saveUser(user: any): void {
    localStorage.setItem(PORTAL_USER_KEY, JSON.stringify(user));
  },

  getUser(): any | null {
    const data = localStorage.getItem(PORTAL_USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  clear(): void {
    localStorage.removeItem(PORTAL_TOKEN_KEY);
    localStorage.removeItem(PORTAL_USER_KEY);
  },
};
