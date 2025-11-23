// Tarife (Price List) TypeScript types - Backend schema alignment
// Backend: app/models_tarife.py, app/schemas_tarife.py

export interface PriceList {
  Id: number;
  Kod: string;  // Required
  Ad: string;   // Required
  Aciklama?: string;
  ParaBirimi?: string;  // Default: 'TRY'
  Versiyon?: number;
  Durum?: string;  // 'TASLAK' | 'AKTIF' | 'ARSIV'
  GecerlilikBaslangic?: string;  // Date
  GecerlilikBitis?: string;  // Date
  AktifMi?: boolean;
  CreatedAt?: string;
  UpdatedAt?: string;
  CreatedBy?: number;
  UpdatedBy?: number;
}

export interface PriceListCreate {
  Kod: string;
  Ad: string;
  Aciklama?: string;
  ParaBirimi?: string;
  Versiyon?: number;
  Durum?: string;
  GecerlilikBaslangic?: string;
  GecerlilikBitis?: string;
  AktifMi?: boolean;
}

export interface PriceListUpdate {
  Id: number;
  Kod?: string;
  Ad?: string;
  Aciklama?: string;
  ParaBirimi?: string;
  Versiyon?: number;
  Durum?: string;
  GecerlilikBaslangic?: string;
  GecerlilikBitis?: string;
  AktifMi?: boolean;
}

export interface PriceListItem {
  Id: number;
  PriceListId: number;
  HizmetKodu: string;
  HizmetAdi?: string;
  Birim?: string;
  BirimFiyat: number;
  KdvOrani?: number;
  Aciklama?: string;
  SiraNo?: number;
  AktifMi?: boolean;
  CreatedAt?: string;
  UpdatedAt?: string;
}
