import { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Anchor, 
  Calendar, 
  Save, 
  Building2, 
  AlertCircle, 
  Bell, 
  Clock, 
  ShieldAlert, 
  FileText,
  RefreshCw,
  Receipt
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Theme } from "./ThemeSelector";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { motorbotMasterData } from "../data/motorbotData";
import { cariMasterData } from "../data/cariData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { MotorbotFormQuick } from "./MotorbotFormQuick";
import { CariFormQuick } from "./CariFormQuick";
import { KontratYenileme } from "./KontratYenileme";
import { AuditLogViewer } from "./AuditLogViewer";
import { RecordMetadataCard } from "./RecordMetadataCard";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface BarinmaSozlesmeleriProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
  onNavigateToMotorbotKartlari?: () => void;
  onNavigateToCariKartlari?: () => void;
  onNavigateToKontratGiris?: () => void;
  onNavigateToEFatura?: (contractData: any) => void;
}

// SQL stg_barinma_contract şemasına uygun interface
interface BarinmaKontrat {
  Id: number;
  TekneAdi: string;
  CariKod: string;
  CariAdi: string;
  TamBoy: number; // decimal - metre
  TescilBoy: number; // decimal - metre
  Periyot: 'YIL' | 'AY' | 'GUN';
  TarifeKod: string;
  TarifeAdi: string;
  Baslangic: string; // date
  Bitis: string | null; // date, nullable
  Fiyat: number;
  Para: string;
  Kdv: number;
  Notlar: string;
  Durum: 'AKTIF' | 'PASIF';
  Olusturan: string;
  OlusturmaTarihi: string; // datetime2
  has_invoice?: boolean; // UI için ek kontrol
}

const mockKontratData: BarinmaKontrat[] = [
  {
    Id: 1,
    TekneAdi: "M/Y BLUE SEA",
    CariKod: "01.001",
    CariAdi: "A-TIM TEKNIK GEMI TAMIR DONATIM VE ULUSLARARASI KUMANYACILIK PAZARLAMA GIDA SANAYİ TİCARET ANONIM ŞİRKETİ",
    TamBoy: 12.50,
    TescilBoy: 11.80,
    Periyot: "YIL",
    TarifeKod: "2025-MB-YIL",
    TarifeAdi: "2025 MOTORBOT YILLIK",
    Baslangic: "2025-01-01",
    Bitis: "2025-12-31",
    Fiyat: 45000,
    Para: "TRY",
    Kdv: 20,
    Notlar: "Yıllık sözleşme, ödemeler aylık taksitlerle yapılacak.",
    Durum: "AKTIF",
    Olusturan: "ali",
    OlusturmaTarihi: "2024-11-16T10:24:00",
    has_invoice: false,
  },
  {
    Id: 2,
    TekneAdi: "M/Y ATLANTIS",
    CariKod: "01.002",
    CariAdi: "A.RIZA KINAY VAPUR ACENTELIGI VE TİCARET ANONIM ŞİRKETİ",
    TamBoy: 15.00,
    TescilBoy: 14.50,
    Periyot: "AY",
    TarifeKod: "2025-MB-AY",
    TarifeAdi: "2025 MOTORBOT AYLIK",
    Baslangic: "2024-11-01",
    Bitis: "2025-01-23",
    Fiyat: 8500,
    Para: "TRY",
    Kdv: 20,
    Notlar: "3 aylık sözleşme, aylık ödeme. YENİLENMELİ!",
    Durum: "AKTIF",
    Olusturan: "mehmet",
    OlusturmaTarihi: "2024-12-20T14:15:00",
    has_invoice: true,
  },
  {
    Id: 3,
    TekneAdi: "M/Y DOLPHIN",
    CariKod: "01.157",
    CariAdi: "MURAT TURUNÇEL",
    TamBoy: 9.80,
    TescilBoy: 9.50,
    Periyot: "GUN",
    TarifeKod: "2024-MB-GUN",
    TarifeAdi: "2024 MOTORBOT GÜNLÜK",
    Baslangic: "2024-06-15",
    Bitis: "2024-12-31",
    Fiyat: 350,
    Para: "TRY",
    Kdv: 20,
    Notlar: "Sezon sonu sözleşme, şu anda aktif değil.",
    Durum: "PASIF",
    Olusturan: "ayse",
    OlusturmaTarihi: "2024-06-10T09:30:00",
    has_invoice: false,
  },
  {
    Id: 4,
    TekneAdi: "M/Y OCEAN STAR",
    CariKod: "01.003",
    CariAdi: "ADAMAR DIS TİCARET VE DENIZCILIK HIZMETLERI SANAYİ TİCARET ANONIM ŞİRKETİ",
    TamBoy: 18.00,
    TescilBoy: 17.50,
    Periyot: "YIL",
    TarifeKod: "2025-MB-PREMIUM",
    TarifeAdi: "2025 MOTORBOT YILLIK PREMIUM",
    Baslangic: "2025-01-01",
    Bitis: null,
    Fiyat: 85000,
    Para: "TRY",
    Kdv: 20,
    Notlar: "VIP barınma hizmeti, açık uçlu sözleşme.",
    Durum: "AKTIF",
    Olusturan: "ali",
    OlusturmaTarihi: "2024-12-01T11:00:00",
    has_invoice: false,
  },
  {
    Id: 5,
    TekneAdi: "M/Y CEYLAN",
    CariKod: "01.157",
    CariAdi: "MURAT TURUNÇEL",
    TamBoy: 14.70,
    TescilBoy: 12.52,
    Periyot: "YIL",
    TarifeKod: "2024-MB-YIL",
    TarifeAdi: "2024 MOTORBOT YILLIK",
    Baslangic: "2024-01-15",
    Bitis: "2025-02-10",
    Fiyat: 42000,
    Para: "TRY",
    Kdv: 20,
    Notlar: "Yıllık sözleşme, yakında yenilenecek.",
    Durum: "AKTIF",
    Olusturan: "mehmet",
    OlusturmaTarihi: "2024-01-10T09:00:00",
    has_invoice: false,
  },
  {
    Id: 6,
    TekneAdi: "M/Y DEEP DIVING",
    CariKod: "01.100",
    CariAdi: "NIHAL AKILLI",
    TamBoy: 23.90,
    TescilBoy: 22.67,
    Periyot: "YIL",
    TarifeKod: "2024-MB-PREMIUM",
    TarifeAdi: "2024 MOTORBOT YILLIK PREMIUM",
    Baslangic: "2024-03-10",
    Bitis: "2025-03-09",
    Fiyat: 95000,
    Para: "TRY",
    Kdv: 20,
    Notlar: "Premium hizmet ile yıllık sözleşme.",
    Durum: "AKTIF",
    Olusturan: "ayse",
    OlusturmaTarihi: "2024-03-01T11:30:00",
    has_invoice: false,
  },
  {
    Id: 7,
    TekneAdi: "M/Y EGE 35",
    CariKod: "01.004",
    CariAdi: "ADEN ENDÜSTRIYEL IMALAT MONTAJ SANAYİ VE TİCARET ANONIM ŞİRKETİ",
    TamBoy: 9.95,
    TescilBoy: 8.88,
    Periyot: "YIL",
    TarifeKod: "2024-MB-YIL",
    TarifeAdi: "2024 MOTORBOT YILLIK",
    Baslangic: "2024-02-01",
    Bitis: "2025-01-31",
    Fiyat: 38000,
    Para: "TRY",
    Kdv: 20,
    Notlar: "Yıllık sözleşme. YENİLENMELİ - 13 GÜN KALDI!",
    Durum: "AKTIF",
    Olusturan: "mehmet",
    OlusturmaTarihi: "2024-01-25T14:00:00",
    has_invoice: true,
  },
];

export function BarinmaSozlesmeleri({ onNavigateHome, onNavigateBack, theme, onNavigateToMotorbotKartlari, onNavigateToCariKartlari, onNavigateToKontratGiris, onNavigateToEFatura }: BarinmaSozlesmeleriProps) {
  console.log("✓ BarinmaSozlesmeleri loaded"); // Lightweight log
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKontrat, setSelectedKontrat] = useState<BarinmaKontrat | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [isNewKontrat, setIsNewKontrat] = useState(false);
  
  // Arama için state'ler
  const [tekneSearchTerm, setTekneSearchTerm] = useState("");
  const [cariSearchTerm, setCariSearchTerm] = useState("");
  const [showTekneDropdown, setShowTekneDropdown] = useState(false);
  const [showCariDropdown, setShowCariDropdown] = useState(false);

  // Sheet states
  const [showMotorbotSheet, setShowMotorbotSheet] = useState(false);
  const [showCariSheet, setShowCariSheet] = useState(false);

  // Kontrat yenileme states
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [selectedKontratForRenewal, setSelectedKontratForRenewal] = useState<BarinmaKontrat | null>(null);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Tekne dropdown dışına tıklandıysa kapat
      if (showTekneDropdown && !target.closest('.tekne-dropdown-container')) {
        setShowTekneDropdown(false);
      }
      // Cari dropdown dışına tıklandıysa kapat
      if (showCariDropdown && !target.closest('.cari-dropdown-container')) {
        setShowCariDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTekneDropdown, showCariDropdown]);

  const emptyForm: BarinmaKontrat = {
    Id: 0,
    TekneAdi: "",
    CariKod: "",
    CariAdi: "",
    TamBoy: 0,
    TescilBoy: 0,
    Periyot: "YIL",
    TarifeKod: "",
    TarifeAdi: "",
    Baslangic: new Date().toISOString().split('T')[0],
    Bitis: null,
    Fiyat: 0,
    Para: "TRY",
    Kdv: 20,
    Notlar: "",
    Durum: "AKTIF",
    Olusturan: "admin",
    OlusturmaTarihi: new Date().toISOString(),
    has_invoice: false,
  };

  const filteredKontrat = mockKontratData.filter(
    (kontrat) =>
      kontrat.TekneAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kontrat.CariAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kontrat.CariKod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetail = (kontrat: BarinmaKontrat) => {
    setSelectedKontrat(kontrat);
    setShowDetail(true);
    setIsEditing(false);
  };

  const handleEdit = (kontrat: BarinmaKontrat) => {
    setSelectedKontrat(kontrat);
    setShowDetail(true);
    setIsEditing(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedKontrat(null);
    setIsEditing(false);
    setIsNewKontrat(false);
  };

  const handleInputChange = (field: keyof BarinmaKontrat, value: any) => {
    if (selectedKontrat) {
      setSelectedKontrat({ ...selectedKontrat, [field]: value });
    }
  };

  const handleBoatSelect = (boatId: string) => {
    if (selectedKontrat && boatId) {
      const selectedBoat = motorbotMasterData.find(b => b.id === Number(boatId));
      if (selectedBoat) {
        setSelectedKontrat({
          ...selectedKontrat,
          TekneAdi: selectedBoat.boat_name,
          CariKod: selectedBoat.customer_code,
          CariAdi: selectedBoat.customer_name,
          TamBoy: selectedBoat.length_cm / 100,
          TescilBoy: selectedBoat.reg_length_cm / 100,
        });
      }
    }
  };

  const handleCariSelect = (cariKod: string) => {
    if (selectedKontrat && cariKod) {
      const selectedCari = cariMasterData.find(c => c.Code === cariKod);
      if (selectedCari) {
        setSelectedKontrat({
          ...selectedKontrat,
          CariKod: selectedCari.Code,
          CariAdi: selectedCari.Name,
        });
      }
    }
  };

  const handleSave = () => {
    console.log("Kaydediliyor:", selectedKontrat);
    setIsEditing(false);
    setIsNewKontrat(false);
    setShowDetail(false);
  };

  // Kontrat yenileme handler
  const handleRenewal = (renewalData: any) => {
    console.log("Yeni kontrat oluşturuldu:", renewalData);
    // TODO: Backend'e gönder ve mockKontratData'ya ekle
    // Eski kontratı "YENİLENDİ" olarak işaretle
    
    setShowRenewalDialog(false);
    setSelectedKontratForRenewal(null);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getPeriodLabel = (code: 'YIL' | 'AY' | 'GUN') => {
    switch (code) {
      case "GUN": return "Günlük";
      case "AY": return "Aylık";
      case "YIL": return "Yıllık";
    }
  };

  // Check if contract is active based on Durum field
  const isContractActive = (kontrat: BarinmaKontrat): boolean => {
    return kontrat.Durum === 'AKTIF';
  };

  // Filter contracts by active status
  const activeContracts = filteredKontrat.filter(k => isContractActive(k));
  const passiveContracts = filteredKontrat.filter(k => !isContractActive(k));

  // Check if contract can be deleted
  const canDelete = (kontrat: BarinmaKontrat): boolean => {
    return !kontrat.has_invoice;
  };

  const handleDelete = (kontrat: BarinmaKontrat) => {
    if (!canDelete(kontrat)) {
      alert("Bu sözleşme silinemiyor! Faturası kesilmiş sözleşmeler silinemez.");
      return;
    }
    
    if (confirm(`"${kontrat.TekneAdi}" sözleşmesini silmek istediğinizden emin misiniz?`)) {
      console.log("Siliniyor:", kontrat);
    }
  };

  // Renewal reminder calculations
  const getRenewalStatus = (kontrat: BarinmaKontrat): { level: 'critical' | 'warning' | 'info' | null; daysLeft: number } => {
    if (!kontrat.Bitis) return { level: null, daysLeft: Infinity };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(kontrat.Bitis);
    endDate.setHours(0, 0, 0, 0);
    
    const diffTime = endDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { level: null, daysLeft: 0 };
    if (daysLeft <= 7) return { level: 'critical', daysLeft };
    if (daysLeft <= 30) return { level: 'warning', daysLeft };
    if (daysLeft <= 60) return { level: 'info', daysLeft };
    
    return { level: null, daysLeft };
  };

  // Get contracts that need renewal reminder
  const renewalReminders = activeContracts
    .map(k => ({ kontrat: k, status: getRenewalStatus(k) }))
    .filter(r => r.status.level !== null)
    .sort((a, b) => a.status.daysLeft - b.status.daysLeft);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl mb-1">Barınma Kontratları</h2>
            <p className={theme.colors.textMuted}>Tüm barınma kontratlarını görüntüle ve yönet (SQL: stg_barinma_contract)</p>
          </div>
          <Button
            className={`${theme.colors.primary} ${theme.colors.primaryHover} text-black`}
            onClick={() => {
              if (onNavigateToKontratGiris) {
                onNavigateToKontratGiris();
              }
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Sözleşme
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Sözleşme ara... (Tekne Adı, Cari Ünvan, Cari Kod)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 text-white"
            />
          </div>
        </div>

        {/* Renewal Reminders */}
        {renewalReminders.length > 0 && (
          <div className="mb-6">
            <Alert className="border-orange-600/50 bg-orange-950/20">
              <Bell className="h-5 w-5 text-orange-400" />
              <AlertDescription>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-orange-100 mb-3">
                      <strong>{renewalReminders.length}</strong> sözleşme yenilenme tarihine yaklaşıyor
                    </p>
                    <div className="space-y-2">
                      {renewalReminders.slice(0, 3).map(({ kontrat, status }) => (
                        <div
                          key={kontrat.Id}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-800/50 ${
                            status.level === 'critical' ? 'bg-red-950/30 border border-red-800/50' :
                            status.level === 'warning' ? 'bg-orange-950/30 border border-orange-800/50' :
                            'bg-yellow-950/30 border border-yellow-800/50'
                          }`}
                          onClick={() => handleViewDetail(kontrat)}
                        >
                          <div className="flex items-center gap-3">
                            <Clock className={`w-4 h-4 ${
                              status.level === 'critical' ? 'text-red-400' :
                              status.level === 'warning' ? 'text-orange-400' :
                              'text-yellow-400'
                            }`} />
                            <div>
                              <p className="text-sm">{kontrat.TekneAdi}</p>
                              <p className="text-xs text-gray-400">{kontrat.CariAdi.substring(0, 40)}...</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className={`${
                              status.level === 'critical' ? 'border-red-600 text-red-400' :
                              status.level === 'warning' ? 'border-orange-600 text-orange-400' :
                              'border-yellow-600 text-yellow-400'
                            }`}>
                              {status.daysLeft} gün kaldı
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {kontrat.Bitis ? new Date(kontrat.Bitis).toLocaleDateString('tr-TR') : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {renewalReminders.length > 3 && (
                      <p className="text-xs text-gray-400 mt-3">
                        +{renewalReminders.length - 3} sözleşme daha...
                      </p>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Tabs - Aktif / Pasif */}
        <Tabs defaultValue="aktif" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="aktif" className="data-[state=active]:bg-green-600">
              Aktif Sözleşmeler ({activeContracts.length})
            </TabsTrigger>
            <TabsTrigger value="pasif" className="data-[state=active]:bg-gray-600">
              Pasif Sözleşmeler ({passiveContracts.length})
            </TabsTrigger>
          </TabsList>

          {/* Aktif Sözleşmeler Tab */}
          <TabsContent value="aktif">
            {activeContracts.length === 0 ? (
              <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-12 text-center`}>
                <p className={theme.colors.textMuted}>Aktif sözleşme bulunamadı</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeContracts.map((kontrat) => (
                  <div
                    key={kontrat.Id}
                    className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-5 hover:border-gray-600 transition-all cursor-pointer`}
                    onClick={() => handleViewDetail(kontrat)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Anchor className={`w-4 h-4 ${theme.colors.primaryText}`} />
                          <h3 className="line-clamp-1">{kontrat.TekneAdi}</h3>
                        </div>
                        <p className={`text-xs ${theme.colors.textMuted} line-clamp-1`}>
                          {kontrat.CariAdi}
                        </p>
                        <p className={`text-xs ${theme.colors.textMuted}`}>
                          ({kontrat.CariKod})
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge variant="default" className={theme.colors.primary + " text-black"}>
                          AKTİF
                        </Badge>
                        {kontrat.has_invoice && (
                          <Badge variant="outline" className="border-blue-600 text-blue-400 text-xs">
                            <ShieldAlert className="w-3 h-3 mr-1" />
                            FATURA
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className={theme.colors.textMuted}>Tam Boy:</span>
                        <span>{kontrat.TamBoy.toFixed(2)} m</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={theme.colors.textMuted}>Periyot:</span>
                        <span>{getPeriodLabel(kontrat.Periyot)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={theme.colors.textMuted}>Fiyat:</span>
                        <span className="text-green-400">{formatCurrency(kontrat.Fiyat, kontrat.Para)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <span className={theme.colors.textMuted}>
                          {new Date(kontrat.Baslangic).toLocaleDateString('tr-TR')} - {kontrat.Bitis ? new Date(kontrat.Bitis).toLocaleDateString('tr-TR') : 'Devam ediyor'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-gray-800">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-blue-700 text-blue-400 hover:bg-blue-900/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedKontratForRenewal(kontrat);
                          setShowRenewalDialog(true);
                        }}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Yenile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-green-700 text-green-400 hover:bg-green-900/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigateToEFatura) {
                            onNavigateToEFatura({
                              kontratId: kontrat.Id,
                              kontratNo: `BR-2024-${kontrat.Id.toString().padStart(3, '0')}`,
                              cariKod: kontrat.CariKod,
                              cariAdi: kontrat.CariAdi,
                              tekneAdi: kontrat.TekneAdi,
                              tamBoy: kontrat.TamBoy,
                              periyot: kontrat.Periyot,
                              fiyat: kontrat.Fiyat,
                              tutar: kontrat.Fiyat,
                              para: kontrat.Para,
                              kdv: kontrat.Kdv,
                              tarifeKod: kontrat.TarifeKod,
                              tarifeAdi: kontrat.TarifeAdi,
                            });
                          }
                        }}
                      >
                        <Receipt className="w-3 h-3 mr-1" />
                        Faturalandır
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(kontrat);
                        }}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Düzenle
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!canDelete(kontrat)}
                        className={`bg-transparent ${canDelete(kontrat) ? 'border-red-900/50 text-red-400 hover:bg-red-900/20' : 'border-gray-700 text-gray-600 cursor-not-allowed'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(kontrat);
                        }}
                        title={kontrat.has_invoice ? "Faturası kesilmiş sözleşme silinemez" : "Sözleşmeyi sil"}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pasif Sözleşmeler Tab */}
          <TabsContent value="pasif">
            {passiveContracts.length === 0 ? (
              <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-12 text-center`}>
                <p className={theme.colors.textMuted}>Pasif sözleşme bulunamadı</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {passiveContracts.map((kontrat) => (
                  <div
                    key={kontrat.Id}
                    className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-5 hover:border-gray-600 transition-all cursor-pointer opacity-75`}
                    onClick={() => handleViewDetail(kontrat)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Anchor className={`w-4 h-4 ${theme.colors.textMuted}`} />
                          <h3 className="line-clamp-1">{kontrat.TekneAdi}</h3>
                        </div>
                        <p className={`text-xs ${theme.colors.textMuted} line-clamp-1`}>
                          {kontrat.CariAdi}
                        </p>
                        <p className={`text-xs ${theme.colors.textMuted}`}>
                          ({kontrat.CariKod})
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                        PASİF
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className={theme.colors.textMuted}>Tam Boy:</span>
                        <span>{kontrat.TamBoy.toFixed(2)} m</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={theme.colors.textMuted}>Periyot:</span>
                        <span>{getPeriodLabel(kontrat.Periyot)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={theme.colors.textMuted}>Fiyat:</span>
                        <span className="text-green-400">{formatCurrency(kontrat.Fiyat, kontrat.Para)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <span className={theme.colors.textMuted}>
                          {new Date(kontrat.Baslangic).toLocaleDateString('tr-TR')} - {kontrat.Bitis ? new Date(kontrat.Bitis).toLocaleDateString('tr-TR') : 'Devam ediyor'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-800">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(kontrat);
                        }}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Düzenle
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!canDelete(kontrat)}
                        className={`bg-transparent ${canDelete(kontrat) ? 'border-red-900/50 text-red-400 hover:bg-red-900/20' : 'border-gray-700 text-gray-600 cursor-not-allowed'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(kontrat);
                        }}
                        title={kontrat.has_invoice ? "Faturası kesilmiş sözleşme silinemez" : "Sözleşmeyi sil"}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Detail Modal - WITH AUDIT SYSTEM */}
        {showDetail && selectedKontrat && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
            <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col`}>
              {/* Modal Header */}
              <div className={`${theme.colors.bgCard} border-b ${theme.colors.border} px-6 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <Anchor className={`w-6 h-6 ${theme.colors.primaryText}`} />
                  <div>
                    <h2 className="text-xl">{selectedKontrat.TekneAdi}</h2>
                    <p className={`text-sm ${theme.colors.textMuted}`}>Sözleşme No: #{selectedKontrat.Id.toString().padStart(6, '0')}</p>
                  </div>
                  <Badge variant={selectedKontrat.Durum === 'AKTIF' ? "default" : "secondary"} className={selectedKontrat.Durum === 'AKTIF' ? theme.colors.primary + " text-black" : "bg-gray-700"}>
                    {selectedKontrat.Durum}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {!isEditing && !isNewKontrat && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        className="bg-transparent border-gray-700 text-white"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Düzenle
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (canDelete(selectedKontrat)) {
                            handleDelete(selectedKontrat);
                          }
                        }}
                        disabled={!canDelete(selectedKontrat)}
                        className={`bg-transparent ${canDelete(selectedKontrat) ? 'border-red-900/50 text-red-400 hover:bg-red-900/20' : 'border-gray-700 text-gray-600 cursor-not-allowed'}`}
                        title={selectedKontrat.has_invoice ? "Faturası kesilmiş sözleşme silinemez" : "Sözleşmeyi sil"}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Sil
                      </Button>
                    </>
                  )}
                  {(isEditing || isNewKontrat) && (
                    <Button
                      size="sm"
                      className={`${theme.colors.primary} ${theme.colors.primaryHover} text-black`}
                      onClick={handleSave}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Kaydet
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCloseDetail}
                    className="bg-transparent border-gray-700 text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="w-full justify-start rounded-none border-b border-gray-800 bg-transparent px-6">
                  <TabsTrigger value="details" className="data-[state=active]:bg-gray-800">
                    📋 Detaylar
                  </TabsTrigger>
                  <TabsTrigger value="metadata" className="data-[state=active]:bg-gray-800">
                    👤 Kayıt Bilgileri
                  </TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-gray-800">
                    📜 Değişiklik Geçmişi
                  </TabsTrigger>
                </TabsList>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="details" className="p-6 m-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Sol Blok - Tekne & Cari */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 mb-4">
                      <Anchor className="w-5 h-5 text-blue-400" />
                      Tekne & Cari Bilgileri
                    </h3>

                    {isEditing && (
                      <div className="mb-4 relative tekne-dropdown-container">
                        <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                          Kayıtlı Tekne Seç
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <Input
                            type="text"
                            placeholder="Tekne ara..."
                            value={tekneSearchTerm}
                            onChange={(e) => {
                              setTekneSearchTerm(e.target.value);
                              setShowTekneDropdown(true);
                            }}
                            onFocus={() => setShowTekneDropdown(true)}
                            className="pl-10 bg-gray-800/50 border-gray-700 text-white"
                          />
                        </div>
                        
                        {showTekneDropdown && (
                          <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-auto">
                            {/* Yeni Tekne Oluştur Butonu */}
                            <div
                              className="px-4 py-3 hover:bg-blue-900/30 cursor-pointer border-b border-gray-700 flex items-center gap-2 text-blue-400"
                              onClick={() => {
                                setShowTekneDropdown(false);
                                setShowMotorbotSheet(true);
                              }}
                            >
                              <Plus className="w-4 h-4" />
                              <span>Yeni Tekne Oluştur</span>
                            </div>
                            
                            {/* Tekneler Listesi */}
                            {motorbotMasterData
                              .filter(boat => 
                                boat.boat_name.toLowerCase().includes(tekneSearchTerm.toLowerCase())
                              )
                              .slice(0, 10)
                              .map((boat) => (
                                <div
                                  key={boat.id}
                                  className="px-4 py-2.5 hover:bg-gray-800 cursor-pointer text-sm"
                                  onClick={() => {
                                    handleBoatSelect(boat.id.toString());
                                    setTekneSearchTerm(boat.boat_name);
                                    setShowTekneDropdown(false);
                                  }}
                                >
                                  <p className="text-white">{boat.boat_name}</p>
                                  <p className="text-xs text-gray-500">{boat.customer_code} - {boat.customer_name.substring(0, 30)}...</p>
                                </div>
                              ))}
                            
                            {motorbotMasterData.filter(boat => 
                              boat.boat_name.toLowerCase().includes(tekneSearchTerm.toLowerCase())
                            ).length === 0 && (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                Tekne bulunamadı
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Tekne Adı</label>
                      {isEditing ? (
                        <Input
                          value={selectedKontrat.TekneAdi}
                          onChange={(e) => handleInputChange('TekneAdi', e.target.value)}
                          className="bg-gray-800/50 border-gray-700 text-white"
                        />
                      ) : (
                        <p>{selectedKontrat.TekneAdi}</p>
                      )}
                    </div>

                    {isEditing && (
                      <div className="relative cari-dropdown-container">
                        <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                          Cari Seç
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <Input
                            type="text"
                            placeholder="Cari ara (Kod veya Ad)..."
                            value={cariSearchTerm}
                            onChange={(e) => {
                              setCariSearchTerm(e.target.value);
                              setShowCariDropdown(true);
                            }}
                            onFocus={() => setShowCariDropdown(true)}
                            className="pl-10 bg-gray-800/50 border-gray-700 text-white"
                          />
                        </div>
                        
                        {showCariDropdown && (
                          <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-auto">
                            {/* Yeni Cari Oluştur Butonu */}
                            <div
                              className="px-4 py-3 hover:bg-blue-900/30 cursor-pointer border-b border-gray-700 flex items-center gap-2 text-blue-400"
                              onClick={() => {
                                setShowCariDropdown(false);
                                setShowCariSheet(true);
                              }}
                            >
                              <Plus className="w-4 h-4" />
                              <span>Yeni Cari Oluştur</span>
                            </div>
                            
                            {/* Cariler Listesi */}
                            {cariMasterData
                              .filter(cari => 
                                cari.Code.toLowerCase().includes(cariSearchTerm.toLowerCase()) ||
                                cari.Name.toLowerCase().includes(cariSearchTerm.toLowerCase())
                              )
                              .slice(0, 15)
                              .map((cari) => (
                                <div
                                  key={cari.Code}
                                  className="px-4 py-2.5 hover:bg-gray-800 cursor-pointer text-sm"
                                  onClick={() => {
                                    handleCariSelect(cari.Code);
                                    setCariSearchTerm(`${cari.Code} - ${cari.Name.substring(0, 30)}...`);
                                    setShowCariDropdown(false);
                                  }}
                                >
                                  <p className="text-white">{cari.Code} - {cari.Name.substring(0, 50)}...</p>
                                  <p className="text-xs text-gray-500">{cari.Type === 'CUSTOMER' ? 'Müşteri' : cari.Type === 'SUPPLIER' ? 'Tedarikçi' : 'Diğer'}</p>
                                </div>
                              ))}
                            
                            {cariMasterData.filter(cari => 
                              cari.Code.toLowerCase().includes(cariSearchTerm.toLowerCase()) ||
                              cari.Name.toLowerCase().includes(cariSearchTerm.toLowerCase())
                            ).length === 0 && (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                Cari bulunamadı
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Cari Bilgisi</label>
                      <div className="flex items-center gap-2 p-3 bg-gray-800/30 rounded-lg">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm line-clamp-2">{selectedKontrat.CariAdi}</p>
                          <p className="text-xs text-gray-500">{selectedKontrat.CariKod}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Tam Boy</label>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={selectedKontrat.TamBoy}
                            onChange={(e) => handleInputChange('TamBoy', Number(e.target.value))}
                            className="bg-gray-800/50 border-gray-700 text-white"
                          />
                        ) : (
                          <p>{selectedKontrat.TamBoy.toFixed(2)} m</p>
                        )}
                      </div>
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Tescil Boy</label>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={selectedKontrat.TescilBoy}
                            onChange={(e) => handleInputChange('TescilBoy', Number(e.target.value))}
                            className="bg-gray-800/50 border-gray-700 text-white"
                          />
                        ) : (
                          <p>{selectedKontrat.TescilBoy.toFixed(2)} m</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Periyot</label>
                      {isEditing ? (
                        <select
                          value={selectedKontrat.Periyot}
                          onChange={(e) => handleInputChange('Periyot', e.target.value)}
                          className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5"
                        >
                          <option value="GUN">Günlük</option>
                          <option value="AY">Aylık</option>
                          <option value="YIL">Yıllık</option>
                        </select>
                      ) : (
                        <p>{getPeriodLabel(selectedKontrat.Periyot)}</p>
                      )}
                    </div>
                  </div>

                  {/* Orta Blok - Sözleşme Detayları */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-green-400" />
                      Sözleşme Detayları
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Başlangıç</label>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={selectedKontrat.Baslangic}
                            onChange={(e) => handleInputChange('Baslangic', e.target.value)}
                            className="bg-gray-800/50 border-gray-700 text-white"
                          />
                        ) : (
                          <p>{new Date(selectedKontrat.Baslangic).toLocaleDateString('tr-TR')}</p>
                        )}
                      </div>
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Bitiş</label>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={selectedKontrat.Bitis || ''}
                            onChange={(e) => handleInputChange('Bitis', e.target.value || null)}
                            className="bg-gray-800/50 border-gray-700 text-white"
                          />
                        ) : (
                          <p>{selectedKontrat.Bitis ? new Date(selectedKontrat.Bitis).toLocaleDateString('tr-TR') : 'Devam ediyor'}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Tarife Kodu</label>
                      {isEditing ? (
                        <Input
                          value={selectedKontrat.TarifeKod}
                          onChange={(e) => handleInputChange('TarifeKod', e.target.value)}
                          className="bg-gray-800/50 border-gray-700 text-white"
                        />
                      ) : (
                        <p>{selectedKontrat.TarifeKod}</p>
                      )}
                    </div>

                    <div>
                      <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Tarife Adı</label>
                      {isEditing ? (
                        <Input
                          value={selectedKontrat.TarifeAdi}
                          onChange={(e) => handleInputChange('TarifeAdi', e.target.value)}
                          className="bg-gray-800/50 border-gray-700 text-white"
                        />
                      ) : (
                        <p>{selectedKontrat.TarifeAdi}</p>
                      )}
                    </div>

                    <div>
                      <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Fiyat</label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={selectedKontrat.Fiyat}
                          onChange={(e) => handleInputChange('Fiyat', Number(e.target.value))}
                          className="bg-gray-800/50 border-gray-700 text-white"
                        />
                      ) : (
                        <p className="text-green-400">{formatCurrency(selectedKontrat.Fiyat, selectedKontrat.Para)}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Para Birimi</label>
                        {isEditing ? (
                          <select
                            value={selectedKontrat.Para}
                            onChange={(e) => handleInputChange('Para', e.target.value)}
                            className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5"
                          >
                            <option value="TRY">TRY</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                          </select>
                        ) : (
                          <p>{selectedKontrat.Para}</p>
                        )}
                      </div>
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>KDV (%)</label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={selectedKontrat.Kdv}
                            onChange={(e) => handleInputChange('Kdv', Number(e.target.value))}
                            className="bg-gray-800/50 border-gray-700 text-white"
                          />
                        ) : (
                          <p>%{selectedKontrat.Kdv}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Durum</label>
                      {isEditing ? (
                        <select
                          value={selectedKontrat.Durum}
                          onChange={(e) => handleInputChange('Durum', e.target.value)}
                          className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5"
                        >
                          <option value="AKTIF">AKTİF</option>
                          <option value="PASIF">PASİF</option>
                        </select>
                      ) : (
                        <Badge variant={selectedKontrat.Durum === 'AKTIF' ? "default" : "secondary"}>
                          {selectedKontrat.Durum}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Sağ Blok - Notlar & Sistem */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                      Notlar & Sistem
                    </h3>

                    <div>
                      <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Notlar</label>
                      {isEditing ? (
                        <Textarea
                          value={selectedKontrat.Notlar}
                          onChange={(e) => handleInputChange('Notlar', e.target.value)}
                          className="bg-gray-800/50 border-gray-700 text-white min-h-[150px]"
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{selectedKontrat.Notlar || '-'}</p>
                      )}
                    </div>

                    <div className="border-t border-gray-800 pt-4">
                      <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Sistem Bilgileri</label>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Oluşturan:</span>
                          <span>{selectedKontrat.Olusturan}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Oluşturma:</span>
                          <span>{new Date(selectedKontrat.OlusturmaTarihi).toLocaleString('tr-TR')}</span>
                        </div>
                        {selectedKontrat.has_invoice && (
                          <div className="flex items-center gap-2 p-2 bg-blue-950/30 border border-blue-800/30 rounded">
                            <ShieldAlert className="w-4 h-4 text-blue-400" />
                            <span className="text-xs text-blue-300">Fatura kesilmiş</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="p-6 m-0">
                <RecordMetadataCard
                  tableName="barinma_contracts"
                  recordId={selectedKontrat.Id}
                  theme={theme}
                />
              </TabsContent>

              <TabsContent value="history" className="p-6 m-0">
                <AuditLogViewer
                  tableName="barinma_contracts"
                  recordId={selectedKontrat.Id}
                  recordName={selectedKontrat.TekneAdi}
                  theme={theme}
                />
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <div className="border-t border-gray-800 p-4 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              SQL Tablo: <code className="text-blue-400">stg_barinma_contract</code> · ID: {selectedKontrat.Id}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCloseDetail}
                className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
              >
                Kapat
              </Button>
            </div>
          </div>
            </div>
          </div>
        )}
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
                // TODO: motorbotMasterData'ya ekle
                setShowMotorbotSheet(false);
                // Dropdown'a yeni tekneyi otomatik seç
                if (selectedKontrat) {
                  setSelectedKontrat({
                    ...selectedKontrat,
                    TekneAdi: motorbot.name,
                    TamBoy: motorbot.length,
                    TescilBoy: motorbot.length * 0.95, // Example
                  });
                }
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
                // TODO: cariMasterData'ya ekle
                setShowCariSheet(false);
                // Dropdown'a yeni cariyi otomatik seç
                if (selectedKontrat) {
                  setSelectedKontrat({
                    ...selectedKontrat,
                    CariKod: cari.vergiNo,
                    CariAdi: cari.unvan,
                  });
                }
              }}
              onCancel={() => setShowCariSheet(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Kontrat Yenileme Dialog */}
      {showRenewalDialog && selectedKontratForRenewal && (
        <KontratYenileme
          kontrat={{
            KontratNo: selectedKontratForRenewal.Id.toString().padStart(6, '0'),
            CariKod: selectedKontratForRenewal.CariKod,
            CariAdi: selectedKontratForRenewal.CariAdi,
            TekneAdi: selectedKontratForRenewal.TekneAdi,
            TamBoy: selectedKontratForRenewal.TamBoy,
            Periyot: selectedKontratForRenewal.Periyot,
            Baslangic: selectedKontratForRenewal.Baslangic,
            Bitis: selectedKontratForRenewal.Bitis || new Date().toISOString().split('T')[0],
            TarifeKod: selectedKontratForRenewal.TarifeKod,
            TarifeAdi: selectedKontratForRenewal.TarifeAdi,
            Fiyat: selectedKontratForRenewal.Fiyat,
            Para: selectedKontratForRenewal.Para,
            Kdv: selectedKontratForRenewal.Kdv,
            Durum: selectedKontratForRenewal.Durum,
          }}
          isOpen={showRenewalDialog}
          onClose={() => {
            setShowRenewalDialog(false);
            setSelectedKontratForRenewal(null);
          }}
          onRenew={handleRenewal}
          theme={theme}
        />
      )}
    </div>
  );
}