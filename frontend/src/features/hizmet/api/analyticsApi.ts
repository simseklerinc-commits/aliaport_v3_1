/**
 * PRICING ANALYTICS API
 * 
 * Fiyatlandırma analitik verileri için API fonksiyonları
 */

import { apiClient } from '../../../core/api/client';
import { PricingAnalyticsData, PricingAnalyticsRequest } from '../types/analytics.types';

/**
 * Get pricing analytics data
 */
export const getPricingAnalytics = async (
  params: PricingAnalyticsRequest
): Promise<PricingAnalyticsData> => {
  const response = await apiClient.get<PricingAnalyticsData>(
    '/api/hizmet/analytics/pricing-trends',
    { params }
  );
  return response.data;
};

/**
 * Export analytics data to CSV
 */
export const exportAnalyticsToCSV = async (
  params: PricingAnalyticsRequest
): Promise<Blob> => {
  const response = await apiClient.get('/api/hizmet/analytics/export-csv', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Export analytics data to PDF
 */
export const exportAnalyticsToPDF = async (
  params: PricingAnalyticsRequest
): Promise<Blob> => {
  const response = await apiClient.get('/api/hizmet/analytics/export-pdf', {
    params,
    responseType: 'blob',
  });
  return response.data;
};
