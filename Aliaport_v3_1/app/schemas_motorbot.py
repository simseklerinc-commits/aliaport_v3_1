from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


# -------- MOTORBOT --------
class MotorbotBase(BaseModel):
    Kod: str
    Ad: str
    Plaka: Optional[str] = None
    KapasiteTon: Optional[float] = None
    MaxHizKnot: Optional[float] = None
    OwnerCariId: Optional[int] = None
    OwnerCariKod: Optional[str] = None
    Durum: str = "AKTIF"
    AlisTarihi: Optional[date] = None
    Notlar: Optional[str] = None


class MotorbotCreate(MotorbotBase):
    pass


class MotorbotUpdate(BaseModel):
    Kod: Optional[str] = None
    Ad: Optional[str] = None
    Plaka: Optional[str] = None
    KapasiteTon: Optional[float] = None
    MaxHizKnot: Optional[float] = None
    OwnerCariId: Optional[int] = None
    OwnerCariKod: Optional[str] = None
    Durum: Optional[str] = None
    AlisTarihi: Optional[date] = None
    Notlar: Optional[str] = None


class MotorbotOut(MotorbotBase):
    Id: int
    CreatedAt: datetime
    UpdatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True  # SQLAlchemy obj → Pydantic


# -------- MB TRIP (SEFER) --------
class MbTripBase(BaseModel):
    MotorbotId: int
    SeferTarihi: date
    CikisZamani: Optional[datetime] = None
    DonusZamani: Optional[datetime] = None
    KalkisIskele: Optional[str] = None
    VarisIskele: Optional[str] = None
    CariId: Optional[int] = None
    CariKod: Optional[str] = None
    YukAciklama: Optional[str] = None
    Notlar: Optional[str] = None
    Durum: str = "PLANLANDI"
    FaturaDurumu: Optional[str] = None


class MbTripCreate(MbTripBase):
    pass


class MbTripUpdate(BaseModel):
    MotorbotId: Optional[int] = None
    SeferTarihi: Optional[date] = None
    CikisZamani: Optional[datetime] = None
    DonusZamani: Optional[datetime] = None
    KalkisIskele: Optional[str] = None
    VarisIskele: Optional[str] = None
    CariId: Optional[int] = None
    CariKod: Optional[str] = None
    YukAciklama: Optional[str] = None
    Notlar: Optional[str] = None
    Durum: Optional[str] = None
    FaturaDurumu: Optional[str] = None


class MbTripOut(MbTripBase):
    Id: int
    CreatedAt: datetime
    UpdatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True
