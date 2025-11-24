/**
 * React Query Hooks - Kurlar (Exchange Rates) Module
 * 
 * useQuery ve useMutation wrapper'ları - ExchangeRate CRUD + TCMB entegrasyonu için cache yönetimi.
 * 
 * @see core/cache/queryClient.ts - Cache politikaları ve QueryClient config
 * @see core/api/client.ts - Base API client
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createQueryKey, getQueryOptions } from '../../cache/queryClient';
import { apiClient } from '../../api/client';
import { useToastMutation } from '@/core/hooks/useToastMutation';
import type {
  ExchangeRate,
  CreateExchangeRatePayload,
  UpdateExchangeRatePayload,
  FetchTCMBRequest,
  BulkExchangeRateRequest,
} from '../../../shared/types/kurlar';
import type { ErrorResponse } from '../../types/responses';

// =====================
// Query Keys
// =====================

/**
 * ExchangeRate query keys factory
 * 
 * @example
 * exchangeRateKeys.all()              // ['kurlar']
 * exchangeRateKeys.lists()            // ['kurlar', 'list']
 * exchangeRateKeys.list(params)       // ['kurlar', 'list', { rate_date: '2025-01-20' }]
 * exchangeRateKeys.detail(id)         // ['kurlar', 'detail', { id: 1 }]
 * exchangeRateKeys.byPair('USD','TRY') // ['kurlar', 'by-pair', { from: 'USD', to: 'TRY' }]
 * exchangeRateKeys.latest('USD')      // ['kurlar', 'latest', { currency: 'USD' }]
 */
export const exchangeRateKeys = {
  all: () => createQueryKey('KURLAR', 'all'),
  lists: () => createQueryKey('KURLAR', 'list'),
  list: (params: Record<string, unknown>) => createQueryKey('KURLAR', 'list', params),
  detail: (id: number) => createQueryKey('KURLAR', 'detail', { id }),
  byPair: (from: string, to: string, date?: string) =>
    createQueryKey('KURLAR', 'by-pair', { from, to, date }),
  latest: (currency: string) => createQueryKey('KURLAR', 'latest', { currency }),
  latestAll: () => createQueryKey('KURLAR', 'latest-all'),
};

// =====================
// Queries
// =====================

/**
 * ExchangeRate listesi sorgulama - paginated
 * 
 * @param params - Pagination ve filtreleme parametreleri
 * @returns useQuery result with ExchangeRate[]
 * 
 * @example
 * const { data } = useExchangeRateList({ rate_date: '2025-01-20' });
 * const { data } = useExchangeRateList({ currency_from: 'USD', currency_to: 'TRY' });
 * 
 * // Cache: 4 saat fresh (KURLAR policy - günde 2 kez güncellenir genelde)
 */
export function useExchangeRateList(params: {
  page?: number;
  page_size?: number;
  rate_date?: string; // ISO8601 date (YYYY-MM-DD)
  currency_from?: string;
  currency_to?: string;
  source?: string;
} = {}) {
  return useQuery<ExchangeRate[], ErrorResponse>({
    queryKey: exchangeRateKeys.list(params),
    queryFn: async (): Promise<ExchangeRate[]> => {
      const response = await apiClient.get<ExchangeRate[]>('/kurlar', params);
      if (!response.success) {
        throw response;
      }
      return response.data as ExchangeRate[];
    },
    ...getQueryOptions('KURLAR'),
  });
}

/**
 * ExchangeRate detay sorgulama
 * 
 * @param id - ExchangeRate ID
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with single ExchangeRate
 * 
 * @example
 * const { data: rate } = useExchangeRateDetail(123);
 */
export function useExchangeRateDetail(id: number, options?: { enabled?: boolean }) {
  return useQuery<ExchangeRate, ErrorResponse>({
    queryKey: exchangeRateKeys.detail(id),
    queryFn: async (): Promise<ExchangeRate> => {
      const response = await apiClient.get<ExchangeRate>(`/kurlar/${id}`);
      if (!response.success) {
        throw response;
      }
      return response.data as ExchangeRate;
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('KURLAR'),
  });
}

/**
 * Belirli döviz çifti ve tarih için kur getir
 * 
 * @param from - Kaynak para birimi (USD, EUR, vb.)
 * @param to - Hedef para birimi (TRY, vb.)
 * @param date - ISO8601 date string (YYYY-MM-DD) - opsiyonel, default: bugün
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with single ExchangeRate
 * 
 * @example
 * const { data: usdTry } = useExchangeRateByPair('USD', 'TRY');
 * const { data: eurTry } = useExchangeRateByPair('EUR', 'TRY', '2025-01-15');
 */
export function useExchangeRateByPair(
  from: string,
  to: string,
  date?: string,
  options?: { enabled?: boolean }
) {
  return useQuery<ExchangeRate, ErrorResponse>({
    queryKey: exchangeRateKeys.byPair(from, to, date),
    queryFn: async (): Promise<ExchangeRate> => {
      const params = date ? { rate_date: date } : {};
      const response = await apiClient.get<ExchangeRate>(
        `/kurlar/by-pair/${from}/${to}`,
        params
      );
      if (!response.success) {
        throw response;
      }
      return response.data as ExchangeRate;
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('KURLAR'),
  });
}

/**
 * Belirli bir para birimi için en güncel kur
 * 
 * @param currency - Para birimi (USD, EUR, vb.)
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with single ExchangeRate
 * 
 * @example
 * const { data: latestUsd } = useLatestExchangeRate('USD');
 */
export function useLatestExchangeRate(currency: string, options?: { enabled?: boolean }) {
  return useQuery<ExchangeRate, ErrorResponse>({
    queryKey: exchangeRateKeys.latest(currency),
    queryFn: async (): Promise<ExchangeRate> => {
      const response = await apiClient.get<ExchangeRate>(`/kurlar/latest/${currency}`);
      if (!response.success) {
        throw response;
      }
      return response.data as ExchangeRate;
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('KURLAR'),
  });
}

/**
 * Tüm para birimleri için en güncel kurlar
 * 
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with ExchangeRate[]
 * 
 * @example
 * const { data: latestRates } = useLatestExchangeRates();
 */
export function useLatestExchangeRates(options?: { enabled?: boolean }) {
  return useQuery<ExchangeRate[], ErrorResponse>({
    queryKey: exchangeRateKeys.latestAll(),
    queryFn: async (): Promise<ExchangeRate[]> => {
      const response = await apiClient.get<ExchangeRate[]>('/kurlar/latest');
      if (!response.success) {
        throw response;
      }
      return response.data as ExchangeRate[];
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('KURLAR'),
  });
}

// =====================
// Mutations
// =====================

/**
 * ExchangeRate oluşturma mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const createMutation = useCreateExchangeRate();
 * 
 * createMutation.mutate({
 *   CurrencyFrom: 'USD',
 *   CurrencyTo: 'TRY',
 *   Rate: 34.25,
 *   SellRate: 34.50,
 *   RateDate: '2025-01-20',
 *   Source: 'MANUAL'
 * });
 * 
 * // Cache invalidation: Tüm kur listelerini + ilgili pair cache'i invalidate eder
 */
export function useCreateExchangeRate() {
  const queryClient = useQueryClient();

  return useToastMutation<ExchangeRate, CreateExchangeRatePayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<ExchangeRate>('/kurlar', payload);
      if (!response.success) {
        throw response;
      }
      return response.data as ExchangeRate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: exchangeRateKeys.byPair(data.CurrencyFrom, data.CurrencyTo),
      });
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.latest(data.CurrencyFrom) });
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.latestAll() });
    },
    messages: {
      success: (data) => `Kur oluşturuldu: ${data.CurrencyFrom}/${data.CurrencyTo} = ${data.Rate}`,
      error: 'Kur oluşturulurken hata oluştu',
    },
  });
}

/**
 * ExchangeRate güncelleme mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const updateMutation = useUpdateExchangeRate();
 * 
 * updateMutation.mutate({
 *   id: 123,
 *   data: { Rate: 34.30, SellRate: 34.55 }
 * });
 * 
 * // Cache invalidation: İlgili kur detay + pair + latest + tüm listeler
 */
export function useUpdateExchangeRate() {
  const queryClient = useQueryClient();

  return useToastMutation<ExchangeRate, { id: number; data: UpdateExchangeRatePayload }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<ExchangeRate>(`/kurlar/${id}`, data);
      if (!response.success) {
        throw response;
      }
      return response.data as ExchangeRate;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.detail(variables.id) });
      queryClient.invalidateQueries({
        queryKey: exchangeRateKeys.byPair(data.CurrencyFrom, data.CurrencyTo),
      });
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.latest(data.CurrencyFrom) });
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.latestAll() });
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.lists() });
    },
    messages: {
      success: (data) => `Kur güncellendi: ${data.CurrencyFrom}/${data.CurrencyTo} = ${data.Rate}`,
      error: 'Kur güncellenirken hata oluştu',
    },
  });
}

/**
 * ExchangeRate silme mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const deleteMutation = useDeleteExchangeRate();
 * 
 * deleteMutation.mutate(123, {
 *   onSuccess: () => console.log('Deleted'),
 * });
 * 
 * // Cache invalidation: İlgili kur detay + tüm listeler
 */
export function useDeleteExchangeRate() {
  const queryClient = useQueryClient();

  return useToastMutation<void, number>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<void>(`/kurlar/${id}`);
      if (!response.success) {
        throw response;
      }
      return response.data as void;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.latestAll() });
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.all() });
    },
    messages: {
      success: 'Kur silindi',
      error: 'Kur silinirken hata oluştu',
    },
  });
}

/**
 * TCMB kurlarını çek ve kaydet
 * 
 * Backend'den TCMB API'sine istek atarak güncel kurları çeker ve kaydeder.
 * 
 * @returns useMutation result
 * 
 * @example
 * const fetchTcmbMutation = useFetchTCMBRates();
 * 
 * fetchTcmbMutation.mutate({ date: '2025-01-20' }); // Belirli tarih
 * fetchTcmbMutation.mutate({}); // Bugünün kurları
 * 
 * // Cache invalidation: Tüm kur cache'lerini invalidate eder (bulk update)
 */
export function useFetchTCMBRates() {
  const queryClient = useQueryClient();

  return useToastMutation<ExchangeRate[], FetchTCMBRequest>({
    mutationFn: async (request) => {
      const response = await apiClient.post<ExchangeRate[]>('/kurlar/fetch-tcmb', request);
      if (!response.success) {
        throw response;
      }
      return response.data as ExchangeRate[];
    },
    onSuccess: () => {
      // TCMB fetch bulk operation - tüm cache'i temizle
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.all() });
    },
    messages: {
      success: (data) => `TCMB'den ${data.length} kur başarıyla çekildi ve güncellendi`,
      error: 'TCMB kurları çekilirken hata oluştu',
    },
  });
}

/**
 * Toplu kur oluşturma (bulk insert)
 * 
 * @returns useMutation result
 * 
 * @example
 * const bulkCreateMutation = useBulkCreateExchangeRates();
 * 
 * bulkCreateMutation.mutate({
 *   rates: [
 *     { CurrencyFrom: 'USD', CurrencyTo: 'TRY', Rate: 34.25, RateDate: '2025-01-20' },
 *     { CurrencyFrom: 'EUR', CurrencyTo: 'TRY', Rate: 37.50, RateDate: '2025-01-20' },
 *   ]
 * });
 * 
 * // Cache invalidation: Tüm kur cache'lerini invalidate eder
 */
export function useBulkCreateExchangeRates() {
  const queryClient = useQueryClient();

  return useToastMutation<ExchangeRate[], BulkExchangeRateRequest>({
    mutationFn: async (request) => {
      const response = await apiClient.post<ExchangeRate[]>('/kurlar/bulk', request);
      if (!response.success) {
        throw response;
      }
      return response.data as ExchangeRate[];
    },
    onSuccess: () => {
      // Bulk operation - tüm cache'i temizle
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.all() });
    },
    messages: {
      success: (data) => `${data.length} kur toplu olarak oluşturuldu`,
      error: 'Toplu kur oluşturulurken hata oluştu',
    },
  });
}
