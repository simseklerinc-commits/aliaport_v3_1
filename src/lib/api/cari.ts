// CARİ API - Cari modülü için API endpoints
// GET, POST, PUT, DELETE işlemleri

import { api } from './client';
import type { 
  Cari, 
  CariWithStats, 
  CariHesapHareket, 
  PaginatedResponse 
} from '../types/database';

// ============================================
// CARİ ENDPOINTS
// ============================================

export const cariApi = {
  // Tüm carileri getir (pagination + filter)
  getAll: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    type?: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
    is_active?: boolean;
  }) => 
    api.get<PaginatedResponse<Cari>>('/cari', { params }),

  // Tek cari detayı
  getById: (id: number) => 
    api.get<Cari>(`/cari/${id}`),

  // Cari kodu ile getir
  getByCode: (code: string) => 
    api.get<Cari>(`/cari/code/${code}`),

  // İstatistiklerle birlikte cari
  getWithStats: (id: number) => 
    api.get<CariWithStats>(`/cari/${id}/stats`),

  // Yeni cari oluştur
  create: (data: Omit<Cari, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<Cari>('/cari', data),

  // Cari güncelle
  update: (id: number, data: Partial<Cari>) => 
    api.put<Cari>(`/cari/${id}`, data),

  // Cari sil
  delete: (id: number) => 
    api.delete<void>(`/cari/${id}`),

  // Cari aktif/pasif yap
  toggleActive: (id: number) => 
    api.patch<Cari>(`/cari/${id}/toggle-active`, {}),
};

// ============================================
// CARİ HESAP HAREKETLERİ
// ============================================

export const cariHareketApi = {
  // Carinin tüm hareketleri
  getByCariId: (cariId: number, params?: {
    start_date?: string;
    end_date?: string;
    transaction_type?: 'DEBIT' | 'CREDIT';
  }) => 
    api.get<CariHesapHareket[]>(`/cari/${cariId}/hareketler`, { params }),

  // Cari bakiyesi
  getBalance: (cariId: number) => 
    api.get<{ balance: number; currency: string }>(`/cari/${cariId}/balance`),

  // Cari ekstresi
  getEkstre: (cariId: number, params?: {
    start_date?: string;
    end_date?: string;
  }) => 
    api.get<{
      cari: Cari;
      hareketler: CariHesapHareket[];
      opening_balance: number;
      closing_balance: number;
    }>(`/cari/${cariId}/ekstre`, { params }),
};
