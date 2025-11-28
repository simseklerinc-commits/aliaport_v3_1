/**
 * İŞ EMRİ (WORK ORDER) TYPES
 * Backend source: aliaport_api/modules/isemri/schemas.py
 */

// Enums
export enum WorkOrderType {
  HIZMET = 'HIZMET',
  MOTORBOT = 'MOTORBOT',
  BARINMA = 'BARINMA',
  DIGER = 'DIGER',
}

export enum WorkOrderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum WorkOrderStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  SAHADA = 'SAHADA',
  TAMAMLANDI = 'TAMAMLANDI',
  FATURALANDI = 'FATURALANDI',
  KAPANDI = 'KAPANDI',
  REJECTED = 'REJECTED',
}

export enum WorkOrderItemType {
  WORKLOG = 'WORKLOG',
  RESOURCE = 'RESOURCE',
  SERVICE = 'SERVICE',
}

// WorkOrder Interface
export interface WorkOrder {
  Id: number;
  WONumber: string;  // Auto-generated WO number
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
  PlannedStart?: string;  // ISO8601 datetime
  PlannedEnd?: string;  // ISO8601 datetime
  ActualStart?: string;  // ISO8601 datetime
  ActualEnd?: string;  // ISO8601 datetime
  Status: WorkOrderStatus;
  GateRequired: boolean;
  SahaKayitYetkisi: boolean;
  AttachmentsCount: number;
  HasSignature: boolean;
  IsCabatogeTrFlag: boolean;
  ApplyRuleAddons: boolean;
  SecurityExitTime?: string;  // ISO8601 datetime
  AttachedLetterApproved: boolean;
  Notes?: string;
  IsActive: boolean;
  CreatedAt: string;  // ISO8601 datetime
  UpdatedAt?: string;  // ISO8601 datetime
  CreatedBy?: number;
  UpdatedBy?: number;
  CreatedByName?: string;
  UpdatedByName?: string;
}

// WorkOrderItem Interface
export interface WorkOrderItem {
  Id: number;
  WorkOrderId: number;
  WONumber: string;
  ItemType: WorkOrderItemType;
  HizmetId?: number;
  HizmetKod?: string;
  HizmetAd?: string;
  ResourceCode?: string;
  ResourceName?: string;
  ServiceCode?: string;
  ServiceName?: string;
  StartTime?: string;  // ISO8601 datetime
  EndTime?: string;  // ISO8601 datetime
  DurationMinutes?: number;
  Quantity: number;
  Unit: string;
  UnitPrice: number;
  Currency: string;
  TotalPrice: number;
  TotalAmount: number;
  VatRate: number;
  VatAmount: number;
  GrandTotal: number;
  WorklogText?: string;
  ResourceDescription?: string;
  Notes?: string;
  IsActive: boolean;
  IsInvoiced: boolean;
  InvoiceId?: number;
  CreatedAt: string;  // ISO8601 datetime
  UpdatedAt?: string;  // ISO8601 datetime
  CreatedBy?: number;
  UpdatedBy?: number;
  CreatedByName?: string;
  UpdatedByName?: string;
}

// Create/Update DTOs
export interface WorkOrderCreate {
  CariId: number;
  CariCode: string;
  CariTitle: string;
  RequesterUserId?: number;
  RequesterUserName?: string;
  Type: WorkOrderType | string;
  ServiceCode?: string;
  Action?: string;
  Subject: string;
  Description?: string;
  Priority: WorkOrderPriority | string;
  PlannedStart?: string;
  PlannedEnd?: string;
  ActualStart?: string;
  ActualEnd?: string;
  Status?: WorkOrderStatus | string;
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

export interface WorkOrderUpdate {
  CariId?: number;
  CariCode?: string;
  CariTitle?: string;
  RequesterUserId?: number;
  RequesterUserName?: string;
  Type?: WorkOrderType | string;
  ServiceCode?: string;
  Action?: string;
  Subject?: string;
  Description?: string;
  Priority?: WorkOrderPriority | string;
  PlannedStart?: string;
  PlannedEnd?: string;
  ActualStart?: string;
  ActualEnd?: string;
  Status?: WorkOrderStatus | string;
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

export interface WorkOrderItemCreate {
  WorkOrderId: number;
  WONumber: string;
  ItemType: WorkOrderItemType | string;
  HizmetId?: number;
  HizmetKod?: string;
  HizmetAd?: string;
  ResourceCode?: string;
  ResourceName?: string;
  ServiceCode?: string;
  ServiceName?: string;
  StartTime?: string;
  EndTime?: string;
  DurationMinutes?: number;
  Quantity: number;
  Unit: string;
  UnitPrice: number;
  Currency?: string;
  TotalAmount: number;
  VatRate?: number;
  VatAmount: number;
  GrandTotal: number;
  WorklogText?: string;
  ResourceDescription?: string;
  Notes?: string;
  IsInvoiced?: boolean;
  InvoiceId?: number;
}

export interface WorkOrderItemUpdate {
  ItemType?: WorkOrderItemType | string;
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
  WorklogText?: string;
  ResourceDescription?: string;
  Notes?: string;
  IsActive?: boolean;
  IsInvoiced?: boolean;
  InvoiceId?: number;
}

// Stats Interface
export interface WorkOrderStats {
  total_work_orders: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}

// Paginated Response
export interface PaginatedWorkOrderResponse {
  items: WorkOrder[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
