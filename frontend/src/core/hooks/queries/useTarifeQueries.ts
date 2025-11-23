/**
 * React Query Hooks - Tarife Module
 * 
 * useQuery ve useMutation wrapper'ları - Tarife (PriceList) & PriceListItem CRUD için cache yönetimi.
 * 
 * @see core/cache/queryClient.ts - Cache politikaları ve QueryClient config
 * @see core/api/client.ts - Base API client
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createQueryKey, getQueryOptions } from '../../cache/queryClient';
import { apiClient } from '../../api/client';
import type {
  PriceList,
  PriceListItem,
  CreatePriceListPayload,
  UpdatePriceListPayload,
  CreatePriceListItemPayload,
  UpdatePriceListItemPayload,
  PriceListDurum,
} from '../../../shared/types/tarife';
import type { ErrorResponse } from '../../types/responses';
import { useToastMutation } from '../../hooks/useToastMutation';
import { usePaginatedQuery } from './usePaginatedQuery';

// =====================
// Query Keys - PriceList
// =====================

export const priceListKeys = {
  all: () => createQueryKey('TARIFE', 'all'),
  lists: () => createQueryKey('TARIFE', 'list'),
  list: (params: Record<string, unknown>) => createQueryKey('TARIFE', 'list', params),
  detail: (id: number) => createQueryKey('TARIFE', 'detail', { id }),
  byCode: (kod: string) => createQueryKey('TARIFE', 'by-code', { kod }),
  items: (priceListId: number) => createQueryKey('TARIFE', 'items', { priceListId }),
};

// =====================
// Query Keys - PriceListItem
// =====================

export const priceListItemKeys = {
  all: () => createQueryKey('TARIFE', 'item-all'),
  detail: (id: number) => createQueryKey('TARIFE', 'item-detail', { id }),
};

// =====================
// Queries - PriceList
// =====================

/**
 * PriceList listesi sorgulama - paginated
 * 
 * @example
 * const { data } = usePriceListList({ page: 1, durum: 'AKTIF' });
 */
// Legacy non-paginated list (tüm sonuçları dönen) - yavaş yavaş paginated sürüme geçilecek.
export function usePriceListList(params: {
  page?: number;
  page_size?: number;
  search?: string;
  durum?: PriceListDurum;
} = {}) {
  return useQuery<PriceList[], ErrorResponse>({
    queryKey: priceListKeys.list(params),
    queryFn: async () => {
      const response = await apiClient.get<PriceList[]>('/tarife/price-list', params);
      if (!response.success) {
        throw response;
      }
      return response.data as PriceList[];
    },
    ...getQueryOptions('TARIFE'),
  });
}

// Paginated modern hook (items + pagination meta)
export function usePriceListListPaginated(filters: {
  page?: number;
  page_size?: number;
  search?: string;
  durum?: PriceListDurum;
} = {}) {
  return usePaginatedQuery<PriceList, typeof filters>({
    module: 'TARIFE',
    path: '/tarife/price-list',
    filters,
  });
}

/**
 * PriceList detay sorgulama
 * 
 * @example
 * const { data: priceList } = usePriceListDetail(123);
 */
export function usePriceListDetail(id: number, options?: { enabled?: boolean }) {
  return useQuery<PriceList, ErrorResponse>({
    queryKey: priceListKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<PriceList>(`/tarife/price-list/${id}`);
      if (!response.success) {
        throw response;
      }
      return response.data;
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('TARIFE'),
  });
}

/**
 * PriceList items sorgulama (bir tarifeye ait tüm kalemler)
 * 
 * @example
 * const { data: items } = usePriceListItems(123);
 */
export function usePriceListItems(priceListId: number, options?: { enabled?: boolean }) {
  return useQuery<PriceListItem[], ErrorResponse>({
    queryKey: priceListKeys.items(priceListId),
    queryFn: async () => {
      const response = await apiClient.get<PriceListItem[]>(`/tarife/price-list/${priceListId}/items`);
      if (!response.success) {
        throw response;
      }
      return response.data;
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('TARIFE'),
  });
}

// =====================
// Queries - PriceListItem
// =====================

/**
 * PriceListItem detay sorgulama
 * 
 * @example
 * const { data: item } = usePriceListItemDetail(456);
 */
export function usePriceListItemDetail(id: number, options?: { enabled?: boolean }) {
  return useQuery<PriceListItem, ErrorResponse>({
    queryKey: priceListItemKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<PriceListItem>(`/tarife/price-list-item/${id}`);
      if (!response.success) {
        throw response;
      }
      return response.data;
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('TARIFE'),
  });
}

// =====================
// Mutations - PriceList
// =====================

/**
 * PriceList oluşturma
 * 
 * @example
 * const createMutation = useCreatePriceList();
 * createMutation.mutate({ Kod: 'TRF2025', Ad: '2025 Tarifeleri', ParaBirimi: 'TRY' });
 */
export function useCreatePriceList() {
  const queryClient = useQueryClient();
  return useToastMutation<PriceList, CreatePriceListPayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<PriceList>('/tarife/price-list', payload);
      if (!response.success) throw response;
      return response.data as PriceList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceListKeys.lists() });
    },
    messages: {
      success: (data) => `Tarife oluşturuldu: ${data.Kod}`,
      error: (err) => `Tarife oluşturulamadı: ${err.error.message}`,
    },
  });
}

/**
 * PriceList güncelleme
 * 
 * @example
 * const updateMutation = useUpdatePriceList();
 * updateMutation.mutate({ id: 123, data: { Durum: 'AKTIF' } });
 */
export function useUpdatePriceList() {
  const queryClient = useQueryClient();
  return useToastMutation<PriceList, { id: number; data: UpdatePriceListPayload }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<PriceList>(`/tarife/price-list/${id}`, data);
      if (!response.success) throw response;
      return response.data as PriceList;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: priceListKeys.detail(variables.id) });
      if (data.Kod) queryClient.invalidateQueries({ queryKey: priceListKeys.byCode(data.Kod) });
      queryClient.invalidateQueries({ queryKey: priceListKeys.lists() });
      queryClient.invalidateQueries({ queryKey: priceListKeys.items(variables.id) });
    },
    messages: {
      success: (data) => `Tarife güncellendi: ${data.Kod}`,
      error: (err, vars) => `Tarife güncellenemedi (ID:${vars.id}): ${err.error.message}`,
    },
  });
}

/**
 * PriceList silme
 * 
 * @example
 * const deleteMutation = useDeletePriceList();
 * deleteMutation.mutate(123);
 */
export function useDeletePriceList() {
  const queryClient = useQueryClient();
  return useToastMutation<void, number>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<void>(`/tarife/price-list/${id}`);
      if (!response.success) throw response;
      return response.data as void;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: priceListKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: priceListKeys.lists() });
      queryClient.invalidateQueries({ queryKey: priceListKeys.items(id) });
    },
    messages: {
      success: (_ , id) => `Tarife silindi (ID:${id})`,
      error: (err, id) => `Tarife silinemedi (ID:${id}): ${err.error.message}`,
    },
  });
}

// =====================
// Mutations - PriceListItem
// =====================

/**
 * PriceListItem oluşturma
 * 
 * @example
 * const createMutation = useCreatePriceListItem();
 * createMutation.mutate({
 *   PriceListId: 123,
 *   HizmetKodu: 'TARAMA-001',
 *   HizmetAdi: 'Römork Tarama',
 *   BirimFiyat: 250.00
 * });
 */
export function useCreatePriceListItem() {
  const queryClient = useQueryClient();
  return useToastMutation<PriceListItem, CreatePriceListItemPayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<PriceListItem>('/tarife/price-list-item', payload);
      if (!response.success) throw response;
      return response.data as PriceListItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: priceListKeys.items(data.PriceListId) });
      queryClient.invalidateQueries({ queryKey: priceListItemKeys.all() });
    },
    messages: {
      success: (data) => `Tarife kalemi eklendi: ${data.HizmetKodu}`,
      error: (err) => `Tarife kalemi eklenemedi: ${err.error.message}`,
    },
  });
}

/**
 * PriceListItem güncelleme
 * 
 * @example
 * const updateMutation = useUpdatePriceListItem();
 * updateMutation.mutate({ id: 456, data: { BirimFiyat: 300.00 } });
 */
export function useUpdatePriceListItem() {
  const queryClient = useQueryClient();
  return useToastMutation<PriceListItem, { id: number; data: UpdatePriceListItemPayload }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<PriceListItem>(`/tarife/price-list-item/${id}`, data);
      if (!response.success) throw response;
      return response.data as PriceListItem;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: priceListItemKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: priceListKeys.items(data.PriceListId) });
      queryClient.invalidateQueries({ queryKey: priceListItemKeys.all() });
    },
    messages: {
      success: (data) => `Tarife kalemi güncellendi: ${data.HizmetKodu}`,
      error: (err, vars) => `Tarife kalemi güncellenemedi (ID:${vars.id}): ${err.error.message}`,
    },
  });
}

/**
 * PriceListItem silme
 * 
 * @example
 * const deleteMutation = useDeletePriceListItem();
 * deleteMutation.mutate({ itemId: 456, priceListId: 123 });
 */
export function useDeletePriceListItem() {
  const queryClient = useQueryClient();
  return useToastMutation<void, { itemId: number; priceListId: number }>({
    mutationFn: async ({ itemId }) => {
      const response = await apiClient.delete<void>(`/tarife/price-list-item/${itemId}`);
      if (!response.success) throw response;
      return response.data as void;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: priceListItemKeys.detail(variables.itemId) });
      queryClient.invalidateQueries({ queryKey: priceListKeys.items(variables.priceListId) });
      queryClient.invalidateQueries({ queryKey: priceListItemKeys.all() });
    },
    messages: {
      success: (_ , vars) => `Tarife kalemi silindi (ID:${vars.itemId})`,
      error: (err, vars) => `Tarife kalemi silinemedi (ID:${vars.itemId}): ${err.error.message}`,
    },
  });
}
