/**
 * useBarinmaQueries - React Query Hooks for Barınma (Accommodation Contracts)
 * 
 * CRUD Operations:
 * - useBarinmaList (paginated, with filters)
 * - useBarinmaDetail (single contract by ID)
 * - useActiveBarinmaByMotorbot (active contracts for specific motorbot)
 * - useCreateBarinma (create new contract + toast)
 * - useUpdateBarinma (update contract + toast)
 * - useEndBarinma (end contract by setting EndDate + toast)
 * - useDeleteBarinma (delete contract + toast)
 * 
 * Query Keys: barinmaKeys
 * Cache Time: 30 minutes (real-time contracts)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/core/api/client';
import { getQueryOptions } from '@/core/cache/queryClient';
import { useToastMutation } from '@/core/hooks/useToastMutation';
import type { BarinmaContract, BarinmaContractCreate, BarinmaContractUpdate } from '@/shared/types/barinma';
import type { ApiResponse, PaginatedApiResponse } from '@/shared/types/common.types';

// ==================== Query Keys ====================
export const barinmaKeys = {
  all: ['barinma'] as const,
  lists: () => [...barinmaKeys.all, 'list'] as const,
  list: (filters?: { page?: number; pageSize?: number; motorbot_id?: number; cari_id?: number; is_active?: boolean }) =>
    [...barinmaKeys.lists(), filters] as const,
  details: () => [...barinmaKeys.all, 'detail'] as const,
  detail: (id: number) => [...barinmaKeys.details(), id] as const,
  active: (motorbotId: number) => [...barinmaKeys.all, 'active', motorbotId] as const,
};

// ==================== Query Hooks ====================

/**
 * Get paginated list of accommodation contracts
 */
export function useBarinmaList(params?: {
  page?: number;
  pageSize?: number;
  motorbotId?: number;
  cariId?: number;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: barinmaKeys.list(params),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedApiResponse<BarinmaContract>>('/api/barinma', {
        params: {
          page: params?.page || 1,
          page_size: params?.pageSize || 20,
          motorbot_id: params?.motorbotId,
          cari_id: params?.cariId,
          is_active: params?.isActive,
        },
      });
      if (!response.success) throw new Error(response.error?.message || 'Failed to fetch barınma list');
      return response;
    },
    ...getQueryOptions('BARINMA'),
  });
}

/**
 * Get single contract by ID
 */
export function useBarinmaDetail(id: number) {
  return useQuery({
    queryKey: barinmaKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<BarinmaContract>>(`/api/barinma/${id}`);
      if (!response.success) throw new Error(response.error?.message || 'Failed to fetch barınma detail');
      return response.data!;
    },
    ...getQueryOptions('BARINMA'),
    enabled: !!id && id > 0,
  });
}

/**
 * Get active contracts for specific motorbot
 */
export function useActiveBarinmaByMotorbot(motorbotId: number) {
  return useQuery({
    queryKey: barinmaKeys.active(motorbotId),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<BarinmaContract[]>>(`/api/barinma/motorbot/${motorbotId}/active`);
      if (!response.success) throw new Error(response.error?.message || 'Failed to fetch active barınma');
      return response.data!;
    },
    ...getQueryOptions('BARINMA'),
    enabled: !!motorbotId && motorbotId > 0,
  });
}

// ==================== Mutation Hooks ====================

/**
 * Create new accommodation contract
 */
export function useCreateBarinma() {
  const queryClient = useQueryClient();

  return useToastMutation<BarinmaContract, BarinmaContractCreate>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<BarinmaContract>>('/api/barinma', data);
      if (!response.success) throw new Error(response.error?.message || 'Failed to create barınma');
      return response.data as BarinmaContract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: barinmaKeys.lists() });
    },
    messages: {
      success: (data) => `Barınma kontratı oluşturuldu: ${data.ContractNumber}`,
      error: 'Barınma kontratı oluşturulamadı',
    },
  });
}

/**
 * Update accommodation contract
 */
export function useUpdateBarinma() {
  const queryClient = useQueryClient();

  return useToastMutation<BarinmaContract, BarinmaContractUpdate>({
    mutationFn: async (data) => {
      const response = await apiClient.put<ApiResponse<BarinmaContract>>(`/api/barinma/${data.Id}`, data);
      if (!response.success) throw new Error(response.error?.message || 'Failed to update barınma');
      return response.data as BarinmaContract;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: barinmaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: barinmaKeys.detail(data.Id) });
      if (data.MotorbotId) {
        queryClient.invalidateQueries({ queryKey: barinmaKeys.active(data.MotorbotId) });
      }
    },
    messages: {
      success: (data) => `Barınma kontratı güncellendi: ${data.ContractNumber}`,
      error: 'Barınma kontratı güncellenemedi',
    },
  });
}

/**
 * End accommodation contract (set EndDate to today)
 */
export function useEndBarinma() {
  const queryClient = useQueryClient();

  return useToastMutation<BarinmaContract, { id: number; endDate: string }>({
    mutationFn: async ({ id, endDate }) => {
      const response = await apiClient.put<ApiResponse<BarinmaContract>>(`/api/barinma/${id}`, {
        Id: id,
        EndDate: endDate,
        IsActive: false,
      });
      if (!response.success) throw new Error(response.error?.message || 'Failed to end barınma contract');
      return response.data as BarinmaContract;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: barinmaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: barinmaKeys.detail(data.Id) });
      if (data.MotorbotId) {
        queryClient.invalidateQueries({ queryKey: barinmaKeys.active(data.MotorbotId) });
      }
    },
    messages: {
      success: (data) => `Barınma kontratı sonlandırıldı: ${data.ContractNumber}`,
      error: 'Barınma kontratı sonlandırılamadı',
    },
  });
}

/**
 * Delete accommodation contract
 */
export function useDeleteBarinma() {
  const queryClient = useQueryClient();

  return useToastMutation<void, number>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<ApiResponse<void>>(`/api/barinma/${id}`);
      if (!response.success) throw new Error(response.error?.message || 'Failed to delete barınma');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: barinmaKeys.lists() });
    },
    messages: {
      success: 'Barınma kontratı silindi',
      error: 'Barınma kontratı silinemedi',
    },
  });
}
