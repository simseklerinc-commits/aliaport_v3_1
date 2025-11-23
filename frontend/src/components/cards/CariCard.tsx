// CARİ CARD - Cari detay kartı
// SQL: tmm_cari tablosuna 1:1 eşleşen UI kartı
// Props: Cari model (database.ts'den)

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  User,
  DollarSign,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import type { Cari, CariWithStats } from "../../lib/types/database";

interface CariCardProps {
  cari: Cari | CariWithStats;
  onEdit?: (cari: Cari) => void;
  onDelete?: (id: number) => void;
  onToggleActive?: (id: number) => void;
  onViewEkstre?: (id: number) => void;
  showActions?: boolean;
}

export function CariCard({ 
  cari, 
  onEdit, 
  onDelete, 
  onToggleActive,
  onViewEkstre,
  showActions = true 
}: CariCardProps) {
  const stats = 'total_invoices' in cari ? cari : null;

  // Tip badge rengi
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CUSTOMER':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'SUPPLIER':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'BOTH':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CUSTOMER': return 'Müşteri';
      case 'SUPPLIER': return 'Tedarikçi';
      case 'BOTH': return 'Müşteri & Tedarikçi';
      default: return type;
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-all">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-blue-800/10 p-4 border-b border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              cari.is_active 
                ? 'bg-blue-500/20 border border-blue-500/50' 
                : 'bg-gray-700/50 border border-gray-600'
            }`}>
              <Building2 className={`w-6 h-6 ${
                cari.is_active ? 'text-blue-400' : 'text-gray-500'
              }`} />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white">{cari.title}</h3>
                {cari.is_active ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 font-mono">{cari.code}</span>
                <Badge className={getTypeColor(cari.type)}>
                  {getTypeLabel(cari.type)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(cari)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onToggleActive && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onToggleActive(cari.id)}
                  className={cari.is_active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}
                >
                  {cari.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(cari.id)}
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
      <div className="p-4 space-y-3">
        {/* Tax Info */}
        {(cari.tax_office || cari.tax_number) && (
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Vergi Bilgileri</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {cari.tax_office && (
                <div>
                  <span className="text-gray-500">Vergi Dairesi:</span>
                  <span className="ml-2 text-white">{cari.tax_office}</span>
                </div>
              )}
              {cari.tax_number && (
                <div>
                  <span className="text-gray-500">Vergi No:</span>
                  <span className="ml-2 text-white font-mono">{cari.tax_number}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-2">
          {cari.contact_person && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">{cari.contact_person}</span>
            </div>
          )}
          
          {cari.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">{cari.phone}</span>
            </div>
          )}
          
          {cari.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">{cari.email}</span>
            </div>
          )}
          
          {cari.address && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="text-gray-300">
                <div>{cari.address}</div>
                {(cari.city || cari.country) && (
                  <div className="text-gray-500 text-xs mt-0.5">
                    {[cari.city, cari.country].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats (if available) */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-700">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">
                {stats.total_invoices || 0}
              </div>
              <div className="text-xs text-gray-500">Fatura</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">
                ${(stats.total_amount || 0).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Toplam</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">
                ${(stats.balance || 0).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Bakiye</div>
            </div>
          </div>
        )}

        {/* Notes */}
        {cari.notes && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 text-xs text-yellow-200">
            {cari.notes}
          </div>
        )}
      </div>

      {/* Footer */}
      {showActions && onViewEkstre && (
        <div className="bg-gray-900/50 border-t border-gray-700 p-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewEkstre(cari.id)}
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <FileText className="w-4 h-4 mr-2" />
            Cari Ekstre Görüntüle
          </Button>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-gray-900/30 px-4 py-2 text-xs text-gray-500 border-t border-gray-800">
        Oluşturulma: {new Date(cari.created_at).toLocaleDateString('tr-TR')}
        {cari.updated_at && (
          <> • Güncelleme: {new Date(cari.updated_at).toLocaleDateString('tr-TR')}</>
        )}
      </div>
    </div>
  );
}
