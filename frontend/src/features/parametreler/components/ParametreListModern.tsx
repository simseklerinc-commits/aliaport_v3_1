/**
 * ParametreListModern - Modern Parametre List Component
 * 
 * Features:
 * - React Query (useParametreQueries hooks)
 * - Category filtering with badges
 * - Search by Kod/Ad/Deger
 * - Pagination with skeleton loading
 * - Toast notifications for mutations
 * - Status toggle (Aktif/Pasif)
 * - Responsive design
 * 
 * @example
 * <ParametreListModern />
 */

import { useState } from 'react';
import { useParametreList, useUpdateParametreValue, useDeleteParametre } from '@/core/hooks/queries/useParametreQueries';
import { Icon } from '@/shared/ui/Icon';
import { Skeleton, TableSkeleton } from '@/shared/ui/Skeleton';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { SimplePagination } from '@/shared/ui/Pagination';

// Category themes (consistent with existing design)
const CATEGORY_THEMES: Record<string, { bg: string; text: string; border: string }> = {
  'BIRIM': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  'PARA_BIRIMI': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  'KDV_ORANI': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  'KDV_ISTISNA': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  'HIZMET_GRUBU': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  'HIZMET_KATEGORI': { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  'FIYATLANDIRMA_KURALI': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  'CARI_TIP': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  'CARI_ROL': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  'SISTEM': { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
};

export function ParametreListModern() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // React Query hooks
  const { data: paginatedData, isLoading, error } = useParametreList({
    page,
    pageSize: 20,
    search: search || undefined,
    kategori: categoryFilter || undefined,
  });

  const updateValueMutation = useUpdateParametreValue();
  const deleteMutation = useDeleteParametre();

  // Extract unique categories for filter
  const categories = paginatedData?.items
    ? Array.from(new Set(paginatedData.items.map(p => p.Kategori)))
    : [];

  // Handlers
  const handleToggleAktif = async (id: number, currentValue: string) => {
    const newValue = currentValue === '1' ? '0' : '1';
    await updateValueMutation.mutateAsync({ id, Deger: newValue });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bu parametreyi silmek istediğinizden emin misiniz?')) {
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
        <p className="text-red-400">Parametreler yüklenirken hata oluştu</p>
        <p className="mt-2 text-sm text-red-400/70">{error.message}</p>
      </div>
    );
  }

  const items = paginatedData?.items || [];
  const pagination = paginatedData?.pagination;

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Parametreler</h2>
          <p className="text-sm text-slate-400">Sistem parametreleri ve yapılandırma değerleri</p>
        </div>
        
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
          <Icon name="add" size={16} />
          Yeni Parametre
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Icon 
            name="search" 
            size={18} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            decorative 
          />
          <input
            type="text"
            placeholder="Kod, Ad veya Değer ile ara..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Category Filter */}
        <div className="relative sm:w-64">
          <Icon 
            name="filter" 
            size={18} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            decorative 
          />
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-10 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <Icon 
            name="chevron-down" 
            size={16} 
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            decorative 
          />
        </div>
      </div>

      {/* Results Count */}
      {pagination && (
        <div className="text-sm text-slate-400">
          Toplam <span className="font-medium text-white">{pagination.total}</span> parametre bulundu
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                <th className="px-6 py-3">Kategori</th>
                <th className="px-6 py-3">Kod</th>
                <th className="px-6 py-3">Ad</th>
                <th className="px-6 py-3">Değer</th>
                <th className="px-6 py-3">Durum</th>
                <th className="px-6 py-3">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Icon name="search" size={48} className="mx-auto mb-3 text-slate-600" decorative />
                    <p className="text-slate-400">Parametre bulunamadı</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {search || categoryFilter 
                        ? 'Arama kriterlerini değiştirerek tekrar deneyin' 
                        : 'Henüz hiç parametre eklenmemiş'}
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((param) => {
                  const theme = CATEGORY_THEMES[param.Kategori] || CATEGORY_THEMES.SISTEM;
                  return (
                    <tr key={param.Id} className="hover:bg-slate-700/30 transition-colors">
                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${theme.bg} ${theme.text} ${theme.border}`}>
                          {param.Kategori}
                        </span>
                      </td>

                      {/* Kod */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-white">{param.Kod}</span>
                      </td>

                      {/* Ad */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">{param.Ad}</span>
                      </td>

                      {/* Değer */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-slate-200">{param.Deger || '-'}</span>
                      </td>

                      {/* Durum (Aktif toggle for boolean params) */}
                      <td className="px-6 py-4">
                        {param.Deger === '0' || param.Deger === '1' ? (
                          <button
                            onClick={() => handleToggleAktif(param.Id, param.Deger)}
                            disabled={updateValueMutation.isPending}
                            className="flex items-center gap-2"
                          >
                            <StatusBadge 
                              kind="aktifPasif" 
                              value={param.Deger === '1'} 
                            />
                          </button>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => console.log('Edit', param.Id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                            title="Düzenle"
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(param.Id)}
                            disabled={deleteMutation.isPending}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
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
      {pagination && pagination.totalPages > 1 && (
        <SimplePagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
