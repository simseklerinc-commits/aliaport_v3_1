import { useState, useEffect } from "react";
import { Save, X, Anchor, Building2, Calendar, DollarSign, FileText, AlertCircle, Plus, ChevronsUpDown, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Theme } from "./ThemeSelector";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { MotorbotFormQuick } from "./MotorbotFormQuick";
import { CariFormQuick } from "./CariFormQuick";
import { motorbotMasterData } from "../data/motorbotData";
import { cariMasterData } from "../data/cariData";
import { priceListMasterData, priceListItemMasterData } from "../data/priceListData";
import { serviceCardMasterData } from "../data/serviceCardData";
import { cn } from "./ui/utils";

interface KontratGirisProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
  onNavigateToMotorbotKartlari?: () => void; // Motorbot seçimi için navigation
  selectedMotorbot?: any; // App.tsx'ten gelen seçili motorbot
}

// SQL stg_barinma_contract şemasına uygun form interface
interface KontratForm {
  TekneAdi: string;
  CariKod: string;
  CariAdi: string;
  TamBoy: number; // metre cinsinden
  TescilBoy: number; // metre cinsinden
  Periyot: 'YIL' | 'AY' | 'GUN';
  TarifeKod: string;
  TarifeAdi: string;
  Baslangic: string; // date
  Bitis: string; // date, nullable
  Fiyat: number;
  Para: string;
  Kdv: number; // KDV oranı (örn: 20 = %20)
  Notlar: string;
  Durum: 'AKTIF' | 'PASIF';
  Olusturan: string;
}

export function KontratGiris({ onNavigateHome, onNavigateBack, theme, onNavigateToMotorbotKartlari, selectedMotorbot }: KontratGirisProps) {
  const [showMotorbotSheet, setShowMotorbotSheet] = useState(false);
  const [showCariSheet, setShowCariSheet] = useState(false);
  const [openBoatCombobox, setOpenBoatCombobox] = useState(false);
  const [openCariCombobox, setOpenCariCombobox] = useState(false);
  const [openTarifeCombobox, setOpenTarifeCombobox] = useState(false);
  const [selectedBoatId, setSelectedBoatId] = useState<number | null>(null);
  const [selectedPriceListId, setSelectedPriceListId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<KontratForm>({
    TekneAdi: "",
    CariKod: "",
    CariAdi: "",
    TamBoy: 0,
    TescilBoy: 0,
    Periyot: "YIL",
    TarifeKod: "",
    TarifeAdi: "",
    Baslangic: new Date().toISOString().split('T')[0],
    Bitis: "",
    Fiyat: 0,
    Para: "TRY",
    Kdv: 20,
    Notlar: "",
    Durum: "AKTIF",
    Olusturan: "admin",
  });

  const handleInputChange = (field: keyof KontratForm, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleBoatSelect = (boatId: number | null) => {
    setSelectedBoatId(boatId);
    if (boatId) {
      const selectedBoat = motorbotMasterData.find(b => b.id === boatId);
      if (selectedBoat) {
        setFormData({
          ...formData,
          TekneAdi: selectedBoat.boat_name,
          CariKod: selectedBoat.customer_code,
          CariAdi: selectedBoat.customer_name,
          TamBoy: selectedBoat.length_cm / 100,
          TescilBoy: selectedBoat.reg_length_cm / 100,
        });
      }
    } else {
      setFormData({
        ...formData,
        TekneAdi: "",
        TamBoy: 0,
        TescilBoy: 0,
      });
    }
  };

  const handleCariSelect = (cariKod: string) => {
    if (cariKod) {
      const selectedCari = cariMasterData.find(c => c.Code === cariKod);
      if (selectedCari) {
        setFormData({
          ...formData,
          CariKod: selectedCari.Code,
          CariAdi: selectedCari.Name,
        });
      }
    } else {
      setFormData({
        ...formData,
        CariKod: "",
        CariAdi: "",
      });
    }
  };

  const handleTarifeSelect = (priceListId: number | null) => {
    setSelectedPriceListId(priceListId);
    if (priceListId) {
      const selectedPriceList = priceListMasterData.find(p => p.id === priceListId);
      if (selectedPriceList) {
        setFormData({
          ...formData,
          TarifeKod: selectedPriceList.code,
          TarifeAdi: selectedPriceList.name,
          Para: selectedPriceList.currency,
        });
      }
    } else {
      setFormData({
        ...formData,
        TarifeKod: "",
        TarifeAdi: "",
      });
    }
  };

  // Seçilen tarifeye ait hizmet kalemlerini getir
  const getSelectedPriceListItems = () => {
    if (!selectedPriceListId) return [];
    const items = priceListItemMasterData.filter(item => item.price_list_id === selectedPriceListId);
    return items.map(item => {
      const service = serviceCardMasterData.find(s => s.id === item.service_card_id);
      return {
        ...item,
        service_code: service?.code || "-",
        service_name: service?.name || "-",
        unit_name: service?.unit || "-",
        vat_code: service?.vat_code || "0",
      };
    });
  };

  const handleSave = () => {
    if (!formData.TekneAdi) {
      alert("Tekne adı zorunludur!");
      return;
    }
    if (!formData.CariKod) {
      alert("Cari seçimi zorunludur!");
      return;
    }
    if (formData.TamBoy <= 0) {
      alert("Tam boy girilmelidir!");
      return;
    }
    if (!formData.TarifeAdi) {
      alert("Tarife adı zorunludur!");
      return;
    }
    if (formData.Fiyat <= 0) {
      alert("Fiyat girilmelidir!");
      return;
    }

    console.log("Yeni Kontrat Kaydediliyor (SQL stg_barinma_contract):", formData);
    alert("Kontrat başarıyla kaydedildi!");
    
    setFormData({
      TekneAdi: "",
      CariKod: "",
      CariAdi: "",
      TamBoy: 0,
      TescilBoy: 0,
      Periyot: "YIL",
      TarifeKod: "",
      TarifeAdi: "",
      Baslangic: new Date().toISOString().split('T')[0],
      Bitis: "",
      Fiyat: 0,
      Para: "TRY",
      Kdv: 20,
      Notlar: "",
      Durum: "AKTIF",
      Olusturan: "admin",
    });
    setSelectedBoatId(null);
    setSelectedPriceListId(null);
  };

  const handleReset = () => {
    if (confirm("Tüm alanları temizlemek istediğinizden emin misiniz?")) {
      setFormData({
        TekneAdi: "",
        CariKod: "",
        CariAdi: "",
        TamBoy: 0,
        TescilBoy: 0,
        Periyot: "YIL",
        TarifeKod: "",
        TarifeAdi: "",
        Baslangic: new Date().toISOString().split('T')[0],
        Bitis: "",
        Fiyat: 0,
        Para: "TRY",
        Kdv: 20,
        Notlar: "",
        Durum: "AKTIF",
        Olusturan: "admin",
      });
      setSelectedBoatId(null);
      setSelectedPriceListId(null);
    }
  };

  const getPeriodLabel = (code: 'YIL' | 'AY' | 'GUN') => {
    switch (code) {
      case "GUN": return "Günlük";
      case "AY": return "Aylık";
      case "YIL": return "Yıllık";
    }
  };

  // OTOMATİK TARİFE SEÇİMİ: Periyot ve Tam Boy'a göre
  useEffect(() => {
    if (formData.TamBoy > 0 && formData.Periyot) {
      // Uygun tarifeyi bul (aktif, periyot eşleşmeli, boy aralığına girmeli)
      const matchingPriceList = priceListMasterData.find((priceList) => 
        priceList.is_active &&
        priceList.status === "AKTIF" &&
        priceList.period === formData.Periyot &&
        priceList.length_min !== undefined &&
        priceList.length_max !== undefined &&
        formData.TamBoy >= priceList.length_min &&
        formData.TamBoy <= priceList.length_max &&
        priceList.boat_type === "MOTORBOT" // Varsayılan olarak motorbot
      );

      if (matchingPriceList && matchingPriceList.id !== selectedPriceListId) {
        // Tarife kalemlerinden fiyat hesapla (metre başı * tam boy)
        const priceItems = priceListItemMasterData.filter(item => 
          item.price_list_id === matchingPriceList.id && item.is_active
        );
        
        let calculatedPrice = 0;
        let kdvRate = 20; // Varsayılan KDV
        
        if (priceItems.length > 0) {
          // Metre başı fiyat * Tam Boy
          const unitPrice = priceItems[0].unit_price;
          calculatedPrice = unitPrice * formData.TamBoy;
          
          // Hizmet kartından KDV oranını al
          const serviceCard = serviceCardMasterData.find(s => s.id === priceItems[0].service_card_id);
          if (serviceCard && serviceCard.vat_code) {
            kdvRate = Number(serviceCard.vat_code);
          }
        }

        // Otomatik tarife seç
        setSelectedPriceListId(matchingPriceList.id);
        setFormData((prev) => ({
          ...prev,
          TarifeKod: matchingPriceList.code,
          TarifeAdi: matchingPriceList.name,
          Para: matchingPriceList.currency,
          Fiyat: calculatedPrice,
          Kdv: kdvRate, // Otomatik KDV oranı!
        }));
        console.log("✓ Otomatik tarife seçildi:", matchingPriceList.name);
        console.log("✓ Otomatik fiyat hesaplandı:", calculatedPrice, matchingPriceList.currency);
        console.log("✓ Otomatik KDV oranı:", kdvRate + "%");
      }
    }
  }, [formData.TamBoy, formData.Periyot, selectedPriceListId]); // TamBoy, Periyot veya seçili tarife değiştiğinde tetiklenir

  // OTOMATİK BİTİŞ TARİHİ HESAPLAMA: Başlangıç + Periyot
  useEffect(() => {
    if (formData.Baslangic && formData.Periyot) {
      const startDate = new Date(formData.Baslangic);
      let endDate = new Date(startDate);
      
      switch (formData.Periyot) {
        case 'YIL':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
        case 'AY':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'GUN':
          endDate.setDate(endDate.getDate() + 1);
          break;
      }
      
      // Bitiş tarihini güncelle
      const endDateStr = endDate.toISOString().split('T')[0];
      if (formData.Bitis !== endDateStr) {
        setFormData((prev) => ({
          ...prev,
          Bitis: endDateStr,
        }));
        console.log("✓ Otomatik bitiş tarihi hesaplandı:", endDateStr);
      }
    }
  }, [formData.Baslangic, formData.Periyot, formData.Bitis]); // Başlangıç, Periyot veya Bitiş değiştiğinde tetiklenir

  // Motorbot seçimi yapıldığında formu doldur
  useEffect(() => {
    if (selectedMotorbot) {
      setFormData((prev) => ({
        ...prev,
        TekneAdi: selectedMotorbot.Name,
        CariKod: selectedMotorbot.OwnerCode,
        CariAdi: selectedMotorbot.Owner,
        TamBoy: selectedMotorbot.Length,
        TescilBoy: selectedMotorbot.RegisteredLength,
      }));
      console.log("✓ Motorbot seçildi ve form dolduruldu:", selectedMotorbot.Name);
    }
  }, [selectedMotorbot]);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl mb-1">Yeni Barınma Kontratı</h2>
            <p className={theme.colors.textMuted}>Yeni barınma sözleşmesi oluştur (SQL: stg_barinma_contract)</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
            >
              <X className="w-4 h-4 mr-2" />
              Temizle
            </Button>
            <Button
              className={`${theme.colors.primary} ${theme.colors.primaryHover} text-black`}
              onClick={handleSave}
            >
              <Save className="w-4 h-4 mr-2" />
              Kaydet
            </Button>
          </div>
        </div>

        {/* Form - 3 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Blok - Tekne & Cari Bilgileri */}
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <h3 className="flex items-center gap-2 mb-5">
              <Anchor className="w-5 h-5 text-blue-400" />
              Tekne & Cari Bilgileri
            </h3>
            <div className="space-y-4">
              {/* Searchable Tekne Dropdown */}
              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Tekne Seç *
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onNavigateToMotorbotKartlari && onNavigateToMotorbotKartlari()}
                    className="flex-1 justify-between bg-gray-800/50 border-gray-700 text-white hover:bg-gray-800/70"
                  >
                    <span className="truncate">
                      {formData.TekneAdi || "-- Tekne seç --"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onNavigateToMotorbotKartlari && onNavigateToMotorbotKartlari()}
                    className="bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Yeni Tekne
                  </Button>
                </div>
                {formData.TekneAdi && (
                  <div className="mt-2 p-3 bg-gray-800/30 rounded border border-gray-700">
                    <div className="text-sm text-white font-medium">{formData.TekneAdi}</div>
                    {formData.CariAdi && (
                      <div className="text-xs text-gray-400 mt-1">{formData.CariAdi} • Boy: {formData.TamBoy}m</div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-800 pt-4">
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Tekne Adı *
                </label>
                <Input
                  value={formData.TekneAdi}
                  onChange={(e) => handleInputChange('TekneAdi', e.target.value)}
                  placeholder="M/Y BLUE SEA"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  required
                />
              </div>

              {/* Searchable Cari Dropdown */}
              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Cari Seç *
                </label>
                <div className="flex gap-2">
                  <Popover open={openCariCombobox} onOpenChange={setOpenCariCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCariCombobox}
                        className="flex-1 justify-between bg-gray-800/50 border-gray-700 text-white hover:bg-gray-800/70"
                      >
                        <span className="truncate">
                          {formData.CariKod
                            ? `${formData.CariKod} - ${formData.CariAdi.substring(0, 30)}...`
                            : "-- Cari seçin --"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 bg-gray-900 border-gray-700">
                      <Command className="bg-gray-900">
                        <CommandInput placeholder="Cari ara..." className="text-white border-gray-700" />
                        <CommandList>
                          <CommandEmpty className="text-gray-400 p-4 text-sm">Cari bulunamadı.</CommandEmpty>
                          <CommandGroup>
                            {cariMasterData.map((cari) => (
                              <CommandItem
                                key={cari.Id}
                                value={`${cari.Code} ${cari.Name}`}
                                onSelect={() => {
                                  handleCariSelect(cari.Code);
                                  setOpenCariCombobox(false);
                                }}
                                className="text-white hover:bg-gray-800 cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.CariKod === cari.Code ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm">{cari.Code}</span>
                                  <span className="text-xs text-gray-400 truncate">{cari.Name.substring(0, 50)}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowCariSheet(true)}
                    className="bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 hover:border-green-500/50 transition-all whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Yeni Cari
                  </Button>
                </div>
                {formData.CariAdi && (
                  <div className="mt-2 p-2 bg-gray-800/30 rounded text-xs text-gray-400">
                    {formData.CariAdi}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                    Tam Boy (m) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.TamBoy || ''}
                    onChange={(e) => handleInputChange('TamBoy', Number(e.target.value))}
                    placeholder="12.50"
                    className="bg-gray-800/50 border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                    Tescil Boy (m)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.TescilBoy || ''}
                    onChange={(e) => handleInputChange('TescilBoy', Number(e.target.value))}
                    placeholder="11.80"
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Periyot *
                </label>
                <select
                  value={formData.Periyot}
                  onChange={(e) => handleInputChange('Periyot', e.target.value as 'YIL' | 'AY' | 'GUN')}
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5"
                >
                  <option value="GUN">Günlük</option>
                  <option value="AY">Aylık</option>
                  <option value="YIL">Yıllık</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orta Blok - Sözleşme & Tarife */}
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <h3 className="flex items-center gap-2 mb-5">
              <FileText className="w-5 h-5 text-green-400" />
              Sözleşme & Tarife
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                    Başlangıç Tarihi *
                  </label>
                  <Input
                    type="date"
                    value={formData.Baslangic}
                    onChange={(e) => handleInputChange('Baslangic', e.target.value)}
                    className="bg-gray-800/50 border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                    Bitiş Tarihi
                  </label>
                  <Input
                    type="date"
                    value={formData.Bitis}
                    onChange={(e) => handleInputChange('Bitis', e.target.value)}
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Tarife Seç (Opsiyonel - Hızlı Doldurum)
                </label>
                <Popover open={openTarifeCombobox} onOpenChange={setOpenTarifeCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openTarifeCombobox}
                      className="w-full justify-between bg-gray-800/50 border-gray-700 text-white hover:bg-gray-800/70"
                    >
                      <span className="truncate">
                        {selectedPriceListId
                          ? priceListMasterData.find((p) => p.id === selectedPriceListId)?.name
                          : "-- Tarife seçin (opsiyonel) --"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[450px] p-0 bg-gray-900 border-gray-700">
                    <Command className="bg-gray-900">
                      <CommandInput placeholder="Tarife ara..." className="text-white border-gray-700" />
                      <CommandList>
                        <CommandEmpty className="text-gray-400 p-4 text-sm">Tarife bulunamadı.</CommandEmpty>
                        <CommandGroup>
                          {priceListMasterData
                            .filter((p) => p.is_active)
                            .map((priceList) => (
                              <CommandItem
                                key={priceList.id}
                                value={`${priceList.code} ${priceList.name}`}
                                onSelect={() => {
                                  handleTarifeSelect(priceList.id);
                                  setOpenTarifeCombobox(false);
                                }}
                                className="text-white hover:bg-gray-800 cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedPriceListId === priceList.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col flex-1">
                                  <span className="text-sm">{priceList.name}</span>
                                  <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span>{priceList.code}</span>
                                    <Badge variant="outline" className="text-xs border-gray-600">
                                      {priceList.currency}
                                    </Badge>
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        priceList.status === "AKTIF"
                                          ? "text-xs border-green-500/30 text-green-400"
                                          : "text-xs border-gray-600"
                                      }
                                    >
                                      {priceList.status}
                                    </Badge>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedPriceListId && (
                  <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
                    ✓ Tarife seçildi (Tarife Kodu ve Para Birimi otomatik dolduruldu)
                  </div>
                )}
              </div>

              <div className="border-t border-gray-800 pt-4">
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Tarife Kodu
                </label>
                <Input
                  value={formData.TarifeKod}
                  onChange={(e) => handleInputChange('TarifeKod', e.target.value)}
                  placeholder="2025-MB-YIL"
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>

              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Tarife Adı *
                </label>
                <Input
                  value={formData.TarifeAdi}
                  onChange={(e) => handleInputChange('TarifeAdi', e.target.value)}
                  placeholder="2025 MOTORBOT YILLIK"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  required
                />
              </div>

              <div className="border-t border-gray-800 pt-4">
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Fiyat *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.Fiyat || ''}
                  onChange={(e) => handleInputChange('Fiyat', Number(e.target.value))}
                  placeholder="45000"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                    Para Birimi *
                  </label>
                  <select
                    value={formData.Para}
                    onChange={(e) => handleInputChange('Para', e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                    KDV (%)
                  </label>
                  <Input
                    type="number"
                    value={formData.Kdv}
                    onChange={(e) => handleInputChange('Kdv', Number(e.target.value))}
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Durum
                </label>
                <select
                  value={formData.Durum}
                  onChange={(e) => handleInputChange('Durum', e.target.value as 'AKTIF' | 'PASIF')}
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5"
                >
                  <option value="AKTIF">AKTİF</option>
                  <option value="PASIF">PASİF</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sağ Blok - Notlar & Özet */}
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <h3 className="flex items-center gap-2 mb-5">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              Notlar & Özet
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Notlar
                </label>
                <Textarea
                  value={formData.Notlar}
                  onChange={(e) => handleInputChange('Notlar', e.target.value)}
                  placeholder="Sözleşme ile ilgili özel notlar, ödeme koşulları vb."
                  className="bg-gray-800/50 border-gray-700 text-white text-sm min-h-[200px]"
                />
              </div>

              {/* Preview */}
              <div className="border-t border-gray-800 pt-4">
                <label className={`text-xs ${theme.colors.textMuted} mb-3 block`}>
                  Özet Bilgi
                </label>
                <div className="space-y-2 p-3 bg-gray-800/30 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tekne:</span>
                    <span className="text-blue-400 truncate ml-2">
                      {formData.TekneAdi || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cari:</span>
                    <span className="truncate ml-2">
                      {formData.CariKod || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Boy:</span>
                    <span>
                      {formData.TamBoy > 0 ? `${formData.TamBoy.toFixed(2)} m` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Periyot:</span>
                    <Badge variant="outline" className="border-gray-600">
                      {getPeriodLabel(formData.Periyot)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fiyat:</span>
                    <span className="text-green-400">
                      {formData.Fiyat > 0 ? new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: formData.Para,
                      }).format(formData.Fiyat) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">KDV:</span>
                    <span>%{formData.Kdv}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Durum:</span>
                    <Badge 
                      variant={formData.Durum === 'AKTIF' ? "default" : "secondary"} 
                      className={formData.Durum === 'AKTIF' ? theme.colors.primary + " text-black" : "bg-gray-700"}
                    >
                      {formData.Durum}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 p-3 bg-blue-950/20 border border-blue-800/30 rounded-lg">
                <p className="mb-1">✓ SQL Tablo: <code className="text-blue-400">stg_barinma_contract</code></p>
                <p>✓ Tüm alanlar şemaya uygun</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className={`mt-6 p-4 ${theme.colors.bgCard} border ${theme.colors.border} rounded-lg`}>
          <p className="text-sm text-gray-500">
            <span className="text-red-400">*</span> ile işaretli alanlar zorunludur.
          </p>
        </div>
      </div>

      {/* Motorbot Sheet */}
      <Sheet open={showMotorbotSheet} onOpenChange={setShowMotorbotSheet}>
        <SheetContent side="right" className="w-[600px] sm:max-w-[600px] bg-gray-900 border-gray-700 overflow-y-auto">
          <SheetHeader className="border-b border-gray-700/50 pb-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <Anchor className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <SheetTitle className="text-white text-xl">Yeni Tekne Oluştur</SheetTitle>
                <SheetDescription className="text-gray-400">
                  Hızlı tekne kartı tanımlama formu
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="mt-6">
            <MotorbotFormQuick
              theme={theme}
              onSave={(motorbot) => {
                console.log("Yeni motorbot:", motorbot);
                setShowMotorbotSheet(false);
                setFormData({
                  ...formData,
                  TekneAdi: motorbot.name,
                  TamBoy: motorbot.length,
                  TescilBoy: motorbot.length * 0.95,
                });
              }}
              onCancel={() => setShowMotorbotSheet(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Cari Sheet */}
      <Sheet open={showCariSheet} onOpenChange={setShowCariSheet}>
        <SheetContent side="right" className="w-[600px] sm:max-w-[600px] bg-gray-900 border-gray-700 overflow-y-auto">
          <SheetHeader className="border-b border-gray-700/50 pb-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <Building2 className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <SheetTitle className="text-white text-xl">Yeni Cari Oluştur</SheetTitle>
                <SheetDescription className="text-gray-400">
                  Hızlı cari kartı tanımlama formu
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="mt-6">
            <CariFormQuick
              theme={theme}
              onSave={(cari) => {
                console.log("Yeni cari:", cari);
                setShowCariSheet(false);
                setFormData({
                  ...formData,
                  CariKod: cari.vergiNo,
                  CariAdi: cari.unvan,
                });
              }}
              onCancel={() => setShowCariSheet(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}