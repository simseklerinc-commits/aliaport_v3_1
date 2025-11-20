import { useState } from "react";
import { Search, TrendingUp, TrendingDown, Calendar, DollarSign, AlertCircle, FileText, Download, Filter } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Theme } from "./ThemeSelector";
import { Badge } from "./ui/badge";
import { Select } from "./ui/select";
import { Card } from "./ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface CariHesapYonetimiProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
}

interface CariListItem {
  id: number;
  code: string;
  name: string;
  borc: number;
  alacak: number;
  bakiye: number;
  riskLimit: number;
  vadeGecenTutar: number;
}

interface CariHareket {
  id: number;
  tarih: string;
  islemNo: string;
  aciklama: string;
  borc: number;
  alacak: number;
  bakiye: number;
  vade: string;
  durum: "ödendi" | "beklemede" | "gecikmiş";
  tip: "fatura" | "tahsilat" | "ödeme";
}

const mockCariListesi: CariListItem[] = [
  {
    id: 1,
    code: "C000123",
    name: "ABC DENİZCİLİK A.Ş.",
    borc: 125000,
    alacak: 75000,
    bakiye: 50000,
    riskLimit: 500000,
    vadeGecenTutar: 0,
  },
  {
    id: 2,
    code: "C000124",
    name: "YILMAZ LOJİSTİK LTD. ŞTİ.",
    borc: 85000,
    alacak: 120000,
    bakiye: -35000,
    riskLimit: 250000,
    vadeGecenTutar: 15000,
  },
  {
    id: 3,
    code: "C000125",
    name: "KAYA NAKLİYAT",
    borc: 45000,
    alacak: 30000,
    bakiye: 15000,
    riskLimit: 100000,
    vadeGecenTutar: 0,
  },
  {
    id: 4,
    code: "C000126",
    name: "DEMIR PETROL TİC. LTD.",
    borc: 320000,
    alacak: 280000,
    bakiye: 40000,
    riskLimit: 600000,
    vadeGecenTutar: 25000,
  },
  {
    id: 5,
    code: "C000127",
    name: "MARMARA GEMİ İNŞAA",
    borc: 175000,
    alacak: 200000,
    bakiye: -25000,
    riskLimit: 400000,
    vadeGecenTutar: 0,
  },
];

const mockHareketler: { [key: number]: CariHareket[] } = {
  1: [
    {
      id: 1,
      tarih: "2025-01-15",
      islemNo: "FT-2025-001",
      aciklama: "Liman Barınma Hizmeti - Ocak 2025",
      borc: 35000,
      alacak: 0,
      bakiye: 35000,
      vade: "2025-02-14",
      durum: "beklemede",
      tip: "fatura",
    },
    {
      id: 2,
      tarih: "2025-01-10",
      islemNo: "THS-2025-045",
      aciklama: "Havale ile Ödeme",
      borc: 0,
      alacak: 25000,
      bakiye: 10000,
      vade: "-",
      durum: "ödendi",
      tip: "tahsilat",
    },
    {
      id: 3,
      tarih: "2025-01-05",
      islemNo: "FT-2024-987",
      aciklama: "Motorbot Yakıt Hizmeti",
      borc: 15000,
      alacak: 0,
      bakiye: 35000,
      vade: "2025-02-04",
      durum: "beklemede",
      tip: "fatura",
    },
    {
      id: 4,
      tarih: "2024-12-28",
      islemNo: "FT-2024-956",
      aciklama: "Liman Hizmetleri - Aralık 2024",
      borc: 40000,
      alacak: 0,
      bakiye: 20000,
      vade: "2025-01-27",
      durum: "beklemede",
      tip: "fatura",
    },
    {
      id: 5,
      tarih: "2024-12-20",
      islemNo: "THS-2024-678",
      aciklama: "Nakit Tahsilat",
      borc: 0,
      alacak: 30000,
      bakiye: -20000,
      vade: "-",
      durum: "ödendi",
      tip: "tahsilat",
    },
    {
      id: 6,
      tarih: "2024-12-15",
      islemNo: "FT-2024-889",
      aciklama: "Sefer Hizmeti",
      borc: 35000,
      alacak: 0,
      bakiye: 10000,
      vade: "2025-01-14",
      durum: "beklemede",
      tip: "fatura",
    },
    {
      id: 7,
      tarih: "2024-12-01",
      islemNo: "THS-2024-555",
      aciklama: "EFT ile Tahsilat",
      borc: 0,
      alacak: 20000,
      bakiye: -25000,
      vade: "-",
      durum: "ödendi",
      tip: "tahsilat",
    },
  ],
  2: [
    {
      id: 8,
      tarih: "2025-01-12",
      islemNo: "FT-2025-012",
      aciklama: "Kara Taşıma Hizmeti",
      borc: 25000,
      alacak: 0,
      bakiye: -10000,
      vade: "2025-02-11",
      durum: "beklemede",
      tip: "fatura",
    },
    {
      id: 9,
      tarih: "2024-12-28",
      islemNo: "ODM-2024-234",
      aciklama: "Ödeme - Fatura Karşılığı",
      borc: 0,
      alacak: 30000,
      bakiye: -35000,
      vade: "-",
      durum: "ödendi",
      tip: "ödeme",
    },
    {
      id: 10,
      tarih: "2024-11-20",
      islemNo: "FT-2024-789",
      aciklama: "Kasım Ayı Nakliye",
      borc: 60000,
      alacak: 0,
      bakiye: -5000,
      vade: "2024-12-20",
      durum: "gecikmiş",
      tip: "fatura",
    },
  ],
};

// Grafik için aylık özet data
const aylikOzetData = [
  { ay: "Tem", borc: 120000, alacak: 95000 },
  { ay: "Ağu", borc: 140000, alacak: 110000 },
  { ay: "Eyl", borc: 135000, alacak: 125000 },
  { ay: "Eki", borc: 160000, alacak: 140000 },
  { ay: "Kas", borc: 155000, alacak: 135000 },
  { ay: "Ara", borc: 175000, alacak: 150000 },
  { ay: "Oca", borc: 125000, alacak: 95000 },
];

const durumDagilim = [
  { name: "Ödendi", value: 450000, color: "#10b981" },
  { name: "Beklemede", value: 280000, color: "#f59e0b" },
  { name: "Gecikmiş", value: 40000, color: "#ef4444" },
];

export function CariHesapYonetimi({ onNavigateHome, onNavigateBack, theme }: CariHesapYonetimiProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCari, setSelectedCari] = useState<CariListItem | null>(null);
  const [tarihBaslangic, setTarihBaslangic] = useState("2024-12-01");
  const [tarihBitis, setTarihBitis] = useState("2025-01-18");
  const [islemTipi, setIslemTipi] = useState<string>("tümü");

  const filteredCariList = mockCariListesi.filter(
    (cari) =>
      cari.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cari.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toplamBorc = mockCariListesi.reduce((sum, cari) => sum + cari.borc, 0);
  const toplamAlacak = mockCariListesi.reduce((sum, cari) => sum + cari.alacak, 0);
  const toplamBakiye = toplamBorc - toplamAlacak;
  const toplamVadeGecen = mockCariListesi.reduce((sum, cari) => sum + cari.vadeGecenTutar, 0);

  const hareketler = selectedCari ? (mockHareketler[selectedCari.id] || []) : [];

  const filteredHareketler = hareketler.filter((hareket) => {
    const tarihKontrol = hareket.tarih >= tarihBaslangic && hareket.tarih <= tarihBitis;
    const tipKontrol = islemTipi === "tümü" || hareket.tip === islemTipi;
    return tarihKontrol && tipKontrol;
  });

  const getDurumBadge = (durum: string) => {
    switch (durum) {
      case "ödendi":
        return <Badge className="bg-green-900/30 text-green-400 border-green-800">Ödendi</Badge>;
      case "beklemede":
        return <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-800">Beklemede</Badge>;
      case "gecikmiş":
        return <Badge className="bg-red-900/30 text-red-400 border-red-800">Gecikmiş</Badge>;
      default:
        return null;
    }
  };

  const getTipIcon = (tip: string) => {
    switch (tip) {
      case "fatura":
        return <FileText className="w-4 h-4 text-blue-400" />;
      case "tahsilat":
        return <TrendingDown className="w-4 h-4 text-green-400" />;
      case "ödeme":
        return <TrendingUp className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl mb-1">Cari Ekstre & Bakiye</h2>
          <p className={theme.colors.textMuted}>Cari bakiyeleri, hareketleri ve özetleri görüntüle</p>
        </div>

        {/* Özet Kartlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-5`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${theme.colors.textMuted}`}>Toplam Borç</span>
              <TrendingUp className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-2xl mb-1">{formatCurrency(toplamBorc)}</div>
            <p className="text-xs text-gray-500">{mockCariListesi.length} cari hesap</p>
          </div>

          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-5`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${theme.colors.textMuted}`}>Toplam Alacak</span>
              <TrendingDown className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-2xl mb-1">{formatCurrency(toplamAlacak)}</div>
            <p className="text-xs text-gray-500">Tahsilat bekleyen</p>
          </div>

          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-5`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${theme.colors.textMuted}`}>Net Bakiye</span>
              <DollarSign className={`w-5 h-5 ${toplamBakiye > 0 ? 'text-red-400' : 'text-green-400'}`} />
            </div>
            <div className={`text-2xl mb-1 ${toplamBakiye > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {formatCurrency(Math.abs(toplamBakiye))}
            </div>
            <p className="text-xs text-gray-500">{toplamBakiye > 0 ? 'Borç' : 'Alacak'} fazlası</p>
          </div>

          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-5`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${theme.colors.textMuted}`}>Vadesi Geçen</span>
              <AlertCircle className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-2xl mb-1 text-orange-400">{formatCurrency(toplamVadeGecen)}</div>
            <p className="text-xs text-gray-500">Takip gerekli</p>
          </div>
        </div>

        {/* Ana Grid: Sol Panel (Cari Listesi) + Sağ Panel (Detay) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sol Panel - Cari Listesi */}
          <div className="lg:col-span-4">
            <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-5`}>
              <h3 className="text-lg mb-4">Cari Hesaplar</h3>
              
              {/* Arama */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Cari ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
              </div>

              {/* Cari Listesi */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredCariList.map((cari) => (
                  <div
                    key={cari.id}
                    onClick={() => setSelectedCari(cari)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedCari?.id === cari.id
                        ? `${theme.colors.border} bg-gray-800/70 border-${theme.colors.primaryText.replace('text-', '')}`
                        : 'border-gray-800 hover:border-gray-700 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm mb-1 line-clamp-1">{cari.name}</h4>
                        <p className="text-xs text-gray-500">{cari.code}</p>
                      </div>
                      {cari.vadeGecenTutar > 0 && (
                        <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={theme.colors.textMuted}>Bakiye:</span>
                      <span className={cari.bakiye > 0 ? 'text-red-400' : 'text-green-400'}>
                        {formatCurrency(Math.abs(cari.bakiye))}
                      </span>
                    </div>
                    <div className="mt-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${cari.bakiye > cari.riskLimit * 0.8 ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min((Math.abs(cari.bakiye) / cari.riskLimit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sağ Panel - Detay */}
          <div className="lg:col-span-8">
            {selectedCari ? (
              <div className="space-y-6">
                {/* Seçili Cari Özeti */}
                <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-5`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl mb-1">{selectedCari.name}</h3>
                      <p className={`text-sm ${theme.colors.textMuted}`}>Kod: {selectedCari.code}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Ekstre İndir
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Borç</p>
                      <p className="text-red-400">{formatCurrency(selectedCari.borc)}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Alacak</p>
                      <p className="text-green-400">{formatCurrency(selectedCari.alacak)}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Bakiye</p>
                      <p className={selectedCari.bakiye > 0 ? 'text-red-400' : 'text-green-400'}>
                        {formatCurrency(Math.abs(selectedCari.bakiye))}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Risk Limiti</p>
                      <p>{formatCurrency(selectedCari.riskLimit)}</p>
                      <div className="mt-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${selectedCari.bakiye > selectedCari.riskLimit * 0.8 ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min((Math.abs(selectedCari.bakiye) / selectedCari.riskLimit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grafikler */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Aylık Borç/Alacak Trendi */}
                  <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-5`}>
                    <h4 className="mb-4">Aylık Borç/Alacak Trendi</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={aylikOzetData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="ay" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                          labelStyle={{ color: '#f3f4f6' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="borc" stroke="#ef4444" name="Borç" strokeWidth={2} />
                        <Line type="monotone" dataKey="alacak" stroke="#10b981" name="Alacak" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Durum Dağılımı */}
                  <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-5`}>
                    <h4 className="mb-4">İşlem Durumu Dağılımı</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={durumDagilim}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                          labelLine={false}
                        >
                          {durumDagilim.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Filtreler */}
                <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-5`}>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <Input
                        type="date"
                        value={tarihBaslangic}
                        onChange={(e) => setTarihBaslangic(e.target.value)}
                        className="bg-gray-800/50 border-gray-700 text-white w-40"
                      />
                      <span className="text-gray-500">-</span>
                      <Input
                        type="date"
                        value={tarihBitis}
                        onChange={(e) => setTarihBitis(e.target.value)}
                        className="bg-gray-800/50 border-gray-700 text-white w-40"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <select
                        value={islemTipi}
                        onChange={(e) => setIslemTipi(e.target.value)}
                        className="bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2 text-sm"
                      >
                        <option value="tümü">Tüm İşlemler</option>
                        <option value="fatura">Fatura</option>
                        <option value="tahsilat">Tahsilat</option>
                        <option value="ödeme">Ödeme</option>
                      </select>
                    </div>

                    <div className="ml-auto">
                      <Badge variant="outline" className="border-gray-600">
                        {filteredHareketler.length} hareket
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Hareket Tablosu */}
                <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} overflow-hidden`}>
                  <div className="p-5 border-b border-gray-800">
                    <h4>Hesap Hareketleri</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs text-gray-400">Tarih</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-400">İşlem No</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-400">Açıklama</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-400">Borç</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-400">Alacak</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-400">Bakiye</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-400">Vade</th>
                          <th className="px-4 py-3 text-center text-xs text-gray-400">Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHareketler.length > 0 ? (
                          filteredHareketler.map((hareket, index) => (
                            <tr
                              key={hareket.id}
                              className={`border-b border-gray-800 hover:bg-gray-800/30 transition-colors ${
                                index % 2 === 0 ? 'bg-gray-900/20' : ''
                              }`}
                            >
                              <td className="px-4 py-3 text-sm">
                                {new Date(hareket.tarih).toLocaleDateString('tr-TR')}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex items-center gap-2">
                                  {getTipIcon(hareket.tip)}
                                  <span>{hareket.islemNo}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm max-w-xs">
                                <span className="line-clamp-1">{hareket.aciklama}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-red-400">
                                {hareket.borc > 0 ? formatCurrency(hareket.borc) : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-green-400">
                                {hareket.alacak > 0 ? formatCurrency(hareket.alacak) : '-'}
                              </td>
                              <td className={`px-4 py-3 text-sm text-right ${hareket.bakiye > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {formatCurrency(Math.abs(hareket.bakiye))}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {hareket.vade !== '-' ? new Date(hareket.vade).toLocaleDateString('tr-TR') : '-'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {getDurumBadge(hareket.durum)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                              Seçili tarih aralığında hareket bulunamadı
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-12 text-center`}>
                <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl mb-2">Cari Hesap Seçiniz</h3>
                <p className={theme.colors.textMuted}>
                  Sol taraftan bir cari hesap seçerek detaylı bakiye ve hareket bilgilerini görüntüleyebilirsiniz
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}