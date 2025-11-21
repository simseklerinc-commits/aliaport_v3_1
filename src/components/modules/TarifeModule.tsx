// TARİFE MODULE - Master-Detail Yapı (ZIP Tasarımı)
// Tarife Listesi + Tarife Düzenle (Hizmet Fiyatları Tablosu)
// Backend: /api/price-list/ + /api/hizmet/

import { useState, useEffect } from "react";
import { Theme } from "../ThemeSelector";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { 
  DollarSign, 
  Search,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Save,
  Edit,
  Trash2,
  CheckCircle
} from "lucide-react";
import { tarifeApi, PriceList } from "../../lib/api/tarife";
import { hizmetApi } from "../../lib/api/hizmet";

interface TarifeModuleProps {
  theme: Theme;
}

interface HizmetWithPrice {
  id: number;
  code: string;
  name: string;
  unit: string;
  vat_rate: number;
  unit_price: number;
  is_active: boolean;
  item_id?: number; // PriceListItem ID (varsa)
  hasExistingItem: boolean; // Backend'de kaydı var mı?
}

export function TarifeModule({ theme }: TarifeModuleProps) {
  const [currentView, setCurrentView] = useState<'list' | 'edit'>('list');
  const [tarifeler, setTarifeler] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTarife, setSelectedTarife] = useState<PriceList | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AKTIF' | 'PASIF' | 'TASLAK'>('AKTIF');

  // Hizmet + Fiyat verisi (Edit modunda)
  const [hizmetlerWithPrices, setHizmetlerWithPrices] = useState<HizmetWithPrice[]>([]);
  const [editedPrices, setEditedPrices] = useState<Record<number, number>>({});
  const [savingItems, setSavingItems] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  // Tarife + Hizmet fiyatlarını yükle (Edit modu için)
  const loadTarifeWithPrices = async (tarife: PriceList) => {
    setLoading(true);
    try {
      // 1. Tüm hizmetleri çek (pagination response handle et)
      const hizmetResponse: any = await hizmetApi.getAll({ page: 1, page_size: 1000 });
      
      // Backend pagination: { items: [], total: 0, page: 1, ... }
      const hizmetler = Array.isArray(hizmetResponse?.items) 
        ? hizmetResponse.items 
        : [];

      console.log('Loaded services:', hizmetler.length);

      // 2. Bu tarifeye ait fiyat kalemlerini çek
      const priceItems = await tarifeApi.getItems(tarife.id!);
      console.log('Loaded price items:', priceItems.length);

      // 3. Hizmetler + Fiyat kalemlerini birleştir
      const merged: HizmetWithPrice[] = hizmetler.map((h: any) => {
        // FIX: Kod karşılaştırması (Hizmet.Kod === PriceListItem.service_code)
        const existingItem = priceItems.find((item: any) => item.service_code === h.Kod);
        
        return {
          id: h.Id,
          code: h.Kod,
          name: h.Ad,
          unit: h.Birim || '',
          vat_rate: parseFloat(h.KdvOrani) || 20,
          unit_price: existingItem?.unit_price || 0,
          is_active: h.AktifMi,
          item_id: existingItem?.id,
          hasExistingItem: !!existingItem,
        };
      });

      console.log('Merged services with prices:', merged.length);
      setHizmetlerWithPrices(merged);
      setEditedPrices({});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Veriler yüklenemedi';
      toast.error('Hizmet fiyatları yüklenemedi', {
        description: errorMessage
      });
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    if (currentView === 'list') {
      loadTarifeler();
    }
  }, [currentView, filterStatus]);

  // Tarife düzenle
  const handleEdit = (tarife: PriceList) => {
    setSelectedTarife(tarife);
    loadTarifeWithPrices(tarife);
    setCurrentView('edit');
  };

  // Fiyat değiştir (inline edit)
  const handlePriceChange = (hizmetId: number, newPrice: number) => {
    setEditedPrices((prev) => ({
      ...prev,
      [hizmetId]: newPrice,
    }));
  };

  // Fiyatları kaydet
  const handleSavePrices = async () => {
    if (!selectedTarife) return;

    // Aktif hizmetler için fiyat kontrolü
    const activeServices = hizmetlerWithPrices.filter((h) => h.is_active);
    const emptyPrices = activeServices.filter((h) => {
      const price = editedPrices[h.id] !== undefined ? editedPrices[h.id] : h.unit_price;
      return !price || price <= 0;
    });

    if (emptyPrices.length > 0) {
      toast.error('Fiyat eksik', {
        description: `${emptyPrices.length} aktif hizmet için fiyat girilmedi!`
      });
      return;
    }

    setSavingItems(true);

    try {
      const updates: Promise<any>[] = [];

      hizmetlerWithPrices.forEach((hizmet) => {
        const newPrice = editedPrices[hizmet.id] !== undefined ? editedPrices[hizmet.id] : hizmet.unit_price;

        // Sadece değişen fiyatları kaydet
        if (editedPrices[hizmet.id] !== undefined) {
          if (hizmet.hasExistingItem && hizmet.item_id) {
            // Güncelleme (mevcut kayıt)
            updates.push(
              tarifeApi.updateItem(hizmet.item_id, {
                price_list_id: selectedTarife.id!,
                service_code: hizmet.code,
                service_name: hizmet.name,
                unit: hizmet.unit,
                unit_price: newPrice,
                vat_rate: hizmet.vat_rate,
                is_active: hizmet.is_active,
                order_no: hizmet.id,
              })
            );
          } else if (newPrice > 0) {
            // Yeni ekleme (backend'de yoktu, şimdi fiyat girildi)
            updates.push(
              tarifeApi.createItem({
                price_list_id: selectedTarife.id!,
                service_code: hizmet.code,
                service_name: hizmet.name,
                unit: hizmet.unit,
                unit_price: newPrice,
                vat_rate: hizmet.vat_rate,
                is_active: hizmet.is_active,
                order_no: hizmet.id,
              })
            );
          }
        }
      });

      await Promise.all(updates);

      toast.success('Fiyatlar kaydedildi', {
        description: `${updates.length} kalem güncellendi`
      });

      setEditedPrices({});
      
      // Verileri yeniden yükle
      await loadTarifeWithPrices(selectedTarife);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kayıt başarısız';
      toast.error('Fiyatlar kaydedilemedi', {
        description: errorMessage
      });
    } finally {
      setSavingItems(false);
    }
  };

  // Tarife sil
  const handleDelete = async (id: number) => {
    if (!confirm('Bu tarifeyi silmek istediğinizden emin misiniz?')) return;
    
    try {
      await tarifeApi.delete(id);
      setTarifeler(tarifeler.filter(t => t.id !== id));
      toast.success('Tarife silindi');
    } catch (err) {
      toast.error('Silme başarısız', {
        description: err instanceof Error ? err.message : 'Hata'
      });
    }
  };

  // Filtreleme
  const filteredTarifeler = tarifeler.filter(tarife => {
    const matchesSearch = 
      tarife.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tarife.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // ============================================
  // LİSTE GÖRÜNÜMÜ
  // ============================================
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
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Yenile
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
                  className={filterStatus === status ? theme.colors.primary : ''}
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
                        Tarife bulunamadı.
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

  // ============================================
  // DÜZENLE GÖRÜNÜMÜ (Master-Detail)
  // ============================================
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          onClick={() => {
            setSelectedTarife(null);
            setHizmetlerWithPrices([]);
            setEditedPrices({});
            setCurrentView('list');
          }}
          variant="ghost"
          size="sm"
          className="mb-4 text-gray-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tarife Listesine Dön
        </Button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Tarife Fiyat Düzenleme
            </h1>
            <p className="text-gray-200 mt-2">
              {selectedTarife?.code} - {selectedTarife?.name}
            </p>
          </div>

          <Button
            onClick={handleSavePrices}
            className={`${theme.colors.primary} hover:opacity-90 text-white`}
            disabled={savingItems || loading}
          >
            {savingItems ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Fiyatları Kaydet
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tarife Bilgileri Kartı */}
      <div className="mb-6 bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-400">Kod</p>
            <p className="text-white font-mono">{selectedTarife?.code}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Para Birimi</p>
            <p className="text-white">{selectedTarife?.currency}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Durum</p>
            <Badge
              variant="outline"
              className={
                selectedTarife?.status === 'AKTIF'
                  ? 'bg-green-500/10 text-green-400 border-green-500/50'
                  : selectedTarife?.status === 'TASLAK'
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50'
                  : 'bg-gray-500/10 text-gray-400 border-gray-500/50'
              }
            >
              {selectedTarife?.status}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-400">Geçerlilik</p>
            <p className="text-white text-sm">
              {selectedTarife?.valid_from || '-'} {selectedTarife?.valid_to ? `→ ${selectedTarife.valid_to}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className={`w-8 h-8 animate-spin ${theme.colors.primaryText}`} />
        </div>
      )}

      {/* Hizmet Fiyatları Tablosu */}
      {!loading && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">
              Hizmet Fiyat Listesi ({hizmetlerWithPrices.length} hizmet)
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Fiyat alanlarına tıklayarak değiştirebilirsiniz. Değişiklikler yeşil renkte gösterilir.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Kod</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Hizmet Adı</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Birim</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">KDV %</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Birim Fiyat</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-200">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {hizmetlerWithPrices.map((hizmet) => {
                  const currentPrice = editedPrices[hizmet.id] !== undefined 
                    ? editedPrices[hizmet.id] 
                    : hizmet.unit_price;
                  const isEdited = editedPrices[hizmet.id] !== undefined;

                  return (
                    <tr
                      key={hizmet.id}
                      className={`hover:bg-gray-800/30 transition-colors ${!hizmet.is_active ? 'opacity-50' : ''}`}
                    >
                      <td className="px-6 py-4 text-sm font-mono text-gray-300">{hizmet.code}</td>
                      <td className="px-6 py-4 text-sm text-white">{hizmet.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{hizmet.unit || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{hizmet.vat_rate}</td>
                      <td className="px-6 py-4">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={currentPrice}
                          onChange={(e) => handlePriceChange(hizmet.id, parseFloat(e.target.value) || 0)}
                          disabled={!hizmet.is_active}
                          className={`w-32 bg-gray-800 border-gray-700 text-white ${
                            isEdited ? 'border-green-500 bg-green-500/10' : ''
                          }`}
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {hizmet.is_active ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <span className="text-gray-500 text-sm">Pasif</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Değişiklik Sayısı */}
      {Object.keys(editedPrices).length > 0 && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
          <p className="text-green-400 font-medium">
            {Object.keys(editedPrices).length} fiyat değişikliği mevcut. Kaydetmeyi unutmayın!
          </p>
        </div>
      )}
    </div>
  );
}
