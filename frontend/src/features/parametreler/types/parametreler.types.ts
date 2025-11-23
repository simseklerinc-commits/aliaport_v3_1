// Parametreler (Parameters) TypeScript types - Backend schema alignment
// Backend: app/models_parametre.py, app/schemas_parametre.py

export interface Parametre {
  Id: number;
  Kategori: string;  // Required (e.g., 'BIRIM', 'KDV', 'ESIK', 'GENEL')
  Kod: string;  // Required, unique
  Ad: string;  // Required
  Deger?: string;  // Value (can be numeric, string, JSON)
  Aciklama?: string;  // Description
  AktifMi?: boolean;
  CreatedAt?: string;
  UpdatedAt?: string;
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
  Id: number;
  Kategori?: string;
  Kod?: string;
  Ad?: string;
  Deger?: string;
  Aciklama?: string;
  AktifMi?: boolean;
}

export interface PaginatedParametreResponse {
  items: Parametre[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Parameter category constants
export const PARAMETRE_KATEGORILER = {
  BIRIM: 'BIRIM',        // Units
  KDV: 'KDV',            // VAT Rates
  ESIK: 'ESIK',          // Thresholds
  GENEL: 'GENEL',        // General
  PARA: 'PARA',          // Currency
  GRUP: 'GRUP',          // Service Groups
  KATEGORI: 'KATEGORI',  // Service Categories
  FIYAT: 'FIYAT',        // Pricing Rules
} as const;
