/**
 * İŞ EMRİ (WORK ORDER) TYPES
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
  WONumber: string;
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
  PlannedStart?: string;
  PlannedEnd?: string;
  ActualStart?: string;
  ActualEnd?: string;
  Status: WorkOrderStatus;
  GateRequired: boolean;
  SahaKayitYetkisi: boolean;
  AttachmentsCount: number;
  HasSignature: boolean;
  IsCabatogeTrFlag: boolean;
  ApplyRuleAddons: boolean;
  SecurityExitTime?: string;
  AttachedLetterApproved: boolean;
  Notes?: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt?: string;
  CreatedBy?: number;
  UpdatedBy?: number;
}

// WorkOrderItem Interface
export interface WorkOrderItem {
  Id: number;
  WorkOrderId: number;
  ItemType: WorkOrderItemType;
  HizmetId?: number;
  HizmetKod?: string;
  HizmetAd?: string;
  Quantity: number;
  UnitPrice: number;
  Currency: string;
  TotalPrice: number;
  VatRate: number;
  WorklogText?: string;
  ResourceDescription?: string;
  Notes?: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt?: string;
  CreatedBy?: number;
  UpdatedBy?: number;
}

// Create/Update DTOs
export interface WorkOrderCreate {
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
  PlannedStart?: string;
  PlannedEnd?: string;
  Status?: WorkOrderStatus;
  GateRequired?: boolean;
  SahaKayitYetkisi?: boolean;
  Notes?: string;
  IsActive?: boolean;
}

export interface WorkOrderUpdate {
  CariId?: number;
  CariCode?: string;
  CariTitle?: string;
  Type?: WorkOrderType;
  Subject?: string;
  Description?: string;
  Priority?: WorkOrderPriority;
  PlannedStart?: string;
  PlannedEnd?: string;
  ActualStart?: string;
  ActualEnd?: string;
  Status?: WorkOrderStatus;
  Notes?: string;
  IsActive?: boolean;
}

export interface WorkOrderItemCreate {
  WorkOrderId: number;
  ItemType: WorkOrderItemType;
  HizmetId?: number;
  HizmetKod?: string;
  HizmetAd?: string;
  Quantity: number;
  UnitPrice: number;
  Currency?: string;
  VatRate?: number;
  WorklogText?: string;
  ResourceDescription?: string;
  Notes?: string;
}

export interface WorkOrderItemUpdate {
  ItemType?: WorkOrderItemType;
  Quantity?: number;
  UnitPrice?: number;
  WorklogText?: string;
  ResourceDescription?: string;
  Notes?: string;
  IsActive?: boolean;
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
