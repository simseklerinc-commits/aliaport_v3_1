"""
WORK ORDER PERSON SCHEMAS
Pydantic schemas for WorkOrderPerson model
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


class WorkOrderPersonBase(BaseModel):
    """Base schema for WorkOrderPerson"""
    WorkOrderId: int = Field(..., description="İş emri ID")
    FullName: str = Field(..., min_length=1, max_length=200, description="Ad Soyad")
    TcKimlik: Optional[str] = Field(None, min_length=11, max_length=11, description="TC Kimlik No (11 haneli)")
    Pasaport: Optional[str] = Field(None, min_length=6, max_length=15, description="Pasaport No (6-15 karakter)")
    SecurityNotes: Optional[str] = Field(None, max_length=500, description="Güvenlik notları")


class WorkOrderPersonCreate(WorkOrderPersonBase):
    """Schema for creating a new WorkOrderPerson"""
    
    @field_validator('TcKimlik')
    @classmethod
    def validate_tc_kimlik(cls, v):
        """TC Kimlik validation: 11 digit numeric + algorithm check"""
        if v is None:
            return v
        
        # Remove spaces
        v = v.strip()
        
        # Check if 11 digits
        if len(v) != 11:
            raise ValueError('TC Kimlik 11 haneli olmalıdır')
        
        # Check if numeric
        if not v.isdigit():
            raise ValueError('TC Kimlik sadece rakam içermelidir')
        
        # First digit cannot be 0
        if v[0] == '0':
            raise ValueError('TC Kimlik 0 ile başlayamaz')
        
        # Algorithm validation
        digits = [int(d) for d in v]
        
        # 10th digit = (sum of odd positions * 7 - sum of even positions) % 10
        odd_sum = sum(digits[0:9:2])  # 1st, 3rd, 5th, 7th, 9th
        even_sum = sum(digits[1:8:2])  # 2nd, 4th, 6th, 8th
        tenth_digit = (odd_sum * 7 - even_sum) % 10
        
        if tenth_digit != digits[9]:
            raise ValueError('Geçersiz TC Kimlik numarası (10. hane kontrolü)')
        
        # 11th digit = sum of first 10 digits % 10
        eleventh_digit = sum(digits[0:10]) % 10
        
        if eleventh_digit != digits[10]:
            raise ValueError('Geçersiz TC Kimlik numarası (11. hane kontrolü)')
        
        return v
    
    @field_validator('Pasaport')
    @classmethod
    def validate_pasaport(cls, v):
        """Pasaport validation: 6-15 alphanumeric"""
        if v is None:
            return v
        
        v = v.strip().upper()
        
        if len(v) < 6 or len(v) > 15:
            raise ValueError('Pasaport 6-15 karakter olmalıdır')
        
        if not v.isalnum():
            raise ValueError('Pasaport sadece harf ve rakam içermelidir')
        
        return v


class WorkOrderPersonUpdate(BaseModel):
    """Schema for updating a WorkOrderPerson"""
    FullName: Optional[str] = Field(None, min_length=1, max_length=200)
    TcKimlik: Optional[str] = Field(None, min_length=11, max_length=11)
    Pasaport: Optional[str] = Field(None, min_length=6, max_length=15)
    SecurityNotes: Optional[str] = Field(None, max_length=500)
    
    @field_validator('TcKimlik')
    @classmethod
    def validate_tc_kimlik(cls, v):
        """TC Kimlik validation (same as Create)"""
        if v is None:
            return v
        
        v = v.strip()
        
        if len(v) != 11:
            raise ValueError('TC Kimlik 11 haneli olmalıdır')
        
        if not v.isdigit():
            raise ValueError('TC Kimlik sadece rakam içermelidir')
        
        if v[0] == '0':
            raise ValueError('TC Kimlik 0 ile başlayamaz')
        
        digits = [int(d) for d in v]
        odd_sum = sum(digits[0:9:2])
        even_sum = sum(digits[1:8:2])
        tenth_digit = (odd_sum * 7 - even_sum) % 10
        
        if tenth_digit != digits[9]:
            raise ValueError('Geçersiz TC Kimlik numarası (10. hane kontrolü)')
        
        eleventh_digit = sum(digits[0:10]) % 10
        
        if eleventh_digit != digits[10]:
            raise ValueError('Geçersiz TC Kimlik numarası (11. hane kontrolü)')
        
        return v
    
    @field_validator('Pasaport')
    @classmethod
    def validate_pasaport(cls, v):
        """Pasaport validation (same as Create)"""
        if v is None:
            return v
        
        v = v.strip().upper()
        
        if len(v) < 6 or len(v) > 15:
            raise ValueError('Pasaport 6-15 karakter olmalıdır')
        
        if not v.isalnum():
            raise ValueError('Pasaport sadece harf ve rakam içermelidir')
        
        return v


class WorkOrderPersonResponse(WorkOrderPersonBase):
    """Schema for WorkOrderPerson response"""
    Id: int
    SecurityApproved: bool
    ApprovalDate: Optional[datetime] = None
    ApprovedBy: Optional[int] = None
    GateLogEntryId: Optional[int] = None
    GateLogExitId: Optional[int] = None
    CreatedAt: datetime
    UpdatedAt: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class SecurityApprovalRequest(BaseModel):
    """Schema for security approval request"""
    person_id: int = Field(..., description="WorkOrderPerson ID")
    approved: bool = Field(..., description="Onay durumu (True/False)")
    notes: Optional[str] = Field(None, max_length=500, description="Güvenlik notları")


class SecurityApprovalBulkRequest(BaseModel):
    """Schema for bulk security approval"""
    person_ids: list[int] = Field(..., min_length=1, description="WorkOrderPerson ID listesi")
    approved: bool = Field(..., description="Onay durumu")
    notes: Optional[str] = Field(None, max_length=500, description="Güvenlik notları")


class PaginatedWorkOrderPersonResponse(BaseModel):
    """Paginated WorkOrderPerson response"""
    items: list[WorkOrderPersonResponse]
    total: int
    page: int
    page_size: int
    pages: int
