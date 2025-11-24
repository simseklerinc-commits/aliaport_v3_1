// MOTORBOT SEFER API - mb_trip tablosu için API endpoints
// Sefer çıkış/dönüş kayıtları, sefer raporu, faturalandırma takibi
// GET, POST, PUT, DELETE işlemleri

import { api } from './client';
import type { RequestInit } from 'node-fetch';
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
  }, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.get<PaginatedResponse<MbTrip>>('/mb-trip', { params, ...reqOptions }),

  // Tek sefer detayı
  getById: (id: number, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.get<MbTrip>(`/mb-trip/${id}`, reqOptions),

  // Sefer + ilişkili verilerle birlikte
  getWithDetails: (id: number, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.get<MbTripWithDetails>(`/mb-trip/${id}/details`, reqOptions),

  // Motorbot'a ait seferler
  getByMotorbot: (motorbotId: number, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.get<MbTrip[]>(`/mb-trip/motorbot/${motorbotId}`, reqOptions),

  // Aktif seferler (denizde olanlar)
  getActiveDepartures: (reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.get<MbTrip[]>('/mb-trip/active', reqOptions),

  // Faturalanmamış seferler
  getUninvoiced: (params?: {
    cari_code?: string;
    period_start?: string;
    period_end?: string;
  }, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.get<MbTrip[]>('/mb-trip/uninvoiced', { params, ...reqOptions }),

  // Döneme göre seferler
  getByPeriod: (period: string, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.get<MbTrip[]>(`/mb-trip/period/${period}`, reqOptions),

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
  }, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.post<MbTrip>('/mb-trip/departure', data, reqOptions),

  // Sefer dönüş kaydı - mevcut seferi güncelle
  recordReturn: (id: number, data: {
    return_date: string;
    return_time: string;
    return_note?: string;
  }, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.patch<MbTrip>(`/mb-trip/${id}/return`, data, reqOptions),

  // Sefer güncelle
  update: (id: number, data: Partial<MbTrip>, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.put<MbTrip>(`/mb-trip/${id}`, data, reqOptions),

  // Sefer sil
  delete: (id: number, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.delete<void>(`/mb-trip/${id}`, reqOptions),

  // Seferleri faturalandı olarak işaretle
  markAsInvoiced: (tripIds: number[], invoiceId: number, invoiceDate: string, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.patch<void>('/mb-trip/mark-invoiced', { 
      trip_ids: tripIds, 
      invoice_id: invoiceId,
      invoice_date: invoiceDate 
    }, reqOptions),

  // Sefer istatistikleri
  getStats: (params?: {
    date_from?: string;
    date_to?: string;
    motorbot_id?: number;
  }, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.get<{
      total_trips: number;
      active_trips: number;
      completed_trips: number;
      invoiced_trips: number;
      uninvoiced_trips: number;
      total_revenue: number;
      pending_revenue: number;
      avg_duration_minutes: number;
    }>('/mb-trip/stats', { params, ...reqOptions }),

  // Dönemsel faturalama için sefer grupları
  getInvoicingGroups: (params?: {
    period_start: string;
    period_end: string;
    billing_day: number;
  }, reqOptions?: RequestInit & { signal?: AbortSignal }) => 
    api.get<{
      cari_code: string;
      cari_title: string;
      trip_count: number;
      total_amount: number;
      trips: MbTrip[];
    }[]>('/mb-trip/invoicing-groups', { params, ...reqOptions }),
};
