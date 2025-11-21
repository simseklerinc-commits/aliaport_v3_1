// DÖVİZ KURLARI API - exchange_rate tablosu için API endpoints
// Döviz kuru yönetimi ve güncel kurlar - GERÇEK BACKEND ENTEGRASYONU

import { apiClient } from './client';
import type { 
  ExchangeRate,
  PaginatedResponse 
} from '../types/database';

// ============================================
// BACKEND RESPONSE TYPE (PascalCase)
// ============================================

interface ExchangeRateBackend {
  Id: number;
  CurrencyFrom: string;
  CurrencyTo: string;
  Rate: number;
  RateDate: string;
  Source?: string;
  CreatedAt: string;
}

interface PaginatedBackendResponse {
  items: ExchangeRateBackend[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================
// TRANSFORMER: Backend → Frontend
// ============================================

function transformExchangeRate(backend: ExchangeRateBackend): ExchangeRate {
  return {
    id: backend.Id,
    currency_from: backend.CurrencyFrom,
    currency_to: backend.CurrencyTo,
    rate: backend.Rate,
    rate_date: backend.RateDate,
    source: backend.Source,
    created_at: backend.CreatedAt,
  };
}

function transformPaginatedResponse(
  backend: PaginatedBackendResponse
): PaginatedResponse<ExchangeRate> {
  return {
    items: backend.items.map(transformExchangeRate),
    total: backend.total,
    page: backend.page,
    page_size: backend.page_size,
    total_pages: backend.total_pages,
  };
}

// ============================================
// REVERSE TRANSFORMER: Frontend → Backend
// ============================================

function toBackendFormat(data: Partial<ExchangeRate>) {
  const backend: any = {};
  
  if (data.currency_from !== undefined) backend.CurrencyFrom = data.currency_from;
  if (data.currency_to !== undefined) backend.CurrencyTo = data.currency_to;
  if (data.rate !== undefined) backend.Rate = data.rate;
  if (data.rate_date !== undefined) backend.RateDate = data.rate_date;
  if (data.source !== undefined) backend.Source = data.source;
  
  return backend;
}

// ============================================
// EXCHANGE RATE API
// ============================================

export const kurlarApi = {
  // Tüm kurları getir (Paginated)
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    currency_from?: string;
    currency_to?: string;
    rate_date?: string;
  }): Promise<PaginatedResponse<ExchangeRate>> => {
    const queryParams: Record<string, string | number | boolean> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.page_size) queryParams.page_size = params.page_size;
    if (params?.currency_from) queryParams.currency_from = params.currency_from;
    if (params?.currency_to) queryParams.currency_to = params.currency_to;
    if (params?.rate_date) queryParams.rate_date = params.rate_date;

    const response = await apiClient.get<PaginatedBackendResponse>('/exchange-rate/', { 
      params: queryParams
    });
    return transformPaginatedResponse(response);
  },

  // Tek kur detayı
  getById: async (id: number): Promise<ExchangeRate> => {
    const response = await apiClient.get<ExchangeRateBackend>(`/exchange-rate/${id}`);
    return transformExchangeRate(response);
  },

  // Belirli tarih için kur
  getByDate: async (
    currencyFrom: string, 
    currencyTo: string, 
    rateDate: string
  ): Promise<ExchangeRate> => {
    const response = await apiClient.get<ExchangeRateBackend>(
      `/exchange-rate/${currencyFrom}/${currencyTo}/${rateDate}`
    );
    return transformExchangeRate(response);
  },

  // En güncel kur
  getLatest: async (
    currencyFrom: string, 
    currencyTo: string
  ): Promise<ExchangeRate> => {
    const response = await apiClient.get<ExchangeRateBackend>(
      `/exchange-rate/latest/${currencyFrom}/${currencyTo}`
    );
    return transformExchangeRate(response);
  },

  // Bugünkü tüm kurlar
  getToday: async (): Promise<ExchangeRate[]> => {
    const response = await apiClient.get<ExchangeRateBackend[]>('/exchange-rate/today');
    return response.map(transformExchangeRate);
  },

  // Tarihe göre tüm kurlar
  getByDateAll: async (rateDate: string): Promise<ExchangeRate[]> => {
    const response = await apiClient.get<ExchangeRateBackend[]>(
      `/exchange-rate/date/${rateDate}`
    );
    return response.map(transformExchangeRate);
  },

  // Yeni kur ekle
  create: async (data: Omit<ExchangeRate, 'id' | 'created_at'>): Promise<ExchangeRate> => {
    const backendData = toBackendFormat(data);
    const response = await apiClient.post<ExchangeRateBackend>('/exchange-rate/', backendData);
    return transformExchangeRate(response);
  },

  // Toplu kur ekleme (günlük kur güncelleme için)
  createBulk: async (
    rates: Omit<ExchangeRate, 'id' | 'created_at'>[]
  ): Promise<ExchangeRate[]> => {
    const backendRates = rates.map(toBackendFormat);
    const response = await apiClient.post<ExchangeRateBackend[]>(
      '/exchange-rate/bulk', 
      { rates: backendRates }
    );
    return response.map(transformExchangeRate);
  },

  // Kur güncelle
  update: async (id: number, data: Partial<ExchangeRate>): Promise<ExchangeRate> => {
    const backendData = toBackendFormat(data);
    const response = await apiClient.put<ExchangeRateBackend>(
      `/exchange-rate/${id}`, 
      backendData
    );
    return transformExchangeRate(response);
  },

  // Kur sil
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/exchange-rate/${id}`);
  },

  // TCMB'den güncel kurları çek (XML API - sadece son birkaç gün)
  fetchFromTCMB: async (date?: string): Promise<ExchangeRate[]> => {
    const response = await apiClient.post<ExchangeRateBackend[]>(
      '/exchange-rate/fetch-tcmb', 
      { date }
    );
    return response.map(transformExchangeRate);
  },

  // EVDS'den güncel kurları çek (Resmi API - geçmiş tarihler dahil)
  fetchFromEVDS: async (date?: string): Promise<ExchangeRate[]> => {
    const response = await apiClient.post<ExchangeRateBackend[]>(
      '/exchange-rate/fetch-evds', 
      { date }
    );
    return response.map(transformExchangeRate);
  },

  // Kur dönüşümü yap
  convert: async (
    amount: number, 
    from: string, 
    to: string, 
    date?: string
  ): Promise<{
    amount: number;
    from: string;
    to: string;
    rate: number;
    converted_amount: number;
    rate_date: string;
  }> => {
    const queryParams: Record<string, string | number | boolean> = {
      amount,
      from,
      to
    };
    if (date) queryParams.date = date;

    const response = await apiClient.get<{
      amount: number;
      from: string;
      to: string;
      rate: number;
      converted_amount: number;
      rate_date: string;
    }>('/exchange-rate/convert', {
      params: queryParams
    });
    return response;
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Kur dönüşümü hesapla
 */
export function calculateConversion(
  amount: number,
  rate: number
): number {
  return parseFloat((amount * rate).toFixed(2));
}

/**
 * Çapraz kur hesapla (örn: EUR/USD)
 */
export function calculateCrossRate(
  baseToTRY: number, // EUR/TRY
  targetToTRY: number // USD/TRY
): number {
  return parseFloat((baseToTRY / targetToTRY).toFixed(6));
}

// ============================================
// PARA BİRİMLERİ REFERANSI
// ============================================

export const CURRENCIES = {
  TRY: { code: 'TRY', name: 'Türk Lirası', symbol: '₺' },
  USD: { code: 'USD', name: 'Amerikan Doları', symbol: '$' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€' },
  GBP: { code: 'GBP', name: 'İngiliz Sterlini', symbol: '£' },
  CHF: { code: 'CHF', name: 'İsviçre Frangı', symbol: 'CHF' },
  JPY: { code: 'JPY', name: 'Japon Yeni', symbol: '¥' },
  CAD: { code: 'CAD', name: 'Kanada Doları', symbol: 'C$' },
  AUD: { code: 'AUD', name: 'Avustralya Doları', symbol: 'A$' },
  SAR: { code: 'SAR', name: 'Suudi Arabistan Riyali', symbol: '﷼' },
  SEK: { code: 'SEK', name: 'İsveç Kronu', symbol: 'kr' },
  NOK: { code: 'NOK', name: 'Norveç Kronu', symbol: 'kr' },
  DKK: { code: 'DKK', name: 'Danimarka Kronu', symbol: 'kr' },
  KWD: { code: 'KWD', name: 'Kuveyt Diniarı', symbol: 'د.ك' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
