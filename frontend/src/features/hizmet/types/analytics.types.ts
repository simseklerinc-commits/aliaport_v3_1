/**
 * PRICING ANALYTICS TYPES
 * 
 * Fiyatlandırma analitik verilerinin TypeScript tip tanımları
 */

export interface PricingTrend {
  date: string; // ISO 8601 date string
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  totalCalculations: number;
  calculationType: string;
}

export interface CalculationTypeBreakdown {
  calculationType: string;
  count: number;
  totalRevenue: number;
  avgPrice: number;
  percentage: number;
}

export interface TariffOverrideStats {
  totalCalculations: number;
  overrideCount: number;
  overridePercentage: number;
  avgOverrideDiscount: number; // Positive = discount, negative = markup
  topOverriddenServices: Array<{
    hizmetKod: string;
    hizmetAd: string;
    overrideCount: number;
  }>;
}

export interface PricingAnalyticsData {
  trends: PricingTrend[];
  calculationTypeBreakdown: CalculationTypeBreakdown[];
  tariffOverrideStats: TariffOverrideStats;
  summary: {
    totalCalculations: number;
    totalRevenue: number;
    avgCalculationPrice: number;
    mostUsedCalculationType: string;
  };
}

export interface PricingAnalyticsRequest {
  startDate?: string; // ISO 8601 date string
  endDate?: string;
  hizmetId?: number;
  calculationType?: string;
}
