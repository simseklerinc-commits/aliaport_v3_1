"""
İŞ EMRİ MODÜLÜ - Pydantic Schemas
WorkOrder ve WorkOrderItem için API request/response modelleri
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ============================================
# ENUMS
# ============================================

class WorkOrderType(str, Enum):
    HIZMET = "HIZMET"
    MOTORBOT = "MOTORBOT"
    BARINMA = "BARINMA"
    DIGER = "DIGER"


class WorkOrderPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class WorkOrderStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    SAHADA = "SAHADA"
    TAMAMLANDI = "TAMAMLANDI"
    FATURALANDI = "FATURALANDI"
    KAPANDI = "KAPANDI"
    REJECTED = "REJECTED"


class WorkOrderItemType(str, Enum):
    WORKLOG = "WORKLOG"
    RESOURCE = "RESOURCE"
    SERVICE = "SERVICE"


# ============================================
# WORK ORDER SCHEMAS
# ============================================

class WorkOrderBase(BaseModel):
    """Base schema for WorkOrder"""
    CariId: int = Field(..., alias="cari_id")
    CariCode: str = Field(..., min_length=1, max_length=20, alias="cari_code")
    CariTitle: str = Field(..., min_length=1, max_length=255, alias="cari_title")
    RequesterUserId: Optional[int] = Field(None, alias="requester_user_id")
    RequesterUserName: Optional[str] = Field(None, max_length=100, alias="requester_user_name")
    Type: WorkOrderType = Field(..., alias="type")
    ServiceCode: Optional[str] = Field(None, max_length=50, alias="service_code")
    Action: Optional[str] = Field(None, max_length=100, alias="action")
    Subject: str = Field(..., min_length=3, max_length=120, alias="subject")
    Description: Optional[str] = Field(None, max_length=500, alias="description")
    Priority: WorkOrderPriority = Field(WorkOrderPriority.MEDIUM, alias="priority")
    PlannedStart: Optional[datetime] = Field(None, alias="planned_start")
    PlannedEnd: Optional[datetime] = Field(None, alias="planned_end")
    ActualStart: Optional[datetime] = Field(None, alias="actual_start")
    ActualEnd: Optional[datetime] = Field(None, alias="actual_end")
    Status: WorkOrderStatus = Field(WorkOrderStatus.DRAFT, alias="status")
    GateRequired: bool = Field(False, alias="gate_required")
    SahaKayitYetkisi: bool = Field(True, alias="saha_kayit_yetkisi")
    AttachmentsCount: int = Field(0, alias="attachments_count")
    HasSignature: bool = Field(False, alias="has_signature")
    IsCabatogeTrFlag: bool = Field(False, alias="is_cabatoge_tr_flag")
    ApplyRuleAddons: bool = Field(True, alias="apply_rule_addons")
    SecurityExitTime: Optional[datetime] = Field(None, alias="security_exit_time")
    AttachedLetterApproved: bool = Field(False, alias="attached_letter_approved")
    Notes: Optional[str] = Field(None, alias="notes")
    IsActive: bool = Field(True, alias="is_active")

    class Config:
        populate_by_name = True


class WorkOrderCreate(WorkOrderBase):
    """Schema for creating a new WorkOrder"""
    pass


class WorkOrderUpdate(BaseModel):
    """Schema for updating WorkOrder"""
    CariId: Optional[int] = Field(None, alias="cari_id")
    CariCode: Optional[str] = Field(None, max_length=20, alias="cari_code")
    CariTitle: Optional[str] = Field(None, max_length=255, alias="cari_title")
    RequesterUserId: Optional[int] = Field(None, alias="requester_user_id")
    RequesterUserName: Optional[str] = Field(None, max_length=100, alias="requester_user_name")
    Type: Optional[WorkOrderType] = Field(None, alias="type")
    ServiceCode: Optional[str] = Field(None, max_length=50, alias="service_code")
    Action: Optional[str] = Field(None, max_length=100, alias="action")
    Subject: Optional[str] = Field(None, min_length=3, max_length=120, alias="subject")
    Description: Optional[str] = Field(None, max_length=500, alias="description")
    Priority: Optional[WorkOrderPriority] = Field(None, alias="priority")
    PlannedStart: Optional[datetime] = Field(None, alias="planned_start")
    PlannedEnd: Optional[datetime] = Field(None, alias="planned_end")
    ActualStart: Optional[datetime] = Field(None, alias="actual_start")
    ActualEnd: Optional[datetime] = Field(None, alias="actual_end")
    Status: Optional[WorkOrderStatus] = Field(None, alias="status")
    GateRequired: Optional[bool] = Field(None, alias="gate_required")
    SahaKayitYetkisi: Optional[bool] = Field(None, alias="saha_kayit_yetkisi")
    AttachmentsCount: Optional[int] = Field(None, alias="attachments_count")
    HasSignature: Optional[bool] = Field(None, alias="has_signature")
    IsCabatogeTrFlag: Optional[bool] = Field(None, alias="is_cabatoge_tr_flag")
    ApplyRuleAddons: Optional[bool] = Field(None, alias="apply_rule_addons")
    SecurityExitTime: Optional[datetime] = Field(None, alias="security_exit_time")
    AttachedLetterApproved: Optional[bool] = Field(None, alias="attached_letter_approved")
    Notes: Optional[str] = Field(None, alias="notes")
    IsActive: Optional[bool] = Field(None, alias="is_active")

    class Config:
        populate_by_name = True


class WorkOrderResponse(WorkOrderBase):
    """Schema for WorkOrder response"""
    Id: int = Field(..., alias="id")
    WoNumber: str = Field(..., alias="wo_number")
    CreatedAt: datetime = Field(..., alias="created_at")
    CreatedBy: Optional[int] = Field(None, alias="created_by")
    CreatedByName: Optional[str] = Field(None, alias="created_by_name")
    UpdatedAt: Optional[datetime] = Field(None, alias="updated_at")
    UpdatedBy: Optional[int] = Field(None, alias="updated_by")
    UpdatedByName: Optional[str] = Field(None, alias="updated_by_name")

    class Config:
        from_attributes = True
        populate_by_name = True


# ============================================
# WORK ORDER ITEM SCHEMAS
# ============================================

class WorkOrderItemBase(BaseModel):
    """Base schema for WorkOrderItem"""
    WorkOrderId: int = Field(..., alias="work_order_id")
    WoNumber: str = Field(..., max_length=50, alias="wo_number")
    ItemType: WorkOrderItemType = Field(..., alias="item_type")
    ResourceCode: Optional[str] = Field(None, max_length=50, alias="resource_code")
    ResourceName: Optional[str] = Field(None, max_length=100, alias="resource_name")
    ServiceCode: Optional[str] = Field(None, max_length=50, alias="service_code")
    ServiceName: Optional[str] = Field(None, max_length=100, alias="service_name")
    StartTime: Optional[datetime] = Field(None, alias="start_time")
    EndTime: Optional[datetime] = Field(None, alias="end_time")
    DurationMinutes: Optional[int] = Field(None, alias="duration_minutes")
    Quantity: float = Field(..., gt=0, alias="quantity")
    Unit: str = Field(..., min_length=1, max_length=20, alias="unit")
    UnitPrice: float = Field(..., ge=0, alias="unit_price")
    Currency: str = Field("TRY", min_length=3, max_length=3, alias="currency")
    TotalAmount: float = Field(..., ge=0, alias="total_amount")
    VatRate: float = Field(20, ge=0, le=100, alias="vat_rate")
    VatAmount: float = Field(..., ge=0, alias="vat_amount")
    GrandTotal: float = Field(..., ge=0, alias="grand_total")
    Notes: Optional[str] = Field(None, alias="notes")
    IsInvoiced: bool = Field(False, alias="is_invoiced")
    InvoiceId: Optional[int] = Field(None, alias="invoice_id")

    class Config:
        populate_by_name = True


class WorkOrderItemCreate(WorkOrderItemBase):
    """Schema for creating a new WorkOrderItem"""
    pass


class WorkOrderItemUpdate(BaseModel):
    """Schema for updating WorkOrderItem"""
    ItemType: Optional[WorkOrderItemType] = Field(None, alias="item_type")
    ResourceCode: Optional[str] = Field(None, max_length=50, alias="resource_code")
    ResourceName: Optional[str] = Field(None, max_length=100, alias="resource_name")
    ServiceCode: Optional[str] = Field(None, max_length=50, alias="service_code")
    ServiceName: Optional[str] = Field(None, max_length=100, alias="service_name")
    StartTime: Optional[datetime] = Field(None, alias="start_time")
    EndTime: Optional[datetime] = Field(None, alias="end_time")
    DurationMinutes: Optional[int] = Field(None, alias="duration_minutes")
    Quantity: Optional[float] = Field(None, gt=0, alias="quantity")
    Unit: Optional[str] = Field(None, max_length=20, alias="unit")
    UnitPrice: Optional[float] = Field(None, ge=0, alias="unit_price")
    Currency: Optional[str] = Field(None, min_length=3, max_length=3, alias="currency")
    TotalAmount: Optional[float] = Field(None, ge=0, alias="total_amount")
    VatRate: Optional[float] = Field(None, ge=0, le=100, alias="vat_rate")
    VatAmount: Optional[float] = Field(None, ge=0, alias="vat_amount")
    GrandTotal: Optional[float] = Field(None, ge=0, alias="grand_total")
    Notes: Optional[str] = Field(None, alias="notes")
    IsInvoiced: Optional[bool] = Field(None, alias="is_invoiced")
    InvoiceId: Optional[int] = Field(None, alias="invoice_id")

    class Config:
        populate_by_name = True


class WorkOrderItemResponse(WorkOrderItemBase):
    """Schema for WorkOrderItem response"""
    Id: int = Field(..., alias="id")
    CreatedAt: datetime = Field(..., alias="created_at")
    CreatedBy: Optional[int] = Field(None, alias="created_by")
    CreatedByName: Optional[str] = Field(None, alias="created_by_name")

    class Config:
        from_attributes = True
        populate_by_name = True


# ============================================
# UTILITY SCHEMAS
# ============================================

class WorkOrderStatusChange(BaseModel):
    """Schema for changing work order status"""
    Status: WorkOrderStatus = Field(..., alias="status")
    Notes: Optional[str] = Field(None, max_length=500, alias="notes")

    class Config:
        populate_by_name = True


class WorkOrderStats(BaseModel):
    """Schema for work order statistics"""
    Total: int = Field(..., alias="total")
    ByStatus: dict = Field(..., alias="by_status")
    ByPriority: dict = Field(..., alias="by_priority")
    ByType: dict = Field(..., alias="by_type")

    class Config:
        populate_by_name = True
