// CARİ EKSTRE & BAKİYE - Cari hesap hareketleri ve bakiye görünümü
// ESKİ SİSTEMLE UYUMLU: Dashboard + Hareket listesi + Grafikler

import { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  ArrowLeft,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Building2,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import { cariMasterData } from "../../data/cariData";
import { Theme } from "../ThemeSelector";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CariEkstreProps {
  cari?: {
    id: number;
    code: string;
    title: string;
    type: string;
    tax_id: string;
    risk_limit: number;
    currency: string;
  };
  onBack?: () => void;
  onNavigateHome?: () => void;
  onNavigateBack?: () => void;
  theme?: Theme;
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

// MOCK HAREKET VERİLERİ
const generateMockHareketler = (cariId: number): CariHareket[] => {
  const baseHareketler: CariHareket[] = [
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
  ];

  return baseHareketler;
};

export function CariEkstre({ cari, onBack, onNavigateHome, onNavigateBack, theme }: CariEkstreProps) {
  const [selectedCari, setSelectedCari] = useState<typeof cari>(cari);
  const [dateFilter, setDateFilter] = useState<"all" | "thisMonth" | "lastMonth" | "thisYear">("thisMonth");
  const [statusFilter, setStatusFilter] = useState<"all" | "ödendi" | "beklemede" | "gecikmiş">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cariSearchTerm, setCariSearchTerm] = useState("");

  // Eğer selectedCari yoksa, cari seçim ekranı göster
  if (!selectedCari) {
    const filteredCariList = cariMasterData.filter((c) =>
      cariSearchTerm
        ? c.Code.toLowerCase().includes(cariSearchTerm.toLowerCase()) ||
          c.Name.toLowerCase().includes(cariSearchTerm.toLowerCase())
        : true
    );

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            {onNavigateBack && (
              <Button
                variant="ghost"
                onClick={onNavigateBack}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Building2 className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Cari Ekstre & Bakiye</h1>
                <p className="text-sm text-gray-400">
                  Görüntülemek istediğiniz cari hesabı seçin
                </p>
              </div>
            </div>
          </div>

          {/* Arama */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kodu veya ünvan ile ara..."
              value={cariSearchTerm}
              onChange={(e) => setCariSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Cari Listesi */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 text-sm text-gray-400 w-32">Kod</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Ünvan</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400 w-40">Vergi No</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400 w-32">Tip</th>
                  <th className="text-right px-4 py-3 text-sm text-gray-400 w-40"></th>
                </tr>
              </thead>
              <tbody>
                {filteredCariList.map((c) => (
                  <tr
                    key={c.Id}
                    onClick={() =>
                      setSelectedCari({
                        id: c.Id,
                        code: c.Code,
                        title: c.Name,
                        type: c.AccountType,
                        tax_id: c.TaxId,
                        risk_limit: c.RiskLimit || 0,
                        currency: c.Currency,
                      })
                    }
                    className="border-b border-gray-800 hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="font-mono text-sm text-white">{c.Code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-white font-medium">{c.Name}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm text-gray-400">{c.TaxId}</span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        className={
                          c.AccountType === "CUSTOMER"
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                            : c.AccountType === "SUPPLIER"
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/50"
                            : "bg-green-500/20 text-green-400 border-green-500/50"
                        }
                      >
                        {c.AccountType === "CUSTOMER" ? "Müşteri" : c.AccountType === "SUPPLIER" ? "Tedarikçi" : "İkisi"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Ekstre Görüntüle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredCariList.length === 0 && (
            <div className="p-12 text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
              <p className="text-gray-400">Cari hesap bulunamadı</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const hareketler = generateMockHareketler(selectedCari.id);

  // Filtreleme
  const filteredHareketler = hareketler.filter((hareket) => {
    const matchesSearch =
      !searchTerm ||
      hareket.islemNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hareket.aciklama.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || hareket.durum === statusFilter;

    // Tarih filtreleme (basitleştirilmiş)
    const matchesDate = true; // Şimdilik tüm tarihler

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Hesaplamalar
  const toplamBorc = filteredHareketler.reduce((sum, h) => sum + h.borc, 0);
  const toplamAlacak = filteredHareketler.reduce((sum, h) => sum + h.alacak, 0);
  const bakiye = toplamBorc - toplamAlacak;
  const vadeGecenTutar = filteredHareketler
    .filter((h) => h.durum === "gecikmiş")
    .reduce((sum, h) => sum + h.borc, 0);

  // Durum badge
  const getDurumBadge = (durum: string) => {
    switch (durum) {
      case "ödendi":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Ödendi</Badge>;
      case "beklemede":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Beklemede</Badge>;
      case "gecikmiş":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Gecikmiş</Badge>;
      default:
        return null;
    }
  };

  // Tip icon
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

  // Para formatı
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: selectedCari?.currency || "TRY",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Grafik verileri hesaplama
  const aylikTrendData = [
    { ay: "Ekim", borc: 45000, alacak: 30000, bakiye: 15000 },
    { ay: "Kasım", borc: 60000, alacak: 45000, bakiye: 30000 },
    { ay: "Aralık", borc: 75000, alacak: 55000, bakiye: 50000 },
    { ay: "Ocak", borc: toplamBorc, alacak: toplamAlacak, bakiye: Math.abs(bakiye) },
  ];

  const durumDagilimi = [
    {
      name: "Ödendi",
      value: filteredHareketler.filter((h) => h.durum === "ödendi").length,
      tutar: filteredHareketler.filter((h) => h.durum === "ödendi").reduce((sum, h) => sum + h.alacak, 0),
    },
    {
      name: "Beklemede",
      value: filteredHareketler.filter((h) => h.durum === "beklemede").length,
      tutar: filteredHareketler.filter((h) => h.durum === "beklemede").reduce((sum, h) => sum + h.borc, 0),
    },
    {
      name: "Gecikmiş",
      value: filteredHareketler.filter((h) => h.durum === "gecikmiş").length,
      tutar: filteredHareketler.filter((h) => h.durum === "gecikmiş").reduce((sum, h) => sum + h.borc, 0),
    },
  ];

  const DURUM_COLORS = {
    Ödendi: "#10B981",
    Beklemede: "#F59E0B",
    Gecikmiş: "#EF4444",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {onNavigateBack && (
              <Button
                variant="ghost"
                onClick={onNavigateBack}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl text-white mb-1">Cari Ekstre & Bakiye</h1>
              <p className="text-sm text-gray-400">
                Cari bakiyeleri, hareketleri ve özetleri görüntüle
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedCari(undefined)}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Cari Değiştir
            </Button>
            <Button
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Ekstre İndir
            </Button>
          </div>
        </div>

        {/* Cari Bilgisi */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Kod</div>
              <div className="text-white font-mono">{selectedCari?.code}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-gray-500 mb-1">Unvan</div>
              <div className="text-white">{selectedCari?.title}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Vergi No</div>
              <div className="text-white font-mono">{selectedCari?.tax_id}</div>
            </div>
          </div>
        </div>

        {/* Özet Kartlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Toplam Borç */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Toplam Borç</span>
              <TrendingUp className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-2xl text-red-400">{formatCurrency(toplamBorc)}</div>
          </div>

          {/* Toplam Alacak */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Toplam Alacak</span>
              <TrendingDown className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-2xl text-green-400">{formatCurrency(toplamAlacak)}</div>
          </div>

          {/* Bakiye */}
          <div
            className={`${
              bakiye > 0
                ? "bg-red-500/10 border-red-500/30"
                : bakiye < 0
                ? "bg-green-500/10 border-green-500/30"
                : "bg-gray-500/10 border-gray-500/30"
            } border rounded-lg p-4`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Bakiye</span>
              <DollarSign
                className={`w-5 h-5 ${
                  bakiye > 0 ? "text-red-400" : bakiye < 0 ? "text-green-400" : "text-gray-400"
                }`}
              />
            </div>
            <div
              className={`text-2xl ${
                bakiye > 0 ? "text-red-400" : bakiye < 0 ? "text-green-400" : "text-gray-400"
              }`}
            >
              {formatCurrency(Math.abs(bakiye))}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {bakiye > 0 ? "Alacaklı" : bakiye < 0 ? "Borçlu" : "Bakiye Yok"}
            </div>
          </div>

          {/* Risk Kullanım */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Risk Kullanımı</span>
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-2xl text-yellow-400">
              {selectedCari?.risk_limit > 0
                ? Math.round((bakiye / selectedCari.risk_limit) * 100)
                : 0}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Limit: {formatCurrency(selectedCari?.risk_limit || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Arama */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="İşlem ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Tarih Filtresi */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Tüm Tarihler</option>
            <option value="thisMonth">Bu Ay</option>
            <option value="lastMonth">Geçen Ay</option>
            <option value="thisYear">Bu Yıl</option>
          </select>

          {/* Durum Filtresi */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="ödendi">Ödendi</option>
            <option value="beklemede">Beklemede</option>
            <option value="gecikmiş">Gecikmiş</option>
          </select>

          {/* Filtre Temizle */}
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setDateFilter("thisMonth");
              setStatusFilter("all");
            }}
            className="border-gray-700 text-white hover:bg-gray-800"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtreleri Temizle
          </Button>
        </div>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aylık Trend Grafiği */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-400" />
            <h3 className="text-white">Aylık Borç/Alacak Trendi</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={aylikTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="ay" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="borc" stroke="#EF4444" name="Borç" strokeWidth={2} />
              <Line type="monotone" dataKey="alacak" stroke="#10B981" name="Alacak" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Durum Dağılımı */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-purple-400" />
            <h3 className="text-white">Ödeme Durumu Dağılımı</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <RePieChart>
              <Pie
                data={durumDagilimi}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {durumDagilimi.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={DURUM_COLORS[entry.name as keyof typeof DURUM_COLORS]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Legend />
            </RePieChart>
          </ResponsiveContainer>
        </div>

        {/* Bakiye Trendi */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-green-400" />
            <h3 className="text-white">Bakiye Gelişimi</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={aylikTrendData}>
              <defs>
                <linearGradient id="colorBakiye" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="ay" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="bakiye"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorBakiye)"
                name="Bakiye"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Hareket Tipi Dağılımı */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            <h3 className="text-white">İşlem Türü Dağılımı</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={[
                {
                  tip: "Fatura",
                  adet: filteredHareketler.filter((h) => h.tip === "fatura").length,
                  tutar: filteredHareketler.filter((h) => h.tip === "fatura").reduce((sum, h) => sum + h.borc, 0),
                },
                {
                  tip: "Tahsilat",
                  adet: filteredHareketler.filter((h) => h.tip === "tahsilat").length,
                  tutar: filteredHareketler.filter((h) => h.tip === "tahsilat").reduce((sum, h) => sum + h.alacak, 0),
                },
                {
                  tip: "Ödeme",
                  adet: filteredHareketler.filter((h) => h.tip === "ödeme").length,
                  tutar: filteredHareketler.filter((h) => h.tip === "ödeme").reduce((sum, h) => sum + h.alacak, 0),
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="tip" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="adet" fill="#F59E0B" name="Adet" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hareket Tablosu */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Tip</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Tarih</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">İşlem No</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Açıklama</th>
                <th className="text-right px-4 py-3 text-sm text-gray-400">Borç</th>
                <th className="text-right px-4 py-3 text-sm text-gray-400">Alacak</th>
                <th className="text-right px-4 py-3 text-sm text-gray-400">Bakiye</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Vade</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Durum</th>
              </tr>
            </thead>
            <tbody>
              {filteredHareketler.map((hareket) => (
                <tr key={hareket.id} className="border-b border-gray-800 hover:bg-gray-900/30">
                  <td className="px-4 py-3">{getTipIcon(hareket.tip)}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {new Date(hareket.tarih).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-300">{hareket.islemNo}</td>
                  <td className="px-4 py-3 text-sm text-white">{hareket.aciklama}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    {hareket.borc > 0 ? (
                      <span className="text-red-400">{formatCurrency(hareket.borc)}</span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {hareket.alacak > 0 ? (
                      <span className="text-green-400">{formatCurrency(hareket.alacak)}</span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <span
                      className={
                        hareket.bakiye > 0
                          ? "text-red-400"
                          : hareket.bakiye < 0
                          ? "text-green-400"
                          : "text-gray-400"
                      }
                    >
                      {formatCurrency(Math.abs(hareket.bakiye))}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {hareket.vade !== "-"
                      ? new Date(hareket.vade).toLocaleDateString("tr-TR")
                      : "-"}
                  </td>
                  <td className="px-4 py-3">{getDurumBadge(hareket.durum)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-900/50 border-t-2 border-gray-600">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-sm text-white">
                  TOPLAM
                </td>
                <td className="px-4 py-3 text-right text-sm text-red-400">
                  {formatCurrency(toplamBorc)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-green-400">
                  {formatCurrency(toplamAlacak)}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <span
                    className={
                      bakiye > 0 ? "text-red-400" : bakiye < 0 ? "text-green-400" : "text-gray-400"
                    }
                  >
                    {formatCurrency(Math.abs(bakiye))}
                  </span>
                </td>
                <td colSpan={2} className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Empty State */}
        {filteredHareketler.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
            <p className="text-gray-400">Hareket kaydı bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  );
}