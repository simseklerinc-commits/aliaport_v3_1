// Parametreler API - Backend communication layer
// Base URL: http://localhost:8000/api/parametre/

import type { Parametre, ParametreCreate, ParametreUpdate, PaginatedParametreResponse } from '../types/parametreler.types';

const BASE_URL = '/api/parametre';  // Use relative path for proxy

export const parametrelerApi = {
  // Get all parameters (paginated)
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    kategori?: string;
    aktif?: boolean;
    search?: string;
  }): Promise<PaginatedParametreResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
      if (params?.kategori) queryParams.append('kategori', params.kategori);
      if (params?.aktif !== undefined) queryParams.append('aktif', params.aktif.toString());
      if (params?.search) queryParams.append('search', params.search);

      const url = queryParams.toString() ? `${BASE_URL}?${queryParams}` : BASE_URL;
      const response = await fetch(url, { 
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch parameters`);
      const json = await response.json();
      
      // Backend'den gelen response'u normalize et
      return {
        items: json.data || [],
        pagination: json.pagination,
        message: json.message
      };
    } catch (error) {
      console.error('parametrelerApi.getAll error:', error);
      throw error;
    }
  },

  // Get parameter by ID
  getById: async (id: number): Promise<Parametre> => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, { credentials: 'include' });
      if (!response.ok) throw new Error(`Failed to fetch parameter ${id}`);
      const json = await response.json();
      return json.data || json;
    } catch (error) {
      console.error('parametrelerApi.getById error:', error);
      throw error;
    }
  },

  // Get parameters by category
  getByCategory: async (kategori: string, includeInactive = false): Promise<Parametre[]> => {
    try {
      const params = new URLSearchParams();
      if (includeInactive) params.append('include_inactive', 'true');
      
      const url = params.toString() 
        ? `${BASE_URL}/by-kategori/${kategori}?${params}`
        : `${BASE_URL}/by-kategori/${kategori}`;
      
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error(`Failed to fetch parameters for category ${kategori}`);
      const json = await response.json();
      // Backend'den gelen response'un data alanını döndür
      return json.data || [];
    } catch (error) {
      console.error('parametrelerApi.getByCategory error:', error);
      throw error;
    }
  },

  // Create new parameter
  create: async (data: ParametreCreate): Promise<Parametre> => {
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to create parameter');
      const json = await response.json();
      return json.data || json;
    } catch (error) {
      console.error('parametrelerApi.create error:', error);
      throw error;
    }
  },

  // Update parameter
  update: async (id: number, data: ParametreUpdate): Promise<Parametre> => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Failed to update parameter ${id}`);
      const json = await response.json();
      return json.data || json;
    } catch (error) {
      console.error('parametrelerApi.update error:', error);
      throw error;
    }
  },

  // Delete parameter
  delete: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Failed to delete parameter ${id}`);
    } catch (error) {
      console.error('parametrelerApi.delete error:', error);
      throw error;
    }
  },

  // Toggle active status
  toggleActive: async (id: number): Promise<Parametre> => {
    try {
      const response = await fetch(`${BASE_URL}/${id}/toggle-active`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Failed to toggle parameter ${id}`);
      const json = await response.json();
      return json.data || json;
    } catch (error) {
      console.error('parametrelerApi.toggleActive error:', error);
      throw error;
    }
  },

  // Search parameters
  search: async (query: string): Promise<Parametre[]> => {
    try {
      const response = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to search parameters');
      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.error('parametrelerApi.search error:', error);
      throw error;
    }
  },
};
