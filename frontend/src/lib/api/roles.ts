// ROLES API - Rol yönetimi için API endpoints
// Sadece ADMIN yetkisinde erişilebilir
// GET, POST, PUT, DELETE işlemleri

import { api } from './client';
import type { PaginatedResponse } from '../types/database';

// ============================================
// TYPES
// ============================================

export interface Role {
  id: number;
  code: string;
  name: string;
  description?: string;
  permissions: string[];
  is_active: boolean;
  is_system: boolean; // Sistem rolü (silinemeyen)
  created_at: string;
  updated_at?: string;
}

export interface Permission {
  code: string;
  name: string;
  description: string;
  module: string;
  category: 'READ' | 'WRITE' | 'DELETE' | 'ADMIN';
}

export interface RoleCreateInput {
  code: string;
  name: string;
  description?: string;
  permissions: string[];
  is_active?: boolean;
}

export interface RoleUpdateInput {
  name?: string;
  description?: string;
  permissions?: string[];
  is_active?: boolean;
}

// ============================================
// ROLE ENDPOINTS (ADMIN ONLY)
// ============================================

export const rolesApi = {
  // Tüm rolleri getir
  getAll: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    is_active?: boolean;
  }) => 
    api.get<PaginatedResponse<Role>>('/roles', { params }),

  // Tek rol detayı
  getById: (id: number) => 
    api.get<Role>(`/roles/${id}`),

  // Rol kodu ile getir
  getByCode: (code: string) => 
    api.get<Role>(`/roles/code/${code}`),

  // Yeni rol oluştur
  create: (data: RoleCreateInput) => 
    api.post<Role>('/roles', data),

  // Rol güncelle
  update: (id: number, data: RoleUpdateInput) => 
    api.put<Role>(`/roles/${id}`, data),

  // Rol sil
  delete: (id: number) => 
    api.delete<void>(`/roles/${id}`),

  // Rol aktif/pasif yap
  toggleActive: (id: number) => 
    api.patch<Role>(`/roles/${id}/toggle-active`, {}),

  // Rol istatistikleri
  getStats: () => 
    api.get<{
      role_id: number;
      role_code: string;
      role_name: string;
      user_count: number;
      active_user_count: number;
      permission_count: number;
    }[]>('/roles/stats'),
};

// ============================================
// PERMISSION ENDPOINTS
// ============================================

export const permissionsApi = {
  // Tüm yetkileri getir
  getAll: () => 
    api.get<Permission[]>('/permissions'),

  // Modüle göre yetkileri getir
  getByModule: (module: string) => 
    api.get<Permission[]>(`/permissions/module/${module}`),

  // Kategori bazında yetkileri grupla
  getGroupedByModule: () => 
    api.get<{ [module: string]: Permission[] }>('/permissions/grouped'),
};

// ============================================
// MOCK DATA (Backend hazır değilse)
// ============================================

import { rolesData, permissionsData, usersData, getRoleStats } from '../../data/usersData';

export const rolesApiMock = {
  getAll: async (params?: any) => {
    let filtered = [...rolesData];
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.code.toLowerCase().includes(search) ||
        r.name.toLowerCase().includes(search) ||
        (r.description && r.description.toLowerCase().includes(search))
      );
    }
    
    if (params?.is_active !== undefined) {
      filtered = filtered.filter(r => r.is_active === params.is_active);
    }
    
    return {
      items: filtered,
      total: filtered.length,
      page: params?.page || 1,
      page_size: params?.page_size || 50,
      total_pages: 1,
    };
  },

  getById: async (id: number) => 
    rolesData.find(r => r.id === id) || rolesData[0],

  getByCode: async (code: string) => 
    rolesData.find(r => r.code === code),

  create: async (data: RoleCreateInput) => {
    const newRole: Role = {
      id: Math.max(...rolesData.map(r => r.id), 0) + 1,
      ...data,
      is_active: data.is_active ?? true,
      is_system: false, // Kullanıcı tarafından oluşturulan roller sistem rolü değildir
      created_at: new Date().toISOString(),
    };
    rolesData.push(newRole);
    return newRole;
  },

  update: async (id: number, data: RoleUpdateInput) => {
    const index = rolesData.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Rol bulunamadı');
    
    const role = rolesData[index];
    if (role.is_system) {
      // Sistem rolleri için sadece belirli alanlar güncellenebilir
      rolesData[index] = {
        ...role,
        description: data.description ?? role.description,
        updated_at: new Date().toISOString(),
      };
    } else {
      rolesData[index] = {
        ...role,
        ...data,
        updated_at: new Date().toISOString(),
      };
    }
    
    return rolesData[index];
  },

  delete: async (id: number) => {
    const index = rolesData.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Rol bulunamadı');
    
    const role = rolesData[index];
    if (role.is_system) {
      throw new Error('Sistem rolleri silinemez');
    }
    
    // Kullanıcı kontrolü
    const usersWithRole = usersData.filter(u => u.role_id === id);
    if (usersWithRole.length > 0) {
      throw new Error(`Bu rol ${usersWithRole.length} kullanıcıda kullanılıyor, silinemez`);
    }
    
    rolesData.splice(index, 1);
  },

  toggleActive: async (id: number) => {
    const index = rolesData.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Rol bulunamadı');
    
    const role = rolesData[index];
    if (role.is_system && role.code === 'ADMIN') {
      throw new Error('Admin rolü pasif yapılamaz');
    }
    
    rolesData[index].is_active = !rolesData[index].is_active;
    rolesData[index].updated_at = new Date().toISOString();
    
    return rolesData[index];
  },

  getStats: async () => {
    return getRoleStats();
  },
};

export const permissionsApiMock = {
  getAll: async () => permissionsData,

  getByModule: async (module: string) => 
    permissionsData.filter(p => p.module === module),

  getGroupedByModule: async () => {
    const grouped: { [module: string]: Permission[] } = {};
    permissionsData.forEach(perm => {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    });
    return grouped;
  },
};
