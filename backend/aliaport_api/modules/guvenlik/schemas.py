"""
GÜVENLİK MODÜLÜ - Pydantic Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class GateLogBase(BaseModel):
    """GateLog temel şema"""
    work_order_id: int
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
