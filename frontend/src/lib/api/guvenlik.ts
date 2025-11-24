/**
 * GÜVENLİK (GATE LOG) API
 * Kapı giriş/çıkış kayıtları ve checklist yönetimi
 */

import { api } from './client';

// ============================================
// TYPES
// ============================================

export interface GateLog {
  id: number;
  work_order_id: number;
  motorbot_id?: number;
  entry_type: 'GIRIS' | 'CIKIS';
  wo_number: string;
  wo_status: string;
  security_personnel: string;
  is_approved: boolean;
  checklist_complete: boolean;
  checklist_data?: string; // JSON
  is_exception: boolean;
  exception_pin?: string;
  exception_reason?: string;
  exception_approved_by?: string;
  photo_url?: string;
  gate_time: string;
  created_at: string;
  notes?: string;
}

export interface GateChecklistItem {
  id: number;
  wo_type: string;
  item_label: string;
  is_required: boolean;
  display_order: number;
  is_active: boolean;
}

export interface CreateGateLogPayload {
  work_order_id: number;
  motorbot_id?: number;
  entry_type: 'GIRIS' | 'CIKIS';
  wo_number: string;
  wo_status: string;
  security_personnel: string;
  is_approved: boolean;
  checklist_complete: boolean;
  checklist_data?: string;
  is_exception?: boolean;
  exception_pin?: string;
  exception_reason?: string;
  exception_approved_by?: string;
  photo_url?: string;
  notes?: string;
}

// ============================================
// GATE LOG ENDPOINTS
// ============================================

export const gateLogApi = {
  // Tüm kayıtlar
  getAll: (params?: {
    page?: number;
    page_size?: number;
    entry_type?: 'GIRIS' | 'CIKIS';
    date_from?: string;
    date_to?: string;
    security_personnel?: string;
    is_approved?: boolean;
  }) =>
    api.get<{ items: GateLog[]; total: number }>('/api/guvenlik/gate-log', { params }),

  // ID ile getir
  getById: (id: number) =>
    api.get<GateLog>(`/api/guvenlik/gate-log/${id}`),

  // İş emrine göre
  getByWorkOrder: (workOrderId: number) =>
    api.get<GateLog[]>(`/api/guvenlik/gate-log/work-order/${workOrderId}`),

  // Motorbot'a göre
  getByMotorbot: (motorbotId: number) =>
    api.get<GateLog[]>(`/api/guvenlik/gate-log/motorbot/${motorbotId}`),

  // Bugünün kayıtları
  getToday: () =>
    api.get<GateLog[]>('/api/guvenlik/gate-log/today'),

  // Yeni kayıt
  create: (data: CreateGateLogPayload) =>
    api.post<GateLog>('/api/guvenlik/gate-log', data),

  // Güncelle
  update: (id: number, data: Partial<GateLog>) =>
    api.put<GateLog>(`/api/guvenlik/gate-log/${id}`, data),

  // Sil
  delete: (id: number) =>
    api.delete<void>(`/api/guvenlik/gate-log/${id}`),

  // Onay durumu değiştir
  approve: (id: number, approved: boolean, notes?: string) =>
    api.patch<GateLog>(`/api/guvenlik/gate-log/${id}/approve`, { approved, notes }),
};

// ============================================
// GATE CHECKLIST ENDPOINTS
// ============================================

export const gateChecklistApi = {
  // Tüm checklist itemları
  getAll: (woType?: string) =>
    api.get<GateChecklistItem[]>('/api/guvenlik/checklist', { params: { wo_type: woType } }),

  // ID ile getir
  getById: (id: number) =>
    api.get<GateChecklistItem>(`/api/guvenlik/checklist/${id}`),

  // İş emri tipine göre
  getByType: (woType: string) =>
    api.get<GateChecklistItem[]>(`/api/guvenlik/checklist/type/${woType}`),

  // Yeni item ekle
  create: (data: Omit<GateChecklistItem, 'id' | 'created_at' | 'updated_at'>) =>
    api.post<GateChecklistItem>('/api/guvenlik/checklist', data),

  // Güncelle
  update: (id: number, data: Partial<GateChecklistItem>) =>
    api.put<GateChecklistItem>(`/api/guvenlik/checklist/${id}`, data),

  // Sil
  delete: (id: number) =>
    api.delete<void>(`/api/guvenlik/checklist/${id}`),

  // Sıralamayı güncelle
  updateOrder: (items: { id: number; display_order: number }[]) =>
    api.patch<void>('/api/guvenlik/checklist/reorder', { items }),
};
