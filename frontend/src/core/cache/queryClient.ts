/**
 * React Query (TanStack Query) Configuration
 * 
 * Merkezi cache yönetimi için QueryClient yapılandırması.
 * Modül bazlı cache politikaları API_CACHE_STRATEGY.md'de belirtildiği şekilde ayarlanmıştır.
 * 
 * @see API_CACHE_STRATEGY.md - Cache stratejisi ve politika detayları
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Default staleTime/cacheTime değerleri (ms)
 * 
 * - staleTime: Veri "fresh" kabul edilme süresi (refetch tetiklenmez)
 * - cacheTime: Unused data cache'te kalma süresi (memory'den silinmeden önce)
 */
const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 dakika
const DEFAULT_CACHE_TIME = 10 * 60 * 1000; // 10 dakika

/**
 * Modül bazlı cache politikaları
 * 
 * Kullanım: queryKey'in ilk elemanı ile eşleştir
 * Örn: ['parametreler', 'list'] → PARAMETRELER policy
 */
export const CACHE_POLICIES = {
  // Nadir değişen master data
  PARAMETRELER: {
    staleTime: 60 * 60 * 1000, // 1 saat
    cacheTime: 2 * 60 * 60 * 1000, // 2 saat
  },
  KURLAR: {
    staleTime: 4 * 60 * 60 * 1000, // 4 saat (günlük güncelleme)
    cacheTime: 8 * 60 * 60 * 1000, // 8 saat
  },
  TARIFE: {
    staleTime: 30 * 60 * 1000, // 30 dakika
    cacheTime: 60 * 60 * 1000, // 1 saat
  },
  HIZMET: {
    staleTime: 30 * 60 * 1000, // 30 dakika
    cacheTime: 60 * 60 * 1000, // 1 saat
  },

  // Orta sıklıkta değişen data
  CARI: {
    staleTime: 5 * 60 * 1000, // 5 dakika
    cacheTime: 15 * 60 * 1000, // 15 dakika
  },
  MOTORBOT: {
    staleTime: 5 * 60 * 1000, // 5 dakika
    cacheTime: 15 * 60 * 1000, // 15 dakika
  },
  BARINMA: {
    staleTime: 5 * 60 * 1000, // 5 dakika
    cacheTime: 15 * 60 * 1000, // 15 dakika
  },

  // Sık değişen operasyonel data
  WORKORDER: {
    staleTime: 30 * 1000, // 30 saniye
    cacheTime: 5 * 60 * 1000, // 5 dakika
  },
  WORKLOG: {
    staleTime: 30 * 1000, // 30 saniye
    cacheTime: 5 * 60 * 1000, // 5 dakika
  },
  GATELOG: {
    staleTime: 30 * 1000, // 30 saniye
    cacheTime: 5 * 60 * 1000, // 5 dakika
  },

  // Dashboard / istatistikler (gerçek zamana yakın)
  STATS: {
    staleTime: 60 * 1000, // 1 dakika
    cacheTime: 5 * 60 * 1000, // 5 dakika
  },
} as const;

/**
 * Global QueryClient instance
 * 
 * Default ayarlar:
 * - 5 dakika staleTime (refetch threshold)
 * - 10 dakika cacheTime (garbage collection)
 * - 1 retry (network hatası durumunda)
 * - refetchOnWindowFocus: false (manuel refetch kontrolü için)
 * - refetchOnReconnect: true (bağlantı kesilip dönünce güncelle)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME,
      gcTime: DEFAULT_CACHE_TIME, // v5'te cacheTime yerine gcTime kullanılıyor
      retry: 1,
      refetchOnWindowFocus: false, // Sadece ihtiyaç halinde manuel refetch
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 0, // Mutation'lar tekrar denenmez (idempotency garantisi yok)
    },
  },
});

/**
 * Query key helper - modül bazlı cache policy uygular
 * 
 * @param module - Modül adı (CACHE_POLICIES keylerinden biri)
 * @param resource - Resource tipi ('list', 'detail', 'stats' vb.)
 * @param params - Opsiyonel ek parametreler (id, filters vb.)
 * @returns QueryKey array
 * 
 * @example
 * const queryKey = createQueryKey('CARI', 'list', { page: 1 });
 * // ['cari', 'list', { page: 1 }]
 */
export function createQueryKey(
  module: keyof typeof CACHE_POLICIES | string,
  resource: string,
  params?: Record<string, unknown>
): unknown[] {
  const key: unknown[] = [module.toLowerCase(), resource];
  if (params) {
    key.push(params);
  }
  return key;
}

/**
 * Query options helper - modül bazlı cache policy ile merge eder
 * 
 * @param module - Modül adı (CACHE_POLICIES keylerinden biri)
 * @param customOptions - Override edilecek opsiyonel ayarlar
 * @returns Query options object
 * 
 * @example
 * useQuery({
 *   queryKey: createQueryKey('PARAMETRELER', 'list'),
 *   queryFn: fetchParametreler,
 *   ...getQueryOptions('PARAMETRELER')
 * });
 */
export function getQueryOptions(
  module: keyof typeof CACHE_POLICIES | string,
  customOptions?: Record<string, unknown>
) {
  const policy = CACHE_POLICIES[module as keyof typeof CACHE_POLICIES];

  return {
    staleTime: policy?.staleTime ?? DEFAULT_STALE_TIME,
    gcTime: policy?.cacheTime ?? DEFAULT_CACHE_TIME,
    ...customOptions,
  };
}
