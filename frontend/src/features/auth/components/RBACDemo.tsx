// frontend/src/features/auth/components/RBACDemo.tsx
/**
 * RBAC Demo Component - Permission ve Role kontrollerini gösterir.
 * Sadece test/demo amaçlı, production'da kullanılmaz.
 */
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleBoundary, PermissionBoundary } from './RoleBoundary';
import { usePermission, useUserPermissions, useUserRoles } from '../hooks/usePermission';

export const RBACDemo: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const permissions = useUserPermissions();
  const roles = useUserRoles();
  const canWriteCari = usePermission('cari', 'write');
  const canDeleteCari = usePermission('cari', 'delete');
  const canApproveWorkOrder = usePermission('workorder', 'approve');

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Giriş Yapılmadı</h2>
        <p className="text-gray-600">RBAC demo için lütfen giriş yapın</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* User Info */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Kullanıcı Bilgileri</h2>
        <div className="space-y-2">
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Ad Soyad:</strong> {user?.full_name || '-'}</p>
          <p><strong>Superuser:</strong> {user?.is_superuser ? '✓ Evet' : '✗ Hayır'}</p>
          <p><strong>Aktif:</strong> {user?.is_active ? '✓ Evet' : '✗ Hayır'}</p>
        </div>
      </section>

      {/* Roles */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Roller ({roles.length})</h2>
        <div className="flex flex-wrap gap-2">
          {roles.map(role => (
            <span
              key={role.id}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
            >
              {role.name}
            </span>
          ))}
        </div>
      </section>

      {/* Permissions */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">İzinler ({permissions.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {permissions.map(perm => (
            <div
              key={perm}
              className="px-3 py-2 bg-green-50 text-green-700 rounded border border-green-200 text-sm font-mono"
            >
              {perm}
            </div>
          ))}
        </div>
      </section>

      {/* Permission Checks */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Permission Kontrolleri</h2>
        <div className="space-y-3">
          <PermissionCheck label="cari:write" hasPermission={canWriteCari} />
          <PermissionCheck label="cari:delete" hasPermission={canDeleteCari} />
          <PermissionCheck label="workorder:approve" hasPermission={canApproveWorkOrder} />
        </div>
      </section>

      {/* RoleBoundary Demo */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">RoleBoundary Demo</h2>
        
        <div className="space-y-4">
          <RoleBoundary roles={["SISTEM_YONETICISI"]}>
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <strong className="text-red-900">Admin İçerik:</strong>
              <p className="text-red-700">Bu içeriği sadece SISTEM_YONETICISI rolüne sahip kullanıcılar görebilir.</p>
            </div>
          </RoleBoundary>

          <RoleBoundary roles={["OPERASYON", "FINANS"]}>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <strong className="text-blue-900">Operasyon/Finans İçerik:</strong>
              <p className="text-blue-700">Bu içeriği OPERASYON veya FINANS rolüne sahip kullanıcılar görebilir.</p>
            </div>
          </RoleBoundary>
        </div>
      </section>

      {/* PermissionBoundary Demo */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">PermissionBoundary Demo</h2>
        
        <div className="space-y-4">
          <PermissionBoundary resource="cari" action="write">
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Yeni Cari Ekle (cari:write gerekli)
            </button>
          </PermissionBoundary>

          <PermissionBoundary
            resource="cari"
            action="delete"
            fallback={
              <div className="px-4 py-2 bg-gray-200 text-gray-600 rounded">
                Cari Sil (izin yok - cari:delete gerekli)
              </div>
            }
          >
            <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Cari Sil (cari:delete gerekli)
            </button>
          </PermissionBoundary>

          <PermissionBoundary resource="workorder" action="approve">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              İş Emri Onayla (workorder:approve gerekli)
            </button>
          </PermissionBoundary>
        </div>
      </section>
    </div>
  );
};

// Helper component
const PermissionCheck: React.FC<{ label: string; hasPermission: boolean }> = ({
  label,
  hasPermission,
}) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
    <code className="text-sm font-mono">{label}</code>
    <span className={`px-3 py-1 rounded text-sm font-medium ${
      hasPermission 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {hasPermission ? '✓ Var' : '✗ Yok'}
    </span>
  </div>
);
