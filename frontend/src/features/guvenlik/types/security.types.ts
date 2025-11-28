/**
 * SECURITY GATE LOG TYPES
 * Backend source: aliaport_api/modules/guvenlik/schemas.py
 */

// Vehicle Entry/Exit Types
export interface VehicleEntryRequest {
  work_order_id: number;
  work_order_person_id?: number;
  vehicle_plate: string;
  vehicle_type?: string;
  driver_name?: string;
  notes?: string;
}

export interface VehicleExitRequest {
  work_order_id: number;
  vehicle_plate: string;
}

export interface VehicleExitResponse {
  gate_log: GateLogVehicle;
  duration_minutes: number;
  is_over_base_hours: boolean;
  extra_charge_calculated?: number;
  base_charge_hours: number;
  extra_minutes: number;
}

export interface GateLogVehicle {
  Id: number;
  WorkOrderId: number;
  WorkOrderPersonId?: number;
  VehiclePlate: string;
  VehicleType?: string;
  DriverName?: string;
  EntryTime: string;  // ISO8601 datetime
  ExitTime?: string;  // ISO8601 datetime
  DurationMinutes?: number;
  BaseChargeHours: number;
  ExtraMinutes?: number;
  ExtraChargeCalculated?: number;
  Notes?: string;
  CreatedAt: string;
  UpdatedAt?: string;
}

// Person Identity Types
export interface PersonIdentityUploadRequest {
  work_order_person_id: number;
  identity_document_url: string;
  notes?: string;
}

export interface SecurityApprovalBulkRequest {
  person_ids: number[];
  approved: boolean;
  notes?: string;
}

// Pending Person (for security approval)
export interface PendingPerson {
  Id: number;
  WorkOrderId: number;
  WONumber: string;
  FullName: string;
  TcKimlikNo?: string;
  PassportNo?: string;
  Nationality?: string;
  Phone?: string;
  IdentityDocumentId?: number;
  ApprovedBySecurity: boolean;
  CreatedAt: string;
}

// Active Vehicle
export interface ActiveVehicle {
  Id: number;
  WorkOrderId: number;
  WONumber?: string;
  VehiclePlate: string;
  VehicleType?: string;
  DriverName?: string;
  EntryTime: string;
  DurationMinutes?: number;
  CariTitle?: string;
}
