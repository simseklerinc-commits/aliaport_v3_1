# backend/aliaport_api/modules/motorbot/models.py
"""
Motorbot (Tekne) ve MbTrip (Sefer) modelleri
"""
from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Numeric,
    Boolean,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ...config.database import Base


class Motorbot(Base):
    __tablename__ = "Motorbot"
    __table_args__ = {"extend_existing": True}

    Id = Column(Integer, primary_key=True)
    Kod = Column(String(50), unique=True, nullable=False, index=True)
    Ad = Column(String(200), nullable=False)
    Plaka = Column(String(20), nullable=True)
    KapasiteTon = Column(Numeric(10, 2), nullable=True)
    MaxHizKnot = Column(Numeric(6, 2), nullable=True)
    OwnerCariId = Column(Integer, ForeignKey("Cari.Id"), nullable=True)
    OwnerCariKod = Column(String(50), nullable=True)
    Durum = Column(String(20), nullable=False, default="AKTIF", index=True)
    AlisTarihi = Column(Date, nullable=True)
    Notlar = Column(String, nullable=True)
    
    # Otomatik timestamp alanları
    CreatedAt = Column(DateTime, nullable=False, default=func.now())
    CreatedBy = Column(Integer, nullable=True)
    UpdatedAt = Column(DateTime, onupdate=func.now())
    UpdatedBy = Column(Integer, nullable=True)

    trips = relationship("MbTrip", back_populates="motorbot")


class MbTrip(Base):
    __tablename__ = "MbTrip"
    __table_args__ = {"extend_existing": True}

    Id = Column(Integer, primary_key=True)
    MotorbotId = Column(Integer, ForeignKey("Motorbot.Id"), nullable=False, index=True)

    SeferTarihi = Column(Date, nullable=False, index=True)
    CikisZamani = Column(DateTime, nullable=True)
    DonusZamani = Column(DateTime, nullable=True)
    KalkisIskele = Column(String(100), nullable=True)
    VarisIskele = Column(String(100), nullable=True)

    CariId = Column(Integer, ForeignKey("Cari.Id"), nullable=True)
    CariKod = Column(String(50), nullable=True)

    YukAciklama = Column(String(200), nullable=True)
    Notlar = Column(String, nullable=True)

    Durum = Column(String(20), nullable=False, default="PLANLANDI", index=True)
    FaturaDurumu = Column(String(20), nullable=True)

    # Otomatik timestamp alanları
    CreatedAt = Column(DateTime, nullable=False, default=func.now())
    CreatedBy = Column(Integer, nullable=True)
    UpdatedAt = Column(DateTime, onupdate=func.now())
    UpdatedBy = Column(Integer, nullable=True)

    motorbot = relationship("Motorbot", back_populates="trips")
