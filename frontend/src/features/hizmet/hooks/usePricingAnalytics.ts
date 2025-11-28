/**
 * PRICING ANALYTICS HOOKS
 * 
 * React Query hooks for pricing analytics data
 */

import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getPricingAnalytics, exportAnalyticsToCSV, exportAnalyticsToPDF } from '../api/analyticsApi';
import { PricingAnalyticsRequest } from '../types/analytics.types';

/**
 * Hook to fetch pricing analytics data
 */
export const usePricingAnalytics = (params: PricingAnalyticsRequest) => {
  return useQuery({
    queryKey: ['pricingAnalytics', params],
    queryFn: () => getPricingAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      toast.error(`Analitik veriler yüklenemedi: ${error.response?.data?.detail || error.message}`);
    },
  });
};

/**
 * Export analytics to CSV
 */
export const useExportAnalyticsCSV = () => {
  const exportToCSV = async (params: PricingAnalyticsRequest) => {
    try {
      const blob = await exportAnalyticsToCSV(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pricing_analytics_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('CSV dosyası indirildi');
    } catch (error: any) {
      toast.error(`CSV export hatası: ${error.response?.data?.detail || error.message}`);
    }
  };

  return { exportToCSV };
};

/**
 * Export analytics to PDF
 */
export const useExportAnalyticsPDF = () => {
  const exportToPDF = async (params: PricingAnalyticsRequest) => {
    try {
      const blob = await exportAnalyticsToPDF(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pricing_analytics_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF dosyası indirildi');
    } catch (error: any) {
      toast.error(`PDF export hatası: ${error.response?.data?.detail || error.message}`);
    }
  };

  return { exportToPDF };
};
