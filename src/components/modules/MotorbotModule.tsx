// MOTORBOT MODULE - Motorbot kartları + barınma contract modülü
// SQL: motorbot + barinma_contract
// API entegrasyonu ile veri çekme

import { useState, useEffect } from "react";
import { Theme } from "../ThemeSelector";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { 
  Anchor, 
  Plus, 
  Filter,
  Search,
  Loader2,
  AlertCircle,
  User,
  FileText,
  Save,
  X,
  Building2,
  Ship,
  Ruler,
} from "lucide-react";
import { MotorbotCard } from "../cards/MotorbotCard";
import { CariSecici } from "../CariSecici";
import { MotorbotKartiDetay } from "../MotorbotKartiDetay";
import { motorbotApi, barinmaApi } from "../../lib/api/motorbot";
import type { Motorbot, MotorbotWithContract, MotorbotMaster } from "../../lib/types/database";
import { toast } from "sonner";

interface MotorbotModuleProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
  initialPage?: 'list' | 'create' | 'edit';
  showContractInfo?: boolean;
}

export function MotorbotModule({ 
  onNavigateHome, 
  onNavigateBack, 
  theme,
  initialPage = 'list',
  showContractInfo = true
}: MotorbotModuleProps) {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>(initialPage);
  const [motorbots, setMotorbots] = useState<(Motorbot | MotorbotWithContract)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMotorbot, setSelectedMotorbot] = useState<MotorbotMaster | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBoatType, setFilterBoatType] = useState<string>('ALL');
  const [filterOwner, setFilterOwner] = useState<string>('ALL');
  const [filterHasContract, setFilterHasContract] = useState<string>('ALL');
  const [filterActive, setFilterActive] = useState<string>('ALL');

  // Form state
  const [showCariSecici, setShowCariSecici] = useState(false);
  const [selectedCari, setSelectedCari] = useState<any>(null);
  const [formData, setFormData] = useState<Partial<MotorbotMaster>>({
    code: '',
    name: '',
    owner_cari_id: 0,
    owner_cari_code: '',
    owner_name: '',
    vessel_type: 'Motorbot',
    boat_type: 'Motorbot',
    length: 0,
    width: 0,
    draft: 0,
    depth: 0,
    gross_tonnage: 0,
    registration_number: '',
    flag: 'TC',
    is_active: true,
    is_frozen: false,
  });

  // Motorbotları yükle
  const loadMotorbots = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await motorbotApi.getAll({
        page: 1,
        page_size: 100,
        is_active: filterActive === 'ALL' ? undefined : filterActive === 'ACTIVE',
      });
      
      // Backend direkt array dönüyor, response.items değil
      const data = Array.isArray(response) ? response : (response.items || []);
      setMotorbots(data);
      
      // Empty state kontrolü
      if (data.length === 0) {
        toast.info('Kayıt bulunamadı', {
          description: 'Filtrelere uygun motorbot kaydı bulunamadı'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Veri yüklenemedi';
      setError(errorMessage);
      toast.error('Motorbot listesi yüklenemedi', {
        description: errorMessage
      });
      console.error('Motorbot yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    if (currentView === 'list') {
      loadMotorbots();
    }
  }, [currentView, filterActive]);

  // Motorbot sil
  const handleDelete = async (id: number) => {
    if (!confirm('Bu motorbotu silmek istediğinizden emin misiniz?')) return;
    
    try {
      await motorbotApi.delete(id);
      setMotorbots(motorbots.filter(m => m.id !== id));
      toast.success('Motorbot silindi', {
        description: 'Motorbot kaydı başarıyla silindi'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Silme işlemi başarısız';
      toast.error('Motorbot silinemedi', {
        description: errorMessage
      });
    }
  };

  // Motorbot düzenle
  const handleEdit = (motorbot: Motorbot | MotorbotMaster) => {
    const mbMaster = motorbot as MotorbotMaster;
    setSelectedMotorbot(mbMaster);
    setFormData({
      code: mbMaster.code,
      name: mbMaster.name,
      owner_cari_id: mbMaster.owner_cari_id,
      owner_cari_code: mbMaster.owner_cari_code,
      owner_name: mbMaster.owner_name,
      vessel_type: mbMaster.vessel_type,
      boat_type: mbMaster.boat_type,
      length: mbMaster.length,
      width: mbMaster.width,
      draft: mbMaster.draft,
      depth: mbMaster.depth,
      gross_tonnage: mbMaster.gross_tonnage,
      registration_number: mbMaster.registration_number,
      flag: mbMaster.flag,
      is_active: mbMaster.is_active,
      is_frozen: mbMaster.is_frozen,
    });
    setCurrentView('edit');
  };

  // Yeni motorbot formu aç
  const handleNewMotorbot = () => {
    setSelectedMotorbot(null);
    setSelectedCari(null);
    const nextCode = `MB-${String(motorbots.length + 1).padStart(3, '0')}`;
    setFormData({
      code: nextCode,
      name: '',
      owner_cari_id: 0,
      owner_cari_code: '',
      owner_name: '',
      vessel_type: 'Motorbot',
      boat_type: 'Motorbot',
      length: 0,
      width: 0,
      draft: 0,
      depth: 0,
      gross_tonnage: 0,
      registration_number: '',
      flag: 'TC',
      is_active: true,
      is_frozen: false,
    });
    setCurrentView('create');
  };

  // Cari seçildiğinde
  const handleCariSelect = (cari: CariKart | null) => {
    if (cari) {
      setSelectedCari(cari);
      setFormData({
        ...formData,
        owner_cari_id: cari.Id,
        owner_cari_code: cari.Code,
        owner_name: cari.Name, // Name property'si kullanılıyor
      });
    } else {
      setSelectedCari(null);
      setFormData({
        ...formData,
        owner_cari_id: 0,
        owner_cari_code: '',
        owner_name: '',
      });
    }
  };

  // Form kaydet
  const handleSave = async () => {
    // Validasyon
    if (!formData.name || !formData.owner_name) {
      toast.error('Eksik bilgi', {
        description: 'Tekne adı ve cari sahibi zorunludur'
      });
      return;
    }

    try {
      if (currentView === 'create') {
        const newMotorbot = await motorbotApi.create({
          code: formData.code || '',
          name: formData.name || '',
          owner_cari_id: formData.owner_cari_id || 0,
          owner_cari_code: formData.owner_cari_code || '',
          owner_name: formData.owner_name || '',
          vessel_type: formData.vessel_type,
          boat_type: formData.boat_type || 'Motorbot',
          length: formData.length || 0,
          width: formData.width || 0,
          draft: formData.draft || 0,
          depth: formData.depth || 0,
          gross_tonnage: formData.gross_tonnage || 0,
          registration_number: formData.registration_number || '',
          flag: formData.flag || 'TC',
          is_active: formData.is_active ?? true,
          is_frozen: formData.is_frozen ?? false,
          length_meters: formData.length || 0,
          width_meters: formData.width || 0,
          draft_meters: formData.draft || 0,
        } as any);
        
        setMotorbots([newMotorbot, ...motorbots]);
        toast.success('Motorbot oluşturuldu', {
          description: `${formData.code} - ${formData.name} başarıyla kaydedildi`
        });
      } else {
        if (selectedMotorbot) {
          await motorbotApi.update(selectedMotorbot.id, formData as any);
          const updated = motorbots.map(m =>
            m.id === selectedMotorbot.id ? { ...m, ...formData } : m
          );
          setMotorbots(updated);
          toast.success('Motorbot güncellendi', {
            description: `${formData.code} - ${formData.name} başarıyla güncellendi`
          });
        }
      }
      setCurrentView('list');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kayıt hatası';
      toast.error('İşlem başarısız', {
        description: errorMessage
      });
    }
  };

  // Contract görüntüle (ileride detaylı modal/sayfa açılabilir)
  const handleViewContract = (motorbotId: number) => {
    toast.info('Özellik geliştiriliyor', {
      description: `Motorbot ID ${motorbotId} için kontrat detayları gösterilecek`
    });
  };

  // Filtrelenmiş motorbotlar
  const filteredMotorbots = (motorbots || []).filter(motorbot => {
    const matchesSearch = !searchTerm || 
      motorbot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      motorbot.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (motorbot as any).owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      motorbot.registration_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBoatType = filterBoatType === 'ALL' || (motorbot as any).boat_type === filterBoatType;
    const matchesOwner = filterOwner === 'ALL' || (motorbot as any).owner_cari_code === filterOwner;
    const matchesActive = filterActive === 'ALL' || 
      (filterActive === 'ACTIVE' && motorbot.is_active) ||
      (filterActive === 'INACTIVE' && !motorbot.is_active);
    
    let matchesContract = true;
    if (filterHasContract !== 'ALL') {
      const withContract = 'has_contract' in motorbot ? motorbot : null;
      matchesContract = filterHasContract === 'WITH_CONTRACT' 
        ? withContract?.has_contract === true
        : withContract?.has_contract !== true;
    }
    
    return matchesSearch && matchesBoatType && matchesOwner && matchesActive && matchesContract;
  });

  // İstatistikler
  const safeMotorbots = motorbots || [];
  const stats = {
    total: safeMotorbots.length,
    active: safeMotorbots.filter(m => m.is_active).length,
    withContract: safeMotorbots.filter(m => 'has_contract' in m && m.has_contract).length,
    byType: safeMotorbots.reduce((acc, m) => {
      const type = (m as any).boat_type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byOwner: motorbots.reduce((acc, m) => {
      const owner = (m as any).owner_cari_code || 'Unknown';
      acc[owner] = (acc[owner] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  // LİSTE GÖRÜNÜMÜ
  const renderList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Anchor className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Motorbot Kartları</h1>
              <p className="text-sm text-gray-400">
                {stats.total} tekne • {stats.active} aktif • {stats.withContract} kontrat
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleNewMotorbot}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Yeni Motorbot
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Motorbot ara (isim, kod, sahibi veya sicil)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterBoatType}
              onChange={(e) => setFilterBoatType(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Tüm Türler</option>
              {Object.entries(stats.byType).map(([type, count]) => (
                <option key={type} value={type}>{type} ({count})</option>
              ))}
            </select>
            
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Tüm Sahipler</option>
              {Object.entries(stats.byOwner).map(([owner, count]) => (
                <option key={owner} value={owner}>{owner} ({count})</option>
              ))}
            </select>

            <select
              value={filterHasContract}
              onChange={(e) => setFilterHasContract(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Kontrat Durumu</option>
              <option value="WITH_CONTRACT">Kontratı Var ({stats.withContract})</option>
              <option value="WITHOUT_CONTRACT">Kontratı Yok ({stats.total - stats.withContract})</option>
            </select>

            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Durum</option>
              <option value="ACTIVE">Aktif ({stats.active})</option>
              <option value="INACTIVE">Pasif ({stats.total - stats.active})</option>
            </select>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-2">
            <Badge 
              className={`cursor-pointer ${filterActive === 'ALL' ? 'bg-blue-500/30 border-blue-500' : 'bg-gray-700/50 border-gray-600'}`}
              onClick={() => setFilterActive('ALL')}
            >
              <Anchor className="w-3 h-3 mr-1" />
              Tümü ({stats.total})
            </Badge>
            <Badge 
              className={`cursor-pointer ${filterActive === 'ACTIVE' ? 'bg-green-500/30 border-green-500' : 'bg-gray-700/50 border-gray-600'}`}
              onClick={() => setFilterActive('ACTIVE')}
            >
              Aktif ({stats.active})
            </Badge>
            <Badge 
              className={`cursor-pointer ${filterHasContract === 'WITH_CONTRACT' ? 'bg-purple-500/30 border-purple-500' : 'bg-gray-700/50 border-gray-600'}`}
              onClick={() => setFilterHasContract('WITH_CONTRACT')}
            >
              <FileText className="w-3 h-3 mr-1" />
              Kontrat Var ({stats.withContract})
            </Badge>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div className="text-red-400">{error}</div>
        </div>
      )}

      {/* Motorbot Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMotorbots.map(motorbot => (
            <MotorbotCard
              key={motorbot.id}
              motorbot={motorbot}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewContract={handleViewContract}
              onClick={(mb) => { setSelectedMotorbot(mb); setShowDetailDialog(true); }}
              showContract={showContractInfo}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredMotorbots.length === 0 && (
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-12 text-center">
          <Anchor className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
          <p className="text-gray-400 mb-4">Motorbot bulunamadı</p>
          <Button
            onClick={handleNewMotorbot}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            İlk Motorbotu Ekle
          </Button>
        </div>
      )}
    </div>
  );

  // FORM GÖRÜNÜMÜ (TODO - Basit placeholder)
  const renderForm = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {currentView === 'edit' ? 'Motorbot Düzenle' : 'Yeni Motorbot Kartı'}
            </h1>
            <p className="text-sm text-gray-400">
              Tekne bilgileri ve barınma sözleşmesi detayları
            </p>
          </div>
          <Button
            onClick={() => setCurrentView('list')}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            <X className="w-4 h-4 mr-2" />
            İptal
          </Button>
        </div>

        {/* Temel Bilgiler */}
        <div className="border border-cyan-500/30 rounded-lg p-6 mb-6">
          <h3 className="flex items-center gap-2 text-white mb-4">
            <Anchor className="w-5 h-5 text-cyan-400" />
            Temel Bilgiler
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Motorbot Kodu */}
            <div>
              <Label className="text-gray-300 text-sm mb-2">Motorbot Kodu *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="MB-017"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Tekne Adı */}
            <div>
              <Label className="text-gray-300 text-sm mb-2">Tekne Adı *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="M/Y BLUE SEA"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Cari Ünvan */}
            <div className="md:col-span-2">
              <Label className="text-gray-300 text-sm mb-2">Cari Ünvan *</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.owner_name || ''}
                  placeholder="Cari seçiniz..."
                  className="bg-gray-900 border-gray-700 text-white flex-1"
                  readOnly
                />
                <Button
                  onClick={() => setShowCariSecici(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Seç
                </Button>
              </div>
            </div>

            {/* Cari Kodu - Otomatik */}
            <div>
              <Label className="text-gray-300 text-sm mb-2">Cari Kodu</Label>
              <Input
                value={formData.owner_cari_code || ''}
                placeholder="Otomatik"
                className="bg-gray-900 border-gray-700 text-gray-500"
                readOnly
              />
            </div>

            {/* Tip */}
            <div>
              <Label className="text-gray-300 text-sm mb-2">Tip</Label>
              <select
                value={formData.vessel_type}
                onChange={(e) => setFormData({ ...formData, vessel_type: e.target.value, boat_type: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
              >
                <option value="Motorbot">Motorbot</option>
                <option value="Yelkenli">Yelkenli</option>
                <option value="Katamaran">Katamaran</option>
                <option value="Yat">Yat</option>
              </select>
            </div>

            {/* Durum Checkboxes */}
            <div className="md:col-span-2 flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
                  id="aktif"
                />
                <Label htmlFor="aktif" className="text-gray-300 cursor-pointer">
                  Aktif
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_frozen}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_frozen: !!checked })}
                  id="donduruldu"
                />
                <Label htmlFor="donduruldu" className="text-gray-300 cursor-pointer">
                  Donduruldu
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Boyutlar */}
        <div className="border border-blue-500/30 rounded-lg p-6 mb-6">
          <h3 className="flex items-center gap-2 text-white mb-4">
            <Ruler className="w-5 h-5 text-blue-400" />
            Boyutlar
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tam Boy */}
            <div>
              <Label className="text-gray-300 text-sm mb-2">Tam Boy (metre)</Label>
              <Input
                type="number"
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Kayıtlı Boy */}
            <div>
              <Label className="text-gray-300 text-sm mb-2">Kayıtlı Boy (metre)</Label>
              <Input
                type="number"
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Genişlik */}
            <div>
              <Label className="text-gray-300 text-sm mb-2">Genişlik (metre)</Label>
              <Input
                type="number"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Draft */}
            <div>
              <Label className="text-gray-300 text-sm mb-2">Draft (metre)</Label>
              <Input
                type="number"
                value={formData.draft}
                onChange={(e) => setFormData({ ...formData, draft: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Depth */}
            <div>
              <Label className="text-gray-300 text-sm mb-2">Depth (metre)</Label>
              <Input
                type="number"
                value={formData.depth}
                onChange={(e) => setFormData({ ...formData, depth: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Gross Tonnage */}
            <div>
              <Label className="text-gray-300 text-sm mb-2">Gross Tonnage (ton)</Label>
              <Input
                type="number"
                value={formData.gross_tonnage}
                onChange={(e) => setFormData({ ...formData, gross_tonnage: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
          </div>
        </div>

        {/* Kayıt Bilgileri */}
        <div className="border border-green-500/30 rounded-lg p-6 mb-6">
          <h3 className="flex items-center gap-2 text-white mb-4">
            <FileText className="w-5 h-5 text-green-400" />
            Kayıt Bilgileri
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Registration Number */}
            <div>
              <Label className="text-gray-300 text-sm mb-2">Sicil No</Label>
              <Input
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                placeholder="Sicil numarası"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Flag */}
            <div>
              <Label className="text-gray-300 text-sm mb-2">Bayrak</Label>
              <Input
                value={formData.flag}
                onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                placeholder="TC"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            onClick={() => setCurrentView('list')}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            İptal
          </Button>
          <Button
            onClick={handleSave}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Kaydet
          </Button>
        </div>
      </div>

      {/* Cari Seçici Modal */}
      {showCariSecici && (
        <CariSecici
          cariList={cariMasterData}
          selectedCari={selectedCari}
          onSelect={handleCariSelect}
          open={showCariSecici}
          onOpenChange={setShowCariSecici}
          title="Cari Seç - Motorbot Kartı"
        />
      )}
    </div>
  );

  // VIEW ROUTER
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {currentView === 'list' && renderList()}
        {(currentView === 'create' || currentView === 'edit') && renderForm()}
        
        {/* Motorbot Detay Dialog */}
        {showDetailDialog && selectedMotorbot && (
          <MotorbotKartiDetay
            motorbot={selectedMotorbot}
            onClose={() => { setShowDetailDialog(false); setSelectedMotorbot(null); }}
            onEdit={() => { setShowDetailDialog(false); handleEdit(selectedMotorbot); }}
            onDelete={(mb) => { handleDelete(mb.id); setShowDetailDialog(false); }}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}