// INVOICE API - Fatura modülü için API endpoints
// GET, POST, PUT, DELETE işlemleri
// invoice + invoice_item (master-detail)

import { api } from './client';
import type { 
  Invoice, 
  InvoiceItem,
  PaginatedResponse 
} from '../types/database';

// Enriched type for invoice with items
export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

// ============================================
// INVOICE ENDPOINTS (Ana Fatura)
// ============================================

export const invoiceApi = {
  // Tüm faturaları getir
  getAll: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    invoice_type?: string;
    status?: string;
    cari_id?: number;
    date_from?: string;
    date_to?: string;
  }) => 
    api.get<PaginatedResponse<Invoice>>('/invoice', { params }),

  // Tek fatura detayı
  getById: (id: number) => 
    api.get<Invoice>(`/invoice/${id}`),

  // Fatura numarası ile getir
  getByNumber: (invoiceNumber: string) => 
    api.get<Invoice>(`/invoice/number/${invoiceNumber}`),

  // Fatura + Items birlikte
  getWithItems: (id: number) => 
    api.get<InvoiceWithItems>(`/invoice/${id}/with-items`),

  // Cari'ye ait faturalar
  getByCari: (cariId: number) => 
    api.get<Invoice[]>(`/invoice/cari/${cariId}`),

  // Yeni fatura oluştur
  create: (data: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<Invoice>('/invoice', data),

  // Fatura güncelle
  update: (id: number, data: Partial<Invoice>) => 
    api.put<Invoice>(`/invoice/${id}`, data),

  // Fatura sil
  delete: (id: number) => 
    api.delete<void>(`/invoice/${id}`),

  // Fatura durumunu değiştir
  updateStatus: (id: number, status: string) => 
    api.patch<Invoice>(`/invoice/${id}/status`, { status }),

  // ============================================
  // INVOICE ITEM ENDPOINTS (Fatura Kalemleri)
  // ============================================

  // Faturaya ait tüm kalemleri getir
  getItems: (invoiceId: number) => 
    api.get<InvoiceItem[]>(`/invoice/${invoiceId}/items`),

  // Tek kalem detayı
  getItemById: (itemId: number) => 
    api.get<InvoiceItem>(`/invoice-item/${itemId}`),

  // Yeni kalem ekle
  createItem: (data: Omit<InvoiceItem, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<InvoiceItem>('/invoice-item', data),

  // Kalem güncelle
  updateItem: (itemId: number, data: Partial<InvoiceItem>) => 
    api.put<InvoiceItem>(`/invoice-item/${itemId}`, data),

  // Kalem sil
  deleteItem: (itemId: number) => 
    api.delete<void>(`/invoice-item/${itemId}`),

  // Toplu kalem ekleme
  createBulkItems: (invoiceId: number, items: Omit<InvoiceItem, 'id' | 'created_at' | 'updated_at'>[]) => 
    api.post<InvoiceItem[]>(`/invoice/${invoiceId}/items/bulk`, { items }),
};

// ============================================
// MOCK DATA
// ============================================

const MOCK_INVOICES: Invoice[] = [
  {
    id: 1,
    invoice_number: 'FAT-2024-001',
    invoice_type: 'SATIS',
    invoice_date: '2024-11-01',
    cari_id: 1,
    cari_code: 'CARI-001',
    cari_name: 'Ahmet Yılmaz',
    cari_tax_number: '1234567890',
    cari_tax_office: 'Kadıköy',
    subtotal: 15000.00,
    vat_total: 3000.00,
    discount_total: 0,
    grand_total: 18000.00,
    currency: 'TRY',
    exchange_rate: 1.0,
    status: 'ONAYLANDI',
    payment_status: 'ODENDI',
    payment_method: 'Havale',
    payment_date: '2024-11-05',
    due_date: '2024-11-30',
    description: 'Kasım 2024 Barınma Ücreti',
    notes: 'Zamanında ödendi',
    is_e_invoice: true,
    e_invoice_uuid: 'uuid-001',
    e_invoice_status: 'GONDERILDI',
    e_invoice_sent_date: '2024-11-02',
    created_at: new Date('2024-11-01').toISOString(),
  },
  {
    id: 2,
    invoice_number: 'FAT-2024-002',
    invoice_type: 'SATIS',
    invoice_date: '2024-11-01',
    cari_id: 2,
    cari_code: 'CARI-002',
    cari_name: 'Mehmet Kaya',
    cari_tax_number: '9876543210',
    cari_tax_office: 'Beşiktaş',
    subtotal: 12000.00,
    vat_total: 2400.00,
    discount_total: 0,
    grand_total: 14400.00,
    currency: 'TRY',
    exchange_rate: 1.0,
    status: 'ONAYLANDI',
    payment_status: 'BEKLEMEDE',
    due_date: '2024-11-30',
    description: 'Kasım 2024 Barınma Ücreti (VIP)',
    is_e_invoice: true,
    e_invoice_uuid: 'uuid-002',
    e_invoice_status: 'GONDERILDI',
    e_invoice_sent_date: '2024-11-02',
    created_at: new Date('2024-11-01').toISOString(),
  },
  {
    id: 3,
    invoice_number: 'FAT-2024-003',
    invoice_type: 'SATIS',
    invoice_date: '2024-10-15',
    cari_id: 1,
    cari_code: 'CARI-001',
    cari_name: 'Ahmet Yılmaz',
    cari_tax_number: '1234567890',
    cari_tax_office: 'Kadıköy',
    subtotal: 2000.00,
    vat_total: 400.00,
    discount_total: 0,
    grand_total: 2400.00,
    currency: 'TRY',
    exchange_rate: 1.0,
    status: 'ONAYLANDI',
    payment_status: 'ODENDI',
    payment_method: 'Kredi Kartı',
    payment_date: '2024-10-20',
    due_date: '2024-11-15',
    description: 'Motorbot Sefer Hizmeti (4x)',
    is_e_invoice: true,
    e_invoice_uuid: 'uuid-003',
    e_invoice_status: 'GONDERILDI',
    created_at: new Date('2024-10-15').toISOString(),
  },
  {
    id: 4,
    invoice_number: 'FAT-2024-004',
    invoice_type: 'SATIS',
    invoice_date: '2024-11-10',
    cari_id: 3,
    cari_code: 'CARI-003',
    cari_name: 'Ayşe Demir',
    cari_tax_number: '5555555555',
    cari_tax_office: 'Üsküdar',
    subtotal: 18000.00,
    vat_total: 3600.00,
    discount_total: 0,
    grand_total: 21600.00,
    currency: 'TRY',
    exchange_rate: 1.0,
    status: 'TASLAK',
    payment_status: 'BEKLEMEDE',
    due_date: '2024-12-10',
    description: 'Kasım 2024 Barınma Ücreti (Sezonluk)',
    is_e_invoice: false,
    created_at: new Date('2024-11-10').toISOString(),
  },
];

const MOCK_INVOICE_ITEMS: InvoiceItem[] = [
  // Fatura 1 - Barınma
  {
    id: 1,
    invoice_id: 1,
    line_number: 1,
    service_card_id: 2,
    service_code: 'BARINMA-001',
    service_name: 'Aylık Barınma Hizmeti',
    description: 'Kasım 2024 - MB-001 Deniz Yıldızı',
    quantity: 1,
    unit: 'Ay',
    unit_price: 15000.00,
    discount_rate: 0,
    discount_amount: 0,
    subtotal: 15000.00,
    vat_rate: 20,
    vat_amount: 3000.00,
    line_total: 18000.00,
    currency: 'TRY',
    created_at: new Date('2024-11-01').toISOString(),
  },
  // Fatura 2 - Barınma VIP
  {
    id: 2,
    invoice_id: 2,
    line_number: 1,
    service_card_id: 2,
    service_code: 'BARINMA-001',
    service_name: 'Aylık Barınma Hizmeti',
    description: 'Kasım 2024 - MB-002 Mavi Dalga (VIP İndirimli)',
    quantity: 1,
    unit: 'Ay',
    unit_price: 12000.00,
    discount_rate: 0,
    discount_amount: 0,
    subtotal: 12000.00,
    vat_rate: 20,
    vat_amount: 2400.00,
    line_total: 14400.00,
    currency: 'TRY',
    created_at: new Date('2024-11-01').toISOString(),
  },
  // Fatura 3 - Sefer (4 adet)
  {
    id: 3,
    invoice_id: 3,
    line_number: 1,
    service_card_id: 1,
    service_code: 'MB-SEFER-001',
    service_name: 'Motorbot Sefer Hizmeti',
    description: 'Ekim 2024 Sefer Hizmetleri',
    quantity: 4,
    unit: 'Adet',
    unit_price: 500.00,
    discount_rate: 0,
    discount_amount: 0,
    subtotal: 2000.00,
    vat_rate: 20,
    vat_amount: 400.00,
    line_total: 2400.00,
    currency: 'TRY',
    created_at: new Date('2024-10-15').toISOString(),
  },
  // Fatura 4 - Barınma Sezonluk
  {
    id: 4,
    invoice_id: 4,
    line_number: 1,
    service_card_id: 2,
    service_code: 'BARINMA-001',
    service_name: 'Aylık Barınma Hizmeti',
    description: 'Kasım 2024 - MB-003 Rüzgar Gülü (Sezonluk Tarife)',
    quantity: 1,
    unit: 'Ay',
    unit_price: 18000.00,
    discount_rate: 0,
    discount_amount: 0,
    subtotal: 18000.00,
    vat_rate: 20,
    vat_amount: 3600.00,
    line_total: 21600.00,
    currency: 'TRY',
    created_at: new Date('2024-11-10').toISOString(),
  },
];

// Mock mode için fallback
export const invoiceApiMock = {
  getAll: async () => ({
    items: MOCK_INVOICES,
    total: MOCK_INVOICES.length,
    page: 1,
    page_size: 20,
    total_pages: 1,
  }),

  getById: async (id: number) => 
    MOCK_INVOICES.find(i => i.id === id) || MOCK_INVOICES[0],

  getWithItems: async (id: number) => {
    const invoice = MOCK_INVOICES.find(i => i.id === id) || MOCK_INVOICES[0];
    const items = MOCK_INVOICE_ITEMS.filter(l => l.invoice_id === id);
    return {
      ...invoice,
      items,
      line_count: items.length,
    };
  },

  getItems: async (invoiceId: number) => 
    MOCK_INVOICE_ITEMS.filter(l => l.invoice_id === invoiceId),

  getByCari: async (cariId: number) => 
    MOCK_INVOICES.filter(i => i.cari_id === cariId),
};