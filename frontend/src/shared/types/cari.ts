// Cari (Customer) entity TypeScript interfaces derived from backend SQLAlchemy model

export interface Cari {
  Id: number;
  CariKod: string; // unique code
  Unvan: string; // title/name
  CariTip: 'GERCEK' | 'TUZEL';
  Rol: 'MUSTERI' | 'TEDARIKCI' | 'DIGER';
  VergiDairesi?: string | null;
  VergiNo?: string | null;
  Tckn?: string | null;
  Ulke?: string | null;
  Il?: string | null;
  Ilce?: string | null;
  Adres?: string | null;
  Telefon?: string | null;
  Eposta?: string | null;
  IletisimKisi?: string | null;
  Iban?: string | null;
  VadeGun?: number | null;
  ParaBirimi?: string | null; // default may come from parameters
  Notlar?: string | null;
  AktifMi: boolean;
  CreatedAt: string; // ISO8601
  UpdatedAt?: string | null;
  CreatedBy?: number | null;
  UpdatedBy?: number | null;
}

export interface CreateCariPayload {
  CariKod: string;
  Unvan: string;
  CariTip: 'GERCEK' | 'TUZEL';
  Rol: 'MUSTERI' | 'TEDARIKCI' | 'DIGER';
  Eposta?: string;
  Telefon?: string;
  VergiNo?: string;
  Tckn?: string;
  Ulke?: string;
  Il?: string;
  Ilce?: string;
  Adres?: string;
  IletisimKisi?: string;
  Iban?: string;
  VadeGun?: number;
  ParaBirimi?: string;
  Notlar?: string;
}

export interface UpdateCariPayload extends Partial<CreateCariPayload> {
  Id: number;
  AktifMi?: boolean;
}
