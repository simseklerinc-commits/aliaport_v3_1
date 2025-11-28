"""
SECURITY SCHEMAS
Pydantic schemas for Security module (GateLog, Vehicle Entry/Exit, Person Approval)
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class VehicleEntryRequest(BaseModel):
    """Schema for vehicle entry request"""
    work_order_id: int = Field(..., description="İş emri ID")
    vehicle_plate: str = Field(..., min_length=1, max_length=20, description="Araç plakası")
    vehicle_type: str = Field(..., max_length=50, description="Araç tipi (kamyon, kamyonet, vb.)")
    driver_name: str = Field(..., min_length=1, max_length=200, description="Sürücü adı")
    notes: Optional[str] = Field(None, max_length=500, description="Notlar")


class VehicleExitRequest(BaseModel):
    """Schema for vehicle exit request"""
    gate_log_id: int = Field(..., description="GateLog ID (giriş kaydı)")


class VehicleExitResponse(BaseModel):
    """Schema for vehicle exit response (includes 4-hour rule calculation)"""
    gate_log_id: int
    entry_time: datetime
    exit_time: datetime
    duration_minutes: int
    base_price: float
    extra_charges: float
    total_price: float
    currency: str
    breakdown: dict
    message: str
    
    class Config:
        from_attributes = True


class GateLogVehicleResponse(BaseModel):
    """Schema for active vehicle response"""
    Id: int
    WorkOrderId: int
    VehiclePlate: str
    VehicleType: str
    DriverName: str
    EntryTime: datetime
    ExitTime: Optional[datetime] = None
    Notes: Optional[str] = None
    DurationMinutes: Optional[int] = None
    
    class Config:
        from_attributes = True


class PersonIdentityUploadRequest(BaseModel):
    """Schema for identity document upload"""
    person_id: int = Field(..., description="WorkOrderPerson ID")
    identity_type: str = Field(..., description="Kimlik tipi (TC Kimlik / Pasaport)")
    document_data: str = Field(..., description="Base64 encoded image data")
    notes: Optional[str] = Field(None, max_length=500, description="Notlar")


class SecurityApprovalBulkRequest(BaseModel):
    """Schema for bulk person approval/rejection"""
    person_ids: list[int] = Field(..., min_length=1, description="WorkOrderPerson ID listesi")
    approved: bool = Field(..., description="Onay durumu (True/False)")
    notes: Optional[str] = Field(None, max_length=500, description="Güvenlik notları")


class PendingPersonResponse(BaseModel):
    """Schema for pending person approval"""
    Id: int
    WorkOrderId: int
    WorkOrderNumber: Optional[str] = None
    FullName: str
    TcKimlik: Optional[str] = None
    Pasaport: Optional[str] = None
    SecurityNotes: Optional[str] = None
    CreatedAt: datetime
    
    class Config:
        from_attributes = True


class ActiveVehicleResponse(BaseModel):
    """Schema for active vehicle with duration"""
    Id: int
    WorkOrderId: int
    WorkOrderNumber: Optional[str] = None
    VehiclePlate: str
    VehicleType: str
    DriverName: str
    EntryTime: datetime
    DurationMinutes: int
    Notes: Optional[str] = None
    
    class Config:
        from_attributes = True
