// AUDIT LOG API
// Değişiklik geçmişi ve denetim kayıtları API

import { api } from './client';
import type { AuditLog, DeleteValidation, RecordMetadata } from '../types/audit';

// ============================================
// AUDIT LOG ENDPOINTS
// ============================================

export const auditApi = {
  // Tüm audit logları getir (filtrelenebilir)
  getAll: (params?: {
    table_name?: string;
    record_id?: number;
    action?: string;
    changed_by?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }) => 
    api.get<{ items: AuditLog[]; total: number }>('/audit-log', { params }),

  // Belirli bir kayıt için audit logları
  getByRecord: (tableName: string, recordId: number) => 
    api.get<AuditLog[]>(`/audit-log/${tableName}/${recordId}`),

  // Audit log ekle
  create: (data: Omit<AuditLog, 'id' | 'changed_at'>) => 
    api.post<AuditLog>('/audit-log', data),

  // Kullanıcının yaptığı değişiklikleri getir
  getByUser: (userId: number, params?: { date_from?: string; date_to?: string }) => 
    api.get<AuditLog[]>(`/audit-log/user/${userId}`, { params }),

  // Son N değişikliği getir
  getRecent: (limit: number = 50) => 
    api.get<AuditLog[]>('/audit-log/recent', { params: { limit } }),
};

// ============================================
// RECORD METADATA ENDPOINTS
// ============================================

export const recordMetadataApi = {
  // Kayıt metadata bilgisi
  getMetadata: (tableName: string, recordId: number) => 
    api.get<RecordMetadata>(`/metadata/${tableName}/${recordId}`),

  // Hareket kontrolü (silinebilir mi?)
  checkDeletable: (tableName: string, recordId: number) => 
    api.get<DeleteValidation>(`/metadata/${tableName}/${recordId}/deletable`),

  // Hareket sayısı
  getMovementCount: (tableName: string, recordId: number) => 
    api.get<{ count: number }>(`/metadata/${tableName}/${recordId}/movements`),
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Audit log oluştur (değişiklik kaydı)
 */
export async function logChange(
  tableName: string,
  recordId: number,
  action: AuditLog['action'],
  userId: number,
  userName: string,
  fieldName?: string,
  oldValue?: any,
  newValue?: any,
  notes?: string
): Promise<void> {
  try {
    await auditApi.create({
      table_name: tableName,
      record_id: recordId,
      action,
      field_name: fieldName,
      old_value: oldValue !== undefined ? JSON.stringify(oldValue) : undefined,
      new_value: newValue !== undefined ? JSON.stringify(newValue) : undefined,
      changed_by: userId,
      changed_by_name: userName,
      changed_at: new Date().toISOString(),
      notes,
    });
  } catch (error) {
    console.error('Audit log kaydedilemedi:', error);
  }
}

/**
 * Çoklu alan değişikliği logla
 */
export async function logMultipleChanges(
  tableName: string,
  recordId: number,
  userId: number,
  userName: string,
  changes: { field: string; oldValue: any; newValue: any }[],
  notes?: string
): Promise<void> {
  for (const change of changes) {
    await logChange(
      tableName,
      recordId,
      'UPDATE',
      userId,
      userName,
      change.field,
      change.oldValue,
      change.newValue,
      notes
    );
  }
}

/**
 * Silme işlemi öncesi kontrol
 */
export async function validateDelete(
  tableName: string,
  recordId: number
): Promise<{ canDelete: boolean; reason?: string; movementCount: number }> {
  try {
    const validation = await recordMetadataApi.checkDeletable(tableName, recordId);
    return {
      canDelete: validation.can_delete,
      reason: validation.reason,
      movementCount: validation.movement_count,
    };
  } catch (error) {
    console.error('Silme kontrolü yapılamadı:', error);
    return {
      canDelete: false,
      reason: 'Silme kontrolü yapılamadı',
      movementCount: 0,
    };
  }
}

// ============================================
// MOCK DATA (Backend hazır değilse)
// ============================================

const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    table_name: 'services',
    record_id: 1,
    action: 'CREATE',
    changed_by: 1,
    changed_by_name: 'Ahmet Yılmaz',
    changed_at: '2025-01-15T09:30:00Z',
    notes: 'Motorbot Sefer hizmeti oluşturuldu',
  },
  {
    id: 2,
    table_name: 'services',
    record_id: 1,
    action: 'UPDATE',
    field_name: 'service_name',
    old_value: '"Motorbot Sefer"',
    new_value: '"Motorbot Sefer Hizmeti"',
    changed_by: 1,
    changed_by_name: 'Ahmet Yılmaz',
    changed_at: '2025-01-15T10:45:00Z',
    notes: 'Hizmet adı güncellendi',
  },
  {
    id: 3,
    table_name: 'services',
    record_id: 1,
    action: 'UPDATE',
    field_name: 'description',
    old_value: '"Motorbot sefer hizmeti"',
    new_value: '"Motorbot sefer hizmeti - Terminal-Gemi arası personel taşıma"',
    changed_by: 2,
    changed_by_name: 'Mehmet Demir',
    changed_at: '2025-01-16T14:20:00Z',
    notes: 'Açıklama detaylandırıldı',
  },
  {
    id: 4,
    table_name: 'customers',
    record_id: 1,
    action: 'CREATE',
    changed_by: 1,
    changed_by_name: 'Ahmet Yılmaz',
    changed_at: '2025-01-10T11:00:00Z',
    notes: 'Yeni cari kaydı oluşturuldu',
  },
  {
    id: 5,
    table_name: 'customers',
    record_id: 1,
    action: 'UPDATE',
    field_name: 'phone',
    old_value: '"+90 232 123 45 67"',
    new_value: '"+90 232 123 45 68"',
    changed_by: 3,
    changed_by_name: 'Ayşe Kaya',
    changed_at: '2025-01-12T16:30:00Z',
    notes: 'Telefon numarası güncellendi',
  },
  {
    id: 6,
    table_name: 'motorboats',
    record_id: 1,
    action: 'CREATE',
    changed_by: 1,
    changed_by_name: 'Ahmet Yılmaz',
    changed_at: '2025-01-08T10:15:00Z',
    notes: 'Motorbot kartı oluşturuldu',
  },
  {
    id: 7,
    table_name: 'motorboats',
    record_id: 1,
    action: 'STATUS_CHANGE',
    old_value: '"TASLAK"',
    new_value: '"AKTİF"',
    changed_by: 1,
    changed_by_name: 'Ahmet Yılmaz',
    changed_at: '2025-01-08T11:00:00Z',
    notes: 'Motorbot aktif edildi',
  },
];

const MOCK_METADATA: Record<string, RecordMetadata> = {
  'services_1': {
    created_by: 1,
    created_by_name: 'Ahmet Yılmaz',
    created_at: '2025-01-15T09:30:00Z',
    updated_by: 2,
    updated_by_name: 'Mehmet Demir',
    updated_at: '2025-01-16T14:20:00Z',
    is_deleted: false,
    version: 3,
    has_movements: true,
    movement_count: 45,
  },
  'customers_1': {
    created_by: 1,
    created_by_name: 'Ahmet Yılmaz',
    created_at: '2025-01-10T11:00:00Z',
    updated_by: 3,
    updated_by_name: 'Ayşe Kaya',
    updated_at: '2025-01-12T16:30:00Z',
    is_deleted: false,
    version: 2,
    has_movements: true,
    movement_count: 120,
  },
  'motorboats_1': {
    created_by: 1,
    created_by_name: 'Ahmet Yılmaz',
    created_at: '2025-01-08T10:15:00Z',
    updated_by: 1,
    updated_by_name: 'Ahmet Yılmaz',
    updated_at: '2025-01-08T11:00:00Z',
    is_deleted: false,
    version: 2,
    has_movements: true,
    movement_count: 87,
  },
};

// Mock API
export const auditApiMock = {
  getAll: async (params?: any) => {
    let filtered = [...MOCK_AUDIT_LOGS];
    
    if (params?.table_name) {
      filtered = filtered.filter(log => log.table_name === params.table_name);
    }
    
    if (params?.record_id) {
      filtered = filtered.filter(log => log.record_id === params.record_id);
    }
    
    if (params?.action) {
      filtered = filtered.filter(log => log.action === params.action);
    }
    
    return {
      items: filtered,
      total: filtered.length,
    };
  },

  getByRecord: async (tableName: string, recordId: number) => {
    return MOCK_AUDIT_LOGS.filter(
      log => log.table_name === tableName && log.record_id === recordId
    );
  },

  create: async (data: any) => {
    const newLog: AuditLog = {
      id: Math.max(...MOCK_AUDIT_LOGS.map(l => l.id), 0) + 1,
      ...data,
      changed_at: new Date().toISOString(),
    };
    MOCK_AUDIT_LOGS.push(newLog);
    return newLog;
  },

  getByUser: async (userId: number, params?: any) => {
    return MOCK_AUDIT_LOGS.filter(log => log.changed_by === userId);
  },

  getRecent: async (limit: number = 50) => {
    return [...MOCK_AUDIT_LOGS]
      .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
      .slice(0, limit);
  },
};

export const recordMetadataApiMock = {
  getMetadata: async (tableName: string, recordId: number) => {
    const key = `${tableName}_${recordId}`;
    return MOCK_METADATA[key] || {
      created_by: 1,
      created_by_name: 'Sistem',
      created_at: new Date().toISOString(),
      is_deleted: false,
      version: 1,
      has_movements: false,
      movement_count: 0,
    };
  },

  checkDeletable: async (tableName: string, recordId: number) => {
    const metadata = await recordMetadataApiMock.getMetadata(tableName, recordId);
    
    const validation: DeleteValidation = {
      can_delete: !metadata.has_movements,
      movement_count: metadata.movement_count,
      related_records: [],
    };
    
    if (metadata.has_movements) {
      validation.reason = `Bu kayda ait ${metadata.movement_count} adet hareket bulunmaktadır. Önce hareketleri silmeniz gerekmektedir.`;
      
      if (tableName === 'services') {
        validation.related_records = [
          { table: 'invoice_line', count: metadata.movement_count, description: 'Fatura kalemleri' },
        ];
      } else if (tableName === 'customers') {
        validation.related_records = [
          { table: 'invoice', count: metadata.movement_count, description: 'Faturalar' },
        ];
      } else if (tableName === 'motorboats') {
        validation.related_records = [
          { table: 'motorboat_trips', count: metadata.movement_count, description: 'Seferler' },
        ];
      }
    }
    
    return validation;
  },

  getMovementCount: async (tableName: string, recordId: number) => {
    const metadata = await recordMetadataApiMock.getMetadata(tableName, recordId);
    return { count: metadata.movement_count };
  },
};
