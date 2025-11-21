from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class HizmetBase(BaseModel):
    Kod: str
    Ad: str
    Aciklama: Optional[str] = None
    MuhasebeKodu: Optional[str] = None
    GrupKod: Optional[str] = None
    Birim: Optional[str] = None
    Fiyat: Optional[Decimal] = None
    ParaBirimi: str = "TRY"
    KdvOrani: Optional[Decimal] = None
    UnitId: Optional[int] = None
    VatRateId: Optional[int] = None
    VatExemptionId: Optional[int] = None
    GroupId: Optional[int] = None
    CategoryId: Optional[int] = None
    PricingRuleId: Optional[int] = None
    MetadataJson: Optional[str] = None
    SiraNo: Optional[int] = None
    AktifMi: bool = True
    CreatedBy: Optional[int] = None
    UpdatedBy: Optional[int] = None


class HizmetCreate(HizmetBase):
    pass


class HizmetUpdate(BaseModel):
    Kod: Optional[str] = None
    Ad: Optional[str] = None
    Aciklama: Optional[str] = None
    MuhasebeKodu: Optional[str] = None
    GrupKod: Optional[str] = None
    Birim: Optional[str] = None
    Fiyat: Optional[Decimal] = None
    ParaBirimi: Optional[str] = None
    KdvOrani: Optional[Decimal] = None
    UnitId: Optional[int] = None
    VatRateId: Optional[int] = None
    VatExemptionId: Optional[int] = None
    GroupId: Optional[int] = None
    CategoryId: Optional[int] = None
    PricingRuleId: Optional[int] = None
    MetadataJson: Optional[str] = None
    SiraNo: Optional[int] = None
    AktifMi: Optional[bool] = None
    CreatedBy: Optional[int] = None
    UpdatedBy: Optional[int] = None


class HizmetResponse(HizmetBase):
    Id: int
    CreatedAt: datetime
    UpdatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True
