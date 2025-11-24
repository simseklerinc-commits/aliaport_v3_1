// frontend/src/features/auth/types/auth.types.ts
/**
 * Authentication types for JWT-based auth system.
 */

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  roles: Role[];
  permissions?: string[]; // e.g., ["cari:read", "workorder:write"]
  created_at: string;
  last_login: string | null;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number; // seconds (900 for 15min)
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string;
  role_ids?: number[];
  is_active?: boolean;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  password?: string;
  is_active?: boolean;
  role_ids?: number[];
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  hasRole: (roleNames: string[]) => boolean;
  hasPermission: (resource: string, action: string) => boolean;
}
