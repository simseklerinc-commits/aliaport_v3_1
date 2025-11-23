// HİZMET YÖNETİMİ DASHBOARD - CariEkstre yapısına benzer
import { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { hizmetApi } from "../lib/api/hizmet";
import { tarifeApi } from "../lib/api/tarife";
import { toast } from "sonner";
import {
  ArrowLeft,
  Package,
  TrendingUp,
  FileText,
  Search,
  Activity,
  BarChart3,
  PieChart,
  Layers,
} from "lucide-react";
import { Theme } from "./ThemeSelector";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
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

interface ServiceCard {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  is_active: boolean;
  created_at: string;
}

interface PriceList {
  id: number;
  code: string;
  name: string;
  currency: string;
  is_active: boolean;
}

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
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AKTIF" | "PASIF">("ALL");
  const [activeTab, setActiveTab] = useState("list");
  const [selectedHizmet, setSelectedHizmet] = useState<ServiceCard | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hizmetResponse, tarifeResponse] = await Promise.all([
          hizmetApi.getAll(),
          tarifeApi.getAll(),
        ]);
        
        // Backend PascalCase → Frontend snake_case mapping
        const mappedHizmetler = (Array.isArray(hizmetResponse) ? hizmetResponse : []).map((h: any) => ({
          id: h.Id,
          code: h.Kod,
          name: h.Ad,
          description: h.Aciklama,
          category: h.GrupKod || "Kategori yok",
          unit: h.Birim,
          is_active: h.AktifMi,
          created_at: h.CreatedAt,
        }));
        
        setHizmetler(mappedHizmetler);
        setTarifeler(tarifeResponse.items || []);
      } catch (error) {
        console.error("Veri yükleme hatası:", error);
        toast.error("Veriler yüklenirken hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalHizmet = hizmetler.length;
    const activeHizmet = hizmetler.filter((h) => h.is_active).length;
    const passiveHizmet = totalHizmet - activeHizmet;
    const totalTarife = tarifeler.length;
    const activeTarife = tarifeler.filter((t) => t.is_active).length;

    const categoryCount: { [key: string]: number } = {};
    hizmetler.forEach((h) => {
      const cat = h.category || "Diğer";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const categories = Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalHizmet,
      activeHizmet,
      passiveHizmet,
      totalTarife,
      activeTarife,
      categories,
      allCategories: Object.keys(categoryCount).sort(),
    };
  }, [hizmetler, tarifeler]);

  const filteredHizmetler = useMemo(() => {
    return hizmetler.filter((h) => {
      const matchesSearch =
        (h.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (h.code?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "ALL" || h.category === categoryFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "AKTIF" && h.is_active) ||
        (statusFilter === "PASIF" && !h.is_active);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [hizmetler, searchTerm, categoryFilter, statusFilter]);

  const categoryColors = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"];

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.colors.bg} ${theme.colors.text} p-6 flex items-center justify-center`}>
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-400" />
          <p className="text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.colors.bg} ${theme.colors.text} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onNavigateBack} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Hizmet Yönetimi Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">
              Hizmet ve tarife istatistikleri · Kategori analizi · Detaylı raporlama
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onNavigateToHizmetModule} className="bg-blue-600 hover:bg-blue-700">
            <Package className="w-4 h-4 mr-2" />
            Hizmet Kartları
          </Button>
          <Button onClick={onNavigateTotarifeModule} variant="outline" className="border-gray-700">
            <FileText className="w-4 h-4 mr-2" />
            Tarife Yönetimi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Toplam Hizmet</p>
              <p className="text-2xl font-mono">{stats.totalHizmet}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.activeHizmet} aktif, {stats.passiveHizmet} pasif</p>
            </div>
            <Package className="w-8 h-8 text-blue-400 opacity-50" />
          </div>
        </div>

        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Aktif Hizmet</p>
              <p className="text-2xl font-mono text-green-400">{stats.activeHizmet}</p>
              <p className="text-xs text-gray-500 mt-1">
                %{stats.totalHizmet > 0 ? ((stats.activeHizmet / stats.totalHizmet) * 100).toFixed(1) : 0} kullanımda
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400 opacity-50" />
          </div>
        </div>

        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Toplam Tarife</p>
              <p className="text-2xl font-mono text-cyan-400">{stats.totalTarife}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.activeTarife} aktif fiyat listesi</p>
            </div>
            <FileText className="w-8 h-8 text-cyan-400 opacity-50" />
          </div>
        </div>

        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Kategori Sayısı</p>
              <p className="text-2xl font-mono text-purple-400">{stats.categories.length}</p>
              <p className="text-xs text-gray-500 mt-1">Hizmet grupları</p>
            </div>
            <Layers className="w-8 h-8 text-purple-400 opacity-50" />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-900">
          <TabsTrigger value="list">Hizmet Listesi</TabsTrigger>
          <TabsTrigger value="overview">Kategori Analizi</TabsTrigger>
        </TabsList>

        {/* Hizmet Listesi - İlk Sekme */}
        <TabsContent value="list" className="space-y-6">
          {selectedHizmet ? (
            // Detay Görünümü
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedHizmet(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Listeye Dön
                </Button>
              </div>

              <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold">{selectedHizmet.name}</h2>
                      <Badge variant={selectedHizmet.is_active ? "default" : "secondary"} className={selectedHizmet.is_active ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-gray-700"}>
                        {selectedHizmet.is_active ? "AKTİF" : "PASİF"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">Kod: <span className="font-mono text-blue-400">{selectedHizmet.code}</span></p>
                  </div>
                  <Badge className="bg-purple-500/10 border-purple-500/30 text-purple-400">
                    {selectedHizmet.category}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`${theme.colors.bgHover} p-4 rounded-lg`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-400">Birim</span>
                    </div>
                    <p className="text-lg font-semibold">{selectedHizmet.unit || "-"}</p>
                  </div>

                  <div className={`${theme.colors.bgHover} p-4 rounded-lg`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-400">Kategori</span>
                    </div>
                    <p className="text-lg font-semibold">{selectedHizmet.category}</p>
                  </div>

                  <div className={`${theme.colors.bgHover} p-4 rounded-lg`}>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-400">Oluşturulma</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {selectedHizmet.created_at ? new Date(selectedHizmet.created_at).toLocaleDateString("tr-TR") : "-"}
                    </p>
                  </div>
                </div>

                {selectedHizmet.description && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Açıklama</h3>
                    <p className="text-sm text-gray-300">{selectedHizmet.description}</p>
                  </div>
                )}
              </div>

              {/* İstatistikler ve Kullanım Geçmişi */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
                  <h3 className="flex items-center gap-2 mb-4 font-medium">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Kullanım İstatistikleri
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                      <span className="text-sm text-gray-400">Toplam Kullanım</span>
                      <span className="font-semibold">-</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                      <span className="text-sm text-gray-400">Son 30 Gün</span>
                      <span className="font-semibold">-</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-400">Bu Ay</span>
                      <span className="font-semibold">-</span>
                    </div>
                  </div>
                </div>

                <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
                  <h3 className="flex items-center gap-2 mb-4 font-medium">
                    <Layers className="w-5 h-5 text-blue-400" />
                    Hizmet Bilgileri
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                      <span className="text-sm text-gray-400">Hizmet ID</span>
                      <span className="font-mono text-sm">{selectedHizmet.id}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                      <span className="text-sm text-gray-400">Durum</span>
                      <span className="text-sm">{selectedHizmet.is_active ? "Aktif" : "Pasif"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-400">Kayıt Tarihi</span>
                      <span className="text-sm">
                        {selectedHizmet.created_at ? new Date(selectedHizmet.created_at).toLocaleDateString("tr-TR") : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Liste Görünümü
            <>
              {/* Filtreler */}
              <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div>
                <label className="text-xs text-gray-400 mb-2 block">Kategori</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm">
                  <option value="ALL">Tümü</option>
                  {stats.allCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">Durum</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm">
                  <option value="ALL">Tümü</option>
                  <option value="AKTIF">Aktif</option>
                  <option value="PASIF">Pasif</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hizmet Tablosu */}
          <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900 border-b border-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Durum</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Kod</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Hizmet Adı</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Kategori</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Birim</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Oluşturulma</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredHizmetler.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Hizmet bulunamadı</p>
                      </td>
                    </tr>
                  ) : (
                    filteredHizmetler.map((hizmet) => (
                      <tr 
                        key={hizmet.id} 
                        className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedHizmet(hizmet)}
                      >
                        <td className="px-4 py-3">
                          <Badge variant={hizmet.is_active ? "default" : "secondary"} className={hizmet.is_active ? "bg-green-500/10 border-green-500/30 text-green-400 text-xs" : "bg-gray-700 text-xs"}>
                            {hizmet.is_active ? "AKTİF" : "PASİF"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-blue-400">{hizmet.code}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{hizmet.name}</p>
                            {hizmet.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{hizmet.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-purple-500/10 border-purple-500/30 text-purple-400 text-xs">
                            {hizmet.category || "Kategori yok"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">{hizmet.unit || "-"}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {hizmet.created_at ? new Date(hizmet.created_at).toLocaleDateString("tr-TR") : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setSelectedHizmet(hizmet);
                            }}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          >
                            Detay
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
            </>
          )}
        </TabsContent>

        {/* Kategori Analizi - İkinci Sekme */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
              <h3 className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-purple-400" />
                Kategori Dağılımı
              </h3>
              {stats.categories.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <RePieChart>
                    <Pie
                      data={stats.categories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      dataKey="count"
                    >
                      {stats.categories.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }} />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <PieChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Kategori verisi yok</p>
                </div>
              )}
            </div>

            <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
              <h3 className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Kategorilere Göre Hizmet Sayısı
              </h3>
              {stats.categories.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stats.categories}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }} />
                    <Legend />
                    <Bar dataKey="count" fill="#3B82F6" name="Hizmet Sayısı" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Kategori verisi yok</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
