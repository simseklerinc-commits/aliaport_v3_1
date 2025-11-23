import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { getQueryOptions, createQueryKey } from '../../cache/queryClient';
import type { PaginatedApiResponse, PaginationMeta } from '../../../shared/types/common.types';
import type { ErrorResponse } from '../../types/responses';

export interface PaginatedQueryResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

interface UsePaginatedQueryParams<TFilters extends Record<string, unknown>, TItem> {
  module: string; // Cache policy key (e.g. 'CARI')
  path: string; // API path (e.g. '/cari')
  filters?: TFilters; // includes page/page_size
  enabled?: boolean;
}

export function usePaginatedQuery<TItem, TFilters extends Record<string, unknown>>({
  module,
  path,
  filters = {} as TFilters,
  enabled = true,
}: UsePaginatedQueryParams<TFilters, TItem>) {
  return useQuery<PaginatedQueryResult<TItem>, ErrorResponse>({
    queryKey: createQueryKey(module, 'list', filters),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedApiResponse<TItem>>(path, filters);
      if (!response.success) throw response;
      return { items: response.data, pagination: response.pagination };
    },
    enabled,
    ...getQueryOptions(module),
  });
}

// Convenience specialized hook for Cari using the generic.
// Example usage: const { data } = useCariListPaginated({ page: 1, page_size: 20 });
import type { Cari } from '../../../shared/types/cari';

export function useCariListPaginated(
  filters: { page?: number; page_size?: number; search?: string; cari_tip?: string } = {}
) {
  return usePaginatedQuery<Cari, { page?: number; page_size?: number; search?: string; cari_tip?: string }>({
    module: 'CARI',
    path: '/cari',
    filters,
  });
}