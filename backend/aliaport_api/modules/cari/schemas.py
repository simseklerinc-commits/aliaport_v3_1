# app/schemas.py - Tüm Pydantic schemas
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


# -------- CARI --------
class CariBase(BaseModel):
    CariKod: str
    Unvan: str
    CariTip: str
    Rol: str

    VergiDairesi: Optional[str] = None
    VergiNo: Optional[str] = None
    Tckn: Optional[str] = None

    Ulke: Optional[str] = None
    Il: Optional[str] = None
    Ilce: Optional[str] = None
    Adres: Optional[str] = None

    Telefon: Optional[str] = None
    Eposta: Optional[EmailStr] = None
    IletisimKisi: Optional[str] = None  # Contact Person
    Iban: Optional[str] = None

    VadeGun: Optional[int] = None
    ParaBirimi: Optional[str] = "TRY"
    Notlar: Optional[str] = None  # Notes
    AktifMi: bool = True


class CariCreate(CariBase):
    pass


class CariUpdate(CariBase):
    pass


class CariOut(CariBase):
    Id: int
    CreatedAt: Optional[datetime] = None
    UpdatedAt: Optional[datetime] = None
    CreatedBy: Optional[int] = None
    UpdatedBy: Optional[int] = None

    class Config:
        from_attributes = True


# Note: Motorbot and MbTrip schemas removed - they now live only in motorbot/schemas.py
