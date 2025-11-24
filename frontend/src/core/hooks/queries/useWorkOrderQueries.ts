/**
 * React Query Hooks - WorkOrder (İş Emri) Module
 * 
 * useQuery ve useMutation wrapper'ları - WorkOrder + WorkOrderItem dual entity CRUD için cache yönetimi.
 * İş emri durum makinesi (DRAFT → SUBMITTED → APPROVED → SAHADA → TAMAMLANDI → FATURALANDI → KAPANDI)
 * 
 * @see core/cache/queryClient.ts - Cache politikaları ve QueryClient config
 * @see core/api/client.ts - Base API client
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createQueryKey, getQueryOptions } from '../../cache/queryClient';
import { apiClient } from '../../api/client';
import { useToastMutation } from '@/core/hooks/useToastMutation';
import type {
  WorkOrder,
  CreateWorkOrderPayload,
  UpdateWorkOrderPayload,
  WorkOrderStatusChange,
  WorkOrderStats,
  WorkOrderItem,
  CreateWorkOrderItemPayload,
  UpdateWorkOrderItemPayload,
  WorkOrderStatus,
} from '../../../shared/types/workorder';
import type { ErrorResponse } from '../../types/responses';

// =====================
// Query Keys - WorkOrder
// =====================

/**
 * WorkOrder query keys factory
 * 
 * @example
 * workOrderKeys.all()          // ['workorder']
 * workOrderKeys.lists()        // ['workorder', 'list']
 * workOrderKeys.list(params)   // ['workorder', 'list', { status: 'SAHADA' }]
 * workOrderKeys.detail(id)     // ['workorder', 'detail', { id: 1 }]
 * workOrderKeys.byWoNumber(num) // ['workorder', 'by-wo-number', { wo_number: 'WO-2025-001' }]
 * workOrderKeys.items(woId)    // ['workorder', 'items', { workOrderId: 1 }]
 * workOrderKeys.stats()        // ['workorder', 'stats']
 */
export const workOrderKeys = {
  all: () => createQueryKey('WORKORDER', 'all'),
  lists: () => createQueryKey('WORKORDER', 'list'),
  list: (params: Record<string, unknown>) => createQueryKey('WORKORDER', 'list', params),
  detail: (id: number) => createQueryKey('WORKORDER', 'detail', { id }),
  byWoNumber: (woNumber: string) => createQueryKey('WORKORDER', 'by-wo-number', { wo_number: woNumber }),
  items: (workOrderId: number) => createQueryKey('WORKORDER', 'items', { workOrderId }),
  stats: () => createQueryKey('WORKORDER', 'stats'),
};

// =====================
// Query Keys - WorkOrderItem
// =====================

/**
 * WorkOrderItem query keys factory
 * 
 * @example
 * workOrderItemKeys.all()       // ['workorder-item']
 * workOrderItemKeys.lists()     // ['workorder-item', 'list']
 * workOrderItemKeys.list(params) // ['workorder-item', 'list', { is_invoiced: false }]
 * workOrderItemKeys.detail(id)  // ['workorder-item', 'detail', { id: 1 }]
 */
export const workOrderItemKeys = {
  all: () => createQueryKey('WORKORDER', 'item'),
  lists: () => createQueryKey('WORKORDER', 'item-list'),
  list: (params: Record<string, unknown>) => createQueryKey('WORKORDER', 'item-list', params),
  detail: (id: number) => createQueryKey('WORKORDER', 'item-detail', { id }),
};

// =====================
// Queries - WorkOrder
// =====================

/**
 * WorkOrder listesi sorgulama - paginated
 * 
 * @param params - Pagination ve filtreleme parametreleri
 * @returns useQuery result with WorkOrder[]
 * 
 * @example
 * const { data } = useWorkOrderList({ status: 'SAHADA' });
 * const { data } = useWorkOrderList({ cari_id: 123, type: 'HIZMET' });
 * 
 * // Cache: 30 saniye fresh (WORKORDER policy - sık değişir)
 */
export function useWorkOrderList(params: {
  page?: number;
  page_size?: number;
  search?: string;
  status?: WorkOrderStatus;
  cari_id?: number;
  type?: string;
  priority?: string;
  date_from?: string; // ISO8601 date
  date_to?: string; // ISO8601 date
} = {}) {
  return useQuery<WorkOrder[], ErrorResponse>({
    queryKey: workOrderKeys.list(params),
    queryFn: async (): Promise<WorkOrder[]> => {
      const response = await apiClient.get<WorkOrder[]>('/isemri', params);
      if (!response.success) {
        throw response;
      }
      return response.data as WorkOrder[];
    },
    ...getQueryOptions('WORKORDER'),
  });
}

/**
 * WorkOrder detay sorgulama
 * 
 * @param id - WorkOrder ID
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with single WorkOrder
 * 
 * @example
 * const { data: workOrder } = useWorkOrderDetail(123);
 */
export function useWorkOrderDetail(id: number, options?: { enabled?: boolean }) {
  return useQuery<WorkOrder, ErrorResponse>({
    queryKey: workOrderKeys.detail(id),
    queryFn: async (): Promise<WorkOrder> => {
      const response = await apiClient.get<WorkOrder>(`/isemri/${id}`);
      if (!response.success) {
        throw response;
      }
      return response.data as WorkOrder;
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('WORKORDER'),
  });
}

/**
 * WorkOrder WO numarası ile sorgulama
 * 
 * @param woNumber - WorkOrder number (örn: 'WO-2025-001')
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with single WorkOrder
 * 
 * @example
 * const { data: workOrder } = useWorkOrderByWoNumber('WO-2025-001');
 */
export function useWorkOrderByWoNumber(woNumber: string, options?: { enabled?: boolean }) {
  return useQuery<WorkOrder, ErrorResponse>({
    queryKey: workOrderKeys.byWoNumber(woNumber),
    queryFn: async (): Promise<WorkOrder> => {
      const response = await apiClient.get<WorkOrder>(`/isemri/by-wo-number/${woNumber}`);
      if (!response.success) {
        throw response;
      }
      return response.data as WorkOrder;
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('WORKORDER'),
  });
}

/**
 * WorkOrder istatistikleri
 * 
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with WorkOrderStats
 * 
 * @example
 * const { data: stats } = useWorkOrderStats();
 */
export function useWorkOrderStats(options?: { enabled?: boolean }) {
  return useQuery<WorkOrderStats, ErrorResponse>({
    queryKey: workOrderKeys.stats(),
    queryFn: async (): Promise<WorkOrderStats> => {
      const response = await apiClient.get<WorkOrderStats>('/isemri/stats');
      if (!response.success) {
        throw response;
      }
      return response.data as WorkOrderStats;
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('WORKORDER'),
  });
}

// =====================
// Mutations - WorkOrder
// =====================

/**
 * WorkOrder oluşturma mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const createMutation = useCreateWorkOrder();
 * 
 * createMutation.mutate({
 *   CariId: 123,
 *   CariCode: 'C-001',
 *   CariTitle: 'Test Müşteri',
 *   Type: 'HIZMET',
 *   Subject: 'Bakım İşi',
 *   Priority: 'HIGH'
 * });
 * 
 * // Cache invalidation: Tüm iş emri listelerini + istatistikleri invalidate eder
 */
export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useToastMutation<WorkOrder, CreateWorkOrderPayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<WorkOrder>('/isemri', payload);
      if (!response.success) {
        throw response;
      }
      return response.data as WorkOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.stats() });
    },
    messages: {
      success: (data) => `İş emri oluşturuldu: ${data.WoNumber}`,
      error: 'İş emri oluşturulurken hata oluştu',
    },
  });
}

/**
 * WorkOrder güncelleme mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const updateMutation = useUpdateWorkOrder();
 * 
 * updateMutation.mutate({
 *   id: 123,
 *   data: { Priority: 'URGENT', Notes: 'Acil müdahale' }
 * });
 * 
 * // Cache invalidation: İlgili iş emri detay + WO number + items + tüm listeler + stats
 */
export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();

  return useToastMutation<WorkOrder, { id: number; data: UpdateWorkOrderPayload }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<WorkOrder>(`/isemri/${id}`, data);
      if (!response.success) {
        throw response;
      }
      return response.data as WorkOrder;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(variables.id) });
      if (data.WoNumber) {
        queryClient.invalidateQueries({ queryKey: workOrderKeys.byWoNumber(data.WoNumber) });
      }
      queryClient.invalidateQueries({ queryKey: workOrderKeys.items(variables.id) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.stats() });
    },
    messages: {
      success: (data) => `İş emri güncellendi: ${data.WoNumber}`,
      error: 'İş emri güncellenirken hata oluştu',
    },
  });
}

/**
 * WorkOrder silme mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const deleteMutation = useDeleteWorkOrder();
 * 
 * deleteMutation.mutate(123, {
 *   onSuccess: () => console.log('Deleted'),
 * });
 * 
 * // Cache invalidation: İlgili iş emri detay + items + tüm listeler + stats
 */
export function useDeleteWorkOrder() {
  const queryClient = useQueryClient();

  return useToastMutation<void, number>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<void>(`/isemri/${id}`);
      if (!response.success) {
        throw response;
      }
      return response.data as void;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.items(id) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.stats() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all() });
    },
    messages: {
      success: 'İş emri silindi',
      error: 'İş emri silinirken hata oluştu',
    },
  });
}

/**
 * WorkOrder durum değiştirme (State Machine Transition)
 * 
 * İş emri durum makinesi:
 * DRAFT → SUBMITTED → APPROVED → SAHADA → TAMAMLANDI → FATURALANDI → KAPANDI
 * 
 * @returns useMutation result
 * 
 * @example
 * const changeStatusMutation = useChangeWorkOrderStatus();
 * 
 * changeStatusMutation.mutate({
 *   id: 123,
 *   status: 'APPROVED',
 *   notes: 'Onaylandı'
 * });
 * 
 * // Cache invalidation: İlgili iş emri detay + tüm listeler + stats
 */
export function useChangeWorkOrderStatus() {
  const queryClient = useQueryClient();

  return useToastMutation<WorkOrder, { id: number; status: WorkOrderStatusChange }>({
    mutationFn: async ({ id, status }) => {
      const response = await apiClient.post<WorkOrder>(`/isemri/${id}/status`, status);
      if (!response.success) {
        throw response;
      }
      return response.data as WorkOrder;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(variables.id) });
      if (data.WoNumber) {
        queryClient.invalidateQueries({ queryKey: workOrderKeys.byWoNumber(data.WoNumber) });
      }
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.stats() });
    },
    messages: {
      success: (data) => `İş emri durumu güncellendi: ${data.WoNumber} → ${data.Status}`,
      error: 'İş emri durumu değiştirilirken hata oluştu',
    },
  });
}

// =====================
// Queries - WorkOrderItem
// =====================

/**
 * WorkOrderItem listesi sorgulama - paginated
 * 
 * @param params - Pagination ve filtreleme parametreleri
 * @returns useQuery result with WorkOrderItem[]
 * 
 * @example
 * const { data } = useWorkOrderItemList({ work_order_id: 123 });
 * const { data } = useWorkOrderItemList({ is_invoiced: false });
 * 
 * // Cache: 30 saniye fresh (WORKORDER policy)
 */
export function useWorkOrderItemList(params: {
  page?: number;
  page_size?: number;
  work_order_id?: number;
  item_type?: string;
  is_invoiced?: boolean;
} = {}) {
  return useQuery<WorkOrderItem[], ErrorResponse>({
    queryKey: workOrderItemKeys.list(params),
    queryFn: async (): Promise<WorkOrderItem[]> => {
      const response = await apiClient.get<WorkOrderItem[]>('/isemri/item', params);
      if (!response.success) {
        throw response;
      }
      return response.data as WorkOrderItem[];
    },
    ...getQueryOptions('WORKORDER'),
  });
}

/**
 * WorkOrderItem detay sorgulama
 * 
 * @param id - WorkOrderItem ID
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with single WorkOrderItem
 * 
 * @example
 * const { data: item } = useWorkOrderItemDetail(456);
 */
export function useWorkOrderItemDetail(id: number, options?: { enabled?: boolean }) {
  return useQuery<WorkOrderItem, ErrorResponse>({
    queryKey: workOrderItemKeys.detail(id),
    queryFn: async (): Promise<WorkOrderItem> => {
      const response = await apiClient.get<WorkOrderItem>(`/isemri/item/${id}`);
      if (!response.success) {
        throw response;
      }
      return response.data as WorkOrderItem;
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('WORKORDER'),
  });
}

/**
 * WorkOrder'a ait tüm item'ları getir
 * 
 * @param workOrderId - WorkOrder ID
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with WorkOrderItem[]
 * 
 * @example
 * const { data: items } = useWorkOrderItems(123);
 */
export function useWorkOrderItems(workOrderId: number, options?: { enabled?: boolean }) {
  return useQuery<WorkOrderItem[], ErrorResponse>({
    queryKey: workOrderKeys.items(workOrderId),
    queryFn: async (): Promise<WorkOrderItem[]> => {
      const response = await apiClient.get<WorkOrderItem[]>('/isemri/item', {
        work_order_id: workOrderId,
      });
      if (!response.success) {
        throw response;
      }
      return response.data as WorkOrderItem[];
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('WORKORDER'),
  });
}

// =====================
// Mutations - WorkOrderItem
// =====================

/**
 * WorkOrderItem oluşturma mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const createMutation = useCreateWorkOrderItem();
 * 
 * createMutation.mutate({
 *   WorkOrderId: 123,
 *   WoNumber: 'WO-2025-001',
 *   ItemType: 'SERVICE',
 *   ServiceCode: 'SRV-001',
 *   Quantity: 2,
 *   Unit: 'SAAT',
 *   UnitPrice: 150,
 *   TotalAmount: 300,
 *   VatAmount: 60,
 *   GrandTotal: 360
 * });
 * 
 * // Cache invalidation: WorkOrderItem listeleri + parent WorkOrder items
 */
export function useCreateWorkOrderItem() {
  const queryClient = useQueryClient();

  return useToastMutation<WorkOrderItem, CreateWorkOrderItemPayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<WorkOrderItem>('/isemri/item', payload);
      if (!response.success) {
        throw response;
      }
      return response.data as WorkOrderItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workOrderItemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.items(data.WorkOrderId) });
      // Parent WorkOrder'ın da güncellenmesi gerekebilir (toplam tutar vs.)
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(data.WorkOrderId) });
    },
    messages: {
      success: (data) => `İş emri kalemi oluşturuldu: ${data.WoNumber} - ${data.ItemType}`,
      error: 'İş emri kalemi oluşturulurken hata oluştu',
    },
  });
}

/**
 * WorkOrderItem güncelleme mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const updateMutation = useUpdateWorkOrderItem();
 * 
 * updateMutation.mutate({
 *   id: 456,
 *   data: { Quantity: 3, TotalAmount: 450, GrandTotal: 540 }
 * });
 * 
 * // Cache invalidation: İlgili item detay + parent WorkOrder items + tüm listeler
 */
export function useUpdateWorkOrderItem() {
  const queryClient = useQueryClient();

  return useToastMutation<WorkOrderItem, { id: number; data: UpdateWorkOrderItemPayload }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<WorkOrderItem>(`/isemri/item/${id}`, data);
      if (!response.success) {
        throw response;
      }
      return response.data as WorkOrderItem;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: workOrderItemKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.items(data.WorkOrderId) });
      queryClient.invalidateQueries({ queryKey: workOrderItemKeys.lists() });
      // Parent WorkOrder'ı da invalidate et
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(data.WorkOrderId) });
    },
    messages: {
      success: (data) => `İş emri kalemi güncellendi: ${data.WoNumber} - ${data.ItemType}`,
      error: 'İş emri kalemi güncellenirken hata oluştu',
    },
  });
}

/**
 * WorkOrderItem silme mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const deleteMutation = useDeleteWorkOrderItem();
 * 
 * deleteMutation.mutate(456, {
 *   onSuccess: () => console.log('Item deleted'),
 * });
 * 
 * // Cache invalidation: İlgili item detay + tüm listeler
 */
export function useDeleteWorkOrderItem() {
  const queryClient = useQueryClient();

  return useToastMutation<void, number>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<void>(`/isemri/item/${id}`);
      if (!response.success) {
        throw response;
      }
      return response.data as void;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: workOrderItemKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: workOrderItemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderItemKeys.all() });
      // Parent WorkOrder items'ı da invalidate et (WorkOrderId bilinmediği için all)
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all() });
    },
    messages: {
      success: 'İş emri kalemi silindi',
      error: 'İş emri kalemi silinirken hata oluştu',
    },
  });
}
