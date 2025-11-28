// frontend/src/features/isemri/components/WorkOrderApprovalList.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  User,
  Building2,
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

interface PendingWorkOrder {
  id: number;
  wo_number: string;
  cari_id: number;
  cari_code: string;
  cari_title: string;
  portal_user_id?: number;
  requester_user_name?: string;
  type: string;
  service_code?: string;
  subject: string;
  description?: string;
  priority: string;
  status: string;
  approval_status: string;
  created_at?: string;
  planned_start?: string;
  planned_end?: string;
}

export const WorkOrderApprovalList: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<PendingWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWO, setSelectedWO] = useState<PendingWorkOrder | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingWorkOrders();
  }, []);

  const loadPendingWorkOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/v1/work-order/pending-approval`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setWorkOrders(response.data.data || []);
    } catch (error: any) {
      toast.error('Onay bekleyen işler yüklenemedi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedWO) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/v1/work-order/${selectedWO.id}/approve`,
        { approval_note: approvalNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`İş emri onaylandı: ${selectedWO.wo_number}`);
      setShowApprovalModal(false);
      setApprovalNote('');
      setSelectedWO(null);
      loadPendingWorkOrders();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Onaylama başarısız');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWO || !rejectionReason.trim()) {
      toast.error('Red nedeni zorunludur');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/v1/work-order/${selectedWO.id}/reject`,
        { rejection_reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`İş emri reddedildi: ${selectedWO.wo_number}`);
      setShowRejectionModal(false);
      setRejectionReason('');
      setSelectedWO(null);
      loadPendingWorkOrders();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Reddetme başarısız');
    } finally {
      setProcessing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700 border-red-300';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'LOW': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'Acil';
      case 'HIGH': return 'Yüksek';
      case 'MEDIUM': return 'Orta';
      case 'LOW': return 'Düşük';
      default: return priority;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">İş Emri Onayları</h1>
        <p className="text-gray-600">
          Portal üzerinden gelen {workOrders.length} iş emri talebini onaylayın veya reddedin
        </p>
      </div>

      {workOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Onay Bekleyen İş Yok</h3>
          <p className="text-gray-600">Şu anda onayınızı bekleyen iş emri bulunmamaktadır.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {workOrders.map((wo) => (
            <div key={wo.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{wo.wo_number}</h3>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(wo.priority)}`}>
                      {getPriorityLabel(wo.priority)}
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium mb-1">{wo.subject}</p>
                  {wo.description && (
                    <p className="text-sm text-gray-600 mb-3">{wo.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Firma</p>
                    <p className="text-sm font-medium text-gray-900">{wo.cari_title}</p>
                    <p className="text-xs text-gray-600">{wo.cari_code}</p>
                  </div>
                </div>

                {wo.requester_user_name && (
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Talep Eden</p>
                      <p className="text-sm font-medium text-gray-900">{wo.requester_user_name}</p>
                    </div>
                  </div>
                )}

                {wo.service_code && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Hizmet</p>
                      <p className="text-sm font-medium text-gray-900">{wo.service_code}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Talep Tarihi</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(wo.created_at)}</p>
                  </div>
                </div>

                {wo.planned_start && (
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Planlanan Başlangıç</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(wo.planned_start)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedWO(wo);
                    setShowApprovalModal(true);
                  }}
                  className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Onayla
                </button>
                <button
                  onClick={() => {
                    setSelectedWO(wo);
                    setShowRejectionModal(true);
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reddet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedWO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">İş Emrini Onayla</h3>
            <p className="text-gray-600 mb-4">
              <strong>{selectedWO.wo_number}</strong> numaralı iş emrini onaylamak istediğinizden emin misiniz?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Onay Notu (Opsiyonel)
              </label>
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows={3}
                placeholder="Onay ile ilgili not ekleyebilirsiniz..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovalNote('');
                  setSelectedWO(null);
                }}
                disabled={processing}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                İptal
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Onaylanıyor...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Onayla
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedWO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">İş Emrini Reddet</h3>
            <p className="text-gray-600 mb-4">
              <strong>{selectedWO.wo_number}</strong> numaralı iş emrini reddetmek için lütfen nedeni belirtin.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Red Nedeni <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={3}
                placeholder="Reddetme nedenini açıklayın (zorunlu)..."
                required
              />
              {rejectionReason.trim().length > 0 && rejectionReason.trim().length < 3 && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  En az 3 karakter gerekli
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                  setSelectedWO(null);
                }}
                disabled={processing}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                İptal
              </button>
              <button
                onClick={handleReject}
                disabled={processing || rejectionReason.trim().length < 3}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Reddediliyor...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Reddet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
