"""
SAHA PERSONEL SCHEMAS
Pydantic schemas for Saha Personel module (Field Personnel)
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ActiveWorkOrderResponse(BaseModel):
    """Schema for active work order (for field personnel dashboard)"""
    Id: int
    WONumber: str
    CariCode: str
    CariTitle: str
    Subject: str
    Status: str
    StartDate: Optional[datetime] = None
    EstimatedEndDate: Optional[datetime] = None
    TotalPersonCount: int = 0
    ApprovedPersonCount: int = 0
    
    class Config:
        from_attributes = True


class WorkOrderPersonSummary(BaseModel):
    """Schema for WorkOrderPerson summary in list"""
    Id: int
    FullName: str
    TcKimlik: Optional[str] = None
    Pasaport: Optional[str] = None
    SecurityApproved: bool
    ApprovalDate: Optional[datetime] = None
    GateLogEntryId: Optional[int] = None
    GateLogExitId: Optional[int] = None
    
    class Config:
        from_attributes = True


class WorkOrderSummaryResponse(BaseModel):
    """Schema for work order summary modal (detailed view)"""
    work_order_id: int
    wo_number: str
    cari_code: str
    cari_title: str
    subject: str
    status: str
    start_date: Optional[datetime] = None
    estimated_end_date: Optional[datetime] = None
    total_persons: int
    approved_persons: int
    pending_persons: int
    entered_persons: int
    exited_persons: int
    persons: list[WorkOrderPersonSummary]
    worklog_count: int = 0


class MyWorkOrderResponse(BaseModel):
    """Schema for my work orders (assigned to current user)"""
    Id: int
    WONumber: str
    CariCode: str
    CariTitle: str
    Subject: str
    Status: str
    StartDate: Optional[datetime] = None
    EstimatedEndDate: Optional[datetime] = None
    AssignedUserId: Optional[int] = None
    
    class Config:
        from_attributes = True
