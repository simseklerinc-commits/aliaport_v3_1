from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


# ============================================
# PRICE LIST SCHEMAS
# ============================================

class PriceListBase(BaseModel):
    Kod: str
    Ad: str
    Aciklama: Optional[str] = None
    ParaBirimi: str = "TRY"
    Versiyon: int = 1
    Durum: str = "TASLAK"  # TASLAK, AKTIF, PASIF
    GecerlilikBaslangic: Optional[date] = None
    GecerlilikBitis: Optional[date] = None
    AktifMi: bool = True


class PriceListCreate(PriceListBase):
    pass


class PriceListUpdate(BaseModel):
    Kod: Optional[str] = None
    Ad: Optional[str] = None
    Aciklama: Optional[str] = None
    ParaBirimi: Optional[str] = None
    Versiyon: Optional[int] = None
    Durum: Optional[str] = None
    GecerlilikBaslangic: Optional[date] = None
    GecerlilikBitis: Optional[date] = None
    AktifMi: Optional[bool] = None


class PriceListResponse(PriceListBase):
    Id: int
    CreatedAt: datetime
    UpdatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================
# PRICE LIST ITEM SCHEMAS
# ============================================

class PriceListItemBase(BaseModel):
    PriceListId: int
    HizmetKodu: str
    HizmetAdi: str
    Birim: Optional[str] = None
    BirimFiyat: Decimal
    KdvOrani: Optional[Decimal] = 20
    Aciklama: Optional[str] = None
    SiraNo: Optional[int] = None
    AktifMi: bool = True


class PriceListItemCreate(PriceListItemBase):
    pass


class PriceListItemUpdate(BaseModel):
    PriceListId: Optional[int] = None
    HizmetKodu: Optional[str] = None
    HizmetAdi: Optional[str] = None
    Birim: Optional[str] = None
    BirimFiyat: Optional[Decimal] = None
    KdvOrani: Optional[Decimal] = None
    Aciklama: Optional[str] = None
    SiraNo: Optional[int] = None
    AktifMi: Optional[bool] = None


class PriceListItemResponse(PriceListItemBase):
    Id: int
    CreatedAt: datetime
    UpdatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================
# COMBINED SCHEMAS
# ============================================

class PriceListWithItems(PriceListResponse):
    """Tarife + Kalemleri birlikte"""
    items: List[PriceListItemResponse] = []


# ============================================
# PAGINATION
# ============================================

class PaginatedPriceListResponse(BaseModel):
    items: List[PriceListResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
