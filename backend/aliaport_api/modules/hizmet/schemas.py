from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime, date
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
    CalculationType: Optional[str] = None
    FormulaParams: Optional[Dict[str, Any]] = None
    RequiresPersonCount: Optional[bool] = False
    RequiresVehicleInfo: Optional[bool] = False
    RequiresWeightInfo: Optional[bool] = False

    class Config:
        from_attributes = True


class PriceCalculationRequest(BaseModel):
    """Otomatik fiyat hesaplama isteği"""
    
    hizmet_id: int = Field(..., description="Hizmet ID")
    effective_date: Optional[date] = Field(None, description="Hesaplama tarihi (tarife versiyonu için)")
    
    # Hesaplama parametreleri (hizmet tipine göre)
    quantity: Optional[int] = Field(None, description="Miktar (PER_UNIT, PER_BLOCK için)")
    person_count: Optional[int] = Field(None, description="Kişi sayısı (RequiresPersonCount=True için)")
    
    # X_SECONDARY için
    multiplier_x: Optional[Decimal] = Field(None, description="Çarpan değeri (X_SECONDARY için)")
    secondary_value: Optional[Decimal] = Field(None, description="İkincil değer (ton, GT vb.)")
    
    # PER_BLOCK için
    block_size: Optional[int] = Field(None, description="Blok boyutu (kaç birimde bir blok)")
    total_duration: Optional[int] = Field(None, description="Toplam süre (saat, gün vb.)")
    
    # BASE_PLUS_INCREMENT için
    increment_value: Optional[Decimal] = Field(None, description="Artış değeri (ton, GT vb.)")
    
    # VEHICLE_4H_RULE için
    vehicle_duration_minutes: Optional[int] = Field(None, description="Araç kalış süresi (dakika)")
    
    # Override fiyat (opsiyonel - TarifeListesi'nden gelir)
    override_price: Optional[Decimal] = Field(None, description="Manuel fiyat override")
    override_currency: Optional[str] = Field(None, description="Override para birimi")
    
    class Config:
        json_schema_extra = {
            "example": {
                "hizmet_id": 123,
                "effective_date": "2025-01-15",
                "quantity": 5,
                "person_count": 3
            }
        }


class PriceCalculationResponse(BaseModel):
    """Otomatik fiyat hesaplama sonucu"""
    
    hizmet_id: int
    hizmet_kod: str
    hizmet_ad: str
    
    calculation_type: str
    formula_used: str
    
    calculated_price: Decimal
    currency: str
    
    tarife_override_applied: bool = False
    tarife_listesi_id: Optional[int] = None
    
    breakdown: Dict[str, Any] = Field(
        default_factory=dict,
        description="Hesaplama detayları (formül parametreleri, ara sonuçlar)"
    )
    
    effective_date: date
    
    class Config:
        json_schema_extra = {
            "example": {
                "hizmet_id": 123,
                "hizmet_kod": "TECH_TRANSFER",
                "hizmet_ad": "Teknik Personel Transferi",
                "calculation_type": "PER_UNIT",
                "formula_used": "base_price × quantity × person_count",
                "calculated_price": 60.00,
                "currency": "USD",
                "tarife_override_applied": False,
                "breakdown": {
                    "base_price": 20.00,
                    "quantity": 1,
                    "person_count": 3,
                    "total": 60.00
                },
                "effective_date": "2025-01-15"
            }
        }
