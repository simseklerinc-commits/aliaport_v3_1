from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Numeric,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from .database import Base


class Motorbot(Base):
    __tablename__ = "Motorbot"

    Id = Column(Integer, primary_key=True, index=True)
    Kod = Column(String(50), unique=True, nullable=False)
    Ad = Column(String(200), nullable=False)
    Plaka = Column(String(20), nullable=True)
    KapasiteTon = Column(Numeric(10, 2), nullable=True)
    MaxHizKnot = Column(Numeric(6, 2), nullable=True)
    OwnerCariId = Column(Integer, ForeignKey("Cari.Id"), nullable=True)
    OwnerCariKod = Column(String(50), nullable=True)
    Durum = Column(String(20), nullable=False, default="AKTIF")
    AlisTarihi = Column(Date, nullable=True)
    Notlar = Column(String, nullable=True)
    CreatedAt = Column(DateTime, nullable=False)
    CreatedBy = Column(Integer, nullable=True)
    UpdatedAt = Column(DateTime, nullable=True)
    UpdatedBy = Column(Integer, nullable=True)

    trips = relationship("MbTrip", back_populates="motorbot")


class MbTrip(Base):
    __tablename__ = "MbTrip"

    Id = Column(Integer, primary_key=True, index=True)
    MotorbotId = Column(Integer, ForeignKey("Motorbot.Id"), nullable=False)

    SeferTarihi = Column(Date, nullable=False)
    CikisZamani = Column(DateTime, nullable=True)
    DonusZamani = Column(DateTime, nullable=True)
    KalkisIskele = Column(String(100), nullable=True)
    VarisIskele = Column(String(100), nullable=True)

    CariId = Column(Integer, ForeignKey("Cari.Id"), nullable=True)
    CariKod = Column(String(50), nullable=True)

    YukAciklama = Column(String(200), nullable=True)
    Notlar = Column(String, nullable=True)

    Durum = Column(String(20), nullable=False, default="PLANLANDI")
    FaturaDurumu = Column(String(20), nullable=True)

    CreatedAt = Column(DateTime, nullable=False)
    CreatedBy = Column(Integer, nullable=True)
    UpdatedAt = Column(DateTime, nullable=True)
    UpdatedBy = Column(Integer, nullable=True)

    motorbot = relationship("Motorbot", back_populates="trips")
