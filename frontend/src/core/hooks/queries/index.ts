/**
 * QUERY HOOKS INDEX
 * Tüm React Query hooks'larının merkezi export noktası
 * 
 * @example
 * import { useCariList, useSeferDetail } from '@/core/hooks/queries';
 */

// Cari
export * from './useCariQueries';

// Barınma
export * from './useBarinmaQueries';

// Hizmet
export * from './useHizmetQueries';

// Kurlar
export * from './useKurlarQueries';

// Motorbot
export * from './useMotorbotQueries';

// Parametre
export * from './useParametreQueries';

// Tarife
export * from './useTarifeQueries';

// İş Emri
export * from './useWorkOrderQueries';

// Sefer
export * from './useSeferQueries';

// Audit
export * from './useAuditQueries';

// Güvenlik (Gate Log)
export * from './useGuvenlikQueries';

// Saha (Work Log)
export * from './useSahaQueries';

// Pagination
export * from './usePaginatedQuery';
