// İŞ EMRİ MODULE - İş Emri ve Dijital Arşiv modülü ana component
// SQL şemasına 1:1 eşleşen yapı
// Audit trail entegrasyonu ile

import { useState, useEffect } from "react";
import { Theme } from "../ThemeSelector";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { 
  ClipboardList, 
  Plus, 
  Filter,
  Search,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Save,
  FileText,
  X,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Calendar,
  Package,
  Building2,
  User,
  Shield,
  Flag,
  Clock,
  TrendingUp
} from "lucide-react";
import { workOrderApi, workOrderApiMock, workOrderItemApi, workOrderItemApiMock, archiveDocApiMock, generateWoNumber, getStatusColor, getPriorityColor } from "../../lib/api/is-emri";
import type { WorkOrder, WorkOrderItem, ArchiveDoc } from "../../lib/types/database";
import { IsEmriCard } from "../cards/IsEmriCard";
import { AuditLogViewer } from "../AuditLogViewer";
import { RecordMetadataCard } from "../RecordMetadataCard";
import { DeleteConfirmDialog } from "../DeleteConfirmDialog";
import { Alert, AlertDescription } from "../ui/alert";
import { CariSecici } from "../CariSecici";
import { HizmetSecici } from "../HizmetSecici";
import { FileUploader } from "../FileUploader";
import { IsEmriDashboard } from "../IsEmriDashboard";
import { cariMasterData } from "../../data/cariData";
import { serviceCardMasterData } from "../../data/serviceCardData";

interface IsEmriModuleProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
  initialPage?: 'list' | 'create';
}

export function IsEmriModule({ 
  onNavigateHome, 
  onNavigateBack, 
  theme,
  initialPage = 'list'
}: IsEmriModuleProps) {
  const [currentView, setCurrentView] = useState<'list' | 'detail' | 'create' | 'edit'>(initialPage);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [selectedItems, setSelectedItems] = useState<WorkOrderItem[]>([]);
  const [selectedArchiveDocs, setSelectedArchiveDocs] = useState<ArchiveDoc[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<WorkOrder['status'] | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<WorkOrder['type'] | 'ALL'>('ALL');
  const [filterPriority, setFilterPriority] = useState<WorkOrder['priority'] | 'ALL'>('ALL');
  const [filterCari, setFilterCari] = useState<string>('');

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    wo_number: generateWoNumber(), // Otomatik numara üret
    cari_id: null as number | null,
    cari_code: '',
    cari_title: '',
    requester_user_id: 1,
    requester_user_name: 'Ali Operasyon',
    type: 'HIZMET' as WorkOrder['type'],
    service_code: '',
    action: '',
    subject: '',
    description: '',
    priority: 'MEDIUM' as WorkOrder['priority'],
    planned_start: '',
    planned_end: '',
    status: 'DRAFT' as WorkOrder['status'],
    gate_required: false,
    saha_kayit_yetkisi: true,
    attachments_count: 0,
    has_signature: false,
    is_cabatoge_tr_flag: false,
    apply_rule_addons: true,
    security_exit_time: '',
    attached_letter_approved: false,
    notes: '',
    is_active: true,
  });

  // Kalem formu
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [itemFormData, setItemFormData] = useState({
    item_type: 'WORKLOG' as WorkOrderItem['item_type'],
    resource_code: '',
    resource_name: '',
    service_code: '',
    service_name: '',
    start_time: '',
    end_time: '',
    duration_minutes: 0,
    quantity: 1,
    unit: 'ADET',
    unit_price: 0,
    currency: 'TRY',
    vat_rate: 20,
    notes: '',
  });

  // Detay tab
  const [detailTab, setDetailTab] = useState<'details' | 'metadata' | 'history'>('details');

  // Dialog states
  const [cariSeciciOpen, setCariSeciciOpen] = useState(false);
  const [hizmetSeciciOpen, setHizmetSeciciOpen] = useState(false);
  const [selectedCari, setSelectedCari] = useState<typeof cariMasterData[0] | null>(null);
  const [selectedHizmet, setSelectedHizmet] = useState<typeof serviceCardMasterData[0] | null>(null);

  // Load work orders
  useEffect(() => {
    loadWorkOrders();
  }, []);

  const loadWorkOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock API kullanımı
      const response = await workOrderApiMock.getAll({
        search: searchTerm,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
        type: filterType !== 'ALL' ? filterType : undefined,
        cari_code: filterCari || undefined,
      });
      setWorkOrders(response.items);
    } catch (err: any) {
      setError(err.message || 'İş emirleri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Load items for selected work order
  const loadWorkOrderItems = async (workOrderId: number) => {
    try {
      const items = await workOrderItemApiMock.getByWorkOrder(workOrderId);
      setSelectedItems(items);
    } catch (err) {
      console.error('Kalemler yüklenemedi:', err);
    }
  };

  // Load archive docs for selected work order
  const loadArchiveDocs = async (workOrderId: number) => {
    try {
      const docs = await archiveDocApiMock.getByWorkOrder(workOrderId);
      setSelectedArchiveDocs(docs);
    } catch (err) {
      console.error('Arşiv belgeleri yüklenemedi:', err);
    }
  };

  // Handle view detail
  const handleViewDetail = async (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setCurrentView('detail');
    setDetailTab('details');
    await loadWorkOrderItems(workOrder.id);
    await loadArchiveDocs(workOrder.id);
  };

  // Handle create
  const handleCreate = () => {
    setFormData({
      wo_number: generateWoNumber(),
      cari_id: null,
      cari_code: '',
      cari_title: '',
      requester_user_id: 1,
      requester_user_name: 'Ali Operasyon',
      type: 'HIZMET',
      service_code: '',
      action: '',
      subject: '',
      description: '',
      priority: 'MEDIUM',
      planned_start: '',
      planned_end: '',
      status: 'DRAFT',
      gate_required: false,
      saha_kayit_yetkisi: true,
      attachments_count: 0,
      has_signature: false,
      is_cabatoge_tr_flag: false,
      apply_rule_addons: true,
      security_exit_time: '',
      attached_letter_approved: false,
      notes: '',
      is_active: true,
    });
    setCurrentView('create');
  };

  // Handle edit
  const handleEdit = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setFormData({
      wo_number: workOrder.wo_number,
      cari_id: workOrder.cari_id,
      cari_code: workOrder.cari_code,
      cari_title: workOrder.cari_title,
      requester_user_id: workOrder.requester_user_id || 1,
      requester_user_name: workOrder.requester_user_name || '',
      type: workOrder.type,
      service_code: workOrder.service_code || '',
      action: workOrder.action,
      subject: workOrder.subject,
      description: workOrder.description,
      priority: workOrder.priority,
      planned_start: workOrder.planned_start || '',
      planned_end: workOrder.planned_end || '',
      status: workOrder.status,
      gate_required: workOrder.gate_required,
      saha_kayit_yetkisi: workOrder.saha_kayit_yetkisi,
      attachments_count: workOrder.attachments_count,
      has_signature: workOrder.has_signature,
      is_cabatoge_tr_flag: workOrder.is_cabatoge_tr_flag,
      apply_rule_addons: workOrder.apply_rule_addons,
      security_exit_time: workOrder.security_exit_time || '',
      attached_letter_approved: workOrder.attached_letter_approved,
      notes: workOrder.notes || '',
      is_active: workOrder.is_active,
    });
    setCurrentView('edit');
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.subject || !formData.action || !formData.cari_code) {
      setError('Lütfen zorunlu alanları doldurun');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const dataToSave = {
        ...formData,
        created_by: 1,
        created_by_name: 'Ali Operasyon',
      };

      if (currentView === 'create') {
        await workOrderApiMock.create(dataToSave);
      } else if (currentView === 'edit' && selectedWorkOrder) {
        await workOrderApiMock.update(selectedWorkOrder.id, {
          ...dataToSave,
          updated_by: 1,
          updated_by_name: 'Ali Operasyon',
        });
      }

      await loadWorkOrders();
      setCurrentView('list');
      setSelectedWorkOrder(null);
    } catch (err: any) {
      setError(err.message || 'Kayıt sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDeleteRequest = (id: number) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setLoading(true);
    try {
      await workOrderApiMock.delete(itemToDelete);
      await loadWorkOrders();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      if (selectedWorkOrder?.id === itemToDelete) {
        setCurrentView('list');
        setSelectedWorkOrder(null);
      }
    } catch (err: any) {
      setError(err.message || 'Silme sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Handle cari seçimi
  const handleCariSelect = (cari: any) => {
    if (cari) {
      setSelectedCari(cari);
      setFormData(prev => ({
        ...prev,
        cari_id: cari.Id,
        cari_code: cari.Code,
        cari_title: cari.Name,
        // Otomatik başlık güncelle
        subject: prev.subject || `${cari.Name} - ${selectedHizmet?.name || 'Hizmet'}`,
      }));
    }
  };

  // Handle hizmet seçimi
  const handleHizmetSelect = (hizmet: any) => {
    if (hizmet) {
      setSelectedHizmet(hizmet);
      setFormData(prev => ({
        ...prev,
        service_code: hizmet.code,
        action: hizmet.code,
        // Otomatik başlık güncelle
        subject: `${selectedCari?.Name || 'Cari'} - ${hizmet.name}`,
        // Hizmet açıklamasını description'a aktar
        description: prev.description || hizmet.description,
      }));
    }
  };

  // Handle status change
  const handleStatusChange = async (id: number, newStatus: WorkOrder['status']) => {
    try {
      await workOrderApiMock.changeStatus(id, newStatus);
      await loadWorkOrders();
      if (selectedWorkOrder?.id === id) {
        const updated = await workOrderApiMock.getById(id);
        setSelectedWorkOrder(updated);
      }
    } catch (err: any) {
      setError(err.message || 'Durum değişikliği sırasında hata oluştu');
    }
  };

  // Add item
  const handleAddItem = async () => {
    if (!selectedWorkOrder) return;

    try {
      const calculatedTotal = itemFormData.quantity * itemFormData.unit_price;
      const vatAmount = (calculatedTotal * itemFormData.vat_rate) / 100;
      const grandTotal = calculatedTotal + vatAmount;

      await workOrderItemApiMock.create({
        work_order_id: selectedWorkOrder.id,
        wo_number: selectedWorkOrder.wo_number,
        ...itemFormData,
        total_amount: calculatedTotal,
        vat_amount: vatAmount,
        grand_total: grandTotal,
        is_invoiced: false,
        created_by: 1,
        created_by_name: 'Ali Operasyon',
      });

      await loadWorkOrderItems(selectedWorkOrder.id);
      setItemFormOpen(false);
      
      // Reset form
      setItemFormData({
        item_type: 'WORKLOG',
        resource_code: '',
        resource_name: '',
        service_code: '',
        service_name: '',
        start_time: '',
        end_time: '',
        duration_minutes: 0,
        quantity: 1,
        unit: 'ADET',
        unit_price: 0,
        currency: 'TRY',
        vat_rate: 20,
        notes: '',
      });
    } catch (err: any) {
      setError(err.message || 'Kalem eklenirken hata oluştu');
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Bu kalemi silmek istediğinizden emin misiniz?')) return;
    
    try {
      await workOrderItemApiMock.delete(itemId);
      if (selectedWorkOrder) {
        await loadWorkOrderItems(selectedWorkOrder.id);
      }
    } catch (err: any) {
      setError(err.message || 'Kalem silinirken hata oluştu');
    }
  };

  // Filtered work orders
  const filteredWorkOrders = workOrders.filter(wo => {
    if (filterStatus !== 'ALL' && wo.status !== filterStatus) return false;
    if (filterType !== 'ALL' && wo.type !== filterType) return false;
    if (filterPriority !== 'ALL' && wo.priority !== filterPriority) return false;
    if (filterCari && !wo.cari_code.toLowerCase().includes(filterCari.toLowerCase()) && 
        !wo.cari_title.toLowerCase().includes(filterCari.toLowerCase())) return false;
    if (searchTerm && !wo.wo_number.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !wo.subject.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !wo.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Stats
  const stats = {
    total: workOrders.length,
    draft: workOrders.filter(wo => wo.status === 'DRAFT').length,
    submitted: workOrders.filter(wo => wo.status === 'SUBMITTED').length,
    approved: workOrders.filter(wo => wo.status === 'APPROVED').length,
    sahada: workOrders.filter(wo => wo.status === 'SAHADA').length,
    tamamlandi: workOrders.filter(wo => wo.status === 'TAMAMLANDI').length,
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={onNavigateBack}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
            <div>
              <h1 className="flex items-center gap-2">
                <ClipboardList className="w-6 h-6" />
                İş Emri Yönetimi
              </h1>
              <p className="text-sm text-blue-100 mt-1">
                {currentView === 'list' && `${filteredWorkOrders.length} iş emri`}
                {currentView === 'detail' && selectedWorkOrder?.wo_number}
                {currentView === 'create' && 'Yeni İş Emri'}
                {currentView === 'edit' && 'İş Emri Düzenle'}
              </p>
            </div>
          </div>

          {currentView === 'list' && (
            <Button
              onClick={handleCreate}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni İş Emri
            </Button>
          )}
        </div>

        {/* Stats Bar */}
        {currentView === 'list' && (
          <div className="mt-4 grid grid-cols-6 gap-4">
            <div className="bg-white/10 rounded p-3">
              <div className="text-xs text-blue-100">Toplam</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-white/10 rounded p-3">
              <div className="text-xs text-blue-100">Taslak</div>
              <div className="text-2xl font-bold">{stats.draft}</div>
            </div>
            <div className="bg-white/10 rounded p-3">
              <div className="text-xs text-blue-100">Gönderildi</div>
              <div className="text-2xl font-bold">{stats.submitted}</div>
            </div>
            <div className="bg-white/10 rounded p-3">
              <div className="text-xs text-blue-100">Onaylandı</div>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </div>
            <div className="bg-white/10 rounded p-3">
              <div className="text-xs text-blue-100">Sahada</div>
              <div className="text-2xl font-bold">{stats.sahada}</div>
            </div>
            <div className="bg-white/10 rounded p-3">
              <div className="text-xs text-blue-100">Tamamlandı</div>
              <div className="text-2xl font-bold">{stats.tamamlandi}</div>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="m-4 bg-red-500/10 border-red-500/50">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <AlertDescription className="text-red-200">
            {error}
            <Button
              size="sm"
              variant="ghost"
              className="ml-2 h-auto p-0 text-red-300 hover:text-red-100"
              onClick={() => setError(null)}
            >
              <X className="w-3 h-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* LIST VIEW */}
        {currentView === 'list' && (
          <div className="space-y-4">
            {/* Dashboard */}
            <IsEmriDashboard workOrders={workOrders} />

            {/* Filters */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <Input
                    placeholder="Ara (No, Başlık, Açıklama)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div>
                  <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                    <SelectTrigger className="bg-gray-900 border-gray-700">
                      <SelectValue placeholder="Durum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                      <SelectItem value="DRAFT">Taslak</SelectItem>
                      <SelectItem value="SUBMITTED">Gönderildi</SelectItem>
                      <SelectItem value="APPROVED">Onaylandı</SelectItem>
                      <SelectItem value="SAHADA">Sahada</SelectItem>
                      <SelectItem value="TAMAMLANDI">Tamamlandı</SelectItem>
                      <SelectItem value="FATURALANDI">Faturalandı</SelectItem>
                      <SelectItem value="KAPANDI">Kapatıldı</SelectItem>
                      <SelectItem value="REJECTED">Reddedildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                    <SelectTrigger className="bg-gray-900 border-gray-700">
                      <SelectValue placeholder="Tip" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tüm Tipler</SelectItem>
                      <SelectItem value="HIZMET">Hizmet</SelectItem>
                      <SelectItem value="MOTORBOT">Motorbot</SelectItem>
                      <SelectItem value="BARINMA">Barınma</SelectItem>
                      <SelectItem value="DIGER">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={filterPriority} onValueChange={(v: any) => setFilterPriority(v)}>
                    <SelectTrigger className="bg-gray-900 border-gray-700">
                      <SelectValue placeholder="Öncelik" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tüm Öncelikler</SelectItem>
                      <SelectItem value="LOW">Düşük</SelectItem>
                      <SelectItem value="MEDIUM">Orta</SelectItem>
                      <SelectItem value="HIGH">Yüksek</SelectItem>
                      <SelectItem value="URGENT">Acil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    placeholder="Cari Filtrele..."
                    value={filterCari}
                    onChange={(e) => setFilterCari(e.target.value)}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Work Orders Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : filteredWorkOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>İş emri bulunamadı</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredWorkOrders.map(wo => (
                  <IsEmriCard
                    key={wo.id}
                    workOrder={wo}
                    onView={handleViewDetail}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                    onStatusChange={handleStatusChange}
                    showActions={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* DETAIL VIEW */}
        {currentView === 'detail' && selectedWorkOrder && (
          <div className="space-y-4">
            <Tabs value={detailTab} onValueChange={(v: any) => setDetailTab(v)}>
              <TabsList className="bg-gray-800 border border-gray-700">
                <TabsTrigger value="details">Detaylar</TabsTrigger>
                <TabsTrigger value="metadata">Kayıt Bilgileri</TabsTrigger>
                <TabsTrigger value="history">Değişiklik Geçmişi</TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                {/* Work Order Card */}
                <IsEmriCard
                  workOrder={selectedWorkOrder}
                  onEdit={handleEdit}
                  onDelete={handleDeleteRequest}
                  showActions={true}
                  compact={false}
                />

                {/* Items Section */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-400" />
                      İş Emri Kalemleri ({selectedItems.length})
                    </h3>
                    <Button
                      size="sm"
                      onClick={() => setItemFormOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Kalem Ekle
                    </Button>
                  </div>

                  {selectedItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Henüz kalem eklenmemiş</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedItems.map(item => (
                        <div
                          key={item.id}
                          className="bg-gray-900/50 border border-gray-700 rounded p-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="text-xs">
                                  {item.item_type}
                                </Badge>
                                {item.resource_name && (
                                  <span className="text-sm text-white font-medium">
                                    {item.resource_name}
                                  </span>
                                )}
                                {item.service_name && (
                                  <span className="text-sm text-white font-medium">
                                    {item.service_name}
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-4 gap-4 text-xs text-gray-400 mt-2">
                                <div>
                                  <div className="text-gray-500">Miktar</div>
                                  <div className="text-white">{item.quantity} {item.unit}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Birim Fiyat</div>
                                  <div className="text-white">{item.unit_price.toFixed(2)} {item.currency}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Tutar</div>
                                  <div className="text-white">{item.total_amount.toFixed(2)} {item.currency}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Genel Toplam</div>
                                  <div className="text-green-400 font-bold">
                                    {item.grand_total.toFixed(2)} {item.currency}
                                  </div>
                                </div>
                              </div>

                              {item.notes && (
                                <div className="mt-2 text-xs text-gray-400">
                                  {item.notes}
                                </div>
                              )}
                            </div>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Item Form Dialog */}
                  {itemFormOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-white">Yeni Kalem Ekle</h3>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setItemFormOpen(false)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-gray-400 mb-1 block">Kalem Tipi</label>
                              <Select
                                value={itemFormData.item_type}
                                onValueChange={(v: any) => setItemFormData(prev => ({ ...prev, item_type: v }))}
                              >
                                <SelectTrigger className="bg-gray-900 border-gray-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="WORKLOG">WorkLog</SelectItem>
                                  <SelectItem value="RESOURCE">Kaynak</SelectItem>
                                  <SelectItem value="SERVICE">Hizmet</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="text-sm text-gray-400 mb-1 block">Kaynak Adı</label>
                              <Input
                                value={itemFormData.resource_name}
                                onChange={(e) => setItemFormData(prev => ({ ...prev, resource_name: e.target.value }))}
                                className="bg-gray-900 border-gray-700"
                              />
                            </div>

                            <div>
                              <label className="text-sm text-gray-400 mb-1 block">Miktar</label>
                              <Input
                                type="number"
                                step="0.01"
                                value={itemFormData.quantity}
                                onChange={(e) => setItemFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                                className="bg-gray-900 border-gray-700"
                              />
                            </div>

                            <div>
                              <label className="text-sm text-gray-400 mb-1 block">Birim</label>
                              <Input
                                value={itemFormData.unit}
                                onChange={(e) => setItemFormData(prev => ({ ...prev, unit: e.target.value }))}
                                className="bg-gray-900 border-gray-700"
                              />
                            </div>

                            <div>
                              <label className="text-sm text-gray-400 mb-1 block">Birim Fiyat</label>
                              <Input
                                type="number"
                                step="0.01"
                                value={itemFormData.unit_price}
                                onChange={(e) => setItemFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                                className="bg-gray-900 border-gray-700"
                              />
                            </div>

                            <div>
                              <label className="text-sm text-gray-400 mb-1 block">Para Birimi</label>
                              <Select
                                value={itemFormData.currency}
                                onValueChange={(v) => setItemFormData(prev => ({ ...prev, currency: v }))}
                              >
                                <SelectTrigger className="bg-gray-900 border-gray-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="TRY">TRY</SelectItem>
                                  <SelectItem value="USD">USD</SelectItem>
                                  <SelectItem value="EUR">EUR</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm text-gray-400 mb-1 block">Notlar</label>
                            <Textarea
                              value={itemFormData.notes}
                              onChange={(e) => setItemFormData(prev => ({ ...prev, notes: e.target.value }))}
                              className="bg-gray-900 border-gray-700"
                              rows={2}
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => setItemFormOpen(false)}
                            >
                              İptal
                            </Button>
                            <Button
                              onClick={handleAddItem}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Ekle
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Archive Docs Section */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <h3 className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-yellow-400" />
                    Dijital Arşiv ({selectedArchiveDocs.length})
                  </h3>

                  {/* Dosya Yükleme */}
                  <FileUploader
                    workOrderId={selectedWorkOrder?.id}
                    onUploadComplete={(files) => {
                      console.log('Yüklenen dosyalar:', files);
                      // Gerçek API'de loadArchiveDocs çağrılacak
                      loadArchiveDocs(selectedWorkOrder.id);
                    }}
                    maxFiles={10}
                    maxSize={10}
                  />

                  {/* Mevcut Belgeler */}
                  {selectedArchiveDocs.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm text-gray-400 mb-3">Yüklenmiş Belgeler</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedArchiveDocs.map(doc => (
                          <div
                            key={doc.id}
                            className="bg-gray-900/50 border border-gray-700 rounded p-2"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-400" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-white truncate">{doc.file_name}</div>
                                <div className="text-xs text-gray-500">{doc.doc_type}</div>
                              </div>
                              <Badge className={
                                doc.status === 'VERIFIED' ? 'bg-green-500/20 text-green-400' :
                                doc.status === 'EXPIRED' ? 'bg-red-500/20 text-red-400' :
                                'bg-blue-500/20 text-blue-400'
                              }>
                                {doc.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Metadata Tab */}
              <TabsContent value="metadata">
                <RecordMetadataCard
                  tableName="work_order"
                  recordId={selectedWorkOrder.id}
                  theme={theme}
                />
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history">
                <AuditLogViewer
                  tableName="work_order"
                  recordId={selectedWorkOrder.id}
                  theme={theme}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* CREATE/EDIT VIEW */}
        {(currentView === 'create' || currentView === 'edit') && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-6">
                {currentView === 'create' ? 'Yeni İş Emri' : 'İş Emri Düzenle'}
              </h2>

              <div className="space-y-6">
                {/* İş Emri No */}
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">İş Emri No</label>
                  <Input
                    value={formData.wo_number}
                    disabled
                    className="bg-gray-900 border-gray-700 font-mono"
                  />
                </div>

                {/* Cari Seçimi */}
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Cari *</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => setCariSeciciOpen(true)}
                      variant="outline"
                      className="flex-1 justify-start bg-gray-900 border-gray-700 text-white hover:bg-gray-800"
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      {formData.cari_title || "Cari Seç..."}
                    </Button>
                    {formData.cari_code && (
                      <Button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            cari_id: null,
                            cari_code: '',
                            cari_title: '',
                          }));
                          setSelectedCari(null);
                        }}
                        variant="outline"
                        className="bg-gray-900 border-gray-700 text-red-400 hover:bg-gray-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {formData.cari_title && (
                    <div className="mt-2 text-sm text-gray-300">
                      {formData.cari_code} - {formData.cari_title}
                    </div>
                  )}
                </div>

                {/* Tip, Aksiyon, Öncelik */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Tip *</label>
                    <Select
                      value={formData.type}
                      onValueChange={(v: any) => {
                        setFormData(prev => ({ ...prev, type: v }));
                        // Tip değiştiğinde service_code'u temizle
                        if (v !== 'HIZMET') {
                          setFormData(prev => ({ ...prev, service_code: '', action: '' }));
                          setSelectedHizmet(null);
                        }
                      }}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIZMET">Hizmet</SelectItem>
                        <SelectItem value="MOTORBOT">Motorbot</SelectItem>
                        <SelectItem value="BARINMA">Barınma</SelectItem>
                        <SelectItem value="DIGER">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">
                      {formData.type === 'HIZMET' ? 'Hizmet Kartı *' : 'Aksiyon *'}
                    </label>
                    {formData.type === 'HIZMET' ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => setHizmetSeciciOpen(true)}
                          variant="outline"
                          className="flex-1 justify-start bg-gray-900 border-gray-700 text-white hover:bg-gray-800"
                        >
                          <Package className="w-4 h-4 mr-2" />
                          {selectedHizmet?.name || "Hizmet Seç..."}
                        </Button>
                        {selectedHizmet && (
                          <Button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                service_code: '',
                                action: '',
                              }));
                              setSelectedHizmet(null);
                            }}
                            variant="outline"
                            className="bg-gray-900 border-gray-700 text-red-400 hover:bg-gray-800"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Input
                        value={formData.action}
                        onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
                        placeholder="ör: FORKLIFT, ARAÇ_GİRİŞ"
                        className="bg-gray-900 border-gray-700"
                      />
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Öncelik</label>
                    <Select
                      value={formData.priority}
                      onValueChange={(v: any) => setFormData(prev => ({ ...prev, priority: v }))}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Düşük</SelectItem>
                        <SelectItem value="MEDIUM">Orta</SelectItem>
                        <SelectItem value="HIGH">Yüksek</SelectItem>
                        <SelectItem value="URGENT">Acil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Başlık ve Açıklama */}
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Başlık *</label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="İş emri başlığı (3-120 karakter)"
                    maxLength={120}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Açıklama *</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="İş emri açıklaması (max 500 karakter)"
                    maxLength={500}
                    rows={4}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>

                {/* Tarihler */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Planlanan Başlangıç</label>
                    <Input
                      type="datetime-local"
                      value={formData.planned_start}
                      onChange={(e) => setFormData(prev => ({ ...prev, planned_start: e.target.value }))}
                      className="bg-gray-900 border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Planlanan Bitiş</label>
                    <Input
                      type="datetime-local"
                      value={formData.planned_end}
                      onChange={(e) => setFormData(prev => ({ ...prev, planned_end: e.target.value }))}
                      className="bg-gray-900 border-gray-700"
                    />
                  </div>
                </div>

                {/* Flags */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.gate_required}
                      onChange={(e) => setFormData(prev => ({ ...prev, gate_required: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-300">Güvenlik Gate gerekli</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.saha_kayit_yetkisi}
                      onChange={(e) => setFormData(prev => ({ ...prev, saha_kayit_yetkisi: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-300">Saha WorkLog yetkisi</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_cabatoge_tr_flag}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_cabatoge_tr_flag: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-300">Kabotaj İndirim (%10)</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.apply_rule_addons}
                      onChange={(e) => setFormData(prev => ({ ...prev, apply_rule_addons: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-300">Kural kaynaklı ek ücretleri uygula</span>
                  </label>
                </div>

                {/* Notlar */}
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Notlar</label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Ek notlar..."
                    rows={3}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setCurrentView('list');
                      setSelectedWorkOrder(null);
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {currentView === 'create' ? 'Oluştur' : 'Kaydet'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        tableName="work_order"
        recordId={itemToDelete || 0}
        title="İş Emrini Sil"
        description="Bu iş emrini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      />

      {/* Cari Seçici Dialog */}
      <CariSecici
        cariList={cariMasterData}
        selectedCari={selectedCari}
        onSelect={handleCariSelect}
        open={cariSeciciOpen}
        onOpenChange={setCariSeciciOpen}
        title="Cari Seç"
      />

      {/* Hizmet Seçici Dialog */}
      <HizmetSecici
        hizmetList={serviceCardMasterData}
        selectedHizmet={selectedHizmet}
        onSelect={handleHizmetSelect}
        open={hizmetSeciciOpen}
        onOpenChange={setHizmetSeciciOpen}
        title="Hizmet Kartı Seç"
      />
    </div>
  );
}