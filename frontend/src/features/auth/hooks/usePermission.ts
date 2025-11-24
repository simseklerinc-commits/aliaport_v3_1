// frontend/src/features/auth/hooks/usePermission.ts
/**
 * Custom hooks for permission checks.
 * Use these when you need permission logic without wrapping components.
 */
import { useAuth } from '../context/AuthContext';

/**
 * Check if user has specific role(s).
 * 
 * @example
 * const canManageUsers = useRole(['SISTEM_YONETICISI']);
 * if (canManageUsers) { ... }
 */
export function useRole(roles: string[]): boolean {
  const { hasRole } = useAuth();
  return hasRole(roles);
}

/**
 * Check if user has specific permission.
 * 
 * @example
 * const canWriteCari = usePermission('cari', 'write');
 * if (canWriteCari) { ... }
 */
export function usePermission(resource: string, action: string): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(resource, action);
}

/**
 * Check if user has any of the given permissions.
 * 
 * @example
 * const canManageCari = usePermissions([
 *   { resource: 'cari', action: 'write' },
 *   { resource: 'cari', action: 'delete' }
 * ], 'any');
 */
export function usePermissions(
  permissions: Array<{ resource: string; action: string }>,
  mode: 'any' | 'all' = 'any'
): boolean {
  const { hasPermission } = useAuth();

  if (mode === 'any') {
    return permissions.some(p => hasPermission(p.resource, p.action));
  }

  return permissions.every(p => hasPermission(p.resource, p.action));
}

/**
 * Get current user's full permission list.
 * 
 * @example
 * const permissions = useUserPermissions();
 * console.log(permissions); // ["cari:read", "cari:write", ...]
 */
export function useUserPermissions(): string[] {
  const { user } = useAuth();
  return user?.permissions || [];
}

/**
 * Get current user's roles.
 * 
 * @example
 * const roles = useUserRoles();
 * console.log(roles); // [{ id: 1, name: "OPERASYON" }]
 */
export function useUserRoles() {
  const { user } = useAuth();
  return user?.roles || [];
}
