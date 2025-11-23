import { X, FileText, Tag, DollarSign, Clock, User, TrendingUp, Trash2, History } from "lucide-react";
import { Button } from "./ui/button";
import { Theme } from "./ThemeSelector";
import { Badge } from "./ui/badge";
import { ServiceCard } from "../lib/types/database";
import {
  parameterUnitsMasterData,
  parameterVatRatesMasterData,
  parameterVatExemptionsMasterData,
  parameterServiceGroupsMasterData,
  parameterServiceCategoriesMasterData,
  parameterPricingRulesMasterData,
} from "../data/parametersData";
import { priceListMasterData, priceListItemMasterData } from "../data/priceListData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { AuditLogViewer } from "./AuditLogViewer";
import { RecordMetadataCard } from "./RecordMetadataCard";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface HizmetKartiDetayProps {
  service: ServiceCard;
  onClose: () => void;
  onEdit: () => void;
  onDelete?: (service: ServiceCard) => void;
  theme: Theme;
}

export function HizmetKartiDetay({ service, onClose, onEdit, onDelete, theme }: HizmetKartiDetayProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Helper functions - Lookup'lar
  const getUnitName = (id: number | null | undefined) => {
    if (!id) return service.unit || "-";
    return parameterUnitsMasterData.find((u) => u.id === id)?.name || "-";
  };

  const getVatRate = (id: number | null | undefined) => {
    if (!id) return 0;
    return parameterVatRatesMasterData.find((v) => v.id === id)?.rate || 0;
  };

  const getVatExemptionName = (id: number | undefined) => {
    if (!id) return "-";
    return parameterVatExemptionsMasterData.find((e) => e.id === id)?.name || "-";
  };

  const getGroupName = (id: number | null | undefined) => {
    if (!id) return "-";
    return parameterServiceGroupsMasterData.find((g) => g.id === id)?.name || "-";
  };

  const getCategoryName = (id: number | null | undefined) => {
    if (!id) return service.category || "-";
    return parameterServiceCategoriesMasterData.find((c) => c.id === id)?.name || "-";
  };

  const getPricingRuleName = (id: number | null | undefined) => {
    if (!id) return "Kural Yok (Standart Birim x Fiyat)";
    return parameterPricingRulesMasterData.find((r) => r.id === id)?.name || "-";
  };

  // İlişkili tarifeleri bul
  const getRelatedPriceLists = () => {
    const items = priceListItemMasterData.filter((item) => item.service_card_id === service.id);
    return items.map((item) => {
      const priceList = priceListMasterData.find((pl) => pl.id === item.price_list_id);
      return { item, priceList };
    });
  };

  // Metadata parse
  const parseMetadata = () => {
    if (!service.metadata_json) return null;
    try {
      return JSON.parse(service.metadata_json);
    } catch {
      return null;
    }
  };

  const metadata = parseMetadata();
  const relatedPriceLists = getRelatedPriceLists();

  // Mock istatistikler (gerçek senaryoda API'den gelecek)
  const stats = {
    totalUsage: 127,
    totalRevenue: 6350000,
    avgPrice: 50000,
    lastUsedDate: "2024-11-15",
    contractCount: 23,
  };

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(service);
    }
    setShowDeleteDialog(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${theme.colors.primary}/10 border border-${theme.colors.primary.split('-')[1]}-500/30`}>
              <FileText className={`w-6 h-6 text-${theme.colors.primary.split('-')[1]}-400`} />
            </div>
            <div>
              <h2 className="text-2xl mb-1">{service.name}</h2>
              <p className={theme.colors.textMuted}>Kod: {service.code}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={service.is_active ? "default" : "secondary"}
              className={service.is_active ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-gray-700"}
            >
              {service.is_active ? "AKTİF" : "PASİF"}
            </Badge>
            <Button
              variant="outline"
              onClick={onEdit}
              className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
            >
              Düzenle
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Sil
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
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
                {/* Sol Blok - Genel Bilgiler */}
                <div className="space-y-6">
                  <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
                    <h3 className="flex items-center gap-2 mb-5 text-lg font-semibold">
                      <FileText className="w-5 h-5 text-blue-400" />
                      Genel Bilgiler
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-1.5">Hizmet Kodu</label>
                        <p className="font-mono text-blue-400 text-base">{service.code}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-1.5">Hizmet Adı</label>
                        <p className="text-white text-base">{service.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-1.5">Açıklama</label>
                        <p className="text-gray-300 text-sm leading-relaxed">{service.description || service.notes || "-"}</p>
                      </div>
                      {(service as any).accounting_code && (
                        <div>
                          <label className="text-sm font-medium text-gray-300 block mb-1.5">Muhasebe Kodu</label>
                          <p className="font-mono text-white text-base">{(service as any).accounting_code}</p>
                        </div>
                      )}
                      {((service as any).group_id || (service as any).category_id) && (
                        <>
                          <div>
                            <label className="text-sm font-medium text-gray-300 block mb-1.5">Grup</label>
                            <p className="text-white text-base">{getGroupName((service as any).group_id)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-300 block mb-1.5">Kategori</label>
                            <p className="text-white text-base">{getCategoryName((service as any).category_id)}</p>
                          </div>
                        </>
                      )}
                      {metadata?.tags && metadata.tags.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-300 block mb-2">Etiketler</label>
                          <div className="flex flex-wrap gap-2">
                            {metadata.tags.map((tag: string) => (
                              <Badge key={tag} variant="outline" className="border-blue-500/30 text-blue-400 text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Zaman Damgaları */}
                  <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
                    <h3 className="flex items-center gap-2 mb-5 text-lg font-semibold">
                      <Clock className="w-5 h-5 text-purple-400" />
                      Zaman Damgaları
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-1.5">Oluşturma</label>
                        <p className="text-white text-base">{new Date(service.created_at).toLocaleString("tr-TR")}</p>
                        <p className="text-sm text-gray-400 mt-1">Kullanıcı ID: {service.created_by}</p>
                      </div>
                      {service.updated_at && (
                        <div>
                          <label className="text-sm font-medium text-gray-300 block mb-1.5">Son Güncelleme</label>
                          <p className="text-white text-base">{new Date(service.updated_at).toLocaleString("tr-TR")}</p>
                          {service.updated_by && (
                            <p className="text-sm text-gray-400 mt-1">Kullanıcı ID: {service.updated_by}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Orta Blok - Fiyat & KDV */}
                <div className="space-y-6">
                  <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
                    <h3 className="flex items-center gap-2 mb-5 text-lg font-semibold">
                      <Tag className="w-5 h-5 text-green-400" />
                      Fiyat & KDV Bilgileri
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-1.5">Birim</label>
                        <Badge variant="outline" className="border-gray-600 text-white text-sm px-3 py-1">
                          {getUnitName(service.unit_id)}
                        </Badge>
                      </div>
                      
                      <div className="border-t border-gray-800 pt-4">
                        <label className="text-sm font-medium text-gray-300 block mb-1.5">Fiyatlandırma Kuralı</label>
                        <p className="text-cyan-400 text-sm">{getPricingRuleName(service.pricing_rule_id)}</p>
                        {service.pricing_rule_id && (
                          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                            {parameterPricingRulesMasterData.find((r) => r.id === service.pricing_rule_id)?.description}
                          </p>
                        )}
                      </div>
                      <div className="border-t border-gray-800 pt-4">
                        <label className="text-sm font-medium text-gray-300 block mb-1.5">KDV Oranı</label>
                        <Badge variant="outline" className="border-orange-500/30 text-orange-400 text-base px-3 py-1">
                          %{getVatRate(service.vat_rate_id)}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-1.5">KDV İstisna</label>
                        <p className="text-white text-sm">{getVatExemptionName(service.vat_exemption_id)}</p>
                      </div>
                    </div>
                  </div>

                  {/* İstatistikler */}
                  <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
                    <h3 className="flex items-center gap-2 mb-5 text-lg font-semibold">
                      <TrendingUp className="w-5 h-5 text-yellow-400" />
                      Kullanım İstatistikleri
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-300 text-sm">Toplam Kullanım</span>
                        <span className="text-2xl font-mono text-blue-400">{stats.totalUsage}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-300 text-sm">Toplam Gelir</span>
                        <span className="text-lg font-mono text-green-400">
                          {stats.totalRevenue.toLocaleString("tr-TR")} ₺
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-300 text-sm">Ort. Fiyat</span>
                        <span className="text-base font-mono text-white">{stats.avgPrice.toLocaleString("tr-TR")} ₺</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-300 text-sm">Sözleşme Sayısı</span>
                        <span className="font-mono text-white text-base">{stats.contractCount}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-300 text-sm">Son Kullanım</span>
                        <span className="text-sm text-gray-400">{stats.lastUsedDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sağ Blok - Tarife İlişkileri */}
                <div className="space-y-6">
                  <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
                    <h3 className="flex items-center gap-2 mb-5 text-lg font-semibold">
                      <DollarSign className="w-5 h-5 text-orange-400" />
                      Tarife İlişkileri ({relatedPriceLists.length})
                    </h3>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {relatedPriceLists.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                          Bu hizmet henüz hiçbir tarifede kullanılmamış
                        </div>
                      ) : (
                        relatedPriceLists.map(({ item, priceList }) => (
                          <div
                            key={item.id}
                            className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <span className="font-medium text-white">{priceList?.name}</span>
                              <Badge
                                variant="outline"
                                className={
                                  priceList?.status === "AKTIF"
                                    ? "border-green-500/30 text-green-400"
                                    : priceList?.status === "TASLAK"
                                    ? "border-yellow-500/30 text-yellow-400"
                                    : "border-gray-600 text-gray-300"
                                }
                              >
                                {priceList?.status}
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="text-gray-400">Kod: <span className="font-mono text-blue-400">{priceList?.code}</span></div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Fiyat:</span>
                                <span className="font-mono text-green-400 text-base font-semibold">
                                  {item.unit_price.toLocaleString("tr-TR")} {item.currency}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Geçerlilik: {priceList?.valid_from} {priceList?.valid_to ? `- ${priceList.valid_to}` : "→"}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Metadata JSON */}
                  {metadata && (
                    <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
                      <h3 className="flex items-center gap-2 mb-5 text-lg font-semibold">
                        <User className="w-5 h-5 text-pink-400" />
                        Metadata
                      </h3>
                      <pre className="text-xs bg-gray-900/50 p-4 rounded border border-gray-800 overflow-x-auto text-gray-300 leading-relaxed">
                        {JSON.stringify(metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="p-6 m-0">
              <RecordMetadataCard
                tableName="services"
                recordId={service.id}
                theme={theme}
              />
            </TabsContent>

            <TabsContent value="history" className="p-6 m-0">
              <AuditLogViewer
                tableName="services"
                recordId={service.id}
                recordName={service.name}
                theme={theme}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            SQL Tablo: <code className="text-blue-400">service_card</code> · ID: {service.id}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
            >
              Kapat
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        tableName="services"
        recordId={service.id}
        recordName={service.name}
        recordCode={service.code}
      />
    </div>
  );
}