// E-Fatura Mock Data - İşnet altyapısına hazır

export interface InvoiceMasterData {
  id: number;
  invoice_no: string; // Fatura no
  invoice_uuid: string; // İşnet UUID
  invoice_type: 'SATIS' | 'IADE' | 'TEVKIFAT'; // Fatura tipi
  invoice_scenario: 'TICARIFATURA' | 'TEMELFATURA' | 'YOLCUBERABERFATURA'; // Senaryo
  status: 'TASLAK' | 'GONDERILDI' | 'ONAYLANDI' | 'REDDEDILDI' | 'IPTAL'; // Durum
  
  // Cari Bilgileri
  customer_code: string;
  customer_name: string;
  customer_vkn: string; // Vergi kimlik no
  customer_tax_office: string;
  customer_address: string;
  
  // Tarih Bilgileri
  issue_date: string; // Düzenleme tarihi
  send_date?: string; // Gönderim tarihi
  approval_date?: string; // Onay tarihi
  
  // Tutar Bilgileri
  currency: string;
  subtotal: number; // Ara toplam
  vat_total: number; // KDV toplam
  total: number; // Genel toplam
  
  // İlişkili Kayıtlar
  contract_id?: number; // Barınma kontrat ID
  contract_no?: string; // Kontrat no
  
  // Notlar ve Açıklamalar
  notes?: string;
  rejection_reason?: string; // Red nedeni
  
  // Sistem Bilgileri
  created_by: string;
  created_date: string;
  last_modified_by?: string;
  last_modified_date?: string;
  
  // İşnet Özellikleri
  isnet_envelope_id?: string; // İşnet zarf ID
  isnet_status?: string; // İşnet durum kodu
  ettn?: string; // Elektronik Transfer Tescil No
}

export interface InvoiceLineData {
  id: number;
  invoice_id: number;
  line_no: number;
  
  // Ürün/Hizmet Bilgileri
  service_code: string;
  service_name: string;
  description: string;
  
  // Miktar ve Birim
  quantity: number;
  unit: string; // METRE, ADET, GUN vs.
  unit_price: number;
  
  // Tutar Bilgileri
  line_total: number; // Satır toplamı
  vat_rate: number; // KDV oranı (%)
  vat_amount: number; // KDV tutarı
  line_total_with_vat: number; // KDV dahil toplam
  
  // Sistem Bilgileri
  created_date: string;
}

// Mock Invoice Data
export const invoiceMasterData: InvoiceMasterData[] = [
  {
    id: 1,
    invoice_no: 'ALI2024000001',
    invoice_uuid: '550e8400-e29b-41d4-a716-446655440001',
    invoice_type: 'SATIS',
    invoice_scenario: 'TICARIFATURA',
    status: 'GONDERILDI',
    customer_code: '120001',
    customer_name: 'DELTA DENİZCİLİK A.Ş.',
    customer_vkn: '1234567890',
    customer_tax_office: 'Kadıköy',
    customer_address: 'Caferağa Mah. Moda Cad. No:45 Kadıköy/İstanbul',
    issue_date: '2024-11-01',
    send_date: '2024-11-01',
    approval_date: '2024-11-02',
    currency: 'TRY',
    subtotal: 45000.00,
    vat_total: 9000.00,
    total: 54000.00,
    contract_id: 1,
    contract_no: 'BR-2024-001',
    notes: 'Kasım ayı barınma ücreti',
    created_by: 'admin',
    created_date: '2024-11-01',
    isnet_envelope_id: 'ENV-2024-001',
    ettn: '550e8400-e29b-41d4-a716-446655440001',
  },
  {
    id: 2,
    invoice_no: 'ALI2024000002',
    invoice_uuid: '550e8400-e29b-41d4-a716-446655440002',
    invoice_type: 'SATIS',
    invoice_scenario: 'TICARIFATURA',
    status: 'ONAYLANDI',
    customer_code: '120002',
    customer_name: 'BOSPHORUS YACHTING LTD.',
    customer_vkn: '9876543210',
    customer_tax_office: 'Beşiktaş',
    customer_address: 'Ortaköy Mah. Dereboyu Cad. No:12 Beşiktaş/İstanbul',
    issue_date: '2024-11-05',
    send_date: '2024-11-05',
    approval_date: '2024-11-06',
    currency: 'USD',
    subtotal: 2500.00,
    vat_total: 500.00,
    total: 3000.00,
    contract_id: 3,
    contract_no: 'BR-2024-003',
    notes: 'Aylık barınma hizmeti - M/B Marmara',
    created_by: 'admin',
    created_date: '2024-11-05',
    isnet_envelope_id: 'ENV-2024-002',
    ettn: '550e8400-e29b-41d4-a716-446655440002',
  },
  {
    id: 3,
    invoice_no: 'ALI2024000003',
    invoice_uuid: '550e8400-e29b-41d4-a716-446655440003',
    invoice_type: 'SATIS',
    invoice_scenario: 'TICARIFATURA',
    status: 'TASLAK',
    customer_code: '120003',
    customer_name: 'ÖZGÜR DENİZ TİCARET',
    customer_vkn: '5555555555',
    customer_tax_office: 'Kartal',
    customer_address: 'Yakacık Mah. Marina Sok. No:8 Kartal/İstanbul',
    issue_date: '2024-11-15',
    currency: 'TRY',
    subtotal: 36000.00,
    vat_total: 7200.00,
    total: 43200.00,
    contract_id: 5,
    contract_no: 'BR-2024-005',
    notes: 'Kasım ayı barınma - M/B Ege Yıldızı',
    created_by: 'admin',
    created_date: '2024-11-15',
  },
  {
    id: 4,
    invoice_no: 'ALI2024000004',
    invoice_uuid: '550e8400-e29b-41d4-a716-446655440004',
    invoice_type: 'SATIS',
    invoice_scenario: 'TICARIFATURA',
    status: 'REDDEDILDI',
    customer_code: '120001',
    customer_name: 'DELTA DENİZCİLİK A.Ş.',
    customer_vkn: '1234567890',
    customer_tax_office: 'Kadıköy',
    customer_address: 'Caferağa Mah. Moda Cad. No:45 Kadıköy/İstanbul',
    issue_date: '2024-10-28',
    send_date: '2024-10-28',
    currency: 'TRY',
    subtotal: 45000.00,
    vat_total: 9000.00,
    total: 54000.00,
    contract_id: 1,
    contract_no: 'BR-2024-001',
    notes: 'Ekim ayı barınma ücreti',
    rejection_reason: 'Tutar uyuşmazlığı - kontrat bedeli ile fatura tutarı farklı',
    created_by: 'admin',
    created_date: '2024-10-28',
    isnet_envelope_id: 'ENV-2024-004',
    ettn: '550e8400-e29b-41d4-a716-446655440004',
  },
];

export const invoiceLineData: InvoiceLineData[] = [
  // Fatura 1 - ALI2024000001
  {
    id: 1,
    invoice_id: 1,
    line_no: 1,
    service_code: 'BRNM-001',
    service_name: 'Barınma Hizmeti',
    description: 'M/B Deniz Yıldızı - 15m - Kasım 2024 Aylık Barınma',
    quantity: 15,
    unit: 'METRE',
    unit_price: 3000.00,
    line_total: 45000.00,
    vat_rate: 20,
    vat_amount: 9000.00,
    line_total_with_vat: 54000.00,
    created_date: '2024-11-01',
  },
  // Fatura 2 - ALI2024000002
  {
    id: 2,
    invoice_id: 2,
    line_no: 1,
    service_code: 'BRNM-001',
    service_name: 'Barınma Hizmeti',
    description: 'M/B Marmara - 12.5m - Kasım 2024 Aylık Barınma',
    quantity: 12.5,
    unit: 'METRE',
    unit_price: 200.00,
    line_total: 2500.00,
    vat_rate: 20,
    vat_amount: 500.00,
    line_total_with_vat: 3000.00,
    created_date: '2024-11-05',
  },
  // Fatura 3 - ALI2024000003
  {
    id: 3,
    invoice_id: 3,
    line_no: 1,
    service_code: 'BRNM-001',
    service_name: 'Barınma Hizmeti',
    description: 'M/B Ege Yıldızı - 12m - Kasım 2024 Aylık Barınma',
    quantity: 12,
    unit: 'METRE',
    unit_price: 3000.00,
    line_total: 36000.00,
    vat_rate: 20,
    vat_amount: 7200.00,
    line_total_with_vat: 43200.00,
    created_date: '2024-11-15',
  },
  // Fatura 4 - ALI2024000004
  {
    id: 4,
    invoice_id: 4,
    line_no: 1,
    service_code: 'BRNM-001',
    service_name: 'Barınma Hizmeti',
    description: 'M/B Deniz Yıldızı - 15m - Ekim 2024 Aylık Barınma',
    quantity: 15,
    unit: 'METRE',
    unit_price: 3000.00,
    line_total: 45000.00,
    vat_rate: 20,
    vat_amount: 9000.00,
    line_total_with_vat: 54000.00,
    created_date: '2024-10-28',
  },
];

// İşnet durum kodları
export const isnetStatusCodes = {
  '1000': 'Başarılı',
  '1100': 'Zarf işleniyor',
  '1200': 'GİB\'e gönderildi',
  '1300': 'GİB\'den onay alındı',
  '2000': 'Hata - Tekrar denenebilir',
  '3000': 'Hata - Müdahale gerekli',
};

// Fatura senaryoları
export const invoiceScenarios = [
  { value: 'TICARIFATURA', label: 'Ticari Fatura', description: 'B2B işlemler için' },
  { value: 'TEMELFATURA', label: 'Temel Fatura', description: 'Basit ticari işlemler' },
  { value: 'YOLCUBERABERFATURA', label: 'Yolcu Beraber Fatura', description: 'Şahıs müşteriler' },
];

// Fatura tipleri
export const invoiceTypes = [
  { value: 'SATIS', label: 'Satış Faturası' },
  { value: 'IADE', label: 'İade Faturası' },
  { value: 'TEVKIFAT', label: 'Tevkifat Faturası' },
];
