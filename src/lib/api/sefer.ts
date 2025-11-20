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

// ============================================
// MOCK DATA (Backend hazır değilse)
// ============================================

const MOCK_MB_TRIP: MbTrip[] = [
  {
    id: 1,
    motorbot_id: 1,
    motorbot_code: 'MB-001',
    motorbot_name: 'SEALION',
    motorbot_owner: 'Ahmet Yılmaz',
    cari_code: 'CR-001',
    departure_date: '2025-11-02',
    departure_time: '08:30',
    departure_note: 'Yakıt ikmali yapıldı',
    return_date: '2025-11-02',
    return_time: '17:45',
    return_note: 'Sorunsuz dönüş',
    duration_minutes: 555,
    status: 'RETURNED',
    unit_price: 10.00,
    currency: 'USD',
    vat_rate: 18,
    vat_amount: 1.80,
    total_price: 11.80,
    is_invoiced: false,
    invoice_period: '2025-11-07',
    created_at: '2025-11-02T08:30:00Z',
    created_by: 101,
  },
  {
    id: 2,
    motorbot_id: 1,
    motorbot_code: 'MB-001',
    motorbot_name: 'SEALION',
    motorbot_owner: 'Ahmet Yılmaz',
    cari_code: 'CR-001',
    departure_date: '2025-11-04',
    departure_time: '10:15',
    departure_note: 'Rutin çıkış',
    return_date: '2025-11-04',
    return_time: '16:30',
    return_note: 'Normal dönüş',
    duration_minutes: 375,
    status: 'RETURNED',
    unit_price: 10.00,
    currency: 'USD',
    vat_rate: 18,
    vat_amount: 1.80,
    total_price: 11.80,
    is_invoiced: false,
    invoice_period: '2025-11-07',
    created_at: '2025-11-04T10:15:00Z',
    created_by: 101,
  },
  {
    id: 15,
    motorbot_id: 1,
    motorbot_code: 'MB-001',
    motorbot_name: 'SEALION',
    motorbot_owner: 'Ahmet Yılmaz',
    cari_code: 'CR-001',
    departure_date: '2025-11-19',
    departure_time: '11:30',
    departure_note: 'Bugünkü sefer',
    status: 'DEPARTED',
    unit_price: 10.00,
    currency: 'USD',
    vat_rate: 18,
    vat_amount: 1.80,
    total_price: 11.80,
    is_invoiced: false,
    created_at: '2025-11-19T11:30:00Z',
    created_by: 102,
  },
];

// Mock mode için fallback
export const seferApiMock = {
  getAll: async (params?: any) => {
    let filtered = [...MOCK_MB_TRIP];
    
    if (params?.status) {
      filtered = filtered.filter(t => t.status === params.status);
    }
    
    if (params?.motorbot_id) {
      filtered = filtered.filter(t => t.motorbot_id === params.motorbot_id);
    }
    
    if (params?.is_invoiced !== undefined) {
      filtered = filtered.filter(t => t.is_invoiced === params.is_invoiced);
    }
    
    return {
      items: filtered,
      total: filtered.length,
      page: params?.page || 1,
      page_size: params?.page_size || 50,
      total_pages: 1,
    };
  },

  getById: async (id: number) => 
    MOCK_MB_TRIP.find(t => t.id === id) || MOCK_MB_TRIP[0],

  getByMotorbot: async (motorbotId: number) => 
    MOCK_MB_TRIP.filter(t => t.motorbot_id === motorbotId),

  getActiveDepartures: async () => 
    MOCK_MB_TRIP.filter(t => t.status === 'DEPARTED'),

  getUninvoiced: async (params?: any) => 
    MOCK_MB_TRIP.filter(t => !t.is_invoiced && t.status === 'RETURNED'),

  createDeparture: async (data: any) => {
    const newTrip: MbTrip = {
      id: Math.max(...MOCK_MB_TRIP.map(t => t.id), 0) + 1,
      ...data,
      status: 'DEPARTED',
      is_invoiced: false,
      vat_amount: data.unit_price * (data.vat_rate / 100),
      total_price: data.unit_price * (1 + data.vat_rate / 100),
      created_at: new Date().toISOString(),
    };
    MOCK_MB_TRIP.push(newTrip);
    return newTrip;
  },

  recordReturn: async (id: number, data: any) => {
    const index = MOCK_MB_TRIP.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Sefer bulunamadı');
    
    const trip = MOCK_MB_TRIP[index];
    const departureTime = new Date(`${trip.departure_date}T${trip.departure_time}`);
    const returnTime = new Date(`${data.return_date}T${data.return_time}`);
    const durationMinutes = Math.floor((returnTime.getTime() - departureTime.getTime()) / 60000);
    
    MOCK_MB_TRIP[index] = {
      ...trip,
      return_date: data.return_date,
      return_time: data.return_time,
      return_note: data.return_note,
      duration_minutes: durationMinutes,
      status: 'RETURNED',
      updated_at: new Date().toISOString(),
    };
    
    return MOCK_MB_TRIP[index];
  },

  getStats: async (params?: any) => {
    const trips = MOCK_MB_TRIP;
    const completed = trips.filter(t => t.status === 'RETURNED');
    
    return {
      total_trips: trips.length,
      active_trips: trips.filter(t => t.status === 'DEPARTED').length,
      completed_trips: completed.length,
      invoiced_trips: trips.filter(t => t.is_invoiced).length,
      uninvoiced_trips: trips.filter(t => !t.is_invoiced && t.status === 'RETURNED').length,
      total_revenue: completed.filter(t => t.is_invoiced).reduce((sum, t) => sum + t.total_price, 0),
      pending_revenue: completed.filter(t => !t.is_invoiced).reduce((sum, t) => sum + t.total_price, 0),
      avg_duration_minutes: completed.length > 0 
        ? Math.floor(completed.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / completed.length)
        : 0,
    };
  },
};
