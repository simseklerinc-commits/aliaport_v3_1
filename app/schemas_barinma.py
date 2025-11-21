# NOTE: Barınma Contract Pydantic schemas - validation & serialization
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from decimal import Decimal


class BarinmaContractBase(BaseModel):
    """Base schema for Barınma Contract"""
    ContractNumber: str
    MotorbotId: int
    CariId: int
    ServiceCardId: int
    PriceListId: int
    StartDate: date
    EndDate: Optional[date] = None
    UnitPrice: Decimal
    Currency: str = "TRY"
    VatRate: Decimal = Decimal("20.00")
    BillingPeriod: str = "MONTHLY"  # MONTHLY, QUARTERLY, YEARLY
    IsActive: bool = True
    Notes: Optional[str] = None
    CreatedBy: Optional[int] = None
    UpdatedBy: Optional[int] = None


class BarinmaContractCreate(BarinmaContractBase):
    """Schema for creating new Barınma Contract"""
    pass


class BarinmaContractUpdate(BaseModel):
    """Schema for updating Barınma Contract - all fields optional"""
    ContractNumber: Optional[str] = None
    MotorbotId: Optional[int] = None
    CariId: Optional[int] = None
    ServiceCardId: Optional[int] = None
    PriceListId: Optional[int] = None
    StartDate: Optional[date] = None
    EndDate: Optional[date] = None
    UnitPrice: Optional[Decimal] = None
    Currency: Optional[str] = None
    VatRate: Optional[Decimal] = None
    BillingPeriod: Optional[str] = None
    IsActive: Optional[bool] = None
    Notes: Optional[str] = None
    UpdatedBy: Optional[int] = None


class BarinmaContractResponse(BarinmaContractBase):
    """Schema for Barınma Contract response (includes Id and timestamps)"""
    Id: int
    CreatedAt: datetime
    UpdatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedBarinmaContractResponse(BaseModel):
    """Paginated response for Barınma Contract list"""
    items: list[BarinmaContractResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

    class Config:
        from_attributes = True
