from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List, Generic, TypeVar

T = TypeVar('T')

class ExchangeRateBase(BaseModel):
    CurrencyFrom: str = Field(..., max_length=10, description="Para birimi (kaynak)")
    CurrencyTo: str = Field(..., max_length=10, description="Para birimi (hedef)")
    Rate: float = Field(..., gt=0, description="Döviz kuru")
    RateDate: date = Field(..., description="Kur tarihi")
    Source: Optional[str] = Field(None, max_length=50, description="Kur kaynağı (ör: TCMB)")

class ExchangeRateCreate(ExchangeRateBase):
    pass

class ExchangeRateUpdate(BaseModel):
    CurrencyFrom: Optional[str] = Field(None, max_length=10)
    CurrencyTo: Optional[str] = Field(None, max_length=10)
    Rate: Optional[float] = Field(None, gt=0)
    RateDate: Optional[date] = None
    Source: Optional[str] = Field(None, max_length=50)

class ExchangeRate(ExchangeRateBase):
    Id: int
    CreatedAt: datetime

    class Config:
        from_attributes = True

class PaginatedExchangeRateResponse(BaseModel):
    items: List[ExchangeRate]
    total: int
    page: int
    page_size: int
    total_pages: int
