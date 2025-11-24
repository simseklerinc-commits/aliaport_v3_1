/**
 * React Query Hooks - Motorbot Module
 * 
 * useQuery ve useMutation wrapper'ları - Motorbot (Boat) & MbTrip (Trip) CRUD için cache yönetimi.
 * 
 * @see core/cache/queryClient.ts - Cache politikaları ve QueryClient config
 * @see core/api/client.ts - Base API client
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createQueryKey, getQueryOptions } from '../../cache/queryClient';
import { apiClient } from '../../api/client';
import { useToastMutation } from '@/core/hooks/useToastMutation';
import type {
  Motorbot,
  CreateMotorbotPayload,
  UpdateMotorbotPayload,
  MbTrip,
  CreateMbTripPayload,
  UpdateMbTripPayload,
} from '../../../shared/types/motorbot';
import type { ErrorResponse } from '../../types/responses';

// =====================
// Query Keys - Motorbot
// =====================

/**
 * Motorbot query keys factory
 * 
 * @example
 * motorbotKeys.all()          // ['motorbot']
 * motorbotKeys.lists()        // ['motorbot', 'list']
 * motorbotKeys.list(params)   // ['motorbot', 'list', { durum: 'AKTIF' }]
 * motorbotKeys.detail(id)     // ['motorbot', 'detail', { id: 1 }]
 * motorbotKeys.byCode(kod)    // ['motorbot', 'by-code', { kod: 'MB-001' }]
 */
export const motorbotKeys = {
  all: () => createQueryKey('MOTORBOT', 'all'),
  lists: () => createQueryKey('MOTORBOT', 'list'),
  list: (params: Record<string, unknown>) => createQueryKey('MOTORBOT', 'list', params),
  detail: (id: number) => createQueryKey('MOTORBOT', 'detail', { id }),
  byCode: (kod: string) => createQueryKey('MOTORBOT', 'by-code', { kod }),
  trips: (motorbotId: number) => createQueryKey('MOTORBOT', 'trips', { motorbotId }),
};

// =====================
// Query Keys - MbTrip
// =====================

/**
 * MbTrip query keys factory
 * 
 * @example
 * mbTripKeys.all()            // ['mb-trip']
 * mbTripKeys.lists()          // ['mb-trip', 'list']
 * mbTripKeys.list(params)     // ['mb-trip', 'list', { durum: 'TAMAMLANDI' }]
 * mbTripKeys.detail(id)       // ['mb-trip', 'detail', { id: 1 }]
 */
export const mbTripKeys = {
  all: () => createQueryKey('MOTORBOT', 'mb-trip'),
  lists: () => createQueryKey('MOTORBOT', 'mb-trip-list'),
  list: (params: Record<string, unknown>) => createQueryKey('MOTORBOT', 'mb-trip-list', params),
  detail: (id: number) => createQueryKey('MOTORBOT', 'mb-trip-detail', { id }),
};

// =====================
// Queries - Motorbot
// =====================

/**
 * Motorbot listesi sorgulama - paginated
 * 
 * @param params - Pagination ve filtreleme parametreleri
 * @returns useQuery result with Motorbot[]
 * 
 * @example
 * const { data } = useMotorbotList({ durum: 'AKTIF' });
 * const { data } = useMotorbotList({ owner_cari_kod: 'C-001' });
 * 
 * // Cache: 30 dakika fresh (MOTORBOT policy)
 */
export function useMotorbotList(params: {
  page?: number;
  page_size?: number;
  search?: string;
  durum?: string;
  owner_cari_kod?: string;
} = {}) {
  return useQuery<Motorbot[], ErrorResponse>({
    queryKey: motorbotKeys.list(params),
    queryFn: async (): Promise<Motorbot[]> => {
      const response = await apiClient.get<Motorbot[]>('/motorbot', params);
      if (!response.success) {
        throw response;
      }
      return response.data;
    },
    ...getQueryOptions('MOTORBOT'),
  });
}

/**
 * Motorbot detay sorgulama
 * 
 * @param id - Motorbot ID
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with single Motorbot
 * 
 * @example
 * const { data: motorbot } = useMotorbotDetail(123);
 */
export function useMotorbotDetail(id: number, options?: { enabled?: boolean }) {
  return useQuery<Motorbot, ErrorResponse>({
    queryKey: motorbotKeys.detail(id),
    queryFn: async (): Promise<Motorbot> => {
      const response = await apiClient.get<Motorbot>(`/motorbot/${id}`);
      if (!response.success) {
        throw response;
      }
      return response.data;
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('MOTORBOT'),
  });
}

/**
 * Motorbot kod ile sorgulama
 * 
 * @param kod - Motorbot Kod (örn: 'MB-001')
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with single Motorbot
 * 
 * @example
 * const { data: motorbot } = useMotorbotByCode('MB-001');
 */
export function useMotorbotByCode(kod: string, options?: { enabled?: boolean }) {
  return useQuery<Motorbot, ErrorResponse>({
    queryKey: motorbotKeys.byCode(kod),
    queryFn: async (): Promise<Motorbot> => {
      const response = await apiClient.get<Motorbot>(`/motorbot/by-code/${kod}`);
      if (!response.success) {
        throw response;
      }
      return response.data;
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('MOTORBOT'),
  });
}

// =====================
// Mutations - Motorbot
// =====================

/**
 * Motorbot oluşturma mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const createMutation = useCreateMotorbot();
 * 
 * createMutation.mutate({
 *   Kod: 'MB-001',
 *   Ad: 'Deniz Yıldızı',
 *   Plaka: '34-MB-001',
 *   KapasiteTon: 50,
 *   MaxHizKnot: 25,
 *   Durum: 'AKTIF'
 * });
 * 
 * // Cache invalidation: Tüm motorbot listelerini invalidate eder
 */
export function useCreateMotorbot() {
  const queryClient = useQueryClient();

  return useToastMutation<Motorbot, CreateMotorbotPayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<Motorbot>('/motorbot', payload);
      if (!response.success) {
        throw response;
      }
      return response.data as Motorbot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: motorbotKeys.lists() });
    },
    messages: {
      success: (data) => `Motorbot oluşturuldu: ${data.Kod}`,
      error: 'Motorbot oluşturulurken hata oluştu',
    },
  });
}

/**
 * Motorbot güncelleme mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const updateMutation = useUpdateMotorbot();
 * 
 * updateMutation.mutate({
 *   id: 123,
 *   data: { Durum: 'BAKIMDA', Notlar: 'Motor bakımda' }
 * });
 * 
 * // Cache invalidation: İlgili motorbot detay + kod + tüm listeler
 */
export function useUpdateMotorbot() {
  const queryClient = useQueryClient();

  return useToastMutation<Motorbot, { id: number; data: UpdateMotorbotPayload }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<Motorbot>(`/motorbot/${id}`, data);
      if (!response.success) {
        throw response;
      }
      return response.data as Motorbot;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: motorbotKeys.detail(variables.id) });
      if (data.Kod) {
        queryClient.invalidateQueries({ queryKey: motorbotKeys.byCode(data.Kod) });
      }
      queryClient.invalidateQueries({ queryKey: motorbotKeys.lists() });
      // İlgili sefer listesini de invalidate et
      queryClient.invalidateQueries({ queryKey: motorbotKeys.trips(variables.id) });
    },
    messages: {
      success: (data) => `Motorbot güncellendi: ${data.Kod}`,
      error: 'Motorbot güncellenirken hata oluştu',
    },
  });
}

/**
 * Motorbot silme mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const deleteMutation = useDeleteMotorbot();
 * 
 * deleteMutation.mutate(123, {
 *   onSuccess: () => console.log('Deleted'),
 * });
 * 
 * // Cache invalidation: İlgili motorbot detay + tüm listeler + trips
 */
export function useDeleteMotorbot() {
  const queryClient = useQueryClient();

  return useToastMutation<void, number>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<void>(`/motorbot/${id}`);
      if (!response.success) {
        throw response;
      }
      return response.data as void;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: motorbotKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: motorbotKeys.lists() });
      queryClient.invalidateQueries({ queryKey: motorbotKeys.trips(id) });
      queryClient.invalidateQueries({ queryKey: motorbotKeys.all() });
    },
    messages: {
      success: 'Motorbot silindi',
      error: 'Motorbot silinirken hata oluştu',
    },
  });
}

/**
 * Motorbot durum güncelleme (sadece Durum alanı)
 * 
 * Hızlı durum değiştirme için specialized mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const updateStatusMutation = useUpdateMotorbotStatus();
 * 
 * updateStatusMutation.mutate({ id: 123, durum: 'BAKIMDA' });
 */
export function useUpdateMotorbotStatus() {
  const queryClient = useQueryClient();

  return useToastMutation<Motorbot, { id: number; durum: 'AKTIF' | 'PASIF' | 'BAKIMDA' }>({
    mutationFn: async ({ id, durum }) => {
      const response = await apiClient.put<Motorbot>(`/motorbot/${id}`, { Durum: durum });
      if (!response.success) {
        throw response;
      }
      return response.data as Motorbot;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: motorbotKeys.detail(variables.id) });
      if (data.Kod) {
        queryClient.invalidateQueries({ queryKey: motorbotKeys.byCode(data.Kod) });
      }
      queryClient.invalidateQueries({ queryKey: motorbotKeys.lists() });
    },
    messages: {
      success: (data, vars) => `Motorbot durumu güncellendi (${vars.durum}): ${data.Kod}`,
      error: 'Motorbot durumu güncellenirken hata oluştu',
    },
  });
}

// =====================
// Queries - MbTrip
// =====================

/**
 * MbTrip listesi sorgulama - paginated
 * 
 * @param params - Pagination ve filtreleme parametreleri
 * @returns useQuery result with MbTrip[]
 * 
 * @example
 * const { data } = useMbTripList({ motorbot_id: 123 });
 * const { data } = useMbTripList({ durum: 'TAMAMLANDI' });
 * 
 * // Cache: 30 dakika fresh (MOTORBOT policy)
 */
export function useMbTripList(params: {
  page?: number;
  page_size?: number;
  motorbot_id?: number;
  durum?: string;
  sefer_tarihi_min?: string;
  sefer_tarihi_max?: string;
} = {}) {
  return useQuery<MbTrip[], ErrorResponse>({
    queryKey: mbTripKeys.list(params),
    queryFn: async (): Promise<MbTrip[]> => {
      const response = await apiClient.get<MbTrip[]>('/motorbot/trip', params);
      if (!response.success) {
        throw response;
      }
      return response.data as MbTrip[];
    },
    ...getQueryOptions('MOTORBOT'),
  });
}

/**
 * MbTrip detay sorgulama
 * 
 * @param id - MbTrip ID
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with single MbTrip
 * 
 * @example
 * const { data: trip } = useMbTripDetail(456);
 */
export function useMbTripDetail(id: number, options?: { enabled?: boolean }) {
  return useQuery<MbTrip, ErrorResponse>({
    queryKey: mbTripKeys.detail(id),
    queryFn: async (): Promise<MbTrip> => {
      const response = await apiClient.get<MbTrip>(`/motorbot/trip/${id}`);
      if (!response.success) {
        throw response;
      }
      return response.data;
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('MOTORBOT'),
  });
}

/**
 * Motorbot'a ait tüm seferleri getir
 * 
 * @param motorbotId - Motorbot ID
 * @param enabled - Query enable/disable (default: true)
 * @returns useQuery result with MbTrip[]
 * 
 * @example
 * const { data: trips } = useMotorbotTrips(123);
 */
export function useMotorbotTrips(motorbotId: number, options?: { enabled?: boolean }) {
  return useQuery<MbTrip[], ErrorResponse>({
    queryKey: motorbotKeys.trips(motorbotId),
    queryFn: async (): Promise<MbTrip[]> => {
      const response = await apiClient.get<MbTrip[]>('/motorbot/trip', { motorbot_id: motorbotId });
      if (!response.success) {
        throw response;
      }
      return response.data as MbTrip[];
    },
    enabled: options?.enabled ?? true,
    ...getQueryOptions('MOTORBOT'),
  });
}

// =====================
// Mutations - MbTrip
// =====================

/**
 * MbTrip oluşturma mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const createMutation = useCreateMbTrip();
 * 
 * createMutation.mutate({
 *   MotorbotId: 123,
 *   SeferTarihi: '2025-01-20',
 *   KalkisIskele: 'A-Pier',
 *   VarisIskele: 'B-Pier',
 *   Durum: 'PLANLANDI'
 * });
 * 
 * // Cache invalidation: MbTrip listeleri + ilgili Motorbot trips
 */
export function useCreateMbTrip() {
  const queryClient = useQueryClient();

  return useToastMutation<MbTrip, CreateMbTripPayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<MbTrip>('/motorbot/trip', payload);
      if (!response.success) {
        throw response;
      }
      return response.data as MbTrip;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mbTripKeys.lists() });
      queryClient.invalidateQueries({ queryKey: motorbotKeys.trips(data.MotorbotId) });
    },
    messages: {
      success: (data) => `Sefer oluşturuldu: ${data.SeferTarihi}`,
      error: 'Sefer oluşturulurken hata oluştu',
    },
  });
}

/**
 * MbTrip güncelleme mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const updateMutation = useUpdateMbTrip();
 * 
 * updateMutation.mutate({
 *   id: 456,
 *   data: { Durum: 'TAMAMLANDI', DonusZamani: '2025-01-20T18:30:00' }
 * });
 * 
 * // Cache invalidation: İlgili trip detay + Motorbot trips + tüm listeler
 */
export function useUpdateMbTrip() {
  const queryClient = useQueryClient();

  return useToastMutation<MbTrip, { id: number; data: UpdateMbTripPayload }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<MbTrip>(`/motorbot/trip/${id}`, data);
      if (!response.success) {
        throw response;
      }
      return response.data as MbTrip;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: mbTripKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: motorbotKeys.trips(data.MotorbotId) });
      queryClient.invalidateQueries({ queryKey: mbTripKeys.lists() });
    },
    messages: {
      success: (data) => `Sefer güncellendi: ${data.SeferTarihi}`,
      error: 'Sefer güncellenirken hata oluştu',
    },
  });
}

/**
 * MbTrip silme mutation
 * 
 * @returns useMutation result
 * 
 * @example
 * const deleteMutation = useDeleteMbTrip();
 * 
 * deleteMutation.mutate(456, {
 *   onSuccess: () => console.log('Trip deleted'),
 * });
 * 
 * // Cache invalidation: İlgili trip detay + tüm listeler
 */
export function useDeleteMbTrip() {
  const queryClient = useQueryClient();

  return useToastMutation<void, number>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<void>(`/motorbot/trip/${id}`);
      if (!response.success) {
        throw response;
      }
      return response.data as void;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: mbTripKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: mbTripKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mbTripKeys.all() });
    },
    messages: {
      success: 'Sefer silindi',
      error: 'Sefer silinirken hata oluştu',
    },
  });
}
