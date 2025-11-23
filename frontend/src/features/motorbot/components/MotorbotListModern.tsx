/**
 * MOTORBOT MODULE - Modern Motorbot List Component
 *
 * Özellikler:
 *  - Arama (Kod / Ad / Plaka / CariKod)
 *  - Durum filtresi (AKTIF / PASIF / BAKIMDA)
 *  - Expand satır ile ilgili seferler (MbTrip) alt tablosu
 *  - Durum hızlı güncelleme (useUpdateMotorbotStatus)
 *  - Silme (useDeleteMotorbot)
 *  - Sefer alt tablosunda: Durum badge'leri + tarih/saat gösterimi
 *  - Yeni Motorbot / Yeni Sefer butonları (callback placeholder)
 *  - Pagination placeholder (backend meta sonrası entegre edilecek)
 *
 * @see core/hooks/queries/useMotorbotQueries.ts
 */

import { useState } from 'react';
import {
  useMotorbotList,
  useMotorbotTrips,
  useUpdateMotorbotStatus,
  useDeleteMotorbot,
  useDeleteMbTrip,
} from '../../../core/hooks/queries/useMotorbotQueries';
import type { Motorbot, MbTrip } from '../../../shared/types/motorbot';
import { Loader } from '../../../shared/ui/Loader';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';
import { dateTimeToLocal } from '../../../core/utils/date';

interface MotorbotListModernProps {
  onCreateMotorbot?: () => void;
  onEditMotorbot?: (mb: Motorbot) => void;
  onViewMotorbot?: (mb: Motorbot) => void;
  onCreateTrip?: (motorbot: Motorbot) => void;
  onEditTrip?: (trip: MbTrip) => void;
  onViewTrip?: (trip: MbTrip) => void;
}

export function MotorbotListModern({
  onCreateMotorbot,
  onEditMotorbot,
  onViewMotorbot,
  onCreateTrip,
  onEditTrip,
  onViewTrip,
}: MotorbotListModernProps) {
  const [page, setPage] = useState(1); // backend pagination meta entegrasyonu sonrası
  const [search, setSearch] = useState('');
  const [durumFilter, setDurumFilter] = useState<string>('');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const { data: motorbots, isLoading, error } = useMotorbotList({
    page,
    page_size: 20,
    search: search || undefined,
    durum: durumFilter || undefined,
  });

  const updateStatusMutation = useUpdateMotorbotStatus();
  const deleteMotorbotMutation = useDeleteMotorbot();
  const deleteTripMutation = useDeleteMbTrip();

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStatusChange = (mb: Motorbot) => {
    const next = mb.Durum === 'AKTIF' ? 'BAKIMDA' : mb.Durum === 'BAKIMDA' ? 'PASIF' : 'AKTIF';
    updateStatusMutation.mutate({ id: mb.Id, durum: next }, {
      onError: (err) => alert(`Durum güncelleme hatası: ${err.error.message}`),
    });
  };

  const handleDeleteMotorbot = (mb: Motorbot) => {
    if (!confirm(`Motorbot silinsin mi? (${mb.Kod} - ${mb.Ad})`)) return;
    deleteMotorbotMutation.mutate(mb.Id, {
      onError: (err) => alert(`Silme hatası: ${err.error.message}`),
    });
  };

  const handleDeleteTrip = (trip: MbTrip) => {
    if (!confirm(`Sefer silinsin mi? (${trip.HizmetKodu ?? trip.Id})`)) return;
    deleteTripMutation.mutate(trip.Id, {
      onError: (err) => alert(`Sefer silme hatası: ${err.error.message}`),
    });
  };

  const filtered = (motorbots || []).filter((mb) => {
    const matchesDurum = !durumFilter || mb.Durum === durumFilter;
    const s = search.toLowerCase();
    const matchesSearch =
      !search ||
      mb.Kod.toLowerCase().includes(s) ||
      mb.Ad.toLowerCase().includes(s) ||
      (mb.Plaka?.toLowerCase().includes(s) ?? false) ||
      (mb.OwnerCariKod?.toLowerCase().includes(s) ?? false);
    return matchesDurum && matchesSearch;
  });

  if (isLoading) {
    return <Loader message="Motorbot listesi yükleniyor..." />;
  }

  if (error) {
    return <ErrorMessage message={error.error.message} />;
  }

  if (!filtered || filtered.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">
          {search || durumFilter ? 'Filtre/arama sonucu yok' : 'Henüz motorbot kaydı yok'}
        </p>
        {onCreateMotorbot && (
          <button
            onClick={onCreateMotorbot}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            İlk Motorbot Kaydını Oluştur
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Motorbot Yönetimi</h2>
        {onCreateMotorbot && (
          <button
            onClick={onCreateMotorbot}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Motorbot
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
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Kod, ad, plaka veya cari kod..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <select
              value={durumFilter}
              onChange={(e) => { setDurumFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tümü</option>
              <option value="AKTIF">Aktif</option>
              <option value="PASIF">Pasif</option>
              <option value="BAKIMDA">Bakımda</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sahibi (CariKod - yakında)</label>
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
                <th className="px-6 py-3" />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kod</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plaka</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Kapasite (ton)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Max Hız (knot)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sahip Cari</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((mb) => {
                const isExpanded = !!expanded[mb.Id];
                return (
                  <>
                    <tr key={mb.Id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <button
                          onClick={() => toggleExpand(mb.Id)}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{mb.Kod}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{mb.Ad}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{mb.Plaka || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">{mb.KapasiteTon != null ? mb.KapasiteTon.toLocaleString('tr-TR') : '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">{mb.MaxHizKnot != null ? mb.MaxHizKnot.toLocaleString('tr-TR') : '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{mb.OwnerCariKod || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <button
                          onClick={() => handleStatusChange(mb)}
                          disabled={updateStatusMutation.isPending}
                          className={`px-2 py-1 text-xs font-semibold rounded-full border transition-colors disabled:opacity-50 ${
                            mb.Durum === 'AKTIF'
                              ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                              : mb.Durum === 'BAKIMDA'
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200'
                              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                          }`}
                          title="Durum döngüsü (Aktif→Bakımda→Pasif→Aktif)"
                        >
                          {mb.Durum === 'AKTIF' ? 'Aktif' : mb.Durum === 'BAKIMDA' ? 'Bakımda' : 'Pasif'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onViewMotorbot && (
                            <button
                              onClick={() => onViewMotorbot(mb)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Görüntüle"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}
                          {onEditMotorbot && (
                            <button
                              onClick={() => onEditMotorbot(mb)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Düzenle"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMotorbot(mb)}
                            disabled={deleteMotorbotMutation.isPending}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Sil"
                          >
                            {deleteMotorbotMutation.isPending ? (
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
                      <MotorbotTripsRow
                        motorbotId={mb.Id}
                        motorbot={mb}
                        onCreateTrip={onCreateTrip}
                        onEditTrip={onEditTrip}
                        onViewTrip={onViewTrip}
                        onDeleteTrip={handleDeleteTrip}
                      />
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

interface MotorbotTripsRowProps {
  motorbotId: number;
  motorbot: Motorbot;
  onCreateTrip?: (motorbot: Motorbot) => void;
  onEditTrip?: (trip: MbTrip) => void;
  onViewTrip?: (trip: MbTrip) => void;
  onDeleteTrip: (trip: MbTrip) => void;
}

function MotorbotTripsRow({ motorbotId, motorbot, onCreateTrip, onEditTrip, onViewTrip, onDeleteTrip }: MotorbotTripsRowProps) {
  const { data: trips, isLoading, error } = useMotorbotTrips(motorbotId, { enabled: true });

  return (
    <tr className="bg-gray-50">
      <td colSpan={9} className="px-6 py-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">Seferler ({trips?.length || 0})</div>
            {onCreateTrip && (
              <button
                onClick={() => onCreateTrip(motorbot)}
                className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Yeni Sefer
              </button>
            )}
          </div>
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Sefer Tarihi</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Kalkış</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Varış</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Yük</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Cari</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">Durum</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">Fatura</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-center text-gray-500">Seferler yükleniyor...</td>
                  </tr>
                )}
                {error && (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-center text-red-500">{error.error.message}</td>
                  </tr>
                )}
                {!isLoading && !error && trips && trips.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-center text-gray-400">Sefer bulunmuyor</td>
                  </tr>
                )}
                {trips?.map((t) => {
                  const durumColor =
                    t.Durum === 'PLANLANDI'
                      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      : t.Durum === 'DEVAM_EDIYOR'
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : t.Durum === 'TAMAMLANDI'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-red-100 text-red-700 border-red-200';
                  const faturaColor =
                    t.FaturaDurumu === 'FATURA_BEKLIYOR'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      : t.FaturaDurumu === 'FATURALANDI'
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                      : t.FaturaDurumu === 'ODENDI'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200';
                  return (
                    <tr key={t.Id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap font-mono">{t.SeferTarihi}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{t.CikisZamani ? dateTimeToLocal(t.CikisZamani) : '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{t.DonusZamani ? dateTimeToLocal(t.DonusZamani) : '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-700">{t.YukAciklama || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-700">{t.CariKod || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-[10px] font-semibold rounded-full border ${durumColor}`}>{
                          t.Durum === 'PLANLANDI'
                            ? 'Planlandı'
                            : t.Durum === 'DEVAM_EDIYOR'
                            ? 'Devam Ediyor'
                            : t.Durum === 'TAMAMLANDI'
                            ? 'Tamamlandı'
                            : 'İptal'
                        }</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-[10px] font-semibold rounded-full border ${faturaColor}`}>{
                          t.FaturaDurumu === 'FATURA_BEKLIYOR'
                            ? 'Fatura Bekliyor'
                            : t.FaturaDurumu === 'FATURALANDI'
                            ? 'Faturalandı'
                            : t.FaturaDurumu === 'ODENDI'
                            ? 'Ödendi'
                            : '—'
                        }</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onViewTrip && (
                            <button
                              onClick={() => onViewTrip(t)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Görüntüle"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}
                          {onEditTrip && (
                            <button
                              onClick={() => onEditTrip(t)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Düzenle"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteTrip(t)}
                            disabled={deleteTripMutation.isPending}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Sil"
                          >
                            {deleteTripMutation.isPending ? (
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
