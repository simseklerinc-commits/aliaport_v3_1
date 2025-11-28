from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List, Generic, TypeVar

T = TypeVar('T')

class ExchangeRateBase(BaseModel):
    """
    Döviz Kuru Base Schema (EVDS/TCMB Standart)
    
    Fields:
    - CurrencyFrom: Kaynak döviz (USD, EUR, GBP, CHF, JPY)
    - CurrencyTo: Hedef para birimi (varsayılan: TRY)
    - Rate: Döviz Alış Kuru (Forex Buying)
    - SellRate: Döviz Satış Kuru (Forex Selling)
    - BanknoteBuyingRate: Efektif Alış (Banknote Buying)
    - BanknoteSellRate: Efektif Satış (Banknote Selling)
    - RateDate: Kur tarihi
    - Source: Veri kaynağı (EVDS, TCMB, MANUEL)
    """
    CurrencyFrom: str = Field(..., max_length=10, description="Kaynak döviz (USD, EUR, GBP, CHF, JPY)")
    CurrencyTo: str = Field(default="TRY", max_length=10, description="Hedef para birimi (varsayılan: TRY)")
    Rate: float = Field(..., gt=0, description="Döviz Alış Kuru (Forex Buying)")
    SellRate: Optional[float] = Field(None, gt=0, description="Döviz Satış Kuru (Forex Selling)")
    BanknoteBuyingRate: Optional[float] = Field(None, gt=0, description="Efektif Alış Kuru (Banknote Buying)")
    BanknoteSellRate: Optional[float] = Field(None, gt=0, description="Efektif Satış Kuru (Banknote Selling)")
    RateDate: date = Field(..., description="Kur tarihi")
    Source: Optional[str] = Field(default="EVDS", max_length=50, description="Veri kaynağı (EVDS, TCMB, MANUEL)")

class ExchangeRateCreate(ExchangeRateBase):
    """Yeni kur oluşturma schema"""
    pass

class ExchangeRateUpdate(BaseModel):
    """Kur güncelleme schema (partial update)"""
    CurrencyFrom: Optional[str] = Field(None, max_length=10)
    CurrencyTo: Optional[str] = Field(None, max_length=10)
    Rate: Optional[float] = Field(None, gt=0)
    SellRate: Optional[float] = Field(None, gt=0)
    BanknoteBuyingRate: Optional[float] = Field(None, gt=0)
    BanknoteSellRate: Optional[float] = Field(None, gt=0)
    RateDate: Optional[date] = None
    Source: Optional[str] = Field(None, max_length=50)

class ExchangeRate(ExchangeRateBase):
    """Kur response schema (DB model ile mapping)"""
    Id: int
    CreatedAt: datetime
    UpdatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaginatedExchangeRateResponse(BaseModel):
    """Sayfalanmış kur listesi response"""
    items: List[ExchangeRate]
    total: int
    page: int
    page_size: int
    total_pages: int

class BulkExchangeRateRequest(BaseModel):
    """Toplu kur ekleme request"""
    rates: List[ExchangeRateCreate]

class FetchAPIRequest(BaseModel):
    """EVDS/TCMB API'den kur çekme request"""
    date: Optional[str] = Field(
        None, 
        description="YYYY-MM-DD formatında tarih (opsiyonel, default: bugün)",
        example="2025-11-24"
    )
    currencies: Optional[List[str]] = Field(
        None,
        description="Çekilecek dövizler (opsiyonel, default: tümü)",
        example=["USD", "EUR", "GBP"]
    )

class FetchTCMBRequest(FetchAPIRequest):
    """TCMB XML API request (geriye dönük uyumluluk)"""
    pass
