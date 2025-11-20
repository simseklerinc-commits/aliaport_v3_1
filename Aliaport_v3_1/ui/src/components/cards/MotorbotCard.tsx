// MOTORBOT CARD - Motorbot master data + contract info
// SQL: motorbot + barinma_contract (optional)
// Props: Motorbot veya MotorbotWithContract model

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { 
  Anchor, 
  Edit,
  Trash2,
  User,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  Ruler,
  Gauge,
  Fuel,
  Droplet,
  Flag
} from "lucide-react";
import type { Motorbot, MotorbotWithContract } from "../../lib/types/database";

interface MotorbotCardProps {
  motorbot: Motorbot | MotorbotWithContract;
  onEdit?: (motorbot: Motorbot | MotorbotWithContract) => void;
  onDelete?: (id: number) => void;
  onViewContract?: (id: number) => void;
  onClick?: (motorbot: Motorbot | MotorbotWithContract) => void;
  showActions?: boolean;
  showContract?: boolean;
}

export function MotorbotCard({ 
  motorbot, 
  onEdit, 
  onDelete, 
  onViewContract,
  onClick,
  showActions = true,
  showContract = true
}: MotorbotCardProps) {
  const withContract = 'active_contract' in motorbot ? motorbot : null;
  const hasContract = withContract?.has_contract || false;
  
  // Type cast to access extended properties
  const mb = motorbot as any;

  // Boat type badge rengi
  const getBoatTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Yelkenli': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      'Motor Yat': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      'Katamaran': 'bg-green-500/20 text-green-400 border-green-500/50',
      'Gulet': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      'Trawler': 'bg-red-500/20 text-red-400 border-red-500/50',
      'Motorbot': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  return (
    <div 
      className={`bg-gray-800/50 border rounded-lg overflow-hidden hover:border-gray-600 transition-all cursor-pointer ${
        motorbot.is_active ? 'border-blue-500/30' : 'border-gray-700'
      }`}
      onDoubleClick={() => onClick?.(motorbot)}
    >
      {/* Header */}
      <div className={`p-4 border-b border-gray-700 ${
        motorbot.is_active 
          ? 'bg-gradient-to-r from-blue-600/20 to-blue-800/10' 
          : 'bg-gradient-to-r from-gray-600/20 to-gray-800/10'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              motorbot.is_active
                ? 'bg-blue-500/20 border border-blue-500/50' 
                : 'bg-gray-700/50 border border-gray-600'
            }`}>
              <Anchor className={`w-6 h-6 ${
                motorbot.is_active ? 'text-blue-400' : 'text-gray-500'
              }`} />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white">{motorbot.name}</h3>
                {motorbot.is_active && (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                )}
                {!motorbot.is_active && (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 font-mono">{motorbot.code}</span>
                {mb.boat_type && (
                  <Badge className={getBoatTypeColor(mb.boat_type)}>
                    {mb.boat_type}
                  </Badge>
                )}
                {hasContract && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                    Kontrat Aktif
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-1">
              {onViewContract && hasContract && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); onViewContract(motorbot.id); }}
                  className="text-green-400 hover:text-green-300"
                >
                  <FileText className="w-4 h-4" />
                </Button>
              )}
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); onEdit(motorbot); }}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); onDelete(motorbot.id); }}
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
        {/* Owner Info */}
        {mb.owner_name && (
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Tekne Sahibi</span>
            </div>
            <div className="text-white font-medium">{mb.owner_name}</div>
            {mb.owner_cari_code && (
              <div className="text-sm text-gray-400 font-mono">{mb.owner_cari_code}</div>
            )}
          </div>
        )}

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Length */}
          {(mb.length_meters || mb.length) && (
            <div className="bg-gray-900/30 rounded p-2">
              <div className="flex items-center gap-1 mb-1">
                <Ruler className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-gray-500">Boy</span>
              </div>
              <div className="text-sm text-white font-bold">{mb.length_meters || mb.length}m</div>
            </div>
          )}

          {/* Width */}
          {(mb.width_meters || mb.width || mb.beam_meters) && (
            <div className="bg-gray-900/30 rounded p-2">
              <div className="flex items-center gap-1 mb-1">
                <Ruler className="w-3 h-3 text-purple-400" />
                <span className="text-xs text-gray-500">En</span>
              </div>
              <div className="text-sm text-white font-bold">{mb.width_meters || mb.width || mb.beam_meters}m</div>
            </div>
          )}

          {/* Draft */}
          {(mb.draft_meters || mb.draft) && (
            <div className="bg-gray-900/30 rounded p-2">
              <div className="flex items-center gap-1 mb-1">
                <Droplet className="w-3 h-3 text-cyan-400" />
                <span className="text-xs text-gray-500">Draft</span>
              </div>
              <div className="text-sm text-white font-bold">{mb.draft_meters || mb.draft}m</div>
            </div>
          )}

          {/* Year */}
          {mb.year_built && (
            <div className="bg-gray-900/30 rounded p-2">
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-orange-400" />
                <span className="text-xs text-gray-500">Yapım</span>
              </div>
              <div className="text-sm text-white font-bold">{mb.year_built}</div>
            </div>
          )}
        </div>

        {/* Registration */}
        {(mb.flag || mb.registration_number) && (
          <div className="flex items-center justify-between text-xs bg-gray-900/30 rounded p-2">
            {mb.flag && (
              <div className="flex items-center gap-2">
                <Flag className="w-3 h-3 text-gray-400" />
                <span className="text-gray-500">Bayrak:</span>
                <span className="text-white font-mono">{mb.flag}</span>
              </div>
            )}
            {mb.registration_number && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Sicil:</span>
                <span className="text-white font-mono">{mb.registration_number}</span>
              </div>
            )}
          </div>
        )}

        {/* Active Contract (if available) */}
        {showContract && withContract?.active_contract && (
          <div className="border-t border-gray-800 pt-3">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-400">Barınma Kontratı</span>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                  {withContract.active_contract.is_active ? 'Aktif' : 'Pasif'}
                </Badge>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Kontrat No:</span>
                  <span className="text-white font-mono">{withContract.active_contract.contract_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Birim Fiyat:</span>
                  <span className="text-green-400 font-bold">
                    {withContract.active_contract.unit_price?.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }) || '0.00'} {withContract.active_contract.currency || 'TRY'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dönem:</span>
                  <span className="text-white">
                    {withContract.active_contract.start_date && new Date(withContract.active_contract.start_date).toLocaleDateString('tr-TR')}
                    {withContract.active_contract.end_date && (
                      <> - {new Date(withContract.active_contract.end_date).toLocaleDateString('tr-TR')}</>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Faturalama:</span>
                  <span className="text-blue-400">{withContract.active_contract.billing_period || 'Belirtilmemiş'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {motorbot.notes && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 text-xs text-yellow-200">
            <div className="flex items-start gap-2">
              <FileText className="w-3 h-3 mt-0.5" />
              <div>{motorbot.notes}</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900/30 px-4 py-2 text-xs text-gray-500 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            Kayıt: {new Date(motorbot.created_at).toLocaleDateString('tr-TR')}
            {motorbot.updated_at && (
              <> • Güncelleme: {new Date(motorbot.updated_at).toLocaleDateString('tr-TR')}</>
            )}
          </div>
          <Badge variant="outline" className={
            motorbot.is_active 
              ? 'border-green-500/50 text-green-400' 
              : 'border-red-500/50 text-red-400'
          }>
            {motorbot.is_active ? 'Aktif' : 'Pasif'}
          </Badge>
        </div>
      </div>
    </div>
  );
}