// BARINMA API - Barınma Kontratları modülü için gerçek API endpoints
// Backend: /api/barinma/ (FastAPI)
// NOTE: Backend PascalCase → Frontend snake_case transformers

import { apiClient } from './client';

export interface BarinmaContractListParams {
  page?: number;
  page_size?: number;
  is_active?: boolean;
  motorbot_id?: number;
  cari_id?: number;
}

// Backend Request (PascalCase - FastAPI bekliyor)
export interface BarinmaContractCreate {
  ContractNumber: string;
  MotorbotId: number;
  CariId: number;
  ServiceCardId: number;
  PriceListId: number;
  StartDate: string; // YYYY-MM-DD
  EndDate?: string | null;
  UnitPrice: number;
  Currency?: string;
  VatRate?: number;
  BillingPeriod?: string; // MONTHLY, QUARTERLY, YEARLY
  IsActive?: boolean;
  Notes?: string;
  CreatedBy?: number | null;
}

export interface BarinmaContractUpdate {
  ContractNumber?: string;
  MotorbotId?: number;
  CariId?: number;
  ServiceCardId?: number;
  PriceListId?: number;
  StartDate?: string;
  EndDate?: string | null;
  UnitPrice?: number;
  Currency?: string;
  VatRate?: number;
  BillingPeriod?: string;
  IsActive?: boolean;
  Notes?: string;
  UpdatedBy?: number | null;
}

// Backend Response (PascalCase)
export interface BarinmaContractResponse {
  Id: number;
  ContractNumber: string;
  MotorbotId: number;
  CariId: number;
  ServiceCardId: number;
  PriceListId: number;
  StartDate: string;
  EndDate?: string | null;
  UnitPrice: number;
  Currency: string;
  VatRate: number;
  BillingPeriod: string;
  IsActive: boolean;
  Notes?: string;
  CreatedAt: string;
  UpdatedAt?: string | null;
  CreatedBy?: number | null;
  UpdatedBy?: number | null;
}

export interface PaginatedBarinmaContractResponse {
  items: BarinmaContractResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Frontend State (snake_case)
export interface BarinmaContract {
  id: number;
  contract_number: string;
  motorbot_id: number;
  cari_id: number;
  service_card_id: number;
  price_list_id: number;
  start_date: string;
  end_date?: string | null;
  unit_price: number;
  currency: string;
  vat_rate: number;
  billing_period: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
}

// Transformers: Backend PascalCase ↔ Frontend snake_case
export const transformBarinmaResponse = (data: BarinmaContractResponse): BarinmaContract => {
  return {
    id: data.Id,
    contract_number: data.ContractNumber,
    motorbot_id: data.MotorbotId,
    cari_id: data.CariId,
    service_card_id: data.ServiceCardId,
    price_list_id: data.PriceListId,
    start_date: data.StartDate,
    end_date: data.EndDate,
    unit_price: typeof data.UnitPrice === 'string' ? parseFloat(data.UnitPrice) : data.UnitPrice,
    currency: data.Currency,
    vat_rate: typeof data.VatRate === 'string' ? parseFloat(data.VatRate) : data.VatRate,
    billing_period: data.BillingPeriod,
    is_active: data.IsActive,
    notes: data.Notes,
    created_at: data.CreatedAt,
    updated_at: data.UpdatedAt,
    created_by: data.CreatedBy,
    updated_by: data.UpdatedBy,
  };
};

export const transformBarinmaListResponse = (items: BarinmaContractResponse[]): BarinmaContract[] => {
  return items.map(transformBarinmaResponse);
};

export const barinmaApi = {
  getAll: async (params?: BarinmaContractListParams) => {
    const response = await apiClient.get<BarinmaContractResponse[]>("/barinma/", { params });
    return transformBarinmaListResponse(response);
  },

  getPaginated: async (params?: BarinmaContractListParams) => {
    const response = await apiClient.get<PaginatedBarinmaContractResponse>("/barinma/paginated", { params });
    return {
      ...response,
      items: transformBarinmaListResponse(response.items),
    };
  },

  getById: async (id: number) => {
    const response = await apiClient.get<BarinmaContractResponse>(`/barinma/${id}`);
    return transformBarinmaResponse(response);
  },

  getActiveByMotorbot: async (motorbotId: number) => {
    const response = await apiClient.get<BarinmaContractResponse | null>(`/barinma/motorbot/${motorbotId}/active`);
    return response ? transformBarinmaResponse(response) : null;
  },

  create: async (data: BarinmaContractCreate) => {
    const response = await apiClient.post<BarinmaContractResponse>("/barinma/", data);
    return transformBarinmaResponse(response);
  },

  update: async (id: number, data: BarinmaContractUpdate) => {
    const response = await apiClient.put<BarinmaContractResponse>(`/barinma/${id}`, data);
    return transformBarinmaResponse(response);
  },

  delete: async (id: number) => {
    return await apiClient.delete(`/barinma/${id}`);
  },
};
