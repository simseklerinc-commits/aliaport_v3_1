// DELETE CONFIRMATION DIALOG WITH MOVEMENT CHECK
// Hareket kontrolü ile silme onay dialogu

import { useEffect, useState } from "react";
import { AlertTriangle, Trash2, X, AlertCircle, CheckCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import type { DeleteValidation } from "../lib/types/audit";
import { recordMetadataApiMock } from "../lib/api/audit";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  tableName: string;
  recordId: number;
  recordName: string;
  recordCode?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  tableName,
  recordId,
  recordName,
  recordCode,
}: DeleteConfirmDialogProps) {
  const [validation, setValidation] = useState<DeleteValidation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      checkDeletable();
    }
  }, [open, tableName, recordId]);

  const checkDeletable = async () => {
    setLoading(true);
    try {
      const result = await recordMetadataApiMock.checkDeletable(tableName, recordId);
      setValidation(result);
    } catch (error) {
      console.error('Silme kontrolü yapılamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (validation?.can_delete) {
      onConfirm();
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            {validation?.can_delete ? (
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-400" />
            )}
            Kayıt Silme Onayı
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300 text-base">
            {recordCode && (
              <div className="mb-2">
                <code className="bg-gray-800 px-2 py-1 rounded text-yellow-300">
                  {recordCode}
                </code>
              </div>
            )}
            <div className="text-white mb-4">{recordName}</div>
            
            {loading ? (
              <div className="flex items-center gap-2 py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                <span className="text-gray-400">Silme kontrolü yapılıyor...</span>
              </div>
            ) : validation?.can_delete ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-300 mb-2">
                      Bu kaydı silmek üzeresiniz. Bu işlem geri alınamaz!
                    </p>
                    <p className="text-gray-400 text-sm">
                      Emin misiniz? Silme işlemini onaylamak için aşağıdaki butona tıklayın.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Silme Engeli */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-300 mb-2">
                        Bu kayıt silinemez!
                      </p>
                      <p className="text-gray-300 text-sm">
                        {validation?.reason}
                      </p>
                    </div>
                  </div>
                </div>

                {/* İlişkili Kayıtlar */}
                {validation?.related_records && validation.related_records.length > 0 && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <h4 className="text-white mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-400" />
                      İlişkili Kayıtlar
                    </h4>
                    <div className="space-y-2">
                      {validation.related_records.map((record, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between bg-gray-900/50 p-3 rounded"
                        >
                          <div>
                            <div className="text-white text-sm">{record.description}</div>
                            <div className="text-gray-400 text-xs">{record.table}</div>
                          </div>
                          <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {record.count} kayıt
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Çözüm Önerisi */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-blue-300 mb-2">
                        Nasıl silebilirim?
                      </p>
                      <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                        <li>Önce ilişkili kayıtları (faturalar, seferler vb.) silin</li>
                        <li>Veya bu kaydı "Pasif" duruma alın (kullanılmaz hale gelir)</li>
                        <li>Sistemden tamamen kaldırmak için tüm ilişkili kayıtların silinmesi gerekir</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
            İptal
          </AlertDialogCancel>
          {validation?.can_delete && (
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Evet, Sil
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
