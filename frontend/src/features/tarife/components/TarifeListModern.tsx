/**
 * TARIFE MODULE - Modern PriceList List Component (Basit Liste)
 *
 * Amaç: PriceList (Tarife) kayıtlarını modern pattern (paginated + skeleton + toast + filtreler)
 * ile göstermek. Master-detail (kalemler) görünümü için mevcut PriceListModern bileşeni korunur.
 *
 * Özellikler:
 *  - Paginated data (usePriceListListPaginated)
 *  - Arama (Kod / Ad)
 *  - Durum filtresi (TASLAK / AKTIF / PASIF)
 *  - Skeleton loading (TableSkeleton)
 *  - Toast entegre edilmiş delete mutation (useDeletePriceList)
 *  - Basit pagination (SimplePagination)
 *  - Erişilebilirlik: aria-live, fokusable butonlar
 *
 * @see core/hooks/queries/useTarifeQueries.ts
 * @see core/hooks/queries/usePaginatedQuery.ts
 */

import { useState } from 'react';
import { usePriceListListPaginated, useDeletePriceList } from '../../../core/hooks/queries/useTarifeQueries';
import type { PaginatedQueryResult } from '../../../core/hooks/queries/usePaginatedQuery';
import type { PriceList, PriceListDurum } from '../../../shared/types/tarife';
import { TableSkeleton } from '../../../shared/ui/Skeleton';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';
import { SimplePagination } from '../../../shared/ui/Pagination';
import { StatusBadge } from '../../../shared/ui/StatusBadge';

interface TarifeListModernProps {
  onEdit?: (priceList: PriceList) => void;
  onView?: (priceList: PriceList) => void;
  onCreate?: () => void;
}

export function TarifeListModern({ onEdit, onView, onCreate }: TarifeListModernProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [durumFilter, setDurumFilter] = useState<PriceListDurum | ''>('');

  const queryResult = usePriceListListPaginated({
    page,
    page_size: 20,
    search: search || undefined,
    durum: (durumFilter as PriceListDurum) || undefined,
  });
  const paginatedData = queryResult.data as PaginatedQueryResult<PriceList> | undefined;
  const isLoading = queryResult.isLoading;
  const error = queryResult.error;

  const deleteMutation = useDeletePriceList();

  const handleDelete = (pl: PriceList) => {
    if (!confirm(`"${pl.Ad}" tarifesini silmek istediğinize emin misiniz?`)) return;
    deleteMutation.mutate(pl.Id);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDurumChange = (value: PriceListDurum | '') => {
    setDurumFilter(value);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Tarife Yönetimi</h2>
          <div className="h-10 w-28 animate-pulse bg-gray-200 rounded" />
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="h-10 w-full animate-pulse bg-gray-100 rounded mb-3" />
          <div className="h-10 w-full animate-pulse bg-gray-100 rounded" />
        </div>
        <TableSkeleton columns={7} rows={8} />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error.error.message} />;
  }

  if (!paginatedData || paginatedData.items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">
          {search || durumFilter ? 'Filtre/arama sonucu bulunamadı' : 'Henüz tarife kaydı yok'}
        </p>
        {onCreate && (
          <button
            onClick={onCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            İlk Tarife Kaydını Oluştur
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Tarife Yönetimi</h2>
        {onCreate && (
          <button
            onClick={onCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Tarife
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ara</label>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Kod veya ad..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <select
              value={durumFilter}
              onChange={(e) => handleDurumChange(e.target.value as PriceListDurum | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tümü</option>
              <option value="TASLAK">Taslak</option>
              <option value="AKTIF">Aktif</option>
              <option value="PASIF">Pasif</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi (yakında)</label>
            <input
              type="text"
              disabled
              placeholder="Filtre eklenecek"
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kod</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Para Birimi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Versiyon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Geçerlilik</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.items.map((pl) => {
                const validity = pl.GecerlilikBaslangic
                  ? `${pl.GecerlilikBaslangic} → ${pl.GecerlilikBitis || '—'}`
                  : '—';
                return (
                  <tr key={pl.Id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{pl.Kod}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{pl.Ad}</div>
                      {pl.Aciklama && (
                        <div className="text-xs text-gray-500 mt-1">
                          {pl.Aciklama.length > 60 ? pl.Aciklama.slice(0, 60) + '…' : pl.Aciklama}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pl.ParaBirimi}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pl.Versiyon?.toFixed?.(1) || pl.Versiyon || '1'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{validity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <StatusBadge kind="tarifeDurum" value={pl.Durum} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onView && (
                          <button
                            onClick={() => onView(pl)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Görüntüle"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(pl)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Düzenle"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(pl)}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Sil"
                        >
                          {deleteMutation.isPending ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {paginatedData && (
          <SimplePagination
            pagination={paginatedData.pagination}
            onPageChange={(newPage) => setPage(newPage)}
            className="border-t border-gray-200"
          />
        )}
      </div>
    </div>
  );
}
