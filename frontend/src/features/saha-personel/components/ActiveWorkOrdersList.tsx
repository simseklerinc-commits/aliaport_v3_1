/**
 * ACTIVE WORK ORDERS LIST
 * Saha Personel Dashboard - Aktif İş Emirleri Listesi
 * 
 * Özellikler:
 *  - Aktif iş emirleri listesi (APPROVED, IN_PROGRESS, COMPLETED)
 *  - İş emri kişi listesi görüntüleme
 *  - İş emri özeti (toplam/onaylı/bekleyen kişi sayısı)
 *  - Kişi bazlı filtreleme (benim iş emirlerim)
 *  - Durum bazlı filtreleme
 *  - Kişi detayları popup (modal)
 *  - Tablet-optimized büyük butonlar
 * 
 * Backend endpoints:
 *  - GET /api/worklog/active-work-orders
 *  - GET /api/worklog/work-order/{work_order_id}/persons
 *  - GET /api/worklog/my-work-orders?personnel_name={name}
 *  - GET /api/worklog/work-order/{work_order_id}/summary
 */

import { useState, useMemo } from 'react';
import { Loader } from '../../../shared/ui/Loader';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';
import type { ActiveWorkOrder, WorkOrderSummary } from '../types/saha.types';
import type { WorkOrderPerson } from '../../isemri/types/workOrderPerson.types';
import { useActiveWorkOrders, useWorkOrderPersons, useWorkOrderSummary } from '../hooks/useSahaPersonel';
import {
  BriefcaseIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

export function ActiveWorkOrdersList() {
  const { workOrders, isLoading, error, refetch } = useActiveWorkOrders();
  
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [selectedWOForSummary, setSelectedWOForSummary] = useState<number | null>(null);

  // Get persons for expanded row
  const { persons: expandedPersons, isLoading: isLoadingPersons } = useWorkOrderPersons(expandedRow ?? 0);
  
  // Get summary for selected work order
  const { summary, isLoading: isLoadingSummary } = useWorkOrderSummary(selectedWOForSummary ?? 0);

  // Filter work orders
  const filtered = useMemo(() => {
    let result = workOrders;
    
    if (statusFilter) {
      result = result.filter(wo => wo.Status === statusFilter);
    }
    
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(wo =>
        wo.WONumber.toLowerCase().includes(s) ||
        wo.CariCode.toLowerCase().includes(s) ||
        wo.CariTitle.toLowerCase().includes(s) ||
        wo.Subject.toLowerCase().includes(s)
      );
    }
    
    return result;
  }, [workOrders, statusFilter, search]);

  // Unique statuses
  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    workOrders.forEach(w => set.add(w.Status));
    return Array.from(set).sort();
  }, [workOrders]);

  // Toggle row expansion
  const toggleExpand = (woId: number) => {
    setExpandedRow(prev => (prev === woId ? null : woId));
  };

  // Status badge color
  const statusBadge = (status: string): string => {
    const map: Record<string, string> = {
      'APPROVED': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'SAHADA': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'COMPLETED': 'bg-green-100 text-green-700 border-green-200',
      'TAMAMLANDI': 'bg-green-100 text-green-700 border-green-200',
    };
    return map[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (isLoading) return <Loader message="Aktif iş emirleri yükleniyor..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-6 bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 text-white p-4 rounded-full">
              <BriefcaseIcon className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Aktif İş Emirleri</h1>
              <p className="text-gray-600">Saha Personel Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{filtered.length}</div>
              <div className="text-sm text-gray-500">Aktif İş Emri</div>
            </div>
            
            <button
              onClick={() => refetch()}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Yenile"
            >
              <ArrowPathIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <FunnelIcon className="w-6 h-6 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Arama (İş Emri / Cari / Konu)</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg"
              placeholder="Ara..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg"
            >
              <option value="">Tümü</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Work Orders List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <BriefcaseIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-500">Aktif iş emri bulunamadı</p>
          {(search || statusFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((wo) => (
            <div
              key={wo.Id}
              className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-colors"
            >
              {/* Work Order Header */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 text-blue-700 p-3 rounded-lg">
                      <BriefcaseIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{wo.WONumber}</h3>
                      <p className="text-gray-600">{wo.CariTitle} ({wo.CariCode})</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-lg border-2 font-semibold ${statusBadge(wo.Status)}`}>
                      {wo.Status}
                    </span>
                    
                    <button
                      onClick={() => toggleExpand(wo.Id)}
                      className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {expandedRow === wo.Id ? (
                        <ChevronUpIcon className="w-6 h-6" />
                      ) : (
                        <ChevronDownIcon className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Konu</p>
                    <p className="text-lg font-medium text-gray-900">{wo.Subject}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Öncelik</p>
                    <p className="text-lg font-medium text-gray-900">{wo.Priority || '-'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Plan Başlangıç</p>
                    <p className="text-lg font-medium text-gray-900">
                      {wo.PlannedStart ? new Date(wo.PlannedStart).toLocaleDateString('tr-TR') : '-'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Kişi Sayısı</p>
                    <p className="text-lg font-medium text-blue-600 flex items-center gap-2">
                      <UsersIcon className="w-5 h-5" />
                      {wo.PersonCount ?? 0}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedWOForSummary(wo.Id)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
                >
                  İş Emri Özeti Görüntüle
                </button>
              </div>

              {/* Expanded Persons List */}
              {expandedRow === wo.Id && (
                <div className="border-t-2 border-gray-200 bg-gray-50 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <UsersIcon className="w-6 h-6 text-blue-600" />
                    <h4 className="text-xl font-semibold text-gray-900">Kişi Listesi</h4>
                  </div>
                  
                  {isLoadingPersons ? (
                    <Loader message="Kişiler yükleniyor..." />
                  ) : expandedPersons.length === 0 ? (
                    <p className="text-gray-500">Bu iş emrinde henüz kişi eklenmemiş.</p>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ad Soyad</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">TC Kimlik</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pasaport</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Uyruk</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Güvenlik Onayı</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Giriş</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {expandedPersons.map((person) => (
                            <tr key={person.Id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{person.FullName}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                                {person.TcKimlikNo || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                                {person.PassportNo || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{person.Nationality || '-'}</td>
                              <td className="px-4 py-3 text-sm">
                                {person.ApprovedBySecurity ? (
                                  <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircleIcon className="w-5 h-5" />
                                    <span>Onaylı</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-yellow-600">
                                    <ClockIcon className="w-5 h-5" />
                                    <span>Bekliyor</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                                {person.GateEntryTime ? (
                                  new Date(person.GateEntryTime).toLocaleString('tr-TR')
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary Modal */}
      {selectedWOForSummary && summary && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6"
          onClick={() => setSelectedWOForSummary(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">İş Emri Özeti</h2>
              <button
                onClick={() => setSelectedWOForSummary(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-8 h-8" />
              </button>
            </div>
            
            {isLoadingSummary ? (
              <Loader message="Özet yükleniyor..." />
            ) : (
              <div className="space-y-6">
                {/* Work Order Details */}
                <div className="grid grid-cols-2 gap-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <div>
                    <p className="text-sm text-gray-600">İş Emri No</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.work_order.WONumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Durum</p>
                    <span className={`inline-block px-4 py-2 rounded-lg border-2 font-semibold ${statusBadge(summary.work_order.Status)}`}>
                      {summary.work_order.Status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cari</p>
                    <p className="text-lg font-medium text-gray-900">{summary.work_order.CariTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Konu</p>
                    <p className="text-lg font-medium text-gray-900">{summary.work_order.Subject}</p>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
                    <UsersIcon className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-gray-900">{summary.total_persons}</div>
                    <div className="text-sm text-gray-500">Toplam Kişi</div>
                  </div>
                  
                  <div className="bg-white border-2 border-green-200 rounded-lg p-4 text-center">
                    <CheckCircleIcon className="w-10 h-10 text-green-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-green-600">{summary.approved_persons}</div>
                    <div className="text-sm text-gray-500">Onaylı</div>
                  </div>
                  
                  <div className="bg-white border-2 border-yellow-200 rounded-lg p-4 text-center">
                    <ClockIcon className="w-10 h-10 text-yellow-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-yellow-600">{summary.pending_persons}</div>
                    <div className="text-sm text-gray-500">Bekliyor</div>
                  </div>
                  
                  <div className="bg-white border-2 border-purple-200 rounded-lg p-4 text-center">
                    <BriefcaseIcon className="w-10 h-10 text-purple-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-purple-600">{summary.worklogs_count}</div>
                    <div className="text-sm text-gray-500">Worklog Kayıtları</div>
                  </div>
                </div>

                {/* Person List Summary */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Kişi Listesi</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ad Soyad</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Kimlik</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Onay</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {summary.persons.map((person) => (
                          <tr key={person.Id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{person.FullName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                              {person.TcKimlikNo || person.PassportNo || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {person.ApprovedBySecurity ? (
                                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                              ) : (
                                <ClockIcon className="w-5 h-5 text-yellow-600" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
