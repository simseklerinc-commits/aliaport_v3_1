"""
SAHA PERSONEL MODÜLÜ - Pydantic Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class WorkLogBase(BaseModel):
    """WorkLog temel şema"""
    work_order_id: Optional[int] = None
    sefer_id: Optional[int] = None
    motorbot_id: Optional[int] = None
    hizmet_kodu: Optional[str] = None
    personnel_name: str
    time_start: datetime
    time_end: Optional[datetime] = None
    service_type: Optional[str] = None
    quantity: float = 1.0
    unit: str = "SAAT"
    description: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None


class WorkLogCreate(WorkLogBase):
    """WorkLog oluşturma"""
    pass


class WorkLogUpdate(BaseModel):
    """WorkLog güncelleme"""
    time_end: Optional[datetime] = None
    service_type: Optional[str] = None
    quantity: Optional[float] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    is_approved: Optional[int] = None
    approved_by: Optional[str] = None


class WorkLogResponse(WorkLogBase):
    """WorkLog response"""
    id: int
    duration_minutes: Optional[int] = None
    is_processed: int = 0
    is_approved: int = 0
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkLogStats(BaseModel):
    """WorkLog istatistikleri"""
    total_logs: int
    pending_approval: int
    approved: int
    total_hours: float
    by_personnel: dict
    by_service_type: dict
