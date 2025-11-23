// frontend/src/features/auth/services/authService.ts
/**
 * Authentication service: Login, logout, token refresh operations.
 */
import { apiClient } from '@/core/api/client';
import type { LoginCredentials, TokenResponse, User } from '../types/auth.types';

const AUTH_API = '/auth';

export const authService = {
  /**
   * Login user and get JWT tokens.
   */
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>(
      `${AUTH_API}/login`,
      credentials
    );
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Login failed');
    }
    
    return response.data;
  },

  /**
   * Logout current user (client-side token removal).
   */
  async logout(): Promise<void> {
    await apiClient.post(`${AUTH_API}/logout`);
  },

  /**
   * Refresh access token using refresh token.
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>(
      `${AUTH_API}/refresh`,
      { refresh_token: refreshToken }
    );
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Token refresh failed');
    }
    
    return response.data;
  },

  /**
   * Get current authenticated user info.
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>(`${AUTH_API}/me`);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get user');
    }
    
    return response.data;
  },
};
