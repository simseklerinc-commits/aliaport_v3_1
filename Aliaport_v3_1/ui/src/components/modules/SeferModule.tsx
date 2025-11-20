// MOTORBOT SEFER YÖNETİMİ MODULE - Sefer Çıkış/Dönüş Kayıt + Listeleme
// Pattern: 3 bloklu layout standardı
// Blok 1: Header + İstatistikler + Sefer Kayıt Formu (Çıkış/Dönüş)
// Blok 2: Filtreler + Tab Menü
// Blok 3: Sefer Listesi (Seferde Olan | Döndü | Tümü)
// ✅ Saha personeli kayıtları buraya yansıyor
// ✅ Ofis personeli de kayıt yapabiliyor

import { useState, useEffect, useMemo } from "react";
import { Theme } from "../ThemeSelector";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { 
  Ship, 
  Calendar,
  Filter,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Send,
  LogOut,
  LogIn,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { 
  MotorbotSefer, 
  motorbotSeferData,
} from "../../data/motorbotSeferData";
import { motorbotMasterData } from "../../data/motorbotData";

interface SeferModuleProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
  seferler?: MotorbotSefer[];
  onSaveSefer?: (sefer: MotorbotSefer) => void;
}

type TabType = "SEFERDE" | "DONDU" | "TUMU";

export function SeferModule({ 
  onNavigateHome, 
  onNavigateBack, 
  theme,
  seferler: externalSeferler,
  onSaveSefer,
}: SeferModuleProps) {
  const [seferler, setSeferler] = useState<MotorbotSefer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("SEFERDE");

  // Form states
  const [formMode, setFormMode] = useState<"CIKIS" | "DONUS">("CIKIS");
  const [selectedMotorbotId, setSelectedMotorbotId] = useState<number | null>(null);
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [departureNote, setDepartureNote] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [returnNote, setReturnNote] = useState("");
  const [selectedSeferId, setSelectedSeferId] = useState<number | null>(null);

  // Filtreler
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMotorbotCode, setFilterMotorbotCode] = useState("ALL");
  const [filterCariCode, setFilterCariCode] = useState("ALL");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");

  // Mock data yükle
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Eğer external seferler varsa onları kullan, yoksa mock data
      if (externalSeferler && externalSeferler.length > 0) {
        setSeferler([...externalSeferler].sort((a, b) => 
          new Date(b.DepartureDate).getTime() - new Date(a.DepartureDate).getTime()
        ));
      } else {
        setSeferler([...motorbotSeferData].sort((a, b) => 
          new Date(b.DepartureDate).getTime() - new Date(a.DepartureDate).getTime()
        ));
      }
      
      // Default tarih: bugün
      const today = new Date().toISOString().split('T')[0];
      setDepartureDate(today);
      setReturnDate(today);
      
      // Default saat: şu an
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setDepartureTime(currentTime);
      setReturnTime(currentTime);
      
      setLoading(false);
    };
    loadData();
  }, []);

  // External seferler değiştiğinde sync et
  useEffect(() => {
    if (externalSeferler && externalSeferler.length > 0) {
      setSeferler([...externalSeferler].sort((a, b) => 
        new Date(b.DepartureDate).getTime() - new Date(a.DepartureDate).getTime()
      ));
    }
  }, [externalSeferler]);

  // Sefer Çıkış Kaydı
  const handleSeferCikis = () => {
    if (!selectedMotorbotId || !departureDate || !departureTime) {
      alert("Lütfen motorbot, tarih ve saat bilgilerini doldurun!");
      return;
    }

    const motorbot = motorbotMasterData.find(m => m.Id === selectedMotorbotId);
    if (!motorbot) return;

    const newSefer: MotorbotSefer = {
      Id: Math.max(...seferler.map(s => s.Id), 0) + 1,
      MotorbotId: motorbot.Id,
      MotorbotCode: motorbot.Code,
      MotorbotName: motorbot.Name,
      MotorbotOwner: motorbot.Owner,
      CariCode: motorbot.CariCode || motorbot.OwnerCode,
      
      DepartureDate: departureDate,
      DepartureTime: departureTime,
      DepartureNote: departureNote,
      
      Status: "DEPARTED",
      
      UnitPrice: 10.00,
      Currency: "USD",
      VatRate: 18,
      VatAmount: 0,
      TotalPrice: 0,
      
      IsInvoiced: false,
      
      CreatedAt: new Date().toISOString(),
      CreatedBy: 101, // Mock user
    };

    // Parent state'i güncelle (App.tsx)
    if (onSaveSefer) {
      onSaveSefer(newSefer);
    } else {
      // Fallback: local state güncelle
      setSeferler([newSefer, ...seferler]);
    }
    
    // Form temizle
    setSelectedMotorbotId(null);
    setDepartureNote("");
    
    alert(`✅ Sefer çıkış kaydı başarıyla oluşturuldu!\nMotorbot: ${motorbot.Code} - ${motorbot.Name}`);
  };

  // Sefer Dönüş Kaydı
  const handleSeferDonus = () => {
    if (!selectedSeferId || !returnDate || !returnTime) {
      alert("Lütfen sefer, tarih ve saat bilgilerini doldurun!");
      return;
    }

    const sefer = seferler.find(s => s.Id === selectedSeferId);
    if (!sefer) return;

    const departure = new Date(`${sefer.DepartureDate}T${sefer.DepartureTime}`);
    const returnDateTime = new Date(`${returnDate}T${returnTime}`);
    const duration = Math.floor((returnDateTime.getTime() - departure.getTime()) / 1000 / 60); // dakika

    const price = duration > 0 ? (duration / 60) * sefer.UnitPrice : 0;
    const vatAmount = price * (sefer.VatRate / 100);
    const totalPrice = price + vatAmount;

    const updatedSefer: MotorbotSefer = {
      ...sefer,
      ReturnDate: returnDate,
      ReturnTime: returnTime,
      ReturnNote: returnNote,
      Duration: duration,
      Status: "RETURNED" as const,
      VatAmount: vatAmount,
      TotalPrice: totalPrice,
    };

    // Parent state'i güncelle (App.tsx)
    if (onSaveSefer) {
      onSaveSefer(updatedSefer);
    } else {
      // Fallback: local state güncelle
      const updatedSeferler = seferler.map(s => 
        s.Id === selectedSeferId ? updatedSefer : s
      );
      setSeferler(updatedSeferler);
    }
    
    // Form temizle
    setSelectedSeferId(null);
    setReturnNote("");
    
    alert(`✅ Sefer dönüş kaydı başarıyla tamamlandı!`);
  };

  // Filtrelenmiş seferler
  const filteredSeferler = useMemo(() => {
    let filtered = seferler;

    // Tab filtresi
    if (activeTab === "SEFERDE") {
      filtered = filtered.filter(s => s.Status === "DEPARTED");
    } else if (activeTab === "DONDU") {
      filtered = filtered.filter(s => s.Status === "RETURNED");
    }

    // Arama
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.MotorbotCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.MotorbotName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.MotorbotOwner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.CariCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Motorbot filtresi
    if (filterMotorbotCode !== "ALL") {
      filtered = filtered.filter(s => s.MotorbotCode === filterMotorbotCode);
    }

    // Cari filtresi
    if (filterCariCode !== "ALL") {
      filtered = filtered.filter(s => s.CariCode === filterCariCode);
    }

    // Tarih filtresi
    if (filterDateStart) {
      filtered = filtered.filter(s => s.DepartureDate >= filterDateStart);
    }
    if (filterDateEnd) {
      filtered = filtered.filter(s => s.DepartureDate <= filterDateEnd);
    }

    return filtered;
  }, [seferler, activeTab, searchTerm, filterMotorbotCode, filterCariCode, filterDateStart, filterDateEnd]);

  // İstatistikler
  const stats = useMemo(() => {
    const seferdekiler = seferler.filter(s => s.Status === "DEPARTED").length;
    const donduler = seferler.filter(s => s.Status === "RETURNED").length;
    const toplamSefer = seferler.length;
    const toplamGelir = seferler
      .filter(s => s.Status === "RETURNED")
      .reduce((sum, s) => sum + (s.TotalPrice || 0), 0);

    return {
      seferdekiler,
      donduler,
      toplamSefer,
      toplamGelir,
    };
  }, [seferler]);

  // Seferdeki motorbot listesi
  const seferdekiMotorbotlar = seferler
    .filter(s => s.Status === "DEPARTED")
    .map(s => s.MotorbotCode);

  // Motorbot dropdown options
  const motorbotOptions = useMemo(() => {
    if (formMode === "CIKIS") {
      // Çıkış: Seferde olmayan motorbotlar
      return motorbotMasterData.filter(m => !seferdekiMotorbotlar.includes(m.Code));
    } else {
      // Dönüş: Seferdeki motorbotlar
      return motorbotMasterData.filter(m => seferdekiMotorbotlar.includes(m.Code));
    }
  }, [formMode, seferdekiMotorbotlar]);

  // Sefer dropdown options (dönüş için)
  const seferOptions = useMemo(() => {
    return seferler.filter(s => s.Status === "DEPARTED");
  }, [seferler]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-400" />
          <p className="text-gray-400">Seferler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* ========== BLOK 1: HEADER + İSTATİSTİKLER + SEFER KAYIT FORMU ========== */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Ship className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Motorbot Sefer Yönetimi</h1>
                <p className="text-sm text-gray-400">
                  Sefer çıkış/dönüş kayıt ve takip sistemi • Saha & Ofis Personeli
                </p>
              </div>
            </div>
            <Button onClick={onNavigateBack} variant="outline" className="border-gray-600 text-gray-300">
              Geri
            </Button>
          </div>

          {/* Özet Kartlar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900/50 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-yellow-400 opacity-70" />
                <Badge className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400">
                  {stats.seferdekiler}
                </Badge>
              </div>
              <p className="text-sm text-gray-400">Seferde Olan</p>
              <p className="text-xs text-gray-500 mt-1">Denizde olan motorbotlar</p>
            </div>

            <div className="bg-gray-900/50 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-green-400 opacity-70" />
                <Badge className="bg-green-500/20 border-green-500/30 text-green-400">
                  {stats.donduler}
                </Badge>
              </div>
              <p className="text-sm text-gray-400">Döndü</p>
              <p className="text-xs text-gray-500 mt-1">Tamamlanan seferler</p>
            </div>

            <div className="bg-gray-900/50 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Ship className="w-8 h-8 text-blue-400 opacity-70" />
              </div>
              <p className="text-sm text-gray-400">Toplam Sefer</p>
              <p className="text-lg font-mono text-blue-400">{stats.toplamSefer}</p>
            </div>

            <div className="bg-gray-900/50 border border-cyan-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-cyan-400 opacity-70" />
              </div>
              <p className="text-sm text-gray-400">Toplam Gelir</p>
              <p className="text-lg font-mono text-cyan-400">
                ${stats.toplamGelir.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Sefer Kayıt Formu */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-white">
                <Plus className="w-5 h-5 text-green-400" />
                Sefer Kayıt Formu
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => setFormMode("CIKIS")}
                  variant={formMode === "CIKIS" ? "default" : "outline"}
                  className={formMode === "CIKIS" 
                    ? "bg-blue-600 hover:bg-blue-700" 
                    : "border-gray-600 text-gray-300"}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sefer Çıkış
                </Button>
                <Button
                  onClick={() => setFormMode("DONUS")}
                  variant={formMode === "DONUS" ? "default" : "outline"}
                  className={formMode === "DONUS" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "border-gray-600 text-gray-300"}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sefer Dönüş
                </Button>
              </div>
            </div>

            {formMode === "CIKIS" ? (
              // SEFER ÇIKIŞ FORMU
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 text-sm mb-2">Motorbot *</Label>
                    <select
                      value={selectedMotorbotId || ""}
                      onChange={(e) => setSelectedMotorbotId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                    >
                      <option value="">Motorbot seçin...</option>
                      {motorbotOptions.map(m => (
                        <option key={m.Id} value={m.Id}>
                          {m.Code} - {m.Name} ({m.Owner})
                        </option>
                      ))}
                    </select>
                    {motorbotOptions.length === 0 && (
                      <p className="text-xs text-yellow-400 mt-1">
                        ⚠️ Tüm motorbotlar seferde
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-gray-300 text-sm mb-2">Çıkış Tarihi *</Label>
                      <Input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm mb-2">Çıkış Saati *</Label>
                      <Input
                        type="time"
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300 text-sm mb-2">Çıkış Notu</Label>
                  <Textarea
                    value={departureNote}
                    onChange={(e) => setDepartureNote(e.target.value)}
                    placeholder="Çıkış ile ilgili notlar..."
                    className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                  />
                </div>

                <Button 
                  onClick={handleSeferCikis}
                  disabled={!selectedMotorbotId || !departureDate || !departureTime}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Sefer Çıkış Kaydı Oluştur
                </Button>
              </div>
            ) : (
              // SEFER DÖNÜŞ FORMU
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 text-sm mb-2">Sefer *</Label>
                    <select
                      value={selectedSeferId || ""}
                      onChange={(e) => setSelectedSeferId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                    >
                      <option value="">Sefer seçin...</option>
                      {seferOptions.map(s => (
                        <option key={s.Id} value={s.Id}>
                          {s.MotorbotCode} - {s.MotorbotName} | Çıkış: {s.DepartureDate} {s.DepartureTime}
                        </option>
                      ))}
                    </select>
                    {seferOptions.length === 0 && (
                      <p className="text-xs text-yellow-400 mt-1">
                        ⚠️ Seferde motorbot yok
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-gray-300 text-sm mb-2">Dönüş Tarihi *</Label>
                      <Input
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm mb-2">Dönüş Saati *</Label>
                      <Input
                        type="time"
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300 text-sm mb-2">Dönüş Notu</Label>
                  <Textarea
                    value={returnNote}
                    onChange={(e) => setReturnNote(e.target.value)}
                    placeholder="Dönüş ile ilgili notlar..."
                    className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                  />
                </div>

                <Button 
                  onClick={handleSeferDonus}
                  disabled={!selectedSeferId || !returnDate || !returnTime}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Sefer Dönüş Kaydı Tamamla
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ========== BLOK 2: FİLTRELER + TAB MENÜ ========== */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          {/* Tab Menü */}
          <div className="flex items-center gap-2 mb-6">
            <Button
              onClick={() => setActiveTab("SEFERDE")}
              variant={activeTab === "SEFERDE" ? "default" : "outline"}
              className={activeTab === "SEFERDE"
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "border-gray-600 text-gray-300"}
            >
              <Clock className="w-4 h-4 mr-2" />
              Seferde Olan ({seferler.filter(s => s.Status === "DEPARTED").length})
            </Button>
            <Button
              onClick={() => setActiveTab("DONDU")}
              variant={activeTab === "DONDU" ? "default" : "outline"}
              className={activeTab === "DONDU"
                ? "bg-green-600 hover:bg-green-700"
                : "border-gray-600 text-gray-300"}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Döndü ({seferler.filter(s => s.Status === "RETURNED").length})
            </Button>
            <Button
              onClick={() => setActiveTab("TUMU")}
              variant={activeTab === "TUMU" ? "default" : "outline"}
              className={activeTab === "TUMU"
                ? "bg-blue-600 hover:bg-blue-700"
                : "border-gray-600 text-gray-300"}
            >
              <Ship className="w-4 h-4 mr-2" />
              Tümü ({seferler.length})
            </Button>
          </div>

          {/* Filtreler */}
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300 text-sm mb-2">Arama</Label>
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Motorbot kodu, adı, sahibi, cari kodu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-900 border-gray-700 text-white pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-300 text-sm mb-2">Motorbot</Label>
                <select
                  value={filterMotorbotCode}
                  onChange={(e) => setFilterMotorbotCode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                >
                  <option value="ALL">Tümü</option>
                  {Array.from(new Set(seferler.map(s => s.MotorbotCode))).sort().map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-gray-300 text-sm mb-2">Cari</Label>
                <select
                  value={filterCariCode}
                  onChange={(e) => setFilterCariCode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                >
                  <option value="ALL">Tümü</option>
                  {Array.from(new Set(seferler.map(s => s.CariCode))).sort().map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-gray-300 text-sm mb-2">Başlangıç Tarihi</Label>
                <Input
                  type="date"
                  value={filterDateStart}
                  onChange={(e) => setFilterDateStart(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300 text-sm mb-2">Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={filterDateEnd}
                  onChange={(e) => setFilterDateEnd(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========== BLOK 3: SEFER LİSTESİ ========== */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-white">
              <Ship className="w-5 h-5 text-blue-400" />
              {activeTab === "SEFERDE" && `Seferde Olan Motorbotlar (${filteredSeferler.length})`}
              {activeTab === "DONDU" && `Dönen Motorbotlar (${filteredSeferler.length})`}
              {activeTab === "TUMU" && `Tüm Seferler (${filteredSeferler.length})`}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Motorbot</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Sahibi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Cari</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Çıkış</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Dönüş</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Süre</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Tutar</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Durum</th>
                </tr>
              </thead>
              <tbody>
                {filteredSeferler.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      <Ship className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Sefer bulunamadı</p>
                    </td>
                  </tr>
                ) : (
                  filteredSeferler.map((sefer) => (
                    <tr key={sefer.Id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-400">#{sefer.Id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-white">{sefer.MotorbotCode}</div>
                        <div className="text-xs text-gray-500">{sefer.MotorbotName}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{sefer.MotorbotOwner}</td>
                      <td className="px-4 py-3">
                        <Badge className="bg-blue-500/20 border-blue-500/30 text-blue-400 text-xs">
                          {sefer.CariCode}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-white">{sefer.DepartureDate}</div>
                        <div className="text-xs text-gray-500">{sefer.DepartureTime}</div>
                      </td>
                      <td className="px-4 py-3">
                        {sefer.ReturnDate && sefer.ReturnTime ? (
                          <>
                            <div className="text-sm text-white">{sefer.ReturnDate}</div>
                            <div className="text-xs text-gray-500">{sefer.ReturnTime}</div>
                          </>
                        ) : (
                          <span className="text-xs text-yellow-400">Beklemede</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono">
                        {sefer.Duration 
                          ? `${Math.floor(sefer.Duration / 60)}s ${sefer.Duration % 60}dk`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono text-green-400">
                        ${sefer.TotalPrice?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 py-3">
                        {sefer.Status === "DEPARTED" ? (
                          <Badge className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Seferde
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500/20 border-green-500/30 text-green-400 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Döndü
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}