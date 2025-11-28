/**
 * HIZMET MODULE - Barrel Exports
 */

// Main Module
export { HizmetModule } from './HizmetModule';

// Components
export { HizmetList } from './components/HizmetList';
export { HizmetForm } from './components/HizmetForm';
export { HizmetListModern } from './components/HizmetListModern';
export { AutoPricingForm } from './components/AutoPricingForm';
export { PricingAnalyticsDashboard } from './components/PricingAnalyticsDashboard';

// Hooks
export {
  useHizmetList,
  useHizmet,
  useHizmetMutations,
  useHizmetSearch,
} from './hooks/useHizmet';
export {
  usePricingAnalytics,
  useExportAnalyticsCSV,
  useExportAnalyticsPDF,
} from './hooks/usePricingAnalytics';

// API
export { hizmetApi } from './api/hizmetApi';

// Types
export type {
  Hizmet,
  HizmetCreate,
  HizmetUpdate,
  PriceCalculationRequest,
  PriceCalculationResponse,
} from './types/hizmet.types';
export { CalculationType } from './types/hizmet.types';
export type {
  PricingTrend,
  CalculationTypeBreakdown,
  TariffOverrideStats,
  PricingAnalyticsData,
  PricingAnalyticsRequest,
} from './types/analytics.types';
