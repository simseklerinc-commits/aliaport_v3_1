import { useState, useEffect, useMemo } from "react";
import {
  Package,
  TrendingUp,
  FileText,
  DollarSign,
  ArrowLeft,
  Activity,
  Layers,
  PieChart,
  ArrowRight,
  BarChart3,
  Zap,
  CheckCircle,
  Clock,
  TrendingDown,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  ToggleLeft,
  ToggleRight,
  Calendar,
  TrendingUpIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Theme } from "./ThemeSelector";
import { hizmetApiMock } from "../lib/api/hizmet";
import { tarifeApiMock } from "../lib/api/tarife";
import type { ServiceCard, PriceList } from "../lib/types/database";
import { HizmetKartiDetay } from "./HizmetKartiDetay";
import { HizmetKartiDuzenle } from "./HizmetKartiDuzenle";
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

interface HizmetYonetimiProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  onNavigateToHizmetModule?: () => void;
  onNavigateTotarifeModule?: () => void;
  theme: Theme;
}

// Hizmet Hareketi Tipi
interface HizmetHareket {
  id: number;
  tarih: string;
  islemNo: string;
  islemTip: "FATURA" | "KONTRAT" | "TARİFE";
  cari?: string;
  tarife?: string;
  miktar: number;
  birimFiyat: number;
  tutar: number;
  kdv: number;
  toplam: number;
  durum: "AKTİF" | "İPTAL" | "TAMAMLANDI";
}

// Mock hizmet hareketleri oluştur
const generateMockHareketler = (hizmetCode: string): HizmetHareket[] => {
  const baseData: HizmetHareket[] = [
    {
      id: 1,
      tarih: "2025-01-15",
      islemNo: "FT-2025-001",
      islemTip: "FATURA",
      cari: "TCDD Liman İşletmeleri",
      tarife: "Standart Tarife 2025",
      miktar: 30,
      birimFiyat: 1500,
      tutar: 45000,
      kdv: 8100,
      toplam: 53100,
      durum: "AKTİF",
    },
    {
      id: 2,
      tarih: "2025-01-10",
      islemNo: "KNT-2025-045",
      islemTip: "KONTRAT",
      cari: "Akdeniz Nakliyat A.Ş.",
      tarife: "Kurumsal Tarife",
      miktar: 15,
      birimFiyat: 1200,
      tutar: 18000,
      kdv: 3240,
      toplam: 21240,
      durum: "AKTİF",
    },
    {
      id: 3,
      tarih: "2024-12-28",
      islemNo: "FT-2024-892",
      islemTip: "FATURA",
      cari: "Mercan Turizm Ltd.",
      tarife: "Standart Tarife 2025",
      miktar: 45,
      birimFiyat: 1500,
      tutar: 67500,
      kdv: 12150,
      toplam: 79650,
      durum: "TAMAMLANDI",
    },
    {
      id: 4,
      tarih: "2024-12-15",
      islemNo: "FT-2024-823",
      islemTip: "FATURA",
      cari: "TCDD Liman İşletmeleri",
      tarife: "Standart Tarife 2024",
      miktar: 30,
      birimFiyat: 1400,
      tutar: 42000,
      kdv: 7560,
      toplam: 49560,
      durum: "TAMAMLANDI",
    },
    {
      id: 5,
      tarih: "2024-12-01",
      islemNo: "KNT-2024-912",
      islemTip: "KONTRAT",
      cari: "Ege Yat Turizm",
      tarife: "Sezonluk Tarife",
      miktar: 60,
      birimFiyat: 1100,
      tutar: 66000,
      kdv: 11880,
      toplam: 77880,
      durum: "TAMAMLANDI",
    },
  ];

  return baseData;
};

export function HizmetYonetimi({
  onNavigateHome,
  onNavigateBack,
  onNavigateToHizmetModule,
  onNavigateTotarifeModule,
  theme,
}: HizmetYonetimiProps) {
  const [hizmetler, setHizmetler] = useState<ServiceCard[]>([]);
  const [tarifeler, setTarifeler] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Seçili hizmet kartı
  const [selectedHizmet, setSelectedHizmet] = useState<ServiceCard | null>(null);
  const [hizmetHareketler, setHizmetHareketler] = useState<HizmetHareket[]>([]);

  // Filtreler
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AKTIF" | "PASIF">("ALL");

  // API'den veri çek
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hizmetResponse, tarifeResponse] = await Promise.all([
          hizmetApiMock.getAll(),
          tarifeApiMock.getAll(),
        ]);
        setHizmetler(hizmetResponse.items);
        setTarifeler(tarifeResponse.items);
      } catch (error) {
        console.error("Veri yükleme hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Hizmet seçildiğinde hareketleri getir
  useEffect(() => {
    if (selectedHizmet) {
      const hareketler = generateMockHareketler(selectedHizmet.code);
      setHizmetHareketler(hareketler);
    }
  }, [selectedHizmet]);

  // Hizmet İstatistikleri
  const hizmetStats = useMemo(() => {
    const total = hizmetler.length;
    const active = hizmetler.filter((h) => h.is_active).length;
    const passive = total - active;

    // Kategori dağılımı
    const categoryCount: { [key: string]: number } = {};
    hizmetler.forEach((h) => {
      const cat = h.category || "Diğer";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    return {
      total,
      active,
      passive,
      categories: Object.entries(categoryCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      allCategories: Object.keys(categoryCount).sort(),
    };
  }, [hizmetler]);

  // Tarife İstatistikleri
  const tarifeStats = useMemo(() => {
    const total = tarifeler.length;
    const active = tarifeler.filter((t) => t.status === "AKTIF").length;
    const passive = total - active;

    return {
      total,
      active,
      passive,
    };
  }, [tarifeler]);

  // Filtrelenmiş hizmetler
  const filteredHizmetler = useMemo(() => {
    return hizmetler.filter((h) => {
      const matchesSearch =
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "ALL" || h.category === categoryFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "AKTIF" && h.is_active) ||
        (statusFilter === "PASIF" && !h.is_active);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [hizmetler, searchTerm, categoryFilter, statusFilter]);

  // Seçili hizmet için istatistikler
  const selectedHizmetStats = useMemo(() => {
    if (!selectedHizmet || hizmetHareketler.length === 0) {
      return {
        toplamIslem: 0,
        toplamGelir: 0,
        toplamKdv: 0,
        toplamNet: 0,
        ortalamaFiyat: 0,
        toplamMiktar: 0,
      };
    }

    const toplamIslem = hizmetHareketler.length;
    const toplamGelir = hizmetHareketler.reduce((sum, h) => sum + h.toplam, 0);
    const toplamKdv = hizmetHareketler.reduce((sum, h) => sum + h.kdv, 0);
    const toplamNet = hizmetHareketler.reduce((sum, h) => sum + h.tutar, 0);
    const toplamMiktar = hizmetHareketler.reduce((sum, h) => sum + h.miktar, 0);
    const ortalamaFiyat = toplamNet / toplamMiktar;

    return {
      toplamIslem,
      toplamGelir,
      toplamKdv,
      toplamNet,
      ortalamaFiyat,
      toplamMiktar,
    };
  }, [selectedHizmet, hizmetHareketler]);

  // Aylık trend grafiği için veri
  const monthlyTrendData = useMemo(() => {
    if (!selectedHizmet || hizmetHareketler.length === 0) return [];

    const monthlyData: { [key: string]: { miktar: number; tutar: number } } = {};

    hizmetHareketler.forEach((hareket) => {
      const date = new Date(hareket.tarih);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { miktar: 0, tutar: 0 };
      }
      
      monthlyData[monthKey].miktar += hareket.miktar;
      monthlyData[monthKey].tutar += hareket.tutar;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        ay: new Date(month + "-01").toLocaleDateString("tr-TR", { month: "short", year: "2-digit" }),
        miktar: data.miktar,
        tutar: data.tutar,
      }))
      .sort((a, b) => a.ay.localeCompare(b.ay));
  }, [selectedHizmet, hizmetHareketler]);

  // İşlem tipi dağılımı
  const islemTipData = useMemo(() => {
    if (!selectedHizmet || hizmetHareketler.length === 0) return [];

    const tipCount: { [key: string]: number } = {};
    hizmetHareketler.forEach((h) => {
      tipCount[h.islemTip] = (tipCount[h.islemTip] || 0) + 1;
    });

    const colors: { [key: string]: string } = {
      FATURA: "#3B82F6",
      KONTRAT: "#10B981",
      TARİFE: "#F59E0B",
    };

    return Object.entries(tipCount).map(([tip, count]) => ({
      name: tip,
      value: count,
      color: colors[tip] || "#6B7280",
    }));
  }, [selectedHizmet, hizmetHareketler]);

  // Kategori renkleri
  const categoryColors = [
    "#10b981",
    "#f59e0b",
    "#3b82f6",
    "#ef4444",
    "#8b5cf6",
  ];

  // Geri dön - Hizmet seçimi varsa listeye dön
  const handleBack = () => {
    if (selectedHizmet) {
      setSelectedHizmet(null);
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

  // Hizmet detay görünümü
  if (selectedHizmet) {
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
              Hizmet Listesine Dön
            </Button>
            <div>
              <h1 className="text-2xl">Hizmet Kartı Detayı</h1>
              <p className="text-sm text-gray-400 mt-1">
                {selectedHizmet.code} - {selectedHizmet.name}
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

        {/* Hizmet Kartı Bilgileri */}
        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6 mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-gray-400 mb-1">Hizmet Kodu</p>
              <p className="font-mono text-blue-400">{selectedHizmet.code}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Hizmet Adı</p>
              <p className="font-medium">{selectedHizmet.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Kategori</p>
              <Badge className="bg-purple-500/10 border-purple-500/30 text-purple-400">
                {selectedHizmet.category || "Kategori yok"}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Durum</p>
              <Badge
                className={
                  selectedHizmet.is_active
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-gray-700"
                }
              >
                {selectedHizmet.is_active ? "AKTİF" : "PASİF"}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 pt-4 border-t border-gray-800">
            <div>
              <p className="text-xs text-gray-400 mb-1">Birim Tipi</p>
              <p className="text-sm">{selectedHizmet.unit_type || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">KDV Oranı</p>
              <p className="text-sm">%{selectedHizmet.vat_rate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Açıklama</p>
              <p className="text-sm text-gray-400">
                {selectedHizmet.description || "Açıklama yok"}
              </p>
            </div>
          </div>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Toplam İşlem</p>
                <p className="text-2xl font-mono">{selectedHizmetStats.toplamIslem}</p>
                <p className="text-xs text-gray-500 mt-1">İşlem sayısı</p>
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
                  }).format(selectedHizmetStats.toplamGelir)}
                </p>
                <p className="text-xs text-gray-500 mt-1">KDV Dahil</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </div>

          <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Toplam Miktar</p>
                <p className="text-2xl font-mono text-cyan-400">
                  {selectedHizmetStats.toplamMiktar}
                </p>
                <p className="text-xs text-gray-500 mt-1">{selectedHizmet.unit_type || "Adet"}</p>
              </div>
              <Package className="w-8 h-8 text-cyan-400 opacity-50" />
            </div>
          </div>

          <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Ortalama Fiyat</p>
                <p className="text-2xl font-mono text-purple-400">
                  {new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                    maximumFractionDigits: 0,
                  }).format(selectedHizmetStats.ortalamaFiyat)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Birim başı</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Aylık Trend */}
          <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
            <h3 className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-green-400" />
              Aylık Kullanım Trendi
            </h3>
            {monthlyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyTrendData}>
                  <defs>
                    <linearGradient id="colorMiktar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
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
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="miktar"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorMiktar)"
                    name="Miktar"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Hareket verisi yok</p>
              </div>
            )}
          </div>

          {/* İşlem Tipi Dağılımı */}
          <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
            <h3 className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-purple-400" />
              İşlem Tipi Dağılımı
            </h3>
            {islemTipData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RePieChart>
                  <Pie
                    data={islemTipData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {islemTipData.map((entry, index) => (
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
                <PieChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">İşlem verisi yok</p>
              </div>
            )}
          </div>
        </div>

        {/* Hareketler Tablosu */}
        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg overflow-hidden`}>
          <div className="p-4 border-b border-gray-800">
            <h3 className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Hizmet Hareketleri
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Tarih</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">İşlem No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Tip</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Cari</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Tarife</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Miktar</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Birim Fiyat</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Tutar</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">KDV</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Toplam</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {hizmetHareketler.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Hareket bulunamadı</p>
                    </td>
                  </tr>
                ) : (
                  hizmetHareketler.map((hareket) => (
                    <tr key={hareket.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        {new Date(hareket.tarih).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-blue-400">
                          {hareket.islemNo}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            hareket.islemTip === "FATURA"
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-400 text-xs"
                              : hareket.islemTip === "KONTRAT"
                              ? "bg-green-500/10 border-green-500/30 text-green-400 text-xs"
                              : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 text-xs"
                          }
                        >
                          {hareket.islemTip}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {hareket.cari || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {hareket.tarife || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        {hareket.miktar}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        {new Intl.NumberFormat("tr-TR", {
                          style: "currency",
                          currency: "TRY",
                        }).format(hareket.birimFiyat)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        {new Intl.NumberFormat("tr-TR", {
                          style: "currency",
                          currency: "TRY",
                        }).format(hareket.tutar)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-gray-400">
                        {new Intl.NumberFormat("tr-TR", {
                          style: "currency",
                          currency: "TRY",
                        }).format(hareket.kdv)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-medium">
                        {new Intl.NumberFormat("tr-TR", {
                          style: "currency",
                          currency: "TRY",
                        }).format(hareket.toplam)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            hareket.durum === "AKTİF"
                              ? "bg-green-500/10 border-green-500/30 text-green-400 text-xs"
                              : hareket.durum === "TAMAMLANDI"
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-400 text-xs"
                              : "bg-red-500/10 border-red-500/30 text-red-400 text-xs"
                          }
                        >
                          {hareket.durum}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {hizmetHareketler.length > 0 && (
                <tfoot className="bg-gray-900 border-t-2 border-gray-700">
                  <tr>
                    <td colSpan={7} className="px-4 py-3 text-right font-medium">
                      TOPLAM:
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      {new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                      }).format(selectedHizmetStats.toplamNet)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-gray-400">
                      {new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                      }).format(selectedHizmetStats.toplamKdv)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-green-400">
                      {new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                      }).format(selectedHizmetStats.toplamGelir)}
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
            <h1 className="text-2xl">Hizmet Yönetimi Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">
              Hizmet kartlarını seçerek detaylı analiz ve raporlama yapın
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onNavigateToHizmetModule}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Package className="w-4 h-4 mr-2" />
            Hizmet Modülü
          </Button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>
                Toplam Hizmet
              </p>
              <p className="text-2xl font-mono">{hizmetStats.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                {hizmetStats.active} aktif, {hizmetStats.passive} pasif
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-400 opacity-50" />
          </div>
        </div>

        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>
                Aktif Hizmet
              </p>
              <p className="text-2xl font-mono text-green-400">
                {hizmetStats.active}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                %{((hizmetStats.active / hizmetStats.total) * 100).toFixed(1)} kullanımda
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400 opacity-50" />
          </div>
        </div>

        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>
                Toplam Tarife
              </p>
              <p className="text-2xl font-mono text-cyan-400">
                {tarifeStats.total}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {tarifeStats.active} aktif, {tarifeStats.passive} pasif
              </p>
            </div>
            <FileText className="w-8 h-8 text-cyan-400 opacity-50" />
          </div>
        </div>

        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>
                Aktif Tarife
              </p>
              <p className="text-2xl font-mono text-purple-400">
                {tarifeStats.active}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                %{((tarifeStats.active / tarifeStats.total) * 100).toFixed(1)} geçerli
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4 mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Arama */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Hizmet Ara</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Kod veya isim..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700"
              />
            </div>
          </div>

          {/* Kategori Filtresi */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Kategori</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm"
            >
              <option value="ALL">Tümü</option>
              {hizmetStats.allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Durum Filtresi */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Durum</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm"
            >
              <option value="ALL">Tümü</option>
              <option value="AKTIF">Aktif</option>
              <option value="PASIF">Pasif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hizmet Kartları Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHizmetler.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>Hizmet bulunamadı</p>
          </div>
        ) : (
          filteredHizmetler.map((hizmet) => (
            <div
              key={hizmet.id}
              onClick={() => setSelectedHizmet(hizmet)}
              className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-5 cursor-pointer hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm text-blue-400">
                      {hizmet.code}
                    </span>
                    <Badge
                      variant={hizmet.is_active ? "default" : "secondary"}
                      className={
                        hizmet.is_active
                          ? "bg-green-500/10 border-green-500/30 text-green-400 text-xs"
                          : "bg-gray-700 text-xs"
                      }
                    >
                      {hizmet.is_active ? "AKTİF" : "PASİF"}
                    </Badge>
                  </div>
                  <h3 className="font-medium mb-2">{hizmet.name}</h3>
                  {hizmet.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                      {hizmet.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Kategori:</span>
                  <Badge className="bg-purple-500/10 border-purple-500/30 text-purple-400 text-xs">
                    {hizmet.category || "Kategori yok"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Birim:</span>
                  <span className="font-mono">{hizmet.unit_type || "-"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">KDV:</span>
                  <span className="font-mono">%{hizmet.vat_rate}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                <Eye className="w-4 h-4 mr-2" />
                Detayları Görüntüle
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Hizmet Kartı Detay Dialog */}
      {selectedHizmet && (
        <HizmetKartiDetay
          service={selectedHizmet}
          onClose={() => setSelectedHizmet(null)}
          onEdit={() => {
            // Edit moduna geçilebilir
            console.log('Edit:', selectedHizmet);
          }}
          onDelete={(service) => {
            console.log('Delete:', service);
            // Silme işlemi sonrası listeyi yenile
            setHizmetler(prev => prev.filter(h => h.id !== service.id));
          }}
          theme={theme}
        />
      )}
    </div>
  );
}