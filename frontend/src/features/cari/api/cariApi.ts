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
  data?: T;
  error?: string;
}

/**
 * Cari API fonksiyonları
 */
export const cariApi = {
  /**
   * Tüm cari kayıtlarını getir
   */
  getAll: async (): Promise<Cari[]> => {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  /**
   * ID'ye göre cari getir
   */
  getById: async (id: number): Promise<Cari> => {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Kod'a göre cari getir
   */
  getByKod: async (kod: string): Promise<Cari> => {
    const response = await fetch(`${API_BASE_URL}/kod/${kod}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Yeni cari oluştur
   */
  create: async (data: CariCreate): Promise<Cari> => {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Cari güncelle
   */
  update: async (id: number, data: CariUpdate): Promise<Cari> => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Cari sil
   */
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },

  /**
   * Arama yap
   */
  search: async (query: string): Promise<Cari[]> => {
    const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
};
