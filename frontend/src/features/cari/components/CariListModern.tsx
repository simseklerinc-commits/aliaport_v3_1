/**
 * CARI MODULE - Modern Cari List Component
 * 
 * React Query hooks kullanarak yeniden yazılmış liste komponenti
 * - useCariQueries hooks entegrasyonu
 * - Pagination desteği (SimplePagination)
 * - Search, filter, CRUD actions
 * 
 * @see core/hooks/queries/useCariQueries.ts
 * @see shared/ui/Pagination.tsx
 */

import { useState } from 'react';
import { useDeleteCari } from '../../../core/hooks/queries/useCariQueries';
import { useCariListPaginated } from '../../../core/hooks/queries/usePaginatedQuery';
import type { PaginatedQueryResult } from '../../../core/hooks/queries/usePaginatedQuery';
import { SimplePagination } from '../../../shared/ui/Pagination';
import { TableSkeleton } from '../../../shared/ui/Skeleton';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';
import type { Cari } from '../../../shared/types/cari';
import { StatusBadge } from '../../../shared/ui/StatusBadge';

interface CariListModernProps {
  onEdit?: (cari: Cari) => void;
  onView?: (cari: Cari) => void;
  onCreate?: () => void;
}

export function CariListModern({ onEdit, onView, onCreate }: CariListModernProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [cariTipFilter, setCariTipFilter] = useState<string>('');

  // React Query hooks
  const queryResult = useCariListPaginated({
    page,
    page_size: 20,
    search,
    cari_tip: cariTipFilter || undefined,
  });
  const paginatedData = queryResult.data as PaginatedQueryResult<Cari> | undefined;
  const isLoading = queryResult.isLoading;
  const error = queryResult.error;

  const deleteMutation = useDeleteCari();

  const handleDelete = async (id: number, cariKod: string) => {
    if (!confirm(`"${cariKod}" kodlu cari kaydını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    deleteMutation.mutate(id, {
      onSuccess: () => {
        // React Query otomatik olarak cache'i invalidate eder
        // Liste otomatik güncellenecek
      },
      onError: (error) => {
        alert(`Silme hatası: ${error.error.message}`);
      },
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); // Search değişince ilk sayfaya dön
  };

  const handleFilterChange = (value: string) => {
    setCariTipFilter(value);
    setPage(1); // Filter değişince ilk sayfaya dön
  };

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Cari Yönetimi</h2>
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
          {search ? 'Arama sonucu bulunamadı' : 'Henüz cari kaydı bulunmuyor'}
        </p>
        {onCreate && (
          <button
            onClick={onCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            İlk Cari Kaydını Oluştur
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Cari Yönetimi</h2>
        {onCreate && (
          <button
            onClick={onCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Cari
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ara</label>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Kod, ünvan veya vergi numarası..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Cari Tip Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cari Tipi</label>
            <select
              value={cariTipFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tümü</option>
              <option value="MUSTERI">Müşteri</option>
              <option value="TEDARIKCI">Tedarikçi</option>
              <option value="HER_IKISI">Her İkisi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kod
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ünvan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tip
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vergi No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.items.map((cari: Cari) => (
                <tr key={cari.Id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {cari.CariKod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cari.Unvan}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge kind="cariRol" value={cari.Rol} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cari.VergiNo || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cari.Telefon || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge kind="aktifPasif" value={cari.AktifMi} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {onView && (
                        <button
                          onClick={() => onView(cari)}
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
                          onClick={() => onEdit(cari)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Düzenle"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(cari.Id, cari.CariKod)}
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
