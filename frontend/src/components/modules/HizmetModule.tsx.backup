// HİZMET MODULE - Hizmet Kartları modülü ana component
// Eski sistem özellikleri ile tam uyumlu
// SQL şemasına 1:1 eşleşen yapı

import { useState, useEffect } from "react";
import { Theme } from "../ThemeSelector";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { 
  Package, 
  Plus, 
  Filter,
  Search,
  Loader2,
  AlertCircle,
  Tag,
  ArrowLeft,
  Save,
  FileText,
  X,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { hizmetApi, hizmetApiMock } from "../../lib/api/hizmet";
import type { ServiceCard as ServiceCardType } from "../../lib/types/database";
import { HizmetKartiDetay } from "../HizmetKartiDetay";
import {
  parameterUnitsMasterData,
  parameterVatRatesMasterData,
  parameterVatExemptionsMasterData,
  parameterServiceGroupsMasterData,
  parameterServiceCategoriesMasterData,
  parameterPricingRulesMasterData,
} from "../../data/parametersData";

interface HizmetModuleProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
  initialPage?: 'list' | 'create';
}

// ESKİ SİSTEM İLE UYUMLU ServiceCard interface
interface ServiceCardFull {
  id: number;
  code: string;
  name: string;
  description: string;
  accounting_code: string;
  unit_id: number | null;
  vat_rate_id: number | null;
  vat_exemption_id: number;
  group_id: number | null;
  category_id: number | null;
  pricing_rule_id: number | null;
  is_active: boolean;
  metadata_json: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: number;
  updated_by: number | null;
}

export function HizmetModule({ 
  onNavigateHome, 
  onNavigateBack, 
  theme,
  initialPage = 'list'
}: HizmetModuleProps) {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>(initialPage);
  const [hizmetler, setHizmetler] = useState<ServiceCardFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHizmet, setSelectedHizmet] = useState<ServiceCardFull | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState<number | 'ALL'>('ALL');
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Form state - ESKİ SİSTEME TAM UYUMLU
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    accounting_code: '',
    unit_id: null as number | null,
    vat_rate_id: 1 as number | null, // Default %20
    vat_exemption_id: 1, // Default İstisna Yok
    group_id: null as number | null,
    category_id: null as number | null,
    pricing_rule_id: null as number | null,
    is_active: true,
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Mock mode
  const MOCK_MODE = true;

  // Helper: Parse metadata JSON
  const parseMetadata = (metadataJson: string | null) => {
    if (!metadataJson) return { tags: [] };
    try {
      const parsed = JSON.parse(metadataJson);
      return { tags: parsed.tags || [] };
    } catch {
      return { tags: [] };
    }
  };

  // Hizmetleri yükle
  const loadHizmetler = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (MOCK_MODE) {
        // Mock data kullan - ESKİ SİSTEMDEN İMPORT
        const { serviceCardMasterData } = await import('../../data/serviceCardData');
        setHizmetler(serviceCardMasterData);
      } else {
        const response = await hizmetApi.getAll({
          page: 1,
          page_size: 100,
        });
        // API'den gelen veriyi ServiceCardFull formatına dönüştür
        const fullData = response.items.map(item => ({
          ...item,
          description: item.description || '',
          accounting_code: '',
          unit_id: null,
          vat_rate_id: 1,
          vat_exemption_id: 1,
          group_id: null,
          category_id: null,
          pricing_rule_id: null,
          metadata_json: null,
          created_by: 1,
          updated_by: null,
        }));
        setHizmetler(fullData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi');
      console.error('Hizmet yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    if (currentView === 'list') {
      loadHizmetler();
    }
  }, [currentView]);

  // Hizmet sil
  const handleDelete = async (id: number) => {
    if (!confirm('Bu hizmet kartını silmek istediğinizden emin misiniz?')) return;
    
    try {
      if (!MOCK_MODE) {
        await hizmetApi.delete(id);
      }
      setHizmetler(hizmetler.filter(h => h.id !== id));
    } catch (err) {
      alert('Silme işlemi başarısız: ' + (err instanceof Error ? err.message : 'Hata'));
    }
  };

  // Hizmet aktif/pasif
  const handleToggleActive = async (id: number) => {
    try {
      if (!MOCK_MODE) {
        await hizmetApi.toggleActive(id);
      }
      setHizmetler(hizmetler.map(h => 
        h.id === id ? { ...h, is_active: !h.is_active } : h
      ));
    } catch (err) {
      alert('Güncelleme başarısız: ' + (err instanceof Error ? err.message : 'Hata'));
    }
  };

  // Hizmet düzenle
  const handleEdit = (hizmet: ServiceCardFull) => {
    setSelectedHizmet(hizmet);
    const metadata = parseMetadata(hizmet.metadata_json);
    setFormData({
      code: hizmet.code,
      name: hizmet.name,
      description: hizmet.description,
      accounting_code: hizmet.accounting_code,
      unit_id: hizmet.unit_id,
      vat_rate_id: hizmet.vat_rate_id,
      vat_exemption_id: hizmet.vat_exemption_id,
      group_id: hizmet.group_id,
      category_id: hizmet.category_id,
      pricing_rule_id: hizmet.pricing_rule_id,
      is_active: hizmet.is_active,
      tags: metadata.tags,
    });
    setCurrentView('edit');
  };

  // Grup değiştiğinde kategoriyi sıfırla
  const handleGroupChange = (groupId: number | null) => {
    setFormData({
      ...formData,
      group_id: groupId,
      category_id: null,
    });
  };

  // KDV İstisna değiştiğinde KDV Oranını kontrol et
  const handleVatExemptionChange = (exemptionId: number) => {
    const exemption = parameterVatExemptionsMasterData.find((e) => e.id === exemptionId);
    setFormData({
      ...formData,
      vat_exemption_id: exemptionId,
      vat_rate_id: exemption?.force_zero_vat ? 4 : formData.vat_rate_id, // %0 KDV
    });
  };

  // İstisna varsa KDV oranı disabled mı?
  const isVatRateDisabled = () => {
    const exemption = parameterVatExemptionsMasterData.find(
      (e) => e.id === formData.vat_exemption_id
    );
    return exemption?.force_zero_vat || false;
  };

  // Seçilen gruba göre kategorileri filtrele
  const getAvailableCategories = () => {
    if (!formData.group_id) return [];
    return parameterServiceCategoriesMasterData.filter(
      (cat) => cat.group_id === formData.group_id && cat.is_active
    );
  };

  // Tag ekle
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  // Tag sil
  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim()) {
      errors.code = 'Hizmet kodu zorunludur';
    } else if (formData.code.length < 3) {
      errors.code = 'Hizmet kodu en az 3 karakter olmalıdır';
    }

    if (!formData.name.trim()) {
      errors.name = 'Hizmet adı zorunludur';
    }

    if (!formData.unit_id) {
      errors.unit_id = 'Birim seçimi zorunludur';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      const metadataJson = JSON.stringify({
        tags: formData.tags,
      });

      if (currentView === 'create') {
        // Yeni kayıt
        const newHizmet: ServiceCardFull = {
          id: Math.max(0, ...hizmetler.map(h => h.id)) + 1,
          code: formData.code.toUpperCase(),
          name: formData.name,
          description: formData.description,
          accounting_code: formData.accounting_code,
          unit_id: formData.unit_id,
          vat_rate_id: formData.vat_rate_id,
          vat_exemption_id: formData.vat_exemption_id,
          group_id: formData.group_id,
          category_id: formData.category_id,
          pricing_rule_id: formData.pricing_rule_id,
          is_active: formData.is_active,
          metadata_json: metadataJson,
          created_at: new Date().toISOString(),
          updated_at: null,
          created_by: 1,
          updated_by: null,
        };

        if (!MOCK_MODE) {
          await hizmetApi.create(newHizmet as any);
        }
        
        setHizmetler([newHizmet, ...hizmetler]);
        alert('✅ Hizmet başarıyla oluşturuldu!');
      } else if (currentView === 'edit' && selectedHizmet) {
        // Güncelleme
        const updatedHizmet: ServiceCardFull = {
          ...selectedHizmet,
          code: formData.code.toUpperCase(),
          name: formData.name,
          description: formData.description,
          accounting_code: formData.accounting_code,
          unit_id: formData.unit_id,
          vat_rate_id: formData.vat_rate_id,
          vat_exemption_id: formData.vat_exemption_id,
          group_id: formData.group_id,
          category_id: formData.category_id,
          pricing_rule_id: formData.pricing_rule_id,
          is_active: formData.is_active,
          metadata_json: metadataJson,
          updated_at: new Date().toISOString(),
          updated_by: 1,
        };

        if (!MOCK_MODE) {
          await hizmetApi.update(selectedHizmet.id, updatedHizmet as any);
        }
        
        setHizmetler(hizmetler.map(h => h.id === selectedHizmet.id ? updatedHizmet : h));
        alert('✅ Hizmet başarıyla güncellendi!');
        
        if (changeNote) {
          console.log('Değişiklik Notu:', changeNote);
        }
      }

      // Form reset ve liste görünümüne dön
      resetForm();
      setCurrentView('list');
      
    } catch (err) {
      alert('Kaydetme başarısız: ' + (err instanceof Error ? err.message : 'Hata'));
    } finally {
      setLoading(false);
    }
  };

  // Form reset
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      accounting_code: '',
      unit_id: null,
      vat_rate_id: 1,
      vat_exemption_id: 1,
      group_id: null,
      category_id: null,
      pricing_rule_id: null,
      is_active: true,
      tags: [],
    });
    setFormErrors({});
    setSelectedHizmet(null);
    setChangeNote('');
    setTagInput('');
  };

  // Form iptal
  const handleCancel = () => {
    resetForm();
    setCurrentView('list');
  };

  // Filtrelenmiş hizmetler
  const filteredHizmetler = hizmetler.filter(hizmet => {
    const matchesSearch = !searchTerm || 
      hizmet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hizmet.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hizmet.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = filterGroup === 'ALL' || hizmet.group_id === filterGroup;
    const matchesActive = filterActive === 'ALL' || 
      (filterActive === 'ACTIVE' ? hizmet.is_active : !hizmet.is_active);
    
    return matchesSearch && matchesGroup && matchesActive;
  });

  // Grup istatistikleri
  const groupStats = hizmetler.reduce((acc, h) => {
    if (h.group_id) {
      acc[h.group_id] = (acc[h.group_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  // Helper functions
  const getUnitName = (unitId: number | null) => {
    if (!unitId) return '-';
    const unit = parameterUnitsMasterData.find(u => u.id === unitId);
    return unit ? `${unit.name} (${unit.code})` : '-';
  };

  const getGroupName = (groupId: number | null) => {
    if (!groupId) return '-';
    const group = parameterServiceGroupsMasterData.find(g => g.id === groupId);
    return group ? group.name : '-';
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return '-';
    const category = parameterServiceCategoriesMasterData.find(c => c.id === categoryId);
    return category ? category.name : '-';
  };

  const getVatRateName = (vatRateId: number | null) => {
    if (!vatRateId) return '-';
    const rate = parameterVatRatesMasterData.find(r => r.id === vatRateId);
    return rate ? `${rate.rate}%` : '-';
  };

  // HİZMET LİSTESİ GÖRÜNÜMÜ
  const renderList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Hizmet Kartları</h1>
              <p className="text-sm text-gray-400">
                {filteredHizmetler.length} hizmet {MOCK_MODE && '• 🔶 Mock Mode'}
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => setCurrentView('create')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Yeni Kart Tanımla
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Hizmet ara (isim, kod veya açıklama)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
          
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none min-w-[200px]"
          >
            <option value="ALL">Tüm Gruplar</option>
            {parameterServiceGroupsMasterData
              .filter(g => g.is_active)
              .map(group => (
                <option key={group.id} value={group.id}>
                  {group.name} ({groupStats[group.id] || 0})
                </option>
              ))}
          </select>
          
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as any)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="ALL">Tümü</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Pasif</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div className="text-red-400">{error}</div>
        </div>
      )}

      {/* Hizmet Table */}
      {!loading && !error && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Durum</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Kod</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Hizmet Adı</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Grup</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Birim</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">KDV</th>
                <th className="text-right px-4 py-3 text-sm text-gray-400">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredHizmetler.map(hizmet => (
                <tr 
                  key={hizmet.id} 
                  onClick={() => {
                    setSelectedHizmet(hizmet);
                    setShowDetailDialog(true);
                  }}
                  className="border-b border-gray-800 hover:bg-gray-900/30 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    {hizmet.is_active ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-300">{hizmet.code}</td>
                  <td className="px-4 py-3">
                    <div className="text-white">{hizmet.name}</div>
                    {hizmet.description && (
                      <div className="text-xs text-gray-500 mt-1">{hizmet.description.substring(0, 60)}...</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{getGroupName(hizmet.group_id)}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{getUnitName(hizmet.unit_id)}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{getVatRateName(hizmet.vat_rate_id)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(hizmet);
                        }}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(hizmet.id);
                        }}
                        className={hizmet.is_active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}
                      >
                        {hizmet.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(hizmet.id);
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredHizmetler.length === 0 && (
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
          <p className="text-gray-400 mb-4">Hizmet kartı bulunamadı</p>
          <Button
            onClick={() => setCurrentView('create')}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Kart Tanımla
          </Button>
        </div>
      )}
    </div>
  );

  // HİZMET OLUŞTUR/DÜZENLE FORM GÖRÜNÜMÜ - ESKİ SİSTEM GİBİ
  const renderForm = () => (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800/80">
          <div>
            <h2 className="text-2xl text-white mb-1">
              {currentView === 'create' ? 'Yeni Hizmet Kartı' : 'Hizmet Kartı Düzenle'}
            </h2>
            <p className="text-sm text-gray-400">
              {currentView === 'create' 
                ? 'Yeni hizmet kartı oluştur' 
                : `ID: ${selectedHizmet?.id} · Kod: ${selectedHizmet?.code}`
              }
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sol Blok - Genel Bilgiler */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 mb-3 text-white">
                <FileText className="w-5 h-5 text-blue-400" />
                Genel Bilgiler
              </h3>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  Hizmet Kodu <span className="text-red-400">*</span>
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="MB-BAR-001"
                  className={`bg-gray-800/50 border ${formErrors.code ? 'border-red-500' : 'border-gray-700'} text-white font-mono`}
                  required
                />
                {formErrors.code && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.code}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  Hizmet Adı <span className="text-red-400">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Motorbot Barınma Hizmeti (Yıllık)"
                  className={`bg-gray-800/50 border ${formErrors.name ? 'border-red-500' : 'border-gray-700'} text-white`}
                  required
                />
                {formErrors.name && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">Açıklama</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Hizmet hakkında detaylı açıklama..."
                  className="bg-gray-800/50 border-gray-700 text-white text-sm min-h-[80px]"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  Muhasebe Kodu
                </label>
                <Input
                  value={formData.accounting_code}
                  onChange={(e) => setFormData({ ...formData, accounting_code: e.target.value.toUpperCase() })}
                  placeholder="600.01.001"
                  className="bg-gray-800/50 border-gray-700 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Grup</label>
                  <select
                    value={formData.group_id || ''}
                    onChange={(e) => handleGroupChange(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                  >
                    <option value="">-- Grup seçin --</option>
                    {parameterServiceGroupsMasterData
                      .filter((g) => g.is_active)
                      .map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Kategori</label>
                  <select
                    value={formData.category_id || ''}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                    disabled={!formData.group_id}
                  >
                    <option value="">-- Kategori seçin --</option>
                    {getAvailableCategories().map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  Etiketler (Tags)
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Etiket ekle..."
                    className="bg-gray-800/50 border-gray-700 text-white text-sm"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddTag}
                    className="bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                  >
                    Ekle
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-blue-500/30 text-blue-400 cursor-pointer hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-xs"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} ✕
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">Durum</label>
                <select
                  value={formData.is_active ? 'ACTIVE' : 'PASSIVE'}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'ACTIVE' })}
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                >
                  <option value="ACTIVE">AKTİF</option>
                  <option value="PASSIVE">PASİF</option>
                </select>
              </div>
            </div>

            {/* Sağ Blok - Birim & KDV */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 mb-3 text-white">
                <Tag className="w-5 h-5 text-green-400" />
                Birim & KDV
              </h3>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  Birim <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.unit_id || ''}
                  onChange={(e) => setFormData({ ...formData, unit_id: e.target.value ? Number(e.target.value) : null })}
                  className={`w-full bg-gray-800/50 border ${formErrors.unit_id ? 'border-red-500' : 'border-gray-700'} text-white rounded-md px-3 py-2.5 text-sm`}
                  required
                >
                  <option value="">-- Birim seçin --</option>
                  {parameterUnitsMasterData
                    .filter((u) => u.is_active)
                    .map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} ({unit.code})
                      </option>
                    ))}
                </select>
                {formErrors.unit_id && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.unit_id}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  Fiyatlandırma Hesaplama Kuralı
                </label>
                <select
                  value={formData.pricing_rule_id || ''}
                  onChange={(e) => setFormData({ ...formData, pricing_rule_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                >
                  <option value="">-- Kural Yok (Standart Birim x Fiyat) --</option>
                  {parameterPricingRulesMasterData
                    .filter((r) => r.is_active)
                    .map((rule) => (
                      <option key={rule.id} value={rule.id}>
                        {rule.name} - Min: {rule.min_quantity}
                      </option>
                    ))}
                </select>
                {formData.pricing_rule_id && (
                  <div className="mt-2 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs text-cyan-400">
                    {parameterPricingRulesMasterData.find((r) => r.id === formData.pricing_rule_id)?.description}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">KDV Oranı (%)</label>
                <select
                  value={formData.vat_rate_id || ''}
                  onChange={(e) => setFormData({ ...formData, vat_rate_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                  disabled={isVatRateDisabled()}
                >
                  {parameterVatRatesMasterData.map((rate) => (
                    <option key={rate.id} value={rate.id}>
                      {rate.rate}%
                    </option>
                  ))}
                </select>
                {isVatRateDisabled() && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                    KDV İstisnası nedeniyle KDV oranı %0 olarak ayarlandı.
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">KDV İstisna</label>
                <select
                  value={formData.vat_exemption_id}
                  onChange={(e) => handleVatExemptionChange(Number(e.target.value))}
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                >
                  {parameterVatExemptionsMasterData.map((exemption) => (
                    <option key={exemption.id} value={exemption.id}>
                      {exemption.name}
                    </option>
                  ))}
                </select>
              </div>

              {currentView === 'edit' && (
                <div className="border-t border-gray-800 pt-4 mt-6">
                  <label className="text-xs text-gray-400 mb-2 block">
                    Değişiklik Notu (Opsiyonel)
                  </label>
                  <Textarea
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    placeholder="Bu değişiklik neden yapıldı?"
                    className="bg-gray-800/50 border-gray-700 text-white text-sm min-h-[80px]"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    <AlertCircle className="inline w-3 h-3 mr-1" />
                    Bu not değişiklik geçmişinde kaydedilecektir.
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            <span className="text-red-400">*</span> ile işaretli alanlar zorunludur
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
            >
              İptal
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Kaydet
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // VIEW ROUTER
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {currentView === 'list' && renderList()}
        {(currentView === 'create' || currentView === 'edit') && renderForm()}
        
        {/* Hizmet Kartı Detay Dialog - YENİ AUDIT SİSTEMLİ */}
        {showDetailDialog && selectedHizmet && (
          <HizmetKartiDetay
            service={{
              ...selectedHizmet,
              unit: getUnitName(selectedHizmet.unit_id),
              category: getCategoryName(selectedHizmet.category_id),
            } as any}
            onClose={() => {
              setShowDetailDialog(false);
              setSelectedHizmet(null);
            }}
            onEdit={() => {
              setShowDetailDialog(false);
              handleEdit(selectedHizmet);
            }}
            onDelete={(service) => {
              handleDelete(service.id);
              setShowDetailDialog(false);
              setSelectedHizmet(null);
            }}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}