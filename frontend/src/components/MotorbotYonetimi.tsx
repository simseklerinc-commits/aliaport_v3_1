// MOTORBOT YÖNETİMİ DASHBOARD - Geliştirilmiş Motorbot Analiz & Yönetim Sistemi
// CariEkstre ve HizmetYonetimi modeli uygulanmış versiyon

import { useState, useEffect, useMemo } from "react";
import {
  Anchor,
  TrendingUp,
  FileText,
  DollarSign,
  ArrowLeft,
  Activity,
  Package,
  ArrowRight,
  BarChart3,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Calendar,
  Ship,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Gauge,
  Fuel,
  Droplet,
  Flag,
  Shield,
  Home,
  Plus,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Theme } from "./ThemeSelector";
import { motorbotMasterData } from "../data/motorbotMasterData";
import type { MotorbotMaster } from "../lib/types/database";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MotorbotYonetimiProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  onNavigateToMotorbotModule?: () => void;
  theme: Theme;
}

// Motorbot Hareketi/Kontrat Tipi
interface MotorbotKontrat {
  id: number;
  tarih: string;
  kontratNo: string;
  tip: "BARINMA" | "SEFER" | "ÖZEL";
  baslangic: string;
  bitis: string;
  gun: number;
  gunlukFiyat: number;
  toplamTutar: number;
  kdv: number;
  toplam: number;
  durum: "AKTİF" | "TAMAMLANDI" | "İPTAL";
  cari?: string;
  iskele?: string;
}

// Mock kontrat verileri
const generateMockKontratlar = (motorbotCode: string): MotorbotKontrat[] => {
  return [
    {
      id: 1,
      tarih: "2025-01-15",
      kontratNo: "KNT-2025-001",
      tip: "BARINMA",
      baslangic: "2025-01-15",
      bitis: "2025-02-15",
      gun: 31,
      gunlukFiyat: 1500,
      toplamTutar: 46500,
      kdv: 8370,
      toplam: 54870,
      durum: "AKTİF",
      cari: "TCDD Liman İşletmeleri",
      iskele: "A-12",
    },
    {
      id: 2,
      tarih: "2025-01-10",
      kontratNo: "KNT-2025-002",
      tip: "SEFER",
      baslangic: "2025-01-10",
      bitis: "2025-01-12",
      gun: 2,
      gunlukFiyat: 3500,
      toplamTutar: 7000,
      kdv: 1260,
      toplam: 8260,
      durum: "TAMAMLANDI",
      cari: "Akdeniz Nakliyat A.Ş.",
    },
    {
      id: 3,
      tarih: "2024-12-20",
      kontratNo: "KNT-2024-892",
      tip: "BARINMA",
      baslangic: "2024-12-20",
      bitis: "2025-01-20",
      gun: 31,
      gunlukFiyat: 1500,
      toplamTutar: 46500,
      kdv: 8370,
      toplam: 54870,
      durum: "TAMAMLANDI",
      cari: "Mercan Turizm Ltd.",
      iskele: "B-05",
    },
    {
      id: 4,
      tarih: "2024-12-01",
      kontratNo: "KNT-2024-823",
      tip: "BARINMA",
      baslangic: "2024-12-01",
      bitis: "2024-12-20",
      gun: 19,
      gunlukFiyat: 1400,
      toplamTutar: 26600,
      kdv: 4788,
      toplam: 31388,
      durum: "TAMAMLANDI",
      cari: "Ege Yat Turizm",
      iskele: "A-08",
    },
    {
      id: 5,
      tarih: "2024-11-15",
      kontratNo: "KNT-2024-745",
      tip: "ÖZEL",
      baslangic: "2024-11-15",
      bitis: "2024-11-20",
      gun: 5,
      gunlukFiyat: 2000,
      toplamTutar: 10000,
      kdv: 1800,
      toplam: 11800,
      durum: "TAMAMLANDI",
      cari: "VIP Etkinlik Org.",
    },
  ];
};

export function MotorbotYonetimi({
  onNavigateHome,
  onNavigateBack,
  onNavigateToMotorbotModule,
  theme,
}: MotorbotYonetimiProps) {
  const [motorbotlar, setMotorbotlar] = useState<MotorbotMaster[]>([]);
  const [loading, setLoading] = useState(true);

  // Seçili motorbot
  const [selectedMotorbot, setSelectedMotorbot] = useState<MotorbotMaster | null>(null);
  const [motorbotKontratlar, setMotorbotKontratlar] = useState<MotorbotKontrat[]>([]);

  // Filtreler
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AKTİF" | "PASİF">("ALL");
  const [contractFilter, setContractFilter] = useState<"ALL" | "AKTIF_KONTRAT" | "KONTRAT_YOK">("ALL");

  // API'den veri çek
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Yeni motorbotMasterData'yı kullan
        await new Promise(resolve => setTimeout(resolve, 500)); // Simüle edilmiş yükleme
        setMotorbotlar(motorbotMasterData);
      } catch (error) {
        console.error("Veri yükleme hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Motorbot seçildiğinde kontratları getir
  useEffect(() => {
    if (selectedMotorbot) {
      const kontratlar = generateMockKontratlar(selectedMotorbot.code);
      setMotorbotKontratlar(kontratlar);
    }
  }, [selectedMotorbot]);

  // Motorbot İstatistikleri
  const motorbotStats = useMemo(() => {
    const total = motorbotlar.length;
    const active = motorbotlar.filter((m) => m.is_active).length;
    const passive = total - active;
    const withContract = motorbotlar.filter((m) => m.has_active_contract).length;
    const withoutContract = total - withContract;

    // Tip dağılımı
    const typeCount: { [key: string]: number } = {};
    motorbotlar.forEach((m) => {
      const type = m.vessel_type || "Diğer";
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    return {
      total,
      active,
      passive,
      withContract,
      withoutContract,
      types: Object.entries(typeCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      allTypes: Object.keys(typeCount).sort(),
    };
  }, [motorbotlar]);

  // Filtrelenmiş motorbotlar
  const filteredMotorbotlar = useMemo(() => {
    return motorbotlar.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.owner_name && m.owner_name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === "ALL" || m.vessel_type === typeFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "AKTİF" && m.is_active) ||
        (statusFilter === "PASİF" && !m.is_active);
      const matchesContract =
        contractFilter === "ALL" ||
        (contractFilter === "AKTIF_KONTRAT" && m.has_active_contract) ||
        (contractFilter === "KONTRAT_YOK" && !m.has_active_contract);

      return matchesSearch && matchesType && matchesStatus && matchesContract;
    });
  }, [motorbotlar, searchTerm, typeFilter, statusFilter, contractFilter]);

  // Seçili motorbot için istatistikler
  const selectedMotorbotStats = useMemo(() => {
    if (!selectedMotorbot || motorbotKontratlar.length === 0) {
      return {
        toplamKontrat: 0,
        toplamGelir: 0,
        toplamKdv: 0,
        toplamNet: 0,
        toplamGun: 0,
        ortalamaGunluk: 0,
      };
    }

    const toplamKontrat = motorbotKontratlar.length;
    const toplamGelir = motorbotKontratlar.reduce((sum, k) => sum + k.toplam, 0);
    const toplamKdv = motorbotKontratlar.reduce((sum, k) => sum + k.kdv, 0);
    const toplamNet = motorbotKontratlar.reduce((sum, k) => sum + k.toplamTutar, 0);
    const toplamGun = motorbotKontratlar.reduce((sum, k) => sum + k.gun, 0);
    const ortalamaGunluk = toplamNet / toplamGun;

    return {
      toplamKontrat,
      toplamGelir,
      toplamKdv,
      toplamNet,
      toplamGun,
      ortalamaGunluk,
    };
  }, [selectedMotorbot, motorbotKontratlar]);

  // Aylık trend grafiği için veri
  const monthlyTrendData = useMemo(() => {
    if (!selectedMotorbot || motorbotKontratlar.length === 0) return [];

    const monthlyData: { [key: string]: { kontrat: number; tutar: number; gun: number } } = {};

    motorbotKontratlar.forEach((kontrat) => {
      const date = new Date(kontrat.tarih);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { kontrat: 0, tutar: 0, gun: 0 };
      }

      monthlyData[monthKey].kontrat += 1;
      monthlyData[monthKey].tutar += kontrat.toplamTutar;
      monthlyData[monthKey].gun += kontrat.gun;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        ay: new Date(month + "-01").toLocaleDateString("tr-TR", {
          month: "short",
          year: "2-digit",
        }),
        kontrat: data.kontrat,
        tutar: data.tutar,
        gun: data.gun,
      }))
      .sort((a, b) => a.ay.localeCompare(b.ay));
  }, [selectedMotorbot, motorbotKontratlar]);

  // Kontrat tipi dağılımı
  const kontratTipData = useMemo(() => {
    if (!selectedMotorbot || motorbotKontratlar.length === 0) return [];

    const tipCount: { [key: string]: number } = {};
    motorbotKontratlar.forEach((k) => {
      tipCount[k.tip] = (tipCount[k.tip] || 0) + 1;
    });

    const colors: { [key: string]: string } = {
      BARINMA: "#10B981",
      SEFER: "#3B82F6",
      ÖZEL: "#F59E0B",
    };

    return Object.entries(tipCount).map(([tip, count]) => ({
      name: tip,
      value: count,
      color: colors[tip] || "#6B7280",
    }));
  }, [selectedMotorbot, motorbotKontratlar]);

  // Tip renkleri
  const typeColors = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"];

  // Geri dön - Motorbot seçimi varsa listeye dön
  const handleBack = () => {
    if (selectedMotorbot) {
      setSelectedMotorbot(null);
    } else {
      onNavigateBack();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-400" />
          <p className="text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Motorbot detay görünümü
  if (selectedMotorbot) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Motorbot Listesine Dön
            </Button>
            <div>
              <h1 className="text-2xl">Motorbot Detayı</h1>
              <p className="text-sm text-gray-400 mt-1">
                {selectedMotorbot.code} - {selectedMotorbot.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Rapor Al
            </Button>
          </div>
        </div>

        {/* Motorbot Kartı Bilgileri - 2 Satır Grid */}
        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6 mb-6`}>
          {/* İlk Satır */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Motorbot Kodu</p>
              <p className="font-mono text-cyan-400">{selectedMotorbot.code}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Motorbot Adı</p>
              <p className="font-medium">{selectedMotorbot.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Tip</p>
              <Badge className="bg-blue-500/10 border-blue-500/30 text-blue-400">
                {selectedMotorbot.vessel_type || "Motorbot"}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Durum</p>
              <div className="flex gap-2">
                <Badge
                  className={
                    selectedMotorbot.is_active
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-gray-700"
                  }
                >
                  {selectedMotorbot.is_active ? "AKTİF" : "PASİF"}
                </Badge>
                {selectedMotorbot.has_active_contract && (
                  <Badge className="bg-purple-500/10 border-purple-500/30 text-purple-400">
                    KONTRAT VAR
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* İkinci Satır */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-gray-800">
            <div>
              <p className="text-xs text-gray-400 mb-1">Sahibi</p>
              <p className="text-sm font-medium">{selectedMotorbot.owner_name || "-"}</p>
              <p className="text-xs text-gray-500">{selectedMotorbot.owner_code || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Boyutlar (Boy × En)</p>
              <p className="text-sm font-mono">
                {selectedMotorbot.length}m × {selectedMotorbot.width}m
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Draft / Derinlik</p>
              <p className="text-sm font-mono">
                {selectedMotorbot.draft || "-"}m / {selectedMotorbot.depth || "-"}m
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Motor / Toplam</p>
              <p className="text-sm">
                {selectedMotorbot.engine || "-"} / {selectedMotorbot.gross_tonnage || "-"} ton
              </p>
            </div>
          </div>

          {/* Üçüncü Satır */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-gray-800 mt-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Yakıt Kapasitesi</p>
              <p className="text-sm font-mono flex items-center gap-1">
                <Fuel className="w-4 h-4 text-orange-400" />
                {selectedMotorbot.fuel_capacity || "-"}L
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Su Kapasitesi</p>
              <p className="text-sm font-mono flex items-center gap-1">
                <Droplet className="w-4 h-4 text-blue-400" />
                {selectedMotorbot.water_capacity || "-"}L
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Bayrak</p>
              <p className="text-sm flex items-center gap-1">
                <Flag className="w-4 h-4 text-red-400" />
                {selectedMotorbot.flag || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Sigorta Durumu</p>
              <p className="text-sm flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-400" />
                {selectedMotorbot.insurance_expiry
                  ? new Date(selectedMotorbot.insurance_expiry).toLocaleDateString("tr-TR")
                  : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Toplam Kontrat</p>
                <p className="text-2xl font-mono">{selectedMotorbotStats.toplamKontrat}</p>
                <p className="text-xs text-gray-500 mt-1">Kontrat sayısı</p>
              </div>
              <FileText className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </div>

          <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Toplam Gelir</p>
                <p className="text-2xl font-mono text-green-400">
                  {new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                    maximumFractionDigits: 0,
                  }).format(selectedMotorbotStats.toplamGelir)}
                </p>
                <p className="text-xs text-gray-500 mt-1">KDV Dahil</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </div>

          <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Toplam Gün</p>
                <p className="text-2xl font-mono text-cyan-400">
                  {selectedMotorbotStats.toplamGun}
                </p>
                <p className="text-xs text-gray-500 mt-1">Barınma + Sefer</p>
              </div>
              <Calendar className="w-8 h-8 text-cyan-400 opacity-50" />
            </div>
          </div>

          <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Ortalama Günlük</p>
                <p className="text-2xl font-mono text-purple-400">
                  {new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                    maximumFractionDigits: 0,
                  }).format(selectedMotorbotStats.ortalamaGunluk)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Ortalama fiyat</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Aylık Gelir Trendi */}
          <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
            <h3 className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-green-400" />
              Aylık Gelir Trendi
            </h3>
            {monthlyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyTrendData}>
                  <defs>
                    <linearGradient id="colorTutar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
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
                    formatter={(value: number) =>
                      new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                      }).format(value)
                    }
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="tutar"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorTutar)"
                    name="Gelir (₺)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Kontrat verisi yok</p>
              </div>
            )}
          </div>

          {/* Kontrat Tipi Dağılımı */}
          <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
            <h3 className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Kontrat Tipi Dağılımı
            </h3>
            {kontratTipData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RePieChart>
                  <Pie
                    data={kontratTipData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {kontratTipData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
            ) : (
              <div className="text-center py-16 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Kontrat verisi yok</p>
              </div>
            )}
          </div>
        </div>

        {/* Kontratlar Tablosu */}
        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg overflow-hidden`}>
          <div className="p-4 border-b border-gray-800">
            <h3 className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Motorbot Kontratları
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Tarih</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Kontrat No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Tip</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Cari</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Başlangıç
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Bitiş</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Gün</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">
                    Günlük Fiyat
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Tutar</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">KDV</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Toplam</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {motorbotKontratlar.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Kontrat bulunamadı</p>
                    </td>
                  </tr>
                ) : (
                  motorbotKontratlar.map((kontrat) => (
                    <tr key={kontrat.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        {new Date(kontrat.tarih).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-blue-400">
                          {kontrat.kontratNo}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            kontrat.tip === "BARINMA"
                              ? "bg-green-500/10 border-green-500/30 text-green-400 text-xs"
                              : kontrat.tip === "SEFER"
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-400 text-xs"
                              : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 text-xs"
                          }
                        >
                          {kontrat.tip}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">{kontrat.cari || "-"}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(kontrat.baslangic).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(kontrat.bitis).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">{kontrat.gun}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        {new Intl.NumberFormat("tr-TR", {
                          style: "currency",
                          currency: "TRY",
                        }).format(kontrat.gunlukFiyat)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        {new Intl.NumberFormat("tr-TR", {
                          style: "currency",
                          currency: "TRY",
                        }).format(kontrat.toplamTutar)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-gray-400">
                        {new Intl.NumberFormat("tr-TR", {
                          style: "currency",
                          currency: "TRY",
                        }).format(kontrat.kdv)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-medium">
                        {new Intl.NumberFormat("tr-TR", {
                          style: "currency",
                          currency: "TRY",
                        }).format(kontrat.toplam)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            kontrat.durum === "AKTİF"
                              ? "bg-green-500/10 border-green-500/30 text-green-400 text-xs"
                              : kontrat.durum === "TAMAMLANDI"
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-400 text-xs"
                              : "bg-red-500/10 border-red-500/30 text-red-400 text-xs"
                          }
                        >
                          {kontrat.durum}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {motorbotKontratlar.length > 0 && (
                <tfoot className="bg-gray-900 border-t-2 border-gray-700">
                  <tr>
                    <td colSpan={8} className="px-4 py-3 text-right font-medium">
                      TOPLAM:
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      {new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                      }).format(selectedMotorbotStats.toplamNet)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-gray-400">
                      {new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                      }).format(selectedMotorbotStats.toplamKdv)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-green-400">
                      {new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                      }).format(selectedMotorbotStats.toplamGelir)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Ana liste görünümü
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateBack}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl">Motorbot Kartları</h1>
            <p className="text-sm text-gray-400 mt-1">
              {motorbotStats.total} tekne · {motorbotStats.active} aktif ·{" "}
              {motorbotStats.withContract} kontrat
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onNavigateToMotorbotModule}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Motorbot
          </Button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Toplam Motorbot</p>
              <p className="text-2xl font-mono">{motorbotStats.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                {motorbotStats.active} aktif, {motorbotStats.passive} pasif
              </p>
            </div>
            <Anchor className="w-8 h-8 text-cyan-400 opacity-50" />
          </div>
        </div>

        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Aktif Motorbot</p>
              <p className="text-2xl font-mono text-green-400">{motorbotStats.active}</p>
              <p className="text-xs text-gray-500 mt-1">
                %{((motorbotStats.active / motorbotStats.total) * 100).toFixed(1)} kullanımda
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400 opacity-50" />
          </div>
        </div>

        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Kontrat Var</p>
              <p className="text-2xl font-mono text-purple-400">{motorbotStats.withContract}</p>
              <p className="text-xs text-gray-500 mt-1">Aktif kontrat</p>
            </div>
            <FileText className="w-8 h-8 text-purple-400 opacity-50" />
          </div>
        </div>

        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Kontrat Yok</p>
              <p className="text-2xl font-mono text-orange-400">
                {motorbotStats.withoutContract}
              </p>
              <p className="text-xs text-gray-500 mt-1">Bekleyen</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4 mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Arama */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Motorbot Ara</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="İsim, kod, sahip..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700"
              />
            </div>
          </div>

          {/* Tip Filtresi */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Tüm Türler</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm"
            >
              <option value="ALL">Tümü</option>
              {motorbotStats.allTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Durum Filtresi */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Kontrat Durumu</label>
            <select
              value={contractFilter}
              onChange={(e) => setContractFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm"
            >
              <option value="ALL">Tümü</option>
              <option value="AKTIF_KONTRAT">Aktif Kontrat</option>
              <option value="KONTRAT_YOK">Kontrat Yok</option>
            </select>
          </div>

          {/* Aktif/Pasif Filtresi */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Durum</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm"
            >
              <option value="ALL">Tümü</option>
              <option value="AKTİF">Aktif</option>
              <option value="PASİF">Pasif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Motorbot Kartları Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMotorbotlar.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Anchor className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>Motorbot bulunamadı</p>
          </div>
        ) : (
          filteredMotorbotlar.map((motorbot) => (
            <div
              key={motorbot.id}
              onClick={() => setSelectedMotorbot(motorbot)}
              className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-5 cursor-pointer hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm text-cyan-400">{motorbot.code}</span>
                    <Badge
                      variant={motorbot.is_active ? "default" : "secondary"}
                      className={
                        motorbot.is_active
                          ? "bg-green-500/10 border-green-500/30 text-green-400 text-xs"
                          : "bg-gray-700 text-xs"
                      }
                    >
                      {motorbot.is_active ? "AKTİF" : "PASİF"}
                    </Badge>
                    {motorbot.has_active_contract && (
                      <Badge className="bg-purple-500/10 border-purple-500/30 text-purple-400 text-xs">
                        KONTRAT
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium mb-1">{motorbot.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Users className="w-3 h-3" />
                    <span>{motorbot.owner_name || "Sahip belirtilmemiş"}</span>
                  </div>
                </div>
              </div>

              {/* Detaylar */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Tip:</span>
                  <Badge className="bg-blue-500/10 border-blue-500/30 text-blue-400 text-xs">
                    {motorbot.vessel_type || "Motorbot"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Ship className="w-3 h-3" />
                    Boy:
                  </span>
                  <span className="font-mono">{motorbot.length}m</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">En:</span>
                  <span className="font-mono">{motorbot.width}m</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Gauge className="w-3 h-3" />
                    Draft:
                  </span>
                  <span className="font-mono">{motorbot.draft || "-"}m</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Motor:</span>
                  <span className="text-xs">{motorbot.engine || "-"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Fuel className="w-3 h-3" />
                    Yakıt:
                  </span>
                  <span className="font-mono">{motorbot.fuel_capacity || "-"}L</span>
                </div>
                {motorbot.has_active_contract && motorbot.berth_location && (
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-800">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Home className="w-3 h-3 text-purple-400" />
                      İskele:
                    </span>
                    <span className="font-mono text-purple-400">
                      {motorbot.berth_location}
                    </span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              >
                <Eye className="w-4 h-4 mr-2" />
                Detayları Görüntüle
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}