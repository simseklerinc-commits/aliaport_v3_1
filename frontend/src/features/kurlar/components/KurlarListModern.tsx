/**
 * KurlarListModern - Modern Exchange Rates List Component
 * 
 * Features:
 * - React Query (useKurlarQueries hooks)
 * - TCMB sync button with loading state
 * - Currency pair display (TRY/USD, TRY/EUR, etc.)
 * - Latest rates with effective date
 * - Frozen status indicators
 * - Pagination with skeleton loading
 * - Toast notifications for mutations
 * - Responsive design
 * 
 * @example
 * <KurlarListModern />
 */

import { useState } from 'react';
import {
  useExchangeRateList,
  useFetchTCMBRates,
  useDeleteExchangeRate,
} from '@/core/hooks/queries/useKurlarQueries';
import { Icon } from '@/shared/ui/Icon';
import { Skeleton, TableSkeleton } from '@/shared/ui/Skeleton';
import { SimplePagination } from '@/shared/ui/Pagination';
import { formatNumber } from '@/core/utils/number';
import { formatDate } from '@/core/utils/date';

export function KurlarListModern() {
  const [page, setPage] = useState(1);
  const [currencyFilter, setCurrencyFilter] = useState<string>('');

  // React Query hooks
  const { data: paginatedData, isLoading, error } = useExchangeRateList({
    page,
    page_size: 20,
  });

  const fetchTCMBMutation = useFetchTCMBRates();
  const deleteMutation = useDeleteExchangeRate();

  // Extract unique currencies for filter
  const currencies = paginatedData
    ? Array.from(new Set(paginatedData.flatMap(r => [r.CurrencyFrom, r.CurrencyTo])))
    : [];

  // Filter items by currency (if filter applied)
  const filteredItems = paginatedData?.filter((item) => {
    if (!currencyFilter) return true;
    return item.CurrencyFrom === currencyFilter || item.CurrencyTo === currencyFilter;
  }) || [];

  // Handlers
  const handleSyncTCMB = async () => {
    await fetchTCMBMutation.mutateAsync({});
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bu kur bilgisini silmek istediğinizden emin misiniz?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <TableSkeleton rows={10} columns={6} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6 text-center">
        <Icon name="error" size={48} className="mx-auto mb-4 text-red-500" />
        <p className="text-red-400">Kurlar yüklenirken hata oluştu</p>
        <p className="mt-2 text-sm text-red-400/70">{error.error?.message || 'Bilinmeyen hata'}</p>
      </div>
    );
  }

  const items = filteredItems;
  const pagination = paginatedData ? { page, totalPages: Math.ceil(paginatedData.length / 20) } : null;

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Kur Bilgileri</h2>
          <p className="text-sm text-slate-400">Döviz kurları ve güncelleme yönetimi</p>
        </div>

        <div className="flex items-center gap-2">
          {/* TCMB Sync Button */}
          <button
            onClick={handleSyncTCMB}
            disabled={fetchTCMBMutation.isPending}
            className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
          >
            <Icon 
              name={fetchTCMBMutation.isPending ? 'refresh' : 'download'} 
              size={16} 
              className={fetchTCMBMutation.isPending ? 'animate-spin' : ''}
            />
            {fetchTCMBMutation.isPending ? 'TCMB\'den Çekiliyor...' : 'TCMB\'den Çek'}
          </button>

          {/* Add Rate Button */}
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
            <Icon name="add" size={16} />
            Yeni Kur
          </button>
        </div>
      </div>

      {/* Currency Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Icon
            name="filter"
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            decorative
          />
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-10 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Tüm Para Birimleri</option>
            {currencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
          <Icon
            name="chevron-down"
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            decorative
          />
        </div>

        {/* Results Count */}
        <div className="text-sm text-slate-400">
          Toplam <span className="font-medium text-white">{items.length}</span> kur
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                <th className="px-6 py-3">Döviz Çifti</th>
                <th className="px-6 py-3 text-right">Alış Kuru</th>
                <th className="px-6 py-3 text-right">Satış Kuru</th>
                <th className="px-6 py-3">Geçerlilik Tarihi</th>
                <th className="px-6 py-3">Durum</th>
                <th className="px-6 py-3">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Icon name="search" size={48} className="mx-auto mb-3 text-slate-600" decorative />
                    <p className="text-slate-400">Kur bulunamadı</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {currencyFilter
                        ? 'Filtre kriterlerini değiştirerek tekrar deneyin'
                        : 'TCMB\'den kur çekerek başlayın'}
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((rate) => {
                  return (
                    <tr key={rate.Id} className="hover:bg-slate-700/30 transition-colors">
                      {/* Currency Pair */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-semibold text-white">
                            {rate.CurrencyFrom}/{rate.CurrencyTo}
                          </span>
                        </div>
                      </td>

                      {/* Buy Rate */}
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono text-sm text-green-400">
                          {formatNumber(rate.Rate || 0, 'tr-TR', 4)}
                        </span>
                      </td>

                      {/* Sell Rate */}
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono text-sm text-red-400">
                          {formatNumber(rate.SellRate || 0, 'tr-TR', 4)}
                        </span>
                      </td>

                      {/* Effective Date */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">
                          {formatDate(rate.RateDate || new Date().toISOString(), 'DD.MM.YYYY')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400 border border-green-500/30">
                          <Icon name="success" size={12} />
                          Yayında
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => console.log('Edit', rate.Id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                            title="Düzenle"
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(rate.Id)}
                            disabled={deleteMutation.isPending}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Sil"
                          >
                            <Icon name="delete" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <SimplePagination
          pagination={pagination}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
