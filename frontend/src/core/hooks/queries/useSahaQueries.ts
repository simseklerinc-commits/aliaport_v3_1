/**
 * React Query Hooks - Saha (WorkLog) Module
 * 
 * Saha personeli iş kayıtları ve zaman takibi query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createQueryKey, getQueryOptions } from '../../cache/queryClient';
import { workLogApi } from '@/lib/api/saha';
import type { WorkLog, CreateWorkLogPayload, WorkLogStats } from '@/lib/api/saha';
import type { ErrorResponse } from '../../types/responses';

// =====================
// Query Keys
// =====================

export const workLogKeys = {
  all: () => createQueryKey('WORK_LOG', 'all'),
  lists: () => createQueryKey('WORK_LOG', 'list'),
  list: (params: Record<string, unknown>) => createQueryKey('WORK_LOG', 'list', params),
  detail: (id: number) => createQueryKey('WORK_LOG', 'detail', { id }),
  byWorkOrder: (workOrderId: number) => createQueryKey('WORK_LOG', 'by-wo', { workOrderId }),
  bySefer: (seferId: number) => createQueryKey('WORK_LOG', 'by-sefer', { seferId }),
  byPersonnel: (personnelName: string) => createQueryKey('WORK_LOG', 'by-personnel', { personnelName }),
  today: () => createQueryKey('WORK_LOG', 'today'),
  pending: () => createQueryKey('WORK_LOG', 'pending'),
  stats: (params?: Record<string, unknown>) => createQueryKey('WORK_LOG', 'stats', params),
  personnelList: () => createQueryKey('WORK_LOG', 'personnel-list'),
};

// =====================
// Queries
// =====================

/**
 * Work log listesi
 */
export function useWorkLogList(params?: Parameters<typeof workLogApi.getAll>[0]) {
  return useQuery<{ items: WorkLog[]; total: number }, ErrorResponse>({
    queryKey: workLogKeys.list(params || {}),
    queryFn: async () => {
      const response = await workLogApi.getAll(params);
      return response.data;
    },
    ...getQueryOptions('WORK_LOG'),
  });
}

/**
 * Tek work log detayı
 */
export function useWorkLogDetail(id: number, enabled: boolean = true) {
  return useQuery<WorkLog, ErrorResponse>({
    queryKey: workLogKeys.detail(id),
    queryFn: async () => {
      const response = await workLogApi.getById(id);
      return response.data;
    },
    enabled: enabled && id > 0,
    ...getQueryOptions('WORK_LOG'),
  });
}

/**
 * İş emrine ait work loglar
 */
export function useWorkLogByWorkOrder(workOrderId: number, enabled: boolean = true) {
  return useQuery<WorkLog[], ErrorResponse>({
    queryKey: workLogKeys.byWorkOrder(workOrderId),
    queryFn: async () => {
      const response = await workLogApi.getByWorkOrder(workOrderId);
      return response.data;
    },
    enabled: enabled && workOrderId > 0,
    ...getQueryOptions('WORK_LOG'),
  });
}

/**
 * Sefer'e ait work loglar
 */
export function useWorkLogBySefer(seferId: number, enabled: boolean = true) {
  return useQuery<WorkLog[], ErrorResponse>({
    queryKey: workLogKeys.bySefer(seferId),
    queryFn: async () => {
      const response = await workLogApi.getBySefer(seferId);
      return response.data;
    },
    enabled: enabled && seferId > 0,
    ...getQueryOptions('WORK_LOG'),
  });
}

/**
 * Personele ait work loglar
 */
export function useWorkLogByPersonnel(
  personnelName: string,
  params?: Parameters<typeof workLogApi.getByPersonnel>[1],
  enabled: boolean = true
) {
  return useQuery<WorkLog[], ErrorResponse>({
    queryKey: workLogKeys.byPersonnel(personnelName),
    queryFn: async () => {
      const response = await workLogApi.getByPersonnel(personnelName, params);
      return response.data;
    },
    enabled: enabled && !!personnelName,
    ...getQueryOptions('WORK_LOG'),
  });
}

/**
 * Bugünün work logları
 */
export function useTodayWorkLogs() {
  return useQuery<WorkLog[], ErrorResponse>({
    queryKey: workLogKeys.today(),
    queryFn: async () => {
      const response = await workLogApi.getToday();
      return response.data;
    },
    refetchInterval: 60000, // Her 1 dakikada güncelle
    ...getQueryOptions('WORK_LOG'),
  });
}

/**
 * Onay bekleyen work loglar
 */
export function usePendingWorkLogs() {
  return useQuery<WorkLog[], ErrorResponse>({
    queryKey: workLogKeys.pending(),
    queryFn: async () => {
      const response = await workLogApi.getPending();
      return response.data;
    },
    refetchInterval: 120000, // Her 2 dakikada güncelle
    ...getQueryOptions('WORK_LOG'),
  });
}

/**
 * Work log istatistikleri
 */
export function useWorkLogStats(params?: Parameters<typeof workLogApi.getStats>[0]) {
  return useQuery<WorkLogStats, ErrorResponse>({
    queryKey: workLogKeys.stats(params || {}),
    queryFn: async () => {
      const response = await workLogApi.getStats(params);
      return response.data;
    },
    ...getQueryOptions('WORK_LOG'),
  });
}

/**
 * Personel listesi
 */
export function usePersonnelList() {
  return useQuery<string[], ErrorResponse>({
    queryKey: workLogKeys.personnelList(),
    queryFn: async () => {
      const response = await workLogApi.getPersonnelList();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
    ...getQueryOptions('WORK_LOG'),
  });
}

// =====================
// Mutations
// =====================

/**
 * Yeni work log oluştur
 */
export function useCreateWorkLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkLogPayload) =>
      workLogApi.create(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workLogKeys.today() });
      queryClient.invalidateQueries({ queryKey: workLogKeys.pending() });
      if (data.work_order_id) {
        queryClient.invalidateQueries({ queryKey: workLogKeys.byWorkOrder(data.work_order_id) });
      }
      if (data.sefer_id) {
        queryClient.invalidateQueries({ queryKey: workLogKeys.bySefer(data.sefer_id) });
      }
      if (data.personnel_name) {
        queryClient.invalidateQueries({ queryKey: workLogKeys.byPersonnel(data.personnel_name) });
      }
    },
  });
}

/**
 * Work log güncelle
 */
export function useUpdateWorkLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WorkLog> }) =>
      workLogApi.update(id, data).then(res => res.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: workLogKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: workLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workLogKeys.today() });
    },
  });
}

/**
 * Bitiş zamanı kaydet
 */
export function useRecordWorkLogEnd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, timeEnd }: { id: number; timeEnd: string }) =>
      workLogApi.recordEnd(id, timeEnd).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workLogKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: workLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workLogKeys.today() });
    },
  });
}

/**
 * Work log onayla/reddet
 */
export function useApproveWorkLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approved, approvedBy, notes }: { 
      id: number; 
      approved: boolean; 
      approvedBy: string;
      notes?: string;
    }) =>
      workLogApi.approve(id, approved, approvedBy, notes).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workLogKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: workLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workLogKeys.pending() });
    },
  });
}

/**
 * Toplu onay
 */
export function useApproveMultipleWorkLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, approvedBy }: { ids: number[]; approvedBy: string }) =>
      workLogApi.approveMultiple(ids, approvedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workLogKeys.pending() });
    },
  });
}

/**
 * Work log sil
 */
export function useDeleteWorkLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => workLogApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: workLogKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: workLogKeys.lists() });
    },
  });
}
