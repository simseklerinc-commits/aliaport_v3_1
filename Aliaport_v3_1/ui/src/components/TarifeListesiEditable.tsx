import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Download, Upload, ChevronDown, DollarSign, RefreshCw, FileSpreadsheet, Save, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Theme } from "./ThemeSelector";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { priceListMasterData, PriceList, priceListItemMasterData } from "../data/priceListData";
import { serviceCardMasterData } from "../data/serviceCardData";
import { currencyMasterData } from "../data/parametersData";

interface TarifeListesiProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  onNavigateToTarifeGiris?: () => void;
  theme: Theme;
}

export function TarifeListesiEditable({
  onNavigateHome,
  onNavigateBack,
  onNavigateToTarifeGiris,
  theme,
}: TarifeListesiProps) {
  // Seçili tarife
  const [selectedPriceListId, setSelectedPriceListId] = useState<number>(1);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Düzenleme State - KALDIRILDI (Artık read-only)
  // const [editedRows, setEditedRows] = useState<Record<number, any>>({});
  
  // Tarife Güncelle Modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    sourcePriceListId: 1, // Kaynak tarife seçimi
    validFrom: "",
    validTo: "",
    updateType: "PERCENTAGE",
    value: "",
    status: "TASLAK",
  });

  // Excel Modal
  const [showExcelModal, setShowExcelModal] = useState(false);

  // Dropdown dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Seçili tarife
  const selectedPriceList = useMemo(() => {
    return priceListMasterData.find(p => p.id === selectedPriceListId);
  }, [selectedPriceListId]);

  // Tarifeye göre aktif/pasif kontrolü
  const isPriceListActive = (priceList: PriceList) => {
    const today = new Date();
    const validFrom = new Date(priceList.valid_from);
    const validTo = priceList.valid_to ? new Date(priceList.valid_to) : null;

    if (today < validFrom) return false;
    if (validTo && today > validTo) return false;

    return true;
  };

  // Tarifeleri grupla
  const groupedPriceLists = useMemo(() => {
    const aktif = priceListMasterData.filter(p => p.status === "AKTIF");
    const taslak = priceListMasterData.filter(p => p.status === "TASLAK");
    const pasif = priceListMasterData.filter(p => p.status === "PASIF");

    return { aktif, taslak, pasif };
  }, []);

  // TÜM HİZMET KARTLARINI listele (AKTİF + PASİF)
  const priceListRows = useMemo(() => {
    return serviceCardMasterData.map(serviceCard => {
      const existingItem = priceListItemMasterData.find(
        item => item.price_list_id === selectedPriceListId && item.service_card_id === serviceCard.id
      );

      const rowKey = serviceCard.id;
      const edited = editedRows[rowKey];

      return {
        id: existingItem?.id || 0,
        serviceCardId: serviceCard.id,
        serviceCode: serviceCard.code,
        serviceName: serviceCard.name,
        unit: serviceCard.unit || "-",
        vatRate: serviceCard.vat_rate,
        isServiceActive: serviceCard.is_active,
        currency: edited?.currency || existingItem?.currency || "TRY",
        unitPrice: edited?.unitPrice !== undefined ? edited.unitPrice : (existingItem?.unit_price || 0),
        hasPrice: !!existingItem && existingItem.unit_price > 0,
      };
    });
  }, [selectedPriceListId, editedRows]);

  const handleCellEdit = (serviceCardId: number, field: string, value: any) => {
    setEditedRows(prev => ({
      ...prev,
      [serviceCardId]: {
        ...prev[serviceCardId],
        [field]: value,
      }
    }));
  };

  const handleSaveAll = () => {
    // Fiyatsız satır kontrolü (SADECE AKTİF hizmetler için)
    const activeRows = priceListRows.filter(row => row.isServiceActive);
    const emptyPrices = activeRows.filter(row => !row.unitPrice || row.unitPrice <= 0);
    
    if (emptyPrices.length > 0) {
      alert(`⚠️ UYARI: ${emptyPrices.length} aktif hizmet için fiyat girilmedi!\n\nFiyatsız geçilmesine izin verilmiyor.\n\nLütfen tüm aktif hizmetler için fiyat girin.`);
      return;
    }

    let message = `✅ Tarife Kaydedildi!\n\n`;
    message += `Tarife: ${selectedPriceList?.name}\n`;
    message += `Toplam Hizmet: ${activeRows.length}\n\n`;
    message += `Değişiklikler:\n`;
    message += `${Object.keys(editedRows).length} satır güncellendi.`;
    
    alert(message);
    setEditedRows({});
  };

  const handleExcelExport = () => {
    setShowExcelModal(true);
  };

  const handleExcelImport = () => {
    alert("📥 Excel İçe Aktarma:\n\n1. Tarife seçin\n2. Exceli yükleyin\n3. Sistem verileri eşleştirir\n4. Önizleme yapıp kaydedin");
  };

  const handleUpdateTarife = () => {
    if (!updateData.validFrom) {
      alert("⚠️ Lütfen başlangıç tarihi seçin!");
      return;
    }

    const sourcePriceList = priceListMasterData.find(p => p.id === updateData.sourcePriceListId);
    const newTarifeName = `${updateData.validFrom} Tarife (${updateData.status === "TASLAK" ? "Taslak" : "Onaylı"})`;

    alert(`✅ Tarife ${updateData.status === "TASLAK" ? "Taslak" : "Onaylı Tarife"} Oluşturuldu!\n\nKaynak: ${sourcePriceList?.name}\nYeni Tarife: ${newTarifeName}\nBaşlangıç: ${updateData.validFrom}\nBitiş: ${updateData.validTo || "Süresiz"}\n\nTaslak tarifeleri dropdown'da "Taslaklar" bölümünde bulabilirsiniz.`);
    
    setShowUpdateModal(false);
    setUpdateData({
      sourcePriceListId: 1,
      validFrom: "",
      validTo: "",
      updateType: "PERCENTAGE",
      value: "",
      status: "TASLAK",
    });
  };

  const handleExcelExportConfirm = () => {
    alert(`📤 Excel Dışa Aktarım Başladı!\n\n${selectedPriceList?.name}\n${priceListRows.length} satır Excel formatında indiriliyor...`);
    setShowExcelModal(false);
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "TRY": return "₺";
      case "USD": return "$";
      case "EUR": return "€";
      case "GBP": return "£";
      default: return currency;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AKTIF":
        return <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">AKTİF</Badge>;
      case "TASLAK":
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">TASLAK</Badge>;
      case "PASIF":
        return <Badge variant="outline" className="bg-gray-700 text-gray-400">PASİF</Badge>;
      default:
        return null;
    }
  };

  // Aktif hizmetler vs tüm hizmetler
  const activeServiceCount = priceListRows.filter(r => r.isServiceActive).length;
  const emptyPriceCount = priceListRows.filter(r => r.isServiceActive && (!r.unitPrice || r.unitPrice <= 0)).length;

  return (
    <div className="p-6">
      <div className="max-w-[95%] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl mb-1">Tarife Listesi</h2>
            <p className={theme.colors.textMuted}>
              Tarih bazlı fiyat listeleri - Her tarife bir Excel tablosu gibi
            </p>
          </div>
        </div>

        {/* Tarife Seçici ve Aksiyonlar */}
        <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-4 mb-6`}>
          <div className="flex items-center justify-between gap-4">
            {/* Tarife Dropdown */}
            <div className="flex-1 relative" ref={dropdownRef}>
              <Label className="text-sm text-gray-400 mb-2 block">Tarife Seçin</Label>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-md px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <div className="font-medium">
                      {selectedPriceList?.valid_from} → {selectedPriceList?.valid_to || "Süresiz"} • {selectedPriceList?.currency}
                    </div>
                    <div className="text-xs text-gray-500">{selectedPriceList?.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedPriceList?.status || "")}
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </button>

              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-[500px] overflow-y-auto">
                  {/* AKTİF TARİFELER */}
                  {groupedPriceLists.aktif.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-semibold text-green-400">AKTİF TARİFELER</span>
                      </div>
                      {groupedPriceLists.aktif.map(priceList => (
                        <button
                          key={priceList.id}
                          onClick={() => {
                            setSelectedPriceListId(priceList.id);
                            setShowDropdown(false);
                            setEditedRows({});
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800 ${
                            priceList.id === selectedPriceListId ? "bg-gray-800/50" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {priceList.valid_from} → {priceList.valid_to || "Süresiz"} • {priceList.currency}
                              </div>
                              <div className="text-xs text-gray-500">{priceList.name}</div>
                            </div>
                            {getStatusBadge(priceList.status)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* TASLAK TARİFELER */}
                  {groupedPriceLists.taslak.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-semibold text-orange-400">TASLAKLAR</span>
                      </div>
                      {groupedPriceLists.taslak.map(priceList => (
                        <button
                          key={priceList.id}
                          onClick={() => {
                            setSelectedPriceListId(priceList.id);
                            setShowDropdown(false);
                            setEditedRows({});
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800 ${
                            priceList.id === selectedPriceListId ? "bg-gray-800/50" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {priceList.valid_from} → {priceList.valid_to || "Süresiz"} • {priceList.currency}
                              </div>
                              <div className="text-xs text-gray-500">{priceList.name}</div>
                            </div>
                            {getStatusBadge(priceList.status)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* PASİF TARİFELER */}
                  {groupedPriceLists.pasif.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700">
                        <span className="text-xs font-semibold text-gray-500">PASİF TARİFELER</span>
                      </div>
                      {groupedPriceLists.pasif.map(priceList => (
                        <button
                          key={priceList.id}
                          onClick={() => {
                            setSelectedPriceListId(priceList.id);
                            setShowDropdown(false);
                            setEditedRows({});
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-b-0 ${
                            priceList.id === selectedPriceListId ? "bg-gray-800/50" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-400">
                                {priceList.valid_from} → {priceList.valid_to || "Süresiz"} • {priceList.currency}
                              </div>
                              <div className="text-xs text-gray-600">{priceList.name}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Aksiyonlar */}
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={handleExcelImport}
                className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
              >
                <Upload className="w-4 h-4 mr-2" />
                Excel İçe Aktar
              </Button>
              <Button
                variant="outline"
                onClick={handleExcelExport}
                className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel'e Aktar
              </Button>
              <Button
                onClick={handleSaveAll}
                className={`${theme.colors.primary} ${theme.colors.primaryHover} text-black`}
                disabled={Object.keys(editedRows).length === 0}
              >
                <Save className="w-4 h-4 mr-2" />
                Kaydet {Object.keys(editedRows).length > 0 && `(${Object.keys(editedRows).length})`}
              </Button>
              <Button
                onClick={() => setShowUpdateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tarife Güncelle
              </Button>
            </div>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
            <div className="text-sm text-gray-500 mb-1">Tarife Durumu</div>
            <div className="text-lg">{getStatusBadge(selectedPriceList?.status || "")}</div>
          </div>
          <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
            <div className="text-sm text-gray-500 mb-1">Geçerlilik Dönemi</div>
            <div className="text-sm">{selectedPriceList?.valid_from} → {selectedPriceList?.valid_to || "∞"}</div>
          </div>
          <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
            <div className="text-sm text-gray-500 mb-1">Aktif Hizmetler / Tümü</div>
            <div className="text-2xl text-blue-400">{activeServiceCount} / {priceListRows.length}</div>
          </div>
          <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-4`}>
            <div className="text-sm text-gray-500 mb-1">Değişiklikler / Eksik</div>
            <div className="text-2xl">
              <span className="text-orange-400">{Object.keys(editedRows).length}</span>
              {emptyPriceCount > 0 && <span className="text-red-400"> / {emptyPriceCount}</span>}
            </div>
          </div>
        </div>

        {/* Uyarı Mesajı */}
        {emptyPriceCount > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />
            <div>
              <div className="text-orange-400 font-medium mb-1">Fiyatsız Aktif Hizmetler Var!</div>
              <p className="text-sm text-orange-300">
                {emptyPriceCount} aktif hizmet için fiyat girilmeden kayıt yapılamaz. Lütfen boş fiyatları doldurun.
              </p>
            </div>
          </div>
        )}

        {/* BİLGİLENDİRME KUTUSU */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-blue-400 font-medium mb-2">💡 Fiyatlandırma Kuralları</div>
              <div className="text-sm text-blue-300 space-y-2">
                <p>• Tüm fiyatlar <strong>1 BİRİM İÇİN</strong> girilir</p>
                <p>• Minimum fiyatlandırma kuralları <strong>Hizmet Kartı</strong> üzerinden tanımlanır</p>
                <p>• Kurallar <strong>Parametreler → Fiyatlandırma</strong> modülünden merkezi olarak yönetilir</p>
                <div className="bg-blue-900/20 rounded p-3 mt-2">
                  <div className="text-xs font-semibold mb-1">ÖRNEK: Paket Fiyatlandırma</div>
                  <div className="font-mono text-xs">
                    <div>Hizmet: Araç Giriş • Kural: "Paket (4 Saat Minimum)"</div>
                    <div className="mt-1">Paket Fiyat: 150 USD • Birim Fiyat: 37.50 USD/saat</div>
                    <div className="mt-2 text-blue-200">
                      <div>3.5 saat → 150 USD (paket uygulanır)</div>
                      <div>4.5 saat → 150 + (0.5 × 37.50) = 168.75 USD</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Düzenlenebilir Tablo */}
        <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} overflow-hidden`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h3 className="font-medium">Fiyat Listesi İçeriği (Tüm Hizmetler - 10 Kayıt)</h3>
            <div className="text-sm text-gray-500">
              SQL: price_list_item
            </div>
          </div>

          <div className="overflow-auto max-h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="border-gray-800 hover:bg-transparent bg-gray-900">
                  <TableHead className="text-gray-400 font-semibold">Hizmet Kodu</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Hizmet Adı</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Birim</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Para Birimi</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Birim Fiyat (1 birim için)</TableHead>
                  <TableHead className="text-gray-400 font-semibold text-center">KDV %</TableHead>
                  <TableHead className="text-gray-400 font-semibold text-center">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceListRows.map((row) => {
                  const isEmpty = row.isServiceActive && (!row.unitPrice || row.unitPrice <= 0);
                  
                  return (
                    <TableRow
                      key={row.serviceCardId}
                      className={`border-gray-800 hover:bg-gray-800/30 transition-colors ${
                        isEmpty ? "bg-orange-500/5" : !row.isServiceActive ? "bg-gray-800/20 opacity-60" : ""
                      }`}
                    >
                      {/* Hizmet Kodu - READ ONLY */}
                      <TableCell>
                        <span className="font-mono text-sm text-blue-400">{row.serviceCode}</span>
                      </TableCell>

                      {/* Hizmet Adı - READ ONLY */}
                      <TableCell className="font-medium">
                        {row.serviceName}
                      </TableCell>

                      {/* Birim - READ ONLY */}
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-700">
                          {row.unit}
                        </Badge>
                      </TableCell>

                      {/* Para Birimi - EDITABLE DROPDOWN */}
                      <TableCell>
                        <select
                          value={row.currency}
                          onChange={(e) => handleCellEdit(row.serviceCardId, "currency", e.target.value)}
                          className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!row.isServiceActive}
                        >
                          {currencyMasterData.map(currency => (
                            <option key={currency.code} value={currency.code}>
                              {currency.code}
                            </option>
                          ))}
                        </select>
                      </TableCell>

                      {/* Birim Fiyat - EDITABLE INPUT */}
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={row.unitPrice}
                          onChange={(e) => handleCellEdit(row.serviceCardId, "unitPrice", parseFloat(e.target.value) || 0)}
                          className={`w-32 bg-gray-800 border ${
                            isEmpty ? "border-orange-500" : "border-gray-700"
                          } text-white text-right`}
                          placeholder="0.00"
                          disabled={!row.isServiceActive}
                        />
                      </TableCell>

                      {/* KDV % - READ ONLY */}
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                          {row.vatRate}%
                        </Badge>
                      </TableCell>

                      {/* Durum - READ ONLY */}
                      <TableCell className="text-center">
                        {row.isServiceActive ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                            AKTİF
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-700 text-gray-400">
                            PASİF
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer Info */}
        <div className={`mt-4 p-3 ${theme.colors.bgCard} border ${theme.colors.border} rounded-lg`}>
          <p className="text-sm text-gray-500">
            <DollarSign className="inline w-4 h-4 mr-1" />
            SQL Tablo: <code className="text-blue-400">dbo.price_list</code>,{" "}
            <code className="text-blue-400">dbo.price_list_item</code> • Fiyatlar DAIMA 1 BİRİM İÇİN • Faturalandırmada: Gerçek Miktar × Birim Fiyat (kesirli hesaplama desteklenir)
          </p>
        </div>
      </div>

      {/* Tarife Güncelle Modal */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-400" />
              Tarife Güncelle / Yeni Tarife Oluştur
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Mevcut tarifeden yeni tarife oluştur - Taslak veya onaylı olarak kaydet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-gray-400 mb-2 block">Kaynak Tarife Seç</Label>
              <select
                value={updateData.sourcePriceListId}
                onChange={(e) => setUpdateData({ ...updateData, sourcePriceListId: parseInt(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
              >
                {priceListMasterData.map(priceList => (
                  <option key={priceList.id} value={priceList.id}>
                    {priceList.name} ({priceList.valid_from} → {priceList.valid_to || "∞"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400 mb-2 block">Yeni Başlangıç Tarihi</Label>
                <Input
                  type="date"
                  value={updateData.validFrom}
                  onChange={(e) => setUpdateData({ ...updateData, validFrom: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400 mb-2 block">Yeni Bitiş Tarihi (Opsiyonel)</Label>
                <Input
                  type="date"
                  value={updateData.validTo}
                  onChange={(e) => setUpdateData({ ...updateData, validTo: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Güncelleme Tipi</Label>
              <select
                value={updateData.updateType}
                onChange={(e) => setUpdateData({ ...updateData, updateType: e.target.value as any })}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
              >
                <option value="PERCENTAGE">Oransal Artış (%)</option>
                <option value="FIXED">Parasal Artış (Sabit Tutar)</option>
                <option value="MANUAL">Manuel Düzenleme (Excel)</option>
              </select>
            </div>

            {updateData.updateType !== "MANUAL" && (
              <div>
                <Label className="text-gray-400 mb-2 block">
                  {updateData.updateType === "PERCENTAGE" ? "Artış Oranı (%)" : "Artış Tutarı"}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={updateData.value}
                  onChange={(e) => setUpdateData({ ...updateData, value: e.target.value })}
                  placeholder={updateData.updateType === "PERCENTAGE" ? "10" : "500"}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            )}

            {updateData.updateType === "MANUAL" && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-sm text-blue-400">
                  ℹ️ Manuel düzenleme modu: Tarife oluşturulduktan sonra Excel'e aktarıp düzenleyebilirsiniz.
                </p>
              </div>
            )}

            <div>
              <Label className="text-gray-400 mb-2 block">Durum</Label>
              <select
                value={updateData.status}
                onChange={(e) => setUpdateData({ ...updateData, status: e.target.value as any })}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
              >
                <option value="TASLAK">Taslak (Onay Bekliyor)</option>
                <option value="ONAY">Onayla ve Aktive Et</option>
              </select>
            </div>

            {updateData.status === "ONAY" && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-sm text-yellow-400">
                  ⚠️ <strong>Dikkat:</strong> Onaylandığında mevcut tarife{" "}
                  <strong>{updateData.validFrom || "[seçilen tarih]"}</strong> tarihinde otomatik olarak PASİFE taşınacaktır.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpdateModal(false)}
              className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
            >
              İptal
            </Button>
            <Button
              onClick={handleUpdateTarife}
              className={`${theme.colors.primary} ${theme.colors.primaryHover} text-black`}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {updateData.status === "ONAY" ? "Onayla ve Oluştur" : "Taslak Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excel Dışa Aktarma Modal */}
      <Dialog open={showExcelModal} onOpenChange={setShowExcelModal}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-green-400" />
              Excel'e Aktar
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Tarife fiyat listesini Excel formatında indirin
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-400 mb-2">Seçili Tarife</div>
              <div className="font-medium">{selectedPriceList?.name}</div>
              <div className="text-sm text-gray-500">
                {selectedPriceList?.valid_from} → {selectedPriceList?.valid_to || "Süresiz"}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Toplam: {priceListRows.length} hizmet (Aktif: {activeServiceCount})
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-sm text-blue-400">
                ℹ️ Excel dosyası aşağıdaki kolonları içerecek:<br/>
                • Hizmet Kodu<br/>
                • Hizmet Adı<br/>
                • Birim<br/>
                • Para Birimi<br/>
                • Birim Fiyat<br/>
                • Min/Max Miktar<br/>
                • KDV %
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExcelModal(false)}
              className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
            >
              İptal
            </Button>
            <Button
              onClick={handleExcelExportConfirm}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              İndir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}