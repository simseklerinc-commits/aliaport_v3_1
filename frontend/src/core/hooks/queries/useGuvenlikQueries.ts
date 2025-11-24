/**
 * React Query Hooks - Güvenlik (GateLog) Module
 * 
 * Kapı giriş/çıkış kayıtları ve checklist query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createQueryKey, getQueryOptions } from '../../cache/queryClient';
import { gateLogApi, gateChecklistApi } from '@/lib/api/guvenlik';
import type { GateLog, GateChecklistItem, CreateGateLogPayload } from '@/lib/api/guvenlik';
import type { ErrorResponse } from '../../types/responses';

// =====================
// Query Keys
// =====================

export const gateLogKeys = {
  all: () => createQueryKey('GATE_LOG', 'all'),
  lists: () => createQueryKey('GATE_LOG', 'list'),
  list: (params: Record<string, unknown>) => createQueryKey('GATE_LOG', 'list', params),
  detail: (id: number) => createQueryKey('GATE_LOG', 'detail', { id }),
  byWorkOrder: (workOrderId: number) => createQueryKey('GATE_LOG', 'by-wo', { workOrderId }),
  byMotorbot: (motorbotId: number) => createQueryKey('GATE_LOG', 'by-motorbot', { motorbotId }),
  today: () => createQueryKey('GATE_LOG', 'today'),
};

export const checklistKeys = {
  all: () => createQueryKey('GATE_CHECKLIST', 'all'),
  lists: () => createQueryKey('GATE_CHECKLIST', 'list'),
  detail: (id: number) => createQueryKey('GATE_CHECKLIST', 'detail', { id }),
  byType: (woType: string) => createQueryKey('GATE_CHECKLIST', 'by-type', { woType }),
};

// =====================
// Queries - Gate Log
// =====================

/**
 * Gate log listesi
 */
export function useGateLogList(params?: Parameters<typeof gateLogApi.getAll>[0]) {
  return useQuery<{ items: GateLog[]; total: number }, ErrorResponse>({
    queryKey: gateLogKeys.list(params || {}),
    queryFn: async () => {
      const response = await gateLogApi.getAll(params);
      return response.data;
    },
    ...getQueryOptions('GATE_LOG'),
  });
}

/**
 * Tek gate log detayı
 */
export function useGateLogDetail(id: number, enabled: boolean = true) {
  return useQuery<GateLog, ErrorResponse>({
    queryKey: gateLogKeys.detail(id),
    queryFn: async () => {
      const response = await gateLogApi.getById(id);
      return response.data;
    },
    enabled: enabled && id > 0,
    ...getQueryOptions('GATE_LOG'),
  });
}

/**
 * İş emrine ait gate loglar
 */
export function useGateLogByWorkOrder(workOrderId: number, enabled: boolean = true) {
  return useQuery<GateLog[], ErrorResponse>({
    queryKey: gateLogKeys.byWorkOrder(workOrderId),
    queryFn: async () => {
      const response = await gateLogApi.getByWorkOrder(workOrderId);
      return response.data;
    },
    enabled: enabled && workOrderId > 0,
    ...getQueryOptions('GATE_LOG'),
  });
}

/**
 * Bugünün gate logları
 */
export function useTodayGateLogs() {
  return useQuery<GateLog[], ErrorResponse>({
    queryKey: gateLogKeys.today(),
    queryFn: async () => {
      const response = await gateLogApi.getToday();
      return response.data;
    },
    refetchInterval: 60000, // Her 1 dakikada güncelle
    ...getQueryOptions('GATE_LOG'),
  });
}

// =====================
// Queries - Checklist
// =====================

/**
 * Tüm checklist itemları
 */
export function useGateChecklistItems(woType?: string) {
  return useQuery<GateChecklistItem[], ErrorResponse>({
    queryKey: woType ? checklistKeys.byType(woType) : checklistKeys.all(),
    queryFn: async () => {
      const response = await gateChecklistApi.getAll(woType);
      return response.data;
    },
    ...getQueryOptions('GATE_CHECKLIST'),
  });
}

/**
 * İş emri tipine göre checklist
 */
export function useChecklistByType(woType: string, enabled: boolean = true) {
  return useQuery<GateChecklistItem[], ErrorResponse>({
    queryKey: checklistKeys.byType(woType),
    queryFn: async () => {
      const response = await gateChecklistApi.getByType(woType);
      return response.data;
    },
    enabled: enabled && !!woType,
    ...getQueryOptions('GATE_CHECKLIST'),
  });
}

// =====================
// Mutations - Gate Log
// =====================

/**
 * Yeni gate log oluştur
 */
export function useCreateGateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGateLogPayload) =>
      gateLogApi.create(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gateLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gateLogKeys.today() });
      if (data.work_order_id) {
        queryClient.invalidateQueries({ queryKey: gateLogKeys.byWorkOrder(data.work_order_id) });
      }
      if (data.motorbot_id) {
        queryClient.invalidateQueries({ queryKey: gateLogKeys.byMotorbot(data.motorbot_id) });
      }
    },
  });
}

/**
 * Gate log güncelle
 */
export function useUpdateGateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<GateLog> }) =>
      gateLogApi.update(id, data).then(res => res.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: gateLogKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: gateLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gateLogKeys.today() });
    },
  });
}

/**
 * Gate log onayla/reddet
 */
export function useApproveGateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approved, notes }: { id: number; approved: boolean; notes?: string }) =>
      gateLogApi.approve(id, approved, notes).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gateLogKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: gateLogKeys.lists() });
    },
  });
}

/**
 * Gate log sil
 */
export function useDeleteGateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => gateLogApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: gateLogKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: gateLogKeys.lists() });
    },
  });
}

// =====================
// Mutations - Checklist
// =====================

/**
 * Checklist item oluştur
 */
export function useCreateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<GateChecklistItem, 'id' | 'created_at' | 'updated_at'>) =>
      gateChecklistApi.create(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.all() });
      queryClient.invalidateQueries({ queryKey: checklistKeys.byType(data.wo_type) });
    },
  });
}

/**
 * Checklist item güncelle
 */
export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<GateChecklistItem> }) =>
      gateChecklistApi.update(id, data).then(res => res.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: checklistKeys.all() });
      if (data.wo_type) {
        queryClient.invalidateQueries({ queryKey: checklistKeys.byType(data.wo_type) });
      }
    },
  });
}

/**
 * Checklist item sil
 */
export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => gateChecklistApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.all() });
    },
  });
}
