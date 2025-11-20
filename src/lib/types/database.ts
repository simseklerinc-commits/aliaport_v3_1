// DATABASE TYPES - SQL Şemasına 1:1 Eşleşen TypeScript Types
// PostgreSQL tablolarının TypeScript karşılıkları

// ============================================
// CORE SYSTEM TYPES
// ============================================

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at?: string;
}

// ============================================
// CARİ (tmm_cari)
// ============================================

export interface Cari {
  id: number;
  code: string;
  title: string;
  type: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  tax_office?: string;
  tax_number?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  created_by?: number;
  updated_at?: string;
  updated_by?: number;
}

export interface CariHesapHareket {
  id: number;
  cari_id: number;
  transaction_date: string;
  transaction_type: 'DEBIT' | 'CREDIT';
  amount: number;
  currency: string;
  description?: string;
  document_type?: string;
  document_id?: number;
  created_at: string;
  created_by?: number;
}

// ============================================
// HİZMET KARTI (service_card)
// ============================================

export interface ServiceCard {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  created_by?: number;
  updated_at?: string;
  updated_by?: number;
}

// ============================================
// TARİFE (price_list + price_list_item)
// ============================================

export interface PriceList {
  id: number;
  code: string;
  name: string;
  description?: string;
  valid_from: string;
  valid_to?: string;
  currency: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  created_by?: number;
  updated_at?: string;
  updated_by?: number;
}

export interface PriceListItem {
  id: number;
  price_list_id: number;
  service_card_id: number;
  currency: string;
  unit_price: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  created_by?: number;
  updated_at?: string;
  updated_by?: number;
}

// ============================================
// MOTORBOT (motorbot)
// ============================================

export interface Motorbot {
  id: number;
  code: string;
  name: string;
  owner?: string;
  length_meters?: number;
  beam_meters?: number;
  draft_meters?: number;
  flag?: string;
  registration_number?: string;
  year_built?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  created_by?: number;
  updated_at?: string;
  updated_by?: number;
}

// Extended Motorbot Master Type (for advanced motorbot management)
export interface MotorbotMaster {
  id?: number;
  code: string;
  name: string;
  vessel_type?: string;
  boat_type?: string; // For compatibility
  owner_cari_id?: number;
  owner_cari_code?: string;
  owner_name?: string;
  length: number;
  registered_length?: number;
  width: number;
  draft?: number;
  depth?: number;
  gross_tonnage?: number;
  engine?: string;
  fuel_capacity?: number;
  water_capacity?: number;
  flag?: string;
  registration_number?: string;
  year_built?: number;
  insurance_expiry?: string;
  berth_location?: string;
  is_active: boolean;
  is_frozen?: boolean; // For compatibility
  has_active_contract?: boolean;
  notes?: string;
  created_at?: string;
  created_by?: number;
  updated_at?: string;
  updated_by?: number;
  // For backward compatibility with Motorbot
  length_meters?: number;
  width_meters?: number;
  draft_meters?: number;
  capacity?: number; // For motorbot sefer
  license_plate?: string; // For motorbot sefer
  model?: string; // For motorbot sefer
  year?: number; // Alias for year_built
}

// ============================================
// BARINMA CONTRACT (barinma_contract + stg_barinma_contract)
// ============================================

export interface BarinmaContract {
  id: number;
  contract_number: string;
  motorbot_id: number;
  cari_id: number;
  service_card_id: number;
  price_list_id: number;
  start_date: string;
  end_date?: string;
  unit_price: number;
  currency: string;
  vat_rate: number;
  billing_period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  is_active: boolean;
  notes?: string;
  created_at: string;
  created_by?: number;
  updated_at?: string;
  updated_by?: number;
}

export interface StgBarinmaContract {
  id: number;
  contract_number: string;
  motorbot_code: string;
  motorbot_name: string;
  motorbot_owner?: string;
  cari_code: string;
  cari_title: string;
  service_code: string;
  service_name: string;
  price_list_code: string;
  price_list_name: string;
  start_date: string;
  end_date?: string;
  unit_price: number;
  currency: string;
  vat_rate: number;
  billing_period: string;
  is_active: boolean;
  created_at: string;
}

// ============================================
// MOTORBOT SEFER (mb_trip)
// ============================================

export interface MbTrip {
  id: number;
  motorbot_id: number;
  motorbot_code: string;
  motorbot_name: string;
  motorbot_owner?: string;
  cari_code?: string;
  departure_date: string;
  departure_time: string;
  departure_note?: string;
  return_date?: string;
  return_time?: string;
  return_note?: string;
  duration_minutes?: number;
  status: 'DEPARTED' | 'RETURNED';
  unit_price: number;
  currency: string;
  vat_rate: number;
  vat_amount: number;
  total_price: number;
  is_invoiced: boolean;
  invoice_id?: number;
  invoice_date?: string;
  invoice_period?: string;
  created_at: string;
  created_by?: number;
  updated_at?: string;
  updated_by?: number;
}

// ============================================
// FATURA (invoice + invoice_item)
// ============================================

export interface Invoice {
  id: number;
  invoice_number: string;
  invoice_type: 'SALES' | 'PURCHASE';
  invoice_date: string;
  cari_id: number;
  currency: string;
  subtotal: number;
  vat_total: number;
  total: number;
  status: 'DRAFT' | 'APPROVED' | 'SENT' | 'PAID' | 'CANCELLED';
  e_invoice_uuid?: string;
  e_invoice_status?: string;
  e_invoice_sent_at?: string;
  notes?: string;
  created_at: string;
  created_by?: number;
  updated_at?: string;
  updated_by?: number;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  service_card_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  currency: string;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  source_type?: string;
  source_id?: number;
  created_at: string;
}

// ============================================
// PARAMETRE (system_parameter)
// ============================================

export interface SystemParameter {
  id: number;
  category: string;
  key: string;
  value: string;
  data_type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// ============================================
// DÖVİZ KURU (exchange_rate)
// ============================================

export interface ExchangeRate {
  id: number;
  currency_from: string;
  currency_to: string;
  rate: number;
  rate_date: string;
  source?: string;
  created_at: string;
}

// ============================================
// PAGINATION
// ============================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================
// İ�� EMRİ (work_order + work_order_item)
// ============================================

export interface WorkOrder {
  id: number;
  wo_number: string; // İş emri numarası (GUID/seri)
  cari_id: number;
  cari_code: string;
  cari_title: string;
  requester_user_id?: number;
  requester_user_name?: string;
  type: 'HIZMET' | 'MOTORBOT' | 'BARINMA' | 'DIGER'; // İş emri tipi
  service_code?: string; // Hizmet kartı kodu (opsiyonel)
  action: string; // ARAÇ_GİRİŞ, FORKLIFT, MOTORBOT, PERSONEL_TRANSFER, vb.
  subject: string; // Başlık (3-120 karakter)
  description: string; // Açıklama (≤500)
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  planned_start?: string; // Planlanan başlangıç
  planned_end?: string; // Planlanan bitiş
  actual_start?: string; // Gerçek başlangıç
  actual_end?: string; // Gerçek bitiş
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'SAHADA' | 'TAMAMLANDI' | 'FATURALANDI' | 'KAPANDI' | 'REJECTED';
  gate_required: boolean; // Güvenlik tableti gerekli mi?
  saha_kayit_yetkisi: boolean; // Saha WorkLog yazabilir mi?
  attachments_count: number;
  has_signature: boolean;
  is_cabatoge_tr_flag: boolean; // Türk bayraklı & kabotaj indirim
  apply_rule_addons: boolean; // Kural kaynaklı ek ücretleri uygula
  security_exit_time?: string; // Güvenlik çıkış anı
  attached_letter_approved: boolean; // Dış vinç dilekçe onayı
  notes?: string;
  is_active: boolean;
  created_at: string;
  created_by?: number;
  created_by_name?: string;
  updated_at?: string;
  updated_by?: number;
  updated_by_name?: string;
}

export interface WorkOrderItem {
  id: number;
  work_order_id: number;
  wo_number: string;
  item_type: 'WORKLOG' | 'RESOURCE' | 'SERVICE'; // Kalem tipi
  resource_code?: string; // FORKLIFT, TRANSPALET, ARDİYE, MB, vb.
  resource_name?: string;
  service_code?: string; // Hizmet kartı kodu
  service_name?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number; // Süre (dakika)
  quantity: number;
  unit: string;
  unit_price: number;
  currency: string;
  total_amount: number;
  vat_rate: number;
  vat_amount: number;
  grand_total: number;
  notes?: string;
  is_invoiced: boolean;
  invoice_id?: number;
  created_at: string;
  created_by?: number;
  created_by_name?: string;
}

// ============================================
// DİJİTAL ARŞİV (archive_doc)
// ============================================

export interface ArchiveDoc {
  id: number;
  work_order_id?: number;
  wo_number?: string;
  cari_id?: number;
  cari_code?: string;
  owner_type: 'CARI' | 'VEHICLE' | 'PERSONNEL' | 'WORKORDER'; // Evrak sahibi tipi
  owner_ref: string; // Sahibin referansı
  doc_type: 'WO_FORM' | 'SOZLESME' | 'FOTOGRAF' | 'RAPOR' | 'FATURA' | 'IMZALI_FORM' | 'UBL' | 'RUHSAT' | 'KIMLIK' | 'EHLIYET' | 'SRC' | 'GUMRUK_IZIN' | 'DEKONT';
  file_name: string;
  file_ext: string;
  file_size: number; // bytes
  file_path: string; // Sunucu dosya yolu
  hash_md5?: string;
  hash_sha256?: string;
  upload_user_id?: number;
  upload_user_name?: string;
  upload_at: string;
  expiry_date?: string; // Belge geçerlilik sonu
  status: 'SUBMITTED' | 'VERIFIED' | 'EXPIRED' | 'MISSING'; // Belge durumu
  tags?: string; // JSON tags
  notes?: string;
  is_immutable: boolean; // Değişmez mi? (gönderilmiş UBL vb.)
  created_at: string;
  created_by?: number;
}

// ============================================
// GÜVENLİK KAPI KAYDI (security_gate_log)
// ============================================

export interface SecurityGateLog {
  id: number;
  work_order_id?: number;
  wo_number?: string;
  gate_type: 'IN' | 'OUT';
  vehicle_plate?: string;
  driver_name?: string;
  driver_id?: string;
  entry_time?: string;
  exit_time?: string;
  photo_path?: string; // Araç/belge fotoğrafı
  security_user_id?: number;
  security_user_name?: string;
  exception_pin_used: boolean; // İstisna PIN kullanıldı mı?
  exception_reason?: string;
  notes?: string;
  created_at: string;
  created_by?: number;
}

// ============================================
// CARİ PORTAL KULLANICISI (cari_user)
// ============================================

export interface CariUser {
  id: number;
  cari_id: number;
  cari_code: string;
  email: string;
  phone?: string;
  full_name: string;
  role: 'ADMIN' | 'USER' | 'VIEWER'; // Cari başına çoklu kullanıcı
  is_active: boolean;
  mfa_enabled: boolean; // Admin için MFA zorunlu
  last_login?: string;
  created_at: string;
  created_by?: number;
  updated_at?: string;
}

// ============================================
// SİHİRLİ LİNK (magic_token)
// ============================================

export interface MagicToken {
  id: number;
  token: string; // Unique token
  cari_id: number;
  cari_code: string;
  email: string;
  expires_at: string; // 15-60 dk geçerlilik
  used: boolean; // Tek kullanımlık
  used_at?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// ============================================
// PAGINATION
// ============================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
  status: number;
}

// ============================================
// ENRICHED TYPES (JOIN'li sorgular için)
// ============================================

export interface CariWithStats extends Cari {
  total_invoices?: number;
  total_amount?: number;
  last_invoice_date?: string;
  balance?: number;
}

export interface ServiceCardWithPrice extends ServiceCard {
  current_price?: number;
  currency?: string;
  price_list_name?: string;
}

export interface MotorbotWithContract extends Motorbot {
  contract?: BarinmaContract;
  active_contract?: BarinmaContract;
  has_contract?: boolean;
  current_cari?: Cari;
  trip_count?: number;
  last_trip_date?: string;
}

export interface MbTripWithDetails extends MbTrip {
  motorbot?: Motorbot;
  cari?: Cari;
  invoice?: Invoice;
}