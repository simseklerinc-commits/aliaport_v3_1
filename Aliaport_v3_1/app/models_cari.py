# app/models_cari.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from .database import Base

class Cari(Base):
    __tablename__ = "Cari"

    Id = Column(Integer, primary_key=True, index=True)
    CariKod = Column(String(50), unique=True, nullable=False, index=True)
    Unvan = Column(String(200), nullable=False)
    CariTip = Column(String(20), nullable=False)      # GERCEK / TUZEL
    Rol = Column(String(20), nullable=False)          # MUSTERI / TEDARIKCI / DIGER

    VergiDairesi = Column(String(100))
    VergiNo = Column(String(20))
    Tckn = Column(String(11))

    Ulke = Column(String(50))
    Il = Column(String(50))
    Ilce = Column(String(50))
    Adres = Column(String(500))

    Telefon = Column(String(50))
    Eposta = Column(String(100))
    Iban = Column(String(34))

    VadeGun = Column(Integer)
    ParaBirimi = Column(String(10))
    AktifMi = Column(Boolean, nullable=False, server_default="1")

    CreatedAt = Column(DateTime(timezone=True), server_default=func.sysdatetime())
    UpdatedAt = Column(DateTime(timezone=True), onupdate=func.sysdatetime())
