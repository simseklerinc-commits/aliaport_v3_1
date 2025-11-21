import { useState, useEffect } from "react";
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Theme } from "../ThemeSelector";
import { parametreApi, PARAMETRE_KATEGORILER, type Parametre, type ParametreCreate, type ParametreUpdate } from "../../lib/api/parametre";
import { toast } from "sonner";

interface ParametreModuleProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
}

const KATEGORILER = [
  { kod: PARAMETRE_KATEGORILER.BIRIM, ad: "Birimler", icon: "📏", description: "Ölçü birimleri (ADET, GRT, SAAT, vb.)" },
  { kod: PARAMETRE_KATEGORILER.KDV, ad: "KDV Oranları", icon: "💰", description: "KDV oranları (%0, %10, %20)" },
  { kod: PARAMETRE_KATEGORILER.ESIK, ad: "Eşik Değerler", icon: "⚠️", description: "Sistem eşik değerleri" },
  { kod: PARAMETRE_KATEGORILER.GENEL, ad: "Genel", icon: "⚙️", description: "Diğer parametreler" },
];

export function ParametreModule({ onNavigateHome, onNavigateBack, theme }: ParametreModuleProps) {
  const [selectedKategori, setSelectedKategori] = useState<string>(PARAMETRE_KATEGORILER.BIRIM);
  const [parametreler, setParametreler] = useState<Parametre[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ParametreCreate>({
    Kategori: selectedKategori,
    Kod: "",
    Ad: "",
    Deger: "",
    Aciklama: "",
    AktifMi: true,
  });

  // Parametreleri yükle
  const loadParametreler = async () => {
    setLoading(true);
    try {
      const response = await parametreApi.getByCategory(selectedKategori, showInactive);
      setParametreler(response);
    } catch (error) {
      console.error("Parametreler yüklenemedi:", error);
      toast.error("Parametreler yüklenemedi", {
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
      });
      setParametreler([]);
    } finally {
      setLoading(false);
    }
  };

  // Kategori veya showInactive değiştiğinde yeniden yükle
  useEffect(() => {
    loadParametreler();
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      Kategori: selectedKategori,
      Kod: "",
      Ad: "",
      Deger: "",
      Aciklama: "",
      AktifMi: true,
    });
  }, [selectedKategori, showInactive]);

  // Arama filtresi
  const filteredParametreler = parametreler.filter(
    (p) =>
      p.Kod.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.Ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.Deger && p.Deger.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Yeni kayıt formu aç
  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      Kategori: selectedKategori,
      Kod: "",
      Ad: "",
      Deger: "",
      Aciklama: "",
      AktifMi: true,
    });
  };

  // Düzenleme formu aç
  const handleEdit = (parametre: Parametre) => {
    setIsCreating(false);
    setEditingId(parametre.Id);
    setFormData({
      Kategori: parametre.Kategori,
      Kod: parametre.Kod,
      Ad: parametre.Ad,
      Deger: parametre.Deger || "",
      Aciklama: parametre.Aciklama || "",
      AktifMi: parametre.AktifMi,
    });
  };

  // Form kaydet
  const handleSave = async () => {
    if (!formData.Kod || !formData.Ad) {
      toast.error("Eksik bilgi", {
        description: "Kod ve Ad alanları zorunludur",
      });
      return;
    }

    setLoading(true);
    try {
      if (isCreating) {
        // Yeni kayıt
        await parametreApi.create(formData);
        toast.success("Parametre eklendi");
      } else if (editingId) {
        // Güncelleme
        await parametreApi.update(editingId, formData as ParametreUpdate);
        toast.success("Parametre güncellendi");
      }

      await loadParametreler();
      setIsCreating(false);
      setEditingId(null);
      setFormData({
        Kategori: selectedKategori,
        Kod: "",
        Ad: "",
        Deger: "",
        Aciklama: "",
        AktifMi: true,
      });
    } catch (error: any) {
      console.error("Parametre kaydedilemedi:", error);
      toast.error("Parametre kaydedilemedi", {
        description: error?.message || "Bilinmeyen hata",
      });
    } finally {
      setLoading(false);
    }
  };

  // Silme (soft delete - pasif yap)
  const handleDelete = async (id: number, kod: string) => {
    if (!confirm(`${kod} kodlu parametreyi pasif hale getirmek istediğinizden emin misiniz?`)) {
      return;
    }

    setLoading(true);
    try {
      await parametreApi.delete(id);
      toast.success("Parametre pasif hale getirildi");
      await loadParametreler();
    } catch (error: any) {
      console.error("Parametre pasif yapılamadı:", error);
      toast.error("Parametre pasif yapılamadı", {
        description: error?.message || "Bilinmeyen hata",
      });
    } finally {
      setLoading(false);
    }
  };

  // Aktif/Pasif toggle
  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    setLoading(true);
    try {
      await parametreApi.toggleActive(id);
      toast.success(currentStatus ? "Parametre pasif hale getirildi" : "Parametre aktif hale getirildi");
      await loadParametreler();
    } catch (error: any) {
      console.error("Durum değiştirilemedi:", error);
      toast.error("Durum değiştirilemedi", {
        description: error?.message || "Bilinmeyen hata",
      });
    } finally {
      setLoading(false);
    }
  };

  // Form iptal
  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      Kategori: selectedKategori,
      Kod: "",
      Ad: "",
      Deger: "",
      Aciklama: "",
      AktifMi: true,
    });
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNavigateBack}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl mb-1 flex items-center gap-3">
              <Settings className="w-8 h-8 text-purple-400" />
              Parametreler
            </h1>
            <p className={theme.colors.textMuted}>Sistem parametreleri ve konfigürasyon</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sol Panel - Kategori Seçimi */}
        <div className="col-span-3">
          <Card className={`${theme.colors.bgCard} border ${theme.colors.border}`}>
            <CardHeader>
              <CardTitle className="text-sm">Kategoriler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {KATEGORILER.map((kategori) => (
                <button
                  key={kategori.kod}
                  onClick={() => setSelectedKategori(kategori.kod)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedKategori === kategori.kod
                      ? "bg-purple-500/20 border border-purple-500/50"
                      : "bg-gray-800/30 border border-gray-700/50 hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{kategori.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{kategori.ad}</div>
                      <div className="text-xs text-gray-400">{kategori.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sağ Panel - Parametre Listesi ve Form */}
        <div className="col-span-9 space-y-6">
          {/* Form Card (Yeni Kayıt veya Düzenleme) */}
          {(isCreating || editingId) && (
            <Card className={`${theme.colors.bgCard} border ${theme.colors.border}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isCreating ? <Plus className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                  {isCreating ? "Yeni Parametre" : "Parametreyi Düzenle"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                      Kod *
                    </label>
                    <Input
                      value={formData.Kod}
                      onChange={(e) =>
                        setFormData({ ...formData, Kod: e.target.value.toUpperCase() })
                      }
                      placeholder="ADET"
                      className="bg-gray-800/50 border-gray-700 text-white font-mono"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Ad *</label>
                    <Input
                      value={formData.Ad}
                      onChange={(e) => setFormData({ ...formData, Ad: e.target.value })}
                      placeholder="Adet"
                      className="bg-gray-800/50 border-gray-700 text-white"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Değer</label>
                  <Input
                    value={formData.Deger}
                    onChange={(e) => setFormData({ ...formData, Deger: e.target.value })}
                    placeholder="Parametre değeri"
                    className="bg-gray-800/50 border-gray-700 text-white"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Açıklama</label>
                  <Textarea
                    value={formData.Aciklama}
                    onChange={(e) => setFormData({ ...formData, Aciklama: e.target.value })}
                    placeholder="Parametre açıklaması..."
                    className="bg-gray-800/50 border-gray-700 text-white text-sm min-h-[80px]"
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="aktif"
                    checked={formData.AktifMi}
                    onChange={(e) => setFormData({ ...formData, AktifMi: e.target.checked })}
                    className="w-4 h-4"
                    disabled={loading}
                  />
                  <label htmlFor="aktif" className="text-sm cursor-pointer">
                    Aktif
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Kaydet
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={loading}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4 mr-2" />
                    İptal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Liste Card */}
          <Card className={`${theme.colors.bgCard} border ${theme.colors.border}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {KATEGORILER.find((k) => k.kod === selectedKategori)?.ad}
                  </CardTitle>
                  <CardDescription>
                    {filteredParametreler.length} parametre
                  </CardDescription>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Ara..."
                      className="pl-10 bg-gray-800/50 border-gray-700 text-white w-64"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-3 bg-gray-800/30 border border-gray-700 rounded-md">
                    <input
                      type="checkbox"
                      id="showInactive"
                      checked={showInactive}
                      onChange={(e) => setShowInactive(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="showInactive" className="text-sm cursor-pointer whitespace-nowrap">
                      Pasif olanları da göster
                    </label>
                  </div>
                  <Button
                    onClick={handleCreate}
                    disabled={loading || isCreating}
                    className="bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-400">Yükleniyor...</div>
              ) : filteredParametreler.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {searchTerm ? "Sonuç bulunamadı" : "Henüz parametre eklenmemiş"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">KOD</TableHead>
                      <TableHead className="text-gray-400">AD</TableHead>
                      <TableHead className="text-gray-400">DEĞER</TableHead>
                      <TableHead className="text-gray-400">AÇIKLAMA</TableHead>
                      <TableHead className="text-gray-400 text-center">AKTİF</TableHead>
                      <TableHead className="text-gray-400 text-right">İŞLEM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParametreler.map((parametre) => (
                      <TableRow
                        key={parametre.Id}
                        className={`border-gray-800 ${
                          editingId === parametre.Id ? "bg-purple-500/10" : ""
                        }`}
                      >
                        <TableCell className="font-mono text-sm">
                          {parametre.Kod}
                        </TableCell>
                        <TableCell>{parametre.Ad}</TableCell>
                        <TableCell className="font-mono text-sm text-blue-400">
                          {parametre.Deger || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-400 max-w-xs truncate">
                          {parametre.Aciklama || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => handleToggleActive(parametre.Id, parametre.AktifMi)}
                            disabled={loading}
                            className="mx-auto hover:opacity-70 transition-opacity"
                          >
                            {parametre.AktifMi ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(parametre)}
                              disabled={loading}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            {parametre.AktifMi && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(parametre.Id, parametre.Kod)}
                                disabled={loading}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
