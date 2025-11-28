/**
 * KURLAR MODULE - Modern Exchange Rate List
 */

import { useMemo, useState } from 'react';
import {
  useExchangeRateList,
  useFetchEVDSRates,
  useDeleteExchangeRate,
  useCreateExchangeRate,
} from '../../../core/hooks/queries/useKurlarQueries';
import type { ExchangeRate } from '../../../shared/types/kurlar';
import { Loader } from '../../../shared/ui/Loader';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';

interface ExchangeRateListModernProps {
  onViewRate?: (rate: ExchangeRate) => void;
  onEditRate?: (rate: ExchangeRate) => void;
}

export function ExchangeRateListModern({ onViewRate, onEditRate }: ExchangeRateListModernProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [currencyFrom, setCurrencyFrom] = useState('');
  const [currencyTo, setCurrencyTo] = useState('');
  const [rateDate, setRateDate] = useState('');
  const [showBanknote, setShowBanknote] = useState(true);
  const [fetchDate, setFetchDate] = useState('');

  const { data: rates, isLoading, error } = useExchangeRateList({
    page,
    page_size: 50,
    currency_from: currencyFrom || undefined,
    currency_to: currencyTo || undefined,
    rate_date: rateDate || undefined,
  });

  const fetchEvdsMutation = useFetchEVDSRates();
  const deleteMutation = useDeleteExchangeRate();
  const createMutation = useCreateExchangeRate();

  const uniqueFrom = useMemo(() => {
    if (!Array.isArray(rates)) return [];
    const set = new Set<string>();
    rates?.forEach(r => set.add(r.CurrencyFrom));
    return Array.from(set).sort();
  }, [rates]);

  const uniqueTo = useMemo(() => {
    if (!Array.isArray(rates)) return [];
    const set = new Set<string>();
    rates?.forEach(r => set.add(r.CurrencyTo));
    return Array.from(set).sort();
  }, [rates]);

  const latestDate = useMemo(() => {
    if (!rates || !Array.isArray(rates) || rates.length === 0) return undefined;
    return rates.map(r => r.RateDate).sort().reverse()[0];
  }, [rates]);

  const filtered = (Array.isArray(rates) ? rates : []).filter(r => {
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

  const handleFetchEvds = () => {
    const d = fetchDate || undefined;
    const curr = currencyFrom ? [currencyFrom] : undefined;
    fetchEvdsMutation.mutate({ date: d, currencies: curr }, {
      onError: (err) => alert(`EVDS çekme hatası: ${err.error.message}`),
    });
  };

  const handleQuickManualAdd = () => {
    const cf = prompt('Kaynak para birimi (örn: USD):');
    if (!cf) return;
    const ct = prompt('Hedef para birimi (örn: TRY):', 'TRY');
    if (!ct) return;
    const rateStr = prompt('Döviz Alış Kuru:');
    if (!rateStr) return;
    const rateNum = Number(rateStr.replace(',', '.'));
    if (Number.isNaN(rateNum)) {
      alert('Geçersiz kur değeri');
      return;
    }
    const sellStr = prompt('Döviz Satış Kuru (opsiyonel):');
    const sellNum = sellStr ? Number(sellStr.replace(',', '.')) : undefined;
    const bnBuyStr = prompt('Efektif Alış Kuru (opsiyonel):');
    const bnBuyNum = bnBuyStr ? Number(bnBuyStr.replace(',', '.')) : undefined;
    const bnSellStr = prompt('Efektif Satış Kuru (opsiyonel):');
    const bnSellNum = bnSellStr ? Number(bnSellStr.replace(',', '.')) : undefined;
    const dateStr = rateDate || new Date().toISOString().slice(0, 10);
    createMutation.mutate({
      CurrencyFrom: cf.toUpperCase(),
      CurrencyTo: ct.toUpperCase(),
      Rate: rateNum,
      SellRate: sellNum,
      BanknoteBuyingRate: bnBuyNum,
      BanknoteSellRate: bnSellNum,
      RateDate: dateStr,
      Source: 'MANUAL'
    }, {
      onError: (err) => alert(`Oluşturma hatası: ${err.error.message}`),
    });
  };

  const getSourceBadge = (source?: string) => {
    if (!source) return null;
    const colors: Record<string, string> = {
      EVDS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      TCMB: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      MANUAL: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors[source] || 'bg-gray-100 text-gray-800'}`}>
        {source}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader message="Kurlar yükleniyor" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error.error.message} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 dark:from-blue-800 dark:via-blue-900 dark:to-indigo-900 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">Döviz Kurları</h1>
              <p className="text-blue-100 text-sm">EVDS API entegrasyonu ile güncel kurlar</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBanknote(!showBanknote)}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                showBanknote 
                  ? 'bg-white text-blue-700 shadow-lg scale-105' 
                  : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
              }`}
            >
              📊 Efektif {showBanknote && '✓'}
            </button>
            <button
              onClick={handleQuickManualAdd}
              disabled={createMutation.isPending}
              className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              + Manuel Kur
            </button>
          </div>
        </div>

        {/* EVDS Section */}
        <div className="mt-6 pt-6 border-t border-white/20">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-medium text-blue-100">EVDS Güncelleme:</label>
            <input
              type="date"
              value={fetchDate}
              onChange={(e) => setFetchDate(e.target.value)}
              className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
            />
            <button
              onClick={handleFetchEvds}
              disabled={fetchEvdsMutation.isPending}
              className="px-5 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-medium transition-all disabled:opacity-50 border border-white/30"
            >
              {fetchEvdsMutation.isPending ? '⏳ Çekiliyor...' : '🔄 EVDS Güncelle'}
            </button>
            {fetchEvdsMutation.isSuccess && <span className="text-sm text-green-200">✓ Başarılı!</span>}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-5">
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filtreler</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ara</label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="USD, EUR, EVDS..."
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kaynak</label>
            <select
              value={currencyFrom}
              onChange={(e) => { setCurrencyFrom(e.target.value); setPage(1); }}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Tümü</option>
              {uniqueFrom.map(cf => <option key={cf} value={cf}>{cf}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hedef</label>
            <select
              value={currencyTo}
              onChange={(e) => { setCurrencyTo(e.target.value); setPage(1); }}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Tümü</option>
              {uniqueTo.map(ct => <option key={ct} value={ct}>{ct}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tarih</label>
            <input
              type="date"
              value={rateDate}
              onChange={(e) => { setRateDate(e.target.value); setPage(1); }}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        </div>
        {(search || currencyFrom || currencyTo || rateDate) && (
          <button
            onClick={() => { setSearch(''); setCurrencyFrom(''); setCurrencyTo(''); setRateDate(''); setPage(1); }}
            className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Filtreleri Temizle
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {search || currencyFrom || currencyTo || rateDate ? 'Sonuç bulunamadı' : 'Henüz kur kaydı yok'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {search || currencyFrom || currencyTo || rateDate ? 'Farklı filtreler deneyin' : 'EVDS\'den kur çekin veya manuel ekleyin'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Döviz Çifti</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Döviz Alış</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Döviz Satış</th>
                  {showBanknote && (
                    <>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Efektif Alış</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Efektif Satış</th>
                    </>
                  )}
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Tarih</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Kaynak</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map((rate) => {
                  const isLatest = rate.RateDate === latestDate;
                  return (
                    <tr 
                      key={rate.Id}
                      className={`transition-colors ${isLatest ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{rate.CurrencyFrom}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{rate.CurrencyTo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{rate.Rate?.toFixed(4) || '—'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{rate.SellRate?.toFixed(4) || '—'}</span>
                      </td>
                      {showBanknote && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{rate.BanknoteBuyingRate?.toFixed(4) || '—'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{rate.BanknoteSellRate?.toFixed(4) || '—'}</span>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{rate.RateDate}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">{getSourceBadge(rate.Source)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleDelete(rate)}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 disabled:opacity-50 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          title="Sil"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700/30 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Toplam <span className="font-semibold text-gray-900 dark:text-white">{filtered.length}</span> kur
              </span>
              {latestDate && (
                <span className="text-gray-600 dark:text-gray-400">
                  En güncel: <span className="font-semibold text-gray-900 dark:text-white">{latestDate}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
