// frontend/src/features/auth/utils/tokenStorage.ts
/**
 * Token storage utilities for managing JWT tokens in localStorage.
 */

const ACCESS_TOKEN_KEY = 'aliaport_access_token';
const REFRESH_TOKEN_KEY = 'aliaport_refresh_token';
const TOKEN_EXPIRY_KEY = 'aliaport_token_expiry';

export const tokenStorage = {
  /**
   * Save tokens to localStorage.
   */
  saveTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    
    // Calculate expiry timestamp (expiresIn is in seconds)
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  },

  /**
   * Get access token from localStorage.
   */
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  /**
   * Get refresh token from localStorage.
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Check if access token is expired.
   */
  isTokenExpired(): boolean {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    
    const expiryTime = parseInt(expiry, 10);
    return Date.now() >= expiryTime;
  },

  /**
   * Clear all tokens from localStorage.
   */
  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  },
};
