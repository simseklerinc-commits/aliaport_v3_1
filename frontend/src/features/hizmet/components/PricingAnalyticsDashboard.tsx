/**
 * PRICING ANALYTICS DASHBOARD
 * 
 * Fiyatlandırma analizleri görselleştirme paneli
 * 
 * Özellikler:
 * - Trend grafikleri (Line chart - zaman içinde fiyat trendleri)
 * - Hesaplama tipi dağılımı (Pie/Bar chart - 6 CalculationType breakdown)
 * - Tarife override istatistikleri
 * - Tarih aralığı filtreleme
 * - Hizmet filtreleme
 * - CSV/PDF export
 * - Responsive design
 * 
 * Kullanım:
 *   import { PricingAnalyticsDashboard } from '@/features/hizmet';
 *   <PricingAnalyticsDashboard />
 */

import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { 
  CalendarIcon, 
  ArrowDownTrayIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { usePricingAnalytics, useExportAnalyticsCSV, useExportAnalyticsPDF } from '../hooks/usePricingAnalytics';
import { useHizmetList } from '../hooks/useHizmet';
import { PricingAnalyticsRequest } from '../types/analytics.types';

export const PricingAnalyticsDashboard = () => {
  // Date range state (default: last 30 days)
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedHizmetId, setSelectedHizmetId] = useState<number | undefined>();

  // Build analytics request params
  const analyticsParams: PricingAnalyticsRequest = {
    startDate,
    endDate,
    hizmetId: selectedHizmetId,
  };

  // Fetch data
  const { data: analytics, isLoading, error } = usePricingAnalytics(analyticsParams);
  const { data: hizmetListData } = useHizmetList({ page: 1, limit: 1000 });
  const { exportToCSV } = useExportAnalyticsCSV();
  const { exportToPDF } = useExportAnalyticsPDF();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Analitik veriler yüklenemedi. Lütfen tekrar deneyin.</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">Veri bulunamadı.</p>
      </div>
    );
  }

  // Chart colors
  const COLORS = [
    '#3b82f6', // Blue
    '#22c55e', // Green
    '#fbbf24', // Yellow
    '#ef4444', // Red
    '#a855f7', // Purple
    '#ec4899', // Pink
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fiyatlandırma Analizleri</h1>
        <div className="flex gap-2">
          <button
            onClick={() => exportToCSV(analyticsParams)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            CSV İndir
          </button>
          <button
            onClick={() => exportToPDF(analyticsParams)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            PDF İndir
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Hizmet Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <TagIcon className="w-4 h-4 inline mr-1" />
              Hizmet Filtresi
            </label>
            <select
              value={selectedHizmetId || ''}
              onChange={(e) => setSelectedHizmetId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tümü</option>
              {hizmetListData?.items.map((hizmet) => (
                <option key={hizmet.Id} value={hizmet.Id}>
                  {hizmet.Kod} - {hizmet.Ad}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <CalculatorIcon className="w-8 h-8" />
            <h3 className="text-sm font-medium opacity-90">Toplam Hesaplama</h3>
          </div>
          <p className="text-3xl font-bold">{analytics.summary.totalCalculations.toLocaleString('tr-TR')}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <CurrencyDollarIcon className="w-8 h-8" />
            <h3 className="text-sm font-medium opacity-90">Toplam Gelir</h3>
          </div>
          <p className="text-3xl font-bold">
            {analytics.summary.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} USD
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <ChartBarIcon className="w-8 h-8" />
            <h3 className="text-sm font-medium opacity-90">Ort. Fiyat</h3>
          </div>
          <p className="text-3xl font-bold">
            {analytics.summary.avgCalculationPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} USD
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <TagIcon className="w-8 h-8" />
            <h3 className="text-sm font-medium opacity-90">En Çok Kullanılan Tip</h3>
          </div>
          <p className="text-lg font-bold">{analytics.summary.mostUsedCalculationType}</p>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Fiyat Trendleri</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={analytics.trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString('tr-TR')}
            />
            <YAxis tickFormatter={(value) => `${value} USD`} />
            <Tooltip
              formatter={(value: number) => `${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} USD`}
              labelFormatter={(date) => new Date(date).toLocaleDateString('tr-TR')}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="avgPrice" 
              stroke="#3b82f6" 
              name="Ortalama Fiyat"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="maxPrice" 
              stroke="#ef4444" 
              name="Maksimum Fiyat"
              strokeDasharray="5 5"
            />
            <Line 
              type="monotone" 
              dataKey="minPrice" 
              stroke="#22c55e" 
              name="Minimum Fiyat"
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Calculation Type Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Hesaplama Tipi Dağılımı</h2>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={analytics.calculationTypeBreakdown}
                dataKey="count"
                nameKey="calculationType"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={(entry) => `${entry.calculationType}: ${entry.percentage.toFixed(1)}%`}
              >
                {analytics.calculationTypeBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, entry: any) => [
                  `${value} (${entry.payload.percentage.toFixed(1)}%)`,
                  name
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Hesaplama Tipi Gelir Analizi</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analytics.calculationTypeBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="calculationType" />
              <YAxis tickFormatter={(value) => `${value} USD`} />
              <Tooltip
                formatter={(value: number, name: string, entry: any) => [
                  `${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} USD`,
                  'Gelir'
                ]}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{data.calculationType}</p>
                        <p className="text-sm">Gelir: {data.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} USD</p>
                        <p className="text-sm">Hesaplama: {data.count}</p>
                        <p className="text-sm">Ort. Fiyat: {data.avgPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} USD</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="totalRevenue">
                {analytics.calculationTypeBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tariff Override Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tarife Override İstatistikleri</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium mb-1">Override Oranı</p>
            <p className="text-3xl font-bold text-blue-900">
              {analytics.tariffOverrideStats.overridePercentage.toFixed(1)}%
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {analytics.tariffOverrideStats.overrideCount} / {analytics.tariffOverrideStats.totalCalculations} hesaplama
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium mb-1">Ortalama İndirim/Artış</p>
            <p className={`text-3xl font-bold ${
              analytics.tariffOverrideStats.avgOverrideDiscount > 0 ? 'text-green-900' : 'text-red-900'
            }`}>
              {analytics.tariffOverrideStats.avgOverrideDiscount > 0 ? '+' : ''}
              {analytics.tariffOverrideStats.avgOverrideDiscount.toFixed(1)}%
            </p>
            <p className="text-sm text-green-700 mt-1">
              {analytics.tariffOverrideStats.avgOverrideDiscount > 0 ? 'Artış' : 'İndirim'}
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium mb-1">En Çok Override Edilen</p>
            <p className="text-lg font-bold text-purple-900">
              {analytics.tariffOverrideStats.topOverriddenServices[0]?.hizmetKod || 'N/A'}
            </p>
            <p className="text-sm text-purple-700 mt-1">
              {analytics.tariffOverrideStats.topOverriddenServices[0]?.hizmetAd || 'Veri yok'}
            </p>
          </div>
        </div>

        {/* Top Overridden Services Table */}
        {analytics.tariffOverrideStats.topOverriddenServices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sıra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hizmet Kodu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hizmet Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Override Sayısı
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.tariffOverrideStats.topOverriddenServices.map((service, index) => (
                  <tr key={service.hizmetKod} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {service.hizmetKod}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {service.hizmetAd}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.overrideCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
