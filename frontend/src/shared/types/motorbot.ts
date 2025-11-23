/**
 * Motorbot (Boat) Type Definitions
 * Backend source: aliaport_api/modules/motorbot/schemas.py
 */

/**
 * Motorbot (Boat) entity
 */
export interface Motorbot {
  Id: number;
  Kod: string;
  Ad: string;
  Plaka?: string;
  KapasiteTon?: number; // Serialized as number from backend
  MaxHizKnot?: number; // Serialized as number from backend
  OwnerCariId?: number;
  OwnerCariKod?: string;
  Durum: 'AKTIF' | 'PASIF' | 'BAKIMDA';
  AlisTarihi?: string; // ISO8601 date string (YYYY-MM-DD)
  Notlar?: string;
  CreatedAt: string; // ISO8601 datetime
  UpdatedAt?: string; // ISO8601 datetime
}

/**
 * Motorbot oluşturma payload
 */
export interface CreateMotorbotPayload {
  Kod: string;
  Ad: string;
  Plaka?: string;
  KapasiteTon?: number;
  MaxHizKnot?: number;
  OwnerCariId?: number;
  OwnerCariKod?: string;
  Durum?: 'AKTIF' | 'PASIF' | 'BAKIMDA';
  AlisTarihi?: string; // ISO8601 date string
  Notlar?: string;
}

/**
 * Motorbot güncelleme payload (partial)
 */
export interface UpdateMotorbotPayload {
  Kod?: string;
  Ad?: string;
  Plaka?: string;
  KapasiteTon?: number;
  MaxHizKnot?: number;
  OwnerCariId?: number;
  OwnerCariKod?: string;
  Durum?: 'AKTIF' | 'PASIF' | 'BAKIMDA';
  AlisTarihi?: string; // ISO8601 date string
  Notlar?: string;
}

/**
 * Motorbot Sefer (Trip) entity
 */
export interface MbTrip {
  Id: number;
  MotorbotId: number;
  SeferTarihi: string; // ISO8601 date string (YYYY-MM-DD)
  CikisZamani?: string; // ISO8601 datetime
  DonusZamani?: string; // ISO8601 datetime
  KalkisIskele?: string;
  VarisIskele?: string;
  CariId?: number;
  CariKod?: string;
  YukAciklama?: string;
  Notlar?: string;
  Durum: 'PLANLANDI' | 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'IPTAL';
  FaturaDurumu?: 'FATURA_BEKLIYOR' | 'FATURALANDI' | 'ODENDI';
  CreatedAt: string; // ISO8601 datetime
  UpdatedAt?: string; // ISO8601 datetime
}

/**
 * MbTrip oluşturma payload
 */
export interface CreateMbTripPayload {
  MotorbotId: number;
  SeferTarihi: string; // ISO8601 date string
  CikisZamani?: string; // ISO8601 datetime
  DonusZamani?: string; // ISO8601 datetime
  KalkisIskele?: string;
  VarisIskele?: string;
  CariId?: number;
  CariKod?: string;
  YukAciklama?: string;
  Notlar?: string;
  Durum?: 'PLANLANDI' | 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'IPTAL';
  FaturaDurumu?: 'FATURA_BEKLIYOR' | 'FATURALANDI' | 'ODENDI';
}

/**
 * MbTrip güncelleme payload (partial)
 */
export interface UpdateMbTripPayload {
  MotorbotId?: number;
  SeferTarihi?: string; // ISO8601 date string
  CikisZamani?: string; // ISO8601 datetime
  DonusZamani?: string; // ISO8601 datetime
  KalkisIskele?: string;
  VarisIskele?: string;
  CariId?: number;
  CariKod?: string;
  YukAciklama?: string;
  Notlar?: string;
  Durum?: 'PLANLANDI' | 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'IPTAL';
  FaturaDurumu?: 'FATURA_BEKLIYOR' | 'FATURALANDI' | 'ODENDI';
}
