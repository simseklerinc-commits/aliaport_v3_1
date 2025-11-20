import { useState } from "react";
import { Theme } from "./ThemeSelector";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { CariKartiForm } from "./CariKartiForm";
import { CariKartiDetay } from "./CariKartiDetay";
import { CariKart, cariMasterData } from "../data/cariData";  // ✅ Import real data
import { 
  Plus, 
  Search, 
  Building2, 
  MapPin, 
  Phone, 
  FileText, 
  Edit, 
  Trash2, 
  X, 
  Save 
} from "lucide-react";

interface CariKartlariProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  onNavigateToCariGiris?: () => void;
  theme: Theme;
}

const mockCariData: CariKart[] = [
  {
    Id: 1,
    Code: "C000123",
    Name: "ABC DENİZCİLİK A.Ş.",
    Active: true,
    Country: "TR",
    City: "İzmir",
    Town: "Aliağa",
    VergiDairesi: "ALİAĞA",
    Vkn: "1234567890",
    Tckn: "",
    VknTckn: "1234567890",
    Adres: "Kazımdirik Mah. Atatürk Cad. No:123 Aliağa/İzmir",
    Address: "Eski Adres Bilgisi",
    Tel: "+90 232 123 45 67",
    Tel1: "+90 532 111 22 33",
    Tel2: "+90 532 222 33 44",
    Email: "info@abcdenizcilik.com.tr",
    IBAN: "TR12 0001 0000 0012 3456 7890 01",
    Para: "TRY",
    Currency: "USD",
    RiskLimit: 500000,
    RiskCurrency: "TRY",
    PaymentTermDays: 30,
    OdemeVadesiGun: 30,
    GlCode: "120.01.001",
    CreatedAt: "2024-01-15T10:30:00",
    UpdatedAt: "2025-01-10T14:20:00",
  },
  {
    Id: 2,
    Code: "C000124",
    Name: "YILMAZ LOJİSTİK LTD. ŞTİ.",
    Active: true,
    Country: "TR",
    City: "İzmir",
    Town: "Bornova",
    VergiDairesi: "BORNOVA",
    Vkn: "9876543210",
    Tckn: "",
    VknTckn: "9876543210",
    Adres: "Erzene Mah. Liman Cad. No:45 Bornova/İzmir",
    Address: "",
    Tel: "+90 232 987 65 43",
    Tel1: "+90 542 555 66 77",
    Tel2: "",
    Email: "info@yilmazlojistik.com",
    IBAN: "TR98 0006 1000 0000 0098 7654 32",
    Para: "TRY",
    Currency: "EUR",
    RiskLimit: 250000,
    RiskCurrency: "TRY",
    PaymentTermDays: 45,
    OdemeVadesiGun: 45,
    GlCode: "120.01.002",
    CreatedAt: "2024-02-20T09:15:00",
    UpdatedAt: "2025-01-12T16:45:00",
  },
  {
    Id: 3,
    Code: "C000125",
    Name: "KAYA NAKLİYAT",
    Active: false,
    Country: "TR",
    City: "Manisa",
    Town: "Turgutlu",
    VergiDairesi: "TURGUTLU",
    Vkn: "5555555555",
    Tckn: "",
    VknTckn: "5555555555",
    Adres: "Merkez Mah. Cumhuriyet Cad. No:78 Turgutlu/Manisa",
    Address: "",
    Tel: "+90 236 111 22 33",
    Tel1: "",
    Tel2: "",
    Email: "kaya@kayanakliyat.com",
    IBAN: "TR45 0012 3000 0000 0055 5555 55",
    Para: "TRY",
    Currency: "TRY",
    RiskLimit: 100000,
    RiskCurrency: "TRY",
    PaymentTermDays: 15,
    OdemeVadesiGun: 15,
    GlCode: "120.02.001",
    CreatedAt: "2023-11-10T11:00:00",
    UpdatedAt: "2024-12-05T10:30:00",
  },
];

export function CariKartlari({ onNavigateHome, onNavigateBack, onNavigateToCariGiris, theme }: CariKartlariProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCari, setSelectedCari] = useState<CariKart | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [isNewCari, setIsNewCari] = useState(false);

  const emptyForm: CariKart = {
    Id: 0,
    Code: "",
    Name: "",
    Active: true,
    AccountType: "CUSTOMER",
    
    TaxIdType: "VKN",
    TaxId: "",
    TaxOffice: "",
    
    Address: "",
    Neighborhood: "",
    District: "",
    City: "",
    PostalCode: "",
    CountryCode: "TR",
    
    Phone: "",
    Email: "",
    
    IsEInvoiceCustomer: false,
    AcceptsEArchive: true,
    SendMethod: "E-ARSIV",
    
    Currency: "TRY",
    PaymentTermDays: 0,
    RiskCurrency: "TRY",
    
    CreatedAt: new Date().toISOString(),
  };

  // ✅ GERÇEK DATA KULLAN (cariMasterData)
  const filteredCari = cariMasterData.filter(
    (cari) =>
      cari.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cari.Code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cari.City && cari.City.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewDetail = (cari: CariKart) => {
    setSelectedCari(cari);
    setShowDetail(true);
    setIsEditing(false);
  };

  const handleEdit = (cari: CariKart) => {
    setSelectedCari(cari);
    setShowDetail(true);
    setIsEditing(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedCari(null);
    setIsEditing(false);
    setIsNewCari(false);
  };

  const handleInputChange = (field: keyof CariKart, value: any) => {
    if (selectedCari) {
      setSelectedCari({ ...selectedCari, [field]: value });
    }
  };

  const handleSave = () => {
    console.log("Kaydediliyor:", selectedCari);
    // Burada backend'e kaydetme işlemi yapılacak
    setIsEditing(false);
    setIsNewCari(false);
    setShowDetail(false);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl mb-1">Cari Kartları</h2>
            <p className={theme.colors.textMuted}>Tüm cari hesap kartlarını görüntüle ve yönet</p>
          </div>
          <Button
            className={`${theme.colors.primary} ${theme.colors.primaryHover} text-black`}
            onClick={() => {
              if (onNavigateToCariGiris) {
                onNavigateToCariGiris();
              } else {
                setSelectedCari(emptyForm);
                setShowDetail(true);
                setIsNewCari(true);
              }
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Cari Kartı
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Cari ara... (Ünvan, Kod, Şehir)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 text-white"
            />
          </div>
        </div>

        {/* Cari Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCari.map((cari) => (
            <div
              key={cari.Id}
              className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-5 hover:border-gray-600 transition-all cursor-pointer`}
              onClick={() => handleViewDetail(cari)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className={`w-4 h-4 ${theme.colors.primaryText}`} />
                    <h3 className="line-clamp-1">{cari.Name}</h3>
                  </div>
                  <p className={`text-xs ${theme.colors.textMuted}`}>Kod: {cari.Code}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={cari.Active ? "default" : "secondary"} className={cari.Active ? theme.colors.primary + " text-black" : "bg-gray-700 text-gray-300"}>
                    {cari.Active ? "AKTİF" : "PASİF"}
                  </Badge>
                  <Badge variant="outline" className="border-gray-600">
                    {cari.Country}
                  </Badge>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-3 h-3 text-gray-500" />
                  <span className={theme.colors.textMuted}>
                    {cari.City}{cari.District ? ` / ${cari.District}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3 h-3 text-gray-500" />
                  <span className={theme.colors.textMuted}>{cari.Phone || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-3 h-3 text-gray-500" />
                  <span className={theme.colors.textMuted}>
                    {cari.TaxIdType}: {cari.TaxId}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-3 h-3 text-purple-400" />
                  <span className={`text-xs ${cari.IsEInvoiceCustomer ? 'text-purple-400' : 'text-gray-500'}`}>
                    {cari.IsEInvoiceCustomer ? '⚡ E-Fatura' : '📄 E-Arşiv'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-800">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(cari);
                  }}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Düzenle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-red-900/50 text-red-400 hover:bg-red-900/20"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Detail Modal - Yeni Audit Sistemli Component */}
        {showDetail && selectedCari && !isNewCari && (
          <CariKartiDetay
            cari={selectedCari}
            onClose={handleCloseDetail}
            onEdit={() => {
              console.log('Edit:', selectedCari);
              // İleride düzenleme moduna geçilebilir
            }}
            onDelete={(cari) => {
              console.log('Delete:', cari);
              // Silme işlemi sonrası listeyi yenile
              handleCloseDetail();
            }}
            theme={theme}
          />
        )}

        {/* New/Edit Modal - Form için */}
        {showDetail && selectedCari && isNewCari && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
            <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} w-full max-w-6xl max-h-[90vh] overflow-auto`}>
              {/* Modal Header */}
              <div className={`sticky top-0 ${theme.colors.bgCard} border-b ${theme.colors.border} px-6 py-4 flex items-center justify-between z-10`}>
                <div className="flex items-center gap-3">
                  <Building2 className={`w-6 h-6 ${theme.colors.primaryText}`} />
                  <div>
                    <h2 className="text-xl">Yeni Cari Kartı</h2>
                    <p className={`text-sm ${theme.colors.textMuted}`}>Yeni cari hesap oluştur</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseDetail}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <CariKartiForm
                  cari={selectedCari}
                  isEditing={isEditing}
                  isNewCari={isNewCari}
                  theme={theme}
                  onChange={handleInputChange}
                />

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleCloseDetail}
                    className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
                  >
                    İptal
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}