// HİZMET MODULE - Basitleştirilmiş gerçek API entegrasyonu
// Backend: /api/hizmet/ (FastAPI + SQLite)

import { useState, useEffect } from "react";
import { Theme } from "../ThemeSelector";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { 
  Package, 
  Plus, 
  Filter,
  Search,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Save,
  Edit,
  Trash2,
  X
} from "lucide-react";
import { hizmetApi, HizmetCreate, HizmetUpdate } from "../../lib/api/hizmet";

interface HizmetModuleProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
}

interface Hizmet {
  id: number;
  code: string;
  name: string;
  group_code?: string;
  unit?: string;
  price?: number;
  currency: string;
  vat_rate?: number;
  order_no?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export function HizmetModule({ onNavigateHome, onNavigateBack, theme }: HizmetModuleProps) {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [hizmetler, setHizmetler] = useState<Hizmet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHizmet, setSelectedHizmet] = useState<Hizmet | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    group_code: '',
    unit: '',
    price: 0,
    currency: 'TRY' as 'TRY' | 'USD' | 'EUR',
    vat_rate: 20,
    order_no: 0,
    is_active: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Backend PascalCase → Frontend snake_case transformer
  const transformHizmetResponse = (item: any): Hizmet => ({
    id: item.Id,
    code: item.Kod,
    name: item.Ad,
    group_code: item.GrupKod || '',
    unit: item.Birim || '',
    price: item.Fiyat ? parseFloat(item.Fiyat) : 0,
    currency: item.ParaBirimi || 'TRY',
    vat_rate: item.KdvOrani ? parseFloat(item.KdvOrani) : 0,
    order_no: item.SiraNo || 0,
    is_active: item.AktifMi,
    created_at: item.CreatedAt,
    updated_at: item.UpdatedAt,
  });

  // Hizmetleri yükle
  const loadHizmetler = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await hizmetApi.getAll({
        page: 1,
        page_size: 100,
        is_active: filterActive === 'ALL' ? undefined : filterActive === 'ACTIVE',
      });
      
      const rawData = Array.isArray(response) ? response : (response.items || []);
      const mappedData = rawData.map(transformHizmetResponse);
      
      setHizmetler(mappedData);
      
      if (mappedData.length === 0) {
        toast.info('Kayıt bulunamadı', {
          description: 'Filtrelere uygun hizmet kaydı bulunamadı'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Veri yüklenemedi';
      setError(errorMessage);
      toast.error('Hizmet listesi yüklenemedi', {
        description: errorMessage
      });
      console.error('Hizmet yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    if (currentView === 'list' && hizmetler.length === 0) {
      loadHizmetler();
    }
  }, []);

  // Hizmet sil
  const handleDelete = async (id: number) => {
    if (!confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) return;
    
    try {
      await hizmetApi.delete(id);
      setHizmetler(hizmetler.filter(h => h.id !== id));
      toast.success('Hizmet silindi', {
        description: 'Hizmet kaydı başarıyla silindi'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Silme işlemi başarısız';
      toast.error('Hizmet silinemedi', {
        description: errorMessage
      });
    }
  };

  // Hizmet düzenle
  const handleEdit = (hizmet: Hizmet) => {
    setSelectedHizmet(hizmet);
    setFormData({
      code: hizmet.code,
      name: hizmet.name,
      group_code: hizmet.group_code || '',
      unit: hizmet.unit || '',
      price: hizmet.price || 0,
      currency: hizmet.currency as 'TRY' | 'USD' | 'EUR',
      vat_rate: hizmet.vat_rate || 20,
      order_no: hizmet.order_no || 0,
      is_active: hizmet.is_active,
    });
    setCurrentView('edit');
  };

  // Form kaydet
  const handleSave = async () => {
    // Validasyon
    const errors: Record<string, string> = {};
    if (!formData.code) errors.code = 'Hizmet kodu zorunludur';
    if (!formData.name) errors.name = 'Hizmet adı zorunludur';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Eksik bilgi', {
        description: 'Lütfen tüm zorunlu alanları doldurun'
      });
      return;
    }
    
    setFormErrors({});
    setLoading(true);
    
    try {
      if (currentView === 'create') {
        const newHizmet: HizmetCreate = {
          Kod: formData.code.toUpperCase(),
          Ad: formData.name,
          GrupKod: formData.group_code || undefined,
          Birim: formData.unit || undefined,
          Fiyat: formData.price || undefined,
          ParaBirimi: formData.currency,
          KdvOrani: formData.vat_rate || undefined,
          SiraNo: formData.order_no || undefined,
          AktifMi: formData.is_active,
        };

        const created = await hizmetApi.create(newHizmet);
        const transformedHizmet = transformHizmetResponse(created);
        setHizmetler([transformedHizmet, ...hizmetler]);
        
        toast.success('Hizmet oluşturuldu', {
          description: `${formData.code} - ${formData.name} başarıyla kaydedildi`
        });
      } else if (currentView === 'edit' && selectedHizmet) {
        const updatedHizmet: HizmetUpdate = {
          Kod: formData.code.toUpperCase(),
          Ad: formData.name,
          GrupKod: formData.group_code || undefined,
          Birim: formData.unit || undefined,
          Fiyat: formData.price || undefined,
          ParaBirimi: formData.currency,
          KdvOrani: formData.vat_rate || undefined,
          SiraNo: formData.order_no || undefined,
          AktifMi: formData.is_active,
        };

        const updated = await hizmetApi.update(selectedHizmet.id, updatedHizmet);
        const transformedHizmet = transformHizmetResponse(updated);
        setHizmetler(hizmetler.map(h => h.id === selectedHizmet.id ? transformedHizmet : h));
        
        toast.success('Hizmet güncellendi', {
          description: `${formData.code} - ${formData.name} başarıyla güncellendi`
        });
      }
      
      resetForm();
      setCurrentView('list');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kaydetme başarısız';
      toast.error('İşlem başarısız', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Form reset
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      group_code: '',
      unit: '',
      price: 0,
      currency: 'TRY',
      vat_rate: 20,
      order_no: 0,
      is_active: true,
    });
    setSelectedHizmet(null);
    setFormErrors({});
  };

  // Filtrelenmiş hizmetler
  const filteredHizmetler = (hizmetler || []).filter(hizmet => {
    const matchesSearch = !searchTerm || 
      hizmet.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hizmet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hizmet.group_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActive = filterActive === 'ALL' || 
      (filterActive === 'ACTIVE' && hizmet.is_active) ||
      (filterActive === 'INACTIVE' && !hizmet.is_active);
    
    return matchesSearch && matchesActive;
  });

  // Statistics
  const stats = {
    total: hizmetler.length,
    active: hizmetler.filter(h => h.is_active).length,
    inactive: hizmetler.filter(h => !h.is_active).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onNavigateBack}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Package className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Hizmet Kartları</h1>
                <p className="text-sm text-gray-400">
                  Hizmet tanımları ve yönetimi
                </p>
              </div>
            </div>
          </div>
          
          {currentView === 'list' && (
            <Button
              onClick={() => setCurrentView('create')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Hizmet
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {currentView === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400">Toplam Hizmet</div>
            <div className="text-3xl font-bold text-white mt-2">{stats.total}</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400">Aktif</div>
            <div className="text-3xl font-bold text-green-400 mt-2">{stats.active}</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400">Pasif</div>
            <div className="text-3xl font-bold text-red-400 mt-2">{stats.inactive}</div>
          </div>
        </div>
      )}

      {/* List View */}
      {currentView === 'list' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg">
          {/* Filters */}
          <div className="p-4 border-b border-gray-700 flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Hizmet kodu veya adı ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700 text-white"
              />
            </div>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as typeof filterActive)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="ALL">Tümü</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Pasif</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Durum</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Kod</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Hizmet Adı</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Grup</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Birim</th>
                  <th className="text-right px-4 py-3 text-sm text-gray-400">Fiyat</th>
                  <th className="text-center px-4 py-3 text-sm text-gray-400">KDV %</th>
                  <th className="text-right px-4 py-3 text-sm text-gray-400">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredHizmetler.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      Kayıt bulunamadı
                    </td>
                  </tr>
                ) : (
                  filteredHizmetler.map((hizmet) => (
                    <tr
                      key={hizmet.id}
                      className="border-b border-gray-800 hover:bg-gray-700/50"
                    >
                      <td className="px-4 py-4">
                        {hizmet.is_active ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                            Pasif
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm text-white">{hizmet.code}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-white font-medium">{hizmet.name}</span>
                      </td>
                      <td className="px-4 py-4 text-gray-400">{hizmet.group_code || '-'}</td>
                      <td className="px-4 py-4 text-gray-400">{hizmet.unit || '-'}</td>
                      <td className="px-4 py-4 text-right text-white">
                        {hizmet.price ? `${Number(hizmet.price).toFixed(2)} ${hizmet.currency}` : '-'}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-400">
                        {hizmet.vat_rate ? `%${hizmet.vat_rate}` : '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(hizmet)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(hizmet.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {(currentView === 'create' || currentView === 'edit') && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {currentView === 'create' ? 'Yeni Hizmet' : 'Hizmet Düzenle'}
            </h2>
            <Button
              variant="ghost"
              onClick={() => {
                resetForm();
                setCurrentView('list');
              }}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Hizmet Kodu *
              </label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="bg-gray-900 border-gray-700 text-white"
                placeholder="HZ-001"
              />
              {formErrors.code && (
                <p className="text-red-400 text-sm mt-1">{formErrors.code}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Hizmet Adı *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-gray-900 border-gray-700 text-white"
                placeholder="Hizmet adını girin"
              />
              {formErrors.name && (
                <p className="text-red-400 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Grup Kodu
              </label>
              <Input
                value={formData.group_code}
                onChange={(e) => setFormData({ ...formData, group_code: e.target.value })}
                className="bg-gray-900 border-gray-700 text-white"
                placeholder="BARINMA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Birim
              </label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="bg-gray-900 border-gray-700 text-white"
                placeholder="ADET, SAAT, GÜN, AY"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Fiyat
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Para Birimi
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'TRY' | 'USD' | 'EUR' })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="TRY">TRY (₺)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                KDV Oranı (%)
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.vat_rate}
                onChange={(e) => setFormData({ ...formData, vat_rate: parseFloat(e.target.value) })}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Sıra No
              </label>
              <Input
                type="number"
                value={formData.order_no}
                onChange={(e) => setFormData({ ...formData, order_no: parseInt(e.target.value) })}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-700"
                />
                Aktif
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setCurrentView('list');
              }}
              className="border-gray-700 text-gray-400 hover:text-white"
            >
              İptal
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
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
      )}
    </div>
  );
}
