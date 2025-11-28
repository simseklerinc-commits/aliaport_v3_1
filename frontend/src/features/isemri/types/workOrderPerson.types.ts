/**
 * WORK ORDER PERSON TYPES
 * Backend source: aliaport_api/modules/isemri/schemas.py (WorkOrderPersonBase, WorkOrderPersonCreate, etc.)
 */

// WorkOrderPerson Interface
export interface WorkOrderPerson {
  Id: number;
  WorkOrderId: number;
  WorkOrderItemId?: number;
  FullName: string;
  TcKimlikNo?: string;
  PassportNo?: string;
  Nationality?: string;
  Phone?: string;
  IdentityDocumentId?: number;
  ApprovedBySecurity: boolean;
  ApprovedBySecurityUserId?: number;
  GateEntryTime?: string;  // ISO8601 datetime
  GateExitTime?: string;  // ISO8601 datetime
  IsActive: boolean;
  CreatedAt: string;  // ISO8601 datetime
  UpdatedAt?: string;  // ISO8601 datetime
  CreatedBy?: number;
  UpdatedBy?: number;
  CreatedByName?: string;
  UpdatedByName?: string;
  ApprovedBySecurityName?: string;
  WONumber?: string;
}

// Create/Update DTOs
export interface WorkOrderPersonCreate {
  WorkOrderId: number;
  WorkOrderItemId?: number;
  FullName: string;
  TcKimlikNo?: string;
  PassportNo?: string;
  Nationality?: string;
  Phone?: string;
  IdentityDocumentId?: number;
}

export interface WorkOrderPersonUpdate {
  FullName?: string;
  TcKimlikNo?: string;
  PassportNo?: string;
  Nationality?: string;
  Phone?: string;
  IdentityDocumentId?: number;
}

// Security Approval Request
export interface SecurityApprovalRequest {
  approved: boolean;
  notes?: string;
}

// Paginated Response
export interface PaginatedWorkOrderPersonResponse {
  items: WorkOrderPerson[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
