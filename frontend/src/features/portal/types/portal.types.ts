// frontend/src/features/portal/types/portal.types.ts

export interface PortalUser {
  id: number;
  email: string;
  full_name: string;
  position?: string;
  cari_id: number;
  cari_code?: string;
  cari_unvan?: string;
  is_admin: boolean;
  is_active: boolean;
  must_change_password: boolean;
  created_at?: string;
  last_login?: string;
}

export interface PortalLoginCredentials {
  username: string; // email (OAuth2PasswordRequestForm için)
  password: string;
}

export interface PortalTokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  email: string;
  full_name: string;
  cari_id: number;
  cari_code?: string;
  is_admin: boolean;
  must_change_password?: boolean;
  created_at?: string; // Firma kayıt tarihi (ISO format)
}

export interface PortalAuthContextValue {
  user: PortalUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: PortalLoginCredentials) => Promise<void>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}
