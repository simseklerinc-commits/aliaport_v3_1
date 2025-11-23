/**
 * PARAMETRE MODULE - Modern Parametre List Component
 *
 * Özellikler:
 *  - Kategori sekmeleri (dinamik, mevcut listeden türetilir)
 *  - Arama (Kod / Ad / Açıklama / Değer)
 *  - Inline değer düzenleme (Deger alanı) - blur veya ENTER ile kaydet
 *  - Aktif/Pasif durum göstergesi
 *  - Silme işlemi
 *  - Yeni parametre oluşturma butonu (callback üzerinden)
 *  - Pagination placeholder (backend meta eklendiğinde SimplePagination entegre edilecek)
 *
 * @see core/hooks/queries/useParametreQueries.ts
 */

import { useEffect, useMemo, useState, useRef } from 'react';
import {
  useParametreList,
  useUpdateParametreValue,
  useDeleteParametre,
  useCreateParametre,
} from '../../../core/hooks/queries/useParametreQueries';
import type { Parametre } from '../../../shared/types/parametre';
import { Loader } from '../../../shared/ui/Loader';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';

interface ParametreListModernProps {
  onCreateParametre?: () => void; // Harici form açmak istenirse
  onEditParametre?: (param: Parametre) => void; // Tam düzenleme formu için
}

export function ParametreListModern({ onCreateParametre, onEditParametre }: ParametreListModernProps) {
  const [page, setPage] = useState(1); // pagination meta entegrasyonu sonrası kullanılacak
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState<string>('');
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineValue, setInlineValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { data: paramsData, isLoading, error } = useParametreList({
    page,
    page_size: 100, // Parametreler nispeten az sayıda; ileride backend meta ile değişebilir
    search: search || undefined,
    kategori: kategori || undefined,
  });

  const updateValueMutation = useUpdateParametreValue();
  const deleteMutation = useDeleteParametre();
  const createMutation = useCreateParametre();

  // Kategori listesi - mevcut kayıtlardan unique kategori çıkarıyoruz
  const categories = useMemo(() => {
    const set = new Set<string>();
    paramsData?.forEach((p) => set.add(p.Kategori));
    return Array.from(set).sort();
  }, [paramsData]);

  // Inline edit başlat
  const beginInlineEdit = (p: Parametre) => {
    setInlineEditingId(p.Id);
    setInlineValue(p.Deger || '');
  };

  // Kaydet (mutation)
  const commitInlineEdit = () => {
    if (inlineEditingId == null) return;
    const id = inlineEditingId;
    const deger = inlineValue.trim();
    updateValueMutation.mutate({ id, deger }, {
      onSuccess: () => {
        setInlineEditingId(null);
        setInlineValue('');
      },
      onError: (err) => alert(`Değer güncelleme hatası: ${err.error.message}`),
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

  const handleDelete = (p: Parametre) => {
    if (!confirm(`"${p.Kod}" parametresini silmek istediğinize emin misiniz?`)) return;
    deleteMutation.mutate(p.Id, {
      onError: (err) => alert(`Silme hatası: ${err.error.message}`),
    });
  };

  const handleQuickCreate = () => {
    const kod = prompt('Yeni parametre kodu girin (örn: NEW_FLAG):');
    if (!kod) return;
    const ad = prompt('Parametre adı girin:') || kod;
    const deger = prompt('Başlangıç değeri (opsiyonel):') || '';
    const kat = kategori || categories[0] || 'GENEL';
    createMutation.mutate({ Kategori: kat, Kod: kod.toUpperCase(), Ad: ad, Deger: deger }, {
      onError: (err) => alert(`Oluşturma hatası: ${err.error.message}`),
    });
  };

  if (isLoading) {
    return <Loader message="Parametreler yükleniyor..." />;
  }

  if (error) {
    return <ErrorMessage message={error.error.message} />;
  }

  const data = paramsData || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Parametre Yönetimi</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickCreate}
            className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Oluşturuluyor...' : 'Hızlı Yeni Parametre'}
          </button>
          {onCreateParametre && (
            <button
              onClick={onCreateParametre}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Gelişmiş Oluştur
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setKategori(''); setPage(1); }}
          className={`px-3 py-1 rounded text-sm border ${
            kategori === ''
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Tümü ({data.length})
        </button>
        {categories.map((cat) => {
          const count = data.filter((p) => p.Kategori === cat).length;
          return (
            <button
              key={cat}
              onClick={() => { setKategori(cat); setPage(1); }}
              className={`px-3 py-1 rounded text-sm border ${
                kategori === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-1">Ara</label>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Kod, ad, açıklama veya değer..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kod</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Değer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data
                .filter((p) => !kategori || p.Kategori === kategori)
                .filter((p) => {
                  if (!search) return true;
                  const s = search.toLowerCase();
                  return (
                    p.Kod.toLowerCase().includes(s) ||
                    p.Ad.toLowerCase().includes(s) ||
                    (p.Aciklama?.toLowerCase().includes(s) ?? false) ||
                    (p.Deger?.toLowerCase().includes(s) ?? false)
                  );
                })
                .map((p) => (
                  <tr key={p.Id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.Kategori}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{p.Kod}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.Ad}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inlineEditingId === p.Id ? (
                        <div className="flex items-center gap-2">
                          <input
                            ref={inputRef}
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onBlur={commitInlineEdit}
                            onKeyDown={handleKeyDown}
                            className="px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={commitInlineEdit}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            disabled={updateValueMutation.isPending}
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={cancelInlineEdit}
                            className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => beginInlineEdit(p)}
                          className="group px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                          title="Değeri düzenle"
                        >
                          <span className="group-hover:underline">
                            {p.Deger && p.Deger.length > 40 ? p.Deger.slice(0, 40) + '…' : (p.Deger || '—')}
                          </span>
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {p.Aciklama && p.Aciklama.length > 50 ? p.Aciklama.slice(0, 50) + '…' : p.Aciklama || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                          p.AktifMi !== false
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}
                      >
                        {p.AktifMi !== false ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onEditParametre && (
                          <button
                            onClick={() => onEditParametre(p)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Düzenle"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(p)}
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
        {/* Pagination placeholder */}
      </div>
    </div>
  );
}
