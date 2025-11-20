// KULLANICI VE ROL MASTER DATA
// Kullanıcı yönetimi ve yetkilendirme

export interface Role {
  id: number;
  code: string;
  name: string;
  description?: string;
  permissions: string[]; // Permission codes
  is_active: boolean;
  is_system: boolean; // Sistem rolü (silinemeyen)
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role_id: number;
  role_code: string;
  role_name: string;
  is_active: boolean;
  is_admin: boolean; // Admin kullanıcı
  phone?: string;
  department?: string;
  last_login?: string;
  password_changed_at?: string;
  created_at: string;
  created_by?: number;
  updated_at?: string;
  updated_by?: number;
}

export interface Permission {
  code: string;
  name: string;
  description: string;
  module: string;
  category: 'READ' | 'WRITE' | 'DELETE' | 'ADMIN';
}

// ===== PERMISSION DEFINITIONS =====
export const permissionsData: Permission[] = [
  // CARİ
  { code: 'CARI_READ', name: 'Cari Görüntüleme', description: 'Cari kartlarını görüntüleme', module: 'CARİ', category: 'READ' },
  { code: 'CARI_WRITE', name: 'Cari Düzenleme', description: 'Cari kartları ekleme/düzenleme', module: 'CARİ', category: 'WRITE' },
  { code: 'CARI_DELETE', name: 'Cari Silme', description: 'Cari kartlarını silme', module: 'CARİ', category: 'DELETE' },

  // HİZMET
  { code: 'HIZMET_READ', name: 'Hizmet Görüntüleme', description: 'Hizmet kartlarını görüntüleme', module: 'HİZMET', category: 'READ' },
  { code: 'HIZMET_WRITE', name: 'Hizmet Düzenleme', description: 'Hizmet kartları ekleme/düzenleme', module: 'HİZMET', category: 'WRITE' },
  { code: 'HIZMET_DELETE', name: 'Hizmet Silme', description: 'Hizmet kartlarını silme', module: 'HİZMET', category: 'DELETE' },

  // TARİFE
  { code: 'TARIFE_READ', name: 'Tarife Görüntüleme', description: 'Fiyat listelerini görüntüleme', module: 'TARİFE', category: 'READ' },
  { code: 'TARIFE_WRITE', name: 'Tarife Düzenleme', description: 'Fiyat listeleri ekleme/düzenleme', module: 'TARİFE', category: 'WRITE' },
  { code: 'TARIFE_DELETE', name: 'Tarife Silme', description: 'Fiyat listelerini silme', module: 'TARİFE', category: 'DELETE' },

  // MOTORBOT
  { code: 'MOTORBOT_READ', name: 'Motorbot Görüntüleme', description: 'Motorbot kartlarını görüntüleme', module: 'MOTORBOT', category: 'READ' },
  { code: 'MOTORBOT_WRITE', name: 'Motorbot Düzenleme', description: 'Motorbot kartları ekleme/düzenleme', module: 'MOTORBOT', category: 'WRITE' },
  { code: 'MOTORBOT_DELETE', name: 'Motorbot Silme', description: 'Motorbot kartlarını silme', module: 'MOTORBOT', category: 'DELETE' },

  // BARINMA
  { code: 'BARINMA_READ', name: 'Barınma Görüntüleme', description: 'Barınma sözleşmelerini görüntüleme', module: 'BARINMA', category: 'READ' },
  { code: 'BARINMA_WRITE', name: 'Barınma Düzenleme', description: 'Barınma sözleşmeleri ekleme/düzenleme', module: 'BARINMA', category: 'WRITE' },
  { code: 'BARINMA_DELETE', name: 'Barınma Silme', description: 'Barınma sözleşmelerini silme', module: 'BARINMA', category: 'DELETE' },

  // SEFER
  { code: 'SEFER_READ', name: 'Sefer Görüntüleme', description: 'Sefer kayıtlarını görüntüleme', module: 'SEFER', category: 'READ' },
  { code: 'SEFER_WRITE', name: 'Sefer Kayıt', description: 'Sefer çıkış/dönüş kaydı yapma', module: 'SEFER', category: 'WRITE' },
  { code: 'SEFER_DELETE', name: 'Sefer Silme', description: 'Sefer kayıtlarını silme', module: 'SEFER', category: 'DELETE' },

  // FATURA
  { code: 'FATURA_READ', name: 'Fatura Görüntüleme', description: 'Faturaları görüntüleme', module: 'FATURA', category: 'READ' },
  { code: 'FATURA_WRITE', name: 'Fatura Düzenleme', description: 'Fatura oluşturma/düzenleme', module: 'FATURA', category: 'WRITE' },
  { code: 'FATURA_DELETE', name: 'Fatura Silme', description: 'Faturaları silme', module: 'FATURA', category: 'DELETE' },
  { code: 'FATURA_APPROVE', name: 'Fatura Onaylama', description: 'Faturaları onaylama', module: 'FATURA', category: 'ADMIN' },

  // RAPORLAR
  { code: 'RAPOR_READ', name: 'Rapor Görüntüleme', description: 'Raporları görüntüleme', module: 'RAPOR', category: 'READ' },
  { code: 'RAPOR_EXPORT', name: 'Rapor Export', description: 'Raporları Excel\'e aktarma', module: 'RAPOR', category: 'WRITE' },

  // PARAMETRE
  { code: 'PARAMETRE_READ', name: 'Parametre Görüntüleme', description: 'Parametreleri görüntüleme', module: 'PARAMETRE', category: 'READ' },
  { code: 'PARAMETRE_WRITE', name: 'Parametre Düzenleme', description: 'Parametreleri düzenleme', module: 'PARAMETRE', category: 'ADMIN' },

  // KULLANICI YÖNETİMİ
  { code: 'USER_READ', name: 'Kullanıcı Görüntüleme', description: 'Kullanıcıları görüntüleme', module: 'KULLANICI', category: 'READ' },
  { code: 'USER_WRITE', name: 'Kullanıcı Düzenleme', description: 'Kullanıcı ekleme/düzenleme', module: 'KULLANICI', category: 'ADMIN' },
  { code: 'USER_DELETE', name: 'Kullanıcı Silme', description: 'Kullanıcıları silme', module: 'KULLANICI', category: 'ADMIN' },

  // ROL YÖNETİMİ
  { code: 'ROLE_READ', name: 'Rol Görüntüleme', description: 'Rolleri görüntüleme', module: 'ROL', category: 'READ' },
  { code: 'ROLE_WRITE', name: 'Rol Düzenleme', description: 'Rol ekleme/düzenleme', module: 'ROL', category: 'ADMIN' },
  { code: 'ROLE_DELETE', name: 'Rol Silme', description: 'Rolleri silme', module: 'ROL', category: 'ADMIN' },
];

// ===== ROLE DEFINITIONS =====
export const rolesData: Role[] = [
  {
    id: 1,
    code: 'ADMIN',
    name: 'Sistem Yöneticisi',
    description: 'Tüm yetkilere sahip sistem yöneticisi',
    permissions: permissionsData.map(p => p.code), // TÜM YETKİLER
    is_active: true,
    is_system: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    code: 'MANAGER',
    name: 'Liman Müdürü',
    description: 'İşletme müdürü - onaylama yetkisi',
    permissions: [
      'CARI_READ', 'CARI_WRITE',
      'HIZMET_READ', 'HIZMET_WRITE',
      'TARIFE_READ', 'TARIFE_WRITE',
      'MOTORBOT_READ', 'MOTORBOT_WRITE',
      'BARINMA_READ', 'BARINMA_WRITE',
      'SEFER_READ', 'SEFER_WRITE',
      'FATURA_READ', 'FATURA_WRITE', 'FATURA_APPROVE',
      'RAPOR_READ', 'RAPOR_EXPORT',
      'PARAMETRE_READ',
      'USER_READ',
      'ROLE_READ',
    ],
    is_active: true,
    is_system: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 3,
    code: 'ACCOUNTING',
    name: 'Muhasebe',
    description: 'Muhasebe personeli - fatura ve raporlama',
    permissions: [
      'CARI_READ',
      'HIZMET_READ',
      'TARIFE_READ',
      'MOTORBOT_READ',
      'BARINMA_READ',
      'SEFER_READ',
      'FATURA_READ', 'FATURA_WRITE', 'FATURA_APPROVE',
      'RAPOR_READ', 'RAPOR_EXPORT',
    ],
    is_active: true,
    is_system: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 4,
    code: 'OFFICER',
    name: 'Ofis Personeli',
    description: 'Ofis personeli - günlük işlemler',
    permissions: [
      'CARI_READ', 'CARI_WRITE',
      'HIZMET_READ',
      'TARIFE_READ',
      'MOTORBOT_READ', 'MOTORBOT_WRITE',
      'BARINMA_READ', 'BARINMA_WRITE',
      'SEFER_READ', 'SEFER_WRITE',
      'FATURA_READ',
      'RAPOR_READ',
    ],
    is_active: true,
    is_system: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 5,
    code: 'FIELD',
    name: 'Saha Personeli',
    description: 'Saha personeli - sadece sefer kayıt',
    permissions: [
      'MOTORBOT_READ',
      'SEFER_READ', 'SEFER_WRITE',
    ],
    is_active: true,
    is_system: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 6,
    code: 'VIEWER',
    name: 'Görüntüleyici',
    description: 'Sadece görüntüleme yetkisi',
    permissions: [
      'CARI_READ',
      'HIZMET_READ',
      'TARIFE_READ',
      'MOTORBOT_READ',
      'BARINMA_READ',
      'SEFER_READ',
      'FATURA_READ',
      'RAPOR_READ',
    ],
    is_active: true,
    is_system: false,
    created_at: '2025-01-01T00:00:00Z',
  },
];

// ===== USER DEFINITIONS =====
export const usersData: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@aliaport.com',
    full_name: 'Sistem Yöneticisi',
    role_id: 1,
    role_code: 'ADMIN',
    role_name: 'Sistem Yöneticisi',
    is_active: true,
    is_admin: true,
    department: 'BİLGİ İŞLEM',
    last_login: '2025-11-19T10:30:00Z',
    password_changed_at: '2025-11-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    username: 'ahmet.yilmaz',
    email: 'ahmet.yilmaz@aliaport.com',
    full_name: 'Ahmet Yılmaz',
    role_id: 2,
    role_code: 'MANAGER',
    role_name: 'Liman Müdürü',
    is_active: true,
    is_admin: false,
    phone: '+90 232 123 4501',
    department: 'YÖNETİM',
    last_login: '2025-11-19T09:15:00Z',
    password_changed_at: '2025-10-15T00:00:00Z',
    created_at: '2025-01-15T00:00:00Z',
    created_by: 1,
  },
  {
    id: 3,
    username: 'mehmet.kaya',
    email: 'mehmet.kaya@aliaport.com',
    full_name: 'Mehmet Kaya',
    role_id: 3,
    role_code: 'ACCOUNTING',
    role_name: 'Muhasebe',
    is_active: true,
    is_admin: false,
    phone: '+90 232 123 4502',
    department: 'MUHASEBE',
    last_login: '2025-11-19T08:45:00Z',
    password_changed_at: '2025-09-20T00:00:00Z',
    created_at: '2025-01-20T00:00:00Z',
    created_by: 1,
  },
  {
    id: 4,
    username: 'ayse.demir',
    email: 'ayse.demir@aliaport.com',
    full_name: 'Ayşe Demir',
    role_id: 4,
    role_code: 'OFFICER',
    role_name: 'Ofis Personeli',
    is_active: true,
    is_admin: false,
    phone: '+90 232 123 4503',
    department: 'İŞLETME',
    last_login: '2025-11-19T08:30:00Z',
    password_changed_at: '2025-08-10T00:00:00Z',
    created_at: '2025-02-01T00:00:00Z',
    created_by: 1,
  },
  {
    id: 5,
    username: 'can.ozturk',
    email: 'can.ozturk@aliaport.com',
    full_name: 'Can Öztürk',
    role_id: 5,
    role_code: 'FIELD',
    role_name: 'Saha Personeli',
    is_active: true,
    is_admin: false,
    phone: '+90 232 123 4504',
    department: 'SAHA',
    last_login: '2025-11-19T07:00:00Z',
    password_changed_at: '2025-07-05T00:00:00Z',
    created_at: '2025-02-10T00:00:00Z',
    created_by: 1,
  },
  {
    id: 6,
    username: 'fatma.arslan',
    email: 'fatma.arslan@aliaport.com',
    full_name: 'Fatma Arslan',
    role_id: 4,
    role_code: 'OFFICER',
    role_name: 'Ofis Personeli',
    is_active: true,
    is_admin: false,
    phone: '+90 232 123 4505',
    department: 'İŞLETME',
    last_login: '2025-11-18T17:30:00Z',
    password_changed_at: '2025-06-15T00:00:00Z',
    created_at: '2025-03-01T00:00:00Z',
    created_by: 1,
  },
  {
    id: 7,
    username: 'ali.celik',
    email: 'ali.celik@aliaport.com',
    full_name: 'Ali Çelik',
    role_id: 5,
    role_code: 'FIELD',
    role_name: 'Saha Personeli',
    is_active: true,
    is_admin: false,
    phone: '+90 232 123 4506',
    department: 'SAHA',
    last_login: '2025-11-19T06:45:00Z',
    password_changed_at: '2025-05-20T00:00:00Z',
    created_at: '2025-03-15T00:00:00Z',
    created_by: 1,
  },
  {
    id: 8,
    username: 'zeynep.kara',
    email: 'zeynep.kara@aliaport.com',
    full_name: 'Zeynep Kara',
    role_id: 6,
    role_code: 'VIEWER',
    role_name: 'Görüntüleyici',
    is_active: false,
    is_admin: false,
    phone: '+90 232 123 4507',
    department: 'MUHASEBE',
    last_login: '2025-10-15T14:20:00Z',
    password_changed_at: '2025-04-10T00:00:00Z',
    created_at: '2025-04-01T00:00:00Z',
    created_by: 1,
    updated_at: '2025-10-30T00:00:00Z',
    updated_by: 1,
  },
];

// ===== HELPER FUNCTIONS =====

/**
 * Kullanıcının yetkisini kontrol et
 */
export function hasPermission(user: User, permissionCode: string): boolean {
  const role = rolesData.find(r => r.id === user.role_id);
  return role ? role.permissions.includes(permissionCode) : false;
}

/**
 * Kullanıcının admin olup olmadığını kontrol et
 */
export function isAdmin(user: User): boolean {
  return user.is_admin || user.role_code === 'ADMIN';
}

/**
 * Aktif kullanıcıları getir
 */
export function getActiveUsers(): User[] {
  return usersData.filter(u => u.is_active);
}

/**
 * Aktif rolleri getir
 */
export function getActiveRoles(): Role[] {
  return rolesData.filter(r => r.is_active);
}

/**
 * Modüle göre yetkileri grupla
 */
export function groupPermissionsByModule(): { [module: string]: Permission[] } {
  return permissionsData.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as { [module: string]: Permission[] });
}

/**
 * Rol istatistikleri
 */
export function getRoleStats() {
  return rolesData.map(role => ({
    ...role,
    user_count: usersData.filter(u => u.role_id === role.id).length,
    active_user_count: usersData.filter(u => u.role_id === role.id && u.is_active).length,
  }));
}
