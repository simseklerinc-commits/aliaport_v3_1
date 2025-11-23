/**
 * TARIFE MODULE - Modern PriceList Master-Detail Component
 *
 * Amaç: PriceList (tarife) ve ona bağlı PriceListItem kalemlerini
 * tek bir ekranda, expandable master-detail düzeninde göstermek.
 *
 * Özellikler:
 *  - Arama (Kod / Ad)
 *  - Durum filtresi (TASLAK / AKTIF / PASIF)
 *  - Versiyon ve geçerlilik tarihleri gösterimi
 *  - Aktif/Pasif durum badge + Durum enum badge
 *  - Expand satır: ilgili kalemleri (PriceListItem) çekip tablo halinde gösterme
 *  - Kalem satırlarında: HizmetKodu, HizmetAdi, Birim, BirimFiyat, KdvOrani, AktifMi
 *  - PriceList silme & kalem silme (onaylı)
 *  - Kalem ekleme (placeholder buton - ileride modal/form entegre edilecek)
 *  - React Query cache otomatik invalidation (hook'lar üzerinden)
 *  - Pagination placeholder (backend meta entegrasyonu sonrası SimplePagination eklenecek)
 *
 * @see core/hooks/queries/useTarifeQueries.ts
 * @see shared/types/tarife.ts
 */

import { useState } from 'react';
import {
  usePriceListList,
  usePriceListItems,
  useDeletePriceList,
  useDeletePriceListItem,
} from '../../../core/hooks/queries/useTarifeQueries';
import type { PriceList, PriceListDurum, PriceListItem } from '../../../shared/types/tarife';
import { Loader } from '../../../shared/ui/Loader';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';
import { parseDecimal } from '../../../core/utils/number';
import { StatusBadge } from '../../../shared/ui/StatusBadge';

interface PriceListModernProps {
  onEditList?: (pl: PriceList) => void;
  onViewList?: (pl: PriceList) => void;
  onCreateList?: () => void;
  onEditItem?: (item: PriceListItem) => void;
  onCreateItem?: (priceList: PriceList) => void;
}

export function PriceListModern({
  onEditList,
  onViewList,
  onCreateList,
  onEditItem,
  onCreateItem,
}: PriceListModernProps) {
  const [page, setPage] = useState(1); // backend pagination meta hazır olduğunda kullanılacak
  const [search, setSearch] = useState('');
  const [durumFilter, setDurumFilter] = useState<PriceListDurum | ''>('');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const { data: listData, isLoading, error } = usePriceListList({
    page,
    page_size: 20,
    search: search || undefined,
    durum: (durumFilter as PriceListDurum) || undefined,
  });

  const deleteListMutation = useDeletePriceList();
  const deleteItemMutation = useDeletePriceListItem();

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteList = (pl: PriceList) => {
    if (!confirm(`"${pl.Ad}" tarifesini silmek istediğinize emin misiniz?`)) return;
    deleteListMutation.mutate(pl.Id, {
      onError: (err) => alert(`Silme hatası: ${err.error.message}`),
    });
  };

  const handleDeleteItem = (item: PriceListItem) => {
    if (!confirm(`Kalemi silmek istediğinize emin misiniz? (${item.HizmetKodu} - ${item.HizmetAdi})`)) return;
    deleteItemMutation.mutate({ itemId: item.Id, priceListId: item.PriceListId }, {
      onError: (err) => alert(`Kalem silme hatası: ${err.error.message}`),
    });
  };

  const filtered = (listData || []).filter((pl) => {
    if (!search && !durumFilter) return true;
    const s = search.toLowerCase();
    const matchesSearch =
      !search || pl.Kod.toLowerCase().includes(s) || pl.Ad.toLowerCase().includes(s);
    const matchesDurum = !durumFilter || pl.Durum === durumFilter;
    return matchesSearch && matchesDurum;
  });

  if (isLoading) {
    return <Loader message="Tarife listesi yükleniyor..." />;
  }

  if (error) {
    return <ErrorMessage message={error.error.message} />;
  }

  if (!filtered || filtered.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">
          {search || durumFilter ? 'Filtre/arama sonucu bulunamadı' : 'Henüz tarife kaydı yok'}
        </p>
        {onCreateList && (
          <button
            onClick={onCreateList}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Tarife Yönetimi</h2>
        {onCreateList && (
          <button
            onClick={onCreateList}
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kod veya ad..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <select
              value={durumFilter}
              onChange={(e) => setDurumFilter(e.target.value as PriceListDurum | '')}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" />
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
              {filtered.map((pl) => {
                const isExpanded = !!expanded[pl.Id];
                const validity = pl.GecerlilikBaslangic
                  ? `${pl.GecerlilikBaslangic} → ${pl.GecerlilikBitis || '—'}`
                  : '—';
                return (
                  <>
                    <tr key={pl.Id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <button
                          onClick={() => toggleExpand(pl.Id)}
                          className="text-gray-500 hover:text-gray-700"
                          aria-label={isExpanded ? 'Daralt' : 'Genişlet'}
                        >
                          {isExpanded ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>
                      </td>
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
                          {onViewList && (
                            <button
                              onClick={() => onViewList(pl)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Görüntüle"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}
                          {onEditList && (
                            <button
                              onClick={() => onEditList(pl)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Düzenle"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteList(pl)}
                            disabled={deleteListMutation.isPending}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Sil"
                          >
                            {deleteListMutation.isPending ? (
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
                    {isExpanded && (
                      <PriceListItemsRow priceListId={pl.Id} priceList={pl} onEditItem={onEditItem} onCreateItem={onCreateItem} onDeleteItem={handleDeleteItem} />
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination placeholder */}
      </div>
    </div>
  );
}

interface PriceListItemsRowProps {
  priceListId: number;
  priceList: PriceList;
  onEditItem?: (item: PriceListItem) => void;
  onCreateItem?: (priceList: PriceList) => void;
  onDeleteItem: (item: PriceListItem) => void;
}

function PriceListItemsRow({ priceListId, priceList, onEditItem, onCreateItem, onDeleteItem }: PriceListItemsRowProps) {
  const { data: items, isLoading, error } = usePriceListItems(priceListId, { enabled: true });

  return (
    <tr className="bg-gray-50">
      <td colSpan={8} className="px-6 py-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">Kalemler ({items?.length || 0})</div>
            {onCreateItem && (
              <button
                onClick={() => onCreateItem(priceList)}
                className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Yeni Kalem
              </button>
            )}
          </div>
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Hizmet Kodu</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Hizmet Adı</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Birim</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Birim Fiyat</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">KDV %</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">Durum</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-gray-500">
                      Kalemler yükleniyor...
                    </td>
                  </tr>
                )}
                {error && (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-red-500">
                      {error.error.message}
                    </td>
                  </tr>
                )}
                {!isLoading && !error && items && items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-gray-400">
                      Kalem bulunmuyor
                    </td>
                  </tr>
                )}
                {items?.map((it) => {
                  const fiyatNum = parseDecimal(it.BirimFiyat);
                  const kdvNum = it.KdvOrani ? parseDecimal(it.KdvOrani) : null;
                  return (
                    <tr key={it.Id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap font-mono">{it.HizmetKodu}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{it.HizmetAdi}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{it.Birim || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        {fiyatNum.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        {kdvNum != null ? kdvNum.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <StatusBadge kind="aktifPasif" value={it.AktifMi} className="text-[10px]" />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onEditItem && (
                            <button
                              onClick={() => onEditItem(it)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Kalemi düzenle"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteItem(it)}
                            disabled={deleteItemMutation.isPending}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Kalemi sil"
                          >
                            {deleteItemMutation.isPending ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </div>
      </td>
    </tr>
  );
}
