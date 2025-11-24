/**
 * CARI MODULE - API Layer
 * Backend API ile iletişim
 */

import type { Cari, CariCreate, CariUpdate } from '../types/cari.types';

const API_BASE_URL = '/api/cari';

/**
 * API yanıtları için generic tip
 */
interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    page_size: number;
    total: number;
  };
}

/**
 * Cari API fonksiyonları
 */
export const cariApi = {
  /**
   * Tüm cari kayıtlarını getir
   */
  getAll: async (page: number = 1, pageSize: number = 1000): Promise<Cari[]> => {
    const response = await fetch(`${API_BASE_URL}/?page=${page}&page_size=${pageSize}`, { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<Cari[]> = await response.json();
    return Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
  },

  /**
   * ID'ye göre cari getir
   */
  getById: async (id: number): Promise<Cari> => {
    const response = await fetch(`${API_BASE_URL}/${id}`, { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<Cari> = await response.json();
    return result.data || result;
  },

  /**
   * Kod'a göre cari getir
   */
  getByKod: async (kod: string): Promise<Cari> => {
    const response = await fetch(`${API_BASE_URL}/kod/${kod}`, { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<Cari> = await response.json();
    return result.data || result;
  },

  /**
   * Yeni cari oluştur
   */
  create: async (data: CariCreate): Promise<Cari> => {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<Cari> = await response.json();
    return result.data || result;
  },

  /**
   * Cari güncelle
   */
  update: async (id: number, data: CariUpdate): Promise<Cari> => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<Cari> = await response.json();
    return result.data || result;
  },

  /**
   * Cari sil
   */
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },

  /**
   * Arama yap
   */
  search: async (query: string): Promise<Cari[]> => {
    const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`, { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<Cari[]> = await response.json();
    return Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
  },
};
