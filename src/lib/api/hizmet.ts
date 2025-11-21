// HİZMET API - Hizmet Kartı modülü için gerçek API endpoints
// Backend: /api/hizmet/ (FastAPI)

import { apiClient } from './client';

export interface HizmetListParams {
  page?: number;
  page_size?: number;
  is_active?: boolean;
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
  UnitId?: number | null;
  VatRateId?: number | null;
  VatExemptionId?: number | null;
  GroupId?: number | null;
  CategoryId?: number | null;
  PricingRuleId?: number | null;
  MetadataJson?: string;
  SiraNo?: number;
  AktifMi?: boolean;
  CreatedBy?: number | null;
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
  UnitId?: number | null;
  VatRateId?: number | null;
  VatExemptionId?: number | null;
  GroupId?: number | null;
  CategoryId?: number | null;
  PricingRuleId?: number | null;
  MetadataJson?: string;
  SiraNo?: number;
  AktifMi?: boolean;
  UpdatedBy?: number | null;
}

export const hizmetApi = {
  getAll: async (params?: HizmetListParams) => {
    return await apiClient.get("/hizmet/", { params });
  },

  getById: async (id: number) => {
    return await apiClient.get(`/hizmet/${id}`);
  },

  create: async (data: HizmetCreate) => {
    return await apiClient.post("/hizmet/", data);
  },

  update: async (id: number, data: HizmetUpdate) => {
    return await apiClient.put(`/hizmet/${id}`, data);
  },

  delete: async (id: number) => {
    return await apiClient.delete(`/hizmet/${id}`);
  },
};
