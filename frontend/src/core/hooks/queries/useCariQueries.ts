/**
 * React Query Hooks - Cari Module
 * 
 * useQuery ve useMutation wrapper'ları - Cari CRUD operasyonları için cache yönetimi.
 * 
 * @see core/cache/queryClient.ts - Cache politikaları ve QueryClient config
 * @see core/api/client.ts - Base API client
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createQueryKey, getQueryOptions } from '../../cache/queryClient';
import { apiClient } from '../../api/client';
import type { Cari, CreateCariPayload, UpdateCariPayload } from '../../../shared/types/cari';
import type { ErrorResponse } from '../../types/responses';

// =====================
// Query Keys
// =====================

/**
 * Cari query keys factory
 * 
 * @example
 * cariKeys.all()          // ['cari']
 * cariKeys.lists()        // ['cari', 'list']
 * cariKeys.list(params)   // ['cari', 'list', { page: 1, ... }]
 * cariKeys.detail(id)     // ['cari', 'detail', { id: 1 }]
 */
export const cariKeys = {
  all: () => createQueryKey('CARI', 'all'),
  lists: () => createQueryKey('CARI', 'list'),
  list: (params: Record<string, unknown>) => createQueryKey('CARI', 'list', params),
  detail: (id: number) => createQueryKey('CARI', 'detail', { id }),
};

// =====================
// Queries
// =====================

/**
 * Cari listesi sorgulama - paginated
 * 
 * @param params - Pagination ve filtreleme parametreleri
 * @returns useQuery result with Cari[]
 * 
 * @example
 * const { data, isLoading, error } = useCariList({ page: 1, page_size: 20 });
 * // data = Cari[] (unwrapped from backend PaginatedResponse.data)
 * 
 * // Cache: 5 dakika fresh (CARI policy)
 * // Auto-refetch: Mount time, reconnect
 */
export function useCariList(params: { page?: number; page_size?: number; search?: string } = {}) {
  return useQuery<Cari[], ErrorResponse>({
    queryKey: cariKeys.list(params),
    queryFn: async () => {
      const response = await apiClient.get<Cari[]>('/cari', params);
      // apiClient.get returns ApiResponse (SuccessResponse | PaginatedResponse | ErrorResponse)
      if (!response.success) {
        throw response; // Throw error to trigger React Query error state
      }
      // Backend PaginatedResponse: { success: true, data: T[], pagination: {...} }
      return response.data;
    },
    ...getQueryOptions('CARI'),
  });
}

/**
 * Cari detay sorgulama
 * 
 * @param id - Cari ID
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with single Cari
 * 
 * @example
 * const { data: cari } = useCariDetail(123);
 * 
 * // Conditional query
 * const { data: cari } = useCariDetail(cariId, { enabled: !!cariId });
 */
export function useCariDetail(id: number, options?: { enabled?: boolean }) {
  return useQuery<Cari, ErrorResponse>({
    queryKey: cariKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Cari>(`/cari/${id}`);
      if (!response.success) {
        throw response;
      }
      return response.data;
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('CARI'),
  });
}

// =====================
// Mutations
// =====================

/**
 * Cari oluşturma mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const createMutation = useCreateCari();
 * 
 * createMutation.mutate(
 *   { CariKod: 'C001', Unvan: 'Test Firma', ... },
 *   {
 *     onSuccess: (data) => console.log('Created:', data),
 *     onError: (error) => console.error('Error:', error),
 *   }
 * );
 * 
 * // Cache invalidation: Tüm cari listelerini invalidate eder
 */
export function useCreateCari() {
  const queryClient = useQueryClient();

  return useMutation<Cari, ErrorResponse, CreateCariPayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<Cari>('/cari', payload);
      if (!response.success) {
        throw response;
      }
      return response.data;
    },
    onSuccess: () => {
      // Tüm cari listelerini invalidate et (fresh refetch tetikle)
      queryClient.invalidateQueries({ queryKey: cariKeys.lists() });
    },
  });
}

/**
 * Cari güncelleme mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const updateMutation = useUpdateCari();
 * 
 * updateMutation.mutate(
 *   { id: 123, data: { Unvan: 'Updated Name' } },
 *   {
 *     onSuccess: () => console.log('Updated'),
 *   }
 * );
 * 
 * // Cache invalidation: İlgili cari detay + tüm listeler
 */
export function useUpdateCari() {
  const queryClient = useQueryClient();

  return useMutation<
    Cari,
    ErrorResponse,
    { id: number; data: UpdateCariPayload }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<Cari>(`/cari/${id}`, data);
      if (!response.success) {
        throw response;
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // İlgili cari detayını invalidate et
      queryClient.invalidateQueries({ queryKey: cariKeys.detail(variables.id) });
      // Tüm cari listelerini invalidate et
      queryClient.invalidateQueries({ queryKey: cariKeys.lists() });
    },
  });
}

/**
 * Cari silme mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const deleteMutation = useDeleteCari();
 * 
 * deleteMutation.mutate(123, {
 *   onSuccess: () => console.log('Deleted'),
 * });
 * 
 * // Cache invalidation: İlgili cari detay + tüm listeler
 */
export function useDeleteCari() {
  const queryClient = useQueryClient();

  return useMutation<void, ErrorResponse, number>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<void>(`/cari/${id}`);
      if (!response.success) {
        throw response;
      }
      return response.data;
    },
    onSuccess: (_, id) => {
      // İlgili cari detayını invalidate et
      queryClient.invalidateQueries({ queryKey: cariKeys.detail(id) });
      // Tüm cari listelerini invalidate et
      queryClient.invalidateQueries({ queryKey: cariKeys.lists() });
    },
  });
}

// =====================
// Optimistic Update Example (Advanced)
// =====================

/**
 * Cari güncelleme - Optimistic UI update ile
 * 
 * Kullanıcı arayüzü hemen güncellenir, backend başarısız olursa rollback yapılır.
 * 
 * @example
 * const updateMutation = useUpdateCariOptimistic();
 * 
 * updateMutation.mutate({ id: 123, data: { Unvan: 'New Name' } });
 * // UI hemen güncellenir, backend response beklemez
 */
export function useUpdateCariOptimistic() {
  const queryClient = useQueryClient();

  return useMutation<
    Cari,
    ErrorResponse,
    { id: number; data: UpdateCariPayload },
    { previousCari: Cari | undefined }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<Cari>(`/cari/${id}`, data);
      if (!response.success) {
        throw response;
      }
      return response.data;
    },
    // Mutation başlamadan önce - snapshot al
    onMutate: async ({ id, data }) => {
      // Devam eden refetch'leri iptal et
      await queryClient.cancelQueries({ queryKey: cariKeys.detail(id) });

      // Önceki veriyi snapshot olarak sakla
      const previousCari = queryClient.getQueryData<Cari>(cariKeys.detail(id));

      // Optimistically update cache
      if (previousCari) {
        queryClient.setQueryData<Cari>(cariKeys.detail(id), {
          ...previousCari,
          ...data,
        });
      }

      // Context olarak döndür (rollback için)
      return { previousCari };
    },
    // Hata durumunda rollback
    onError: (_error, { id }, context) => {
      if (context?.previousCari) {
        queryClient.setQueryData(cariKeys.detail(id), context.previousCari);
      }
    },
    // Her durumda refetch (success/error)
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: cariKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: cariKeys.lists() });
    },
  });
}
