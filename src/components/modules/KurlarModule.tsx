// KURLAR MODULE - Döviz Kurları Yönetimi (HizmetModule pattern)
// Backend: /api/exchange-rate/ (FastAPI + SQLite)

import { useState, useEffect } from "react";
import { Theme } from "../ThemeSelector";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { 
  DollarSign, 
  Plus, 
  Search,
  Loader2,
  ArrowLeft,
  Edit,
  Trash2
} from "lucide-react";
import { kurlarApi } from "../../lib/api/kurlar";
import type { ExchangeRate } from "../../lib/types/database";

interface KurlarModuleProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
}

export default function KurlarModule({ onNavigateHome, onNavigateBack, theme }: KurlarModuleProps) {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [kurlar, setKurlar] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKur, setSelectedKur] = useState<ExchangeRate | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCurrency, setFilterCurrency] = useState<string>('ALL');

  // Form state
  const [formData, setFormData] = useState({
    currency_from: 'USD',
    currency_to: 'TRY',
    rate: 0,
    rate_date: new Date().toISOString().split('T')[0],
    source: 'Manuel',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Kurları yükle
  const loadKurlar = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await kurlarApi.getAll({
        page: 1,
        page_size: 100,
        currency_from: filterCurrency === 'ALL' ? undefined : filterCurrency,
      });
      
      setKurlar(response.items);
      
      if (response.items.length === 0) {
        toast.info('Kayıt bulunamadı', {
          description: 'Filtrelere uygun kur kaydı bulunamadı'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Veri yüklenemedi';
      setError(errorMessage);
      toast.error('Kur listesi yüklenemedi', {
        description: errorMessage
      });
      console.error('Kur yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    if (currentView === 'list') {
      loadKurlar();
    }
  }, [currentView, filterCurrency]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.currency_from || formData.currency_from.length !== 3) {
      errors.currency_from = 'Geçerli bir para birimi kodu girin (3 karakter)';
    }

    if (!formData.currency_to || formData.currency_to.length !== 3) {
      errors.currency_to = 'Geçerli bir para birimi kodu girin (3 karakter)';
    }

    if (!formData.rate || formData.rate <= 0) {
      errors.rate = 'Kur değeri 0\'dan büyük olmalıdır';
    }

    if (!formData.rate_date) {
      errors.rate_date = 'Tarih gereklidir';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Kur kaydet (create/update)
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Form hatası', {
        description: 'Lütfen tüm gerekli alanları doldurun'
      });
      return;
    }

    setFormErrors({});
    setLoading(true);

    try {
      if (currentView === 'create') {
        await kurlarApi.create(formData);
        toast.success('Kur eklendi', {
          description: `${formData.currency_from}/${formData.currency_to} kuru başarıyla eklendi`
        });
      } else if (currentView === 'edit' && selectedKur) {
        await kurlarApi.update(selectedKur.id, formData);
        toast.success('Kur güncellendi', {
          description: `${formData.currency_from}/${formData.currency_to} kuru güncellendi`
        });
      }

      resetForm();
      setCurrentView('list');
      loadKurlar();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kaydetme başarısız';
      toast.error('İşlem başarısız', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Kur sil
  const handleDelete = async (id: number) => {
    const kur = kurlar.find(k => k.id === id);
    if (!kur) return;

    if (!confirm(`${kur.currency_from}/${kur.currency_to} kurunu silmek istediğinize emin misiniz?`)) {
      return;
    }

    setLoading(true);
    try {
      await kurlarApi.delete(id);
      
      toast.success('Kur silindi', {
        description: `${kur.currency_from}/${kur.currency_to} kuru silindi`
      });
      
      loadKurlar();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Silme işlemi başarısız';
      toast.error('Kur silinemedi', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Edit mode'a geç
  const handleEdit = (kur: ExchangeRate) => {
    setSelectedKur(kur);
    setFormData({
      currency_from: kur.currency_from,
      currency_to: kur.currency_to,
      rate: kur.rate,
      rate_date: kur.rate_date,
      source: kur.source || 'Manuel',
    });
    setFormErrors({});
    setCurrentView('edit');
  };

  // Form reset
  const resetForm = () => {
    setFormData({
      currency_from: 'USD',
      currency_to: 'TRY',
      rate: 0,
      rate_date: new Date().toISOString().split('T')[0],
      source: 'Manuel',
    });
    setSelectedKur(null);
    setFormErrors({});
  };

  // Filtrelenmiş kurlar
  const filteredKurlar = (kurlar || []).filter(kur => {
    const searchLower = searchTerm.toLowerCase();
    return (
      kur.currency_from.toLowerCase().includes(searchLower) ||
      kur.currency_to.toLowerCase().includes(searchLower) ||
      kur.source?.toLowerCase().includes(searchLower) ||
      kur.rate_date.includes(searchLower)
    );
  });

  // Statistics
  const stats = {
    total: kurlar.length,
    pairs: new Set(kurlar.map(k => `${k.currency_from}/${k.currency_to}`)).size,
    sources: new Set(kurlar.map(k => k.source || 'Manuel')).size,
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
              <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Döviz Kurları</h1>
                <p className="text-sm text-gray-400">
                  Kur tanımları ve yönetimi
                </p>
              </div>
            </div>
          </div>
          
          {currentView === 'list' && (
            <Button
              onClick={() => setCurrentView('create')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Kur
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {currentView === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400">Toplam Kur Kaydı</div>
            <div className="text-3xl font-bold text-white mt-2">{stats.total}</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400">Para Birimi Çifti</div>
            <div className="text-3xl font-bold text-blue-400 mt-2">{stats.pairs}</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400">Kaynak Sayısı</div>
            <div className="text-3xl font-bold text-green-400 mt-2">{stats.sources}</div>
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
                placeholder="Kur ara (para birimi, tarih, kaynak...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700 text-white"
              />
            </div>
            <select
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="ALL">Tüm Para Birimleri</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CHF">CHF</option>
              <option value="JPY">JPY</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Para Birimi</th>
                  <th className="text-right px-4 py-3 text-sm text-gray-400">Kur Değeri</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Tarih</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Kaynak</th>
                  <th className="text-right px-4 py-3 text-sm text-gray-400">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredKurlar.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      Kayıt bulunamadı
                    </td>
                  </tr>
                ) : (
                  filteredKurlar.map((kur) => (
                    <tr
                      key={kur.id}
                      className="border-b border-gray-800 hover:bg-gray-700/50"
                    >
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm text-white font-bold">
                          {kur.currency_from}/{kur.currency_to}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-white font-semibold text-lg">
                          {kur.rate.toFixed(4)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-400">{kur.rate_date}</td>
                      <td className="px-4 py-4">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                          {kur.source || 'Manuel'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(kur)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(kur.id)}
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
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  resetForm();
                  setCurrentView('list');
                }}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-2xl font-bold text-white">
                {currentView === 'create' ? 'Yeni Kur Ekle' : 'Kur Düzenle'}
              </h2>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Kaynak Para Birimi *
                </label>
                <Input
                  value={formData.currency_from}
                  onChange={(e) => setFormData({...formData, currency_from: e.target.value.toUpperCase()})}
                  placeholder="USD"
                  maxLength={3}
                  className="bg-gray-900 border-gray-700 text-white"
                />
                {formErrors.currency_from && (
                  <p className="text-sm text-red-400 mt-1">{formErrors.currency_from}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Hedef Para Birimi *
                </label>
                <Input
                  value={formData.currency_to}
                  onChange={(e) => setFormData({...formData, currency_to: e.target.value.toUpperCase()})}
                  placeholder="TRY"
                  maxLength={3}
                  className="bg-gray-900 border-gray-700 text-white"
                />
                {formErrors.currency_to && (
                  <p className="text-sm text-red-400 mt-1">{formErrors.currency_to}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Kur Değeri *
                </label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.rate}
                  onChange={(e) => setFormData({...formData, rate: parseFloat(e.target.value) || 0})}
                  placeholder="34.5000"
                  className="bg-gray-900 border-gray-700 text-white"
                />
                {formErrors.rate && (
                  <p className="text-sm text-red-400 mt-1">{formErrors.rate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Tarih *
                </label>
                <Input
                  type="date"
                  value={formData.rate_date}
                  onChange={(e) => setFormData({...formData, rate_date: e.target.value})}
                  className="bg-gray-900 border-gray-700 text-white"
                />
                {formErrors.rate_date && (
                  <p className="text-sm text-red-400 mt-1">{formErrors.rate_date}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Kaynak
              </label>
              <Input
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
                placeholder="Manuel, TCMB, vb."
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-700">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {currentView === 'create' ? 'Kur Ekle' : 'Güncelle'}
              </Button>
              <Button
                onClick={() => {
                  resetForm();
                  setCurrentView('list');
                }}
                variant="outline"
                disabled={loading}
                className="border-gray-700 text-gray-400 hover:text-white"
              >
                İptal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
