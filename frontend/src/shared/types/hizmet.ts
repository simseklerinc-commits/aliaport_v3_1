// Hizmet (Service) entity interfaces based on backend model fields

export interface Hizmet {
  Id: number;
  Kod: string;
  Ad: string;
  Aciklama?: string | null;
  MuhasebeKodu?: string | null;
  GrupKod?: string | null;
  Birim?: string | null;
  Fiyat?: string | null; // numeric(18,4) serialized as string
  ParaBirimi: string; // default TRY
  KdvOrani?: string | null; // numeric(5,2)
  UnitId?: number | null;
  VatRateId?: number | null;
  VatExemptionId?: number | null;
  GroupId?: number | null;
  CategoryId?: number | null;
  PricingRuleId?: number | null;
  MetadataJson?: string | null; // raw JSON string
  SiraNo?: number | null;
  AktifMi: boolean;
  CreatedAt: string;
  UpdatedAt?: string | null;
  CreatedBy?: number | null;
  UpdatedBy?: number | null;
}

export interface CreateHizmetPayload {
  Kod: string;
  Ad: string;
  Aciklama?: string;
  MuhasebeKodu?: string;
  GrupKod?: string;
  Birim?: string;
  Fiyat?: number; // use number client-side when sending
  ParaBirimi?: string;
  KdvOrani?: number;
  MetadataJson?: string; // JSON.stringify before send if object
  SiraNo?: number;
}

export interface UpdateHizmetPayload extends Partial<CreateHizmetPayload> {
  Id: number;
  AktifMi?: boolean;
}
