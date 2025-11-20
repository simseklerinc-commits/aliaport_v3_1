// HİZMET API - Hizmet Kartı modülü için API endpoints
// GET, POST, PUT, DELETE işlemleri

import { api } from './client';
import type { 
  ServiceCard, 
  ServiceCardWithPrice,
  PaginatedResponse 
} from '../types/database';

// ============================================
// HİZMET CARD ENDPOINTS
// ============================================

export const hizmetApi = {
  // Tüm hizmet kartlarını getir (pagination + filter)
  getAll: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
    is_active?: boolean;
  }) => 
    api.get<PaginatedResponse<ServiceCard>>('/hizmet', { params }),

  // Tek hizmet detayı
  getById: (id: number) => 
    api.get<ServiceCard>(`/hizmet/${id}`),

  // Hizmet kodu ile getir
  getByCode: (code: string) => 
    api.get<ServiceCard>(`/hizmet/code/${code}`),

  // Fiyatlarla birlikte hizmet
  getWithPrice: (id: number) => 
    api.get<ServiceCardWithPrice>(`/hizmet/${id}/with-price`),

  // Kategoriye göre hizmetler
  getByCategory: (category: string) => 
    api.get<ServiceCard[]>(`/hizmet/category/${category}`),

  // Yeni hizmet kartı oluştur
  create: (data: Omit<ServiceCard, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<ServiceCard>('/hizmet', data),

  // Hizmet kartı güncelle
  update: (id: number, data: Partial<ServiceCard>) => 
    api.put<ServiceCard>(`/hizmet/${id}`, data),

  // Hizmet kartı sil
  delete: (id: number) => 
    api.delete<void>(`/hizmet/${id}`),

  // Hizmet aktif/pasif yap
  toggleActive: (id: number) => 
    api.patch<ServiceCard>(`/hizmet/${id}/toggle-active`, {}),

  // Tüm kategorileri getir
  getCategories: () => 
    api.get<string[]>('/hizmet/categories'),
};

// ============================================
// MOCK DATA (Backend hazır değilse)
// ============================================

const MOCK_HIZMET_DATA: ServiceCard[] = [
  {
    id: 1,
    code: 'MB-SEFER-001',
    name: 'Motorbot Sefer Hizmeti',
    description: 'Motorbot transfer ve sefer hizmetleri',
    category: 'MOTORBOT',
    unit: 'SEFER',
    is_active: true,
    notes: 'Standart motorbot sefer hizmeti - KDV %20',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    code: 'BARINMA-001',
    name: 'Aylık Barınma Hizmeti',
    description: 'Marina barınma hizmeti - aylık',
    category: 'BARINMA',
    unit: 'AY',
    is_active: true,
    notes: 'Standart aylık barınma ücreti',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    code: 'ELEKTRIK-001',
    name: 'Elektrik Tüketimi',
    description: 'Marina elektrik tüketimi',
    category: 'ELEKTRIK',
    unit: 'KWH',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    code: 'SU-001',
    name: 'Su Tüketimi',
    description: 'Marina su tüketimi',
    category: 'SU',
    unit: 'M3',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    code: 'FUEL-001',
    name: 'Akaryakıt Satışı',
    description: 'Motorin/Benzin satışı',
    category: 'FUEL',
    unit: 'LITRE',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 6,
    code: 'BAKIM-001',
    name: 'Genel Bakım Hizmeti',
    description: 'Tekne bakım ve onarım hizmetleri',
    category: 'BAKIM',
    unit: 'SAAT',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// Mock mode için fallback
export const hizmetApiMock = {
  getAll: async () => ({
    items: MOCK_HIZMET_DATA,
    total: MOCK_HIZMET_DATA.length,
    page: 1,
    page_size: 20,
    total_pages: 1,
  }),

  getById: async (id: number) => 
    MOCK_HIZMET_DATA.find(h => h.id === id) || MOCK_HIZMET_DATA[0],

  getByCode: async (code: string) => 
    MOCK_HIZMET_DATA.find(h => h.code === code) || MOCK_HIZMET_DATA[0],

  getCategories: async () => [
    'MOTORBOT',
    'BARINMA',
    'ELEKTRIK',
    'SU',
    'FUEL',
    'BAKIM',
    'TEKNIK',
    'SAHA',
  ],
};
