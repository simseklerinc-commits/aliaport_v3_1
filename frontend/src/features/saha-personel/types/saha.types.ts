/**
 * SAHA PERSONEL TYPES
 * Backend source: aliaport_api/modules/saha/router.py
 */

import type { WorkOrderPerson } from '../../isemri/types/workOrderPerson.types';

// Active Work Order (for saha personel)
export interface ActiveWorkOrder {
  Id: number;
  WONumber: string;
  CariCode: string;
  CariTitle: string;
  Subject: string;
  Status: string;
  Priority: string;
  PlannedStart?: string;
  PlannedEnd?: string;
  ActualStart?: string;
  ActualEnd?: string;
  PersonCount?: number;
}

// Work Order Summary (for saha personel)
export interface WorkOrderSummary {
  work_order: ActiveWorkOrder;
  persons: WorkOrderPerson[];
  total_persons: number;
  approved_persons: number;
  pending_persons: number;
  worklogs_count: number;
  total_duration_minutes: number;
}
