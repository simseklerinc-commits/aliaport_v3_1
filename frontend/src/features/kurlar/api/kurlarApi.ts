// Kurlar API - Backend communication layer
// Base URL: Uses Vite proxy (/api) → http://localhost:8000/api/exchange-rate

import type { ExchangeRate, ExchangeRateCreate, ExchangeRateUpdate, PaginatedExchangeRateResponse, ConversionResult } from '../types/kurlar.types';

const BASE_URL = '/api/exchange-rate';  // Vite proxy handles backend routing

export const kurlarApi = {
  // Get all exchange rates (paginated)
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    currency_from?: string;
    currency_to?: string;
    rate_date?: string;
  }): Promise<PaginatedExchangeRateResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
      if (params?.currency_from) queryParams.append('currency_from', params.currency_from);
      if (params?.currency_to) queryParams.append('currency_to', params.currency_to);
      if (params?.rate_date) queryParams.append('rate_date', params.rate_date);

      const url = queryParams.toString() ? `${BASE_URL}?${queryParams}` : BASE_URL;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch exchange rates');
      return await response.json();
    } catch (error) {
      console.error('kurlarApi.getAll error:', error);
      throw error;
    }
  },

  // Get exchange rate by ID
  getById: async (id: number): Promise<ExchangeRate> => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`);
      if (!response.ok) throw new Error(`Failed to fetch exchange rate ${id}`);
      return await response.json();
    } catch (error) {
      console.error('kurlarApi.getById error:', error);
      throw error;
    }
  },

  // Get latest rate for currency pair
  getLatest: async (from: string, to: string): Promise<ExchangeRate> => {
    try {
      const response = await fetch(`${BASE_URL}/latest/${from}/${to}`);
      if (!response.ok) throw new Error(`Failed to fetch latest rate ${from}/${to}`);
      return await response.json();
    } catch (error) {
      console.error('kurlarApi.getLatest error:', error);
      throw error;
    }
  },

  // Get rates for specific date
  getByDate: async (from: string, to: string, date: string): Promise<ExchangeRate> => {
    try {
      const response = await fetch(`${BASE_URL}/date/${from}/${to}/${date}`);
      if (!response.ok) throw new Error(`Failed to fetch rate for ${date}`);
      return await response.json();
    } catch (error) {
      console.error('kurlarApi.getByDate error:', error);
      throw error;
    }
  },

  // Get today's rates (with auto-fallback for weekends/holidays)
  getToday: async (): Promise<ExchangeRate[]> => {
    try {
      const response = await fetch(`${BASE_URL}/today`);
      if (!response.ok) throw new Error('Failed to fetch today rates');
      
      // Backend response includes metadata: { data, metadata: { used_rate_date, is_fallback } }
      const result = await response.json();
      
      // Extract rates from success_response wrapper
      return result.data || result;
    } catch (error) {
      console.error('kurlarApi.getToday error:', error);
      throw error;
    }
  },

  // Convert currency (with auto-fallback for weekends/holidays)
  convert: async (amount: number, from: string, to: string, date?: string): Promise<ConversionResult> => {
    try {
      const params = new URLSearchParams({
        amount: amount.toString(),
        from,
        to,
      });
      if (date) params.append('date', date);

      const response = await fetch(`${BASE_URL}/convert?${params}`);
      if (!response.ok) throw new Error('Failed to convert currency');
      
      // Backend response: { data: { amount, from, to, rate, converted_amount, used_rate_date, is_fallback } }
      const result = await response.json();
      
      return result.data || result;
    } catch (error) {
      console.error('kurlarApi.convert error:', error);
      throw error;
    }
  },

  // Create new rate
  create: async (data: ExchangeRateCreate): Promise<ExchangeRate> => {
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create exchange rate');
      return await response.json();
    } catch (error) {
      console.error('kurlarApi.create error:', error);
      throw error;
    }
  },

  // Update rate
  update: async (id: number, data: ExchangeRateUpdate): Promise<ExchangeRate> => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Failed to update exchange rate ${id}`);
      return await response.json();
    } catch (error) {
      console.error('kurlarApi.update error:', error);
      throw error;
    }
  },

  // Delete rate
  delete: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`Failed to delete exchange rate ${id}`);
    } catch (error) {
      console.error('kurlarApi.delete error:', error);
      throw error;
    }
  },

  // Fetch TCMB rates
  fetchTCMB: async (date?: string): Promise<ExchangeRate[]> => {
    try {
      const body = date ? JSON.stringify({ date }) : JSON.stringify({});
      const response = await fetch(`${BASE_URL}/fetch-tcmb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (!response.ok) throw new Error('Failed to fetch TCMB rates');
      return await response.json();
    } catch (error) {
      console.error('kurlarApi.fetchTCMB error:', error);
      throw error;
    }
  },
};
