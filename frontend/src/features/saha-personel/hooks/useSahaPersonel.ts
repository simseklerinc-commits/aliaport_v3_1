/**
 * SAHA PERSONEL HOOKS
 * React Query hooks for Saha Personel operations
 */

import { useQuery } from '@tanstack/react-query';
import { sahaPersonelApi } from '../api/sahaPersonelApi';

// Query keys
const QUERY_KEYS = {
  activeWorkOrders: ['saha', 'active-work-orders'] as const,
  workOrderPersons: (woId: number) => ['saha', 'work-order-persons', woId] as const,
  myWorkOrders: (personnelName: string) => ['saha', 'my-work-orders', personnelName] as const,
  workOrderSummary: (woId: number) => ['saha', 'work-order-summary', woId] as const,
};

// Get active work orders
export function useActiveWorkOrders() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.activeWorkOrders,
    queryFn: () => sahaPersonelApi.getActiveWorkOrders(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    workOrders: data ?? [],
    isLoading,
    error: error?.message,
    refetch,
  };
}

// Get persons for a work order
export function useWorkOrderPersons(workOrderId: number) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.workOrderPersons(workOrderId),
    queryFn: () => sahaPersonelApi.getWorkOrderPersons(workOrderId),
    enabled: !!workOrderId && workOrderId > 0,
    staleTime: 1000 * 60 * 2,
  });

  return {
    persons: data ?? [],
    isLoading,
    error: error?.message,
    refetch,
  };
}

// Get my work orders
export function useMyWorkOrders(personnelName: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.myWorkOrders(personnelName),
    queryFn: () => sahaPersonelApi.getMyWorkOrders(personnelName),
    enabled: !!personnelName && personnelName.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  return {
    workOrders: data ?? [],
    isLoading,
    error: error?.message,
    refetch,
  };
}

// Get work order summary
export function useWorkOrderSummary(workOrderId: number) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.workOrderSummary(workOrderId),
    queryFn: () => sahaPersonelApi.getWorkOrderSummary(workOrderId),
    enabled: !!workOrderId && workOrderId > 0,
    staleTime: 1000 * 60 * 2,
  });

  return {
    summary: data,
    isLoading,
    error: error?.message,
    refetch,
  };
}
