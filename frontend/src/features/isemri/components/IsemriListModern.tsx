/**
 * İŞ EMRİ LİSTESİ (MODERN) - Gelişmiş Liste Componenti
 * 
 * Özellikler:
 *  - Arama (WONumber / CariCode / Subject)
 *  - Filtreler: Status, Priority, Type, Tarih aralığı (PlannedStart)
 *  - Durum makinesi butonları (geçerli geçişler)
 *  - Satır genişletme: İlgili WorkOrderItem'ları gösterir
 *  - Silme + onay diyaloğu (prompt tabanlı basit yaklaşım)
 *  - Not girerek durum değişikliği (prompt)
 *  - İstatistik özet (üst bilgi)
 *
 * State Machine: DRAFT → SUBMITTED → APPROVED → SAHADA → TAMAMLANDI → FATURALANDI → KAPANDI
 * REJECTED ara durum (örn. SUBMITTED sonrası reddedilme)
 */
import { useState, useMemo } from 'react';
import { Loader } from '../../../shared/ui/Loader';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';
import type { WorkOrder, WorkOrderItem } from '../types/isemri.types';
import { WorkOrderStatus } from '../types/isemri.types';  // FIXED: Enum olarak import
import { useIsemriList, useIsemriStats } from '../hooks/useIsemri';
import { WorkOrderDetail } from './WorkOrderDetail';

interface IsemriListModernProps {
  onView?: (wo: WorkOrder) => void;
  onEdit?: (wo: WorkOrder) => void;
  onCreate?: () => void;
}

const STATUS_FLOW: WorkOrderStatus[] = [
  WorkOrderStatus.DRAFT,
  WorkOrderStatus.SUBMITTED,
  WorkOrderStatus.APPROVED,
  WorkOrderStatus.SAHADA,
  WorkOrderStatus.TAMAMLANDI,
  WorkOrderStatus.FATURALANDI,
  WorkOrderStatus.KAPANDI,
];

function getNextStatuses(current: WorkOrderStatus): WorkOrderStatus[] {
  if (current === WorkOrderStatus.REJECTED) return [WorkOrderStatus.DRAFT];
  const idx = STATUS_FLOW.indexOf(current);
  if (idx < 0) return [];
  
  const next: WorkOrderStatus[] = [];
  if (STATUS_FLOW[idx + 1]) next.push(STATUS_FLOW[idx + 1]);
  
  // Ek özel geçişler
  if (current === WorkOrderStatus.APPROVED) {
    next.push(WorkOrderStatus.SAHADA, WorkOrderStatus.TAMAMLANDI);
  }
  if (current === WorkOrderStatus.SAHADA) {
    next.push(WorkOrderStatus.TAMAMLANDI);
  }
  if (current === WorkOrderStatus.TAMAMLANDI) {
    next.push(WorkOrderStatus.FATURALANDI);
  }
  if (current === WorkOrderStatus.FATURALANDI) {
    next.push(WorkOrderStatus.KAPANDI);
  }
  
  return Array.from(new Set(next));
}

function statusBadge(status: WorkOrderStatus): string {
  const map: Record<WorkOrderStatus, string> = {
    [WorkOrderStatus.DRAFT]: 'bg-gray-100 text-gray-700 border-gray-200',
    [WorkOrderStatus.SUBMITTED]: 'bg-blue-100 text-blue-700 border-blue-200',
    [WorkOrderStatus.APPROVED]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    [WorkOrderStatus.SAHADA]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    [WorkOrderStatus.TAMAMLANDI]: 'bg-green-100 text-green-700 border-green-200',
    [WorkOrderStatus.FATURALANDI]: 'bg-purple-100 text-purple-700 border-purple-200',
    [WorkOrderStatus.KAPANDI]: 'bg-gray-200 text-gray-800 border-gray-300',
    [WorkOrderStatus.REJECTED]: 'bg-red-100 text-red-700 border-red-200',
  };
  return map[status];
}

export function WorkOrderListModern({ onView, onEdit, onCreate }: IsemriListModernProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { isemriList, isLoading, error, refetch } = useIsemriList();
  const { stats } = useIsemriStats();

  const filtered = useMemo(() => {
    let result = isemriList;
    
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(wo =>
        wo.WONumber.toLowerCase().includes(s) ||
        wo.CariCode.toLowerCase().includes(s) ||
        wo.Subject.toLowerCase().includes(s)
      );
    }
    
    if (statusFilter) {
      result = result.filter(wo => wo.Status === statusFilter);
    }
    
    if (priorityFilter) {
      result = result.filter(wo => wo.Priority === priorityFilter);
    }
    
    if (typeFilter) {
      result = result.filter(wo => wo.Type === typeFilter);
    }
    
    if (dateFrom) {
      result = result.filter(wo => wo.PlannedStart && wo.PlannedStart >= dateFrom);
    }
    
    if (dateTo) {
      result = result.filter(wo => wo.PlannedStart && wo.PlannedStart <= dateTo);
    }
    
    return result;
  }, [isemriList, search, statusFilter, priorityFilter, typeFilter, dateFrom, dateTo]);

  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    isemriList.forEach(w => set.add(w.Type));
    return Array.from(set).sort();
  }, [isemriList]);

  const uniquePriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  const uniqueStatuses: WorkOrderStatus[] = Object.values(WorkOrderStatus);

  const toggleExpand = (woId: number) => {
    setExpandedRow(prev => (prev === woId ? null : woId));
  };

  if (isLoading) return <Loader message="İş emirleri yükleniyor..." />;
  if (error) return <ErrorMessage message={error} />;

  if (!filtered.length && (search || statusFilter || priorityFilter || typeFilter || dateFrom || dateTo)) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Kriterlere uygun iş emri bulunamadı.</p>
        <div className="flex justify-center gap-2">
          <button 
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setPriorityFilter('');
              setTypeFilter('');
              setDateFrom('');
              setDateTo('');
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          >
            Filtreleri Temizle
          </button>
          {onCreate && (
            <button onClick={onCreate} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              Yeni İş Emri
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleRowClick = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setIsDetailOpen(true);
  };

  const handleStatusChange = async (newStatus: WorkOrderStatus, notes?: string) => {
    if (!selectedWorkOrder) return;
    
    console.log('Status change:', selectedWorkOrder.WONumber, newStatus, notes);
    // TODO: API call to update status
    setIsDetailOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">İş Emirleri</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={refetch} className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">
            Yenile
          </button>
          {onCreate && (
            <button onClick={onCreate} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              Yeni İş Emri
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-white p-4 rounded-lg shadow text-sm flex flex-wrap gap-4">
          <div className="space-y-1">
            <div className="font-semibold">Toplam: {stats.total_work_orders}</div>
            <div className="text-xs text-gray-500">Status Dağılımı:</div>
            <div className="flex flex-wrap gap-2">
              {stats.by_status && Object.entries(stats.by_status).map(([st, count]) => (
                <span key={st} className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">{st}: {count}</span>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Öncelik:</div>
            <div className="flex flex-wrap gap-2">
              {stats.by_priority && Object.entries(stats.by_priority).map(([pr, count]) => (
                <span key={pr} className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">{pr}: {count}</span>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Tip:</div>
            <div className="flex flex-wrap gap-2">
              {stats.by_type && Object.entries(stats.by_type).map(([tp, count]) => (
                <span key={tp} className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">{tp}: {count}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ara</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="WO numarası, cari kod, konu..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as WorkOrderStatus | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tümü</option>
              {uniqueStatuses.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Öncelik</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tümü</option>
              {uniquePriorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tümü</option>
              {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WO Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cari</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Konu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tip</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Öncelik</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planlanan</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(wo => {
                const nextStatuses = getNextStatuses(wo.Status);
                const isExpanded = expandedRow === wo.Id;
                return (
                  <Row
                    key={wo.Id}
                    wo={wo}
                    nextStatuses={nextStatuses}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleExpand(wo.Id)}
                    onView={onView}
                    onEdit={onEdit}
                    onRowClick={handleRowClick}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detay Modal */}
      <WorkOrderDetail
        workOrder={selectedWorkOrder}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

interface RowProps {
  wo: WorkOrder;
  nextStatuses: WorkOrderStatus[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onView?: (wo: WorkOrder) => void;
  onEdit?: (wo: WorkOrder) => void;
  onRowClick?: (wo: WorkOrder) => void;
}

function Row({ wo, nextStatuses, isExpanded, onToggleExpand, onView, onEdit, onRowClick }: RowProps) {
  return (
    <>
      <tr 
        className={`${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'} cursor-pointer`}
        onClick={() => onRowClick?.(wo)}
      >
        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-700 flex items-center gap-2">
          <button
            onClick={onToggleExpand}
            className="text-gray-500 hover:text-gray-700"
            title={isExpanded ? 'Kapat' : 'Detay'}
          >
            {isExpanded ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          {wo.WONumber}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {wo.CariCode} <span className="text-gray-500">– {wo.CariTitle}</span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate" title={wo.Subject}>
          {wo.Subject}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{wo.Type}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${
            wo.Priority === 'URGENT'
              ? 'bg-red-100 text-red-700 border-red-200'
              : wo.Priority === 'HIGH'
              ? 'bg-orange-100 text-orange-700 border-orange-200'
              : wo.Priority === 'MEDIUM'
              ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
              : 'bg-gray-100 text-gray-700 border-gray-300'
          }`}>
            {wo.Priority}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${statusBadge(wo.Status)}`}>
            {wo.Status}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
          {wo.PlannedStart ? wo.PlannedStart.slice(0, 16).replace('T', ' ') : '—'}<br />
          {wo.PlannedEnd ? wo.PlannedEnd.slice(0, 16).replace('T', ' ') : ''}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
          <div className="flex items-center justify-end gap-2 flex-wrap">
            {onView && (
              <button onClick={() => onView(wo)} className="text-blue-600 hover:text-blue-900" title="Görüntüle">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            )}
            {onEdit && (
              <button onClick={() => onEdit(wo)} className="text-indigo-600 hover:text-indigo-900" title="Düzenle">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={8} className="px-6 pb-6">
            <div className="mt-2 p-4 bg-gray-50 rounded border border-gray-200">
              <div className="text-sm">
                <p><strong>Açıklama:</strong> {wo.Description || '—'}</p>
                <p><strong>Notlar:</strong> {wo.Notes || '—'}</p>
                <p><strong>Kapı Gerekli:</strong> {wo.GateRequired ? 'Evet' : 'Hayır'}</p>
                <p><strong>Saha Kayıt Yetkisi:</strong> {wo.SahaKayitYetkisi ? 'Evet' : 'Hayır'}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ============================================
// COMPONENT EXPORT
// ============================================
