// USERS API - Kullanıcı yönetimi için API endpoints
// Sadece ADMIN yetkisinde erişilebilir
// GET, POST, PUT, DELETE işlemleri

import { api } from './client';
import type { PaginatedResponse } from '../types/database';

// ============================================
// TYPES
// ============================================

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role_id: number;
  role_code: string;
  role_name: string;
  is_active: boolean;
  is_admin: boolean;
  phone?: string;
  department?: string;
  last_login?: string;
  password_changed_at?: string;
  created_at: string;
  created_by?: number;
  updated_at?: string;
  updated_by?: number;
}

export interface UserCreateInput {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role_id: number;
  phone?: string;
  department?: string;
  is_active?: boolean;
}

export interface UserUpdateInput {
  email?: string;
  full_name?: string;
  role_id?: number;
  phone?: string;
  department?: string;
  is_active?: boolean;
}

export interface PasswordChangeInput {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// ============================================
// USER ENDPOINTS (ADMIN ONLY)
// ============================================

export const usersApi = {
  // Tüm kullanıcıları getir
  getAll: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    role_id?: number;
    is_active?: boolean;
    department?: string;
  }) => 
    api.get<PaginatedResponse<User>>('/users', { params }),

  // Tek kullanıcı detayı
  getById: (id: number) => 
    api.get<User>(`/users/${id}`),

  // Kullanıcı adına göre getir
  getByUsername: (username: string) => 
    api.get<User>(`/users/username/${username}`),

  // Yeni kullanıcı oluştur
  create: (data: UserCreateInput) => 
    api.post<User>('/users', data),

  // Kullanıcı güncelle
  update: (id: number, data: UserUpdateInput) => 
    api.put<User>(`/users/${id}`, data),

  // Kullanıcı sil
  delete: (id: number) => 
    api.delete<void>(`/users/${id}`),

  // Kullanıcı aktif/pasif yap
  toggleActive: (id: number) => 
    api.patch<User>(`/users/${id}/toggle-active`, {}),

  // Şifre sıfırlama (admin tarafından)
  resetPassword: (id: number, newPassword: string) => 
    api.post<void>(`/users/${id}/reset-password`, { new_password: newPassword }),

  // Kullanıcı şifre değiştirme (kendi şifresi)
  changePassword: (data: PasswordChangeInput) => 
    api.post<void>('/users/change-password', data),

  // Kullanıcı istatistikleri
  getStats: () => 
    api.get<{
      total_users: number;
      active_users: number;
      inactive_users: number;
      admin_users: number;
      by_role: { role_name: string; count: number }[];
      by_department: { department: string; count: number }[];
      recent_logins: User[];
    }>('/users/stats'),

  // Kullanıcı giriş geçmişi
  getLoginHistory: (userId: number, params?: {
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) => 
    api.get<{
      user_id: number;
      login_time: string;
      ip_address: string;
      user_agent: string;
      success: boolean;
    }[]>(`/users/${userId}/login-history`, { params }),
};

// ============================================
// MOCK DATA (Backend hazır değilse)
// ============================================

import { usersData } from '../../data/usersData';

export const usersApiMock = {
  getAll: async (params?: any) => {
    let filtered = [...usersData];
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(u => 
        u.username.toLowerCase().includes(search) ||
        u.full_name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      );
    }
    
    if (params?.role_id) {
      filtered = filtered.filter(u => u.role_id === params.role_id);
    }
    
    if (params?.is_active !== undefined) {
      filtered = filtered.filter(u => u.is_active === params.is_active);
    }
    
    if (params?.department) {
      filtered = filtered.filter(u => u.department === params.department);
    }
    
    return {
      items: filtered,
      total: filtered.length,
      page: params?.page || 1,
      page_size: params?.page_size || 50,
      total_pages: Math.ceil(filtered.length / (params?.page_size || 50)),
    };
  },

  getById: async (id: number) => 
    usersData.find(u => u.id === id) || usersData[0],

  getByUsername: async (username: string) => 
    usersData.find(u => u.username === username),

  create: async (data: UserCreateInput) => {
    const newUser: User = {
      id: Math.max(...usersData.map(u => u.id), 0) + 1,
      ...data,
      role_code: 'OFFICER', // Default
      role_name: 'Ofis Personeli',
      is_admin: false,
      is_active: data.is_active ?? true,
      created_at: new Date().toISOString(),
    };
    usersData.push(newUser);
    return newUser;
  },

  update: async (id: number, data: UserUpdateInput) => {
    const index = usersData.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Kullanıcı bulunamadı');
    
    usersData[index] = {
      ...usersData[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    
    return usersData[index];
  },

  delete: async (id: number) => {
    const index = usersData.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Kullanıcı bulunamadı');
    
    const user = usersData[index];
    if (user.is_admin) {
      throw new Error('Admin kullanıcı silinemez');
    }
    
    usersData.splice(index, 1);
  },

  toggleActive: async (id: number) => {
    const index = usersData.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Kullanıcı bulunamadı');
    
    usersData[index].is_active = !usersData[index].is_active;
    usersData[index].updated_at = new Date().toISOString();
    
    return usersData[index];
  },

  getStats: async () => {
    const activeUsers = usersData.filter(u => u.is_active);
    const inactiveUsers = usersData.filter(u => !u.is_active);
    const adminUsers = usersData.filter(u => u.is_admin);
    
    // Role grupları
    const byRole: { [key: string]: number } = {};
    usersData.forEach(u => {
      byRole[u.role_name] = (byRole[u.role_name] || 0) + 1;
    });
    
    // Departman grupları
    const byDepartment: { [key: string]: number } = {};
    usersData.forEach(u => {
      if (u.department) {
        byDepartment[u.department] = (byDepartment[u.department] || 0) + 1;
      }
    });
    
    // Son giriş yapanlar
    const recentLogins = [...usersData]
      .filter(u => u.last_login)
      .sort((a, b) => (b.last_login || '').localeCompare(a.last_login || ''))
      .slice(0, 10);
    
    return {
      total_users: usersData.length,
      active_users: activeUsers.length,
      inactive_users: inactiveUsers.length,
      admin_users: adminUsers.length,
      by_role: Object.entries(byRole).map(([role_name, count]) => ({ role_name, count })),
      by_department: Object.entries(byDepartment).map(([department, count]) => ({ department, count })),
      recent_logins: recentLogins,
    };
  },

  resetPassword: async (id: number, newPassword: string) => {
    const user = usersData.find(u => u.id === id);
    if (!user) throw new Error('Kullanıcı bulunamadı');
    
    // Mock: Password hash işlemi yapılacak
    console.log(`Şifre sıfırlandı: ${user.username}`);
  },

  changePassword: async (data: PasswordChangeInput) => {
    if (data.new_password !== data.confirm_password) {
      throw new Error('Yeni şifreler eşleşmiyor');
    }
    
    // Mock: Password kontrolü ve hash işlemi yapılacak
    console.log('Şifre değiştirildi');
  },
};
