// PARAMETRE API - Parametreler modülü için gerçek API endpoints
// Backend: /api/parametre/ (FastAPI)

import { apiClient } from './client';

export interface ParametreListParams {
  page?: number;
  page_size?: number;
  kategori?: string;
  aktif?: boolean;
}

export interface Parametre {
  Id: number;
  Kategori: string;
  Kod: string;
  Ad: string;
  Deger?: string;
  Aciklama?: string;
  AktifMi: boolean;
  CreatedAt: string;
  UpdatedAt?: string;
}

export interface ParametreCreate {
  Kategori: string;
  Kod: string;
  Ad: string;
  Deger?: string;
  Aciklama?: string;
  AktifMi?: boolean;
}

export interface ParametreUpdate {
  Kategori?: string;
  Kod?: string;
  Ad?: string;
  Deger?: string;
  Aciklama?: string;
  AktifMi?: boolean;
}

export interface PaginatedParametreResponse {
  items: Parametre[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const parametreApi = {
  getAll: async (params?: ParametreListParams): Promise<PaginatedParametreResponse> => {
    return await apiClient.get("/parametre/", { params });
  },

  getById: async (id: number): Promise<Parametre> => {
    return await apiClient.get(`/parametre/${id}`);
  },

  getByCategory: async (kategori: string): Promise<Parametre[]> => {
    return await apiClient.get(`/parametre/by-kategori/${kategori}`);
  },

  create: async (data: ParametreCreate): Promise<Parametre> => {
    return await apiClient.post("/parametre/", data);
  },

  update: async (id: number, data: ParametreUpdate): Promise<Parametre> => {
    return await apiClient.put(`/parametre/${id}`, data);
  },

  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    return await apiClient.delete(`/parametre/${id}`);
  },
};

// Kategori sabitleri
export const PARAMETRE_KATEGORILER = {
  BIRIM: 'BIRIM',
  KDV: 'KDV',
  ESIK: 'ESIK',
  GENEL: 'GENEL',
} as const;
