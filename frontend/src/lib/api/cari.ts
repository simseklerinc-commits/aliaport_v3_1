// CARİ API - Cari modülü için API endpoints
// GET, POST, PUT, DELETE işlemleri

import { api } from './client';
import type { RequestInit } from 'node-fetch';
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
  }, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.get<PaginatedResponse<Cari>>('/cari/', { params, ...reqOptions }),

  // Tek cari detayı
  getById: (id: number, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.get<Cari>(`/cari/${id}`, reqOptions),

  // Cari kodu ile getir
  getByCode: (code: string, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.get<Cari>(`/cari/code/${code}`, reqOptions),

  // İstatistiklerle birlikte cari
  getWithStats: (id: number, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.get<CariWithStats>(`/cari/${id}/stats`, reqOptions),

  // Yeni cari oluştur
  create: (data: Omit<Cari, 'id' | 'created_at' | 'updated_at'>, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.post<Cari>('/cari/', data, reqOptions),

  // Cari güncelle
  update: (id: number, data: Partial<Cari>, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.put<Cari>(`/cari/${id}`, data, reqOptions),

  // Cari sil
  delete: (id: number, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.delete<void>(`/cari/${id}`, reqOptions),

  // Cari aktif/pasif yap
  toggleActive: (id: number, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.patch<Cari>(`/cari/${id}/toggle-active`, {}, reqOptions),
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
  }, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.get<CariHesapHareket[]>(`/cari/${cariId}/hareketler`, { params, ...reqOptions }),

  // Cari bakiyesi
  getBalance: (cariId: number, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.get<{ balance: number; currency: string }>(`/cari/${cariId}/balance`, reqOptions),

  // Cari ekstresi
  getEkstre: (cariId: number, params?: {
    start_date?: string;
    end_date?: string;
  }, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.get<{
      cari: Cari;
      hareketler: CariHesapHareket[];
      opening_balance: number;
      closing_balance: number;
    }>(`/cari/${cariId}/ekstre`, { params, ...reqOptions }),
};
