// MOTORBOT SEFER YÖNETİMİ MODULE - Sefer Çıkış/Dönüş Kayıt + Listeleme
// Pattern: 3 bloklu layout standardı
// Blok 1: Header + İstatistikler + Sefer Kayıt Formu (Çıkış/Dönüş)
// Blok 2: Filtreler + Tab Menü
// Blok 3: Sefer Listesi (Seferde Olan | Döndü | Tümü)
// ✅ Saha personeli kayıtları buraya yansıyor
// ✅ Ofis personeli de kayıt yapabiliyor
// ✅ API entegrasyonu ile gerçek veri yönetimi

import { useState, useEffect, useMemo } from "react";
import { Theme } from "../ThemeSelector";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { 
  Ship, 
  Search,
  Loader2,
  CheckCircle,
  Clock,
  Plus,
  Send,
  LogOut,
  LogIn,
  DollarSign,
} from "lucide-react";
import { seferApi } from "../../lib/api/sefer";
import { motorbotApi } from "../../lib/api/motorbot";
import type { MbTrip, Motorbot } from "../../lib/types/database";
import { toast } from "sonner";

interface SeferModuleProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
}

type TabType = "SEFERDE" | "DONDU" | "TUMU";

export function SeferModule({ 
  onNavigateHome, 
  onNavigateBack, 
  theme,
}: SeferModuleProps) {
  const [seferler, setSeferler] = useState<MbTrip[]>([]);
  const [motorbotlar, setMotorbotlar] = useState<Motorbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Seferleri ve motorbotları yükle
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Paralel olarak seferler ve motorbotlar yükle
      const [tripResponse, motorbotResponse] = await Promise.all([
        seferApi.getAll({
          page: 1,
          page_size: 1000,
        }),
        motorbotApi.getAll({
          page: 1,
          page_size: 100,
          is_active: true,
        })
      ]);
      
      // Backend direkt array dönüyor
      const rawTrips = Array.isArray(tripResponse) ? tripResponse : (tripResponse.items || []);
      const rawMotorbots = Array.isArray(motorbotResponse) ? motorbotResponse : (motorbotResponse.items || []);
      
      // Backend PascalCase → Frontend snake_case mapping
      const mappedTrips = rawTrips.map((item: any) => ({
        id: item.Id,
        motorbot_id: item.MotorbotId,
        motorbot_code: item.MotorbotKod || '',
        motorbot_name: item.MotorbotAd || '',
        motorbot_owner: item.MotorbotSahibi || '',
        cari_code: item.CariKod || '',
        departure_date: item.SeferTarihi,
        departure_time: item.CikisZamani,
        return_date: item.DonusTarihi,
        return_time: item.DonusZamani,
        status: item.Durum,
        notes: item.Notlar || '',
        created_at: item.CreatedAt,
        updated_at: item.UpdatedAt,
      }));
      
      const mappedMotorbots = rawMotorbots.map((item: any) => ({
        id: item.Id,
        code: item.Kod,
        name: item.Ad,
        owner: item.OwnerCariKod || '',
        is_active: item.Durum === 'AKTIF',
      }));
      
      setSeferler(mappedTrips.sort((a, b) => 
        new Date(b.departure_date || '').getTime() - new Date(a.departure_date || '').getTime()
      ));
      setMotorbotlar(mappedMotorbots);
      
      // Empty state kontrolü
      if (mappedTrips.length === 0) {
        toast.info('Kayıt bulunamadı', {
          description: 'Henüz hiç sefer kaydı bulunmuyor'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Veri yüklenemedi';
      setError(errorMessage);
      toast.error('Veriler yüklenemedi', {
        description: errorMessage
      });
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    loadData();
    
    // Default tarih ve saat ayarla
    const today = new Date().toISOString().split('T')[0];
    setDepartureDate(today);
    setReturnDate(today);
    
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setDepartureTime(currentTime);
    setReturnTime(currentTime);
  }, []);

  // Sefer Çıkış Kaydı
  const handleSeferCikis = async () => {
    if (!selectedMotorbotId || !departureDate || !departureTime) {
      toast.error('Eksik bilgi', {
        description: 'Lütfen motorbot, tarih ve saat bilgilerini doldurun'
      });
      return;
    }

    const motorbot = motorbotlar.find(m => m.id === selectedMotorbotId);
    if (!motorbot) {
      toast.error('Motorbot bulunamadı', {
        description: 'Seçilen motorbot listede bulunamadı'
      });
      return;
    }

    try {
      const newTrip = await seferApi.createDeparture({
        motorbot_id: motorbot.id,
        motorbot_code: motorbot.code,
        motorbot_name: motorbot.name,
        motorbot_owner: motorbot.owner,
        cari_code: motorbot.owner || '',
        departure_date: departureDate,
        departure_time: departureTime,
        departure_note: departureNote,
        unit_price: 10.00,
        currency: 'USD',
        vat_rate: 18,
      });

      setSeferler([newTrip, ...seferler]);
      
      // Form temizle
      setSelectedMotorbotId(null);
      setDepartureNote("");
      
      toast.success('Sefer çıkış kaydı oluşturuldu', {
        description: `${motorbot.code} - ${motorbot.name} sefere çıktı`
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kayıt oluşturulamadı';
      toast.error('Sefer çıkış kaydedilemedi', {
        description: errorMessage
      });
      console.error('Sefer çıkış hatası:', err);
    }
  };

  // Sefer Dönüş Kaydı
  const handleSeferDonus = async () => {
    if (!selectedSeferId || !returnDate || !returnTime) {
      toast.error('Eksik bilgi', {
        description: 'Lütfen sefer, tarih ve saat bilgilerini doldurun'
      });
      return;
    }

    const sefer = seferler.find(s => s.id === selectedSeferId);
    if (!sefer) {
      toast.error('Sefer bulunamadı', {
        description: 'Seçilen sefer listede bulunamadı'
      });
      return;
    }

    try {
      const updatedTrip = await seferApi.recordReturn(selectedSeferId, {
        return_date: returnDate,
        return_time: returnTime,
        return_note: returnNote,
      });

      const updatedSeferler = seferler.map(s => 
        s.id === selectedSeferId ? updatedTrip : s
      );
      setSeferler(updatedSeferler);
      
      // Form temizle
      setSelectedSeferId(null);
      setReturnNote("");
      
      toast.success('Sefer dönüş kaydı tamamlandı', {
        description: `${sefer.motorbot_code} - ${sefer.motorbot_name} döndü`
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Dönüş kaydedilemedi';
      toast.error('Sefer dönüş kaydedilemedi', {
        description: errorMessage
      });
      console.error('Sefer dönüş hatası:', err);
    }
  };

  // Filtrelenmiş seferler
  const filteredSeferler = useMemo(() => {
    let filtered = seferler || [];

    // Tab filtresi
    if (activeTab === "SEFERDE") {
      filtered = filtered.filter(s => s.status === "DEPARTED");
    } else if (activeTab === "DONDU") {
      filtered = filtered.filter(s => s.status === "RETURNED");
    }

    // Arama
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.motorbot_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.motorbot_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.motorbot_owner && s.motorbot_owner.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.cari_code && s.cari_code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Motorbot filtresi
    if (filterMotorbotCode !== "ALL") {
      filtered = filtered.filter(s => s.motorbot_code === filterMotorbotCode);
    }

    // Cari filtresi
    if (filterCariCode !== "ALL") {
      filtered = filtered.filter(s => s.cari_code === filterCariCode);
    }

    // Tarih filtresi
    if (filterDateStart) {
      filtered = filtered.filter(s => s.departure_date >= filterDateStart);
    }
    if (filterDateEnd) {
      filtered = filtered.filter(s => s.departure_date <= filterDateEnd);
    }

    return filtered;
  }, [seferler, activeTab, searchTerm, filterMotorbotCode, filterCariCode, filterDateStart, filterDateEnd]);

  // İstatistikler
  const stats = useMemo(() => {
    const seferdekiler = seferler.filter(s => s.status === "DEPARTED").length;
    const donduler = seferler.filter(s => s.status === "RETURNED").length;
    const toplamSefer = seferler.length;
    const toplamGelir = seferler
      .filter(s => s.status === "RETURNED")
      .reduce((sum, s) => sum + (s.total_price || 0), 0);

    return {
      seferdekiler,
      donduler,
      toplamSefer,
      toplamGelir,
    };
  }, [seferler]);

  // Seferdeki motorbot kodları
  const seferdekiMotorbotlar = useMemo(() => {
    return seferler
      .filter(s => s.status === "DEPARTED")
      .map(s => s.motorbot_code);
  }, [seferler]);

  // Motorbot dropdown options
  const motorbotOptions = useMemo(() => {
    if (formMode === "CIKIS") {
      // Çıkış: Seferde olmayan motorbotlar
      return motorbotlar.filter(m => !seferdekiMotorbotlar.includes(m.code));
    } else {
      // Dönüş: Seferdeki motorbotlar
      return motorbotlar.filter(m => seferdekiMotorbotlar.includes(m.code));
    }
  }, [formMode, seferdekiMotorbotlar, motorbotlar]);

  // Sefer dropdown options (dönüş için)
  const seferOptions = useMemo(() => {
    return seferler.filter(s => s.status === "DEPARTED");
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
                        <option key={m.id} value={m.id}>
                          {m.code} - {m.name} {m.owner ? `(${m.owner})` : ''}
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
                        <option key={s.id} value={s.id}>
                          {s.motorbot_code} - {s.motorbot_name} | Çıkış: {s.departure_date} {s.departure_time}
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
              Seferde Olan ({seferler.filter(s => s.status === "DEPARTED").length})
            </Button>
            <Button
              onClick={() => setActiveTab("DONDU")}
              variant={activeTab === "DONDU" ? "default" : "outline"}
              className={activeTab === "DONDU"
                ? "bg-green-600 hover:bg-green-700"
                : "border-gray-600 text-gray-300"}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Döndü ({seferler.filter(s => s.status === "RETURNED").length})
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
                  {Array.from(new Set(seferler.map(s => s.motorbot_code))).sort().map(code => (
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
                  {Array.from(new Set(seferler.filter(s => s.cari_code).map(s => s.cari_code!))).sort().map(code => (
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
                      <p className="text-sm">Kayıt bulunamadı</p>
                      <p className="text-xs mt-1">Henüz sefer kaydı bulunmuyor</p>
                    </td>
                  </tr>
                ) : (
                  filteredSeferler.map((sefer) => (
                    <tr key={sefer.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-400">#{sefer.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-white">{sefer.motorbot_code}</div>
                        <div className="text-xs text-gray-500">{sefer.motorbot_name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{sefer.motorbot_owner || '-'}</td>
                      <td className="px-4 py-3">
                        {sefer.cari_code ? (
                          <Badge className="bg-blue-500/20 border-blue-500/30 text-blue-400 text-xs">
                            {sefer.cari_code}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-white">{sefer.departure_date}</div>
                        <div className="text-xs text-gray-500">{sefer.departure_time}</div>
                      </td>
                      <td className="px-4 py-3">
                        {sefer.return_date && sefer.return_time ? (
                          <>
                            <div className="text-sm text-white">{sefer.return_date}</div>
                            <div className="text-xs text-gray-500">{sefer.return_time}</div>
                          </>
                        ) : (
                          <span className="text-xs text-yellow-400">Beklemede</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono">
                        {sefer.duration_minutes 
                          ? `${Math.floor(sefer.duration_minutes / 60)}s ${sefer.duration_minutes % 60}dk`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono text-green-400">
                        ${sefer.total_price?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 py-3">
                        {sefer.status === "DEPARTED" ? (
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