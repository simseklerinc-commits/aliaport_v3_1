/**
 * CARI MODULE - TypeScript Types
 * Cari (Customer/Account) veri tipleri
 */

export interface Cari {
  Id: number;
  CariKod: string;
  Unvan: string;
  CariTip: string;  // 'MUSTERI' | 'TEDARIKCI' | 'HER_IKISI'
  Rol: string;      // 'NORMAL' | 'VIP' | 'KURUMSAL'
  
  VergiDairesi?: string;
  VergiNo?: string;
  Tckn?: string;
  
  Ulke?: string;
  Il?: string;
  Ilce?: string;
  Adres?: string;
  
  Telefon?: string;
  Eposta?: string;
  IletisimKisi?: string;  // Contact Person
  Iban?: string;
  
  VadeGun?: number;
  ParaBirimi?: string;
  Notlar?: string;  // Notes
  AktifMi?: boolean;
  
  CreatedAt?: string;
  UpdatedAt?: string;
  CreatedBy?: number;
  UpdatedBy?: number;
}

export interface CariCreate {
  CariKod: string;
  Unvan: string;
  CariTip: string;
  Rol: string;
  
  VergiDairesi?: string;
  VergiNo?: string;
  Tckn?: string;
  
  Ulke?: string;
  Il?: string;
  Ilce?: string;
  Adres?: string;
  
  Telefon?: string;
  Eposta?: string;
  IletisimKisi?: string;  // Contact Person
  Iban?: string;
  
  VadeGun?: number;
  ParaBirimi?: string;
  Notlar?: string;  // Notes
}

export interface CariUpdate {
  CariKod?: string;
  Unvan?: string;
  CariTip?: string;
  Rol?: string;
  
  VergiDairesi?: string;
  VergiNo?: string;
  Tckn?: string;
  
  Ulke?: string;
  Il?: string;
  Ilce?: string;
  Adres?: string;
  
  Telefon?: string;
  Eposta?: string;
  IletisimKisi?: string;  // Contact Person
  Iban?: string;
  
  VadeGun?: number;
  ParaBirimi?: string;
  Notlar?: string;  // Notes
  AktifMi?: boolean;
}

export interface CariListFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CariListResponse {
  items: Cari[];
  total: number;
  page: number;
  pageSize: number;
}
