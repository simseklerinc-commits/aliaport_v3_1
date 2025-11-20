// SİSTEM PARAMETRELERİ API - system_parameter tablosu için API endpoints
// Sistem konfigürasyonu ve ayarları
// GET, POST, PUT, DELETE işlemleri

import { api } from './client';
import type { 
  SystemParameter,
  PaginatedResponse 
} from '../types/database';

// ============================================
// SYSTEM PARAMETER ENDPOINTS
// ============================================

export const parametreApi = {
  // Tüm parametreleri getir
  getAll: (params?: {
    page?: number;
    page_size?: number;
    category?: string;
    is_active?: boolean;
  }) => 
    api.get<PaginatedResponse<SystemParameter>>('/system-parameter', { params }),

  // Tek parametre detayı
  getById: (id: number) => 
    api.get<SystemParameter>(`/system-parameter/${id}`),

  // Kategori ve key ile getir
  getByKey: (category: string, key: string) => 
    api.get<SystemParameter>(`/system-parameter/${category}/${key}`),

  // Kategoriye göre parametreler
  getByCategory: (category: string) => 
    api.get<SystemParameter[]>(`/system-parameter/category/${category}`),

  // Yeni parametre oluştur
  create: (data: Omit<SystemParameter, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<SystemParameter>('/system-parameter', data),

  // Parametre güncelle
  update: (id: number, data: Partial<SystemParameter>) => 
    api.put<SystemParameter>(`/system-parameter/${id}`, data),

  // Parametre değerini güncelle (sadece value)
  updateValue: (category: string, key: string, value: string) => 
    api.patch<SystemParameter>(`/system-parameter/${category}/${key}/value`, { value }),

  // Parametre sil
  delete: (id: number) => 
    api.delete<void>(`/system-parameter/${id}`),

  // Parametre aktif/pasif yap
  toggleActive: (id: number) => 
    api.patch<SystemParameter>(`/system-parameter/${id}/toggle-active`, {}),
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parametre değerini parse et (data_type'a göre)
 */
export function parseParameterValue(param: SystemParameter): string | number | boolean | object {
  switch (param.data_type) {
    case 'NUMBER':
      return parseFloat(param.value);
    case 'BOOLEAN':
      return param.value.toLowerCase() === 'true';
    case 'JSON':
      try {
        return JSON.parse(param.value);
      } catch {
        return param.value;
      }
    case 'STRING':
    default:
      return param.value;
  }
}

/**
 * Parametre değerini string'e çevir
 */
export function stringifyParameterValue(value: any): string {
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

// ============================================
// MOCK DATA (Backend hazır değilse)
// ============================================

const MOCK_PARAMETERS: SystemParameter[] = [
  // SYSTEM
  {
    id: 1,
    category: 'SYSTEM',
    key: 'COMPANY_NAME',
    value: 'Aliaport Liman İşletmeleri A.Ş.',
    data_type: 'STRING',
    description: 'Şirket adı',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    category: 'SYSTEM',
    key: 'TAX_NUMBER',
    value: '1234567890',
    data_type: 'STRING',
    description: 'Vergi numarası',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 3,
    category: 'SYSTEM',
    key: 'ADDRESS',
    value: 'Marina Blv. No:1, 35940 Çeşme/İzmir',
    data_type: 'STRING',
    description: 'Şirket adresi',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 4,
    category: 'SYSTEM',
    key: 'PHONE',
    value: '+90 232 123 4567',
    data_type: 'STRING',
    description: 'Şirket telefonu',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 5,
    category: 'SYSTEM',
    key: 'EMAIL',
    value: 'info@aliaport.com',
    data_type: 'STRING',
    description: 'Şirket e-posta',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },

  // INVOICE
  {
    id: 10,
    category: 'INVOICE',
    key: 'DEFAULT_VAT_RATE',
    value: '20',
    data_type: 'NUMBER',
    description: 'Varsayılan KDV oranı (%)',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 11,
    category: 'INVOICE',
    key: 'DEFAULT_CURRENCY',
    value: 'TRY',
    data_type: 'STRING',
    description: 'Varsayılan para birimi',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 12,
    category: 'INVOICE',
    key: 'INVOICE_PREFIX',
    value: 'FAT',
    data_type: 'STRING',
    description: 'Fatura no öneki',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 13,
    category: 'INVOICE',
    key: 'AUTO_APPROVE',
    value: 'false',
    data_type: 'BOOLEAN',
    description: 'Fatura otomatik onay',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },

  // TRIP
  {
    id: 20,
    category: 'TRIP',
    key: 'DEFAULT_UNIT_PRICE',
    value: '10',
    data_type: 'NUMBER',
    description: 'Sefer varsayılan birim fiyat (USD)',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 21,
    category: 'TRIP',
    key: 'DEFAULT_VAT_RATE',
    value: '18',
    data_type: 'NUMBER',
    description: 'Sefer varsayılan KDV oranı (%)',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 22,
    category: 'TRIP',
    key: 'BILLING_DAYS',
    value: '7,14,21,28,30',
    data_type: 'STRING',
    description: 'Faturalama günleri (virgülle ayrılmış)',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 23,
    category: 'TRIP',
    key: 'AUTO_INVOICE',
    value: 'false',
    data_type: 'BOOLEAN',
    description: 'Otomatik faturalandırma',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },

  // CONTRACT
  {
    id: 30,
    category: 'CONTRACT',
    key: 'AUTO_RENEW',
    value: 'true',
    data_type: 'BOOLEAN',
    description: 'Sözleşme otomatik yenileme',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 31,
    category: 'CONTRACT',
    key: 'DEFAULT_BILLING_PERIOD',
    value: 'MONTHLY',
    data_type: 'STRING',
    description: 'Varsayılan faturalama periyodu',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 32,
    category: 'CONTRACT',
    key: 'EXPIRY_WARNING_DAYS',
    value: '30',
    data_type: 'NUMBER',
    description: 'Sözleşme bitiş uyarı süresi (gün)',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },

  // E-INVOICE
  {
    id: 40,
    category: 'E_INVOICE',
    key: 'ENABLED',
    value: 'true',
    data_type: 'BOOLEAN',
    description: 'E-Fatura aktif mi?',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 41,
    category: 'E_INVOICE',
    key: 'TEST_MODE',
    value: 'true',
    data_type: 'BOOLEAN',
    description: 'Test modu',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 42,
    category: 'E_INVOICE',
    key: 'PROVIDER',
    value: 'LOGO',
    data_type: 'STRING',
    description: 'E-Fatura sağlayıcı',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
];

// Mock mode için fallback
export const parametreApiMock = {
  getAll: async (params?: any) => {
    let filtered = [...MOCK_PARAMETERS];
    
    if (params?.category) {
      filtered = filtered.filter(p => p.category === params.category);
    }
    
    if (params?.is_active !== undefined) {
      filtered = filtered.filter(p => p.is_active === params.is_active);
    }
    
    return {
      items: filtered,
      total: filtered.length,
      page: params?.page || 1,
      page_size: params?.page_size || 100,
      total_pages: 1,
    };
  },

  getById: async (id: number) => 
    MOCK_PARAMETERS.find(p => p.id === id) || MOCK_PARAMETERS[0],

  getByKey: async (category: string, key: string) => 
    MOCK_PARAMETERS.find(p => p.category === category && p.key === key),

  getByCategory: async (category: string) => 
    MOCK_PARAMETERS.filter(p => p.category === category),

  updateValue: async (category: string, key: string, value: string) => {
    const param = MOCK_PARAMETERS.find(p => p.category === category && p.key === key);
    if (param) {
      param.value = value;
      param.updated_at = new Date().toISOString();
      return param;
    }
    throw new Error('Parametre bulunamadı');
  },
};
