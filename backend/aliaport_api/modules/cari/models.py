# backend/aliaport_api/modules/cari/models.py
# .py - Tüm modeller birleştirilmiş
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


class Cari(Base):
    __tablename__ = "Cari"
    __table_args__ = {"extend_existing": True}

    Id = Column(Integer, primary_key=True)
    CariKod = Column(String(50), unique=True, nullable=False, index=True)
    Unvan = Column(String(200), nullable=False)
    CariTip = Column(String(20), nullable=False)  # GERCEK / TUZEL
    Rol = Column(String(20), nullable=False)  # MUSTERI / TEDARIKCI / DIGER

    VergiDairesi = Column(String(100))
    VergiNo = Column(String(20))
    Tckn = Column(String(11))

    Ulke = Column(String(50))
    Il = Column(String(50))
    Ilce = Column(String(50))
    Adres = Column(String(500))

    Telefon = Column(String(50))
    Eposta = Column(String(100))
    IletisimKisi = Column(String(100))  # Contact Person
    Iban = Column(String(34))

    VadeGun = Column(Integer)
    ParaBirimi = Column(String(10))
    Notlar = Column(String(1000))  # Notes
    AktifMi = Column(Boolean, nullable=False, default=True)

    # SQLite için datetime kullanıyoruz
    CreatedAt = Column(DateTime, nullable=False, default=func.now())
    UpdatedAt = Column(DateTime, onupdate=func.now())
    CreatedBy = Column(Integer)  # FK → users
    UpdatedBy = Column(Integer)  # FK → users


# Note: Motorbot and MbTrip models removed - they now live only in motorbot module
