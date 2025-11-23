/**
 * HIZMET MODULE - TypeScript Types
 * Backend schema: app/models_hizmet.py, app/schemas_hizmet.py
 */

export interface Hizmet {
  Id: number;
  Kod: string;
  Ad: string;
  Aciklama?: string;
  MuhasebeKodu?: string;
  GrupKod?: string;
  Birim?: string;
  Fiyat?: number;
  ParaBirimi?: string;
  KdvOrani?: number;
  UnitId?: number;
  VatRateId?: number;
  VatExemptionId?: number;
  GroupId?: number;
  CategoryId?: number;
  PricingRuleId?: number;
  MetadataJson?: string;
  SiraNo?: number;
  AktifMi?: boolean;
  CreatedAt?: string;
  UpdatedAt?: string;
  CreatedBy?: number;
  UpdatedBy?: number;
}

export interface HizmetCreate {
  Kod: string;
  Ad: string;
  Aciklama?: string;
  MuhasebeKodu?: string;
  GrupKod?: string;
  Birim?: string;
  Fiyat?: number;
  ParaBirimi?: string;
  KdvOrani?: number;
  UnitId?: number;
  VatRateId?: number;
  VatExemptionId?: number;
  GroupId?: number;
  CategoryId?: number;
  PricingRuleId?: number;
  MetadataJson?: string;
  SiraNo?: number;
  AktifMi?: boolean;
}

export interface HizmetUpdate {
  Kod?: string;
  Ad?: string;
  Aciklama?: string;
  MuhasebeKodu?: string;
  GrupKod?: string;
  Birim?: string;
  Fiyat?: number;
  ParaBirimi?: string;
  KdvOrani?: number;
  UnitId?: number;
  VatRateId?: number;
  VatExemptionId?: number;
  GroupId?: number;
  CategoryId?: number;
  PricingRuleId?: number;
  MetadataJson?: string;
  SiraNo?: number;
  AktifMi?: boolean;
}
