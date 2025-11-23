// frontend/src/features/auth/components/ProtectedRoute.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[]; // Optional role restriction
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles, fallback }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return <div className="p-4 text-sm">Yükleniyor...</div>;
  }
  if (!isAuthenticated) {
    return fallback || <div className="p-4 text-sm text-red-600">Erişim için giriş yapınız.</div>;
  }
  if (roles && roles.length > 0 && !hasRole(roles)) {
    return <div className="p-4 text-sm text-orange-600">Rol yetkisi yok: {roles.join(', ')}</div>;
  }
  return <>{children}</>;
};
