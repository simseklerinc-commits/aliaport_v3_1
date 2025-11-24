/**
 * React Query Hooks - Sefer (MbTrip) Module
 * 
 * Motorbot sefer kayıtları için query/mutation hooks
 * Çıkış/dönüş takibi, faturalandırma, istatistikler
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createQueryKey, getQueryOptions } from '../../cache/queryClient';
import { seferApi } from '@/lib/api';
import type { MbTrip, MbTripWithDetails, PaginatedResponse } from '@/lib/types/database';
import type { ErrorResponse } from '../../types/responses';

// =====================
// Query Keys
// =====================

export const seferKeys = {
  all: () => createQueryKey('SEFER', 'all'),
  lists: () => createQueryKey('SEFER', 'list'),
  list: (params: Record<string, unknown>) => createQueryKey('SEFER', 'list', params),
  detail: (id: number) => createQueryKey('SEFER', 'detail', { id }),
  detailWithRelations: (id: number) => createQueryKey('SEFER', 'detail-relations', { id }),
  byMotorbot: (motorbotId: number) => createQueryKey('SEFER', 'by-motorbot', { motorbotId }),
  active: () => createQueryKey('SEFER', 'active'),
  uninvoiced: () => createQueryKey('SEFER', 'uninvoiced'),
  stats: (params?: Record<string, unknown>) => createQueryKey('SEFER', 'stats', params),
};

// =====================
// Queries
// =====================

/**
 * Sefer listesi - paginated
 */
export function useSeferList(params?: Parameters<typeof seferApi.getAll>[0]) {
  return useQuery<PaginatedResponse<MbTrip>, ErrorResponse>({
    queryKey: seferKeys.list(params || {}),
    queryFn: async ({ signal }) => {
      const response = await seferApi.getAll(params, { signal });
      return response; // response zaten PaginatedResponse<MbTrip>
    },
    ...getQueryOptions('SEFER'),
  });
}

/**
 * Tek sefer detayı
 */
export function useSeferDetail(id: number, enabled: boolean = true) {
  return useQuery<MbTrip, ErrorResponse>({
    queryKey: seferKeys.detail(id),
    queryFn: async ({ signal }) => {
      const response = await seferApi.getById(id, { signal });
      return response;
    },
    enabled: enabled && id > 0,
    ...getQueryOptions('SEFER'),
  });
}

/**
 * Sefer + ilişkili veriler (motorbot, cari)
 */
export function useSeferWithDetails(id: number, enabled: boolean = true) {
  return useQuery<MbTripWithDetails, ErrorResponse>({
    queryKey: seferKeys.detailWithRelations(id),
    queryFn: async ({ signal }) => {
      const response = await seferApi.getWithDetails(id, { signal });
      return response;
    },
    enabled: enabled && id > 0,
    ...getQueryOptions('SEFER'),
  });
}

/**
 * Motorbot'a ait seferler
 */
export function useSeferByMotorbot(motorbotId: number, enabled: boolean = true) {
  return useQuery<MbTrip[], ErrorResponse>({
    queryKey: seferKeys.byMotorbot(motorbotId),
    queryFn: async ({ signal }) => {
      const response = await seferApi.getByMotorbot(motorbotId, { signal });
      return response;
    },
    enabled: enabled && motorbotId > 0,
    ...getQueryOptions('SEFER'),
  });
}

/**
 * Aktif seferler (denizde olanlar)
 */
export function useActiveSeferler() {
  return useQuery<MbTrip[], ErrorResponse>({
    queryKey: seferKeys.active(),
    queryFn: async ({ signal }) => {
      const response = await seferApi.getActiveDepartures({ signal });
      return response;
    },
    refetchInterval: 60000,
    ...getQueryOptions('SEFER'),
  });
}

/**
 * Faturalanmamış seferler
 */
export function useUninvoicedSeferler(params?: Parameters<typeof seferApi.getUninvoiced>[0]) {
  return useQuery<MbTrip[], ErrorResponse>({
    queryKey: seferKeys.uninvoiced(),
    queryFn: async ({ signal }) => {
      const response = await seferApi.getUninvoiced(params, { signal });
      return response;
    },
    ...getQueryOptions('SEFER'),
  });
}

/**
 * Sefer istatistikleri
 */
export function useSeferStats(params?: Parameters<typeof seferApi.getStats>[0]) {
  return useQuery({
    queryKey: seferKeys.stats(params || {}),
    queryFn: async ({ signal }) => {
      const response = await seferApi.getStats(params, { signal });
      return response;
    },
    ...getQueryOptions('SEFER'),
  });
}

// =====================
// Mutations
// =====================

/**
 * Sefer çıkış kaydı oluştur
 */
export function useCreateDeparture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof seferApi.createDeparture>[0]) => 
      seferApi.createDeparture(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: seferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: seferKeys.active() });
      queryClient.invalidateQueries({ queryKey: seferKeys.uninvoiced() });
      if (data.motorbot_id) {
        queryClient.invalidateQueries({ queryKey: seferKeys.byMotorbot(data.motorbot_id) });
      }
    },
  });
}

/**
 * Sefer dönüş kaydı
 */
export function useRecordReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof seferApi.recordReturn>[1] }) => 
      seferApi.recordReturn(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: seferKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: seferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: seferKeys.active() });
      if (data.motorbot_id) {
        queryClient.invalidateQueries({ queryKey: seferKeys.byMotorbot(data.motorbot_id) });
      }
    },
  });
}

/**
 * Sefer güncelle
 */
export function useUpdateSefer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MbTrip> }) => 
      seferApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: seferKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: seferKeys.lists() });
      if (data.motorbot_id) {
        queryClient.invalidateQueries({ queryKey: seferKeys.byMotorbot(data.motorbot_id) });
      }
    },
  });
}

/**
 * Sefer sil
 */
export function useDeleteSefer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => seferApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: seferKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: seferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: seferKeys.active() });
    },
  });
}

/**
 * Seferleri faturalandı işaretle
 */
export function useMarkSeferAsInvoiced() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { tripIds: number[]; invoiceId: number; invoiceDate: string }) => 
      seferApi.markAsInvoiced(params.tripIds, params.invoiceId, params.invoiceDate),
    onSuccess: (_, variables) => {
      // Her sefer için invalidate
      variables.tripIds.forEach(id => {
        queryClient.invalidateQueries({ queryKey: seferKeys.detail(id) });
      });
      queryClient.invalidateQueries({ queryKey: seferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: seferKeys.uninvoiced() });
    },
  });
}
