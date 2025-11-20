// CARI KART DETAY COMPONENT
// Cari kartı detaylarını gösteren component - Audit sistemi entegreli

import { useState } from "react";
import { X, Building2, Trash2, Edit, FileText, TrendingUp, DollarSign, Calendar, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Theme } from "./ThemeSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AuditLogViewer } from "./AuditLogViewer";
import { RecordMetadataCard } from "./RecordMetadataCard";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { CariKart } from "../data/cariData";

interface CariKartiDetayProps {
  cari: CariKart;
  onClose: () => void;
  onEdit: () => void;
  onDelete?: (cari: CariKart) => void;
  theme: Theme;
}

export function CariKartiDetay({ 
  cari, 
  onClose, 
  onEdit, 
  onDelete, 
  theme 
}: CariKartiDetayProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(cari);
    }
    setShowDeleteDialog(false);
    onClose();
  };

  // Mock istatistikler (gerçek senaryoda API'den gelecek)
  const stats = {
    totalInvoices: 120,
    totalRevenue: 8750000,
    totalDebt: 250000,
    avgInvoiceAmount: 72916,
    lastInvoiceDate: "2024-11-15",
    activeContracts: 5,
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${theme.colors.primary}/10 border border-${theme.colors.primary.split('-')[1]}-500/30`}>
              <Building2 className={`w-6 h-6 text-${theme.colors.primary.split('-')[1]}-400`} />
            </div>
            <div>
              <h2 className="text-2xl mb-1">{cari.Name}</h2>
              <p className={theme.colors.textMuted}>Kod: {cari.Code}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={cari.IsActive ? "default" : "secondary"}
              className={cari.IsActive ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-gray-700"}
            >
              {cari.IsActive ? "AKTİF" : "PASİF"}
            </Badge>
            <Badge
              variant="outline"
              className={cari.Type === "Firma" 
                ? "border-blue-500/30 text-blue-400" 
                : "border-purple-500/30 text-purple-400"
              }
            >
              {cari.Type}
            </Badge>
            <Button
              variant="outline"
              onClick={onEdit}
              className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
            >
              <Edit className="w-4 h-4 mr-2" />
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
                        <label className="text-sm font-medium text-gray-300 block mb-1.5">Cari Kodu</label>
                        <p className="font-mono text-blue-400 text-base">{cari.Code}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-1.5">Ünvan / Ad Soyad</label>
                        <p className="text-white text-base">{cari.Name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-1.5">Cari Tipi</label>
                        <p className="text-white text-sm">
                          <Badge 
                            variant="outline" 
                            className={cari.Type === "Firma" 
                              ? "border-blue-500/30 text-blue-400" 
                              : "border-purple-500/30 text-purple-400"
                            }
                          >
                            {cari.Type}
                          </Badge>
                        </p>
                      </div>
                      {cari.TaxNumber && (
                        <div>
                          <label className="text-sm font-medium text-gray-300 block mb-1.5">
                            {cari.Type === "Firma" ? "Vergi No" : "TC Kimlik No"}
                          </label>
                          <p className="font-mono text-white text-base">{cari.TaxNumber}</p>
                        </div>
                      )}
                      {cari.TaxOffice && (
                        <div>
                          <label className="text-sm font-medium text-gray-300 block mb-1.5">Vergi Dairesi</label>
                          <p className="text-white text-base">{cari.TaxOffice}</p>
                        </div>
                      )}
                      {cari.Currency && (
                        <div>
                          <label className="text-sm font-medium text-gray-300 block mb-1.5">Para Birimi</label>
                          <p className="text-white text-base">
                            <Badge variant="outline" className="border-green-500/30 text-green-400 text-sm px-3 py-1">
                              {cari.Currency}
                            </Badge>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Orta Blok - İletişim */}
                <div className="space-y-6">
                  <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
                    <h3 className="flex items-center gap-2 mb-5 text-lg font-semibold">
                      <Users className="w-5 h-5 text-green-400" />
                      İletişim Bilgileri
                    </h3>
                    <div className="space-y-4">
                      {cari.Address && (
                        <div>
                          <label className="text-sm font-medium text-gray-300 block mb-1.5">Adres</label>
                          <p className="text-gray-300 text-sm leading-relaxed">{cari.Address}</p>
                        </div>
                      )}
                      {cari.Phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-300 block mb-1.5">Telefon</label>
                          <p className="font-mono text-white text-base">{cari.Phone}</p>
                        </div>
                      )}
                      {cari.Mobile && (
                        <div>
                          <label className="text-sm font-medium text-gray-300 block mb-1.5">Mobil</label>
                          <p className="font-mono text-white text-base">{cari.Mobile}</p>
                        </div>
                      )}
                      {cari.Email && (
                        <div>
                          <label className="text-sm font-medium text-gray-300 block mb-1.5">E-posta</label>
                          <p className="text-blue-400 text-base">{cari.Email}</p>
                        </div>
                      )}
                      {cari.Website && (
                        <div>
                          <label className="text-sm font-medium text-gray-300 block mb-1.5">Web Sitesi</label>
                          <p className="text-cyan-400 text-sm">{cari.Website}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Yetkili Kişi */}
                  {(cari.ContactPerson || cari.ContactPhone || cari.ContactEmail) && (
                    <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
                      <h3 className="flex items-center gap-2 mb-5 text-lg font-semibold">
                        <Users className="w-5 h-5 text-purple-400" />
                        Yetkili Kişi
                      </h3>
                      <div className="space-y-4">
                        {cari.ContactPerson && (
                          <div>
                            <label className="text-sm font-medium text-gray-300 block mb-1.5">Ad Soyad</label>
                            <p className="text-white text-base">{cari.ContactPerson}</p>
                          </div>
                        )}
                        {cari.ContactPhone && (
                          <div>
                            <label className="text-sm font-medium text-gray-300 block mb-1.5">Telefon</label>
                            <p className="font-mono text-white text-base">{cari.ContactPhone}</p>
                          </div>
                        )}
                        {cari.ContactEmail && (
                          <div>
                            <label className="text-sm font-medium text-gray-300 block mb-1.5">E-posta</label>
                            <p className="text-blue-400 text-base">{cari.ContactEmail}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sağ Blok - İstatistikler */}
                <div className="space-y-6">
                  <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
                    <h3 className="flex items-center gap-2 mb-5 text-lg font-semibold">
                      <TrendingUp className="w-5 h-5 text-yellow-400" />
                      Finansal Özet
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-300 text-sm">Toplam Fatura</span>
                        <span className="text-2xl font-mono text-blue-400">{stats.totalInvoices}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-300 text-sm">Toplam Ciro</span>
                        <span className="text-lg font-mono text-green-400">
                          {stats.totalRevenue.toLocaleString("tr-TR")} ₺
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-300 text-sm">Bakiye</span>
                        <span className="text-lg font-mono text-red-400">
                          {stats.totalDebt.toLocaleString("tr-TR")} ₺
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-300 text-sm">Ort. Fatura</span>
                        <span className="font-mono text-white text-base">{stats.avgInvoiceAmount.toLocaleString("tr-TR")} ₺</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-300 text-sm">Aktif Kontrat</span>
                        <span className="font-mono text-white text-base">{stats.activeContracts}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-300 text-sm">Son Fatura</span>
                        <span className="text-sm text-gray-400">{stats.lastInvoiceDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notlar */}
                  {cari.Notes && (
                    <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-6`}>
                      <h3 className="flex items-center gap-2 mb-5 text-lg font-semibold">
                        <FileText className="w-5 h-5 text-orange-400" />
                        Notlar
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{cari.Notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="p-6 m-0">
              <RecordMetadataCard
                tableName="customers"
                recordId={cari.ID}
                theme={theme}
              />
            </TabsContent>

            <TabsContent value="history" className="p-6 m-0">
              <AuditLogViewer
                tableName="customers"
                recordId={cari.ID}
                recordName={cari.Name}
                theme={theme}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            SQL Tablo: <code className="text-blue-400">customers</code> · ID: {cari.ID}
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
        tableName="customers"
        recordId={cari.ID}
        recordName={cari.Name}
        recordCode={cari.Code}
      />
    </div>
  );
}