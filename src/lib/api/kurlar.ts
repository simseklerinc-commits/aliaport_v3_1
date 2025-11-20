// DÖVİZ KURLARI API - exchange_rate tablosu için API endpoints
// Döviz kuru yönetimi ve güncel kurlar
// GET, POST, PUT, DELETE işlemleri

import { api } from './client';
import type { 
  ExchangeRate,
  PaginatedResponse 
} from '../types/database';

// ============================================
// EXCHANGE RATE ENDPOINTS
// ============================================

export const kurlarApi = {
  // Tüm kurları getir
  getAll: (params?: {
    page?: number;
    page_size?: number;
    currency_from?: string;
    currency_to?: string;
    rate_date?: string;
  }) => 
    api.get<PaginatedResponse<ExchangeRate>>('/exchange-rate', { params }),

  // Tek kur detayı
  getById: (id: number) => 
    api.get<ExchangeRate>(`/exchange-rate/${id}`),

  // Belirli tarih için kur
  getByDate: (currencyFrom: string, currencyTo: string, rateDate: string) => 
    api.get<ExchangeRate>(
      `/exchange-rate/${currencyFrom}/${currencyTo}/${rateDate}`
    ),

  // En güncel kur
  getLatest: (currencyFrom: string, currencyTo: string) => 
    api.get<ExchangeRate>(
      `/exchange-rate/latest/${currencyFrom}/${currencyTo}`
    ),

  // Bugünkü tüm kurlar
  getToday: () => 
    api.get<ExchangeRate[]>('/exchange-rate/today'),

  // Tarihe göre tüm kurlar
  getByDateAll: (rateDate: string) => 
    api.get<ExchangeRate[]>(`/exchange-rate/date/${rateDate}`),

  // Yeni kur ekle
  create: (data: Omit<ExchangeRate, 'id' | 'created_at'>) => 
    api.post<ExchangeRate>('/exchange-rate', data),

  // Toplu kur ekleme (günlük kur güncelleme için)
  createBulk: (rates: Omit<ExchangeRate, 'id' | 'created_at'>[]) => 
    api.post<ExchangeRate[]>('/exchange-rate/bulk', { rates }),

  // Kur güncelle
  update: (id: number, data: Partial<ExchangeRate>) => 
    api.put<ExchangeRate>(`/exchange-rate/${id}`, data),

  // Kur sil
  delete: (id: number) => 
    api.delete<void>(`/exchange-rate/${id}`),

  // TCMB'den güncel kurları çek
  fetchFromTCMB: (date?: string) => 
    api.post<ExchangeRate[]>('/exchange-rate/fetch-tcmb', { date }),

  // Kur dönüşümü yap
  convert: (amount: number, from: string, to: string, date?: string) => 
    api.get<{ 
      amount: number; 
      from: string; 
      to: string; 
      rate: number; 
      converted_amount: number;
      rate_date: string;
    }>('/exchange-rate/convert', { 
      params: { amount, from, to, date } 
    }),
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
// MOCK DATA (Backend hazır değilse)
// ============================================

const MOCK_EXCHANGE_RATES: ExchangeRate[] = [
  // 2025-11-19 Kurları
  {
    id: 1,
    currency_from: 'USD',
    currency_to: 'TRY',
    rate: 34.50,
    rate_date: '2025-11-19',
    source: 'TCMB',
    created_at: '2025-11-19T10:00:00Z',
  },
  {
    id: 2,
    currency_from: 'EUR',
    currency_to: 'TRY',
    rate: 37.80,
    rate_date: '2025-11-19',
    source: 'TCMB',
    created_at: '2025-11-19T10:00:00Z',
  },
  {
    id: 3,
    currency_from: 'GBP',
    currency_to: 'TRY',
    rate: 43.20,
    rate_date: '2025-11-19',
    source: 'TCMB',
    created_at: '2025-11-19T10:00:00Z',
  },
  {
    id: 4,
    currency_from: 'CHF',
    currency_to: 'TRY',
    rate: 39.15,
    rate_date: '2025-11-19',
    source: 'TCMB',
    created_at: '2025-11-19T10:00:00Z',
  },
  {
    id: 5,
    currency_from: 'JPY',
    currency_to: 'TRY',
    rate: 0.2245,
    rate_date: '2025-11-19',
    source: 'TCMB',
    created_at: '2025-11-19T10:00:00Z',
  },
  {
    id: 6,
    currency_from: 'CAD',
    currency_to: 'TRY',
    rate: 24.65,
    rate_date: '2025-11-19',
    source: 'TCMB',
    created_at: '2025-11-19T10:00:00Z',
  },
  {
    id: 7,
    currency_from: 'AUD',
    currency_to: 'TRY',
    rate: 22.45,
    rate_date: '2025-11-19',
    source: 'TCMB',
    created_at: '2025-11-19T10:00:00Z',
  },
  {
    id: 8,
    currency_from: 'SAR',
    currency_to: 'TRY',
    rate: 9.20,
    rate_date: '2025-11-19',
    source: 'TCMB',
    created_at: '2025-11-19T10:00:00Z',
  },
  {
    id: 9,
    currency_from: 'SEK',
    currency_to: 'TRY',
    rate: 3.25,
    rate_date: '2025-11-19',
    source: 'TCMB',
    created_at: '2025-11-19T10:00:00Z',
  },
  {
    id: 10,
    currency_from: 'NOK',
    currency_to: 'TRY',
    rate: 3.15,
    rate_date: '2025-11-19',
    source: 'TCMB',
    created_at: '2025-11-19T10:00:00Z',
  },
  {
    id: 11,
    currency_from: 'DKK',
    currency_to: 'TRY',
    rate: 5.07,
    rate_date: '2025-11-19',
    source: 'TCMB',
    created_at: '2025-11-19T10:00:00Z',
  },
  {
    id: 12,
    currency_from: 'KWD',
    currency_to: 'TRY',
    rate: 112.45,
    rate_date: '2025-11-19',
    source: 'TCMB',
    created_at: '2025-11-19T10:00:00Z',
  },

  // 2025-11-18 Kurları
  {
    id: 20,
    currency_from: 'USD',
    currency_to: 'TRY',
    rate: 34.35,
    rate_date: '2025-11-18',
    source: 'TCMB',
    created_at: '2025-11-18T10:00:00Z',
  },
  {
    id: 21,
    currency_from: 'EUR',
    currency_to: 'TRY',
    rate: 37.65,
    rate_date: '2025-11-18',
    source: 'TCMB',
    created_at: '2025-11-18T10:00:00Z',
  },
  {
    id: 22,
    currency_from: 'GBP',
    currency_to: 'TRY',
    rate: 43.05,
    rate_date: '2025-11-18',
    source: 'TCMB',
    created_at: '2025-11-18T10:00:00Z',
  },
  {
    id: 23,
    currency_from: 'CHF',
    currency_to: 'TRY',
    rate: 39.00,
    rate_date: '2025-11-18',
    source: 'TCMB',
    created_at: '2025-11-18T10:00:00Z',
  },
  {
    id: 24,
    currency_from: 'JPY',
    currency_to: 'TRY',
    rate: 0.2240,
    rate_date: '2025-11-18',
    source: 'TCMB',
    created_at: '2025-11-18T10:00:00Z',
  },

  // 2025-11-17 Kurları (Hafta sonu - Cuma kurları tekrarlanır)
  {
    id: 30,
    currency_from: 'USD',
    currency_to: 'TRY',
    rate: 34.20,
    rate_date: '2025-11-17',
    source: 'TCMB',
    created_at: '2025-11-17T10:00:00Z',
  },
  {
    id: 31,
    currency_from: 'EUR',
    currency_to: 'TRY',
    rate: 37.50,
    rate_date: '2025-11-17',
    source: 'TCMB',
    created_at: '2025-11-17T10:00:00Z',
  },
];

// Mock mode için fallback
export const kurlarApiMock = {
  getAll: async (params?: any) => {
    let filtered = [...MOCK_EXCHANGE_RATES];
    
    if (params?.currency_from) {
      filtered = filtered.filter(r => r.currency_from === params.currency_from);
    }
    
    if (params?.currency_to) {
      filtered = filtered.filter(r => r.currency_to === params.currency_to);
    }
    
    if (params?.rate_date) {
      filtered = filtered.filter(r => r.rate_date === params.rate_date);
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
    MOCK_EXCHANGE_RATES.find(r => r.id === id) || MOCK_EXCHANGE_RATES[0],

  getByDate: async (currencyFrom: string, currencyTo: string, rateDate: string) => 
    MOCK_EXCHANGE_RATES.find(
      r => r.currency_from === currencyFrom && 
           r.currency_to === currencyTo && 
           r.rate_date === rateDate
    ),

  getLatest: async (currencyFrom: string, currencyTo: string) => {
    const rates = MOCK_EXCHANGE_RATES.filter(
      r => r.currency_from === currencyFrom && r.currency_to === currencyTo
    );
    // En güncel tarihi bul
    return rates.sort((a, b) => b.rate_date.localeCompare(a.rate_date))[0];
  },

  getToday: async () => {
    const today = new Date().toISOString().split('T')[0];
    return MOCK_EXCHANGE_RATES.filter(r => r.rate_date === today);
  },

  getByDateAll: async (rateDate: string) => 
    MOCK_EXCHANGE_RATES.filter(r => r.rate_date === rateDate),

  create: async (data: any) => {
    const newRate: ExchangeRate = {
      id: Math.max(...MOCK_EXCHANGE_RATES.map(r => r.id), 0) + 1,
      ...data,
      created_at: new Date().toISOString(),
    };
    MOCK_EXCHANGE_RATES.push(newRate);
    return newRate;
  },

  createBulk: async (rates: any[]) => {
    return rates.map((rate, index) => {
      const newRate: ExchangeRate = {
        id: Math.max(...MOCK_EXCHANGE_RATES.map(r => r.id), 0) + index + 1,
        ...rate,
        created_at: new Date().toISOString(),
      };
      MOCK_EXCHANGE_RATES.push(newRate);
      return newRate;
    });
  },

  convert: async (amount: number, from: string, to: string, date?: string) => {
    const rateDate = date || new Date().toISOString().split('T')[0];
    
    // Eğer aynı para birimiyse
    if (from === to) {
      return {
        amount,
        from,
        to,
        rate: 1,
        converted_amount: amount,
        rate_date: rateDate,
      };
    }
    
    // Kur bul
    let rate = MOCK_EXCHANGE_RATES.find(
      r => r.currency_from === from && r.currency_to === to && r.rate_date === rateDate
    );
    
    // Ters kur dene
    if (!rate) {
      const reverseRate = MOCK_EXCHANGE_RATES.find(
        r => r.currency_from === to && r.currency_to === from && r.rate_date === rateDate
      );
      if (reverseRate) {
        rate = {
          ...reverseRate,
          currency_from: from,
          currency_to: to,
          rate: 1 / reverseRate.rate,
        };
      }
    }
    
    if (!rate) {
      throw new Error(`Kur bulunamadı: ${from}/${to} - ${rateDate}`);
    }
    
    return {
      amount,
      from,
      to,
      rate: rate.rate,
      converted_amount: calculateConversion(amount, rate.rate),
      rate_date: rateDate,
    };
  },

  fetchFromTCMB: async (date?: string) => {
    // Mock: Bugünkü kurları döndür
    const today = date || new Date().toISOString().split('T')[0];
    const todayRates = MOCK_EXCHANGE_RATES.filter(r => r.rate_date === today);
    
    if (todayRates.length === 0) {
      // Yeni kurlar oluştur (mock)
      const newRates: ExchangeRate[] = [
        {
          id: Math.max(...MOCK_EXCHANGE_RATES.map(r => r.id), 0) + 1,
          currency_from: 'USD',
          currency_to: 'TRY',
          rate: 34.50,
          rate_date: today,
          source: 'TCMB',
          created_at: new Date().toISOString(),
        },
        {
          id: Math.max(...MOCK_EXCHANGE_RATES.map(r => r.id), 0) + 2,
          currency_from: 'EUR',
          currency_to: 'TRY',
          rate: 37.80,
          rate_date: today,
          source: 'TCMB',
          created_at: new Date().toISOString(),
        },
      ];
      
      MOCK_EXCHANGE_RATES.push(...newRates);
      return newRates;
    }
    
    return todayRates;
  },
};

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