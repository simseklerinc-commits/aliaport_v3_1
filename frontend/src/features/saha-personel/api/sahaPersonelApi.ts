/**
 * SAHA PERSONEL API - Backend communication layer
 * Base URL: /api/worklog
 */

import { apiClient } from '../../../core/api/apiWrapper';
import type { ActiveWorkOrder, WorkOrderSummary } from '../types/saha.types';
import type { WorkOrderPerson } from '../../isemri/types/workOrderPerson.types';

const BASE_URL = '/api/worklog';

export const sahaPersonelApi = {
  // Get active work orders (APPROVED, IN_PROGRESS, COMPLETED)
  getActiveWorkOrders: async (): Promise<ActiveWorkOrder[]> => {
    try {
      return await apiClient.get(`${BASE_URL}/active-work-orders`);
    } catch (error) {
      console.error('sahaPersonelApi.getActiveWorkOrders error:', error);
      throw error;
    }
  },

  // Get persons for a work order
  getWorkOrderPersons: async (workOrderId: number): Promise<WorkOrderPerson[]> => {
    try {
      return await apiClient.get(`${BASE_URL}/work-order/${workOrderId}/persons`);
    } catch (error) {
      console.error('sahaPersonelApi.getWorkOrderPersons error:', error);
      throw error;
    }
  },

  // Get my work orders (by personnel_name)
  getMyWorkOrders: async (personnelName: string): Promise<ActiveWorkOrder[]> => {
    try {
      const url = `${BASE_URL}/my-work-orders?personnel_name=${encodeURIComponent(personnelName)}`;
      return await apiClient.get(url);
    } catch (error) {
      console.error('sahaPersonelApi.getMyWorkOrders error:', error);
      throw error;
    }
  },

  // Get work order summary
  getWorkOrderSummary: async (workOrderId: number): Promise<WorkOrderSummary> => {
    try {
      return await apiClient.get(`${BASE_URL}/work-order/${workOrderId}/summary`);
    } catch (error) {
      console.error('sahaPersonelApi.getWorkOrderSummary error:', error);
      throw error;
    }
  },
};
