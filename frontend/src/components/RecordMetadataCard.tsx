// RECORD METADATA CARD
// Kayıt oluşturan, güncelleyen kullanıcı bilgileri ve metadata

import { useEffect, useState } from "react";
import { User, Calendar, Edit, AlertCircle, Database, GitBranch } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import type { RecordMetadata } from "../lib/types/audit";
import { recordMetadataApiMock } from "../lib/api/audit";
import { Theme } from "./ThemeSelector";

interface RecordMetadataCardProps {
  tableName: string;
  recordId: number;
  theme: Theme;
  compact?: boolean; // Kompakt gösterim
}

export function RecordMetadataCard({ 
  tableName, 
  recordId, 
  theme, 
  compact = false 
}: RecordMetadataCardProps) {
  const [metadata, setMetadata] = useState<RecordMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetadata();
  }, [tableName, recordId]);

  const loadMetadata = async () => {
    setLoading(true);
    try {
      const data = await recordMetadataApiMock.getMetadata(tableName, recordId);
      setMetadata(data);
    } catch (error) {
      console.error('Metadata yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card className={`${theme.colors.bgCard} border-${theme.colors.border}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            <span className="text-sm">Yükleniyor...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metadata) {
    return null;
  }

  // Kompakt gösterim
  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
        {/* Oluşturan */}
        <div>
          <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <User className="w-3 h-3" />
            Oluşturan
          </div>
          <div className="text-sm text-white">{metadata.created_by_name}</div>
          <div className="text-xs text-gray-500">{formatDate(metadata.created_at)}</div>
        </div>

        {/* Son Güncelleyen */}
        {metadata.updated_by && (
          <div>
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <Edit className="w-3 h-3" />
              Son Güncelleyen
            </div>
            <div className="text-sm text-white">{metadata.updated_by_name}</div>
            <div className="text-xs text-gray-500">{formatDate(metadata.updated_at!)}</div>
          </div>
        )}

        {/* Versiyon ve Hareket */}
        <div>
          <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            Versiyon
          </div>
          <div className="text-sm text-white">v{metadata.version}</div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <Database className="w-3 h-3" />
            Hareket Sayısı
          </div>
          <div className="text-sm">
            {metadata.has_movements ? (
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                {metadata.movement_count} hareket
              </Badge>
            ) : (
              <span className="text-gray-400">Hareket yok</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Tam gösterim
  return (
    <Card className={`${theme.colors.bgCard} border-${theme.colors.border}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="w-5 h-5" />
          Kayıt Bilgileri
        </CardTitle>
        <CardDescription>
          Oluşturma ve güncelleme detayları
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Oluşturma Bilgisi */}
        <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded bg-green-500/20">
              <User className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-1">Oluşturan Kullanıcı</div>
              <div className="text-base text-white mb-1">{metadata.created_by_name}</div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Calendar className="w-4 h-4" />
                {formatDate(metadata.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Güncelleme Bilgisi */}
        {metadata.updated_by && (
          <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-blue-500/20">
                <Edit className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Son Güncelleyen</div>
                <div className="text-base text-white mb-1">{metadata.updated_by_name}</div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  {formatDate(metadata.updated_at!)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Versiyon ve Durum */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Versiyon</span>
            </div>
            <div className="text-2xl text-white">v{metadata.version}</div>
          </div>

          <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Hareket</span>
            </div>
            <div className="text-2xl">
              {metadata.has_movements ? (
                <span className="text-yellow-400">{metadata.movement_count}</span>
              ) : (
                <span className="text-gray-500">0</span>
              )}
            </div>
          </div>
        </div>

        {/* Hareket Uyarısı */}
        {metadata.has_movements && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm text-yellow-300 mb-1">
                  Bu kayda ait {metadata.movement_count} adet hareket bulunmaktadır
                </div>
                <div className="text-xs text-gray-400">
                  Bazı alanlar ve silme işlemi kısıtlanmıştır
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Silme Bilgisi */}
        {metadata.is_deleted && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-red-500/20">
                <User className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Silen Kullanıcı</div>
                <div className="text-base text-white mb-1">{metadata.deleted_by_name}</div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  {metadata.deleted_at && formatDate(metadata.deleted_at)}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
