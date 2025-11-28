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
 * - Inline value editing (Deger field) - save on blur/ENTER
 * - Quick create with prompt
 * - Responsive design
 * 
 * @example
 * <ParametreListModern />
 */

import { useState, useRef, useEffect } from 'react';
import { useParametreList, useUpdateParametreValue, useDeleteParametre, useCreateParametre } from '../../../core/hooks/queries/useParametreQueries';
import { Icon } from '../../../shared/ui/Icon';
import { Skeleton, TableSkeleton } from '../../../shared/ui/Skeleton';
import { StatusBadge } from '../../../shared/ui/StatusBadge';
import { SimplePagination } from '../../../shared/ui/Pagination';
import type { Parametre } from '../../../shared/types/parametre';

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
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineValue, setInlineValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // React Query hooks
  const { data: paginatedData, isLoading, error } = useParametreList({
    page,
    page_size: 20,
    search: search || undefined,
    kategori: categoryFilter || undefined,
  });

  const updateValueMutation = useUpdateParametreValue();
  const deleteMutation = useDeleteParametre();
  const createMutation = useCreateParametre();

  // Extract unique categories for filter
  const categories = paginatedData
    ? Array.from(new Set(paginatedData.map((p: Parametre) => p.Kategori)))
    : [];

  // Inline edit handlers
  const beginInlineEdit = (param: Parametre) => {
    setInlineEditingId(param.Id);
    setInlineValue(param.Deger || '');
  };

  const commitInlineEdit = () => {
    if (inlineEditingId == null) return;
    const id = inlineEditingId;
    const deger = inlineValue.trim();
    updateValueMutation.mutate({ id, deger }, {
      onSuccess: () => {
        setInlineEditingId(null);
        setInlineValue('');
      },
    });
  };

  const cancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineValue('');
  };

  useEffect(() => {
    if (inlineEditingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [inlineEditingId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitInlineEdit();
    } else if (e.key === 'Escape') {
      cancelInlineEdit();
    }
  };

  // Handlers
  const handleToggleAktif = async (id: number, currentValue: string) => {
    const newValue = currentValue === '1' ? '0' : '1';
    await updateValueMutation.mutateAsync({ id, deger: newValue });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bu parametreyi silmek istediğinizden emin misiniz?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleQuickCreate = () => {
    const kod = prompt('Yeni parametre kodu girin (örn: NEW_FLAG):');
    if (!kod) return;
    const ad = prompt('Parametre adı girin:') || kod;
    const deger = prompt('Başlangıç değeri (opsiyonel):') || '';
    const kat = categoryFilter || categories[0] || 'GENEL';
    createMutation.mutate({ 
      Kategori: kat, 
      Kod: kod.toUpperCase(), 
      Ad: ad, 
      Deger: deger 
    });
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
        <p className="mt-2 text-sm text-red-400/70">{error.error?.message || 'Bilinmeyen hata'}</p>
      </div>
    );
  }

  const items = paginatedData || [];
  // Create pagination meta from backend response
  const pagination = {
    page,
    page_size: 20,
    total_pages: Math.ceil(items.length / 20),
    total: items.length,
    has_next: page * 20 < items.length,
    has_prev: page > 1,
  };

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
            {categories.map((cat: string) => (
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
          Toplam <span className="font-medium text-white">{items.length}</span> parametre bulundu
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
                items.map((param: Parametre) => {
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
                      {/* Değer - Inline Editable */}
                      <td className="px-6 py-4">
                        {inlineEditingId === param.Id ? (
                          <div className="flex items-center gap-2">
                            <input
                              ref={inputRef}
                              value={inlineValue}
                              onChange={(e) => setInlineValue(e.target.value)}
                              onBlur={commitInlineEdit}
                              onKeyDown={handleKeyDown}
                              className="px-2 py-1 border border-blue-500/50 rounded bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={commitInlineEdit}
                              disabled={updateValueMutation.isPending}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                            >
                              Kaydet
                            </button>
                            <button
                              onClick={cancelInlineEdit}
                              className="px-2 py-1 bg-slate-600 text-white rounded text-xs hover:bg-slate-700"
                            >
                              İptal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => beginInlineEdit(param)}
                            className="group px-2 py-1 rounded hover:bg-slate-700/50 transition-colors text-left w-full"
                            title="Değeri düzenle (çift tıkla)"
                          >
                            <span className="font-mono text-sm text-slate-200 group-hover:text-blue-400 group-hover:underline">
                              {param.Deger && param.Deger.length > 40 
                                ? param.Deger.slice(0, 40) + '…' 
                                : (param.Deger || '-')}
                            </span>
                          </button>
                        )}
                      </td>
                      {/* Değer */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-slate-200">{param.Deger || '-'}</span>
                      </td>

                      {/* Durum (Aktif toggle for boolean params) */}
                      <td className="px-6 py-4">
                        {param.Deger === '0' || param.Deger === '1' ? (
                          <button
                            onClick={() => handleToggleAktif(param.Id, param.Deger || '0')}
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
      {pagination && pagination.total_pages > 1 && (
        <SimplePagination
          pagination={pagination}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
