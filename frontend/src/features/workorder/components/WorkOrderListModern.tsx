/**
 * WorkOrderListModern
 * İş Emri modern liste komponenti.
 * Özellikler:
 *  - Arama (WoNumber / CariCode / Subject)
 *  - Filtreler: Status, Priority, Type, Tarih aralığı (PlannedStart)
 *  - Durum makinesi butonları (geçerli geçişler)
 *  - Satır genişletme: İlgili WorkOrderItem'ları gösterir
 *  - Silme + onay diyaloğu (prompt tabanlı basit yaklaşım)
 *  - Not girerek durum değişikliği (prompt)
 *  - İstatistik özet (opsiyonel: üst bilgi)
 *
 * State Machine: DRAFT → SUBMITTED → APPROVED → SAHADA → TAMAMLANDI → FATURALANDI → KAPANDI
 * REJECTED ara durum (örn. SUBMITTED sonrası reddedilme)
 */
import { useState, useMemo } from 'react';
import {
  useWorkOrderList,
  useWorkOrderItems,
  useDeleteWorkOrder,
  useChangeWorkOrderStatus,
  useWorkOrderStats,
} from '../../../core/hooks/queries/useWorkOrderQueries';
import type { WorkOrder, WorkOrderStatus, WorkOrderItem } from '../../../shared/types/workorder';
import { Loader } from '../../../shared/ui/Loader';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';

interface WorkOrderListModernProps {
  onView?: (wo: WorkOrder) => void;
  onEdit?: (wo: WorkOrder) => void;
  onCreate?: () => void;
}

const STATUS_FLOW: WorkOrderStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'SAHADA',
  'TAMAMLANDI',
  'FATURALANDI',
  'KAPANDI',
];

function getNextStatuses(current: WorkOrderStatus): WorkOrderStatus[] {
  if (current === 'REJECTED') return ['DRAFT'];
  const idx = STATUS_FLOW.indexOf(current);
  if (idx < 0) return [];
  // Sıradaki tek geçiş + bazı özel geçişler (örn. APPROVED -> SAHADA manuel skip?)
  const next: WorkOrderStatus[] = [];
  if (STATUS_FLOW[idx + 1]) next.push(STATUS_FLOW[idx + 1]);
  // Ek özel: APPROVED → TAMAMLANDI (hızlı kapama), SAHADA → FATURALANDI (iş tamam + fatura) mantığına izin verebilir
  if (current === 'APPROVED') next.push('SAHADA', 'TAMAMLANDI');
  if (current === 'SAHADA') next.push('TAMAMLANDI');
  if (current === 'TAMAMLANDI') next.push('FATURALANDI');
  if (current === 'FATURALANDI') next.push('KAPANDI');
  return Array.from(new Set(next));
}

function statusBadge(status: WorkOrderStatus) {
  const map: Record<WorkOrderStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
    SUBMITTED: 'bg-blue-100 text-blue-700 border-blue-200',
    APPROVED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    SAHADA: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    TAMAMLANDI: 'bg-green-100 text-green-700 border-green-200',
    FATURALANDI: 'bg-purple-100 text-purple-700 border-purple-200',
    KAPANDI: 'bg-gray-200 text-gray-800 border-gray-300',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
  };
  return map[status];
}

export function WorkOrderListModern({ onView, onEdit, onCreate }: WorkOrderListModernProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const { data: workOrders, isLoading, error } = useWorkOrderList({
    page,
    page_size: 50,
    search: search || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    type: typeFilter || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });
  const statsQuery = useWorkOrderStats();
  const deleteMutation = useDeleteWorkOrder();
  const changeStatusMutation = useChangeWorkOrderStatus();

  const filtered = useMemo(() => workOrders || [], [workOrders]);

  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    workOrders?.forEach(w => set.add(w.Type));
    return Array.from(set).sort();
  }, [workOrders]);

  const uniquePriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  const uniqueStatuses: WorkOrderStatus[] = [
    'DRAFT',
    'SUBMITTED',
    'APPROVED',
    'SAHADA',
    'TAMAMLANDI',
    'FATURALANDI',
    'KAPANDI',
    'REJECTED',
  ];

  const handleDelete = (wo: WorkOrder) => {
    if (!confirm(`${wo.WoNumber} iş emrini silmek istiyor musunuz?`)) return;
    deleteMutation.mutate(wo.Id, {
      onError: (err) => alert(`Silme hatası: ${err.error.message}`),
    });
  };

  const handleChangeStatus = (wo: WorkOrder, target: WorkOrderStatus) => {
    const notes = prompt(`${wo.WoNumber} → ${target} geçiş notu (opsiyonel):`) || undefined;
    changeStatusMutation.mutate({ id: wo.Id, status: { Status: target, Notes: notes } }, {
      onError: (err) => alert(`Durum değişikliği hatası: ${err.error.message}`),
    });
  };

  const toggleExpand = (woId: number) => {
    setExpandedRow(prev => (prev === woId ? null : woId));
  };

  if (isLoading) return <Loader message="İş emirleri yükleniyor..." />;
  if (error) return <ErrorMessage message={error.error.message} />;

  if (!filtered.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Kriterlere uygun iş emri bulunamadı.</p>
        <div className="flex justify-center gap-2">
          {onCreate && (
            <button onClick={onCreate} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Yeni İş Emri</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">İş Emirleri</h2>
        <div className="flex flex-wrap gap-2">
          {onCreate && (
            <button onClick={onCreate} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Yeni İş Emri</button>
          )}
        </div>
      </div>

      {/* Stats */}
      {statsQuery.data && (
        <div className="bg-white p-4 rounded-lg shadow text-sm flex flex-wrap gap-4">
          <div className="space-y-1">
            <div className="font-semibold">Toplam: {statsQuery.data.Total}</div>
            <div className="text-xs text-gray-500">Status Dağılımı:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statsQuery.data.ByStatus).map(([st, count]) => (
                <span key={st} className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">{st}: {count}</span>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Öncelik:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statsQuery.data.ByPriority).map(([pr, count]) => (
                <span key={pr} className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">{pr}: {count}</span>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Tip:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statsQuery.data.ByType).map(([tp, count]) => (
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
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="WO numarası, cari kod, konu..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as WorkOrderStatus | ''); setPage(1); }}
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
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
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
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tümü</option>
              {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç (Planned)</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş (Planned)</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
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
                    onDelete={handleDelete}
                    onChangeStatus={handleChangeStatus}
                    onView={onView}
                    onEdit={onEdit}
                    loadingStatus={changeStatusMutation.isPending}
                    loadingDelete={deleteMutation.isPending}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface RowProps {
  wo: WorkOrder;
  nextStatuses: WorkOrderStatus[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: (wo: WorkOrder) => void;
  onChangeStatus: (wo: WorkOrder, target: WorkOrderStatus) => void;
  onView?: (wo: WorkOrder) => void;
  onEdit?: (wo: WorkOrder) => void;
  loadingStatus: boolean;
  loadingDelete: boolean;
}

function Row({
  wo,
  nextStatuses,
  isExpanded,
  onToggleExpand,
  onDelete,
  onChangeStatus,
  onView,
  onEdit,
  loadingStatus,
  loadingDelete,
}: RowProps) {
  const itemsQuery = useWorkOrderItems(wo.Id, { enabled: isExpanded });

  return (
    <>
      <tr className={isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'}>
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
          {wo.WoNumber}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{wo.CariCode} <span className="text-gray-500">– {wo.CariTitle}</span></td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate" title={wo.Subject}>{wo.Subject}</td>
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
          }`}>{wo.Priority}</span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${statusBadge(wo.Status)}`}>{wo.Status}</span>
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
            {nextStatuses.map(ns => (
              <button
                key={ns}
                onClick={() => onChangeStatus(wo, ns)}
                disabled={loadingStatus}
                className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                title={`Durumu '${ns}' yap`}
              >
                {loadingStatus ? '...' : ns}
              </button>
            ))}
            <button
              onClick={() => onDelete(wo)}
              disabled={loadingDelete}
              className="text-red-600 hover:text-red-900 disabled:opacity-50"
              title="Sil"
            >
              {loadingDelete ? (
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
        <tr>
          <td colSpan={8} className="px-6 pb-6">
            <ExpandedItems woId={wo.Id} query={itemsQuery} />
          </td>
        </tr>
      )}
    </>
  );
}

function ExpandedItems({ woId, query }: { woId: number; query: { data?: WorkOrderItem[]; isLoading: boolean; error: any } }) {
  if (query.isLoading) return <div className="py-4 text-sm text-gray-500">Kalemler yükleniyor...</div>;
  if (query.error) return <div className="py-4 text-sm text-red-600">Kalem hata: {query.error.error?.message || 'Bilinmeyen'}</div>;
  if (!query.data || !query.data.length) return <div className="py-4 text-sm text-gray-500">Kalem bulunamadı.</div>;

  return (
    <div className="mt-2 border rounded-lg overflow-hidden">
      <table className="min-w-full text-xs">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-gray-600">Tip</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600">Servis/Kaynak</th>
            <th className="px-3 py-2 text-right font-medium text-gray-600">Miktar</th>
            <th className="px-3 py-2 text-right font-medium text-gray-600">Birim Fiyat</th>
            <th className="px-3 py-2 text-right font-medium text-gray-600">Tutar</th>
            <th className="px-3 py-2 text-right font-medium text-gray-600">KDV</th>
            <th className="px-3 py-2 text-right font-medium text-gray-600">Genel Toplam</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600">Not</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {query.data.map(item => (
            <tr key={item.Id} className="hover:bg-gray-50">
              <td className="px-3 py-2 whitespace-nowrap">{item.ItemType}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                {item.ServiceCode ? `${item.ServiceCode} ${item.ServiceName || ''}` : item.ResourceCode ? `${item.ResourceCode} ${item.ResourceName || ''}` : '—'}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-right">{item.Quantity}</td>
              <td className="px-3 py-2 whitespace-nowrap text-right">{item.UnitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
              <td className="px-3 py-2 whitespace-nowrap text-right">{item.TotalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
              <td className="px-3 py-2 whitespace-nowrap text-right">{item.VatAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
              <td className="px-3 py-2 whitespace-nowrap text-right">{item.GrandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
              <td className="px-3 py-2 whitespace-nowrap max-w-xs truncate" title={item.Notes}>{item.Notes || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
