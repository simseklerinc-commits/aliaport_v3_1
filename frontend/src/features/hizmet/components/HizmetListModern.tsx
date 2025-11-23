import { useState } from 'react';
import { useHizmetList } from '../../../core/hooks/queries/useHizmetQueries';
import { useDeleteHizmet } from '../../../core/hooks/queries/useHizmetQueries';
import { SimplePagination } from '../../../shared/ui/Pagination';
import { TableSkeleton } from '../../../shared/ui/Skeleton';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';
import type { Hizmet } from '../../../shared/types/hizmet';

interface HizmetListModernProps {
  onEdit?: (hizmet: Hizmet) => void;
  onView?: (hizmet: Hizmet) => void;
  onCreate?: () => void;
}

// NOT: Şu an backend paginated response data bölümünü dönüyor; pagination meta generic hook ile ileride eklenebilir.
export function HizmetListModern({ onEdit, onView, onCreate }: HizmetListModernProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [grupKodFilter, setGrupKodFilter] = useState('');

  const { data, isLoading, error } = useHizmetList({ page, page_size: 20, search, grup_kod: grupKodFilter || undefined });
  const deleteMutation = useDeleteHizmet();

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const handleGrupChange = (value: string) => {
    setGrupKodFilter(value);
    setPage(1);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Hizmet silinsin mi?')) return;
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Hizmetler</h2>
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

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">{search ? 'Arama sonucu bulunamadı' : 'Henüz hizmet kaydı yok'}</p>
        {onCreate && (
          <button onClick={onCreate} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            İlk Hizmeti Oluştur
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Hizmetler</h2>
        {onCreate && (
          <button onClick={onCreate} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Yeni Hizmet
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Grup Kod</label>
            <input
              type="text"
              value={grupKodFilter}
              onChange={(e) => handleGrupChange(e.target.value)}
              placeholder="Örn: LIMAN-OPER"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kod</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grup</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birim</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fiyat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((h) => (
                <tr key={h.Id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{h.Kod}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{h.Ad}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{h.GrupKod || '-'} </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{h.Birim || '-'} </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{h.Fiyat ? `${h.Fiyat} ${h.ParaBirimi}` : '-'} </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${h.AktifMi ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{h.AktifMi ? 'Aktif' : 'Pasif'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {onView && (
                        <button onClick={() => onView(h)} className="text-blue-600 hover:text-blue-900" title="Görüntüle">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                      )}
                      {onEdit && (
                        <button onClick={() => onEdit(h)} className="text-indigo-600 hover:text-indigo-900" title="Düzenle">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(h.Id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Sil"
                      >
                        {deleteMutation.isPending ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* NOT: Pagination meta henüz kullanılmıyor, backend meta entegrasyonu sonrası güncellenecek */}
        <SimplePagination
          pagination={{ page, page_size: 20, total: data.length, total_pages: 1, has_next: false, has_prev: page > 1 }}
          onPageChange={(newPage) => setPage(newPage)}
          className="border-t border-gray-200"
        />
      </div>
    </div>
  );
}/**
 * HIZMET MODULE - Modern Hizmet List Component
 *
 * React Query tabanlı yeni liste yapısı (CariListModern pattern'i baz alınmıştır)
 * Özellikler:
 *  - Arama (Kod / Ad / GrupKod)
 *  - Grup filtresi (grup_kod)
 *  - Aktif/Pasif durum toggle (useToggleHizmetStatus)
 *  - Silme (useDeleteHizmet)
 *  - Düzenle / Görüntüle callback'leri
 *  - Fiyat ve KDV gösterimi
 *  - Pagination placeholder (backend paginated meta hazır olduğunda SimplePagination entegre edilecek)
 *
 * @see core/hooks/queries/useHizmetQueries.ts
 */

import { useState } from 'react';
import { useHizmetList, useDeleteHizmet, useToggleHizmetStatus } from '../../../core/hooks/queries/useHizmetQueries';
import { Loader } from '../../../shared/ui/Loader';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';
import type { Hizmet } from '../../../shared/types/hizmet';
import { parseDecimal } from '../../../core/utils/number';

interface HizmetListModernProps {
  onEdit?: (hizmet: Hizmet) => void;
  onView?: (hizmet: Hizmet) => void;
  onCreate?: () => void;
}

export function HizmetListModern({ onEdit, onView, onCreate }: HizmetListModernProps) {
  const [page, setPage] = useState(1); // Backend pagination meta geldiğinde kullanılacak
  const [search, setSearch] = useState('');
  const [grupFilter, setGrupFilter] = useState('');

  // React Query hook - şimdilik sadece temel parametreler
  const { data: hizmetData, isLoading, error } = useHizmetList({
    page,
    page_size: 20,
    search: search || undefined,
    grup_kod: grupFilter || undefined,
  });

  const deleteMutation = useDeleteHizmet();
  const toggleMutation = useToggleHizmetStatus();

  const handleDelete = (hizmet: Hizmet) => {
    if (!confirm(`"${hizmet.Ad}" hizmetini silmek istediğinize emin misiniz?`)) {
      return;
    }
    deleteMutation.mutate(hizmet.Id, {
      onError: (err) => alert(`Silme hatası: ${err.error.message}`),
    });
  };

  const handleToggleStatus = (hizmet: Hizmet) => {
    toggleMutation.mutate({ id: hizmet.Id, aktif: !hizmet.AktifMi }, {
      onError: (err) => alert(`Durum güncelleme hatası: ${err.error.message}`),
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleGroupFilterChange = (value: string) => {
    setGrupFilter(value);
    setPage(1);
  };

  if (isLoading) {
    return <Loader message="Hizmet listesi yükleniyor..." />;
  }

  if (error) {
    return <ErrorMessage message={error.error.message} />;
  }

  if (!hizmetData || hizmetData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">
          {search ? 'Arama sonucu bulunamadı' : 'Henüz hizmet kaydı bulunmuyor'}
        </p>
        {onCreate && (
          <button
            onClick={onCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            İlk Hizmet Kaydını Oluştur
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Hizmet Yönetimi</h2>
        {onCreate && (
          <button
            onClick={onCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Hizmet
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ara</label>
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Kod, ad veya açıklama..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          {/* Grup Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grup Kodu</label>
            <input
              type="text"
              value={grupFilter}
              onChange={(e) => handleGroupFilterChange(e.target.value)}
              placeholder="Örn: LIMAN, DENIZ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Placeholder ekstra filtre (örn: Birim) - ileride combobox */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Birim (yakında)</label>
            <input
              type="text"
              disabled
              placeholder="Seçim gelecek"
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grup</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birim</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Fiyat</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">KDV %</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hizmetData.map((h) => {
                const fiyatNumber = h.Fiyat ? parseDecimal(h.Fiyat) : null;
                const kdvNumber = h.KdvOrani ? parseDecimal(h.KdvOrani) : null;
                return (
                  <tr key={h.Id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{h.Kod}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{h.Ad}</div>
                      {h.Aciklama && (
                        <div className="text-xs text-gray-500 mt-1">
                          {h.Aciklama.length > 60 ? h.Aciklama.slice(0, 60) + '…' : h.Aciklama}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{h.GrupKod || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{h.Birim || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {fiyatNumber != null ? fiyatNumber.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + (h.ParaBirimi || 'TRY') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {kdvNumber != null ? kdvNumber.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button
                        onClick={() => handleToggleStatus(h)}
                        disabled={toggleMutation.isPending}
                        className={`px-2 py-1 text-xs font-semibold rounded-full transition-colors border ${
                          h.AktifMi !== false
                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                        } disabled:opacity-50`}
                        title="Durum değiştir"
                      >
                        {h.AktifMi !== false ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onView && (
                          <button
                            onClick={() => onView(h)}
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
                            onClick={() => onEdit(h)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Düzenle"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(h)}
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

        {/* Pagination - backend pagination meta eklendiğinde SimplePagination entegre edilecek */}
        {/* <SimplePagination ... /> */}
      </div>
    </div>
  );
}
