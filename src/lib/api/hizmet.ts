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
  GrupKod?: string;
  Birim?: string;
  Fiyat?: number;
  ParaBirimi?: string;
  KdvOrani?: number;
  SiraNo?: number;
  AktifMi?: boolean;
}

export interface HizmetUpdate {
  Kod?: string;
  Ad?: string;
  GrupKod?: string;
  Birim?: string;
  Fiyat?: number;
  ParaBirimi?: string;
  KdvOrani?: number;
  SiraNo?: number;
  AktifMi?: boolean;
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

