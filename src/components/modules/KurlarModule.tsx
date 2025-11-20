// KURLAR MODULE - Döviz Kurları Yönetimi
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
  AlertCircle,
  ArrowLeft,
  Save,
  Edit,
  Trash2,
  X,
  TrendingUp,
  Calendar
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

  // Kur oluştur
  const handleCreate = async () => {
    if (!validateForm()) {
      toast.error('Form hatası', {
        description: 'Lütfen tüm gerekli alanları doldurun'
      });
      return;
    }

    setLoading(true);
    try {
      await kurlarApi.create(formData);
      
      toast.success('Kur eklendi', {
        description: `${formData.currency_from}/${formData.currency_to} kuru başarıyla eklendi`
      });
      
      setCurrentView('list');
      loadKurlar();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kayıt oluşturulamadı';
      toast.error('Kur eklenemedi', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Kur güncelle
  const handleUpdate = async () => {
    if (!selectedKur || !validateForm()) {
      toast.error('Form hatası');
      return;
    }

    setLoading(true);
    try {
      await kurlarApi.update(selectedKur.id, formData);
      
      toast.success('Kur güncellendi', {
        description: `${formData.currency_from}/${formData.currency_to} kuru güncellendi`
      });
      
      setCurrentView('list');
      loadKurlar();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Güncelleme başarısız';
      toast.error('Kur güncellenemedi', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Kur sil
  const handleDelete = async (kur: ExchangeRate) => {
    if (!confirm(`${kur.currency_from}/${kur.currency_to} kurunu silmek istediğinize emin misiniz?`)) {
      return;
    }

    setLoading(true);
    try {
      await kurlarApi.delete(kur.id);
      
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

  // Create mode'a geç
  const handleNewKur = () => {
    setSelectedKur(null);
    setFormData({
      currency_from: 'USD',
      currency_to: 'TRY',
      rate: 0,
      rate_date: new Date().toISOString().split('T')[0],
      source: 'Manuel',
    });
    setFormErrors({});
    setCurrentView('create');
  };

  // Liste görünümüne dön
  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedKur(null);
    setFormErrors({});
  };

  // Filtrelenmiş kurlar
  const filteredKurlar = kurlar.filter(kur => {
    const searchLower = searchTerm.toLowerCase();
    return (
      kur.currency_from.toLowerCase().includes(searchLower) ||
      kur.currency_to.toLowerCase().includes(searchLower) ||
      kur.source?.toLowerCase().includes(searchLower) ||
      kur.rate_date.includes(searchLower)
    );
  });

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={currentView === 'list' ? onNavigateBack : handleBackToList}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Döviz Kurları</h1>
              <p className="text-sm text-slate-500">
                {currentView === 'list' && `${filteredKurlar.length} kur kaydı`}
                {currentView === 'create' && 'Yeni Kur Ekle'}
                {currentView === 'edit' && 'Kur Düzenle'}
              </p>
            </div>
          </div>
        </div>

        {currentView === 'list' && (
          <Button onClick={handleNewKur} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Kur
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {currentView === 'list' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Kur ara (para birimi, tarih, kaynak...)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={filterCurrency}
                  onChange={(e) => setFilterCurrency(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-md"
                >
                  <option value="ALL">Tüm Para Birimleri</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CHF">CHF</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>
            </div>

            {/* Loading/Error/Empty States */}
            {loading && (
              <div className="bg-white rounded-lg p-12 border border-slate-200 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-600">Kurlar yükleniyor...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900">Hata</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                    <Button 
                      onClick={loadKurlar}
                      size="sm"
                      variant="outline"
                      className="mt-3"
                    >
                      Tekrar Dene
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && filteredKurlar.length === 0 && (
              <div className="bg-white rounded-lg p-12 border border-slate-200 text-center">
                <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Kur bulunamadı</h3>
                <p className="text-slate-600 mb-4">Henüz döviz kuru kaydı yok</p>
                <Button onClick={handleNewKur} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Kuru Ekle
                </Button>
              </div>
            )}

            {/* Kurlar Listesi */}
            {!loading && !error && filteredKurlar.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Para Birimi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Kur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Tarih
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Kaynak
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredKurlar.map((kur) => (
                      <tr key={kur.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-slate-900">
                              {kur.currency_from}/{kur.currency_to}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-semibold text-slate-900">
                            {kur.rate.toFixed(4)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="h-4 w-4" />
                            {kur.rate_date}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary">
                            {kur.source || 'Manuel'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(kur)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(kur)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Form */}
        {(currentView === 'create' || currentView === 'edit') && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg p-6 border border-slate-200 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Kaynak Para Birimi *
                  </label>
                  <Input
                    value={formData.currency_from}
                    onChange={(e) => setFormData({...formData, currency_from: e.target.value.toUpperCase()})}
                    placeholder="USD"
                    maxLength={3}
                  />
                  {formErrors.currency_from && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.currency_from}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Hedef Para Birimi *
                  </label>
                  <Input
                    value={formData.currency_to}
                    onChange={(e) => setFormData({...formData, currency_to: e.target.value.toUpperCase()})}
                    placeholder="TRY"
                    maxLength={3}
                  />
                  {formErrors.currency_to && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.currency_to}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Kur Değeri *
                  </label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.rate}
                    onChange={(e) => setFormData({...formData, rate: parseFloat(e.target.value) || 0})}
                    placeholder="34.5000"
                  />
                  {formErrors.rate && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.rate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tarih *
                  </label>
                  <Input
                    type="date"
                    value={formData.rate_date}
                    onChange={(e) => setFormData({...formData, rate_date: e.target.value})}
                  />
                  {formErrors.rate_date && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.rate_date}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Kaynak
                </label>
                <Input
                  value={formData.source}
                  onChange={(e) => setFormData({...formData, source: e.target.value})}
                  placeholder="Manuel, TCMB, vb."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={currentView === 'create' ? handleCreate : handleUpdate}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {currentView === 'create' ? 'Kur Ekle' : 'Güncelle'}
                </Button>
                <Button
                  onClick={handleBackToList}
                  variant="outline"
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  İptal
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
