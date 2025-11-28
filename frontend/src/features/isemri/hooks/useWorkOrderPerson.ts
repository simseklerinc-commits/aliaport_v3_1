/**
 * WORK ORDER PERSON HOOKS
 * React Query hooks for WorkOrderPerson CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workOrderPersonApi } from '../api/workOrderPersonApi';
import type {
  WorkOrderPerson,
  WorkOrderPersonCreate,
  WorkOrderPersonUpdate,
  SecurityApprovalRequest,
} from '../types/workOrderPerson.types';
import { toast } from 'react-hot-toast';

// Query keys
const QUERY_KEYS = {
  all: ['work-order-persons'] as const,
  byId: (id: number) => ['work-order-person', id] as const,
  byWorkOrder: (woId: number) => ['work-order-persons', 'wo', woId] as const,
  pendingApproval: ['work-order-persons', 'pending-approval'] as const,
};

// Get all work order persons
export function useWorkOrderPersons(params?: {
  work_order_id?: number;
  approved?: boolean;
  page?: number;
  page_size?: number;
}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...QUERY_KEYS.all, params],
    queryFn: () => workOrderPersonApi.getAll(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    persons: data?.items ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.total_pages ?? 1,
    isLoading,
    error: error?.message,
    refetch,
  };
}

// Get persons by work order ID
export function useWorkOrderPersonsByWO(workOrderId: number) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.byWorkOrder(workOrderId),
    queryFn: () => workOrderPersonApi.getByWorkOrderId(workOrderId),
    enabled: !!workOrderId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    persons: data ?? [],
    isLoading,
    error: error?.message,
    refetch,
  };
}

// Get pending approval persons
export function usePendingApprovalPersons() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.pendingApproval,
    queryFn: () => workOrderPersonApi.getPendingApproval(),
    staleTime: 1000 * 60 * 2, // 2 minutes for security-critical data
  });

  return {
    persons: data ?? [],
    isLoading,
    error: error?.message,
    refetch,
  };
}

// Get person by ID
export function useWorkOrderPerson(personId: number) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.byId(personId),
    queryFn: () => workOrderPersonApi.getById(personId),
    enabled: !!personId && personId > 0,
  });

  return {
    person: data,
    isLoading,
    error: error?.message,
    refetch,
  };
}

// Mutations
export function useWorkOrderPersonMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: WorkOrderPersonCreate) => workOrderPersonApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast.success('Kişi başarıyla eklendi');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || error.message || 'Kişi eklenirken hata oluştu';
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ personId, data }: { personId: number; data: WorkOrderPersonUpdate }) =>
      workOrderPersonApi.update(personId, data),
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byId(personId) });
      toast.success('Kişi başarıyla güncellendi');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || error.message || 'Kişi güncellenirken hata oluştu';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (personId: number) => workOrderPersonApi.delete(personId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast.success('Kişi başarıyla silindi');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || error.message || 'Kişi silinirken hata oluştu';
      toast.error(msg);
    },
  });

  const securityApprovalMutation = useMutation({
    mutationFn: ({ personId, data }: { personId: number; data: SecurityApprovalRequest }) =>
      workOrderPersonApi.securityApproval(personId, data),
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byId(personId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingApproval });
      toast.success('Güvenlik onayı güncellendi');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || error.message || 'Güvenlik onayı güncellenirken hata oluştu';
      toast.error(msg);
    },
  });

  return {
    createPerson: async (data: WorkOrderPersonCreate) => {
      try {
        await createMutation.mutateAsync(data);
        return true;
      } catch {
        return false;
      }
    },
    updatePerson: async (personId: number, data: WorkOrderPersonUpdate) => {
      try {
        await updateMutation.mutateAsync({ personId, data });
        return true;
      } catch {
        return false;
      }
    },
    deletePerson: async (personId: number) => {
      try {
        await deleteMutation.mutateAsync(personId);
        return true;
      } catch {
        return false;
      }
    },
    approveBySecurity: async (personId: number, data: SecurityApprovalRequest) => {
      try {
        await securityApprovalMutation.mutateAsync({ personId, data });
        return true;
      } catch {
        return false;
      }
    },
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isApproving: securityApprovalMutation.isPending,
  };
}
