// frontend/src/features/portal/components/PortalDashboard.tsx
import React, { useState, useEffect } from 'react';
import { usePortalAuth } from '../context/PortalAuthContext';
import { portalTokenStorage } from '../utils/portalTokenStorage';
import axios from 'axios';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Calendar,
  AlertCircle,
  Upload,
  AlertTriangle,
  Package
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

interface WorkOrderStats {
  total: number;
  active: number;
  completed: number;
  pending: number;
  missing_documents: number;  // 🆕 Eksik belgeli iş emirleri
  ending_today: number;        // 🆕 Bugün biten iş emirleri
}

interface DocumentStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  expiring_soon: number;
}

interface RecentWorkOrder {
  id: number;
  wo_number: string;
  status: string;
  vessel_name?: string;
  service_type?: string;
  created_at: string;
  documents_status?: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
}

export const PortalDashboard: React.FC = () => {
  const { user } = usePortalAuth();
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState<RecentWorkOrder[]>([]);
  const [workOrderStats, setWorkOrderStats] = useState<WorkOrderStats>({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0,
    missing_documents: 0,
    ending_today: 0,
  });
  const [documentStats, setDocumentStats] = useState<DocumentStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    expiring_soon: 0,
  });

  // API'den verileri çek
  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = portalTokenStorage.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Work orders listesi (son 5 talep)
        const workOrdersRes = await axios.get(`${API_BASE_URL}/api/v1/portal/work-orders`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 5 }
        });
        console.log('📊 Work Orders Response:', workOrdersRes.data);
        setWorkOrders(Array.isArray(workOrdersRes.data) ? workOrdersRes.data : []);

        // Work order istatistikleri
        const allWorkOrdersRes = await axios.get(`${API_BASE_URL}/api/v1/portal/work-orders`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1000 }
        });
        const allWorkOrders = Array.isArray(allWorkOrdersRes.data) ? allWorkOrdersRes.data : [];
        console.log('📈 Total Work Orders:', allWorkOrders.length);
        
        // 🆕 Bugün biten iş emirleri (estimated_end_date == bugün)
        const today = new Date().toISOString().split('T')[0];
        const endingToday = allWorkOrders.filter((wo: any) => {
          if (!wo.estimated_end_date) return false;
          const endDate = new Date(wo.estimated_end_date).toISOString().split('T')[0];
          return endDate === today;
        }).length;
        
        // 🆕 Eksik belgeli iş emirleri sayısını hesapla
        let missingDocsCount = 0;
        for (const wo of allWorkOrders.slice(0, 50)) {
          try {
            const docStatusRes = await axios.get(
              `${API_BASE_URL}/api/v1/portal/work-orders/${wo.id}/document-status`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (docStatusRes.data.required_documents_complete === false) {
              missingDocsCount++;
            }
          } catch (err) {
            // Hata durumunda sessizce atla
          }
        }
        
        const stats: WorkOrderStats = {
          total: allWorkOrders.length,
          active: allWorkOrders.filter((wo: any) => wo.status === 'IN_PROGRESS').length,
          completed: allWorkOrders.filter((wo: any) => wo.status === 'COMPLETED').length,
          pending: allWorkOrders.filter((wo: any) => wo.status === 'WAITING').length,
          missing_documents: missingDocsCount,
          ending_today: endingToday,
        };
        setWorkOrderStats(stats);

        // Belge istatistikleri - tüm iş emirleri için
        let totalDocStats = {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          expiring_soon: 0,
        };

        for (const wo of allWorkOrders.slice(0, 20)) {
          try {
            const docStatusRes = await axios.get(
              `${API_BASE_URL}/api/v1/portal/work-orders/${wo.id}/document-status`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const docStatus = docStatusRes.data;
            totalDocStats.total += docStatus.total_documents || 0;
            totalDocStats.approved += docStatus.approved_documents || 0;
            totalDocStats.pending += docStatus.pending_documents || 0;
            totalDocStats.rejected += docStatus.rejected_documents || 0;
          } catch (err) {
            console.log(`Belge durumu alınamadı: ${wo.id}`);
          }
        }

        setDocumentStats(totalDocStats);

      } catch (error: any) {
        console.error('Dashboard verisi alınamadı:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'WAITING': return 'bg-yellow-100 text-yellow-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'Devam Ediyor';
      case 'COMPLETED': return 'Tamamlandı';
      case 'WAITING': return 'Beklemede';
      case 'CANCELLED': return 'İptal Edildi';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Hoş Geldiniz, {user?.full_name}
        </h2>
        <p className="text-blue-100">
          {user?.cari_unvan || 'Firma Portalı'} - İş emirlerinizi ve belgelerinizi buradan yönetebilirsiniz
        </p>
      </div>

      {/* Work Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{workOrderStats.active}</p>
            <p className="text-sm text-gray-600 mb-2">Aktif İş Emirleri</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Devam ediyor
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{workOrderStats.completed}</p>
            <p className="text-sm text-gray-600 mb-2">Tamamlanan</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Başarıyla tamamlandı
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-yellow-100">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{workOrderStats.pending}</p>
            <p className="text-sm text-gray-600 mb-2">Bekleyen</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Onay bekliyor
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{workOrderStats.total}</p>
            <p className="text-sm text-gray-600 mb-2">Toplam Talep</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Tüm zamanlar
            </p>
          </div>
        </div>
      </div>

      {/* 🆕 VisitPro Style - Kritik Durum Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Eksik Belgeler Kartı */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-red-500">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            {workOrderStats.missing_documents > 0 && (
              <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                ACİL
              </span>
            )}
          </div>
          <div>
            <p className="text-4xl font-bold text-red-900 mb-2">{workOrderStats.missing_documents}</p>
            <p className="text-sm font-semibold text-red-800 mb-1">Eksik Belgeler</p>
            <p className="text-xs text-red-700 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Zorunlu belgeler eksik, iş emri başlatılamaz
            </p>
          </div>
        </div>

        {/* Onay Bekleyen Belgeler */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border-2 border-yellow-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-yellow-500">
              <Upload className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-4xl font-bold text-yellow-900 mb-2">{documentStats.pending}</p>
            <p className="text-sm font-semibold text-yellow-800 mb-1">Onay Bekleyen</p>
            <p className="text-xs text-yellow-700 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Aliaport onayı bekleniyor
            </p>
          </div>
        </div>

        {/* Bugün Biten İş Emirleri */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-500">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-4xl font-bold text-orange-900 mb-2">{workOrderStats.ending_today}</p>
            <p className="text-sm font-semibold text-orange-800 mb-1">Bugün Biten</p>
            <p className="text-xs text-orange-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Tahmini bitiş tarihi bugün
            </p>
          </div>
        </div>
      </div>

      {/* Document Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{documentStats.total}</p>
              <p className="text-sm text-gray-600">Toplam Belge</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-green-50">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{documentStats.approved}</p>
              <p className="text-sm text-gray-600">Onaylanan</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-yellow-50">
              <Upload className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{documentStats.pending}</p>
              <p className="text-sm text-gray-600">Bekleyen</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-red-50">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{documentStats.rejected}</p>
              <p className="text-sm text-gray-600">Reddedilen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Work Orders */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Son İş Emirleri</h3>
            <button 
              onClick={() => window.location.hash = 'work-orders'}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Tümünü Gör →
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {workOrders.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Henüz iş emri bulunmuyor</p>
              <p className="text-sm text-gray-500">İlk iş emrinizi oluşturmak için "Yeni İş Emri Talebi" butonuna tıklayın</p>
            </div>
          ) : (
            workOrders.map((wo) => (
              <div key={wo.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {wo.wo_number} {wo.vessel_name ? `- ${wo.vessel_name}` : ''}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(wo.status)}`}>
                        {getStatusLabel(wo.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {wo.service_type || 'Genel Hizmet'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(wo.created_at)}
                      </span>
                      {wo.documents_status && (
                        <span className="flex items-center gap-1">
                          <Upload className="w-4 h-4" />
                          {wo.documents_status.approved}/{wo.documents_status.total} Belge Onaylı
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => window.location.hash = `work-orders/${wo.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Detay
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => window.location.hash = 'new-request'}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 text-left transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Yeni İş Emri</h3>
              <p className="text-blue-100 text-sm">Talep oluştur</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => window.location.hash = 'documents'}
          className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-6 text-left transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <Upload className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1 text-gray-900">Belge Yükle</h3>
              <p className="text-gray-600 text-sm">Doküman ekle</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => window.location.hash = 'work-orders'}
          className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-6 text-left transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Package className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1 text-gray-900">Taleplerim</h3>
              <p className="text-gray-600 text-sm">İş emirleri</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
