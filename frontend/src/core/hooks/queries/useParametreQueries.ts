/**
 * React Query Hooks - Parametre Module
 * 
 * useQuery ve useMutation wrapper'ları - Parametre (System Configuration) CRUD için cache yönetimi.
 * 
 * @see core/cache/queryClient.ts - Cache politikaları ve QueryClient config
 * @see core/api/client.ts - Base API client
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createQueryKey, getQueryOptions } from '../../cache/queryClient';
import { apiClient } from '../../api/client';
import { useToastMutation } from '@/core/hooks/useToastMutation';
import type { Parametre, CreateParametrePayload, UpdateParametrePayload } from '../../../shared/types/parametre';
import type { ErrorResponse } from '../../types/responses';

// =====================
// Query Keys
// =====================

/**
 * Parametre query keys factory
 * 
 * @example
 * parametreKeys.all()          // ['parametre']
 * parametreKeys.lists()        // ['parametre', 'list']
 * parametreKeys.list(params)   // ['parametre', 'list', { kategori: 'GENEL' }]
 * parametreKeys.detail(id)     // ['parametre', 'detail', { id: 1 }]
 * parametreKeys.byCode(kod)    // ['parametre', 'by-code', { kod: 'KDV_RATE' }]
 */
export const parametreKeys = {
  all: () => createQueryKey('PARAMETRELER', 'all'),
  lists: () => createQueryKey('PARAMETRELER', 'list'),
  list: (params: Record<string, unknown>) => createQueryKey('PARAMETRELER', 'list', params),
  detail: (id: number) => createQueryKey('PARAMETRELER', 'detail', { id }),
  byCode: (kod: string) => createQueryKey('PARAMETRELER', 'by-code', { kod }),
  byCategory: (kategori: string) => createQueryKey('PARAMETRELER', 'by-category', { kategori }),
};

// =====================
// Queries
// =====================

/**
 * Parametre listesi sorgulama - paginated
 * 
 * @param params - Pagination ve filtreleme parametreleri
 * @returns useQuery result with Parametre[]
 * 
 * @example
 * const { data } = useParametreList({ kategori: 'GENEL' });
 * const { data } = useParametreList({ search: 'kdv' });
 * 
 * // Cache: 1 saat fresh (PARAMETRELER policy - nadir değişir)
 */
export function useParametreList(params: {
  page?: number;
  page_size?: number;
  search?: string;
  kategori?: string;
} = {}) {
  return useQuery<Parametre[], ErrorResponse>({
    queryKey: parametreKeys.list(params),
    queryFn: async (): Promise<Parametre[]> => {
      try {
        // Query string'i manuel oluştur
        const queryParams = new URLSearchParams({
          page: String(params.page || 1),
          page_size: String(params.page_size || 100),
          ...(params.kategori && { kategori: params.kategori }),
        });
        
        // Direct fetch ile backend'e istek gönder
        const response = await fetch(`/api/parametre?${queryParams}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Backend'den gelen veriyi parse et
        let items: Parametre[] = Array.isArray(data.data) ? data.data : [];
        
        // Client-side search filtresi
        if (params.search) {
          const searchLower = params.search.toLowerCase();
          items = items.filter((p: Parametre) =>
            p.Kod.toLowerCase().includes(searchLower) ||
            p.Ad.toLowerCase().includes(searchLower) ||
            p.Aciklama?.toLowerCase().includes(searchLower) ||
            p.Deger?.toLowerCase().includes(searchLower)
          );
        }
        
        return items;
      } catch (error) {
        throw {
          success: false,
          error: {
            code: 'PARAMETRE_LIST_ERROR',
            message: error instanceof Error ? error.message : 'Parametreler yüklenemedi',
          },
          meta: { timestamp: new Date().toISOString() },
        } as ErrorResponse;
      }
    },
    ...getQueryOptions('PARAMETRELER'),
  });
}

/**
 * Parametre detay sorgulama
 * 
 * @param id - Parametre ID
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with single Parametre
 * 
 * @example
 * const { data: parametre } = useParametreDetail(123);
 */
export function useParametreDetail(id: number, options?: { enabled?: boolean }) {
  return useQuery<Parametre, ErrorResponse>({
    queryKey: parametreKeys.detail(id),
    queryFn: async (): Promise<Parametre> => {
      const response = await apiClient.get<any>(`/parametre/${id}`);
      if (!response.success) {
        throw response;
      }
      const data = response.data;
      return Array.isArray(data) ? data[0] : data;
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('PARAMETRELER'),
  });
}

/**
 * Parametre kod ile sorgulama
 * 
 * @param kod - Parametre Kod (örn: 'KDV_RATE', 'MB_STEP_MIN')
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with single Parametre
 * 
 * @example
 * const { data: kdvRate } = useParametreByCode('KDV_RATE');
 * const { data: mbStep } = useParametreByCode('MB_STEP_MIN');
 */
export function useParametreByCode(kod: string, options?: { enabled?: boolean }) {
  return useQuery<Parametre, ErrorResponse>({
    queryKey: parametreKeys.byCode(kod),
    queryFn: async (): Promise<Parametre> => {
      const response = await apiClient.get<any>(`/parametre/by-code/${kod}`);
      if (!response.success) {
        throw response;
      }
      const data = response.data;
      return Array.isArray(data) ? data[0] : data;
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('PARAMETRELER'),
  });
}

/**
 * Kategoriye göre parametre listesi
 * 
 * @param kategori - Kategori adı (GENEL, FIYATLANDIRMA, MOTORBOT, vb.)
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with Parametre[]
 * 
 * @example
 * const { data: fiyatParams } = useParametreByCategory('FIYATLANDIRMA');
 */
export function useParametreByCategory(kategori: string, options?: { enabled?: boolean }) {
  return useQuery<Parametre[], ErrorResponse>({
    queryKey: parametreKeys.byCategory(kategori),
    queryFn: async (): Promise<Parametre[]> => {
      const response = await apiClient.get<any>(`/parametre/by-category/${kategori}`);
      if (!response.success) {
        throw response;
      }
      const data = response.data;
      return Array.isArray(data) ? data : [data];
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('PARAMETRELER'),
  });
}

// =====================
// Mutations
// =====================

/**
 * Parametre oluşturma mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const createMutation = useCreateParametre();
 * 
 * createMutation.mutate({
 *   Kategori: 'GENEL',
 *   Kod: 'NEW_PARAM',
 *   Ad: 'Yeni Parametre',
 *   Deger: '100'
 * });
 * 
 * // Cache invalidation: Tüm parametre listelerini invalidate eder
 */
export function useCreateParametre() {
  const queryClient = useQueryClient();

  return useToastMutation<Parametre, CreateParametrePayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<Parametre>('/parametre', payload);
      if (!response.success) {
        throw response;
      }
      return response.data as Parametre;
    },
    onSuccess: (data) => {
      // Tüm parametre listelerini invalidate et
      queryClient.invalidateQueries({ queryKey: parametreKeys.lists() });
      // İlgili kategorinin cache'ini de invalidate et
      if (data.Kategori) {
        queryClient.invalidateQueries({ queryKey: parametreKeys.byCategory(data.Kategori) });
      }
    },
    messages: {
      success: (data) => `Parametre oluşturuldu: ${data.Kod}`,
      error: 'Parametre oluşturulurken hata oluştu',
    },
  });
}

/**
 * Parametre güncelleme mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const updateMutation = useUpdateParametre();
 * 
 * updateMutation.mutate({
 *   id: 123,
 *   data: { Deger: '150', Aciklama: 'Güncellenmiş açıklama' }
 * });
 * 
 * // Cache invalidation: İlgili parametre detay + kategori + tüm listeler
 */
export function useUpdateParametre() {
  const queryClient = useQueryClient();

  return useToastMutation<Parametre, { id: number; data: UpdateParametrePayload }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<Parametre>(`/parametre/${id}`, data);
      if (!response.success) {
        throw response;
      }
      return response.data as Parametre;
    },
    onSuccess: (data, variables) => {
      // İlgili parametre detayını invalidate et
      queryClient.invalidateQueries({ queryKey: parametreKeys.detail(variables.id) });
      // Kod ile cache'i de invalidate et
      if (data.Kod) {
        queryClient.invalidateQueries({ queryKey: parametreKeys.byCode(data.Kod) });
      }
      // Kategori cache'ini invalidate et
      if (data.Kategori) {
        queryClient.invalidateQueries({ queryKey: parametreKeys.byCategory(data.Kategori) });
      }
      // Tüm parametre listelerini invalidate et
      queryClient.invalidateQueries({ queryKey: parametreKeys.lists() });
    },
    messages: {
      success: (data) => `Parametre güncellendi: ${data.Kod}`,
      error: 'Parametre güncellenirken hata oluştu',
    },
  });
}

/**
 * Parametre silme mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const deleteMutation = useDeleteParametre();
 * 
 * deleteMutation.mutate(123, {
 *   onSuccess: () => console.log('Deleted'),
 * });
 * 
 * // Cache invalidation: İlgili parametre detay + tüm listeler
 */
export function useDeleteParametre() {
  const queryClient = useQueryClient();

  return useToastMutation<void, number>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<void>(`/parametre/${id}`);
      if (!response.success) {
        throw response;
      }
      return response.data as void;
    },
    onSuccess: (_, id) => {
      // İlgili parametre detayını invalidate et
      queryClient.invalidateQueries({ queryKey: parametreKeys.detail(id) });
      // Tüm parametre listelerini invalidate et (kategori bilgisi bilinmediği için tümü)
      queryClient.invalidateQueries({ queryKey: parametreKeys.lists() });
      queryClient.invalidateQueries({ queryKey: parametreKeys.all() });
    },
    messages: {
      success: 'Parametre silindi',
      error: 'Parametre silinirken hata oluştu',
    },
  });
}

/**
 * Parametre değer güncelleme (sadece Deger alanı)
 * 
 * Hızlı değer güncelleme için specialized mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const updateValueMutation = useUpdateParametreValue();
 * 
 * updateValueMutation.mutate({ id: 123, deger: '200' });
 */
export function useUpdateParametreValue() {
  const queryClient = useQueryClient();

  return useToastMutation<Parametre, { id: number; deger: string }>({
    mutationFn: async ({ id, deger }) => {
      const response = await apiClient.put<Parametre>(`/parametre/${id}`, { Deger: deger });
      if (!response.success) {
        throw response;
      }
      return response.data as Parametre;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: parametreKeys.detail(variables.id) });
      if (data.Kod) {
        queryClient.invalidateQueries({ queryKey: parametreKeys.byCode(data.Kod) });
      }
      if (data.Kategori) {
        queryClient.invalidateQueries({ queryKey: parametreKeys.byCategory(data.Kategori) });
      }
      queryClient.invalidateQueries({ queryKey: parametreKeys.lists() });
    },
    messages: {
      success: (data) => `Parametre değeri güncellendi: ${data.Kod} = ${data.Deger}`,
      error: 'Parametre değeri güncellenirken hata oluştu',
    },
  });
}
