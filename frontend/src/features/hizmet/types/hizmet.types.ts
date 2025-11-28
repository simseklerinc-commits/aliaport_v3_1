/**
 * HIZMET MODULE - TypeScript Types
 * Backend schema: app/models_hizmet.py, app/schemas_hizmet.py
 */

// Calculation Type Enum (must match backend)
export enum CalculationType {
  FIXED = 'FIXED',
  PER_UNIT = 'PER_UNIT',
  X_SECONDARY = 'X_SECONDARY',
  PER_BLOCK = 'PER_BLOCK',
  BASE_PLUS_INCREMENT = 'BASE_PLUS_INCREMENT',
  VEHICLE_4H_RULE = 'VEHICLE_4H_RULE',
}

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
  // NEW: Pricing Engine fields
  CalculationType?: CalculationType | string;
  FormulaParams?: Record<string, any>;
  RequiresPersonCount?: boolean;
  RequiresVehicleInfo?: boolean;
  RequiresWeightInfo?: boolean;
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
  CalculationType?: CalculationType | string;
  FormulaParams?: Record<string, any>;
  RequiresPersonCount?: boolean;
  RequiresVehicleInfo?: boolean;
  RequiresWeightInfo?: boolean;
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
  CalculationType?: CalculationType | string;
  FormulaParams?: Record<string, any>;
  RequiresPersonCount?: boolean;
  RequiresVehicleInfo?: boolean;
  RequiresWeightInfo?: boolean;
}

// Pricing Engine Types
export interface PriceCalculationRequest {
  hizmet_id: number;
  effective_date?: string;  // ISO8601 date
  quantity?: number;
  person_count?: number;
  multiplier_x?: number;
  block_size?: number;
  base_threshold?: number;
  weight_tons?: number;
  duration_minutes?: number;
}

export interface PriceCalculationResponse {
  calculated_price: number;
  currency: string;
  calculation_type: CalculationType | string;
  formula_used: string;
  breakdown: Record<string, any>;
  tarife_override_applied: boolean;
  effective_date?: string;
}

