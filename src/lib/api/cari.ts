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

// ============================================
// MOCK DATA (Backend hazır değilse)
// ============================================

const MOCK_CARI_DATA: Cari[] = [
  {
    id: 1,
    code: 'MUS-001',
    title: 'Deniz Yatçılık A.Ş.',
    type: 'CUSTOMER',
    tax_office: 'Çeşme',
    tax_number: '1234567890',
    address: 'Marina Blv. No:45',
    city: 'İzmir',
    country: 'Türkiye',
    phone: '+90 232 123 4567',
    email: 'info@denizyatcilik.com',
    contact_person: 'Ahmet Yılmaz',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    code: 'MUS-002',
    title: 'Ege Marine Ltd.',
    type: 'CUSTOMER',
    tax_office: 'Bodrum',
    tax_number: '0987654321',
    address: 'Sahil Cad. No:12',
    city: 'Muğla',
    country: 'Türkiye',
    phone: '+90 252 987 6543',
    email: 'contact@egemarine.com',
    contact_person: 'Mehmet Kaya',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// Mock mode için fallback
export const cariApiMock = {
  getAll: async () => ({
    items: MOCK_CARI_DATA,
    total: MOCK_CARI_DATA.length,
    page: 1,
    page_size: 20,
    total_pages: 1,
  }),

  getById: async (id: number) => 
    MOCK_CARI_DATA.find(c => c.id === id) || MOCK_CARI_DATA[0],

  getByCode: async (code: string) => 
    MOCK_CARI_DATA.find(c => c.code === code) || MOCK_CARI_DATA[0],
};
