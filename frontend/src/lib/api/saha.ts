/**
 * SAHA PERSONEL (WORK LOG) API
 * Saha personeli iş kayıtları ve zaman takibi
 */

import { api } from './client';

// ============================================
// TYPES
// ============================================

export interface WorkLog {
  id: number;
  work_order_id?: number;
  sefer_id?: number;
  motorbot_id?: number;
  hizmet_kodu?: string;
  personnel_name: string;
  time_start: string;
  time_end?: string;
  duration_minutes?: number;
  service_type?: string;
  quantity: number;
  unit: string;
  description?: string;
  notes?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_processed: number;
  is_approved: number;
  approved_by?: string;
  approved_at?: string;
}

export interface CreateWorkLogPayload {
  work_order_id?: number;
  sefer_id?: number;
  motorbot_id?: number;
  hizmet_kodu?: string;
  personnel_name: string;
  time_start: string;
  time_end?: string;
  service_type?: string;
  quantity?: number;
  unit?: string;
  description?: string;
  notes?: string;
  photo_url?: string;
}

export interface WorkLogStats {
  total_logs: number;
  pending_approval: number;
  approved: number;
  total_hours: number;
  personnel_count: number;
  by_service_type: Record<string, number>;
}

// ============================================
// WORK LOG ENDPOINTS
// ============================================

export const workLogApi = {
  // Tüm kayıtlar
  getAll: (params?: {
    page?: number;
    page_size?: number;
    personnel_name?: string;
    work_order_id?: number;
    sefer_id?: number;
    date_from?: string;
    date_to?: string;
    is_processed?: number;
    is_approved?: number;
  }) =>
    api.get<{ items: WorkLog[]; total: number }>('/api/saha/work-log', { params }),

  // ID ile getir
  getById: (id: number) =>
    api.get<WorkLog>(`/api/saha/work-log/${id}`),

  // İş emrine göre
  getByWorkOrder: (workOrderId: number) =>
    api.get<WorkLog[]>(`/api/saha/work-log/work-order/${workOrderId}`),

  // Sefer'e göre
  getBySefer: (seferId: number) =>
    api.get<WorkLog[]>(`/api/saha/work-log/sefer/${seferId}`),

  // Personele göre
  getByPersonnel: (personnelName: string, params?: { date_from?: string; date_to?: string }) =>
    api.get<WorkLog[]>(`/api/saha/work-log/personnel/${personnelName}`, { params }),

  // Bugünün kayıtları
  getToday: () =>
    api.get<WorkLog[]>('/api/saha/work-log/today'),

  // Onay bekleyenler
  getPending: () =>
    api.get<WorkLog[]>('/api/saha/work-log/pending'),

  // Yeni kayıt
  create: (data: CreateWorkLogPayload) =>
    api.post<WorkLog>('/api/saha/work-log', data),

  // Güncelle
  update: (id: number, data: Partial<WorkLog>) =>
    api.put<WorkLog>(`/api/saha/work-log/${id}`, data),

  // Sil
  delete: (id: number) =>
    api.delete<void>(`/api/saha/work-log/${id}`),

  // Bitiş zamanı kaydet
  recordEnd: (id: number, timeEnd: string) =>
    api.patch<WorkLog>(`/api/saha/work-log/${id}/end`, { time_end: timeEnd }),

  // Onayla/reddet
  approve: (id: number, approved: boolean, approvedBy: string, notes?: string) =>
    api.patch<WorkLog>(`/api/saha/work-log/${id}/approve`, { approved, approved_by: approvedBy, notes }),

  // Toplu onay
  approveMultiple: (ids: number[], approvedBy: string) =>
    api.patch<void>('/api/saha/work-log/approve-multiple', { ids, approved_by: approvedBy }),

  // İstatistikler
  getStats: (params?: { date_from?: string; date_to?: string; personnel_name?: string }) =>
    api.get<WorkLogStats>('/api/saha/work-log/stats', { params }),

  // Personel listesi
  getPersonnelList: () =>
    api.get<string[]>('/api/saha/work-log/personnel-list'),
};
