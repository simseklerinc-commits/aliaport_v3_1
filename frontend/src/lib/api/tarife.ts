import { apiClient } from './client';

// ============================================
// TYPES (PascalCase → snake_case mapping)
// ============================================

export interface PriceList {
  id?: number;
  code: string;
  name: string;
  description?: string;
  currency: string;
  version: number;
  status: string;
  valid_from?: string;
  valid_to?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PriceListItem {
  id?: number;
  price_list_id: number;
  service_code: string;
  service_name: string;
  unit?: string;
  unit_price: number;
  vat_rate?: number;
  description?: string;
  order_no?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PriceListWithItems extends PriceList {
  items: PriceListItem[];
}

export interface PaginatedPriceListResponse {
  items: PriceList[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================
// TRANSFORMERS (Frontend ↔ Backend)
// ============================================

// Frontend → Backend (snake_case → PascalCase)
export const toBackend = {
  priceList: (data: Partial<PriceList>) => ({
    Kod: data.code,
    Ad: data.name,
    Aciklama: data.description,
    ParaBirimi: data.currency,
    Versiyon: data.version,
    Durum: data.status,
    GecerlilikBaslangic: data.valid_from,
    GecerlilikBitis: data.valid_to,
    AktifMi: data.is_active,
  }),
  
  priceListItem: (data: Partial<PriceListItem>) => ({
    PriceListId: data.price_list_id,
    HizmetKodu: data.service_code,
    HizmetAdi: data.service_name,
    Birim: data.unit,
    BirimFiyat: data.unit_price,
    KdvOrani: data.vat_rate,
    Aciklama: data.description,
    SiraNo: data.order_no,
    AktifMi: data.is_active,
  }),
};

// Backend → Frontend (PascalCase → snake_case)
export const fromBackend = {
  priceList: (data: any): PriceList => ({
    id: data.Id,
    code: data.Kod,
    name: data.Ad,
    description: data.Aciklama,
    currency: data.ParaBirimi,
    version: data.Versiyon,
    status: data.Durum,
    valid_from: data.GecerlilikBaslangic,
    valid_to: data.GecerlilikBitis,
    is_active: data.AktifMi,
    created_at: data.CreatedAt,
    updated_at: data.UpdatedAt,
  }),
  
  priceListItem: (data: any): PriceListItem => ({
    id: data.Id,
    price_list_id: data.PriceListId,
    service_code: data.HizmetKodu,
    service_name: data.HizmetAdi,
    unit: data.Birim,
    unit_price: data.BirimFiyat,
    vat_rate: data.KdvOrani,
    description: data.Aciklama,
    order_no: data.SiraNo,
    is_active: data.AktifMi,
    created_at: data.CreatedAt,
    updated_at: data.UpdatedAt,
  }),
};

// ============================================
// API CLIENT
// ============================================

export const tarifeApi = {
  // Tüm tarifeleri getir (paginated)
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    currency?: string;
  }): Promise<PaginatedPriceListResponse> => {
    const response = await apiClient.get<any>('/price-list/', { params });
    return {
      ...response,
      items: response.items.map(fromBackend.priceList),
    };
  },

  // Tek tarife detayı
  getById: async (id: number): Promise<PriceList> => {
    const response = await apiClient.get<any>(`/price-list/${id}`);
    return fromBackend.priceList(response);
  },

  // Tarife kodu ile getir
  getByCode: async (code: string): Promise<PriceList> => {
    const response = await apiClient.get<any>(`/price-list/code/${code}`);
    return fromBackend.priceList(response);
  },

  // Tarife + Items birlikte
  getWithItems: async (id: number): Promise<PriceListWithItems> => {
    const response = await apiClient.get<any>(`/price-list/${id}/with-items`);
    const priceList = fromBackend.priceList(response);
    const items = response.items?.map(fromBackend.priceListItem) || [];
    return { ...priceList, items };
  },

  // Aktif tarifeleri getir
  getActive: async (): Promise<PriceList[]> => {
    const response = await apiClient.get<any[]>('/price-list/active');
    return response.map(fromBackend.priceList);
  },

  // Yeni tarife oluştur
  create: async (data: Omit<PriceList, 'id' | 'created_at' | 'updated_at'>): Promise<PriceList> => {
    const backendData = toBackend.priceList(data);
    const response = await apiClient.post<any>('/price-list/', backendData);
    return fromBackend.priceList(response);
  },

  // Tarife güncelle
  update: async (id: number, data: Partial<PriceList>): Promise<PriceList> => {
    const backendData = toBackend.priceList(data);
    const response = await apiClient.put<any>(`/price-list/${id}`, backendData);
    return fromBackend.priceList(response);
  },

  // Tarife sil
  delete: async (id: number): Promise<void> => {
    await apiClient.delete<void>(`/price-list/${id}`);
  },

  // Tarife durumunu değiştir
  updateStatus: async (id: number, status: string): Promise<PriceList> => {
    const response = await apiClient.patch<any>(`/price-list/${id}/status`, { status });
    return fromBackend.priceList(response);
  },

  // ============================================
  // PRICE LIST ITEM ENDPOINTS
  // ============================================

  // Tarifeye ait tüm kalemleri getir
  getItems: async (priceListId: number): Promise<PriceListItem[]> => {
    const response = await apiClient.get<any[]>(`/price-list/${priceListId}/items`);
    return response.map(fromBackend.priceListItem);
  },

  // Tek kalem detayı
  getItemById: async (itemId: number): Promise<PriceListItem> => {
    const response = await apiClient.get<any>(`/price-list/item/${itemId}`);
    return fromBackend.priceListItem(response);
  },

  // Yeni kalem ekle
  createItem: async (
    data: Omit<PriceListItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<PriceListItem> => {
    const backendData = toBackend.priceListItem(data);
    const response = await apiClient.post<any>('/price-list/item', backendData);
    return fromBackend.priceListItem(response);
  },

  // Kalem güncelle
  updateItem: async (itemId: number, data: Partial<PriceListItem>): Promise<PriceListItem> => {
    const backendData = toBackend.priceListItem(data);
    const response = await apiClient.put<any>(`/price-list/item/${itemId}`, backendData);
    return fromBackend.priceListItem(response);
  },

  // Kalem sil
  deleteItem: async (itemId: number): Promise<void> => {
    await apiClient.delete<void>(`/price-list/item/${itemId}`);
  },

  // Toplu kalem ekleme
  createBulkItems: async (
    priceListId: number,
    items: Omit<PriceListItem, 'id' | 'created_at' | 'updated_at'>[]
  ): Promise<PriceListItem[]> => {
    const backendItems = items.map(toBackend.priceListItem);
    const response = await apiClient.post<any[]>(`/price-list/${priceListId}/items/bulk`, backendItems);
    return response.map(fromBackend.priceListItem);
  },
};
