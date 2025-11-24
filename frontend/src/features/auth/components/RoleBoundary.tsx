// frontend/src/features/auth/components/RoleBoundary.tsx
/**
 * RoleBoundary: Component-level role protection.
 * 
 * Usage:
 *   <RoleBoundary roles={["SISTEM_YONETICISI", "OPERASYON"]}>
 *     <AdminPanel />
 *   </RoleBoundary>
 */
import React from 'react';
import { useAuth } from '../context/AuthContext';

interface RoleBoundaryProps {
  /** Required role names (OR logic: user needs at least one) */
  roles: string[];
  /** Content to show when user lacks required role */
  fallback?: React.ReactNode;
  /** Children to render if user has required role */
  children: React.ReactNode;
}

export const RoleBoundary: React.FC<RoleBoundaryProps> = ({
  roles,
  fallback = <UnauthorizedFallback />,
  children,
}) => {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!hasRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * PermissionBoundary: Component-level permission protection.
 * 
 * Usage:
 *   <PermissionBoundary resource="cari" action="write">
 *     <CariCreateButton />
 *   </PermissionBoundary>
 */
interface PermissionBoundaryProps {
  /** Resource name (e.g., "cari", "workorder") */
  resource: string;
  /** Action name (e.g., "read", "write", "delete") */
  action: string;
  /** Content to show when user lacks permission */
  fallback?: React.ReactNode;
  /** Children to render if user has permission */
  children: React.ReactNode;
}

export const PermissionBoundary: React.FC<PermissionBoundaryProps> = ({
  resource,
  action,
  fallback = null, // Default: hide content silently
  children,
}) => {
  const { hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Default loading state while auth is initializing.
 */
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
  </div>
);

/**
 * Default unauthorized fallback UI.
 */
const UnauthorizedFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="mb-4 rounded-full bg-red-100 p-3">
      <svg
        className="h-8 w-8 text-red-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Yetki Gerekli</h3>
    <p className="text-sm text-gray-600 max-w-sm">
      Bu içeriği görüntülemek için gerekli yetkiniz bulunmamaktadır.
      Yöneticinizle iletişime geçin.
    </p>
  </div>
);
