import { useState } from "react";
import { Save, X, DollarSign, Calendar, FileText, Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Theme } from "./ThemeSelector";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { serviceCardMasterData } from "../data/serviceCardData";
import { unitsMasterData } from "../data/unitsData";

interface TarifeKartiGirisProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
}

// SQL price_list şemasına uygun form interface
interface PriceListForm {
  code: string;
  name: string;
  currency: "TRY" | "USD" | "EUR";
  status: "AKTIF" | "PASIF" | "TASLAK";
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  description: string;
}

// SQL price_list_item şemasına uygun interface
interface PriceListItemForm {
  id: string; // Geçici client-side ID
  service_card_id: number | null;
  service_code: string;
  service_name: string;
  unit_name: string;
  vat_code: string;
  unit_price: number;
  min_quantity: number;
  max_quantity: number | null;
  is_active: boolean;
}

export function TarifeKartiGiris({ onNavigateHome, onNavigateBack, theme }: TarifeKartiGirisProps) {
  const [formData, setFormData] = useState<PriceListForm>({
    code: "",
    name: "",
    currency: "TRY",
    status: "TASLAK",
    valid_from: new Date().toISOString().split("T")[0],
    valid_to: "",
    is_active: false,
    description: "",
  });

  const [priceListItems, setPriceListItems] = useState<PriceListItemForm[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [newItemUnitPrice, setNewItemUnitPrice] = useState<string>("0");

  const handleInputChange = (field: keyof PriceListForm, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddPriceListItem = () => {
    if (!selectedServiceId) {
      alert("Lütfen bir hizmet seçin!");
      return;
    }

    const selectedService = serviceCardMasterData.find((s) => s.id === selectedServiceId);
    if (!selectedService) return;

    // Aynı hizmet zaten ekli mi kontrol et
    if (priceListItems.some((item) => item.service_card_id === selectedServiceId)) {
      alert("Bu hizmet zaten tarife kalemlerinde mevcut!");
      return;
    }

    const unit = unitsMasterData.find((u) => u.id === selectedService.unit_id);

    const newItem: PriceListItemForm = {
      id: `temp-${Date.now()}`,
      service_card_id: selectedService.id,
      service_code: selectedService.code,
      service_name: selectedService.name,
      unit_name: unit?.name || "-",
      vat_code: selectedService.vat_code || "0",
      unit_price: parseFloat(newItemUnitPrice),
      min_quantity: 1,
      max_quantity: null,
      is_active: true,
    };

    setPriceListItems([...priceListItems, newItem]);
    setSelectedServiceId(null);
    setNewItemUnitPrice("0");
  };

  const handleRemovePriceListItem = (id: string) => {
    if (confirm("Bu kalemi silmek istediğinizden emin misiniz?")) {
      setPriceListItems(priceListItems.filter((item) => item.id !== id));
    }
  };

  const handleUpdateItemPrice = (id: string, newPrice: string) => {
    setPriceListItems(
      priceListItems.map((item) =>
        item.id === id ? { ...item, unit_price: parseFloat(newPrice) || 0 } : item
      )
    );
  };

  const handleUpdateItemActive = (id: string, isActive: boolean) => {
    setPriceListItems(
      priceListItems.map((item) => (item.id === id ? { ...item, is_active: isActive } : item))
    );
  };

  const handleSave = () => {
    if (!formData.code) {
      alert("Tarife kodu zorunludur!");
      return;
    }
    if (!formData.name) {
      alert("Tarife adı zorunludur!");
      return;
    }
    if (!formData.valid_from) {
      alert("Geçerlilik başlangıç tarihi zorunludur!");
      return;
    }

    const payload = {
      price_list: formData,
      price_list_items: priceListItems.map((item) => ({
        service_card_id: item.service_card_id,
        unit_price: item.unit_price,
        min_quantity: item.min_quantity,
        max_quantity: item.max_quantity,
        is_active: item.is_active,
      })),
    };

    console.log("Yeni Tarife Kaydediliyor (SQL price_list + price_list_item):", payload);
    alert(`Tarife başarıyla kaydedildi!\n${priceListItems.length} kalem eklendi.`);

    // Reset form
    setFormData({
      code: "",
      name: "",
      currency: "TRY",
      status: "TASLAK",
      valid_from: new Date().toISOString().split("T")[0],
      valid_to: "",
      is_active: false,
      description: "",
    });
    setPriceListItems([]);
  };

  const handleReset = () => {
    if (confirm("Tüm alanları temizlemek istediğinizden emin misiniz?")) {
      setFormData({
        code: "",
        name: "",
        currency: "TRY",
        status: "TASLAK",
        valid_from: new Date().toISOString().split("T")[0],
        valid_to: "",
        is_active: false,
        description: "",
      });
      setPriceListItems([]);
      setSelectedServiceId(null);
      setNewItemUnitPrice("0");
    }
  };

  const calculateTotalPrice = () => {
    return priceListItems.reduce((sum, item) => sum + (item.is_active ? item.unit_price : 0), 0);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl mb-1">Yeni Tarife Kartı</h2>
            <p className={theme.colors.textMuted}>Yeni tarife oluştur ve kalemleri tanımla (SQL: price_list)</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Sol Blok - Genel Bilgiler */}
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <h3 className="flex items-center gap-2 mb-5">
              <FileText className="w-5 h-5 text-blue-400" />
              Genel Bilgiler
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Tarife Kodu *
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                  placeholder="2025-MB-YILLIK-TRY"
                  className="bg-gray-800/50 border-gray-700 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Tarife Adı *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="2025 Motorbot Yıllık Tarife (TRY)"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  required
                />
              </div>

              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Para Birimi *
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange("currency", e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5"
                  required
                >
                  <option value="TRY">TRY - Türk Lirası</option>
                  <option value="USD">USD - Amerikan Doları</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>

              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Açıklama
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Tarife hakkında detaylı açıklama..."
                  className="bg-gray-800/50 border-gray-700 text-white text-sm min-h-[120px]"
                />
              </div>
            </div>
          </div>

          {/* Orta Blok - Durum & Geçerlilik */}
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <h3 className="flex items-center gap-2 mb-5">
              <Calendar className="w-5 h-5 text-green-400" />
              Durum & Geçerlilik
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Durum
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5"
                >
                  <option value="TASLAK">TASLAK</option>
                  <option value="AKTIF">AKTİF</option>
                  <option value="PASIF">PASİF</option>
                </select>
              </div>

              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block flex items-center gap-1`}>
                  Aktif
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange("is_active", e.target.checked)}
                    className="ml-2"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.is_active ? "Tarife şu an kullanımda" : "Tarife kullanımda değil"}
                </p>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Geçerlilik Başlangıç *
                </label>
                <Input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => handleInputChange("valid_from", e.target.value)}
                  className="bg-gray-800/50 border-gray-700 text-white"
                  required
                />
              </div>

              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Geçerlilik Bitiş
                </label>
                <Input
                  type="date"
                  value={formData.valid_to}
                  onChange={(e) => handleInputChange("valid_to", e.target.value)}
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Boş bırakılırsa süresiz geçerlidir
                </p>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <label className={`text-xs ${theme.colors.textMuted} mb-3 block`}>
                  Özet Bilgi
                </label>
                <div className="space-y-2 p-3 bg-gray-800/30 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kod:</span>
                    <span className="font-mono text-blue-400">{formData.code || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Para:</span>
                    <Badge variant="outline" className="border-gray-600">
                      {formData.currency}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Durum:</span>
                    <Badge
                      variant="outline"
                      className={
                        formData.status === "AKTIF"
                          ? "border-green-500/30 text-green-400"
                          : formData.status === "TASLAK"
                          ? "border-yellow-500/30 text-yellow-400"
                          : "border-gray-600"
                      }
                    >
                      {formData.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kalem:</span>
                    <span className="text-green-400">{priceListItems.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Blok - Kalem Ekleme */}
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <h3 className="flex items-center gap-2 mb-5">
              <Plus className="w-5 h-5 text-orange-400" />
              Yeni Kalem Ekle
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Hizmet Kartı Seç
                </label>
                <select
                  value={selectedServiceId || ""}
                  onChange={(e) => setSelectedServiceId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                >
                  <option value="">-- Hizmet seçin --</option>
                  {serviceCardMasterData
                    .filter((s) => s.is_active)
                    .map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.code} - {service.name}
                      </option>
                    ))}
                </select>
              </div>

              {selectedServiceId && (
                <>
                  <div className="p-3 bg-blue-950/20 border border-blue-800/30 rounded-lg text-xs">
                    {(() => {
                      const service = serviceCardMasterData.find((s) => s.id === selectedServiceId);
                      if (!service) return null;
                      return (
                        <>
                          <div className="mb-1">
                            <strong>Kod:</strong> {service.code}
                          </div>
                          <div className="mb-1">
                            <strong>Birim:</strong> {service.unit || "-"}
                          </div>
                          <div>
                            <strong>KDV:</strong> %{service.vat_code || "0"}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div>
                    <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                      Birim Fiyat
                    </label>
                    <Input
                      type="number"
                      value={newItemUnitPrice}
                      onChange={(e) => setNewItemUnitPrice(e.target.value)}
                      placeholder="0.00"
                      className="bg-gray-800/50 border-gray-700 text-white"
                      step="0.01"
                    />
                  </div>

                  <Button
                    onClick={handleAddPriceListItem}
                    className="w-full bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Kaleme Ekle
                  </Button>
                </>
              )}

              <div className="border-t border-gray-800 pt-4">
                <div className="p-3 bg-yellow-950/20 border border-yellow-800/30 rounded-lg text-xs text-gray-400">
                  <AlertCircle className="inline w-4 h-4 mr-1 text-yellow-400" />
                  Tarife kalemleri aşağıdaki grid'de yönetilir.
                </div>
              </div>

              <div className="text-xs text-gray-500 p-3 bg-blue-950/20 border border-blue-800/30 rounded-lg">
                <p className="mb-1">
                  ✓ SQL Tablo: <code className="text-blue-400">price_list_item</code>
                </p>
                <p>✓ İlişkili: service_card, units</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tarife Kalemleri Grid */}
        <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Tarife Kalemleri ({priceListItems.length})
            </h3>
            <div className="text-sm text-gray-400">
              Toplam Fiyat:{" "}
              <span className="text-green-400 font-mono">
                {calculateTotalPrice().toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {formData.currency}
              </span>
            </div>
          </div>

          {priceListItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Henüz tarife kalemi eklenmedi</p>
              <p className="text-xs mt-1">Yukarıdan hizmet seçerek kalem ekleyebilirsiniz</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="text-gray-400">Hizmet Kodu</TableHead>
                    <TableHead className="text-gray-400">Hizmet Adı</TableHead>
                    <TableHead className="text-gray-400">Birim</TableHead>
                    <TableHead className="text-gray-400">Birim Fiyat</TableHead>
                    <TableHead className="text-gray-400">KDV</TableHead>
                    <TableHead className="text-gray-400">Durum</TableHead>
                    <TableHead className="text-gray-400 text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceListItems.map((item) => (
                    <TableRow key={item.id} className="border-gray-800 hover:bg-gray-800/30">
                      <TableCell className="font-mono text-sm text-blue-400">
                        {item.service_code}
                      </TableCell>
                      <TableCell className="font-medium">{item.service_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-gray-600">
                          {item.unit_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleUpdateItemPrice(item.id, e.target.value)}
                          className="w-32 bg-gray-800/50 border-gray-700 text-white text-sm"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell className="text-sm">%{item.vat_code}</TableCell>
                      <TableCell>
                        <select
                          value={item.is_active ? "ACTIVE" : "PASSIVE"}
                          onChange={(e) => handleUpdateItemActive(item.id, e.target.value === "ACTIVE")}
                          className="bg-gray-800/50 border border-gray-700 text-white rounded-md px-2 py-1 text-sm"
                        >
                          <option value="ACTIVE">Aktif</option>
                          <option value="PASSIVE">Pasif</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePriceListItem(item.id)}
                          className="text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Bottom Info */}
        <div className={`mt-6 p-4 ${theme.colors.bgCard} border ${theme.colors.border} rounded-lg`}>
          <p className="text-sm text-gray-500">
            <span className="text-red-400">*</span> ile işaretli alanlar zorunludur.
          </p>
        </div>
      </div>
    </div>
  );
}
