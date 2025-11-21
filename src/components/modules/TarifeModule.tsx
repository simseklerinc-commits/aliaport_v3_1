// TARİFE MODULE - Basitleştirilmiş gerçek API entegrasyonu
// Backend: /api/price-list/ (FastAPI + SQLite)

import { useState, useEffect } from "react";
import { Theme } from "../ThemeSelector";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { 
  DollarSign, 
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
import { tarifeApi, PriceList } from "../../lib/api/tarife";

interface TarifeModuleProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
}

export function TarifeModule({ onNavigateHome, onNavigateBack, theme }: TarifeModuleProps) {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [tarifeler, setTarifeler] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTarife, setSelectedTarife] = useState<PriceList | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AKTIF' | 'PASIF' | 'TASLAK'>('AKTIF');

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    currency: 'TRY' as 'TRY' | 'USD' | 'EUR',
    version: 1,
    status: 'TASLAK' as 'AKTIF' | 'PASIF' | 'TASLAK',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
    is_active: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Tarifeleri yükle
  const loadTarifeler = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tarifeApi.getAll({
        page: 1,
        page_size: 100,
        status: filterStatus === 'ALL' ? undefined : filterStatus,
      });
      
      setTarifeler(response.items);
      
      if (response.items.length === 0) {
        toast.info('Kayıt bulunamadı', {
          description: 'Filtrelere uygun tarife kaydı bulunamadı'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Veri yüklenemedi';
      setError(errorMessage);
      toast.error('Tarife listesi yüklenemedi', {
        description: errorMessage
      });
      console.error('Tarife yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    if (currentView === 'list' && tarifeler.length === 0) {
      loadTarifeler();
    }
  }, []);

  // Tarife sil
  const handleDelete = async (id: number) => {
    if (!confirm('Bu tarifeyi silmek istediğinizden emin misiniz?')) return;
    
    try {
      await tarifeApi.delete(id);
      setTarifeler(tarifeler.filter(t => t.id !== id));
      toast.success('Tarife silindi', {
        description: 'Tarife kaydı başarıyla silindi'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Silme işlemi başarısız';
      toast.error('Tarife silinemedi', {
        description: errorMessage
      });
    }
  };

  // Tarife düzenle
  const handleEdit = (tarife: PriceList) => {
    setSelectedTarife(tarife);
    setFormData({
      code: tarife.code,
      name: tarife.name,
      description: tarife.description || '',
      currency: tarife.currency as 'TRY' | 'USD' | 'EUR',
      version: tarife.version,
      status: tarife.status as 'AKTIF' | 'PASIF' | 'TASLAK',
      valid_from: tarife.valid_from || new Date().toISOString().split('T')[0],
      valid_to: tarife.valid_to || '',
      is_active: tarife.is_active,
    });
    setCurrentView('edit');
  };

  // Form kaydet
  const handleSave = async () => {
    // Validasyon
    const errors: Record<string, string> = {};
    if (!formData.code) errors.code = 'Tarife kodu zorunludur';
    if (!formData.name) errors.name = 'Tarife adı zorunludur';
    
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
        const newTarife = await tarifeApi.create({
          code: formData.code.toUpperCase(),
          name: formData.name,
          description: formData.description,
          currency: formData.currency,
          version: formData.version,
          status: formData.status,
          valid_from: formData.valid_from,
          valid_to: formData.valid_to || undefined,
          is_active: formData.is_active,
        });
        
        setTarifeler([newTarife, ...tarifeler]);
        
        toast.success('Tarife oluşturuldu', {
          description: `${formData.code} - ${formData.name} başarıyla kaydedildi`
        });
      } else if (currentView === 'edit' && selectedTarife) {
        const updatedTarife = await tarifeApi.update(selectedTarife.id!, {
          code: formData.code.toUpperCase(),
          name: formData.name,
          description: formData.description,
          currency: formData.currency,
          version: formData.version,
          status: formData.status,
          valid_from: formData.valid_from,
          valid_to: formData.valid_to || undefined,
          is_active: formData.is_active,
        });
        
        setTarifeler(tarifeler.map(t => t.id === selectedTarife.id ? updatedTarife : t));
        
        toast.success('Tarife güncellendi', {
          description: `${formData.code} - ${formData.name} başarıyla güncellendi`
        });
      }
      
      resetForm();
      setCurrentView('list');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kayıt başarısız';
      toast.error(currentView === 'create' ? 'Tarife oluşturulamadı' : 'Tarife güncellenemedi', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      currency: 'TRY',
      version: 1,
      status: 'TASLAK',
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: '',
      is_active: true,
    });
    setFormErrors({});
    setSelectedTarife(null);
  };

  // Filtreleme
  const filteredTarifeler = tarifeler.filter(tarife => {
    const matchesSearch = 
      tarife.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tarife.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // LİSTE GÖRÜNÜMÜ
  if (currentView === 'list') {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <DollarSign className={`w-8 h-8 ${theme.colors.primaryText}`} />
                Tarife Yönetimi
              </h1>
              <p className="text-gray-200 mt-2">
                Fiyat listeleri ve tarife kartları yönetimi
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => loadTarifeler()}
                variant="outline"
                size="sm"
                disabled={loading}
                className="text-base"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Yenile
              </Button>
              <Button
                onClick={() => {
                  resetForm();
                  setCurrentView('create');
                }}
                className={`${theme.colors.primaryBg} hover:opacity-90 text-white text-base`}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Yeni Tarife
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
              <Input
                type="text"
                placeholder="Kod veya ad ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <div className="flex gap-2">
              {(['ALL', 'AKTIF', 'PASIF', 'TASLAK'] as const).map((status) => (
                <Button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  className={filterStatus === status ? theme.colors.primaryBg : ''}
                >
                  {status === 'ALL' ? 'Tümü' : status}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-red-400 font-medium">Veri yükleme hatası</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className={`w-8 h-8 animate-spin ${theme.colors.primaryText}`} />
          </div>
        )}

        {/* Tarife Listesi */}
        {!loading && !error && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Kod</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Ad</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Durum</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Para Birimi</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Geçerlilik</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Versiyon</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-200">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredTarifeler.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        Tarife bulunamadı. Yeni tarife eklemek için "Yeni Tarife" butonuna tıklayın.
                      </td>
                    </tr>
                  ) : (
                    filteredTarifeler.map((tarife) => (
                      <tr key={tarife.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-gray-300">{tarife.code}</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">{tarife.name}</td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className={
                              tarife.status === 'AKTIF'
                                ? 'bg-green-500/10 text-green-400 border-green-500/50'
                                : tarife.status === 'TASLAK'
                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50'
                                : 'bg-gray-500/10 text-gray-400 border-gray-500/50'
                            }
                          >
                            {tarife.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{tarife.currency}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {tarife.valid_from || '-'} {tarife.valid_to ? `→ ${tarife.valid_to}` : ''}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">v{tarife.version}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => handleEdit(tarife)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(tarife.id!)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
      </div>
    );
  }

  // FORM GÖRÜNÜMÜ (Create / Edit)
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          onClick={() => {
            resetForm();
            setCurrentView('list');
          }}
          variant="ghost"
          size="sm"
          className="mb-4 text-gray-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri Dön
        </Button>

        <h1 className="text-3xl font-bold text-white">
          {currentView === 'create' ? 'Yeni Tarife Oluştur' : 'Tarife Düzenle'}
        </h1>
        <p className="text-gray-200 mt-2">
          {currentView === 'create' ? 'Yeni fiyat listesi tanımlayın' : selectedTarife?.code}
        </p>
      </div>

      {/* Form */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kod */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Tarife Kodu <span className="text-red-400">*</span>
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="TARIFE-2024-STANDART"
              className={`bg-gray-800 border-gray-700 text-white ${formErrors.code ? 'border-red-500' : ''}`}
            />
            {formErrors.code && <p className="text-red-400 text-sm mt-1">{formErrors.code}</p>}
          </div>

          {/* Ad */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Tarife Adı <span className="text-red-400">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="2024 Standart Fiyat Listesi"
              className={`bg-gray-800 border-gray-700 text-white ${formErrors.name ? 'border-red-500' : ''}`}
            />
            {formErrors.name && <p className="text-red-400 text-sm mt-1">{formErrors.name}</p>}
          </div>

          {/* Para Birimi */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Para Birimi</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
            >
              <option value="TRY">TRY (₺)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          {/* Durum */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Durum</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
            >
              <option value="TASLAK">Taslak</option>
              <option value="AKTIF">Aktif</option>
              <option value="PASIF">Pasif</option>
            </select>
          </div>

          {/* Geçerlilik Başlangıç */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Geçerlilik Başlangıç</label>
            <Input
              type="date"
              value={formData.valid_from}
              onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {/* Geçerlilik Bitiş */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Geçerlilik Bitiş</label>
            <Input
              type="date"
              value={formData.valid_to}
              onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {/* Açıklama */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-200 mb-2">Açıklama</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tarife hakkında açıklama..."
              rows={3}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {/* Aktif Mi */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-200">Aktif</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-800">
          <Button
            onClick={() => {
              resetForm();
              setCurrentView('list');
            }}
            variant="outline"
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            İptal
          </Button>
          <Button
            onClick={handleSave}
            className={`${theme.colors.primaryBg} hover:opacity-90 text-white`}
            disabled={loading}
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
  );
}
