/**
 * KURLAR MODULE - Modern Exchange Rate List Component
 *
 * Özellikler:
 *  - Arama (CurrencyFrom / CurrencyTo / Source)
 *  - Döviz çifti filtre (CurrencyFrom, CurrencyTo ayrı select)
 *  - Tarih filtre (RateDate)
 *  - TCMB'den güncel kurları çekme (useFetchTCMBRates)
 *  - Satış kuru gösterimi (SellRate) mevcutsa
 *  - En güncel tarih satırlarını vurgulama (highlight)
 *  - Silme (useDeleteExchangeRate)
 *  - Hızlı manuel kur ekleme (prompt tabanlı - ileride form ile değiştirilecek)
 *  - Pagination placeholder (backend meta hazır olduğunda SimplePagination entegre edilecek)
 *
 * @see core/hooks/queries/useKurlarQueries.ts
 */

import { useMemo, useState } from 'react';
import {
  useExchangeRateList,
  useFetchTCMBRates,
  useDeleteExchangeRate,
  useCreateExchangeRate,
} from '../../../core/hooks/queries/useKurlarQueries';
import type { ExchangeRate } from '../../../shared/types/kurlar';
import { Loader } from '../../../shared/ui/Loader';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';

interface ExchangeRateListModernProps {
  onViewRate?: (rate: ExchangeRate) => void;
  onEditRate?: (rate: ExchangeRate) => void;
  onCreateAdvanced?: () => void; // Gelişmiş form açmak istenirse
}

export function ExchangeRateListModern({ onViewRate, onEditRate, onCreateAdvanced }: ExchangeRateListModernProps) {
  const [page, setPage] = useState(1); // backend pagination meta entegrasyonu sonrası
  const [search, setSearch] = useState('');
  const [currencyFrom, setCurrencyFrom] = useState('');
  const [currencyTo, setCurrencyTo] = useState('');
  const [rateDate, setRateDate] = useState('');

  const { data: rates, isLoading, error } = useExchangeRateList({
    page,
    page_size: 50,
    currency_from: currencyFrom || undefined,
    currency_to: currencyTo || undefined,
    rate_date: rateDate || undefined,
  });

  const fetchTcmbMutation = useFetchTCMBRates();
  const deleteMutation = useDeleteExchangeRate();
  const createMutation = useCreateExchangeRate();

  const uniqueFrom = useMemo(() => {
    const set = new Set<string>();
    rates?.forEach(r => set.add(r.CurrencyFrom));
    return Array.from(set).sort();
  }, [rates]);

  const uniqueTo = useMemo(() => {
    const set = new Set<string>();
    rates?.forEach(r => set.add(r.CurrencyTo));
    return Array.from(set).sort();
  }, [rates]);

  const latestDate = useMemo(() => {
    if (!rates || rates.length === 0) return undefined;
    return rates.map(r => r.RateDate).sort().reverse()[0];
  }, [rates]);

  const filtered = (rates || []).filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.CurrencyFrom.toLowerCase().includes(s) ||
      r.CurrencyTo.toLowerCase().includes(s) ||
      (r.Source?.toLowerCase().includes(s) ?? false)
    );
  });

  const handleDelete = (rate: ExchangeRate) => {
    if (!confirm(`${rate.CurrencyFrom}/${rate.CurrencyTo} - ${rate.RateDate} kurunu silmek istiyor musunuz?`)) return;
    deleteMutation.mutate(rate.Id, {
      onError: (err) => alert(`Silme hatası: ${err.error.message}`),
    });
  };

  const handleFetchTcmb = () => {
    const d = rateDate || undefined; // Belirli tarih seçildiyse onu kullan
    fetchTcmbMutation.mutate({ date: d }, {
      onError: (err) => alert(`TCMB çekme hatası: ${err.error.message}`),
    });
  };

  const handleQuickCreate = () => {
    const cf = prompt('Kaynak para birimi (örn: USD):');
    if (!cf) return;
    const ct = prompt('Hedef para birimi (örn: TRY):') || 'TRY';
    const rateStr = prompt('Kur (alış):');
    if (!rateStr) return;
    const rateNum = Number(rateStr.replace(',', '.'));
    if (Number.isNaN(rateNum)) {
      alert('Geçersiz kur değeri');
      return;
    }
    const sellStr = prompt('Satış kuru (opsiyonel):');
    const sellNum = sellStr ? Number(sellStr.replace(',', '.')) : undefined;
    const dateStr = rateDate || new Date().toISOString().slice(0, 10);
    createMutation.mutate({
      CurrencyFrom: cf.toUpperCase(),
      CurrencyTo: ct.toUpperCase(),
      Rate: rateNum,
      SellRate: sellNum,
      RateDate: dateStr,
      Source: 'MANUAL'
    }, {
      onError: (err) => alert(`Oluşturma hatası: ${err.error.message}`),
    });
  };

  if (isLoading) {
    return <Loader message="Kurlar yükleniyor..." />;
  }

  if (error) {
    return <ErrorMessage message={error.error.message} />;
  }

  if (!filtered || filtered.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">{search || currencyFrom || currencyTo || rateDate ? 'Filtre/arama sonucu yok' : 'Henüz kur kaydı yok'}</p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleFetchTcmb}
            disabled={fetchTcmbMutation.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {fetchTcmbMutation.isPending ? 'Çekiliyor...' : 'TCMB Kurlarını Çek'}
          </button>
          <button
            onClick={handleQuickCreate}
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Oluşturuluyor...' : 'Manuel Kur Ekle'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Döviz Kurları</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleFetchTcmb}
            disabled={fetchTcmbMutation.isPending}
            className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm disabled:opacity-50"
          >
            {fetchTcmbMutation.isPending ? 'TCMB Çekiliyor...' : 'TCMB Güncelle'}
          </button>
          <button
            onClick={handleQuickCreate}
            disabled={createMutation.isPending}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {createMutation.isPending ? 'Ekleniyor...' : 'Manuel Kur'}
          </button>
          {onCreateAdvanced && (
            <button
              onClick={onCreateAdvanced}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Gelişmiş Oluştur
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ara</label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="USD, TCMB veya TRY..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kaynak (From)</label>
            <select
              value={currencyFrom}
              onChange={(e) => { setCurrencyFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tümü</option>
              {uniqueFrom.map(cf => <option key={cf} value={cf}>{cf}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hedef (To)</label>
            <select
              value={currencyTo}
              onChange={(e) => { setCurrencyTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tümü</option>
              {uniqueTo.map(ct => <option key={ct} value={ct}>{ct}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
            <input
              type="date"
              value={rateDate}
              onChange={(e) => { setRateDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="text-xs text-gray-500">
          En güncel tarih: <span className="font-semibold">{latestDate || '—'}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pair</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Alış (Rate)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Satış (Sell)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kaynak</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(rate => {
                const isLatest = rate.RateDate === latestDate;
                return (
                  <tr key={rate.Id} className={isLatest ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {rate.CurrencyFrom}/{rate.CurrencyTo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {rate.Rate.toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                      {rate.SellRate != null ? rate.SellRate.toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{rate.RateDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                        rate.Source === 'TCMB'
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                          : rate.Source === 'MANUAL'
                          ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      }`}>{rate.Source || '—'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onViewRate && (
                          <button
                            onClick={() => onViewRate(rate)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Görüntüle"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                        {onEditRate && (
                          <button
                            onClick={() => onEditRate(rate)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Düzenle"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(rate)}
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
        {/* Pagination placeholder */}
      </div>
    </div>
  );
}
