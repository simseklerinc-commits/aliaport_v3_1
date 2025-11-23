// MOTORBOT KARTLARI - Sadeleştirilmiş Form, Cari Seçici Entegrasyonu
// Barınma modülü ile entegre

import { useState } from "react";
import { Search, Plus, Edit, Anchor, X, Save, Trash2, Building2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Theme } from "./ThemeSelector";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card } from "./ui/card";
import { Motorbot, motorbotMasterData } from "../data/motorbotData";
import { CariKart, cariMasterData } from "../data/cariData";
import { CariSecici } from "./CariSecici";
import { MotorbotKartiDetay } from "./MotorbotKartiDetay";

interface MotorbotKartlariProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
  onNavigateToCariForm?: () => void; // Yeni cari formu için
  selectionMode?: boolean; // KontratGiris'ten motorbot seçme modu
  onMotorbotSelect?: (motorbot: Motorbot) => void; // Seçim callback'i
}

export function MotorbotKartlari({ onNavigateHome, onNavigateBack, theme, onNavigateToCariForm, selectionMode, onMotorbotSelect }: MotorbotKartlariProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMotorbot, setSelectedMotorbot] = useState<Motorbot | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [motorbots, setMotorbots] = useState<Motorbot[]>(motorbotMasterData);
  const [showCariSecici, setShowCariSecici] = useState(false);
  const [selectedCari, setSelectedCari] = useState<CariKart | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Motorbot>>({
    Code: "",
    Name: "",
    Owner: "",
    OwnerCode: "",
    OwnerId: 0,
    Length: 0,
    RegisteredLength: 0,
    Width: 0,
    Type: "Motorbot",
    Active: true,
    IsFrozen: false,
    CreatedBy: "admin",
    CreatedAt: new Date().toISOString(),
  });

  const filteredMotorbot = motorbots.filter(
    (mb) =>
      mb.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mb.Owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mb.Code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewMotorbot = () => {
    setSelectedCari(null);
    setFormData({
      Code: `MB-${String(motorbots.length + 1).padStart(3, '0')}`,
      Name: "",
      Owner: "",
      OwnerCode: "",
      OwnerId: 0,
      Length: 0,
      RegisteredLength: 0,
      Width: 0,
      Type: "Motorbot",
      Active: true,
      IsFrozen: false,
      CreatedBy: "admin",
      CreatedAt: new Date().toISOString(),
    });
    setShowNewForm(true);
  };

  const handleEdit = (mb: Motorbot) => {
    setSelectedMotorbot(mb);
    setFormData(mb);
    const cari = cariMasterData.find(c => c.Code === mb.OwnerCode || c.Id === mb.OwnerId);
    setSelectedCari(cari || null);
    setShowEditForm(true);
  };

  const handleViewDetail = (mb: Motorbot) => {
    setSelectedMotorbot(mb);
    setShowDetail(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bu motorbot kartını silmek istediğinizden emin misiniz?")) {
      setMotorbots(motorbots.filter(mb => mb.Id !== id));
    }
  };

  const handleSaveNew = () => {
    if (!formData.Name || !formData.Owner) {
      alert("Tekne adı ve cari bilgisi zorunludur!");
      return;
    }

    const newMotorbot: Motorbot = {
      Id: Math.max(...motorbots.map(m => m.Id)) + 1,
      Code: formData.Code || `MB-${String(motorbots.length + 1).padStart(3, '0')}`,
      Name: formData.Name!,
      Owner: formData.Owner!,
      OwnerId: formData.OwnerId || 0,
      OwnerCode: formData.OwnerCode || "",
      Length: formData.Length || 0,
      RegisteredLength: formData.RegisteredLength || 0,
      Width: formData.Width || 0,
      Type: formData.Type || "Motorbot",
      Active: formData.Active ?? true,
      IsFrozen: formData.IsFrozen ?? false,
      CreatedBy: formData.CreatedBy,
      CreatedAt: formData.CreatedAt,
    };

    setMotorbots([...motorbots, newMotorbot]);
    setShowNewForm(false);
    setSelectedCari(null);
    alert("Motorbot kartı başarıyla oluşturuldu!");
  };

  const handleSaveEdit = () => {
    if (!formData.Name || !formData.Owner || !selectedMotorbot) {
      alert("Tekne adı ve cari bilgisi zorunludur!");
      return;
    }

    const updatedMotorbot: Motorbot = {
      ...selectedMotorbot,
      ...formData,
    } as Motorbot;

    setMotorbots(motorbots.map(mb => mb.Id === selectedMotorbot.Id ? updatedMotorbot : mb));
    setShowEditForm(false);
    setSelectedMotorbot(null);
    setSelectedCari(null);
    alert("Motorbot kartı başarıyla güncellendi!");
  };

  const handleCariSelect = (cari: CariKart | null) => {
    if (cari) {
      setSelectedCari(cari);
      setFormData({
        ...formData,
        Owner: cari.Name,
        OwnerCode: cari.Code,
        OwnerId: cari.Id,
      });
    }
  };

  const handleNewCariClick = () => {
    setShowCariSecici(false);
    if (onNavigateToCariForm) {
      onNavigateToCariForm();
    } else {
      alert("Yeni cari kartı oluşturma özelliği yakında eklenecek!");
    }
  };

  const renderForm = (isEdit: boolean) => (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl text-white">{isEdit ? "Motorbot Kartı Düzenle" : "Yeni Motorbot Kartı"}</h2>
            <p className="text-sm text-gray-400">Tekne bilgileri ve barınma sözleşmesi detayları</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowNewForm(false);
              setShowEditForm(false);
              setSelectedMotorbot(null);
              setSelectedCari(null);
            }}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Temel Bilgiler */}
          <Card className="bg-gray-800/50 border-gray-700 p-4">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Anchor className="w-5 h-5 text-blue-400" />
              Temel Bilgiler
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Motorbot Kodu *</Label>
                <Input
                  value={formData.Code}
                  onChange={(e) => setFormData({ ...formData, Code: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="MB-001"
                />
              </div>
              
              <div>
                <Label className="text-gray-300">Tekne Adı *</Label>
                <Input
                  value={formData.Name}
                  onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="M/Y BLUE SEA"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label className="text-gray-300">Cari Ünvan *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={selectedCari ? `${selectedCari.Name} (${selectedCari.Code})` : formData.Owner || ""}
                    readOnly
                    className="bg-gray-800 border-gray-600 text-white cursor-pointer"
                    placeholder="Cari seçiniz..."
                    onClick={() => setShowCariSecici(true)}
                  />
                  <Button
                    type="button"
                    onClick={() => setShowCariSecici(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Seç
                  </Button>
                </div>
                {selectedCari && (
                  <div className="mt-2 p-3 bg-gray-800 rounded border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white font-medium">{selectedCari.Name}</p>
                        <p className="text-xs text-gray-400">{selectedCari.Code} • {selectedCari.TaxIdType}: {selectedCari.TaxId}</p>
                        <p className="text-xs text-gray-500">{selectedCari.City}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCari(null);
                          setFormData({ ...formData, Owner: "", OwnerCode: "", OwnerId: 0 });
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-gray-300">Cari Kodu</Label>
                <Input
                  value={formData.OwnerCode}
                  readOnly
                  className="bg-gray-700 border-gray-600 text-gray-400 mt-1"
                  placeholder="Otomatik"
                />
              </div>
              
              <div>
                <Label className="text-gray-300">Tip</Label>
                <Select value={formData.Type} onValueChange={(v) => setFormData({ ...formData, Type: v })}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="Motorbot">Motorbot</SelectItem>
                    <SelectItem value="Yelkenli">Yelkenli</SelectItem>
                    <SelectItem value="Yat">Yat</SelectItem>
                    <SelectItem value="İş Teknesi">İş Teknesi</SelectItem>
                    <SelectItem value="Kargo Gemisi">Kargo Gemisi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2">
                <Label className="text-gray-300">Durum</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.Active}
                      onChange={(e) => setFormData({ ...formData, Active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    Aktif
                  </label>
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.IsFrozen}
                      onChange={(e) => setFormData({ ...formData, IsFrozen: e.target.checked })}
                      className="w-4 h-4"
                    />
                    Donduruldu
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Boyutlar */}
          <Card className="bg-gray-800/50 border-gray-700 p-4">
            <h3 className="text-lg font-bold text-white mb-4">Boyutlar</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-300">Tam Boy (metre)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.Length}
                  onChange={(e) => setFormData({ ...formData, Length: parseFloat(e.target.value) || 0 })}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label className="text-gray-300">Kayıtlı Boy (metre)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.RegisteredLength}
                  onChange={(e) => setFormData({ ...formData, RegisteredLength: parseFloat(e.target.value) || 0 })}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label className="text-gray-300">Genişlik (metre)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.Width}
                  onChange={(e) => setFormData({ ...formData, Width: parseFloat(e.target.value) || 0 })}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="0"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 px-6 py-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setShowNewForm(false);
              setShowEditForm(false);
              setSelectedMotorbot(null);
              setSelectedCari(null);
            }}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            İptal
          </Button>
          
          <Button
            onClick={isEdit ? handleSaveEdit : handleSaveNew}
            className="bg-cyan-500 hover:bg-cyan-600 text-black"
          >
            <Save className="w-4 h-4 mr-2" />
            Kaydet
          </Button>
        </div>
      </div>

      {/* Cari Seçici Dialog */}
      <CariSecici
        cariList={cariMasterData}
        selectedCari={selectedCari}
        onSelect={handleCariSelect}
        open={showCariSecici}
        onOpenChange={setShowCariSecici}
        title="Cari Seç - Motorbot Kartı"
        onNewCari={handleNewCariClick}
      />
    </div>
  );

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl mb-1 text-white">Motorbot Kartları</h2>
            <p className={theme.colors.textMuted}>Tekne bilgileri ve barınma sözleşmeleri</p>
          </div>
          <Button
            className={`${theme.colors.primary} ${theme.colors.primaryHover} text-black`}
            onClick={handleNewMotorbot}
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Motorbot Kartı
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Tekne ara... (Tekne Adı, Cari Ünvan, Cari Kod)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 text-white"
            />
          </div>
        </div>

        {/* Motorbot Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMotorbot.map((mb) => (
            <div
              key={mb.Id}
              onClick={() => handleViewDetail(mb)}
              className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-5 hover:border-gray-600 transition-all cursor-pointer`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Anchor className={`w-4 h-4 ${theme.colors.primaryText}`} />
                    <h3 className="line-clamp-1 text-white font-bold">{mb.Name}</h3>
                  </div>
                  <p className={`text-xs ${theme.colors.textMuted}`}>
                    {mb.Owner} ({mb.Code})
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant={mb.Active ? "default" : "secondary"} className={mb.Active ? theme.colors.primary + " text-black" : "bg-gray-700 text-gray-300"}>
                    {mb.Active ? "AKTİF" : "PASİF"}
                  </Badge>
                  {mb.IsFrozen && (
                    <Badge variant="outline" className="border-orange-600 text-orange-400 text-xs">
                      DONDURULDU
                    </Badge>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className={theme.colors.textMuted}>Tam Boy:</span>
                  <span className="text-white">{mb.Length} m</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={theme.colors.textMuted}>Kayıtlı Boy:</span>
                  <span className="text-white">{mb.RegisteredLength} m</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={theme.colors.textMuted}>Genişlik:</span>
                  <span className="text-white">{mb.Width} m</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={theme.colors.textMuted}>Tip:</span>
                  <span className="text-white">{mb.Type}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2">
                {selectionMode ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      onMotorbotSelect && onMotorbotSelect(mb);
                      onNavigateBack();
                    }}
                    className={`${theme.colors.primary} ${theme.colors.primaryHover} text-black`}
                  >
                    <Anchor className="w-4 h-4 mr-1" />
                    Seç
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(mb)}
                      className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Düzenle
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(mb.Id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Sil
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}\n        </div>

        {/* Empty State */}
        {filteredMotorbot.length === 0 && (
          <div className="text-center py-12">
            <Anchor className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">Motorbot bulunamadı</p>
            <p className="text-sm text-gray-500 mt-2">
              Yeni motorbot kartı eklemek için yukarıdaki butonu kullanın
            </p>
          </div>
        )}

        {/* New Form */}
        {showNewForm && renderForm(false)}

        {/* Edit Form */}
        {showEditForm && renderForm(true)}

        {/* Motorbot Detay - Audit Sistemli Component */}
        {showDetail && selectedMotorbot && (
          <MotorbotKartiDetay
            motorbot={selectedMotorbot}
            onClose={() => {
              setShowDetail(false);
              setSelectedMotorbot(null);
            }}
            onEdit={() => {
              setShowDetail(false);
              handleEdit(selectedMotorbot);
            }}
            onDelete={(mb) => {
              console.log('Delete:', mb);
              handleDelete(mb.Id);
              setShowDetail(false);
              setSelectedMotorbot(null);
            }}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}