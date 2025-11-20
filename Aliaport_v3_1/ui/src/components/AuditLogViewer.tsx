// AUDIT LOG VIEWER COMPONENT
// Değişiklik geçmişini gösteren component

import { useState, useEffect } from "react";
import { 
  History, 
  User, 
  Calendar, 
  FileEdit, 
  Trash2, 
  PlusCircle,
  RotateCcw,
  AlertCircle,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import type { AuditLog } from "../lib/types/audit";
import { auditApiMock } from "../lib/api/audit";
import { Theme } from "./ThemeSelector";

interface AuditLogViewerProps {
  tableName: string;
  recordId: number;
  recordName?: string; // Kaydın adı (örn: "MB-SEFER-001")
  theme: Theme;
}

export function AuditLogViewer({ tableName, recordId, recordName, theme }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, [tableName, recordId]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await auditApiMock.getByRecord(tableName, recordId);
      setLogs(data);
    } catch (error) {
      console.error('Audit logları yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Action ikonları
  const getActionIcon = (action: AuditLog['action']) => {
    switch (action) {
      case 'CREATE':
        return <PlusCircle className="w-4 h-4 text-green-400" />;
      case 'UPDATE':
        return <FileEdit className="w-4 h-4 text-blue-400" />;
      case 'DELETE':
        return <Trash2 className="w-4 h-4 text-red-400" />;
      case 'RESTORE':
        return <RotateCcw className="w-4 h-4 text-green-400" />;
      case 'STATUS_CHANGE':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <FileEdit className="w-4 h-4 text-gray-400" />;
    }
  };

  // Action renkleri
  const getActionBadge = (action: AuditLog['action']) => {
    const variants: Record<AuditLog['action'], string> = {
      CREATE: 'bg-green-500/20 text-green-300 border-green-500/30',
      UPDATE: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      DELETE: 'bg-red-500/20 text-red-300 border-red-500/30',
      RESTORE: 'bg-green-500/20 text-green-300 border-green-500/30',
      STATUS_CHANGE: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    };
    
    return variants[action] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  // Action etiketleri
  const getActionLabel = (action: AuditLog['action']) => {
    const labels: Record<AuditLog['action'], string> = {
      CREATE: 'Oluşturuldu',
      UPDATE: 'Güncellendi',
      DELETE: 'Silindi',
      RESTORE: 'Geri Yüklendi',
      STATUS_CHANGE: 'Durum Değişti',
    };
    
    return labels[action] || action;
  };

  // Tarih formatla
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

  // Alan adını Türkçe'ye çevir
  const translateFieldName = (fieldName: string): string => {
    const translations: Record<string, string> = {
      service_name: 'Hizmet Adı',
      service_code: 'Hizmet Kodu',
      description: 'Açıklama',
      unit_id: 'Birim',
      pricing_rule_id: 'Fiyatlandırma Kuralı',
      customer_name: 'Cari Adı',
      customer_code: 'Cari Kodu',
      phone: 'Telefon',
      email: 'E-posta',
      address: 'Adres',
      motorboat_name: 'Motorbot Adı',
      motorboat_code: 'Motorbot Kodu',
      capacity: 'Kapasite',
      is_active: 'Durum',
    };
    
    return translations[fieldName] || fieldName;
  };

  // Değeri parse et
  const parseValue = (value: string | undefined): string => {
    if (!value) return '-';
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'boolean') {
        return parsed ? 'Aktif' : 'Pasif';
      }
      return String(parsed);
    } catch {
      return value;
    }
  };

  if (loading) {
    return (
      <Card className={`${theme.colors.bgCard} border-${theme.colors.border}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
            <span className="ml-3 text-gray-400">Değişiklik geçmişi yükleniyor...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className={`${theme.colors.bgCard} border-${theme.colors.border}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Değişiklik Geçmişi
          </CardTitle>
          <CardDescription>
            {recordName && `${recordName} - `}Henüz değişiklik kaydı bulunmuyor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Bu kayıt için değişiklik geçmişi bulunmuyor.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${theme.colors.bgCard} border-${theme.colors.border}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Değişiklik Geçmişi
        </CardTitle>
        <CardDescription>
          {recordName && `${recordName} - `}{logs.length} değişiklik kaydı
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-gray-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-800/50 hover:bg-gray-800/50">
                <TableHead className="w-12"></TableHead>
                <TableHead className="text-gray-300">İşlem</TableHead>
                <TableHead className="text-gray-300">Alan</TableHead>
                <TableHead className="text-gray-300">Eski Değer</TableHead>
                <TableHead className="text-gray-300">Yeni Değer</TableHead>
                <TableHead className="text-gray-300">Değiştiren</TableHead>
                <TableHead className="text-gray-300">Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, index) => (
                <TableRow 
                  key={log.id}
                  className={index % 2 === 0 ? 'bg-gray-900/30' : 'bg-gray-900/50'}
                >
                  <TableCell>
                    {getActionIcon(log.action)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getActionBadge(log.action)}>
                      {getActionLabel(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white">
                    {log.field_name ? translateFieldName(log.field_name) : '-'}
                  </TableCell>
                  <TableCell className="text-gray-400 max-w-xs truncate">
                    {log.old_value ? (
                      <code className="text-xs bg-gray-800 px-2 py-1 rounded">
                        {parseValue(log.old_value)}
                      </code>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-white max-w-xs truncate">
                    {log.new_value ? (
                      <code className="text-xs bg-gray-700 px-2 py-1 rounded">
                        {parseValue(log.new_value)}
                      </code>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-white text-sm">{log.changed_by_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Clock className="w-4 h-4" />
                      {formatDate(log.changed_at)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Notlar varsa göster */}
        {logs.some(log => log.notes) && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm text-gray-400 flex items-center gap-2">
              <FileEdit className="w-4 h-4" />
              Açıklamalar
            </h4>
            {logs.filter(log => log.notes).map(log => (
              <div 
                key={log.id}
                className="text-sm bg-gray-800/50 p-3 rounded border border-gray-700"
              >
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-gray-400 text-xs mb-1">
                      {formatDate(log.changed_at)} - {log.changed_by_name}
                    </div>
                    <div className="text-white">{log.notes}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
