// İŞ EMRİ API - İş Emri ve Dijital Arşiv modülü için API endpoints
// GET, POST, PUT, DELETE işlemleri
// WorkOrder + WorkOrderItem + ArchiveDoc + SecurityGateLog

import { api } from './client';
import type { 
  WorkOrder,
  WorkOrderItem,
  ArchiveDoc,
  SecurityGateLog,
  CariUser,
  MagicToken,
  PaginatedResponse 
} from '../types/database';

// ============================================
// WORK ORDER ENDPOINTS
// ============================================

export const workOrderApi = {
  // Tüm iş emirlerini getir (pagination + filter)
  getAll: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    cari_code?: string;
    status?: WorkOrder['status'];
    type?: WorkOrder['type'];
    priority?: WorkOrder['priority'];
    date_from?: string;
    date_to?: string;
  }) => 
    api.get<WorkOrder[]>('/work-order', { params }),

  // Tek iş emri detayı
  getById: (id: number) => 
    api.get<WorkOrder>(`/work-order/${id}`),

  // İş emri numarası ile getir
  getByWoNumber: (woNumber: string) => 
    api.get<WorkOrder>(`/work-order/number/${woNumber}`),

  // Cariye göre iş emirleri
  getByCari: (cariCode: string, params?: { status?: string }) => 
    api.get<WorkOrder[]>(`/work-order/cari/${cariCode}`, { params }),

  // Yeni iş emri oluştur
  create: (data: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<WorkOrder>('/work-order', data),

  // İş emri güncelle
  update: (id: number, data: Partial<WorkOrder>) => 
    api.put<WorkOrder>(`/work-order/${id}`, data),

  // İş emri sil
  delete: (id: number) => 
    api.delete<void>(`/work-order/${id}`),

  // Durum değiştir
  changeStatus: (id: number, status: WorkOrder['status'], notes?: string) => 
    api.patch<WorkOrder>(`/work-order/${id}/status`, { status, notes }),

  // Onay/Red işlemleri
  approve: (id: number, notes?: string) => 
    api.post<WorkOrder>(`/work-order/${id}/approve`, { notes }),

  reject: (id: number, reason: string) => 
    api.post<WorkOrder>(`/work-order/${id}/reject`, { reason }),

  // İstatistikler
  getStats: (params?: { date_from?: string; date_to?: string }) => 
    api.get<{
      total: number;
      by_status: Record<string, number>;
      by_priority: Record<string, number>;
      by_type: Record<string, number>;
    }>('/work-order/stats', { params }),
};

// ============================================
// WORK ORDER ITEM ENDPOINTS
// ============================================

export const workOrderItemApi = {
  // İş emrine ait kalemleri getir
  getByWorkOrder: (workOrderId: number) => 
    api.get<WorkOrderItem[]>(`/work-order-item/wo/${workOrderId}`),

  // Kalem detayı
  getById: (id: number) => 
    api.get<WorkOrderItem>(`/work-order-item/${id}`),

  // Yeni kalem ekle
  create: (data: Omit<WorkOrderItem, 'id' | 'created_at'>) => 
    api.post<WorkOrderItem>('/work-order-item', data),

  // Kalem güncelle
  update: (id: number, data: Partial<WorkOrderItem>) => 
    api.put<WorkOrderItem>(`/work-order-item/${id}`, data),

  // Kalem sil
  delete: (id: number) => 
    api.delete<void>(`/work-order-item/${id}`),

  // WorkLog kalemleri (zamana dayalı)
  getWorkLogs: (workOrderId: number) => 
    api.get<WorkOrderItem[]>(`/work-order-item/wo/${workOrderId}/worklogs`),

  // Faturalanamayan kalemleri getir
  getUninvoiced: (params?: { cari_code?: string; date_from?: string }) => 
    api.get<WorkOrderItem[]>('/work-order-item/uninvoiced', { params }),
};

// ============================================
// ARCHIVE DOC ENDPOINTS
// ============================================

export const archiveDocApi = {
  // Tüm arşiv belgeleri
  getAll: (params?: {
    page?: number;
    page_size?: number;
    owner_type?: ArchiveDoc['owner_type'];
    owner_ref?: string;
    doc_type?: ArchiveDoc['doc_type'];
    status?: ArchiveDoc['status'];
    cari_code?: string;
    wo_number?: string;
  }) => 
    api.get<PaginatedResponse<ArchiveDoc>>('/archive', { params }),

  // İş emrine ait belgeler
  getByWorkOrder: (workOrderId: number) => 
    api.get<ArchiveDoc[]>(`/archive/wo/${workOrderId}`),

  // Cariye ait belgeler
  getByCari: (cariCode: string) => 
    api.get<ArchiveDoc[]>(`/archive/cari/${cariCode}`),

  // Belge detayı
  getById: (id: number) => 
    api.get<ArchiveDoc>(`/archive/${id}`),

  // Belge yükle
  upload: (formData: FormData) => 
    api.post<ArchiveDoc>('/archive/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // Belge güncelle (metadata)
  update: (id: number, data: Partial<ArchiveDoc>) => 
    api.put<ArchiveDoc>(`/archive/${id}`, data),

  // Belge sil
  delete: (id: number) => 
    api.delete<void>(`/archive/${id}`),

  // Belge doğrula
  verify: (id: number, notes?: string) => 
    api.post<ArchiveDoc>(`/archive/${id}/verify`, { notes }),

  // Süresi yaklaşan belgeler
  getExpiringSoon: (days: number = 30) => 
    api.get<ArchiveDoc[]>('/archive/expiring-soon', { params: { days } }),

  // ZIP export (çoklu belge)
  exportZip: (ids: number[]) => 
    api.post<{ download_url: string; sha256_list: string }>('/archive/export-zip', { ids }),
};

// ============================================
// SECURITY GATE LOG ENDPOINTS
// ============================================

export const securityGateLogApi = {
  // Tüm gate kayıtları
  getAll: (params?: {
    page?: number;
    page_size?: number;
    gate_type?: SecurityGateLog['gate_type'];
    wo_number?: string;
    date_from?: string;
    date_to?: string;
  }) => 
    api.get<PaginatedResponse<SecurityGateLog>>('/security-gate', { params }),

  // İş emrine ait gate kayıtları
  getByWorkOrder: (workOrderId: number) => 
    api.get<SecurityGateLog[]>(`/security-gate/wo/${workOrderId}`),

  // Gate kaydı oluştur
  create: (data: Omit<SecurityGateLog, 'id' | 'created_at'>) => 
    api.post<SecurityGateLog>('/security-gate', data),

  // Gate kaydı güncelle
  update: (id: number, data: Partial<SecurityGateLog>) => 
    api.put<SecurityGateLog>(`/security-gate/${id}`, data),

  // Check-in
  checkIn: (woNumber: string, data: {
    vehicle_plate?: string;
    driver_name?: string;
    driver_id?: string;
    photo_path?: string;
    notes?: string;
  }) => 
    api.post<SecurityGateLog>(`/security-gate/${woNumber}/check-in`, data),

  // Check-out
  checkOut: (woNumber: string, data: {
    photo_path?: string;
    notes?: string;
  }) => 
    api.post<SecurityGateLog>(`/security-gate/${woNumber}/check-out`, data),

  // İstisna PIN ile giriş
  exceptionEntry: (woNumber: string, data: {
    pin: string;
    reason: string;
    vehicle_plate?: string;
    driver_name?: string;
  }) => 
    api.post<SecurityGateLog>(`/security-gate/${woNumber}/exception`, data),
};

// ============================================
// CARI PORTAL USER ENDPOINTS
// ============================================

export const cariUserApi = {
  // Cariye ait kullanıcılar
  getByCari: (cariCode: string) => 
    api.get<CariUser[]>(`/cari-user/cari/${cariCode}`),

  // Kullanıcı detayı
  getById: (id: number) => 
    api.get<CariUser>(`/cari-user/${id}`),

  // Yeni kullanıcı oluştur
  create: (data: Omit<CariUser, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<CariUser>('/cari-user', data),

  // Kullanıcı güncelle
  update: (id: number, data: Partial<CariUser>) => 
    api.put<CariUser>(`/cari-user/${id}`, data),

  // Kullanıcı sil
  delete: (id: number) => 
    api.delete<void>(`/cari-user/${id}`),

  // Davet linki gönder
  sendInvite: (cariId: number, email: string) => 
    api.post<{ success: boolean; message: string }>('/cari-user/invite', { cari_id: cariId, email }),
};

// ============================================
// MAGIC LINK ENDPOINTS
// ============================================

export const magicLinkApi = {
  // Magic link oluştur
  create: (email: string, cariCode: string) => 
    api.post<MagicToken>('/magic-link/create', { email, cari_code: cariCode }),

  // Magic link doğrula
  validate: (token: string) => 
    api.get<{ valid: boolean; cari_code?: string; email?: string }>(`/magic-link/validate/${token}`),

  // Magic link kullan (tek kullanımlık)
  use: (token: string) => 
    api.post<{ success: boolean; cari_code: string; email: string }>(`/magic-link/use/${token}`, {}),
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * İş emri numarası oluştur (GUID benzeri)
 */
export function generateWoNumber(): string {
  const prefix = 'WO';
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${year}${month}${random}`;
}

/**
 * İş emri durumu etiket rengi
 */
export function getStatusColor(status: WorkOrder['status']): string {
  const colors: Record<WorkOrder['status'], string> = {
    'DRAFT': 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    'SUBMITTED': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    'APPROVED': 'bg-green-500/20 text-green-400 border-green-500/50',
    'SAHADA': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    'TAMAMLANDI': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    'FATURALANDI': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
    'KAPANDI': 'bg-gray-700/20 text-gray-500 border-gray-700/50',
    'REJECTED': 'bg-red-500/20 text-red-400 border-red-500/50',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
}

/**
 * Öncelik rengi
 */
export function getPriorityColor(priority: WorkOrder['priority']): string {
  const colors: Record<WorkOrder['priority'], string> = {
    'LOW': 'bg-gray-500/20 text-gray-400',
    'MEDIUM': 'bg-blue-500/20 text-blue-400',
    'HIGH': 'bg-orange-500/20 text-orange-400',
    'URGENT': 'bg-red-500/20 text-red-400',
  };
  return colors[priority] || 'bg-gray-500/20 text-gray-400';
}

// ============================================
// MOCK DATA (Backend hazır değilse)
// ============================================

const MOCK_WORK_ORDERS: WorkOrder[] = [
  {
    id: 1,
    wo_number: 'WO202501A1B2C3',
    cari_id: 1,
    cari_code: '01.001',
    cari_title: 'A-TIM TEKNIK GEMI TAMIR',
    requester_user_id: 1,
    requester_user_name: 'Ahmet Yılmaz',
    type: 'HIZMET',
    service_code: 'FORKLIFT-001',
    action: 'FORKLIFT',
    subject: 'Forklift Hizmeti Talebi',
    description: 'Yük taşıma için forklift hizmeti gerekiyor. 2 saat tahmini süre.',
    priority: 'MEDIUM',
    planned_start: '2025-01-20T09:00:00Z',
    planned_end: '2025-01-20T11:00:00Z',
    status: 'APPROVED',
    gate_required: true,
    saha_kayit_yetkisi: true,
    attachments_count: 2,
    has_signature: false,
    is_cabatoge_tr_flag: false,
    apply_rule_addons: true,
    attached_letter_approved: false,
    notes: '',
    is_active: true,
    created_at: '2025-01-18T10:30:00Z',
    created_by: 1,
    created_by_name: 'Ali Operasyon',
  },
  {
    id: 2,
    wo_number: 'WO202501D4E5F6',
    cari_id: 2,
    cari_code: '01.002',
    cari_title: 'A.RIZA KINAY VAPUR ACENTELIGI',
    type: 'MOTORBOT',
    action: 'MOTORBOT',
    subject: 'Motorbot Transfer Talebi',
    description: 'Gemi-kara transfer hizmeti. 15 personel taşınacak.',
    priority: 'HIGH',
    planned_start: '2025-01-19T14:00:00Z',
    status: 'SAHADA',
    gate_required: false,
    saha_kayit_yetkisi: true,
    attachments_count: 1,
    has_signature: false,
    is_cabatoge_tr_flag: true,
    apply_rule_addons: true,
    attached_letter_approved: false,
    is_active: true,
    created_at: '2025-01-18T08:15:00Z',
    created_by: 1,
    created_by_name: 'Ali Operasyon',
    actual_start: '2025-01-19T14:05:00Z',
  },
  {
    id: 3,
    wo_number: 'WO202501G7H8I9',
    cari_id: 1,
    cari_code: '01.001',
    cari_title: 'A-TIM TEKNIK GEMI TAMIR',
    type: 'DIGER',
    action: 'ARAÇ_GİRİŞ',
    subject: 'Araç Giriş İzni',
    description: 'Malzeme teslimatı için araç giriş izni.',
    priority: 'LOW',
    planned_start: '2025-01-21T10:00:00Z',
    status: 'SUBMITTED',
    gate_required: true,
    saha_kayit_yetkisi: false,
    attachments_count: 3,
    has_signature: false,
    is_cabatoge_tr_flag: false,
    apply_rule_addons: false,
    attached_letter_approved: true,
    is_active: true,
    created_at: '2025-01-18T11:45:00Z',
    created_by: 2,
    created_by_name: 'Mehmet Cari',
  },
];

const MOCK_WORK_ORDER_ITEMS: WorkOrderItem[] = [
  {
    id: 1,
    work_order_id: 1,
    wo_number: 'WO202501A1B2C3',
    item_type: 'WORKLOG',
    resource_code: 'FORKLIFT-01',
    resource_name: 'Forklift 3 Ton',
    start_time: '2025-01-20T09:00:00Z',
    end_time: '2025-01-20T10:20:00Z',
    duration_minutes: 80,
    quantity: 1.33,
    unit: 'SAAT',
    unit_price: 450,
    currency: 'TRY',
    total_amount: 598.5,
    vat_rate: 20,
    vat_amount: 119.7,
    grand_total: 718.2,
    is_invoiced: false,
    created_at: '2025-01-20T10:25:00Z',
    created_by: 3,
    created_by_name: 'Saha Operatör',
  },
  {
    id: 2,
    work_order_id: 2,
    wo_number: 'WO202501D4E5F6',
    item_type: 'SERVICE',
    service_code: 'MB-SEFER-001',
    service_name: 'Motorbot Sefer Hizmeti',
    quantity: 1,
    unit: 'SEFER',
    unit_price: 2500,
    currency: 'TRY',
    total_amount: 2500,
    vat_rate: 20,
    vat_amount: 500,
    grand_total: 3000,
    is_invoiced: false,
    created_at: '2025-01-19T15:30:00Z',
    created_by: 4,
    created_by_name: 'MB Operatör',
  },
];

const MOCK_ARCHIVE_DOCS: ArchiveDoc[] = [
  {
    id: 1,
    work_order_id: 1,
    wo_number: 'WO202501A1B2C3',
    cari_id: 1,
    cari_code: '01.001',
    owner_type: 'WORKORDER',
    owner_ref: 'WO202501A1B2C3',
    doc_type: 'FOTOGRAF',
    file_name: 'forklift_is_emri_foto1.jpg',
    file_ext: 'jpg',
    file_size: 245678,
    file_path: '/archive/2025/01/01.001/forklift_is_emri_foto1.jpg',
    hash_sha256: 'abc123def456...',
    upload_user_id: 1,
    upload_user_name: 'Ali Operasyon',
    upload_at: '2025-01-18T10:35:00Z',
    status: 'VERIFIED',
    is_immutable: false,
    created_at: '2025-01-18T10:35:00Z',
    created_by: 1,
  },
  {
    id: 2,
    work_order_id: 3,
    wo_number: 'WO202501G7H8I9',
    cari_id: 1,
    cari_code: '01.001',
    owner_type: 'WORKORDER',
    owner_ref: 'WO202501G7H8I9',
    doc_type: 'RUHSAT',
    file_name: 'arac_ruhsat.pdf',
    file_ext: 'pdf',
    file_size: 567890,
    file_path: '/archive/2025/01/01.001/arac_ruhsat.pdf',
    upload_user_id: 2,
    upload_user_name: 'Mehmet Cari',
    upload_at: '2025-01-18T11:50:00Z',
    expiry_date: '2026-06-15',
    status: 'VERIFIED',
    is_immutable: false,
    created_at: '2025-01-18T11:50:00Z',
    created_by: 2,
  },
];

// Mock API
export const workOrderApiMock = {
  getAll: async (params?: any) => {
    let filtered = [...MOCK_WORK_ORDERS];
    
    if (params?.status) {
      filtered = filtered.filter(wo => wo.status === params.status);
    }
    
    if (params?.cari_code) {
      filtered = filtered.filter(wo => wo.cari_code === params.cari_code);
    }
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(wo => 
        wo.wo_number.toLowerCase().includes(search) ||
        wo.subject.toLowerCase().includes(search) ||
        wo.cari_title.toLowerCase().includes(search)
      );
    }
    
    return {
      items: filtered,
      total: filtered.length,
      page: params?.page || 1,
      page_size: params?.page_size || 20,
      total_pages: Math.ceil(filtered.length / (params?.page_size || 20)),
    };
  },

  getById: async (id: number) => 
    MOCK_WORK_ORDERS.find(wo => wo.id === id) || MOCK_WORK_ORDERS[0],

  getByWoNumber: async (woNumber: string) => 
    MOCK_WORK_ORDERS.find(wo => wo.wo_number === woNumber) || MOCK_WORK_ORDERS[0],

  getByCari: async (cariCode: string) => 
    MOCK_WORK_ORDERS.filter(wo => wo.cari_code === cariCode),

  create: async (data: any) => {
    const newWo: WorkOrder = {
      id: Math.max(...MOCK_WORK_ORDERS.map(w => w.id), 0) + 1,
      wo_number: generateWoNumber(),
      ...data,
      created_at: new Date().toISOString(),
    };
    MOCK_WORK_ORDERS.push(newWo);
    return newWo;
  },

  update: async (id: number, data: any) => {
    const index = MOCK_WORK_ORDERS.findIndex(wo => wo.id === id);
    if (index >= 0) {
      MOCK_WORK_ORDERS[index] = {
        ...MOCK_WORK_ORDERS[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return MOCK_WORK_ORDERS[index];
    }
    return MOCK_WORK_ORDERS[0];
  },

  delete: async (id: number) => {
    const index = MOCK_WORK_ORDERS.findIndex(wo => wo.id === id);
    if (index >= 0) {
      MOCK_WORK_ORDERS.splice(index, 1);
    }
  },

  changeStatus: async (id: number, status: WorkOrder['status']) => {
    return workOrderApiMock.update(id, { status });
  },

  approve: async (id: number) => {
    return workOrderApiMock.update(id, { status: 'APPROVED' as WorkOrder['status'] });
  },

  reject: async (id: number, reason: string) => {
    return workOrderApiMock.update(id, { 
      status: 'REJECTED' as WorkOrder['status'],
      notes: reason 
    });
  },

  getStats: async () => ({
    total: MOCK_WORK_ORDERS.length,
    by_status: {
      'DRAFT': MOCK_WORK_ORDERS.filter(wo => wo.status === 'DRAFT').length,
      'SUBMITTED': MOCK_WORK_ORDERS.filter(wo => wo.status === 'SUBMITTED').length,
      'APPROVED': MOCK_WORK_ORDERS.filter(wo => wo.status === 'APPROVED').length,
      'SAHADA': MOCK_WORK_ORDERS.filter(wo => wo.status === 'SAHADA').length,
      'TAMAMLANDI': MOCK_WORK_ORDERS.filter(wo => wo.status === 'TAMAMLANDI').length,
      'FATURALANDI': MOCK_WORK_ORDERS.filter(wo => wo.status === 'FATURALANDI').length,
    },
    by_priority: {
      'LOW': MOCK_WORK_ORDERS.filter(wo => wo.priority === 'LOW').length,
      'MEDIUM': MOCK_WORK_ORDERS.filter(wo => wo.priority === 'MEDIUM').length,
      'HIGH': MOCK_WORK_ORDERS.filter(wo => wo.priority === 'HIGH').length,
      'URGENT': MOCK_WORK_ORDERS.filter(wo => wo.priority === 'URGENT').length,
    },
    by_type: {
      'HIZMET': MOCK_WORK_ORDERS.filter(wo => wo.type === 'HIZMET').length,
      'MOTORBOT': MOCK_WORK_ORDERS.filter(wo => wo.type === 'MOTORBOT').length,
      'BARINMA': MOCK_WORK_ORDERS.filter(wo => wo.type === 'BARINMA').length,
      'DIGER': MOCK_WORK_ORDERS.filter(wo => wo.type === 'DIGER').length,
    },
  }),
};

export const workOrderItemApiMock = {
  getByWorkOrder: async (workOrderId: number) => 
    MOCK_WORK_ORDER_ITEMS.filter(item => item.work_order_id === workOrderId),

  create: async (data: any) => {
    const newItem: WorkOrderItem = {
      id: Math.max(...MOCK_WORK_ORDER_ITEMS.map(i => i.id), 0) + 1,
      ...data,
      created_at: new Date().toISOString(),
    };
    MOCK_WORK_ORDER_ITEMS.push(newItem);
    return newItem;
  },

  delete: async (id: number) => {
    const index = MOCK_WORK_ORDER_ITEMS.findIndex(item => item.id === id);
    if (index >= 0) {
      MOCK_WORK_ORDER_ITEMS.splice(index, 1);
    }
  },
};

export const archiveDocApiMock = {
  getAll: async (params?: any) => {
    let filtered = [...MOCK_ARCHIVE_DOCS];
    
    if (params?.wo_number) {
      filtered = filtered.filter(doc => doc.wo_number === params.wo_number);
    }
    
    if (params?.cari_code) {
      filtered = filtered.filter(doc => doc.cari_code === params.cari_code);
    }
    
    return {
      items: filtered,
      total: filtered.length,
      page: 1,
      page_size: 20,
      total_pages: 1,
    };
  },

  getByWorkOrder: async (workOrderId: number) => 
    MOCK_ARCHIVE_DOCS.filter(doc => doc.work_order_id === workOrderId),

  getByCari: async (cariCode: string) => 
    MOCK_ARCHIVE_DOCS.filter(doc => doc.cari_code === cariCode),
};
