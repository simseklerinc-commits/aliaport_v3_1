/**
 * WORK ORDER PERSON API - Backend communication layer
 * Base URL: /api/work-order-person
 */

import { apiClient } from '../../../core/api/apiWrapper';
import type {
  WorkOrderPerson,
  WorkOrderPersonCreate,
  WorkOrderPersonUpdate,
  SecurityApprovalRequest,
  PaginatedWorkOrderPersonResponse,
} from '../types/workOrderPerson.types';

const BASE_URL = '/api/work-order-person';

export const workOrderPersonApi = {
  // Get all work order persons (paginated)
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    work_order_id?: number;
    approved?: boolean;
  }): Promise<PaginatedWorkOrderPersonResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
      if (params?.work_order_id) queryParams.append('work_order_id', params.work_order_id.toString());
      if (params?.approved !== undefined) queryParams.append('approved', params.approved.toString());

      const url = queryParams.toString() ? `${BASE_URL}?${queryParams}` : BASE_URL;
      return await apiClient.get(url);
    } catch (error) {
      console.error('workOrderPersonApi.getAll error:', error);
      throw error;
    }
  },

  // Get work order person by ID
  getById: async (personId: number): Promise<WorkOrderPerson> => {
    try {
      return await apiClient.get(`${BASE_URL}/${personId}`);
    } catch (error) {
      console.error('workOrderPersonApi.getById error:', error);
      throw error;
    }
  },

  // Get persons by work order ID
  getByWorkOrderId: async (workOrderId: number): Promise<WorkOrderPerson[]> => {
    try {
      return await apiClient.get(`${BASE_URL}/wo/${workOrderId}`);
    } catch (error) {
      console.error('workOrderPersonApi.getByWorkOrderId error:', error);
      throw error;
    }
  },

  // Get pending security approval
  getPendingApproval: async (): Promise<WorkOrderPerson[]> => {
    try {
      return await apiClient.get(`${BASE_URL}/pending-approval`);
    } catch (error) {
      console.error('workOrderPersonApi.getPendingApproval error:', error);
      throw error;
    }
  },

  // Create work order person
  create: async (data: WorkOrderPersonCreate): Promise<WorkOrderPerson> => {
    try {
      return await apiClient.post(BASE_URL, data);
    } catch (error) {
      console.error('workOrderPersonApi.create error:', error);
      throw error;
    }
  },

  // Update work order person
  update: async (personId: number, data: WorkOrderPersonUpdate): Promise<WorkOrderPerson> => {
    try {
      return await apiClient.put(`${BASE_URL}/${personId}`, data);
    } catch (error) {
      console.error('workOrderPersonApi.update error:', error);
      throw error;
    }
  },

  // Delete work order person
  delete: async (personId: number): Promise<void> => {
    try {
      return await apiClient.delete(`${BASE_URL}/${personId}`);
    } catch (error) {
      console.error('workOrderPersonApi.delete error:', error);
      throw error;
    }
  },

  // Security approval (PATCH)
  securityApproval: async (personId: number, data: SecurityApprovalRequest): Promise<WorkOrderPerson> => {
    try {
      return await apiClient.patch(`${BASE_URL}/${personId}/security-approval`, data);
    } catch (error) {
      console.error('workOrderPersonApi.securityApproval error:', error);
      throw error;
    }
  },
};
