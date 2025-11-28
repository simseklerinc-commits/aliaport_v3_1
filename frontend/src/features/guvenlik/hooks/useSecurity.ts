/**
 * SECURITY HOOKS
 * React Query hooks for Security/GateLog operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { securityApi } from '../api/securityApi';
import type {
  VehicleEntryRequest,
  VehicleExitRequest,
  PersonIdentityUploadRequest,
  SecurityApprovalBulkRequest,
} from '../types/security.types';
import { toast } from 'react-hot-toast';

// Query keys
const QUERY_KEYS = {
  activeVehicles: ['security', 'active-vehicles'] as const,
  pendingPersons: ['security', 'pending-persons'] as const,
};

// Get active vehicles
export function useActiveVehicles(workOrderId?: number) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...QUERY_KEYS.activeVehicles, workOrderId],
    queryFn: () => securityApi.getActiveVehicles(workOrderId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    vehicles: data ?? [],
    isLoading,
    error: error?.message,
    refetch,
  };
}

// Get pending persons
export function usePendingPersons(workOrderId?: number) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...QUERY_KEYS.pendingPersons, workOrderId],
    queryFn: () => securityApi.getPendingPersons(workOrderId),
    staleTime: 1000 * 60 * 1, // 1 minute for security-critical data
  });

  return {
    persons: data ?? [],
    isLoading,
    error: error?.message,
    refetch,
  };
}

// Mutations
export function useSecurityMutations() {
  const queryClient = useQueryClient();

  const vehicleEntryMutation = useMutation({
    mutationFn: (data: VehicleEntryRequest) => securityApi.vehicleEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeVehicles });
      toast.success('Araç giriş kaydı oluşturuldu');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || error.message || 'Araç giriş kaydı oluşturulurken hata oluştu';
      toast.error(msg);
    },
  });

  const vehicleExitMutation = useMutation({
    mutationFn: (data: VehicleExitRequest) => securityApi.vehicleExit(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeVehicles });
      
      if (response.is_over_base_hours) {
        toast.success(
          `Araç çıkış kaydı oluşturuldu (${response.duration_minutes} dk, +${response.extra_charge_calculated} USD ek ücret)`,
          { duration: 6000 }
        );
      } else {
        toast.success(`Araç çıkış kaydı oluşturuldu (${response.duration_minutes} dk)`);
      }
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || error.message || 'Araç çıkış kaydı oluşturulurken hata oluştu';
      toast.error(msg);
    },
  });

  const identityUploadMutation = useMutation({
    mutationFn: (data: PersonIdentityUploadRequest) => securityApi.uploadIdentityDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingPersons });
      toast.success('Kimlik belgesi yüklendi');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || error.message || 'Kimlik belgesi yüklenirken hata oluştu';
      toast.error(msg);
    },
  });

  const bulkApprovalMutation = useMutation({
    mutationFn: (data: SecurityApprovalBulkRequest) => securityApi.bulkApproval(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingPersons });
      toast.success(`${response.approved_count} kişi ${response.approved_count > 0 ? 'onaylandı' : 'reddedildi'}`);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || error.message || 'Toplu onay işlemi sırasında hata oluştu';
      toast.error(msg);
    },
  });

  return {
    recordVehicleEntry: async (data: VehicleEntryRequest) => {
      try {
        await vehicleEntryMutation.mutateAsync(data);
        return true;
      } catch {
        return false;
      }
    },
    recordVehicleExit: async (data: VehicleExitRequest) => {
      try {
        const result = await vehicleExitMutation.mutateAsync(data);
        return result;
      } catch {
        return null;
      }
    },
    uploadIdentity: async (data: PersonIdentityUploadRequest) => {
      try {
        await identityUploadMutation.mutateAsync(data);
        return true;
      } catch {
        return false;
      }
    },
    bulkApprove: async (data: SecurityApprovalBulkRequest) => {
      try {
        await bulkApprovalMutation.mutateAsync(data);
        return true;
      } catch {
        return false;
      }
    },
    isRecordingEntry: vehicleEntryMutation.isPending,
    isRecordingExit: vehicleExitMutation.isPending,
    isUploadingIdentity: identityUploadMutation.isPending,
    isApprovingBulk: bulkApprovalMutation.isPending,
  };
}
