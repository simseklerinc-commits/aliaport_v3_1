/**
 * React Query Hooks - Audit Module
 * 
 * Denetim logları ve kayıt metadata sorgulamaları
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createQueryKey, getQueryOptions } from '../../cache/queryClient';
import { auditApi, recordMetadataApi } from '@/lib/api';
import type { AuditLog, DeleteValidation, RecordMetadata } from '@/lib/types/audit';
import type { ErrorResponse } from '../../types/responses';

// =====================
// Query Keys
// =====================

export const auditKeys = {
  all: () => createQueryKey('AUDIT', 'all'),
  lists: () => createQueryKey('AUDIT', 'list'),
  list: (params: Record<string, unknown>) => createQueryKey('AUDIT', 'list', params),
  byRecord: (tableName: string, recordId: number) => 
    createQueryKey('AUDIT', 'by-record', { tableName, recordId }),
  byUser: (userId: number) => createQueryKey('AUDIT', 'by-user', { userId }),
  recent: (limit: number) => createQueryKey('AUDIT', 'recent', { limit }),
  metadata: (tableName: string, recordId: number) => 
    createQueryKey('AUDIT', 'metadata', { tableName, recordId }),
  deletable: (tableName: string, recordId: number) => 
    createQueryKey('AUDIT', 'deletable', { tableName, recordId }),
};

// =====================
// Queries - Audit Logs
// =====================

/**
 * Tüm audit logları (filtrelenmiş)
 */
export function useAuditLogs(params?: Parameters<typeof auditApi.getAll>[0]) {
  return useQuery<{ items: AuditLog[]; total: number }, ErrorResponse>({
    queryKey: auditKeys.list(params || {}),
    queryFn: async () => {
      const response = await auditApi.getAll(params);
      return response.data;
    },
    ...getQueryOptions('AUDIT'),
  });
}

/**
 * Belirli kayda ait audit logları
 */
export function useAuditLogsByRecord(tableName: string, recordId: number, enabled: boolean = true) {
  return useQuery<AuditLog[], ErrorResponse>({
    queryKey: auditKeys.byRecord(tableName, recordId),
    queryFn: async () => {
      const response = await auditApi.getByRecord(tableName, recordId);
      return response.data;
    },
    enabled: enabled && !!tableName && recordId > 0,
    ...getQueryOptions('AUDIT'),
  });
}

/**
 * Kullanıcının yaptığı değişiklikler
 */
export function useAuditLogsByUser(userId: number, params?: Parameters<typeof auditApi.getByUser>[1]) {
  return useQuery<AuditLog[], ErrorResponse>({
    queryKey: auditKeys.byUser(userId),
    queryFn: async () => {
      const response = await auditApi.getByUser(userId, params);
      return response.data;
    },
    enabled: userId > 0,
    ...getQueryOptions('AUDIT'),
  });
}

/**
 * Son N değişiklik
 */
export function useRecentAuditLogs(limit: number = 50) {
  return useQuery<AuditLog[], ErrorResponse>({
    queryKey: auditKeys.recent(limit),
    queryFn: async () => {
      const response = await auditApi.getRecent(limit);
      return response.data;
    },
    ...getQueryOptions('AUDIT'),
  });
}

// =====================
// Queries - Record Metadata
// =====================

/**
 * Kayıt metadata bilgisi
 */
export function useRecordMetadata(tableName: string, recordId: number, enabled: boolean = true) {
  return useQuery<RecordMetadata, ErrorResponse>({
    queryKey: auditKeys.metadata(tableName, recordId),
    queryFn: async () => {
      const response = await recordMetadataApi.getMetadata(tableName, recordId);
      return response.data;
    },
    enabled: enabled && !!tableName && recordId > 0,
    ...getQueryOptions('AUDIT'),
  });
}

/**
 * Silme kontrolü
 */
export function useDeleteValidation(tableName: string, recordId: number, enabled: boolean = true) {
  return useQuery<DeleteValidation, ErrorResponse>({
    queryKey: auditKeys.deletable(tableName, recordId),
    queryFn: async () => {
      const response = await recordMetadataApi.checkDeletable(tableName, recordId);
      return response.data;
    },
    enabled: enabled && !!tableName && recordId > 0,
    staleTime: 0, // Her seferinde yeniden kontrol et
    gcTime: 0,
  });
}

// =====================
// Mutations
// =====================

/**
 * Audit log oluştur
 */
export function useCreateAuditLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof auditApi.create>[0]) => 
      auditApi.create(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: auditKeys.lists() });
      queryClient.invalidateQueries({ 
        queryKey: auditKeys.byRecord(data.table_name, data.record_id) 
      });
      queryClient.invalidateQueries({ queryKey: auditKeys.recent(50) });
    },
  });
}

// =====================
// Helper Hooks
// =====================

/**
 * Kayıt için değişiklik geçmişi + metadata kombine hook
 */
export function useRecordHistory(tableName: string, recordId: number, enabled: boolean = true) {
  const auditLogs = useAuditLogsByRecord(tableName, recordId, enabled);
  const metadata = useRecordMetadata(tableName, recordId, enabled);

  return {
    logs: auditLogs.data || [],
    metadata: metadata.data,
    isLoading: auditLogs.isLoading || metadata.isLoading,
    error: auditLogs.error || metadata.error,
  };
}
