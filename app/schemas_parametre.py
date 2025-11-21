from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ParametreBase(BaseModel):
    Kategori: str
    Kod: str
    Ad: str
    Deger: Optional[str] = None
    Aciklama: Optional[str] = None
    AktifMi: bool = True


class ParametreCreate(ParametreBase):
    pass


class ParametreUpdate(BaseModel):
    Kategori: Optional[str] = None
    Kod: Optional[str] = None
    Ad: Optional[str] = None
    Deger: Optional[str] = None
    Aciklama: Optional[str] = None
    AktifMi: Optional[bool] = None


class ParametreResponse(ParametreBase):
    Id: int
    CreatedAt: datetime
    UpdatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedParametreResponse(BaseModel):
    items: List[ParametreResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
