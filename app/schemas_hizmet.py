from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class HizmetBase(BaseModel):
    Kod: str
    Ad: str
    GrupKod: Optional[str] = None
    Birim: Optional[str] = None
    Fiyat: Optional[Decimal] = None
    ParaBirimi: str = "TRY"
    KdvOrani: Optional[Decimal] = None
    SiraNo: Optional[int] = None
    AktifMi: bool = True


class HizmetCreate(HizmetBase):
    pass


class HizmetUpdate(BaseModel):
    Kod: Optional[str] = None
    Ad: Optional[str] = None
    GrupKod: Optional[str] = None
    Birim: Optional[str] = None
    Fiyat: Optional[Decimal] = None
    ParaBirimi: Optional[str] = None
    KdvOrani: Optional[Decimal] = None
    SiraNo: Optional[int] = None
    AktifMi: Optional[bool] = None


class HizmetResponse(HizmetBase):
    Id: int
    CreatedAt: datetime
    UpdatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True
