from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel

# MbTrip (Sefer) şema tanımları (motorbot modülündeki ile uyumlu)
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
