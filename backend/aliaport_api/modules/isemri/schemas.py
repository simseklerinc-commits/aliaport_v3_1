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
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    INVOICED = "INVOICED"
    CLOSED = "CLOSED"
    REJECTED = "REJECTED"
    SAHADA = "SAHADA"  # Legacy
    TAMAMLANDI = "TAMAMLANDI"  # Legacy
    FATURALANDI = "FATURALANDI"  # Legacy
    KAPANDI = "KAPANDI"  # Legacy


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

    @field_validator(
        "GateRequired",
        "SahaKayitYetkisi",
        "HasSignature",
        "IsCabatogeTrFlag",
        "ApplyRuleAddons",
        "AttachedLetterApproved",
        "IsActive",
        mode="before",
    )
    def set_boolean_defaults(cls, value):
        if value is None:
            return False
        return value

    @field_validator("AttachmentsCount", mode="before")
    def set_integer_defaults(cls, value):
        if value is None:
            return 0
        return value


class WorkOrderCreate(WorkOrderBase):
    """Schema for creating a new WorkOrder"""
    ServiceCodes: Optional[List[str]] = Field(None, alias="service_codes", description="Ek hizmet kodları listesi")
    EmployeeIds: Optional[List[int]] = Field(None, alias="employee_ids", description="PortalEmployee kayıt ID listesi")
    VehicleIds: Optional[List[int]] = Field(None, alias="vehicle_ids", description="PortalVehicle kayıt ID listesi")
    PersonelList: Optional[List[dict]] = Field(None, alias="personel_list", description="Personel transfer için kişi listesi: [{full_name, tc_kimlik, pasaport, nationality, phone}]")


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
    """Schema for work order statistics - RUNBOOK UYUMLU"""
    Total: int = Field(..., alias="total")
    ByStatus: dict = Field(..., alias="by_status")
    ByPriority: dict = Field(..., alias="by_priority")
    ByType: dict = Field(..., alias="by_type")
    MissingDocuments: int = Field(0, alias="missing_documents")  # Eksik belgeler
    Active: int = Field(0, alias="active")  # Aktif iş emirleri (SAHADA + IN_PROGRESS + APPROVED)
    DueToday: int = Field(0, alias="due_today")  # Bugün biten

    class Config:
        populate_by_name = True


# ============================================
# WORK ORDER PERSON SCHEMAS
# ============================================

class WorkOrderPersonBase(BaseModel):
    """Base schema for WorkOrderPerson"""
    WorkOrderId: int = Field(..., alias="work_order_id")
    WorkOrderItemId: Optional[int] = Field(None, alias="work_order_item_id")
    FullName: str = Field(..., min_length=2, max_length=200, alias="full_name")
    TcKimlikNo: Optional[str] = Field(None, min_length=11, max_length=11, alias="tc_kimlik_no")
    PassportNo: Optional[str] = Field(None, max_length=20, alias="passport_no")
    Nationality: Optional[str] = Field(None, max_length=3, alias="nationality")
    Phone: Optional[str] = Field(None, max_length=20, alias="phone")
    IdentityDocumentId: Optional[int] = Field(None, alias="identity_document_id")
    IdentityPhotoUrl: Optional[str] = Field(None, max_length=500, alias="identity_photo_url")
    SecurityNotes: Optional[str] = Field(None, alias="security_notes")

    class Config:
        populate_by_name = True


class WorkOrderPersonCreate(WorkOrderPersonBase):
    """Schema for creating a new WorkOrderPerson"""
    pass


class WorkOrderPersonUpdate(BaseModel):
    """Schema for updating WorkOrderPerson"""
    FullName: Optional[str] = Field(None, min_length=2, max_length=200, alias="full_name")
    TcKimlikNo: Optional[str] = Field(None, min_length=11, max_length=11, alias="tc_kimlik_no")
    PassportNo: Optional[str] = Field(None, max_length=20, alias="passport_no")
    Nationality: Optional[str] = Field(None, max_length=3, alias="nationality")
    Phone: Optional[str] = Field(None, max_length=20, alias="phone")
    IdentityDocumentId: Optional[int] = Field(None, alias="identity_document_id")
    IdentityPhotoUrl: Optional[str] = Field(None, max_length=500, alias="identity_photo_url")
    SecurityNotes: Optional[str] = Field(None, alias="security_notes")

    class Config:
        populate_by_name = True


class WorkOrderPersonResponse(WorkOrderPersonBase):
    """Schema for WorkOrderPerson response"""
    Id: int = Field(..., alias="id")
    GateEntryTime: Optional[datetime] = Field(None, alias="gate_entry_time")
    GateExitTime: Optional[datetime] = Field(None, alias="gate_exit_time")
    ApprovedBySecurity: bool = Field(False, alias="approved_by_security")
    ApprovedBySecurityUserId: Optional[int] = Field(None, alias="approved_by_security_user_id")
    ApprovedAt: Optional[datetime] = Field(None, alias="approved_at")
    CreatedAt: datetime = Field(..., alias="created_at")
    UpdatedAt: Optional[datetime] = Field(None, alias="updated_at")

    class Config:
        from_attributes = True
        populate_by_name = True


class SecurityApprovalRequest(BaseModel):
    """Schema for security approval of person entry"""
    ApprovedBySecurity: bool = Field(..., alias="approved_by_security")
    SecurityUserId: int = Field(..., alias="security_user_id")
    GateEntryTime: Optional[datetime] = Field(None, alias="gate_entry_time")
    GateExitTime: Optional[datetime] = Field(None, alias="gate_exit_time")
    SecurityNotes: Optional[str] = Field(None, max_length=500, alias="security_notes")

    class Config:
        populate_by_name = True


# ============================================
# PRICING SCHEMAS
# ============================================

class PriceCalculationRequest(BaseModel):
    """Schema for price calculation request"""
    ServiceCode: str = Field(..., min_length=1, max_length=50, alias="service_code", description="Hizmet kodu")
    Quantity: Optional[float] = Field(1.0, alias="quantity", description="Miktar (adet, ton, vb.)")
    Weight: Optional[float] = Field(None, alias="weight", description="Ağırlık (KG)")
    Days: Optional[int] = Field(None, alias="days", description="Gün sayısı")
    Minutes: Optional[int] = Field(None, alias="minutes", description="Dakika")
    Hours: Optional[float] = Field(None, alias="hours", description="Saat")
    Grt: Optional[float] = Field(None, alias="grt", description="Gross Registered Tonnage")
    SqMeter: Optional[float] = Field(None, alias="sqmeter", description="Metrekare")
    CalculationDate: Optional[datetime] = Field(None, alias="calculation_date", description="Hesaplama tarihi (kur için)")
    
    class Config:
        populate_by_name = True


class PriceCalculationResponse(BaseModel):
    """Schema for price calculation response"""
    ServiceCode: str = Field(..., alias="service_code")
    ServiceName: str = Field(..., alias="service_name")
    BasePrice: float = Field(..., alias="base_price", description="Baz fiyat (orijinal para birimi)")
    BaseCurrency: str = Field(..., alias="base_currency", description="Baz para birimi")
    ConvertedPrice: float = Field(..., alias="converted_price", description="TRY'ye çevrilmiş fiyat")
    VatRate: float = Field(..., alias="vat_rate", description="KDV oranı (%)")
    VatAmount: float = Field(..., alias="vat_amount", description="KDV tutarı (TRY)")
    GrandTotal: float = Field(..., alias="grand_total", description="KDV dahil toplam (TRY)")
    CalculationDetails: str = Field(..., alias="calculation_details", description="Hesaplama açıklaması")
    Breakdown: dict = Field(..., alias="breakdown", description="Detaylı kırılım")
    ExchangeRate: Optional[float] = Field(None, alias="exchange_rate", description="Kur (USD/EUR -> TRY)")
    
    class Config:
        populate_by_name = True
