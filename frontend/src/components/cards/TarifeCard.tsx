// TARIFE CARD - Fiyat Listesi detay component
// SQL: price_list + price_list_item (master-detail)
// Props: PriceList veya PriceListWithItems model

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { 
  DollarSign, 
  Edit,
  Trash2,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  Archive,
  Package,
  TrendingUp
} from "lucide-react";
import type { PriceList, PriceListWithItems } from "../../lib/types/database";

interface TarifeCardProps {
  tarife: PriceList | PriceListWithItems;
  onEdit?: (tarife: PriceList) => void;
  onDelete?: (id: number) => void;
  onViewItems?: (id: number) => void;
  showActions?: boolean;
  showItems?: boolean;
}

export function TarifeCard({ 
  tarife, 
  onEdit, 
  onDelete, 
  onViewItems,
  showActions = true,
  showItems = false
}: TarifeCardProps) {
  const withItems = 'items' in tarife ? tarife : null;

  // Status badge rengi
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'AKTIF': 'bg-green-500/20 text-green-400 border-green-500/50',
      'TASLAK': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      'ARŞİV': 'bg-gray-500/20 text-gray-400 border-gray-500/50',
      'BEKLEMEDE': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  // Status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AKTIF':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'TASLAK':
        return <Clock className="w-4 h-4" />;
      case 'ARŞİV':
        return <Archive className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Geçerlilik kontrolü
  const isValid = () => {
    const today = new Date();
    const validFrom = new Date(tarife.valid_from);
    const validTo = tarife.valid_to ? new Date(tarife.valid_to) : null;
    
    if (validTo) {
      return today >= validFrom && today <= validTo;
    }
    return today >= validFrom;
  };

  return (
    <div className={`bg-gray-800/50 border rounded-lg overflow-hidden hover:border-gray-600 transition-all ${
      isValid() ? 'border-green-500/30' : 'border-gray-700'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b border-gray-700 ${
        tarife.status === 'AKTIF' 
          ? 'bg-gradient-to-r from-green-600/20 to-green-800/10' 
          : tarife.status === 'TASLAK'
          ? 'bg-gradient-to-r from-yellow-600/20 to-yellow-800/10'
          : 'bg-gradient-to-r from-gray-600/20 to-gray-800/10'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              tarife.status === 'AKTIF'
                ? 'bg-green-500/20 border border-green-500/50' 
                : tarife.status === 'TASLAK'
                ? 'bg-yellow-500/20 border border-yellow-500/50'
                : 'bg-gray-700/50 border border-gray-600'
            }`}>
              <DollarSign className={`w-6 h-6 ${
                tarife.status === 'AKTIF' ? 'text-green-400' : 
                tarife.status === 'TASLAK' ? 'text-yellow-400' : 'text-gray-500'
              }`} />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white">{tarife.name}</h3>
                {isValid() && tarife.status === 'AKTIF' && (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 font-mono">{tarife.code}</span>
                <Badge className={getStatusColor(tarife.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(tarife.status)}
                    {tarife.status}
                  </span>
                </Badge>
                <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                  v{tarife.version}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-1">
              {onViewItems && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onViewItems(tarife.id)}
                  className="text-purple-400 hover:text-purple-300"
                >
                  <Package className="w-4 h-4" />
                </Button>
              )}
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(tarife)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(tarife.id)}
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
        {tarife.description && (
          <div className="text-sm text-gray-300">
            {tarife.description}
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Currency */}
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Para Birimi</div>
            <div className="text-lg font-bold text-white">
              {tarife.currency}
            </div>
          </div>

          {/* Item Count (if available) */}
          {withItems && (
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Kalem Sayısı</div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-400" />
                {withItems.item_count || 0}
              </div>
            </div>
          )}
        </div>

        {/* Validity Period */}
        <div className={`rounded-lg p-3 ${
          isValid() 
            ? 'bg-green-500/10 border border-green-500/30' 
            : 'bg-gray-900/50 border border-gray-700'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className={`w-4 h-4 ${isValid() ? 'text-green-400' : 'text-gray-400'}`} />
            <span className="text-xs text-gray-400">Geçerlilik Dönemi</span>
          </div>
          <div className="text-sm text-white">
            {new Date(tarife.valid_from).toLocaleDateString('tr-TR')}
            {tarife.valid_to && (
              <> → {new Date(tarife.valid_to).toLocaleDateString('tr-TR')}</>
            )}
            {!tarife.valid_to && <> → Süresiz</>}
          </div>
          {isValid() && (
            <div className="mt-1 text-xs text-green-400">✓ Aktif tarife</div>
          )}
        </div>

        {/* Total Value (if available) */}
        {withItems && withItems.total_value !== undefined && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Toplam Değer</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-400">
                  {withItems.total_value.toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} {tarife.currency}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Items Preview (if available and showItems enabled) */}
        {showItems && withItems && withItems.items && withItems.items.length > 0 && (
          <div className="border-t border-gray-800 pt-3">
            <div className="text-xs text-gray-500 mb-2">Tarife Kalemleri (İlk 3)</div>
            <div className="space-y-2">
              {withItems.items.slice(0, 3).map(item => (
                <div key={item.id} className="bg-gray-900/30 rounded p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{item.service_name}</div>
                      <div className="text-gray-500 font-mono">{item.service_code}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">
                        {item.unit_price.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} {item.currency}
                      </div>
                      <div className="text-gray-500">KDV: %{item.vat_rate}</div>
                    </div>
                  </div>
                </div>
              ))}
              {withItems.items.length > 3 && (
                <div className="text-center text-gray-500 text-xs">
                  +{withItems.items.length - 3} kalem daha...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {tarife.notes && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 text-xs text-yellow-200">
            <div className="flex items-start gap-2">
              <FileText className="w-3 h-3 mt-0.5" />
              <div>{tarife.notes}</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Metadata */}
      <div className="bg-gray-900/30 px-4 py-2 text-xs text-gray-500 border-t border-gray-800">
        Oluşturulma: {new Date(tarife.created_at).toLocaleDateString('tr-TR')}
        {tarife.updated_at && (
          <> • Güncelleme: {new Date(tarife.updated_at).toLocaleDateString('tr-TR')}</>
        )}
      </div>
    </div>
  );
}
