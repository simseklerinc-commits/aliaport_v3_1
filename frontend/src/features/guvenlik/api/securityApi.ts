/**
 * SECURITY API - Backend communication layer
 * Base URL: /api/gatelog
 */

import { apiClient } from '../../../core/api/apiWrapper';
import type {
  VehicleEntryRequest,
  VehicleExitRequest,
  VehicleExitResponse,
  GateLogVehicle,
  PersonIdentityUploadRequest,
  SecurityApprovalBulkRequest,
  PendingPerson,
  ActiveVehicle,
} from '../types/security.types';

const BASE_URL = '/api/gatelog';

export const securityApi = {
  // ============ VEHICLE ENTRY/EXIT ENDPOINTS ============

  // Vehicle entry (start 4-hour rule timer)
  vehicleEntry: async (data: VehicleEntryRequest): Promise<GateLogVehicle> => {
    try {
      return await apiClient.post(`${BASE_URL}/vehicle/entry`, data);
    } catch (error) {
      console.error('securityApi.vehicleEntry error:', error);
      throw error;
    }
  },

  // Vehicle exit (calculate 4-hour rule)
  vehicleExit: async (data: VehicleExitRequest): Promise<VehicleExitResponse> => {
    try {
      return await apiClient.post(`${BASE_URL}/vehicle/exit`, data);
    } catch (error) {
      console.error('securityApi.vehicleExit error:', error);
      throw error;
    }
  },

  // Get active vehicles (not yet exited)
  getActiveVehicles: async (workOrderId?: number): Promise<ActiveVehicle[]> => {
    try {
      const url = workOrderId 
        ? `${BASE_URL}/vehicle/active?work_order_id=${workOrderId}`
        : `${BASE_URL}/vehicle/active`;
      return await apiClient.get(url);
    } catch (error) {
      console.error('securityApi.getActiveVehicles error:', error);
      throw error;
    }
  },

  // ============ PERSON SECURITY APPROVAL ENDPOINTS ============

  // Get pending persons (awaiting security approval)
  getPendingPersons: async (workOrderId?: number): Promise<PendingPerson[]> => {
    try {
      const url = workOrderId 
        ? `${BASE_URL}/pending-persons?work_order_id=${workOrderId}`
        : `${BASE_URL}/pending-persons`;
      return await apiClient.get(url);
    } catch (error) {
      console.error('securityApi.getPendingPersons error:', error);
      throw error;
    }
  },

  // Upload identity document
  uploadIdentityDocument: async (data: PersonIdentityUploadRequest): Promise<{ message: string }> => {
    try {
      return await apiClient.post(`${BASE_URL}/person/identity-upload`, data);
    } catch (error) {
      console.error('securityApi.uploadIdentityDocument error:', error);
      throw error;
    }
  },

  // Bulk security approval
  bulkApproval: async (data: SecurityApprovalBulkRequest): Promise<{ message: string; approved_count: number }> => {
    try {
      return await apiClient.post(`${BASE_URL}/person/bulk-approval`, data);
    } catch (error) {
      console.error('securityApi.bulkApproval error:', error);
      throw error;
    }
  },
};
