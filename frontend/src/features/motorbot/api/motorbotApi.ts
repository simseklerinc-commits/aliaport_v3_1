/**
 * MOTORBOT MODULE - API Layer
 */

import type { Motorbot, MotorbotCreate, MotorbotUpdate } from '../types/motorbot.types';

const BASE_URL = 'http://localhost:8000/api/motorbot';

export const motorbotApi = {
  /**
   * Tüm motorbot kayıtlarını getir
   */
  getAll: async (): Promise<Motorbot[]> => {
    try {
      const response = await fetch(`${BASE_URL}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching motorbot list:', error);
      throw error;
    }
  },

  /**
   * ID'ye göre motorbot getir
   */
  getById: async (id: number): Promise<Motorbot> => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching motorbot ${id}:`, error);
      throw error;
    }
  },

  /**
   * Motorbot koduna göre motorbot getir
   */
  getByKod: async (kod: string): Promise<Motorbot> => {
    try {
      const response = await fetch(`${BASE_URL}/kod/${kod}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching motorbot by kod ${kod}:`, error);
      throw error;
    }
  },

  /**
   * Yeni motorbot oluştur
   */
  create: async (data: MotorbotCreate): Promise<Motorbot> => {
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
      return await response.json();
    } catch (error) {
      console.error('Error creating motorbot:', error);
      throw error;
    }
  },

  /**
   * Motorbot güncelle
   */
  update: async (id: number, data: MotorbotUpdate): Promise<Motorbot> => {
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
      return await response.json();
    } catch (error) {
      console.error(`Error updating motorbot ${id}:`, error);
      throw error;
    }
  },

  /**
   * Motorbot sil
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
      console.error(`Error deleting motorbot ${id}:`, error);
      throw error;
    }
  },

  /**
   * Motorbot ara (ad veya koda göre)
   */
  search: async (query: string): Promise<Motorbot[]> => {
    try {
      const response = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error searching motorbot:', error);
      throw error;
    }
  },
};
