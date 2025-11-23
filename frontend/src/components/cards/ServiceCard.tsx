// SERVICE CARD - Hizmet Kartı detay component
// SQL: service_card tablosuna 1:1 eşleşen UI kartı
// Props: ServiceCard model (database.ts'den)

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { 
  Package, 
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Tag,
  FileText,
  Ruler,
  DollarSign
} from "lucide-react";
import type { ServiceCard, ServiceCardWithPrice } from "../../lib/types/database";

interface ServiceCardProps {
  service: ServiceCard | ServiceCardWithPrice;
  onEdit?: (service: ServiceCard) => void;
  onDelete?: (id: number) => void;
  onToggleActive?: (id: number) => void;
  showActions?: boolean;
  showPrice?: boolean;
}

export function ServiceCard({ 
  service, 
  onEdit, 
  onDelete, 
  onToggleActive,
  showActions = true,
  showPrice = false
}: ServiceCardProps) {
  const priceInfo = 'current_price' in service ? service : null;

  // Kategori badge rengi
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'MOTORBOT': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      'BARINMA': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      'ELEKTRIK': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      'SU': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
      'FUEL': 'bg-red-500/20 text-red-400 border-red-500/50',
      'BAKIM': 'bg-green-500/20 text-green-400 border-green-500/50',
      'TEKNIK': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      'SAHA': 'bg-pink-500/20 text-pink-400 border-pink-500/50',
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  // Birim etiketleri
  const getUnitLabel = (unit: string) => {
    const labels: Record<string, string> = {
      'SEFER': 'Sefer',
      'AY': 'Ay',
      'GUN': 'Gün',
      'KWH': 'kWh',
      'M3': 'm³',
      'LITRE': 'Litre',
      'SAAT': 'Saat',
      'ADET': 'Adet',
      'KG': 'Kg',
      'METRE': 'Metre',
    };
    return labels[unit] || unit;
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-all">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/10 p-4 border-b border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              service.is_active 
                ? 'bg-purple-500/20 border border-purple-500/50' 
                : 'bg-gray-700/50 border border-gray-600'
            }`}>
              <Package className={`w-6 h-6 ${
                service.is_active ? 'text-purple-400' : 'text-gray-500'
              }`} />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white">{service.name}</h3>
                {service.is_active ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 font-mono">{service.code}</span>
                <Badge className={getCategoryColor(service.category)}>
                  {service.category}
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
                  onClick={() => onEdit(service)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onToggleActive && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onToggleActive(service.id)}
                  className={service.is_active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}
                >
                  {service.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(service.id)}
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
        {/* Description */}
        {service.description && (
          <div className="text-sm text-gray-300">
            {service.description}
          </div>
        )}

        {/* Unit Info */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-gray-400" />
            <div>
              <span className="text-xs text-gray-500">Birim:</span>
              <span className="ml-2 text-sm text-white font-medium">
                {getUnitLabel(service.unit)}
              </span>
            </div>
          </div>
        </div>

        {/* Price Info (if available) */}
        {showPrice && priceInfo && priceInfo.current_price !== undefined && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">Fiyat:</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-400">
                  {priceInfo.current_price.toFixed(2)} {priceInfo.currency || 'TRY'}
                </div>
                {priceInfo.price_list_name && (
                  <div className="text-xs text-gray-500">
                    {priceInfo.price_list_name}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {service.notes && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 text-xs text-yellow-200">
            <div className="flex items-start gap-2">
              <FileText className="w-3 h-3 mt-0.5" />
              <div>{service.notes}</div>
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="bg-gray-900/30 px-4 py-2 text-xs text-gray-500 border-t border-gray-800">
        Oluşturulma: {new Date(service.created_at).toLocaleDateString('tr-TR')}
        {service.updated_at && (
          <> • Güncelleme: {new Date(service.updated_at).toLocaleDateString('tr-TR')}</>
        )}
      </div>
    </div>
  );
}
