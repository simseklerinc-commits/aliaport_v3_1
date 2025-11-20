# app/schemas_cari.py
from pydantic import BaseModel, EmailStr
from typing import Optional

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
    Iban: Optional[str] = None

    VadeGun: Optional[int] = None
    ParaBirimi: Optional[str] = "TRY"
    AktifMi: bool = True

class CariCreate(CariBase):
    pass

class CariUpdate(CariBase):
    pass

class CariOut(CariBase):
    Id: int

    class Config:
        from_attributes = True
