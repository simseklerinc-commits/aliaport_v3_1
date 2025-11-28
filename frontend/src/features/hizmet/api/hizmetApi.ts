/**
 * HIZMET MODULE - API Layer
 */

import type { Hizmet, HizmetCreate, HizmetUpdate, PriceCalculationRequest, PriceCalculationResponse } from '../types/hizmet.types';

const BASE_URL = '/api/hizmet';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export const hizmetApi = {
  /**
   * Tüm hizmet kayıtlarını getir
   */
  getAll: async (): Promise<Hizmet[]> => {
    try {
      const response = await fetch(`${BASE_URL}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse<Hizmet[]> = await response.json();
      return Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching hizmet list:', error);
      throw error;
    }
  },

  /**
   * ID'ye göre hizmet getir
   */
  getById: async (id: number): Promise<Hizmet> => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse<Hizmet> = await response.json();
      return result.data || result;
    } catch (error) {
      console.error(`Error fetching hizmet ${id}:`, error);
      throw error;
    }
  },

  /**
   * Hizmet koduna göre hizmet getir
   */
  getByKod: async (kod: string): Promise<Hizmet> => {
    try {
      const response = await fetch(`${BASE_URL}/kod/${kod}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse<Hizmet> = await response.json();
      return result.data || result;
    } catch (error) {
      console.error(`Error fetching hizmet by kod ${kod}:`, error);
      throw error;
    }
  },

  /**
   * Yeni hizmet oluştur
   */
  create: async (data: HizmetCreate): Promise<Hizmet> => {
    try {
      const response = await fetch(`${BASE_URL}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse<Hizmet> = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error creating hizmet:', error);
      throw error;
    }
  },

  /**
   * Hizmet güncelle
   */
  update: async (id: number, data: HizmetUpdate): Promise<Hizmet> => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse<Hizmet> = await response.json();
      return result.data || result;
    } catch (error) {
      console.error(`Error updating hizmet ${id}:`, error);
      throw error;
    }
  },

  /**
   * Hizmet sil
   */
  delete: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error deleting hizmet ${id}:`, error);
      throw error;
    }
  },

  /**
   * Hizmet ara
   */
  search: async (query: string): Promise<Hizmet[]> => {
    try {
      const response = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse<Hizmet[]> = await response.json();
      return Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error searching hizmet:', error);
      throw error;
    }
  },

  /**
   * Otomatik fiyat hesaplama (Pricing Engine)
   */
  calculatePrice: async (data: PriceCalculationRequest): Promise<PriceCalculationResponse> => {
    try {
      const response = await fetch(`${BASE_URL}/calculate-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error calculating price:', error);
      throw error;
    }
  },
};
