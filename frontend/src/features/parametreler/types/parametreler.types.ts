// Parametreler (Parameters) TypeScript types - Backend schema alignment
// Backend: app/models_parametre.py, app/schemas_parametre.py

export interface Parametre {
  Id: number;
  Kategori: string;  // Required (e.g., 'BIRIM', 'KDV', 'ESIK', 'GENEL')
  Kod: string;  // Required, unique
  Ad: string;  // Required
  Deger?: string | null;  // Value (can be numeric, string, JSON)
  Aciklama?: string | null;  // Description
  AktifMi: boolean;  // Default: true
  CreatedAt: string;
  UpdatedAt?: string | null;
}

export interface ParametreCreate {
  Kategori: string;
  Kod: string;
  Ad: string;
  Deger?: string;
  Aciklama?: string;
  AktifMi?: boolean;
}

export interface ParametreUpdate {
  Id?: number;  // Optional for partial updates
  Kategori?: string;
  Kod?: string;
  Ad?: string;
  Deger?: string;
  Aciklama?: string;
  AktifMi?: boolean;
}

export interface PaginatedParametreResponse {
  items: Parametre[];
  total?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
  pagination?: {
    page: number;
    page_size: number;
    total_pages: number;
    total: number;
    has_next: boolean;
    has_prev: boolean;
  };
  message?: string;
}

// Parameter category constants
export const PARAMETRE_KATEGORILER = {
  BIRIM: 'BIRIM',                      // Units
  PARA_BIRIMI: 'PARA_BIRIMI',          // Currency
  KDV_ORANI: 'KDV_ORANI',              // VAT Rates
  KDV_ISTISNA: 'KDV_ISTISNA',          // VAT Exemptions
  HIZMET_GRUBU: 'HIZMET_GRUBU',        // Service Groups
  HIZMET_KATEGORI: 'HIZMET_KATEGORI',  // Service Categories
  FIYATLANDIRMA_KURALI: 'FIYATLANDIRMA_KURALI',  // Pricing Rules
  CARI_TIP: 'CARI_TIP',                // Customer Types
  CARI_ROL: 'CARI_ROL',                // Customer Roles
  MOTORBOT_DURUM: 'MOTORBOT_DURUM',    // Motorbot Status
  SEFER_DURUM: 'SEFER_DURUM',          // Trip Status
  IS_EMRI_TIP: 'IS_EMRI_TIP',          // Work Order Types
  IS_EMRI_ONCELIK: 'IS_EMRI_ONCELIK',  // Work Order Priority
  SISTEM: 'SISTEM',                    // System Configuration
  GENEL: 'GENEL',                      // General
  ESIK: 'ESIK',                        // Thresholds
} as const;

export type ParametreKategori = typeof PARAMETRE_KATEGORILER[keyof typeof PARAMETRE_KATEGORILER];

