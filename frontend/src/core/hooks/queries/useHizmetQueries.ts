/**
 * React Query Hooks - Hizmet Module
 * 
 * useQuery ve useMutation wrapper'ları - Hizmet CRUD operasyonları için cache yönetimi.
 * 
 * @see core/cache/queryClient.ts - Cache politikaları ve QueryClient config
 * @see core/api/client.ts - Base API client
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createQueryKey, getQueryOptions } from '../../cache/queryClient';
import { apiClient } from '../../api/client';
import type { Hizmet, CreateHizmetPayload, UpdateHizmetPayload } from '../../../shared/types/hizmet';
import type { ErrorResponse } from '../../types/responses';
import { useToastMutation, toastMessages } from '../useToastMutation';
import { usePaginatedQuery } from './usePaginatedQuery';

// =====================
// Query Keys
// =====================

/**
 * Hizmet query keys factory
 * 
 * @example
 * hizmetKeys.all()          // ['hizmet']
 * hizmetKeys.lists()        // ['hizmet', 'list']
 * hizmetKeys.list(params)   // ['hizmet', 'list', { page: 1, ... }]
 * hizmetKeys.detail(id)     // ['hizmet', 'detail', { id: 1 }]
 */
export const hizmetKeys = {
  all: () => createQueryKey('HIZMET', 'all'),
  lists: () => createQueryKey('HIZMET', 'list'),
  list: (params: Record<string, unknown>) => createQueryKey('HIZMET', 'list', params),
  detail: (id: number) => createQueryKey('HIZMET', 'detail', { id }),
  byCode: (kod: string) => createQueryKey('HIZMET', 'by-code', { kod }),
};

// =====================
// Queries
// =====================

/**
 * Hizmet listesi sorgulama - paginated
 * 
 * @param params - Pagination ve filtreleme parametreleri
 * @returns useQuery result with Hizmet[]
 * 
 * @example
 * const { data, isLoading, error } = useHizmetList({ page: 1, page_size: 20, search: 'tarama' });
 * // data = Hizmet[] (unwrapped from backend PaginatedResponse.data)
 * 
 * // Cache: 30 dakika fresh (HIZMET policy)
 * // Auto-refetch: Mount time, reconnect
 */
export function useHizmetList(params: { page?: number; page_size?: number; search?: string; grup_kod?: string } = {}) {
  return useQuery<Hizmet[], ErrorResponse>({
    queryKey: hizmetKeys.list(params),
    queryFn: async () => {
      const response = await apiClient.get<Hizmet[]>('/hizmet', params);
      if (!response.success) {
        throw response;
      }
      return response.data as Hizmet[];
    },
    ...getQueryOptions('HIZMET'),
  });
}

/**
 * Hizmet listesi paginated (items + pagination meta)
 * 
 * @example
 * const { data } = useHizmetListPaginated({ page: 1, page_size: 20, search: 'tarama' });
 * // data = { items: Hizmet[], pagination: PaginationMeta }
 */
export function useHizmetListPaginated(params: { page?: number; page_size?: number; search?: string; grup_kod?: string } = {}) {
  return usePaginatedQuery<Hizmet, typeof params>({
    module: 'HIZMET',
    path: '/hizmet',
    filters: params,
  });
}

/**
 * Hizmet detay sorgulama
 * 
 * @param id - Hizmet ID
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with single Hizmet
 * 
 * @example
 * const { data: hizmet } = useHizmetDetail(123);
 * 
 * // Conditional query
 * const { data: hizmet } = useHizmetDetail(hizmetId, { enabled: !!hizmetId });
 */
export function useHizmetDetail(id: number, options?: { enabled?: boolean }) {
  return useQuery<Hizmet, ErrorResponse>({
    queryKey: hizmetKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Hizmet>(`/hizmet/${id}`);
      if (!response.success) {
        throw response;
      }
      return response.data as Hizmet;
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('HIZMET'),
  });
}

/**
 * Hizmet kod ile sorgulama
 * 
 * @param kod - Hizmet Kod
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with single Hizmet
 * 
 * @example
 * const { data: hizmet } = useHizmetByCode('TARAMA-001');
 */
export function useHizmetByCode(kod: string, options?: { enabled?: boolean }) {
  return useQuery<Hizmet, ErrorResponse>({
    queryKey: hizmetKeys.byCode(kod),
    queryFn: async () => {
      const response = await apiClient.get<Hizmet>(`/hizmet/by-code/${kod}`);
      if (!response.success) {
        throw response;
      }
      return response.data as Hizmet;
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('HIZMET'),
  });
}

// =====================
// Mutations
// =====================

/**
 * Hizmet oluşturma mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const createMutation = useCreateHizmet();
 * 
 * createMutation.mutate(
 *   { Kod: 'TARAMA-001', Ad: 'Römork Tarama', Birim: 'ADET', ... },
 *   {
 *     onSuccess: (data) => console.log('Created:', data),
 *     onError: (error) => console.error('Error:', error),
 *   }
 * );
 * 
 * // Cache invalidation: Tüm hizmet listelerini invalidate eder
 */
export function useCreateHizmet() {
  const queryClient = useQueryClient();
  return useToastMutation<Hizmet, CreateHizmetPayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<Hizmet>('/hizmet', payload);
      if (!response.success) throw response;
      return response.data as Hizmet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hizmetKeys.lists() });
    },
    messages: {
      ...toastMessages.create('Hizmet'),
      success: (data) => `Hizmet oluşturuldu: ${data.Kod}`,
    },
  });
}

/**
 * Hizmet güncelleme mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const updateMutation = useUpdateHizmet();
 * 
 * updateMutation.mutate(
 *   { id: 123, data: { Ad: 'Updated Hizmet Adı', Fiyat: 150.00 } },
 *   {
 *     onSuccess: () => console.log('Updated'),
 *   }
 * );
 * 
 * // Cache invalidation: İlgili hizmet detay + tüm listeler
 */
export function useUpdateHizmet() {
  const queryClient = useQueryClient();
  return useToastMutation<Hizmet, { id: number; data: UpdateHizmetPayload }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<Hizmet>(`/hizmet/${id}`, data);
      if (!response.success) throw response;
      return response.data as Hizmet;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: hizmetKeys.detail(variables.id) });
      if (data.Kod) {
        queryClient.invalidateQueries({ queryKey: hizmetKeys.byCode(data.Kod) });
      }
      queryClient.invalidateQueries({ queryKey: hizmetKeys.lists() });
    },
    messages: {
      ...toastMessages.update('Hizmet'),
      success: (data) => `Hizmet güncellendi: ${data.Kod}`,
    },
  });
}

/**
 * Hizmet silme mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const deleteMutation = useDeleteHizmet();
 * 
 * deleteMutation.mutate(123, {
 *   onSuccess: () => console.log('Deleted'),
 * });
 * 
 * // Cache invalidation: İlgili hizmet detay + tüm listeler
 */
export function useDeleteHizmet() {
  const queryClient = useQueryClient();
  return useToastMutation<void, number>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<void>(`/hizmet/${id}`);
      if (!response.success) throw response;
      return undefined;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: hizmetKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: hizmetKeys.lists() });
    },
    messages: {
      ...toastMessages.delete('Hizmet'),
      success: () => 'Hizmet silindi',
    },
  });
}

/**
 * Hizmet aktif/pasif durumu değiştirme
 * 
 * @returns useMutation result
 * 
 * @example
 * const toggleMutation = useToggleHizmetStatus();
 * 
 * toggleMutation.mutate({ id: 123, aktif: false });
 */
export function useToggleHizmetStatus() {
  const queryClient = useQueryClient();

  return useToastMutation<Hizmet, { id: number; aktif: boolean }>({
    mutationFn: async ({ id, aktif }) => {
      const response = await apiClient.put<Hizmet>(`/hizmet/${id}`, { AktifMi: aktif });
      if (!response.success) throw response;
      return response.data as Hizmet;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: hizmetKeys.detail(variables.id) });
      if (data.Kod) {
        queryClient.invalidateQueries({ queryKey: hizmetKeys.byCode(data.Kod) });
      }
      queryClient.invalidateQueries({ queryKey: hizmetKeys.lists() });
    },
    messages: {
      success: (data, vars) => `Hizmet ${vars.aktif ? 'aktif' : 'pasif'} yapıldı: ${data.Kod}`,
      error: (err) => `Durum değiştirilemedi: ${err.error.message}`,
    },
  });
}
