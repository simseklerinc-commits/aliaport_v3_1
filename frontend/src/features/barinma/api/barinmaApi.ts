// Barınma API - Backend communication layer
// Base URL: http://localhost:8000/api/barinma

import type { BarinmaContract, BarinmaContractCreate, BarinmaContractUpdate } from '../types/barinma.types';

const BASE_URL = 'http://localhost:8000/api/barinma';

export const barinmaApi = {
  // Get all contracts
  getAll: async (): Promise<BarinmaContract[]> => {
    try {
      const response = await fetch(BASE_URL);
      if (!response.ok) throw new Error('Failed to fetch contracts');
      return await response.json();
    } catch (error) {
      console.error('barinmaApi.getAll error:', error);
      throw error;
    }
  },

  // Get contract by ID
  getById: async (id: number): Promise<BarinmaContract> => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`);
      if (!response.ok) throw new Error(`Failed to fetch contract ${id}`);
      return await response.json();
    } catch (error) {
      console.error('barinmaApi.getById error:', error);
      throw error;
    }
  },

  // Get active contract by motorbot
  getByMotorbot: async (motorbotId: number): Promise<BarinmaContract | null> => {
    try {
      const response = await fetch(`${BASE_URL}/motorbot/${motorbotId}/active`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Failed to fetch contract for motorbot ${motorbotId}`);
      return await response.json();
    } catch (error) {
      console.error('barinmaApi.getByMotorbot error:', error);
      throw error;
    }
  },

  // Create new contract
  create: async (data: BarinmaContractCreate): Promise<BarinmaContract> => {
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create contract');
      return await response.json();
    } catch (error) {
      console.error('barinmaApi.create error:', error);
      throw error;
    }
  },

  // Update contract
  update: async (id: number, data: BarinmaContractUpdate): Promise<BarinmaContract> => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Failed to update contract ${id}`);
      return await response.json();
    } catch (error) {
      console.error('barinmaApi.update error:', error);
      throw error;
    }
  },

  // Delete contract
  delete: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`Failed to delete contract ${id}`);
    } catch (error) {
      console.error('barinmaApi.delete error:', error);
      throw error;
    }
  },

  // Search contracts
  search: async (query: string): Promise<BarinmaContract[]> => {
    try {
      const response = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search contracts');
      return await response.json();
    } catch (error) {
      console.error('barinmaApi.search error:', error);
      throw error;
    }
  },
};
