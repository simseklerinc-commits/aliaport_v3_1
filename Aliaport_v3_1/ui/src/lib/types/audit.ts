// AUDIT LOG & CHANGE HISTORY TYPES
// Değişiklik geçmişi ve denetim kayıtları için tipler

export interface AuditLog {
  id: number;
  table_name: string; // Hangi tablo (customers, services, motorboats vb.)
  record_id: number; // Kaydın ID'si
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'STATUS_CHANGE';
  field_name?: string; // Değiştirilen alan (UPDATE için)
  old_value?: string; // Eski değer (JSON string)
  new_value?: string; // Yeni değer (JSON string)
  changed_by: number; // Değiştiren kullanıcı ID
  changed_by_name: string; // Değiştiren kullanıcı adı
  changed_at: string; // Değişiklik zamanı
  ip_address?: string; // IP adresi
  user_agent?: string; // Browser bilgisi
  notes?: string; // Açıklama
}

export interface RecordMetadata {
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_by?: number;
  updated_by_name?: string;
  updated_at?: string;
  is_deleted: boolean;
  deleted_by?: number;
  deleted_by_name?: string;
  deleted_at?: string;
  version: number; // Versiyon numarası
  has_movements: boolean; // Hareket var mı?
  movement_count: number; // Hareket sayısı
}

export interface FieldValidationRule {
  field_name: string;
  label: string;
  editable: 'always' | 'never' | 'if_no_movements' | 'if_draft';
  required: boolean;
  validation_message?: string;
}

// Silme önkoşulları
export interface DeleteValidation {
  can_delete: boolean;
  reason?: string;
  movement_count: number;
  related_records: {
    table: string;
    count: number;
    description: string;
  }[];
}

// Durum değişikliği
export interface StatusChange {
  from_status: string;
  to_status: string;
  allowed: boolean;
  reason?: string;
}

// Kart durumları
export type RecordStatus = 
  | 'TASLAK'      // Henüz onaylanmamış, tüm alanlar değiştirilebilir
  | 'AKTİF'       // Onaylanmış ve kullanımda
  | 'PASİF'       // Kullanımda değil ama silinmemiş
  | 'ARŞİV'       // Arşivlenmiş
  | 'İPTAL';      // İptal edilmiş

// Alan düzenleme izinleri
export const FIELD_EDIT_RULES: Record<string, FieldValidationRule[]> = {
  // Hizmet Kartları
  services: [
    { field_name: 'service_code', label: 'Hizmet Kodu', editable: 'never', required: true },
    { field_name: 'service_name', label: 'Hizmet Adı', editable: 'always', required: true },
    { field_name: 'description', label: 'Açıklama', editable: 'always', required: false },
    { field_name: 'unit_id', label: 'Birim', editable: 'if_no_movements', required: true, 
      validation_message: 'Bu hizmete ait hareketler var, birim değiştirilemez' },
    { field_name: 'pricing_rule_id', label: 'Fiyatlandırma Kuralı', editable: 'if_no_movements', required: true,
      validation_message: 'Bu hizmete ait hareketler var, fiyatlandırma kuralı değiştirilemez' },
    { field_name: 'service_group_id', label: 'Hizmet Grubu', editable: 'if_no_movements', required: false },
    { field_name: 'category_id', label: 'Kategori', editable: 'always', required: false },
    { field_name: 'is_active', label: 'Durum', editable: 'always', required: true },
  ],
  
  // Cari Kartlar
  customers: [
    { field_name: 'customer_code', label: 'Cari Kodu', editable: 'never', required: true },
    { field_name: 'customer_name', label: 'Cari Adı', editable: 'always', required: true },
    { field_name: 'customer_type', label: 'Cari Tipi', editable: 'if_no_movements', required: true,
      validation_message: 'Bu cariye ait hareketler var, cari tipi değiştirilemez' },
    { field_name: 'tax_number', label: 'Vergi No', editable: 'if_no_movements', required: false },
    { field_name: 'tax_office', label: 'Vergi Dairesi', editable: 'always', required: false },
    { field_name: 'address', label: 'Adres', editable: 'always', required: false },
    { field_name: 'phone', label: 'Telefon', editable: 'always', required: false },
    { field_name: 'email', label: 'E-posta', editable: 'always', required: false },
    { field_name: 'currency', label: 'Para Birimi', editable: 'if_no_movements', required: true,
      validation_message: 'Bu cariye ait hareketler var, para birimi değiştirilemez' },
  ],
  
  // Motorbot Kartları
  motorboats: [
    { field_name: 'motorboat_code', label: 'Motorbot Kodu', editable: 'never', required: true },
    { field_name: 'motorboat_name', label: 'Motorbot Adı', editable: 'always', required: true },
    { field_name: 'capacity', label: 'Kapasite', editable: 'if_no_movements', required: true,
      validation_message: 'Bu motorbota ait seferler var, kapasite değiştirilemez' },
    { field_name: 'license_plate', label: 'Plaka/Sicil', editable: 'always', required: false },
    { field_name: 'model', label: 'Model', editable: 'always', required: false },
    { field_name: 'year', label: 'Yıl', editable: 'always', required: false },
    { field_name: 'is_active', label: 'Durum', editable: 'always', required: true },
  ],
};

// Durum geçiş kuralları
export const STATUS_TRANSITIONS: Record<string, RecordStatus[]> = {
  TASLAK: ['AKTİF', 'İPTAL'],
  AKTİF: ['PASİF', 'ARŞİV'],
  PASİF: ['AKTİF', 'ARŞİV'],
  ARŞİV: ['PASİF'],
  İPTAL: [], // İptal edilmiş kayıt başka duruma geçemez
};

// Silme kuralları
export const DELETE_RULES = {
  // Eğer hareket varsa silinemeyen tablolar
  protected_tables: ['customers', 'services', 'motorboats'],
  
  // Sadece soft delete yapılabilecek tablolar
  soft_delete_only: ['customers', 'services', 'motorboats', 'contracts'],
  
  // Hard delete yapılabilecek tablolar (hareket kontrolü yok)
  hard_delete_allowed: ['parameter_units', 'parameter_currencies'],
};
