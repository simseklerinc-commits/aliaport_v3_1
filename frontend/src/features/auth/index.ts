// frontend/src/features/auth/index.ts
/**
 * Auth feature barrel export.
 * Provides easy imports for auth-related functionality.
 */

// Context
export { AuthProvider, useAuth } from './context/AuthContext';

// Components
export { RoleBoundary, PermissionBoundary } from './components/RoleBoundary';
export { RBACDemo } from './components/RBACDemo';

// Hooks
export {
  useRole,
  usePermission,
  usePermissions,
  useUserPermissions,
  useUserRoles,
} from './hooks/usePermission';

// Services
export { authService } from './services/authService';

// Types
export type {
  User,
  Role,
  TokenResponse,
  LoginCredentials,
  UserCreate,
  UserUpdate,
  AuthContextValue,
} from './types/auth.types';
