// Tarife API - Backend communication layer
// Base URL: http://localhost:8000/api/price-list

import type { PriceList, PriceListCreate, PriceListUpdate } from '../types/tarife.types';

const BASE_URL = '/api/price-list';

export const tarifeApi = {
  // Get all price lists
  getAll: async (): Promise<PriceList[]> => {
    try {
      const response = await fetch(`${BASE_URL}?page_size=200`);
      if (!response.ok) throw new Error('Failed to fetch price lists');
      const data = await response.json();
      // Backend returns paginated response: { items, total, page, page_size, total_pages }
      return data.items || [];
    } catch (error) {
      console.error('tarifeApi.getAll error:', error);
      throw error;
    }
  },

  // Get price list by ID
  getById: async (id: number): Promise<PriceList> => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`);
      if (!response.ok) throw new Error(`Failed to fetch price list ${id}`);
      return await response.json();
    } catch (error) {
      console.error('tarifeApi.getById error:', error);
      throw error;
    }
  },

  // Get price list by Kod
  getByKod: async (kod: string): Promise<PriceList> => {
    try {
      const response = await fetch(`${BASE_URL}/kod/${kod}`);
      if (!response.ok) throw new Error(`Failed to fetch price list ${kod}`);
      return await response.json();
    } catch (error) {
      console.error('tarifeApi.getByKod error:', error);
      throw error;
    }
  },

  // Create new price list
  create: async (data: PriceListCreate): Promise<PriceList> => {
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create price list');
      return await response.json();
    } catch (error) {
      console.error('tarifeApi.create error:', error);
      throw error;
    }
  },

  // Update price list
  update: async (id: number, data: PriceListUpdate): Promise<PriceList> => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Failed to update price list ${id}`);
      return await response.json();
    } catch (error) {
      console.error('tarifeApi.update error:', error);
      throw error;
    }
  },

  // Delete price list
  delete: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`Failed to delete price list ${id}`);
    } catch (error) {
      console.error('tarifeApi.delete error:', error);
      throw error;
    }
  },

  // Search price lists
  search: async (query: string): Promise<PriceList[]> => {
    try {
      const response = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search price lists');
      return await response.json();
    } catch (error) {
      console.error('tarifeApi.search error:', error);
      throw error;
    }
  },
};
