// TARİFE MODULE - Fiyat Listesi modülü
// ESKİ SİSTEMLE TAM UYUMLU: TarifeKartiGiris + TarifeListesiEditable mantığı
// SQL: price_list + price_list_item
// ÖZELLİKLER: Tarife Güncelle, Excel İçe/Dışa Aktar, Silme Kuralları

import { useState, useEffect, useMemo } from "react";
import { Theme } from "../ThemeSelector";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Label } from "../ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { 
  DollarSign, 
  Plus, 
  Search,
  Loader2,
  AlertCircle,
  Calendar,
  Save,
  X,
  FileText,
  Trash2,
  Edit,
  ChevronDown,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Upload,
  FileSpreadsheet,
  Lock,
  Unlock
} from "lucide-react";
import { tarifeApi, tarifeApiMock } from "../../lib/api/tarife";
import { serviceCardMasterData } from "../../data/serviceCardData";
import { parameterUnitsMasterData, currencyMasterData } from "../../data/parametersData";
import { AuditLogViewer } from "../AuditLogViewer";
import { RecordMetadataCard } from "../RecordMetadataCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface TarifeModuleProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
  initialPage?: 'list' | 'create' | 'edit';
}

// ESKİ SİSTEMLE UYUMLU - price_list interface
interface PriceListFull {
  id: number;
  code: string;
  name: string;
  currency: string;
  status: 'AKTIF' | 'PASIF' | 'TASLAK';
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  description?: string;
  created_at: string;
  has_transactions?: boolean; // İşlem görmüş mü?
}

// ESKİ SİSTEMLE UYUMLU - price_list_item interface
interface PriceListItemFull {
  id: number | string;
  price_list_id?: number;
  service_card_id: number;
  service_code: string;
  service_name: string;
  unit_name: string;
  vat_rate: number;
  currency: string;
  unit_price: number;
  is_active: boolean;
  is_service_active: boolean;
}

export function TarifeModule({ 
  onNavigateHome, 
  onNavigateBack, 
  theme,
  initialPage = 'list'
}: TarifeModuleProps) {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>(initialPage);
  const [tarifeler, setTarifeler] = useState<PriceListFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTarife, setSelectedTarife] = useState<PriceListFull | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // Filters (Liste görünümü için)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('AKTIF');

  // Form state (Yeni tarife/Düzenle)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    currency: 'TRY' as 'TRY' | 'USD' | 'EUR',
    status: 'TASLAK' as 'AKTIF' | 'PASIF' | 'TASLAK',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
    is_active: false,
    description: '',
  });

  // Tarife kalemleri (items)
  const [priceListItems, setPriceListItems] = useState<PriceListItemFull[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [newItemUnitPrice, setNewItemUnitPrice] = useState<string>('0');
  
  // Düzenleme modu için editedRows
  const [editedRows, setEditedRows] = useState<Record<number, { unitPrice?: number; currency?: string }>>({});

  // Tarife dropdown state (Edit modunda)
  const [showDropdown, setShowDropdown] = useState(false);

  // MODAL STATES
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);

  // Tarife Güncelle Modal Data
  const [updateData, setUpdateData] = useState({
    sourcePriceListId: 0,
    validFrom: '',
    validTo: '',
    updateType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: '',
    status: 'TASLAK' as 'AKTIF' | 'TASLAK',
  });

  // Mock mode
  const MOCK_MODE = true;
  const IS_ADMIN = true; // Mock admin yetkisi

  // Tarifeleri yükle
  const loadTarifeler = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (MOCK_MODE) {
        const { priceListMasterData } = await import('../../data/priceListData');
        setTarifeler(priceListMasterData.map(pl => ({
          ...pl,
          description: '',
          has_transactions: pl.id <= 2, // İlk 2 tarife işlem görmüş
        })));
      } else {
        const response = await tarifeApi.getAll({
          page: 1,
          page_size: 100,
        });
        setTarifeler(response.items as any);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi');
      console.error('Tarife yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // Tarife items yükle (Edit modu için)
  const loadTarifeItems = async (tarifeId: number) => {
    setLoading(true);
    try {
      if (MOCK_MODE) {
        const { priceListItemMasterData } = await import('../../data/priceListData');
        
        // Tüm hizmet kartlarını listele, fiyat varsa ekle
        const items: PriceListItemFull[] = serviceCardMasterData.map(serviceCard => {
          const existingItem = priceListItemMasterData.find(
            item => item.price_list_id === tarifeId && item.service_card_id === serviceCard.id
          );

          const unit = parameterUnitsMasterData.find(u => u.id === serviceCard.unit_id);

          return {
            id: existingItem?.id || `temp-${serviceCard.id}`,
            price_list_id: tarifeId,
            service_card_id: serviceCard.id,
            service_code: serviceCard.code,
            service_name: serviceCard.name,
            unit_name: unit?.name || '-',
            vat_rate: serviceCard.vat_rate_id || 0,
            currency: existingItem?.currency || 'TRY',
            unit_price: existingItem?.unit_price || 0,
            is_active: existingItem?.is_active || false,
            is_service_active: serviceCard.is_active,
          };
        });

        setPriceListItems(items);
      } else {
        const items = await tarifeApi.getItems(tarifeId);
        setPriceListItems(items as any);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kalemler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    if (currentView === 'list') {
      loadTarifeler();
    }
  }, [currentView]);

  // Tarife seç ve düzenle
  const handleEditTarife = (tarife: PriceListFull) => {
    setSelectedTarife(tarife);
    setFormData({
      code: tarife.code,
      name: tarife.name,
      currency: tarife.currency as any,
      status: tarife.status,
      valid_from: tarife.valid_from,
      valid_to: tarife.valid_to || '',
      is_active: tarife.is_active,
      description: tarife.description || '',
    });
    loadTarifeItems(tarife.id);
    setCurrentView('edit');
  };

  // Tarife silme kuralları kontrolü
  const canDeleteTarife = (tarife: PriceListFull): { canDelete: boolean; reason?: string } => {
    // TASLAK → Herkes silebilir
    if (tarife.status === 'TASLAK') {
      return { canDelete: true };
    }

    // İşlem görmüş → Hiç silinemez
    if (tarife.has_transactions) {
      return { 
        canDelete: false, 
        reason: 'Bu tarife üzerinden işlem yapılmış. Silinemez!' 
      };
    }

    // AKTIF veya PASİF → Sadece admin silebilir
    if (tarife.status === 'AKTIF' || tarife.status === 'PASIF') {
      if (!IS_ADMIN) {
        return { 
          canDelete: false, 
          reason: 'Bu tarifeyi silmek için Admin yetkisi gerekiyor!' 
        };
      }
      return { canDelete: true };
    }

    return { canDelete: true };
  };

  // Tarife sil
  const handleDeleteTarife = async (tarife: PriceListFull) => {
    const deleteCheck = canDeleteTarife(tarife);

    if (!deleteCheck.canDelete) {
      alert(`❌ Silme Engellendi!\n\n${deleteCheck.reason}`);
      return;
    }

    const confirmMessage = tarife.status === 'TASLAK' 
      ? `"${tarife.name}" taslak tarifesini silmek istediğinizden emin misiniz?`
      : `⚠️ UYARI: "${tarife.name}" ${tarife.status} tarifesini siliyorsunuz!\n\nBu işlem geri alınamaz. Devam etmek istiyor musunuz?`;

    if (!confirm(confirmMessage)) return;
    
    try {
      if (!MOCK_MODE) {
        await tarifeApi.delete(tarife.id);
      }
      setTarifeler(tarifeler.filter(t => t.id !== tarife.id));
      alert('✅ Tarife silindi!');
    } catch (err) {
      alert('Silme işlemi başarısız: ' + (err instanceof Error ? err.message : 'Hata'));
    }
  };

  // Yeni kalem ekle (Create modunda)
  const handleAddPriceListItem = () => {
    if (!selectedServiceId) {
      alert('Lütfen bir hizmet seçin!');
      return;
    }

    const selectedService = serviceCardMasterData.find(s => s.id === selectedServiceId);
    if (!selectedService) return;

    if (priceListItems.some(item => item.service_card_id === selectedServiceId)) {
      alert('Bu hizmet zaten tarife kalemlerinde mevcut!');
      return;
    }

    const unit = parameterUnitsMasterData.find(u => u.id === selectedService.unit_id);

    const newItem: PriceListItemFull = {
      id: `temp-${Date.now()}`,
      service_card_id: selectedService.id,
      service_code: selectedService.code,
      service_name: selectedService.name,
      unit_name: unit?.name || '-',
      vat_rate: selectedService.vat_rate_id || 0,
      currency: formData.currency,
      unit_price: parseFloat(newItemUnitPrice) || 0,
      is_active: true,
      is_service_active: selectedService.is_active,
    };

    setPriceListItems([...priceListItems, newItem]);
    setSelectedServiceId(null);
    setNewItemUnitPrice('0');
  };

  // Kalem sil (Create modunda)
  const handleRemovePriceListItem = (id: string | number) => {
    if (confirm('Bu kalemi silmek istediğinizden emin misiniz?')) {
      setPriceListItems(priceListItems.filter(item => item.id !== id));
    }
  };

  // Kalem fiyat güncelle (Create modunda)
  const handleUpdateItemPrice = (id: string | number, newPrice: string) => {
    setPriceListItems(
      priceListItems.map(item =>
        item.id === id ? { ...item, unit_price: parseFloat(newPrice) || 0 } : item
      )
    );
  };

  // Kalem aktif/pasif (Create modunda)
  const handleUpdateItemActive = (id: string | number, isActive: boolean) => {
    setPriceListItems(
      priceListItems.map(item => (item.id === id ? { ...item, is_active: isActive } : item))
    );
  };

  // Cell edit (Edit modunda)
  const handleCellEdit = (serviceCardId: number, field: string, value: any) => {
    setEditedRows(prev => ({
      ...prev,
      [serviceCardId]: {
        ...prev[serviceCardId],
        [field]: value,
      }
    }));
  };

  // Kaydet (Create)
  const handleSaveCreate = () => {
    if (!formData.code) {
      alert('Tarife kodu zorunludur!');
      return;
    }
    if (!formData.name) {
      alert('Tarife adı zorunludur!');
      return;
    }
    if (!formData.valid_from) {
      alert('Geçerlilik başlangıç tarihi zorunludur!');
      return;
    }

    const payload = {
      price_list: formData,
      price_list_items: priceListItems.map(item => ({
        service_card_id: item.service_card_id,
        currency: item.currency,
        unit_price: item.unit_price,
        is_active: item.is_active,
      })),
    };

    console.log('Yeni Tarife Kaydediliyor:', payload);
    alert(`✅ Tarife başarıyla kaydedildi!\n${priceListItems.length} kalem eklendi.\n\nDurum: ${formData.status}`);

    resetForm();
    setCurrentView('list');
  };

  // Kaydet (Edit)
  const handleSaveEdit = () => {
    // Aktif hizmetler için fiyat kontrolü
    const activeRows = priceListItems.filter(row => row.is_service_active);
    const emptyPrices = activeRows.filter(row => {
      const edited = editedRows[row.service_card_id];
      const price = edited?.unitPrice !== undefined ? edited.unitPrice : row.unit_price;
      return !price || price <= 0;
    });
    
    if (emptyPrices.length > 0) {
      alert(`⚠️ UYARI: ${emptyPrices.length} aktif hizmet için fiyat girilmedi!\n\nFiyatsız geçilmesine izin verilmiyor.\n\nLütfen tüm aktif hizmetler için fiyat girin.`);
      return;
    }

    const updatedItems = priceListItems.map(item => {
      const edited = editedRows[item.service_card_id];
      return {
        ...item,
        unit_price: edited?.unitPrice !== undefined ? edited.unitPrice : item.unit_price,
        currency: edited?.currency || item.currency,
      };
    });

    const payload = {
      price_list: formData,
      price_list_items: updatedItems.map(item => ({
        service_card_id: item.service_card_id,
        currency: item.currency,
        unit_price: item.unit_price,
        is_active: item.is_active,
      })),
    };

    console.log('Tarife Güncelleniyor:', payload);
    
    let message = `✅ Tarife Kaydedildi!\n\n`;
    message += `Tarife: ${formData.name}\n`;
    message += `Toplam Hizmet: ${activeRows.length}\n\n`;
    message += `Değişiklikler:\n`;
    message += `${Object.keys(editedRows).length} satır güncellendi.`;
    
    alert(message);
    setEditedRows({});
    setCurrentView('list');
  };

  // TARİFE GÜNCELLE (Yeni tarife oluştur mevcut tarifeden)
  const handleUpdateTarife = () => {
    if (!updateData.sourcePriceListId) {
      alert('⚠️ Lütfen kaynak tarife seçin!');
      return;
    }
    if (!updateData.validFrom) {
      alert('⚠️ Lütfen başlangıç tarihi seçin!');
      return;
    }
    if (!updateData.value || parseFloat(updateData.value) === 0) {
      alert('⚠️ Lütfen artırım değeri girin!');
      return;
    }

    const sourcePriceList = tarifeler.find(p => p.id === updateData.sourcePriceListId);
    if (!sourcePriceList) return;

    const increaseValue = parseFloat(updateData.value);
    const newTarifeName = `${updateData.validFrom} Tarife (${updateData.status === 'TASLAK' ? 'Taslak' : 'Onaylı'})`;

    let calculationDetails = '';
    if (updateData.updateType === 'PERCENTAGE') {
      calculationDetails = `%${increaseValue} artırım uygulandı`;
    } else {
      calculationDetails = `${getCurrencySymbol(sourcePriceList.currency)}${increaseValue} sabit artırım uygulandı`;
    }

    // Yeni tarife oluştur
    const newPriceList: PriceListFull = {
      id: Math.max(...tarifeler.map(t => t.id)) + 1,
      code: `${sourcePriceList.currency}-${updateData.validFrom.replace(/-/g, '')}`,
      name: newTarifeName,
      currency: sourcePriceList.currency,
      status: updateData.status,
      valid_from: updateData.validFrom,
      valid_to: updateData.validTo || null,
      is_active: updateData.status === 'AKTIF',
      description: `${sourcePriceList.name} tarifesinden ${updateData.updateType === 'PERCENTAGE' ? '%' + increaseValue : getCurrencySymbol(sourcePriceList.currency) + increaseValue} artırımla oluşturuldu`,
      created_at: new Date().toISOString(),
      has_transactions: false,
    };

    // State'e ekle
    setTarifeler([newPriceList, ...tarifeler]);

    const message = `✅ Yeni ${updateData.status === 'TASLAK' ? 'Taslak' : 'Onaylı'} Tarife Oluşturuldu!\n\n` +
      `Kaynak: ${sourcePriceList.name}\n` +
      `Yeni Tarife: ${newTarifeName}\n` +
      `Kod: ${newPriceList.code}\n` +
      `Başlangıç: ${updateData.validFrom}\n` +
      `Bitiş: ${updateData.validTo || 'Süresiz'}\n` +
      `${calculationDetails}\n\n` +
      `${updateData.status === 'TASLAK' ? '⚠️ Tarife TASLAK durumunda oluşturuldu. Düzenleyip onaylayabilirsiniz.' : '✅ Tarife AKTİF durumda.'}`;

    console.log('Tarife Güncelleme:', {
      source: sourcePriceList,
      updateType: updateData.updateType,
      value: increaseValue,
      newDates: { from: updateData.validFrom, to: updateData.validTo },
      status: updateData.status,
      newPriceList,
    });

    alert(message);
    
    setShowUpdateModal(false);
    setUpdateData({
      sourcePriceListId: 0,
      validFrom: '',
      validTo: '',
      updateType: 'PERCENTAGE',
      value: '',
      status: 'TASLAK',
    });
  };

  // EXCEL EXPORT
  const handleExcelExport = () => {
    if (!selectedTarife) {
      alert('⚠️ Lütfen önce bir tarife seçin!');
      return;
    }

    const message = `📤 Excel Dışa Aktarım Başladı!\n\n` +
      `${selectedTarife.name}\n` +
      `${priceListItems.length} satır Excel formatında indiriliyor...\n\n` +
      `Dosya Adı: ${selectedTarife.code}_${new Date().toISOString().split('T')[0]}.xlsx`;

    console.log('Excel Export:', {
      tarife: selectedTarife,
      items: priceListItems,
    });

    alert(message);
    setShowExcelModal(false);
  };

  // EXCEL IMPORT
  const handleExcelImport = () => {
    alert('📥 Excel İçe Aktarma:\n\n1. Excel dosyasını seçin\n2. Sistem sütunları eşleştirir\n3. Önizleme yapılır\n4. Onaylarsanız tarife TASLAK olarak oluşturulur\n\n⚠️ Taslak tarifeleri düzenleyip onaylayabilirsiniz.');
    setShowExcelImportModal(false);
  };

  // Form reset
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      currency: 'TRY',
      status: 'TASLAK',
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: '',
      is_active: false,
      description: '',
    });
    setPriceListItems([]);
    setSelectedServiceId(null);
    setNewItemUnitPrice('0');
    setSelectedTarife(null);
    setEditedRows({});
  };

  // İptal
  const handleCancel = () => {
    if (Object.keys(editedRows).length > 0 || priceListItems.length > 0) {
      if (!confirm('Değişiklikler kaydedilmeyecek. Devam etmek istiyor musunuz?')) {
        return;
      }
    }
    resetForm();
    setCurrentView('list');
  };

  // Filtrelenmiş tarifeler
  const filteredTarifeler = tarifeler.filter(tarife => {
    const matchesSearch = !searchTerm || 
      tarife.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tarife.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || tarife.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Tarifeler gruplandırılmış
  const groupedTarifeler = useMemo(() => {
    const aktif = tarifeler.filter(p => p.status === 'AKTIF');
    const taslak = tarifeler.filter(p => p.status === 'TASLAK');
    const pasif = tarifeler.filter(p => p.status === 'PASIF');

    return { aktif, taslak, pasif };
  }, [tarifeler]);

  // Currency symbol
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'TRY': return '₺';
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return currency;
    }
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AKTIF': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'TASLAK': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'PASIF': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // LİSTE GÖRÜNÜMÜ
  const renderList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Tarife Yönetimi</h1>
              <p className="text-sm text-gray-400">
                {filteredTarifeler.length} tarife {MOCK_MODE && '• 🔶 Mock Mode'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={() => setShowUpdateModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Tarife Güncelle
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tarife ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-green-500 focus:outline-none"
          >
            <option value="ALL">Tümü</option>
            <option value="AKTIF">Aktif ({groupedTarifeler.aktif.length})</option>
            <option value="TASLAK">Taslak ({groupedTarifeler.taslak.length})</option>
            <option value="PASIF">Pasif ({groupedTarifeler.pasif.length})</option>
          </select>

          <Button
            variant="outline"
            onClick={() => setShowExcelImportModal(true)}
            className="border-gray-700 text-white hover:bg-gray-800"
          >
            <Upload className="w-4 h-4 mr-2" />
            Excel İçe Aktar
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div className="text-red-400">{error}</div>
        </div>
      )}

      {/* Tarife Cards */}
      {!loading && !error && (
        <div className="space-y-4">
          {filteredTarifeler.map(tarife => {
            const deleteCheck = canDeleteTarife(tarife);
            
            return (
              <div 
                key={tarife.id} 
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-all cursor-pointer"
                onDoubleClick={() => {
                  setSelectedTarife(tarife);
                  setShowDetailDialog(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{tarife.name}</h3>
                      <Badge className={getStatusColor(tarife.status)}>
                        {tarife.status}
                      </Badge>
                      <Badge variant="outline" className="border-gray-600 text-gray-400">
                        {tarife.currency}
                      </Badge>
                      {tarife.has_transactions && (
                        <Badge variant="outline" className="border-red-500/30 text-red-400">
                          <Lock className="w-3 h-3 mr-1" />
                          İşlem Görmüş
                        </Badge>
                      )}
                      {!deleteCheck.canDelete && !tarife.has_transactions && (
                        <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                          <Lock className="w-3 h-3 mr-1" />
                          Admin Gerekli
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 font-mono mb-3">{tarife.code}</div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{tarife.valid_from} → {tarife.valid_to || 'Süresiz'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEditTarife(tarife)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Düzenle
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTarife(tarife)}
                      disabled={!deleteCheck.canDelete}
                      className={deleteCheck.canDelete 
                        ? 'text-red-400 hover:text-red-300' 
                        : 'text-gray-600 cursor-not-allowed'
                      }
                      title={deleteCheck.reason || 'Sil'}
                    >
                      {deleteCheck.canDelete ? (
                        <Trash2 className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filteredTarifeler.length === 0 && (
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-12 text-center">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
          <p className="text-gray-400 mb-4">Tarife bulunamadı</p>
          <p className="text-sm text-gray-500">
            Yeni tarife oluşturmak için "Tarife Güncelle" butonunu kullanın
          </p>
        </div>
      )}

      {/* MODALS */}
      {/* Tarife Güncelle Modal */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Tarife Güncelle (Yeni Tarife Oluştur)</DialogTitle>
            <DialogDescription className="text-gray-400">
              Mevcut bir tarifeden yeni tarife oluşturun. Fiyatları otomatik artırabilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-gray-300 mb-2 block">Kaynak Tarife Seçin *</Label>
              <select
                value={updateData.sourcePriceListId}
                onChange={(e) => setUpdateData({ ...updateData, sourcePriceListId: Number(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2.5"
              >
                <option value={0}>-- Tarife seçin --</option>
                {groupedTarifeler.aktif.length > 0 && (
                  <optgroup label="Aktif Tarifeler">
                    {groupedTarifeler.aktif.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.currency})</option>
                    ))}
                  </optgroup>
                )}
                {groupedTarifeler.taslak.length > 0 && (
                  <optgroup label="Taslak Tarifeler">
                    {groupedTarifeler.taslak.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.currency})</option>
                    ))}
                  </optgroup>
                )}
                {groupedTarifeler.pasif.length > 0 && (
                  <optgroup label="Pasif Tarifeler">
                    {groupedTarifeler.pasif.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.currency})</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300 mb-2 block">Geçerlilik Başlangıcı *</Label>
                <Input
                  type="date"
                  value={updateData.validFrom}
                  onChange={(e) => setUpdateData({ ...updateData, validFrom: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300 mb-2 block">Geçerlilik Bitişi</Label>
                <Input
                  type="date"
                  value={updateData.validTo}
                  onChange={(e) => setUpdateData({ ...updateData, validTo: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300 mb-2 block">Artırım Türü *</Label>
                <select
                  value={updateData.updateType}
                  onChange={(e) => setUpdateData({ ...updateData, updateType: e.target.value as any })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2.5"
                >
                  <option value="PERCENTAGE">Yüzdelik Artış (%)</option>
                  <option value="FIXED">Sabit Artış (₺/$/ €)</option>
                </select>
              </div>
              <div>
                <Label className="text-gray-300 mb-2 block">
                  Artırım Değeri * {updateData.updateType === 'PERCENTAGE' ? '(%)' : '(Tutar)'}
                </Label>
                <Input
                  type="number"
                  value={updateData.value}
                  onChange={(e) => setUpdateData({ ...updateData, value: e.target.value })}
                  placeholder={updateData.updateType === 'PERCENTAGE' ? 'örn: 10' : 'örn: 500'}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300 mb-2 block">Yeni Tarife Durumu</Label>
              <select
                value={updateData.status}
                onChange={(e) => setUpdateData({ ...updateData, status: e.target.value as any })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2.5"
              >
                <option value="TASLAK">TASLAK (Düzenlenebilir)</option>
                <option value="AKTIF">AKTİF (Doğrudan Aktif)</option>
              </select>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2 text-sm text-blue-400">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <div>
                  <strong>Bilgi:</strong> Yeni tarife, seçilen kaynak tarifenin fiyatları üzerinden oluşturulacaktır.
                  {updateData.updateType === 'PERCENTAGE' 
                    ? ' Her fiyat belirlediğiniz yüzde kadar artırılacaktır.'
                    : ' Her fiyata belirlediğiniz tutar eklenecektir.'}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpdateModal(false)}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              İptal
            </Button>
            <Button
              onClick={handleUpdateTarife}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Yeni Tarife Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excel Export Modal */}
      <Dialog open={showExcelModal} onOpenChange={setShowExcelModal}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Excel'e Aktar</DialogTitle>
            <DialogDescription className="text-gray-400">
              Tarife verilerini Excel dosyası olarak indirin
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-300">
              {selectedTarife?.name} tarifesi Excel formatında dışa aktarılacak.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExcelModal(false)}>İptal</Button>
            <Button onClick={handleExcelExport} className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              İndir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excel Import Modal */}
      <Dialog open={showExcelImportModal} onOpenChange={setShowExcelImportModal}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Excel'den Yükle</DialogTitle>
            <DialogDescription className="text-gray-400">
              Excel dosyasından tarife verilerini içe aktarın
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-500" />
              <p className="text-sm text-gray-400 mb-2">Excel dosyasını sürükleyin veya seçin</p>
              <Button variant="outline" className="border-gray-700">
                <Upload className="w-4 h-4 mr-2" />
                Dosya Seç
              </Button>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2 text-sm text-yellow-400">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <div>
                  İçe aktarılan tarife TASLAK durumunda oluşturulacaktır. Kontrol edip onaylayabilirsiniz.
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExcelImportModal(false)}>İptal</Button>
            <Button onClick={handleExcelImport} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Yükle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // CREATE FORM - Devamı aynı...
  const renderCreateForm = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl text-white mb-1">Yeni Tarife Kartı</h2>
            <p className="text-sm text-gray-400">Yeni tarife oluştur ve kalemleri tanımla</p>
          </div>
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5 mr-2" />
            İptal
          </Button>
        </div>
      </div>

      {/* Tarife Bilgileri */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="flex items-center gap-2 mb-4 text-white">
          <FileText className="w-5 h-5 text-green-400" />
          Tarife Bilgileri
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-2 block">
              Tarife Kodu <span className="text-red-400">*</span>
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="2025-GENEL-TRY"
              className="bg-gray-900 border-gray-700 text-white font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block">
              Tarife Adı <span className="text-red-400">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="2025 Genel Tarife"
              className="bg-gray-900 border-gray-700 text-white"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block">Para Birimi</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
            >
              {currencyMasterData.map(curr => (
                <option key={curr.code} value={curr.code}>
                  {curr.name} ({curr.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block">Durum</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
            >
              <option value="TASLAK">TASLAK</option>
              <option value="AKTIF">AKTİF</option>
              <option value="PASIF">PASİF</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block">
              Geçerlilik Başlangıcı <span className="text-red-400">*</span>
            </label>
            <Input
              type="date"
              value={formData.valid_from}
              onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
              className="bg-gray-900 border-gray-700 text-white"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block">Geçerlilik Bitişi</label>
            <Input
              type="date"
              value={formData.valid_to}
              onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-gray-400 mb-2 block">Açıklama</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tarife hakkında açıklama..."
              className="bg-gray-900 border-gray-700 text-white text-sm min-h-[60px]"
            />
          </div>
        </div>
      </div>

      {/* Tarife Kalemleri */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="flex items-center gap-2 mb-4 text-white">
          <DollarSign className="w-5 h-5 text-green-400" />
          Tarife Kalemleri ({priceListItems.length})
        </h3>

        {/* Hizmet Ekle */}
        <div className="flex gap-3 mb-4">
          <select
            value={selectedServiceId || ''}
            onChange={(e) => setSelectedServiceId(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
          >
            <option value="">-- Hizmet seçin --</option>
            {serviceCardMasterData
              .filter(s => s.is_active)
              .filter(s => !priceListItems.some(item => item.service_card_id === s.id))
              .map(service => (
                <option key={service.id} value={service.id}>
                  {service.code} - {service.name}
                </option>
              ))}
          </select>
          <Input
            type="number"
            value={newItemUnitPrice}
            onChange={(e) => setNewItemUnitPrice(e.target.value)}
            placeholder="Fiyat"
            className="w-32 bg-gray-900 border-gray-700 text-white"
          />
          <Button
            type="button"
            onClick={handleAddPriceListItem}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ekle
          </Button>
        </div>

        {/* Kalem Tablosu */}
        {priceListItems.length > 0 && (
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-400">Hizmet Kodu</TableHead>
                  <TableHead className="text-gray-400">Hizmet Adı</TableHead>
                  <TableHead className="text-gray-400">Birim</TableHead>
                  <TableHead className="text-gray-400 text-right">Birim Fiyat</TableHead>
                  <TableHead className="text-gray-400 text-center">Durum</TableHead>
                  <TableHead className="text-gray-400 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceListItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm text-gray-300">{item.service_code}</TableCell>
                    <TableCell className="text-white">{item.service_name}</TableCell>
                    <TableCell className="text-gray-400">{item.unit_name}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleUpdateItemPrice(item.id, e.target.value)}
                        className="w-32 bg-gray-800 border-gray-700 text-white text-right ml-auto"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={item.is_active}
                        onChange={(e) => handleUpdateItemActive(item.id, e.target.checked)}
                        className="w-4 h-4"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemovePriceListItem(item.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
        >
          İptal
        </Button>
        <Button
          onClick={handleSaveCreate}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          Kaydet
        </Button>
      </div>
    </div>
  );

  // EDIT FORM - Devamı aynı kalacak ama Excel export butonu eklenecek
  const renderEditForm = () => {
    const priceListRows = priceListItems.map(item => {
      const edited = editedRows[item.service_card_id];
      
      return {
        ...item,
        unit_price: edited?.unitPrice !== undefined ? edited.unitPrice : item.unit_price,
        currency: edited?.currency || item.currency,
      };
    });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl text-white mb-1">Tarife Düzenle</h2>
              <p className="text-sm text-gray-400">{selectedTarife?.name} • {selectedTarife?.currency}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExcelModal(true);
                }}
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel'e Aktar
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
              >
                <X className="w-5 h-5 mr-2" />
                İptal
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Kaydet ({Object.keys(editedRows).length} değişiklik)
              </Button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400" />
          <div className="text-sm text-blue-400">
            Tüm hizmet kartları listeleniyor. Aktif hizmetler için fiyat girilmesi zorunludur.
          </div>
        </div>

        {/* Tarife Tablosu */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-400">Durum</TableHead>
                <TableHead className="text-gray-400">Hizmet Kodu</TableHead>
                <TableHead className="text-gray-400">Hizmet Adı</TableHead>
                <TableHead className="text-gray-400">Birim</TableHead>
                <TableHead className="text-gray-400">Para Birimi</TableHead>
                <TableHead className="text-gray-400 text-right">Birim Fiyat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceListRows.map(row => (
                <TableRow 
                  key={row.service_card_id}
                  className={!row.is_service_active ? 'opacity-50' : ''}
                >
                  <TableCell>
                    {row.is_service_active ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-500" />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-gray-300">{row.service_code}</TableCell>
                  <TableCell className="text-white">{row.service_name}</TableCell>
                  <TableCell className="text-gray-400">{row.unit_name}</TableCell>
                  <TableCell>
                    <select
                      value={row.currency}
                      onChange={(e) => handleCellEdit(row.service_card_id, 'currency', e.target.value)}
                      className="bg-gray-900 border border-gray-700 text-white rounded px-2 py-1 text-sm"
                    >
                      {currencyMasterData.map(curr => (
                        <option key={curr.code} value={curr.code}>{curr.code}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={row.unit_price}
                      onChange={(e) => handleCellEdit(row.service_card_id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-32 bg-gray-900 border-gray-700 text-white text-right ml-auto"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  // VIEW ROUTER
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {currentView === 'list' && renderList()}
        {currentView === 'create' && renderCreateForm()}
        {currentView === 'edit' && renderEditForm()}

        {/* Tarife Detay Dialog - WITH AUDIT SYSTEM */}
        {showDetailDialog && selectedTarife && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col`}>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${theme.colors.primary}/10 border border-green-500/30`}>
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl mb-1">{selectedTarife.name}</h2>
                    <p className={theme.colors.textMuted}>Kod: {selectedTarife.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(selectedTarife.status)}>
                    {selectedTarife.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDetailDialog(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="w-full justify-start rounded-none border-b border-gray-800 bg-transparent px-6">
                  <TabsTrigger value="details" className="data-[state=active]:bg-gray-800">
                    📋 Detaylar
                  </TabsTrigger>
                  <TabsTrigger value="metadata" className="data-[state=active]:bg-gray-800">
                    👤 Kayıt Bilgileri
                  </TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-gray-800">
                    📜 Değişiklik Geçmişi
                  </TabsTrigger>
                </TabsList>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="details" className="p-6 m-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Sol Blok - Genel Bilgiler */}
                      <div className="space-y-4">
                        <h3 className="flex items-center gap-2 mb-4 text-lg">
                          <FileText className="w-5 h-5 text-blue-400" />
                          Tarife Bilgileri
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div>
                            <label className={`text-xs ${theme.colors.textMuted}`}>Tarife Kodu</label>
                            <p className="mt-1 font-mono text-blue-400">{selectedTarife.code}</p>
                          </div>
                          <div>
                            <label className={`text-xs ${theme.colors.textMuted}`}>Tarife Adı</label>
                            <p className="mt-1">{selectedTarife.name}</p>
                          </div>
                          <div>
                            <label className={`text-xs ${theme.colors.textMuted}`}>Para Birimi</label>
                            <p className="mt-1">
                              <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                                {selectedTarife.currency}
                              </Badge>
                            </p>
                          </div>
                          <div>
                            <label className={`text-xs ${theme.colors.textMuted}`}>Durum</label>
                            <p className="mt-1">
                              <Badge className={getStatusColor(selectedTarife.status)}>
                                {selectedTarife.status}
                              </Badge>
                            </p>
                          </div>
                          {selectedTarife.description && (
                            <div>
                              <label className={`text-xs ${theme.colors.textMuted}`}>Açıklama</label>
                              <p className="mt-1 text-gray-300">{selectedTarife.description}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sağ Blok - Geçerlilik & Durum */}
                      <div className="space-y-4">
                        <h3 className="flex items-center gap-2 mb-4 text-lg">
                          <Calendar className="w-5 h-5 text-green-400" />
                          Geçerlilik Bilgileri
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div>
                            <label className={`text-xs ${theme.colors.textMuted}`}>Başlangıç Tarihi</label>
                            <p className="mt-1">{new Date(selectedTarife.valid_from).toLocaleDateString('tr-TR')}</p>
                          </div>
                          <div>
                            <label className={`text-xs ${theme.colors.textMuted}`}>Bitiş Tarihi</label>
                            <p className="mt-1">{selectedTarife.valid_to ? new Date(selectedTarife.valid_to).toLocaleDateString('tr-TR') : 'Süresiz'}</p>
                          </div>
                          <div>
                            <label className={`text-xs ${theme.colors.textMuted}`}>Aktif Mi?</label>
                            <p className="mt-1">
                              <Badge variant={selectedTarife.is_active ? "default" : "secondary"}>
                                {selectedTarife.is_active ? "Evet" : "Hayır"}
                              </Badge>
                            </p>
                          </div>
                          {selectedTarife.has_transactions && (
                            <div className="p-3 bg-red-950/30 border border-red-800/50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-red-400" />
                                <span className="text-sm text-red-300">Bu tarife üzerinden işlem yapılmış</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="metadata" className="p-6 m-0">
                    <RecordMetadataCard
                      tableName="price_lists"
                      recordId={selectedTarife.id}
                      theme={theme}
                    />
                  </TabsContent>

                  <TabsContent value="history" className="p-6 m-0">
                    <AuditLogViewer
                      tableName="price_lists"
                      recordId={selectedTarife.id}
                      recordName={selectedTarife.name}
                      theme={theme}
                    />
                  </TabsContent>
                </div>
              </Tabs>

              {/* Footer */}
              <div className="border-t border-gray-800 p-4 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  SQL Tablo: <code className="text-blue-400">price_list</code> · ID: {selectedTarife.id}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailDialog(false)}
                    className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
                  >
                    Kapat
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}