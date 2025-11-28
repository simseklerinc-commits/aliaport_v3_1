// frontend/src/features/portal/components/WorkOrderTrackingList.tsx
import React, { useState, useEffect } from 'react';
import { portalWorkOrderService, type WorkOrderResponse } from '../services/portalWorkOrderService';
import { toast } from 'sonner';
import { 
  FileText, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';

const STATUS_CONFIG = {
  DRAFT: { label: 'Taslak', color: 'bg-gray-100 text-gray-700', icon: FileText },
  SUBMITTED: { label: 'Gönderildi', color: 'bg-blue-100 text-blue-700', icon: Clock },
  PENDING_APPROVAL: { label: 'Onay Bekliyor', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  APPROVED: { label: 'Onaylandı', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  IN_PROGRESS: { label: 'Devam Ediyor', color: 'bg-blue-100 text-blue-700', icon: Clock },
  COMPLETED: { label: 'Tamamlandı', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  INVOICED: { label: 'Faturalandı', color: 'bg-purple-100 text-purple-700', icon: FileText },
  CLOSED: { label: 'Kapatıldı', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  REJECTED: { label: 'Reddedildi', color: 'bg-red-100 text-red-700', icon: XCircle },
  SAHADA: { label: 'Sahada', color: 'bg-blue-100 text-blue-700', icon: Clock },
  TAMAMLANDI: { label: 'Tamamlandı', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  FATURALANDI: { label: 'Faturalandı', color: 'bg-purple-100 text-purple-700', icon: FileText },
  KAPANDI: { label: 'Kapatıldı', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
};

const PRIORITY_CONFIG = {
  LOW: { label: 'Düşük', color: 'text-gray-600' },
  MEDIUM: { label: 'Orta', color: 'text-blue-600' },
  HIGH: { label: 'Yüksek', color: 'text-orange-600' },
  URGENT: { label: 'Acil', color: 'text-red-600' },
};

export const WorkOrderTrackingList: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderResponse | null>(null);

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const loadWorkOrders = async () => {
    setIsLoading(true);
    try {
      const data = await portalWorkOrderService.getMyWorkOrders();
      setWorkOrders(data);
    } catch (error: any) {
      toast.error('Talepler yüklenemedi');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredWorkOrders = workOrders.filter((wo) => {
    const matchesSearch = 
      wo.wo_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || wo.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  const getPriorityText = (priority: string) => {
    const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.MEDIUM;
    return <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Talepleriniz yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Taleplerim</h1>
          <p className="text-gray-600 mt-1">
            Toplam {workOrders.length} talep
          </p>
        </div>
        <button
          onClick={loadWorkOrders}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Yenile
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="WO numarası veya konu ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:w-64">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="DRAFT">Taslak</option>
              <option value="SUBMITTED">Gönderildi</option>
              <option value="PENDING_APPROVAL">Onay Bekliyor</option>
              <option value="APPROVED">Onaylandı</option>
              <option value="IN_PROGRESS">Devam Ediyor</option>
              <option value="COMPLETED">Tamamlandı</option>
              <option value="INVOICED">Faturalandı</option>
              <option value="CLOSED">Kapatıldı</option>
              <option value="REJECTED">Reddedildi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Work Orders List */}
      {filteredWorkOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery || statusFilter !== 'ALL' ? 'Sonuç Bulunamadı' : 'Henüz Talep Yok'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || statusFilter !== 'ALL' 
              ? 'Arama kriterlerinize uygun talep bulunamadı.'
              : 'İlk iş emri talebinizi oluşturun.'}
          </p>
          {!searchQuery && statusFilter === 'ALL' && (
            <button
              onClick={() => window.location.hash = 'new-request'}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Yeni Talep Oluştur
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filteredWorkOrders.map((wo) => (
            <div key={wo.Id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {wo.subject}
                        </h3>
                        {getStatusBadge(wo.status)}
                      </div>
                      <p className="text-sm text-gray-600 font-mono bg-gray-100 inline-block px-2 py-1 rounded">
                        #{wo.wo_number}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {wo.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {wo.description}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      {wo.service_code || wo.type}
                    </span>
                    <span className="flex items-center gap-1.5">
                      Öncelik: {getPriorityText(wo.priority)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {formatDate(wo.created_at)}
                    </span>
                    {wo.planned_start && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Başlangıç: {formatDate(wo.planned_start)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => setSelectedWorkOrder(wo)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors flex-shrink-0"
                >
                  <Eye className="w-4 h-4" />
                  Detay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedWorkOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Talep Detayı</h2>
              <button
                onClick={() => setSelectedWorkOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Priority */}
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedWorkOrder.status)}
                {getPriorityText(selectedWorkOrder.priority)}
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">WO Numarası</label>
                  <p className="text-gray-900 font-mono mt-1">#{selectedWorkOrder.wo_number}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Konu</label>
                  <p className="text-gray-900 mt-1">{selectedWorkOrder.subject}</p>
                </div>

                {selectedWorkOrder.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Açıklama</label>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedWorkOrder.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Hizmet Kodu</label>
                    <p className="text-gray-900 mt-1">{selectedWorkOrder.service_code || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tip</label>
                    <p className="text-gray-900 mt-1">{selectedWorkOrder.type}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Oluşturma Tarihi</label>
                    <p className="text-gray-900 mt-1">{formatDate(selectedWorkOrder.created_at)}</p>
                  </div>
                  {selectedWorkOrder.planned_start && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Planlanan Başlangıç</label>
                      <p className="text-gray-900 mt-1">{formatDate(selectedWorkOrder.planned_start)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedWorkOrder(null)}
                  className="flex-1 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
