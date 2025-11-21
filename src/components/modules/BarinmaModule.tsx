// BARINMA MODULE - Barınma Kontratları modülü - Gerçek API entegrasyonlu
// Backend: /api/barinma/ (FastAPI + SQLite)
// Pattern: HizmetModule.tsx takip ediliyor

import { useState, useEffect } from "react";
import { Theme } from "../ThemeSelector";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { 
  Anchor, 
  Plus, 
  Search,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Save,
  X,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { barinmaApi, BarinmaContract } from "../../lib/api/barinma";

interface BarinmaModuleProps {
  onNavigateBack: () => void;
  theme: Theme;
  initialPage?: 'list' | 'create';
}

export function BarinmaModule({ 
  onNavigateBack, 
  theme,
  initialPage = 'list'
}: BarinmaModuleProps) {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>(initialPage);
  const [contracts, setContracts] = useState<BarinmaContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<BarinmaContract | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Form state
  const [formData, setFormData] = useState({
    contract_number: '',
    motorbot_id: 0,
    cari_id: 0,
    service_card_id: 1, // Default service
    price_list_id: 1, // Default price list
    start_date: '',
    end_date: '',
    unit_price: 0,
    currency: 'TRY',
    vat_rate: 20,
    billing_period: 'MONTHLY',
    is_active: true,
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load contracts - REAL API
  const loadContracts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: any = { page: 1, page_size: 100 };
      if (filterActive !== 'ALL') {
        params.is_active = filterActive === 'ACTIVE';
      }
      
      const response = await barinmaApi.getAll(params);
      
      setContracts(response);
      
      if (response.length === 0) {
        toast.info('Kayıt bulunamadı', {
          description: 'Filtrelere uygun kontrat bulunamadı'
        });
      } else {
        toast.success('Kontratlar yüklendi', {
          description: `${response.length} kontrat kaydı listelendi`
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Veri yüklenemedi';
      setError(errorMessage);
      toast.error('Kontrat listesi yüklenemedi', {
        description: errorMessage
      });
      console.error('Kontrat yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (currentView === 'list') {
      loadContracts();
    }
  }, [currentView, filterActive]);

  // Delete contract
  const handleDelete = async (id: number) => {
    if (!confirm('Bu kontratı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await barinmaApi.delete(id);
      setContracts(contracts.filter(c => c.id !== id));
      toast.success('Kontrat silindi', {
        description: 'Kontrat başarıyla silindi'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Silme işlemi başarısız';
      toast.error('Kontrat silinemedi', {
        description: errorMessage
      });
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async (id: number) => {
    const contract = contracts.find(c => c.id === id);
    if (!contract) return;

    try {
      await barinmaApi.update(id, { IsActive: !contract.is_active });
      setContracts(contracts.map(c => 
        c.id === id ? { ...c, is_active: !c.is_active } : c
      ));
      toast.success('Durum güncellendi', {
        description: `Kontrat ${!contract.is_active ? 'aktif' : 'pasif'} edildi`
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Güncelleme başarısız';
      toast.error('Durum güncellenemedi', {
        description: errorMessage
      });
    }
  };

  // Edit contract
  const handleEdit = (contract: BarinmaContract) => {
    setSelectedContract(contract);
    setFormData({
      contract_number: contract.contract_number,
      motorbot_id: contract.motorbot_id,
      cari_id: contract.cari_id,
      service_card_id: contract.service_card_id,
      price_list_id: contract.price_list_id,
      start_date: contract.start_date,
      end_date: contract.end_date || '',
      unit_price: contract.unit_price,
      currency: contract.currency,
      vat_rate: contract.vat_rate,
      billing_period: contract.billing_period,
      is_active: contract.is_active,
      notes: contract.notes || '',
    });
    setCurrentView('edit');
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.contract_number.trim()) errors.contract_number = 'Kontrat numarası zorunludur';
    if (formData.motorbot_id === 0) errors.motorbot_id = 'Tekne seçilmelidir';
    if (formData.cari_id === 0) errors.cari_id = 'Cari seçilmelidir';
    if (!formData.start_date) errors.start_date = 'Başlangıç tarihi zorunludur';
    if (formData.unit_price <= 0) errors.unit_price = 'Birim fiyat sıfırdan büyük olmalıdır';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save contract (create or update)
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Form hatası', {
        description: 'Lütfen gerekli alanları doldurun'
      });
      return;
    }

    setLoading(true);
    
    try {
      if (currentView === 'create') {
        // CREATE
        const newContract = await barinmaApi.create({
          ContractNumber: formData.contract_number,
          MotorbotId: formData.motorbot_id,
          CariId: formData.cari_id,
          ServiceCardId: formData.service_card_id,
          PriceListId: formData.price_list_id,
          StartDate: formData.start_date,
          EndDate: formData.end_date || null,
          UnitPrice: formData.unit_price,
          Currency: formData.currency,
          VatRate: formData.vat_rate,
          BillingPeriod: formData.billing_period,
          IsActive: formData.is_active,
          Notes: formData.notes,
          CreatedBy: 1,
        });
        
        setContracts([newContract, ...contracts]);
        toast.success('Kontrat oluşturuldu', {
          description: `Kontrat No: ${newContract.contract_number}`
        });
      } else if (currentView === 'edit' && selectedContract) {
        // UPDATE
        const updatedContract = await barinmaApi.update(selectedContract.id, {
          ContractNumber: formData.contract_number,
          MotorbotId: formData.motorbot_id,
          CariId: formData.cari_id,
          ServiceCardId: formData.service_card_id,
          PriceListId: formData.price_list_id,
          StartDate: formData.start_date,
          EndDate: formData.end_date || null,
          UnitPrice: formData.unit_price,
          Currency: formData.currency,
          VatRate: formData.vat_rate,
          BillingPeriod: formData.billing_period,
          IsActive: formData.is_active,
          Notes: formData.notes,
          UpdatedBy: 1,
        });
        
        setContracts(contracts.map(c => c.id === selectedContract.id ? updatedContract : c));
        toast.success('Kontrat güncellendi', {
          description: `Kontrat No: ${updatedContract.contract_number}`
        });
      }
      
      // Reset form and go back to list
      setCurrentView('list');
      resetForm();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'İşlem başarısız';
      toast.error('Kaydetme hatası', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      contract_number: '',
      motorbot_id: 0,
      cari_id: 0,
      service_card_id: 1,
      price_list_id: 1,
      start_date: '',
      end_date: '',
      unit_price: 0,
      currency: 'TRY',
      vat_rate: 20,
      billing_period: 'MONTHLY',
      is_active: true,
      notes: '',
    });
    setFormErrors({});
    setSelectedContract(null);
  };

  // Handle cancel
  const handleCancel = () => {
    resetForm();
    setCurrentView('list');
  };

  // Filter contracts
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.id.toString().includes(searchTerm);
    
    return matchesSearch;
  });

  // ========== RENDER ==========

  const bgColor = theme.colors.bgCard;
  const textColor = theme.colors.text;
  const borderColor = theme.colors.border;

  // LIST VIEW
  if (currentView === 'list') {
    return (
      <div className={`h-screen ${bgColor} ${textColor} flex flex-col`}>
        {/* Header */}
        <div className={`border-b ${borderColor} px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onNavigateBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-blue-900/50 rounded-lg`}>
                  <Anchor className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">Barınma Kontratları</h1>
                  <p className="text-sm text-gray-500">Tekne barınma kontratları yönetimi</p>
                </div>
              </div>
            </div>
            <Button onClick={() => setCurrentView('create')} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Kontrat
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className={`border-b ${borderColor} px-6 py-3`}>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Kontrat no veya ID ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterActive === 'ALL' ? 'default' : 'outline'}
                onClick={() => setFilterActive('ALL')}
                size="sm"
              >
                Tümü
              </Button>
              <Button
                variant={filterActive === 'ACTIVE' ? 'default' : 'outline'}
                onClick={() => setFilterActive('ACTIVE')}
                size="sm"
              >
                Aktif
              </Button>
              <Button
                variant={filterActive === 'INACTIVE' ? 'default' : 'outline'}
                onClick={() => setFilterActive('INACTIVE')}
                size="sm"
              >
                Pasif
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-red-500">{error}</p>
                <Button onClick={loadContracts} className="mt-4">
                  Tekrar Dene
                </Button>
              </div>
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Kayıt bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredContracts.map((contract) => (
                <div
                  key={contract.id}
                  className={`border ${borderColor} rounded-lg p-4 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{contract.contract_number}</h3>
                        <Badge variant={contract.is_active ? 'default' : 'secondary'}>
                          {contract.is_active ? 'Aktif' : 'Pasif'}
                        </Badge>
                        <Badge variant="outline">
                          {contract.billing_period}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Motorbot ID:</span>
                          <span className="ml-2 font-medium">{contract.motorbot_id}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Cari ID:</span>
                          <span className="ml-2 font-medium">{contract.cari_id}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Başlangıç:</span>
                          <span className="ml-2 font-medium">{contract.start_date}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Bitiş:</span>
                          <span className="ml-2 font-medium">{contract.end_date || 'Belirsiz'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Fiyat:</span>
                          <span className="ml-2 font-medium">
                            {contract.unit_price.toLocaleString('tr-TR', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })} {contract.currency}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">KDV:</span>
                          <span className="ml-2 font-medium">%{contract.vat_rate}</span>
                        </div>
                      </div>
                      {contract.notes && (
                        <p className="mt-2 text-sm text-gray-600">{contract.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(contract)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(contract.id)}
                      >
                        {contract.is_active ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(contract.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // CREATE/EDIT VIEW
  return (
    <div className={`h-screen ${bgColor} ${textColor} flex flex-col`}>
      {/* Header */}
      <div className={`border-b ${borderColor} px-6 py-4`}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-blue-900/50 rounded-lg`}>
              <Anchor className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">
                {currentView === 'create' ? 'Yeni Kontrat' : 'Kontrat Düzenle'}
              </h1>
              <p className="text-sm text-gray-500">
                {currentView === 'create' ? 'Yeni barınma kontratı oluştur' : 'Mevcut kontratı güncelle'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Contract Number */}
          <div>
            <Label>Kontrat Numarası *</Label>
            <Input
              value={formData.contract_number}
              onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
              placeholder="örn: KONTRAT-2025-001"
              className={formErrors.contract_number ? 'border-red-500' : ''}
            />
            {formErrors.contract_number && (
              <p className="text-sm text-red-500 mt-1">{formErrors.contract_number}</p>
            )}
          </div>

          {/* Motorbot & Cari */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Motorbot ID *</Label>
              <Input
                type="number"
                value={formData.motorbot_id || ''}
                onChange={(e) => setFormData({ ...formData, motorbot_id: parseInt(e.target.value) || 0 })}
                placeholder="Tekne ID"
                className={formErrors.motorbot_id ? 'border-red-500' : ''}
              />
              {formErrors.motorbot_id && (
                <p className="text-sm text-red-500 mt-1">{formErrors.motorbot_id}</p>
              )}
            </div>
            <div>
              <Label>Cari ID *</Label>
              <Input
                type="number"
                value={formData.cari_id || ''}
                onChange={(e) => setFormData({ ...formData, cari_id: parseInt(e.target.value) || 0 })}
                placeholder="Müşteri ID"
                className={formErrors.cari_id ? 'border-red-500' : ''}
              />
              {formErrors.cari_id && (
                <p className="text-sm text-red-500 mt-1">{formErrors.cari_id}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Başlangıç Tarihi *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className={formErrors.start_date ? 'border-red-500' : ''}
              />
              {formErrors.start_date && (
                <p className="text-sm text-red-500 mt-1">{formErrors.start_date}</p>
              )}
            </div>
            <div>
              <Label>Bitiş Tarihi</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Birim Fiyat *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.unit_price || ''}
                onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className={formErrors.unit_price ? 'border-red-500' : ''}
              />
              {formErrors.unit_price && (
                <p className="text-sm text-red-500 mt-1">{formErrors.unit_price}</p>
              )}
            </div>
            <div>
              <Label>Para Birimi</Label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="flex h-9 w-full rounded-md border border-gray-700 bg-gray-800/50 text-white px-3 py-1 text-sm"
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <Label>KDV Oranı (%)</Label>
              <Input
                type="number"
                value={formData.vat_rate || ''}
                onChange={(e) => setFormData({ ...formData, vat_rate: parseFloat(e.target.value) || 0 })}
                placeholder="20"
              />
            </div>
          </div>

          {/* Billing Period */}
          <div>
            <Label>Ödeme Periyodu</Label>
            <select
              value={formData.billing_period}
              onChange={(e) => setFormData({ ...formData, billing_period: e.target.value })}
              className="flex h-9 w-full rounded-md border border-gray-700 bg-gray-800/50 text-white px-3 py-1 text-sm"
            >
              <option value="MONTHLY">Aylık</option>
              <option value="QUARTERLY">3 Aylık</option>
              <option value="YEARLY">Yıllık</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <Label>Notlar</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Kontrat ile ilgili notlar..."
              rows={4}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="is_active">Aktif kontrat</Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              İptal
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Kaydet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
