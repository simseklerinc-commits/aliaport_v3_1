// MOTORBOT SEFER API - mb_trip tablosu için API endpoints
// Sefer çıkış/dönüş kayıtları, sefer raporu, faturalandırma takibi
// GET, POST, PUT, DELETE işlemleri

import { api } from './client';
import type { 
  MbTrip, 
  MbTripWithDetails,
  PaginatedResponse 
} from '../types/database';

// ============================================
// MOTORBOT SEFER ENDPOINTS
// ============================================

export const seferApi = {
  // Tüm seferleri getir (pagination + filter)
  getAll: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    motorbot_id?: number;
    cari_code?: string;
    status?: 'DEPARTED' | 'RETURNED';
    is_invoiced?: boolean;
    date_from?: string;
    date_to?: string;
  }) => 
    api.get<PaginatedResponse<MbTrip>>('/mb-trip', { params }),

  // Tek sefer detayı
  getById: (id: number) => 
    api.get<MbTrip>(`/mb-trip/${id}`),

  // Sefer + ilişkili verilerle birlikte
  getWithDetails: (id: number) => 
    api.get<MbTripWithDetails>(`/mb-trip/${id}/details`),

  // Motorbot'a ait seferler
  getByMotorbot: (motorbotId: number) => 
    api.get<MbTrip[]>(`/mb-trip/motorbot/${motorbotId}`),

  // Aktif seferler (denizde olanlar)
  getActiveDepartures: () => 
    api.get<MbTrip[]>('/mb-trip/active'),

  // Faturalanmamış seferler
  getUninvoiced: (params?: {
    cari_code?: string;
    period_start?: string;
    period_end?: string;
  }) => 
    api.get<MbTrip[]>('/mb-trip/uninvoiced', { params }),

  // Döneme göre seferler
  getByPeriod: (period: string) => 
    api.get<MbTrip[]>(`/mb-trip/period/${period}`),

  // Sefer çıkış kaydı oluştur
  createDeparture: (data: {
    motorbot_id: number;
    motorbot_code: string;
    motorbot_name: string;
    motorbot_owner?: string;
    cari_code?: string;
    departure_date: string;
    departure_time: string;
    departure_note?: string;
    unit_price: number;
    currency: string;
    vat_rate: number;
  }) => 
    api.post<MbTrip>('/mb-trip/departure', data),

  // Sefer dönüş kaydı - mevcut seferi güncelle
  recordReturn: (id: number, data: {
    return_date: string;
    return_time: string;
    return_note?: string;
  }) => 
    api.patch<MbTrip>(`/mb-trip/${id}/return`, data),

  // Sefer güncelle
  update: (id: number, data: Partial<MbTrip>) => 
    api.put<MbTrip>(`/mb-trip/${id}`, data),

  // Sefer sil
  delete: (id: number) => 
    api.delete<void>(`/mb-trip/${id}`),

  // Seferleri faturalandı olarak işaretle
  markAsInvoiced: (tripIds: number[], invoiceId: number, invoiceDate: string) => 
    api.patch<void>('/mb-trip/mark-invoiced', { 
      trip_ids: tripIds, 
      invoice_id: invoiceId,
      invoice_date: invoiceDate 
    }),

  // Sefer istatistikleri
  getStats: (params?: {
    date_from?: string;
    date_to?: string;
    motorbot_id?: number;
  }) => 
    api.get<{
      total_trips: number;
      active_trips: number;
      completed_trips: number;
      invoiced_trips: number;
      uninvoiced_trips: number;
      total_revenue: number;
      pending_revenue: number;
      avg_duration_minutes: number;
    }>('/mb-trip/stats', { params }),

  // Dönemsel faturalama için sefer grupları
  getInvoicingGroups: (params?: {
    period_start: string;
    period_end: string;
    billing_day: number;
  }) => 
    api.get<{
      cari_code: string;
      cari_title: string;
      trip_count: number;
      total_amount: number;
      trips: MbTrip[];
    }[]>('/mb-trip/invoicing-groups', { params }),
};
