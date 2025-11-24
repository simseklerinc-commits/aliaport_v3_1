/**
 * İŞ EMRİ API - Backend communication layer
 * Base URL: /api/work-order
 */

import { apiClient } from '../../../core/api/apiWrapper';
import type {
  WorkOrder,
  WorkOrderCreate,
  WorkOrderUpdate,
  WorkOrderItem,
  WorkOrderItemCreate,
  WorkOrderItemUpdate,
  WorkOrderStats,
  PaginatedWorkOrderResponse,
} from '../types/isemri.types';

const BASE_URL = '/api/work-order';

export const isemriApi = {
  // ============ WORK ORDER ENDPOINTS ============

  // Get all work orders (paginated)
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    type?: string;
    cari_code?: string;
  }): Promise<PaginatedWorkOrderResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.cari_code) queryParams.append('cari_code', params.cari_code);

      const url = queryParams.toString() ? `${BASE_URL}?${queryParams}` : BASE_URL;
      return await apiClient.get(url);
    } catch (error) {
      console.error('isemriApi.getAll error:', error);
      throw error;
    }
  },

  // Get work order by ID
  getById: async (id: number): Promise<WorkOrder> => {
    try {
      return await apiClient.get(`${BASE_URL}/${id}`);
    } catch (error) {
      console.error('isemriApi.getById error:', error);
      throw error;
    }
  },

  // Get work order by WO Number
  getByNumber: async (woNumber: string): Promise<WorkOrder> => {
    try {
      return await apiClient.get(`${BASE_URL}/number/${woNumber}`);
    } catch (error) {
      console.error('isemriApi.getByNumber error:', error);
      throw error;
    }
  },

  // Get work orders by Cari Code
  getByCariCode: async (cariCode: string): Promise<WorkOrder[]> => {
    try {
      return await apiClient.get(`${BASE_URL}/cari/${cariCode}`);
    } catch (error) {
      console.error('isemriApi.getByCariCode error:', error);
      throw error;
    }
  },

  // Create work order
  create: async (data: WorkOrderCreate): Promise<WorkOrder> => {
    try {
      return await apiClient.post(BASE_URL, data);
    } catch (error) {
      console.error('isemriApi.create error:', error);
      throw error;
    }
  },

  // Update work order
  update: async (id: number, data: WorkOrderUpdate): Promise<WorkOrder> => {
    try {
      return await apiClient.put(`${BASE_URL}/${id}`, data);
    } catch (error) {
      console.error('isemriApi.update error:', error);
      throw error;
    }
  },

  // Delete work order
  delete: async (id: number): Promise<void> => {
    try {
      return await apiClient.delete(`${BASE_URL}/${id}`);
    } catch (error) {
      console.error('isemriApi.delete error:', error);
      throw error;
    }
  },

  // Get stats
  getStats: async (): Promise<WorkOrderStats> => {
    try {
      return await apiClient.get(`${BASE_URL}/stats`);
    } catch (error) {
      console.error('isemriApi.getStats error:', error);
      throw error;
    }
  },

  // ============ WORK ORDER ITEM ENDPOINTS ============

  // Get items by work order ID
  getItemsByWorkOrderId: async (workOrderId: number): Promise<WorkOrderItem[]> => {
    try {
      return await apiClient.get(`${BASE_URL}-item/wo/${workOrderId}`);
    } catch (error) {
      console.error('isemriApi.getItemsByWorkOrderId error:', error);
      throw error;
    }
  },

  // Get work order item by ID
  getItemById: async (itemId: number): Promise<WorkOrderItem> => {
    try {
      return await apiClient.get(`${BASE_URL}-item/${itemId}`);
    } catch (error) {
      console.error('isemriApi.getItemById error:', error);
      throw error;
    }
  },

  // Create work order item
  createItem: async (data: WorkOrderItemCreate): Promise<WorkOrderItem> => {
    try {
      return await apiClient.post(`${BASE_URL}-item`, data);
    } catch (error) {
      console.error('isemriApi.createItem error:', error);
      throw error;
    }
  },

  // Update work order item
  updateItem: async (itemId: number, data: WorkOrderItemUpdate): Promise<WorkOrderItem> => {
    try {
      return await apiClient.put(`${BASE_URL}-item/${itemId}`, data);
    } catch (error) {
      console.error('isemriApi.updateItem error:', error);
      throw error;
    }
  },

  // Delete work order item
  deleteItem: async (itemId: number): Promise<void> => {
    try {
      return await apiClient.delete(`${BASE_URL}-item/${itemId}`);
    } catch (error) {
      console.error('isemriApi.deleteItem error:', error);
      throw error;
    }
  },

  // Get worklogs for work order
  getWorklogs: async (workOrderId: number): Promise<WorkOrderItem[]> => {
    try {
      return await apiClient.get(`${BASE_URL}-item/wo/${workOrderId}/worklogs`);
    } catch (error) {
      console.error('isemriApi.getWorklogs error:', error);
      throw error;
    }
  },

  // Get uninvoiced items
  getUninvoicedItems: async (): Promise<WorkOrderItem[]> => {
    try {
      return await apiClient.get(`${BASE_URL}-item/uninvoiced`);
    } catch (error) {
      console.error('isemriApi.getUninvoicedItems error:', error);
      throw error;
    }
  },
};
