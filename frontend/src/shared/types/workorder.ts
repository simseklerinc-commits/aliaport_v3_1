/**
 * WorkOrder (İş Emri) Type Definitions
 * Backend source: aliaport_api/modules/isemri/schemas.py
 */

/**
 * WorkOrder Type enum
 */
export type WorkOrderType = 'HIZMET' | 'MOTORBOT' | 'BARINMA' | 'DIGER';

/**
 * WorkOrder Priority enum
 */
export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * WorkOrder Status enum (State Machine)
 */
export type WorkOrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'SAHADA'
  | 'TAMAMLANDI'
  | 'FATURALANDI'
  | 'KAPANDI'
  | 'REJECTED';

/**
 * WorkOrderItem Type enum
 */
export type WorkOrderItemType = 'WORKLOG' | 'RESOURCE' | 'SERVICE';

/**
 * WorkOrder (İş Emri) entity
 */
export interface WorkOrder {
  Id: number;
  WoNumber: string; // Auto-generated WO number
  CariId: number;
  CariCode: string;
  CariTitle: string;
  RequesterUserId?: number;
  RequesterUserName?: string;
  Type: WorkOrderType;
  ServiceCode?: string;
  Action?: string;
  Subject: string;
  Description?: string;
  Priority: WorkOrderPriority;
  PlannedStart?: string; // ISO8601 datetime
  PlannedEnd?: string; // ISO8601 datetime
  ActualStart?: string; // ISO8601 datetime
  ActualEnd?: string; // ISO8601 datetime
  Status: WorkOrderStatus;
  GateRequired: boolean;
  SahaKayitYetkisi: boolean;
  AttachmentsCount: number;
  HasSignature: boolean;
  IsCabatogeTrFlag: boolean;
  ApplyRuleAddons: boolean;
  SecurityExitTime?: string; // ISO8601 datetime
  AttachedLetterApproved: boolean;
  Notes?: string;
  IsActive: boolean;
  CreatedAt: string; // ISO8601 datetime
  CreatedBy?: number;
  CreatedByName?: string;
  UpdatedAt?: string; // ISO8601 datetime
  UpdatedBy?: number;
  UpdatedByName?: string;
}

/**
 * WorkOrder oluşturma payload
 */
export interface CreateWorkOrderPayload {
  CariId: number;
  CariCode: string;
  CariTitle: string;
  RequesterUserId?: number;
  RequesterUserName?: string;
  Type: WorkOrderType;
  ServiceCode?: string;
  Action?: string;
  Subject: string;
  Description?: string;
  Priority?: WorkOrderPriority;
  PlannedStart?: string; // ISO8601 datetime
  PlannedEnd?: string; // ISO8601 datetime
  ActualStart?: string; // ISO8601 datetime
  ActualEnd?: string; // ISO8601 datetime
  Status?: WorkOrderStatus;
  GateRequired?: boolean;
  SahaKayitYetkisi?: boolean;
  AttachmentsCount?: number;
  HasSignature?: boolean;
  IsCabatogeTrFlag?: boolean;
  ApplyRuleAddons?: boolean;
  SecurityExitTime?: string; // ISO8601 datetime
  AttachedLetterApproved?: boolean;
  Notes?: string;
  IsActive?: boolean;
}

/**
 * WorkOrder güncelleme payload (partial)
 */
export interface UpdateWorkOrderPayload {
  CariId?: number;
  CariCode?: string;
  CariTitle?: string;
  RequesterUserId?: number;
  RequesterUserName?: string;
  Type?: WorkOrderType;
  ServiceCode?: string;
  Action?: string;
  Subject?: string;
  Description?: string;
  Priority?: WorkOrderPriority;
  PlannedStart?: string;
  PlannedEnd?: string;
  ActualStart?: string;
  ActualEnd?: string;
  Status?: WorkOrderStatus;
  GateRequired?: boolean;
  SahaKayitYetkisi?: boolean;
  AttachmentsCount?: number;
  HasSignature?: boolean;
  IsCabatogeTrFlag?: boolean;
  ApplyRuleAddons?: boolean;
  SecurityExitTime?: string;
  AttachedLetterApproved?: boolean;
  Notes?: string;
  IsActive?: boolean;
}

/**
 * WorkOrder status change payload
 */
export interface WorkOrderStatusChange {
  Status: WorkOrderStatus;
  Notes?: string;
}

/**
 * WorkOrderItem (İş Emri Kalemi) entity
 */
export interface WorkOrderItem {
  Id: number;
  WorkOrderId: number;
  WoNumber: string;
  ItemType: WorkOrderItemType;
  ResourceCode?: string;
  ResourceName?: string;
  ServiceCode?: string;
  ServiceName?: string;
  StartTime?: string; // ISO8601 datetime
  EndTime?: string; // ISO8601 datetime
  DurationMinutes?: number;
  Quantity: number; // Serialized as number from backend
  Unit: string;
  UnitPrice: number; // Serialized as number from backend
  Currency: string;
  TotalAmount: number; // Serialized as number from backend
  VatRate: number; // Serialized as number from backend
  VatAmount: number; // Serialized as number from backend
  GrandTotal: number; // Serialized as number from backend
  Notes?: string;
  IsInvoiced: boolean;
  InvoiceId?: number;
  CreatedAt: string; // ISO8601 datetime
  CreatedBy?: number;
  CreatedByName?: string;
}

/**
 * WorkOrderItem oluşturma payload
 */
export interface CreateWorkOrderItemPayload {
  WorkOrderId: number;
  WoNumber: string;
  ItemType: WorkOrderItemType;
  ResourceCode?: string;
  ResourceName?: string;
  ServiceCode?: string;
  ServiceName?: string;
  StartTime?: string; // ISO8601 datetime
  EndTime?: string; // ISO8601 datetime
  DurationMinutes?: number;
  Quantity: number;
  Unit: string;
  UnitPrice: number;
  Currency?: string;
  TotalAmount: number;
  VatRate?: number;
  VatAmount: number;
  GrandTotal: number;
  Notes?: string;
  IsInvoiced?: boolean;
  InvoiceId?: number;
}

/**
 * WorkOrderItem güncelleme payload (partial)
 */
export interface UpdateWorkOrderItemPayload {
  ItemType?: WorkOrderItemType;
  ResourceCode?: string;
  ResourceName?: string;
  ServiceCode?: string;
  ServiceName?: string;
  StartTime?: string;
  EndTime?: string;
  DurationMinutes?: number;
  Quantity?: number;
  Unit?: string;
  UnitPrice?: number;
  Currency?: string;
  TotalAmount?: number;
  VatRate?: number;
  VatAmount?: number;
  GrandTotal?: number;
  Notes?: string;
  IsInvoiced?: boolean;
  InvoiceId?: number;
}

/**
 * WorkOrder statistics
 */
export interface WorkOrderStats {
  Total: number;
  ByStatus: Record<WorkOrderStatus, number>;
  ByPriority: Record<WorkOrderPriority, number>;
  ByType: Record<WorkOrderType, number>;
}
