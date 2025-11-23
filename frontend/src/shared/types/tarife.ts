// Tarife (PriceList) and Tarife Kalemi (PriceListItem) interfaces

export type PriceListDurum = 'TASLAK' | 'AKTIF' | 'PASIF';

export interface PriceList {
  Id: number;
  Kod: string;
  Ad: string;
  Aciklama?: string | null;
  ParaBirimi: string;
  Versiyon: number;
  Durum: PriceListDurum;
  GecerlilikBaslangic?: string | null; // Date ISO (YYYY-MM-DD)
  GecerlilikBitis?: string | null; // Date ISO
  AktifMi: boolean;
  CreatedAt: string;
  UpdatedAt?: string | null;
}

export interface PriceListItem {
  Id: number;
  PriceListId: number;
  HizmetKodu: string;
  HizmetAdi: string;
  Birim?: string | null;
  BirimFiyat: string; // numeric serialized
  KdvOrani?: string | null;
  Aciklama?: string | null;
  SiraNo?: number | null;
  AktifMi: boolean;
  CreatedAt: string;
  UpdatedAt?: string | null;
}

export interface CreatePriceListPayload {
  Kod: string;
  Ad: string;
  Aciklama?: string;
  ParaBirimi?: string;
  GecerlilikBaslangic?: string; // YYYY-MM-DD
  GecerlilikBitis?: string; // YYYY-MM-DD
}

export interface UpdatePriceListPayload extends Partial<CreatePriceListPayload> {
  Id: number;
  Durum?: PriceListDurum;
  Versiyon?: number;
  AktifMi?: boolean;
}

export interface CreatePriceListItemPayload {
  PriceListId: number;
  HizmetKodu: string;
  HizmetAdi: string;
  Birim?: string;
  BirimFiyat: number; // send numeric
  KdvOrani?: number;
  Aciklama?: string;
  SiraNo?: number;
}

export interface UpdatePriceListItemPayload extends Partial<CreatePriceListItemPayload> {
  Id: number;
  AktifMi?: boolean;
}
