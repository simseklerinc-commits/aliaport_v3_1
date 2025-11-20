// KONTRAT DETAY COMPONENT
// Barınma kontratı detaylarını gösteren component - Audit sistemi entegreli

import { useState } from "react";
import { X, FileText, Trash2, Edit, Calendar, DollarSign, Anchor, Building2, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Theme } from "./ThemeSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AuditLogViewer } from "./AuditLogViewer";
import { RecordMetadataCard } from "./RecordMetadataCard";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

// Kontrat tipi (basitleştirilmiş)
interface Contract {
  id: number;
  contract_code: string;
  customer_id: number;
  customer_name: string;
  motorboat_id: number;
  motorboat_name: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  currency: string;
  status: "TASLAK" | "AKTİF" | "PASİF" | "İPTAL";
  created_at: string;
  created_by: number;
  updated_at?: string;
  updated_by?: number;
}

interface KontratDetayProps {
  contract: Contract;
  onClose: () => void;
  onEdit: () => void;
  onDelete?: (contract: Contract) => void;
  theme: Theme;
}

export function KontratDetay({ 
  contract, 
  onClose, 
  onEdit, 
  onDelete, 
  theme 
}: KontratDetayProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(contract);
    }
    setShowDeleteDialog(false);
    onClose();
  };

  // Durum renkleri
  const getStatusBadge = (status: Contract['status']) => {
    const variants: Record<Contract['status'], string> = {
      TASLAK: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      AKTİF: 'bg-green-500/20 text-green-300 border-green-500/30',
      PASİF: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      İPTAL: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return variants[status];
  };

  // Kontrat süresi hesapla
  const calculateDuration = () => {
    const start = new Date(contract.start_date);
    const end = new Date(contract.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Mock istatistikler
  const stats = {
    totalInvoices: 12,
    totalPaid: contract.total_amount * 0.7,
    totalRemaining: contract.total_amount * 0.3,
    daysRemaining: Math.max(0, Math.ceil((new Date(contract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
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
              <h2 className="text-2xl mb-1">Barınma Kontratı</h2>
              <p className={theme.colors.textMuted}>Kod: {contract.contract_code}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={getStatusBadge(contract.status)}
            >
              {contract.status}
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
                  <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-5`}>
                    <h3 className="flex items-center gap-2 mb-4 text-lg">
                      <FileText className="w-5 h-5 text-blue-400" />
                      Kontrat Bilgileri
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted}`}>Kontrat Kodu</label>
                        <p className="mt-1 font-mono text-blue-400">{contract.contract_code}</p>
                      </div>
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted}`}>Durum</label>
                        <p className="mt-1">
                          <Badge variant="outline" className={getStatusBadge(contract.status)}>
                            {contract.status}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted}`}>Başlangıç Tarihi</label>
                        <p className="mt-1">{new Date(contract.start_date).toLocaleDateString("tr-TR")}</p>
                      </div>
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted}`}>Bitiş Tarihi</label>
                        <p className="mt-1">{new Date(contract.end_date).toLocaleDateString("tr-TR")}</p>
                      </div>
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted}`}>Süre</label>
                        <p className="mt-1">
                          <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                            {calculateDuration()} Gün
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted}`}>Kalan Süre</label>
                        <p className="mt-1">
                          <Badge variant="outline" className={stats.daysRemaining > 30 
                            ? "border-green-500/30 text-green-400"
                            : stats.daysRemaining > 0
                            ? "border-yellow-500/30 text-yellow-400"
                            : "border-red-500/30 text-red-400"
                          }>
                            {stats.daysRemaining > 0 ? `${stats.daysRemaining} Gün` : "Süresi Dolmuş"}
                          </Badge>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Orta Blok - Taraflar */}
                <div className="space-y-6">
                  <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-5`}>
                    <h3 className="flex items-center gap-2 mb-4 text-lg">
                      <Building2 className="w-5 h-5 text-green-400" />
                      Cari Bilgileri
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted}`}>Cari Adı</label>
                        <p className="mt-1">{contract.customer_name}</p>
                      </div>
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted}`}>Cari ID</label>
                        <p className="mt-1 font-mono text-gray-400">#{contract.customer_id}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-5`}>
                    <h3 className="flex items-center gap-2 mb-4 text-lg">
                      <Anchor className="w-5 h-5 text-cyan-400" />
                      Motorbot Bilgileri
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted}`}>Motorbot Adı</label>
                        <p className="mt-1">{contract.motorboat_name}</p>
                      </div>
                      <div>
                        <label className={`text-xs ${theme.colors.textMuted}`}>Motorbot ID</label>
                        <p className="mt-1 font-mono text-gray-400">#{contract.motorboat_id}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sağ Blok - Finansal */}
                <div className="space-y-6">
                  <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-5`}>
                    <h3 className="flex items-center gap-2 mb-4 text-lg">
                      <DollarSign className="w-5 h-5 text-yellow-400" />
                      Finansal Özet
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-400">Toplam Tutar</span>
                        <span className="text-lg font-mono text-green-400">
                          {contract.total_amount.toLocaleString("tr-TR")} {contract.currency}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-400">Ödenen</span>
                        <span className="text-sm font-mono text-blue-400">
                          {stats.totalPaid.toLocaleString("tr-TR")} {contract.currency}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-400">Kalan</span>
                        <span className="text-sm font-mono text-red-400">
                          {stats.totalRemaining.toLocaleString("tr-TR")} {contract.currency}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-400">Fatura Sayısı</span>
                        <span className="font-mono">{stats.totalInvoices}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-lg p-5`}>
                    <h3 className="flex items-center gap-2 mb-4 text-lg">
                      <TrendingUp className="w-5 h-5 text-orange-400" />
                      Ödeme Durumu
                    </h3>
                    <div className="space-y-3">
                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-2">
                          <span>Tamamlanan</span>
                          <span>70%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 w-[70%]"></div>
                        </div>
                      </div>
                      <div className="text-center py-2">
                        <Badge variant="outline" className="border-green-500/30 text-green-400">
                          Düzenli Ödeme
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="p-6 m-0">
              <RecordMetadataCard
                tableName="contracts"
                recordId={contract.id}
                theme={theme}
              />
            </TabsContent>

            <TabsContent value="history" className="p-6 m-0">
              <AuditLogViewer
                tableName="contracts"
                recordId={contract.id}
                recordName={contract.contract_code}
                theme={theme}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            SQL Tablo: <code className="text-blue-400">contracts</code> · ID: {contract.id}
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
        tableName="contracts"
        recordId={contract.id}
        recordName={contract.contract_code}
        recordCode={contract.contract_code}
      />
    </div>
  );
}
