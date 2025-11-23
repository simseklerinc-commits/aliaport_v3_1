// Barınma (Accommodation Contract) TypeScript types - Backend schema alignment
// Backend: app/models_barinma.py, app/schemas_barinma.py

export interface BarinmaContract {
  Id: number;
  ContractNumber: string;  // Required, unique
  MotorbotId: number;  // FK → motorbot.Id
  CariId: number;  // FK → tmm_cari.Id
  ServiceCardId: number;  // FK → service_card.Id
  PriceListId: number;  // FK → price_list.Id
  StartDate: string;  // Required (Date)
  EndDate?: string;  // Date, nullable (NULL = open-ended contract)
  UnitPrice: number;  // Required
  Currency?: string;  // Default: 'TRY'
  VatRate?: number;  // Default: 20.00
  BillingPeriod?: string;  // 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  IsActive?: boolean;
  Notes?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  CreatedBy?: number;
  UpdatedBy?: number;
}

export interface BarinmaContractCreate {
  ContractNumber: string;
  MotorbotId: number;
  CariId: number;
  ServiceCardId: number;
  PriceListId: number;
  StartDate: string;
  EndDate?: string;
  UnitPrice: number;
  Currency?: string;
  VatRate?: number;
  BillingPeriod?: string;
  IsActive?: boolean;
  Notes?: string;
}

export interface BarinmaContractUpdate {
  Id: number;
  ContractNumber?: string;
  MotorbotId?: number;
  CariId?: number;
  ServiceCardId?: number;
  PriceListId?: number;
  StartDate?: string;
  EndDate?: string;
  UnitPrice?: number;
  Currency?: string;
  VatRate?: number;
  BillingPeriod?: string;
  IsActive?: boolean;
  Notes?: string;
}
