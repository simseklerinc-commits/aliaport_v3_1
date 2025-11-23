// İŞ EMRİ CARD - İş Emri detay component
// SQL: work_order tablosuna 1:1 eşleşen UI kartı
// Props: WorkOrder model (database.ts'den)

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { 
  ClipboardList, 
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Clock,
  Package,
  Building2,
  Flag,
  Shield
} from "lucide-react";
import type { WorkOrder } from "../../lib/types/database";
import { getStatusColor, getPriorityColor } from "../../lib/api/is-emri";

interface IsEmriCardProps {
  workOrder: WorkOrder;
  onEdit?: (workOrder: WorkOrder) => void;
  onDelete?: (id: number) => void;
  onView?: (workOrder: WorkOrder) => void;
  onStatusChange?: (id: number, status: WorkOrder['status']) => void;
  showActions?: boolean;
  compact?: boolean;
}

export function IsEmriCard({ 
  workOrder, 
  onEdit, 
  onDelete, 
  onView,
  onStatusChange,
  showActions = true,
  compact = false
}: IsEmriCardProps) {
  // Tip badge rengi
  const getTypeColor = (type: WorkOrder['type']) => {
    const colors: Record<WorkOrder['type'], string> = {
      'HIZMET': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      'MOTORBOT': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      'BARINMA': 'bg-green-500/20 text-green-400 border-green-500/50',
      'DIGER': 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  // Durum etiketi
  const getStatusLabel = (status: WorkOrder['status']) => {
    const labels: Record<WorkOrder['status'], string> = {
      'DRAFT': 'Taslak',
      'SUBMITTED': 'Gönderildi',
      'APPROVED': 'Onaylandı',
      'SAHADA': 'Sahada',
      'TAMAMLANDI': 'Tamamlandı',
      'FATURALANDI': 'Faturalandı',
      'KAPANDI': 'Kapatıldı',
      'REJECTED': 'Reddedildi',
    };
    return labels[status] || status;
  };

  // Öncelik etiketi
  const getPriorityLabel = (priority: WorkOrder['priority']) => {
    const labels: Record<WorkOrder['priority'], string> = {
      'LOW': 'Düşük',
      'MEDIUM': 'Orta',
      'HIGH': 'Yüksek',
      'URGENT': 'Acil',
    };
    return labels[priority] || priority;
  };

  // Tip etiketi
  const getTypeLabel = (type: WorkOrder['type']) => {
    const labels: Record<WorkOrder['type'], string> = {
      'HIZMET': 'Hizmet',
      'MOTORBOT': 'Motorbot',
      'BARINMA': 'Barınma',
      'DIGER': 'Diğer',
    };
    return labels[type] || type;
  };

  return (
    <div 
      className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-all cursor-pointer"
      onClick={() => onView?.(workOrder)}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-blue-800/10 p-4 border-b border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              workOrder.is_active 
                ? 'bg-blue-500/20 border border-blue-500/50' 
                : 'bg-gray-700/50 border border-gray-600'
            }`}>
              <ClipboardList className={`w-6 h-6 ${
                workOrder.is_active ? 'text-blue-400' : 'text-gray-500'
              }`} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-white">{workOrder.subject}</h3>
                {workOrder.priority === 'URGENT' && (
                  <AlertCircle className="w-4 h-4 text-red-400 animate-pulse" />
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-400 font-mono">{workOrder.wo_number}</span>
                <Badge className={getStatusColor(workOrder.status)}>
                  {getStatusLabel(workOrder.status)}
                </Badge>
                <Badge className={getTypeColor(workOrder.type)}>
                  {getTypeLabel(workOrder.type)}
                </Badge>
                <Badge className={getPriorityColor(workOrder.priority)}>
                  {getPriorityLabel(workOrder.priority)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(workOrder)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(workOrder.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      {!compact && (
        <div className="p-4 space-y-3">
          {/* Description */}
          {workOrder.description && (
            <div className="text-sm text-gray-300">
              {workOrder.description}
            </div>
          )}

          {/* Cari Info */}
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs text-gray-500">Cari:</div>
                <div className="text-sm text-white font-medium">
                  {workOrder.cari_code} - {workOrder.cari_title}
                </div>
              </div>
            </div>
          </div>

          {/* Dates & Times */}
          <div className="grid grid-cols-2 gap-2">
            {workOrder.planned_start && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-blue-400" />
                  <div>
                    <div className="text-xs text-gray-400">Planlanan Başlangıç</div>
                    <div className="text-xs text-white">
                      {new Date(workOrder.planned_start).toLocaleString('tr-TR')}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {workOrder.actual_start && (
              <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-green-400" />
                  <div>
                    <div className="text-xs text-gray-400">Gerçek Başlangıç</div>
                    <div className="text-xs text-white">
                      {new Date(workOrder.actual_start).toLocaleString('tr-TR')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2">
            {workOrder.gate_required && (
              <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                <Shield className="w-3 h-3 mr-1" />
                Güvenlik Gerekli
              </Badge>
            )}
            {workOrder.is_cabatoge_tr_flag && (
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
                <Flag className="w-3 h-3 mr-1" />
                Kabotaj İndirim
              </Badge>
            )}
            {workOrder.attachments_count > 0 && (
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
                <FileText className="w-3 h-3 mr-1" />
                {workOrder.attachments_count} Dosya
              </Badge>
            )}
            {workOrder.has_signature && (
              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                İmzalı
              </Badge>
            )}
          </div>

          {/* Notes */}
          {workOrder.notes && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 text-xs text-yellow-200">
              <div className="flex items-start gap-2">
                <FileText className="w-3 h-3 mt-0.5" />
                <div>{workOrder.notes}</div>
              </div>
            </div>
          )}

          {/* Requester */}
          {workOrder.requester_user_name && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <User className="w-3 h-3" />
              <span>Talep Eden: {workOrder.requester_user_name}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer - Metadata */}
      <div className="bg-gray-900/30 px-4 py-2 text-xs text-gray-500 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            Oluşturan: {workOrder.created_by_name || `User#${workOrder.created_by}`}
          </div>
          <div>
            {new Date(workOrder.created_at).toLocaleDateString('tr-TR')}
          </div>
        </div>
        {workOrder.updated_at && (
          <div className="mt-1">
            Güncelleme: {new Date(workOrder.updated_at).toLocaleDateString('tr-TR')}
            {workOrder.updated_by_name && ` • ${workOrder.updated_by_name}`}
          </div>
        )}
      </div>
    </div>
  );
}
