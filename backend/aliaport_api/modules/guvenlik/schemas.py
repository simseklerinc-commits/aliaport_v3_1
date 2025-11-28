"""
GÜVENLİK MODÜLÜ - Pydantic Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class GateLogBase(BaseModel):
    """GateLog temel şema"""
    work_order_id: int
    work_order_person_id: Optional[int] = None
    motorbot_id: Optional[int] = None
    entry_type: str  # GIRIS veya CIKIS
    wo_number: str
    wo_status: str
    security_personnel: str
    is_approved: bool = False
    checklist_complete: bool = False
    checklist_data: Optional[str] = None  # JSON string
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    
    # Araç Bilgileri
    vehicle_plate: Optional[str] = None
    vehicle_type: Optional[str] = None
    driver_name: Optional[str] = None
    
    # Zaman Bilgileri
    entry_time: Optional[datetime] = None
    exit_time: Optional[datetime] = None
    
    # Kimlik Belgesi
    identity_documents_uploaded: bool = False
    identity_document_count: int = 0


class GateLogCreate(GateLogBase):
    """GateLog oluşturma"""
    pass


class GateLogException(BaseModel):
    """İstisna kaydı için ekstra alanlar"""
    exception_pin: str
    exception_reason: str
    exception_approved_by: Optional[str] = None


class GateLogCreateWithException(GateLogBase):
    """İstisna ile GateLog oluşturma"""
    is_exception: bool = True
    exception_pin: str
    exception_reason: str
    exception_approved_by: Optional[str] = None


class GateLogResponse(GateLogBase):
    """GateLog response"""
    id: int
    is_exception: bool = False
    exception_reason: Optional[str] = None
    gate_time: datetime
    created_at: datetime
    
    # 4 Saat Kuralı Hesaplamaları
    duration_minutes: Optional[int] = None
    base_charge_hours: int = 4
    extra_minutes: int = 0
    extra_charge_calculated: Optional[float] = None

    class Config:
        from_attributes = True


class GateChecklistItemBase(BaseModel):
    """Checklist item temel şema"""
    wo_type: str
    item_label: str
    is_required: bool = True
    display_order: int = 0
    is_active: bool = True


class GateChecklistItemCreate(GateChecklistItemBase):
    """Checklist item oluşturma"""
    pass


class GateChecklistItemUpdate(BaseModel):
    """Checklist item güncelleme"""
    item_label: Optional[str] = None
    is_required: Optional[bool] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class GateChecklistItemResponse(GateChecklistItemBase):
    """Checklist item response"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GateStats(BaseModel):
    """Güvenlik istatistikleri"""
    total_entries: int
    total_exits: int
    approved_count: int
    rejected_count: int
    exception_count: int
    by_wo_status: dict
    recent_logs: List[GateLogResponse]


class VehicleEntryRequest(BaseModel):
    """Araç giriş kaydı şeması"""
    work_order_id: int
    work_order_person_id: Optional[int] = None
    wo_number: str
    vehicle_plate: str = Field(..., min_length=2, max_length=20)
    vehicle_type: str = Field(..., description="OTOMOBİL, KAMYONET, KAMYON, ROMORK")
    driver_name: str = Field(..., min_length=2, max_length=200)
    security_personnel: str
    entry_time: datetime
    identity_documents_uploaded: bool = False
    identity_document_count: int = 0
    notes: Optional[str] = None


class VehicleExitRequest(BaseModel):
    """Araç çıkış kaydı şeması"""
    gate_log_id: int = Field(..., description="Giriş kaydı ID")
    exit_time: datetime
    security_personnel: str
    notes: Optional[str] = None


class VehicleExitResponse(BaseModel):
    """Araç çıkış response (4 saat kuralı hesaplamaları ile)"""
    gate_log_id: int
    vehicle_plate: str
    entry_time: datetime
    exit_time: datetime
    duration_minutes: int
    base_charge_hours: int
    extra_minutes: int
    needs_extra_charge: bool
    extra_charge_amount: Optional[float] = None
    message: str


class PersonIdentityUploadRequest(BaseModel):
    """Kişi kimlik belgesi yükleme"""
    work_order_person_id: int
    identity_document_id: int = Field(..., description="Dijital arşiv document ID")
    security_user_id: int
    notes: Optional[str] = None


class SecurityApprovalBulkRequest(BaseModel):
    """Toplu güvenlik onayı"""
    person_ids: List[int] = Field(..., description="WorkOrderPerson ID listesi")
    security_user_id: int
    approved: bool
    gate_entry_time: Optional[datetime] = None
    notes: Optional[str] = None
