# Frontend RBAC Kullanım Kılavuzu

## Genel Bakış

Frontend RBAC sistemi, backend permission yapısıyla senkronize çalışarak component seviyesinde erişim kontrolü sağlar.

## Kullanım Yöntemleri

### 1. Component Boundary (Önerilen)

#### RoleBoundary - Role Bazlı Kontrol

```tsx
import { RoleBoundary } from '@/features/auth';

function AdminDashboard() {
  return (
    <RoleBoundary roles={["SISTEM_YONETICISI"]}>
      <div>Admin Panel - Sadece admin görebilir</div>
    </RoleBoundary>
  );
}

// Çoklu rol (OR mantığı)
function ManagementPanel() {
  return (
    <RoleBoundary roles={["SISTEM_YONETICISI", "OPERASYON"]}>
      <div>Yönetim paneli - Admin VEYA Operasyon</div>
    </RoleBoundary>
  );
}

// Özel fallback
function RestrictedSection() {
  return (
    <RoleBoundary
      roles={["FINANS"]}
      fallback={<div>Bu bölüme erişim için Finans rolü gerekli</div>}
    >
      <FinancialReports />
    </RoleBoundary>
  );
}
```

#### PermissionBoundary - Permission Bazlı Kontrol

```tsx
import { PermissionBoundary } from '@/features/auth';

function CariModule() {
  return (
    <div>
      {/* Sadece cari:write iznine sahip kullanıcılar görebilir */}
      <PermissionBoundary resource="cari" action="write">
        <button>Yeni Cari Ekle</button>
      </PermissionBoundary>

      {/* cari:delete iznine sahip olmayanlar için buton gizlenir */}
      <PermissionBoundary resource="cari" action="delete">
        <button className="danger">Sil</button>
      </PermissionBoundary>
    </div>
  );
}

// Özel fallback
function WorkOrderApproval() {
  return (
    <PermissionBoundary
      resource="workorder"
      action="approve"
      fallback={<span className="text-gray-500">Onaylama yetkisi yok</span>}
    >
      <button>İş Emrini Onayla</button>
    </PermissionBoundary>
  );
}
```

### 2. Hook Bazlı Kullanım

#### useRole - Role Kontrolü

```tsx
import { useRole } from '@/features/auth';

function UserMenu() {
  const isAdmin = useRole(['SISTEM_YONETICISI']);
  const canManage = useRole(['SISTEM_YONETICISI', 'OPERASYON']);

  return (
    <div>
      <button>Profil</button>
      {isAdmin && <button>Admin Ayarları</button>}
      {canManage && <button>Yönetim</button>}
    </div>
  );
}
```

#### usePermission - Permission Kontrolü

```tsx
import { usePermission } from '@/features/auth';

function CariListActions({ cariId }: { cariId: number }) {
  const canEdit = usePermission('cari', 'write');
  const canDelete = usePermission('cari', 'delete');

  const handleDelete = () => {
    if (!canDelete) {
      toast.error('Silme yetkiniz yok');
      return;
    }
    // Delete logic
  };

  return (
    <div>
      {canEdit && <button onClick={() => navigate(`/cari/edit/${cariId}`)}>Düzenle</button>}
      {canDelete && <button onClick={handleDelete}>Sil</button>}
    </div>
  );
}
```

#### usePermissions - Çoklu Permission Kontrolü

```tsx
import { usePermissions } from '@/features/auth';

function DataExportButton() {
  const canExport = usePermissions([
    { resource: 'reports', action: 'read' },
    { resource: 'reports', action: 'export' },
  ], 'all'); // Tüm izinler gerekli

  if (!canExport) return null;

  return <button>Rapor İndir</button>;
}

function DashboardWidgets() {
  const hasAnyAccess = usePermissions([
    { resource: 'cari', action: 'read' },
    { resource: 'workorder', action: 'read' },
    { resource: 'sefer', action: 'read' },
  ], 'any'); // En az biri yeterli

  if (!hasAnyAccess) {
    return <div>Gösterilecek veri yok</div>;
  }

  return <DashboardContent />;
}
```

#### useUserPermissions - Tüm İzinleri Görme

```tsx
import { useUserPermissions } from '@/features/auth';

function DebugPermissions() {
  const permissions = useUserPermissions();

  return (
    <details>
      <summary>Kullanıcı İzinleri ({permissions.length})</summary>
      <ul>
        {permissions.map(p => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </details>
  );
}
```

### 3. useAuth Hook - Tam Kontrol

```tsx
import { useAuth } from '@/features/auth';

function UserProfile() {
  const {
    user,
    isAuthenticated,
    isLoading,
    hasRole,
    hasPermission,
    logout,
  } = useAuth();

  if (isLoading) return <div>Yükleniyor...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  const isAdmin = user?.is_superuser || hasRole(['SISTEM_YONETICISI']);
  const canManageCari = hasPermission('cari', 'write');

  return (
    <div>
      <h1>Hoş geldin, {user?.full_name || user?.email}</h1>
      <p>Roller: {user?.roles.map(r => r.name).join(', ')}</p>
      {isAdmin && <AdminBadge />}
      {canManageCari && <CariManagementLink />}
      <button onClick={logout}>Çıkış</button>
    </div>
  );
}
```

## Backend Senkronizasyonu

Frontend permission kontrolü, backend'den gelen gerçek permission listesiyle çalışır:

```
1. User login → GET /auth/me/permissions
2. Response: { permissions: ["cari:read", "cari:write", ...] }
3. AuthContext user.permissions field'ına kaydeder
4. hasPermission() bu listeyi kontrol eder
```

### Wildcard Desteği

Backend'de `admin:*` gibi wildcard permissions varsa, frontend otomatik eşleşir:

```tsx
// Backend: user'ın admin:* izni var
const canRead = hasPermission('admin', 'read'); // ✓ true
const canWrite = hasPermission('admin', 'write'); // ✓ true
const canDelete = hasPermission('admin', 'delete'); // ✓ true
```

## Superuser Bypass

`is_superuser=true` kullanıcılar tüm kontrolleri atlar:

```tsx
const { user, hasPermission } = useAuth();

// Superuser her zaman true döner
if (user?.is_superuser) {
  hasPermission('any', 'action'); // ✓ true
}
```

## Örnek Senaryolar

### Senaryo 1: Cari Modülü

```tsx
import { PermissionBoundary, usePermission } from '@/features/auth';

function CariListPage() {
  const canCreate = usePermission('cari', 'write');

  return (
    <div>
      <h1>Cari Listesi</h1>
      
      {/* Create button sadece write iznine sahiplere */}
      {canCreate && (
        <button onClick={() => navigate('/cari/new')}>
          Yeni Cari Ekle
        </button>
      )}

      <CariTable />
    </div>
  );
}

function CariTableRow({ cari }) {
  return (
    <tr>
      <td>{cari.code}</td>
      <td>{cari.name}</td>
      <td>
        {/* Edit button - cari:write */}
        <PermissionBoundary resource="cari" action="write">
          <button>Düzenle</button>
        </PermissionBoundary>

        {/* Delete button - cari:delete */}
        <PermissionBoundary resource="cari" action="delete">
          <button className="danger">Sil</button>
        </PermissionBoundary>
      </td>
    </tr>
  );
}
```

### Senaryo 2: İş Emri Onay Akışı

```tsx
import { PermissionBoundary, useAuth } from '@/features/auth';

function WorkOrderDetail({ workOrder }) {
  const { user } = useAuth();

  return (
    <div>
      <h2>İş Emri #{workOrder.wo_number}</h2>
      <p>Durum: {workOrder.status}</p>

      {/* Sadece OPERASYON veya admin onaylayabilir */}
      {workOrder.status === 'DRAFT' && (
        <PermissionBoundary
          resource="workorder"
          action="approve"
          fallback={
            <p className="text-gray-500">
              Onaylama yetkisi sadece Operasyon departmanında
            </p>
          }
        >
          <button onClick={handleApprove}>Onayla</button>
        </PermissionBoundary>
      )}

      {/* Tamamlanan işlerde faturalama - FINANS yetkisi */}
      {workOrder.status === 'TAMAMLANDI' && (
        <PermissionBoundary resource="workorder" action="invoice">
          <button onClick={handleInvoice}>Faturala</button>
        </PermissionBoundary>
      )}
    </div>
  );
}
```

### Senaryo 3: Admin Panel

```tsx
import { RoleBoundary } from '@/features/auth';

function AdminLayout() {
  return (
    <RoleBoundary roles={["SISTEM_YONETICISI"]}>
      <div className="admin-layout">
        <Sidebar>
          <NavLink to="/admin/users">Kullanıcılar</NavLink>
          <NavLink to="/admin/roles">Roller</NavLink>
          <NavLink to="/admin/permissions">İzinler</NavLink>
          <NavLink to="/admin/settings">Ayarlar</NavLink>
        </Sidebar>

        <MainContent>
          <Outlet />
        </MainContent>
      </div>
    </RoleBoundary>
  );
}
```

## Best Practices

1. **Component Boundary Tercih Edin**: UI elementleri için `<PermissionBoundary>` kullanın
2. **Hook Logic İçin**: Karmaşık logic için `usePermission()` tercih edin
3. **Fallback Kullanın**: Kullanıcıya neden erişemediğini gösterin
4. **Superuser Kontrolü**: Kritik işlemlerde `is_superuser` ek kontrol edin
5. **Backend Validation**: Frontend kontrolü UX içindir, backend her zaman validate eder

## Hata Yönetimi

```tsx
import { useAuth } from '@/features/auth';

function ProtectedAction() {
  const { hasPermission } = useAuth();

  const handleAction = async () => {
    // Frontend check
    if (!hasPermission('cari', 'delete')) {
      toast.error('Bu işlem için yetkiniz yok');
      return;
    }

    try {
      await deleteCari(id);
      toast.success('Cari silindi');
    } catch (error: any) {
      // Backend 403 - permission denied
      if (error.code === 'AUTH_INSUFFICIENT_PERMISSIONS') {
        toast.error('İzin hatası: ' + error.message);
      }
    }
  };

  return <button onClick={handleAction}>Sil</button>;
}
```

---

**Hazırlayan**: Aliaport Dev Team  
**Tarih**: 2025-01-20  
**Versiyon**: 1.0.0
