// TARİFE API - Tarife modülü için API endpoints
// GET, POST, PUT, DELETE işlemleri
// price_list + price_list_item (master-detail)

import { api } from './client';
import type { 
  PriceList, 
  PriceListItem,
  PriceListWithItems,
  PaginatedResponse 
} from '../types/database';

// ============================================
// PRICE LIST ENDPOINTS (Ana Tarife)
// ============================================

export const tarifeApi = {
  // Tüm tarifeleri getir
  getAll: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    currency?: string;
  }) => 
    api.get<PaginatedResponse<PriceList>>('/price-list', { params }),

  // Tek tarife detayı
  getById: (id: number) => 
    api.get<PriceList>(`/price-list/${id}`),

  // Tarife kodu ile getir
  getByCode: (code: string) => 
    api.get<PriceList>(`/price-list/code/${code}`),

  // Tarife + Items birlikte
  getWithItems: (id: number) => 
    api.get<PriceListWithItems>(`/price-list/${id}/with-items`),

  // Aktif tarifeleri getir
  getActive: () => 
    api.get<PriceList[]>('/price-list/active'),

  // Yeni tarife oluştur
  create: (data: Omit<PriceList, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<PriceList>('/price-list', data),

  // Tarife güncelle
  update: (id: number, data: Partial<PriceList>) => 
    api.put<PriceList>(`/price-list/${id}`, data),

  // Tarife sil
  delete: (id: number) => 
    api.delete<void>(`/price-list/${id}`),

  // Tarife durumunu değiştir
  updateStatus: (id: number, status: string) => 
    api.patch<PriceList>(`/price-list/${id}/status`, { status }),

  // ============================================
  // PRICE LIST ITEM ENDPOINTS (Tarife Kalemleri)
  // ============================================

  // Tarifeye ait tüm kalemleri getir
  getItems: (priceListId: number) => 
    api.get<PriceListItem[]>(`/price-list/${priceListId}/items`),

  // Tek kalem detayı
  getItemById: (itemId: number) => 
    api.get<PriceListItem>(`/price-list-item/${itemId}`),

  // Yeni kalem ekle
  createItem: (data: Omit<PriceListItem, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<PriceListItem>('/price-list-item', data),

  // Kalem güncelle
  updateItem: (itemId: number, data: Partial<PriceListItem>) => 
    api.put<PriceListItem>(`/price-list-item/${itemId}`, data),

  // Kalem sil
  deleteItem: (itemId: number) => 
    api.delete<void>(`/price-list-item/${itemId}`),

  // Toplu kalem ekleme
  createBulkItems: (priceListId: number, items: Omit<PriceListItem, 'id' | 'created_at' | 'updated_at'>[]) => 
    api.post<PriceListItem[]>(`/price-list/${priceListId}/items/bulk`, { items }),
};

// ============================================
// MOCK DATA (Backend hazır değilse)
// ============================================

const MOCK_PRICE_LIST: PriceList[] = [
  {
    id: 1,
    code: 'TARIFE-2024-STANDART',
    name: '2024 Standart Tarife',
    description: 'Genel hizmetler için standart fiyat listesi',
    currency: 'TRY',
    version: 1,
    status: 'AKTIF',
    valid_from: '2024-01-01',
    valid_to: '2024-12-31',
    is_active: true,
    created_at: new Date('2024-01-01').toISOString(),
  },
  {
    id: 2,
    code: 'TARIFE-2024-VIP',
    name: '2024 VIP Tarife',
    description: 'Premium müşteriler için özel fiyat listesi',
    currency: 'TRY',
    version: 1,
    status: 'AKTIF',
    valid_from: '2024-01-01',
    valid_to: '2024-12-31',
    is_active: true,
    created_at: new Date('2024-01-01').toISOString(),
  },
  {
    id: 3,
    code: 'TARIFE-2024-SEZONLUK',
    name: '2024 Sezonluk Tarife',
    description: 'Yaz sezonu için özel tarife',
    currency: 'TRY',
    version: 1,
    status: 'AKTIF',
    valid_from: '2024-05-01',
    valid_to: '2024-09-30',
    is_active: true,
    created_at: new Date('2024-05-01').toISOString(),
  },
  {
    id: 4,
    code: 'TARIFE-2023-STANDART',
    name: '2023 Standart Tarife',
    description: 'Geçmiş dönem tarife (ARŞİV)',
    currency: 'TRY',
    version: 1,
    status: 'ARŞİV',
    valid_from: '2023-01-01',
    valid_to: '2023-12-31',
    is_active: false,
    created_at: new Date('2023-01-01').toISOString(),
  },
];

const MOCK_PRICE_LIST_ITEMS: PriceListItem[] = [
  // Tarife 1 - Standart
  {
    id: 1,
    price_list_id: 1,
    service_card_id: 1,
    service_code: 'MB-SEFER-001',
    service_name: 'Motorbot Sefer Hizmeti',
    unit_price: 500.00,
    currency: 'TRY',
    vat_rate: 20,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    price_list_id: 1,
    service_card_id: 2,
    service_code: 'BARINMA-001',
    service_name: 'Aylık Barınma Hizmeti',
    unit_price: 15000.00,
    currency: 'TRY',
    vat_rate: 20,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    price_list_id: 1,
    service_card_id: 3,
    service_code: 'ELEKTRIK-001',
    service_name: 'Elektrik Tüketimi',
    unit_price: 8.50,
    currency: 'TRY',
    vat_rate: 20,
    created_at: new Date().toISOString(),
  },
  // Tarife 2 - VIP (daha yüksek fiyatlar)
  {
    id: 11,
    price_list_id: 2,
    service_card_id: 1,
    service_code: 'MB-SEFER-001',
    service_name: 'Motorbot Sefer Hizmeti',
    unit_price: 400.00,
    currency: 'TRY',
    vat_rate: 20,
    notes: 'VIP indirimli fiyat',
    created_at: new Date().toISOString(),
  },
  {
    id: 12,
    price_list_id: 2,
    service_card_id: 2,
    service_code: 'BARINMA-001',
    service_name: 'Aylık Barınma Hizmeti',
    unit_price: 12000.00,
    currency: 'TRY',
    vat_rate: 20,
    notes: 'VIP indirimli fiyat',
    created_at: new Date().toISOString(),
  },
];

// Mock mode için fallback
export const tarifeApiMock = {
  getAll: async () => ({
    items: MOCK_PRICE_LIST,
    total: MOCK_PRICE_LIST.length,
    page: 1,
    page_size: 20,
    total_pages: 1,
  }),

  getById: async (id: number) => 
    MOCK_PRICE_LIST.find(t => t.id === id) || MOCK_PRICE_LIST[0],

  getActive: async () => 
    MOCK_PRICE_LIST.filter(t => t.status === 'AKTIF'),

  getWithItems: async (id: number) => {
    const priceList = MOCK_PRICE_LIST.find(t => t.id === id) || MOCK_PRICE_LIST[0];
    const items = MOCK_PRICE_LIST_ITEMS.filter(i => i.price_list_id === id);
    return {
      ...priceList,
      items,
      item_count: items.length,
      total_value: items.reduce((sum, item) => sum + item.unit_price, 0),
    };
  },

  getItems: async (priceListId: number) => 
    MOCK_PRICE_LIST_ITEMS.filter(i => i.price_list_id === priceListId),
};
