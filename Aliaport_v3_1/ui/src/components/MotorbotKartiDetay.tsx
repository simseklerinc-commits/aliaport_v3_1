// MOTORBOT KART DETAY COMPONENT
// Motorbot kartı detaylarını gösteren component - Audit sistemi entegreli

import { useState } from "react";
import { X, Anchor, Trash2, Edit, FileText, Activity, Calendar, TrendingUp, Ruler, Ship } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Theme } from "./ThemeSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AuditLogViewer } from "./AuditLogViewer";
import { RecordMetadataCard } from "./RecordMetadataCard";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { MotorbotMaster } from "../lib/types/database";

interface MotorbotKartiDetayProps {
  motorbot: MotorbotMaster;
  onClose: () => void;
  onEdit: () => void;
  onDelete?: (motorbot: MotorbotMaster) => void;
  theme: Theme;
}

export function MotorbotKartiDetay({ 
  motorbot, 
  onClose, 
  onEdit, 
  onDelete, 
  theme 
}: MotorbotKartiDetayProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(motorbot);
    }
    setShowDeleteDialog(false);
    onClose();
  };

  // Mock istatistikler (gerçek senaryoda API'den gelecek)
  const stats = {
    totalTrips: 87,
    totalRevenue: 4350000,
    avgRevenue: 50000,
    lastTripDate: "2024-11-18",
    activeContracts: 3,
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${theme.colors.primary}/10 border border-${theme.colors.primary.split('-')[1]}-500/30`}>
              <Anchor className={`w-6 h-6 text-${theme.colors.primary.split('-')[1]}-400`} />
            </div>
            <div>
              <h2 className="text-2xl mb-1">{motorbot.name}</h2>
              <p className={theme.colors.textMuted}>Kod: {motorbot.code}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={motorbot.is_active ? "default" : "secondary"}
              className={motorbot.is_active ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-gray-700"}
            >
              {motorbot.is_active ? "AKTİF" : "PASİF"}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sol Blok - Genel Bilgiler */}
                <div className="space-y-6">
                  <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-5`}>
                    <h3 className="flex items-center gap-2 mb-4 text-lg">
                      <Ship className="w-5 h-5 text-blue-400" />
                      Genel Bilgiler
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted}`}>Motorbot Kodu</label>
                        <p className="mt-1 font-mono text-blue-400">{motorbot.code}</p>
                      </div>
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted}`}>Tekne Adı</label>
                        <p className="mt-1">{motorbot.name}</p>
                      </div>
                      {motorbot.vessel_type && (
                        <div>
                          <label className={`text-xs ${theme.colors.textMuted}`}>Tip</label>
                          <p className="mt-1">
                            <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                              {motorbot.vessel_type}
                            </Badge>
                          </p>
                        </div>
                      )}
                      {motorbot.owner_name && (
                        <div>
                          <label className={`text-xs ${theme.colors.textMuted}`}>Sahibi</label>
                          <p className="mt-1">{motorbot.owner_name}</p>
                          {motorbot.owner_cari_code && (
                            <p className="text-xs text-gray-500 font-mono mt-0.5">{motorbot.owner_cari_code}</p>
                          )}
                        </div>
                      )}
                      {motorbot.registration_number && (
                        <div>
                          <label className={`text-xs ${theme.colors.textMuted}`}>Sicil No</label>
                          <p className="mt-1 font-mono">{motorbot.registration_number}</p>
                        </div>
                      )}
                      {motorbot.flag && (
                        <div>
                          <label className={`text-xs ${theme.colors.textMuted}`}>Bayrak</label>
                          <p className="mt-1">{motorbot.flag}</p>
                        </div>
                      )}
                      {motorbot.year_built && (
                        <div>
                          <label className={`text-xs ${theme.colors.textMuted}`}>İnşa Yılı</label>
                          <p className="mt-1">{motorbot.year_built}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Boyutlar */}
                  <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-5`}>
                    <h3 className="flex items-center gap-2 mb-4 text-lg">
                      <Ruler className="w-5 h-5 text-cyan-400" />
                      Boyutlar ve Teknik Özellikler
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted}`}>Tam Boy</label>
                        <p className="mt-1">{motorbot.length} m</p>
                      </div>
                      {motorbot.registered_length && (
                        <div>
                          <label className={`text-xs ${theme.colors.textMuted}`}>Kayıtlı Boy</label>
                          <p className="mt-1">{motorbot.registered_length} m</p>
                        </div>
                      )}
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted}`}>Genişlik</label>
                        <p className="mt-1">{motorbot.width} m</p>
                      </div>
                      {motorbot.draft && (
                        <div>
                          <label className={`text-xs ${theme.colors.textMuted}`}>Draft</label>
                          <p className="mt-1">{motorbot.draft} m</p>
                        </div>
                      )}
                      {motorbot.depth && (
                        <div>
                          <label className={`text-xs ${theme.colors.textMuted}`}>Depth</label>
                          <p className="mt-1">{motorbot.depth} m</p>
                        </div>
                      )}
                      {motorbot.gross_tonnage && (
                        <div>
                          <label className={`text-xs ${theme.colors.textMuted}`}>Gross Tonnage</label>
                          <p className="mt-1">{motorbot.gross_tonnage} ton</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Zaman Damgaları */}
                  <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-5`}>
                    <h3 className="flex items-center gap-2 mb-4 text-lg">
                      <Calendar className="w-5 h-5 text-purple-400" />
                      Zaman Damgaları
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted}`}>Oluşturma</label>
                        <p className="mt-1 text-gray-400">{new Date(motorbot.created_at).toLocaleString("tr-TR")}</p>
                        <p className="text-xs text-gray-500 mt-1">Kullanıcı ID: {motorbot.created_by}</p>
                      </div>
                      {motorbot.updated_at && (
                        <div>
                          <label className={`text-xs ${theme.colors.textMuted}`}>Son Güncelleme</label>
                          <p className="mt-1 text-gray-400">{new Date(motorbot.updated_at).toLocaleString("tr-TR")}</p>
                          {motorbot.updated_by && (
                            <p className="text-xs text-gray-500 mt-1">Kullanıcı ID: {motorbot.updated_by}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sağ Blok - İstatistikler */}
                <div className="space-y-6">
                  <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-5`}>
                    <h3 className="flex items-center gap-2 mb-4 text-lg">
                      <TrendingUp className="w-5 h-5 text-yellow-400" />
                      Kullanım İstatistikleri
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-400">Toplam Sefer</span>
                        <span className="text-xl font-mono text-blue-400">{stats.totalTrips}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-400">Toplam Gelir</span>
                        <span className="text-lg font-mono text-green-400">
                          {stats.totalRevenue.toLocaleString("tr-TR")} ₺
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-400">Ort. Gelir/Sefer</span>
                        <span className="text-sm font-mono">{stats.avgRevenue.toLocaleString("tr-TR")} ₺</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-400">Aktif Kontrat</span>
                        <span className="font-mono">{stats.activeContracts}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-400">Son Sefer</span>
                        <span className="text-xs text-gray-500">{stats.lastTripDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Durum Kartı */}
                  <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-5`}>
                    <h3 className="flex items-center gap-2 mb-4 text-lg">
                      <Activity className="w-5 h-5 text-green-400" />
                      Durum Bilgisi
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Operasyonel Durum</span>
                        <Badge
                          variant="outline"
                          className={motorbot.is_active 
                            ? "border-green-500/30 text-green-400"
                            : "border-gray-600 text-gray-400"
                          }
                        >
                          {motorbot.is_active ? "AKTİF" : "PASİF"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Kullanılabilirlik</span>
                        <Badge variant="outline" className="border-green-500/30 text-green-400">
                          MÜSAİT
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="p-6 m-0">
              <RecordMetadataCard
                tableName="motorboats"
                recordId={motorbot.id}
                theme={theme}
              />
            </TabsContent>

            <TabsContent value="history" className="p-6 m-0">
              <AuditLogViewer
                tableName="motorboats"
                recordId={motorbot.id}
                recordName={motorbot.name}
                theme={theme}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            SQL Tablo: <code className="text-blue-400">motorboats</code> · ID: {motorbot.id}
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
        tableName="motorboats"
        recordId={motorbot.id}
        recordName={motorbot.name}
        recordCode={motorbot.code}
      />
    </div>
  );
}