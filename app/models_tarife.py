from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, Date, Text
from sqlalchemy.sql import func
from .database import Base


class PriceList(Base):
    """Tarife (Fiyat Listesi) - Ana tarife başlığı"""
    __tablename__ = "PriceList"

    Id = Column(Integer, primary_key=True, index=True)
    Kod = Column(String(50), unique=True, nullable=False, index=True)
    Ad = Column(String(200), nullable=False)
    Aciklama = Column(Text, nullable=True)
    ParaBirimi = Column(String(10), nullable=False, default="TRY")
    Versiyon = Column(Integer, nullable=False, default=1)
    Durum = Column(String(20), nullable=False, default="TASLAK")  # TASLAK, AKTIF, PASIF
    GecerlilikBaslangic = Column(Date, nullable=True)
    GecerlilikBitis = Column(Date, nullable=True)
    AktifMi = Column(Boolean, nullable=False, default=True)
    
    # Otomatik timestamp alanları
    CreatedAt = Column(DateTime, nullable=False, default=func.now())
    UpdatedAt = Column(DateTime, onupdate=func.now())


class PriceListItem(Base):
    """Tarife Kalemi - Tarife içindeki hizmet ve fiyatları"""
    __tablename__ = "PriceListItem"

    Id = Column(Integer, primary_key=True, index=True)
    PriceListId = Column(Integer, nullable=False, index=True)  # Foreign key to PriceList
    HizmetKodu = Column(String(50), nullable=False)  # Service code
    HizmetAdi = Column(String(200), nullable=False)  # Service name
    Birim = Column(String(20), nullable=True)
    BirimFiyat = Column(Numeric(18, 4), nullable=False)
    KdvOrani = Column(Numeric(5, 2), nullable=True, default=20)
    Aciklama = Column(Text, nullable=True)
    SiraNo = Column(Integer, nullable=True)
    AktifMi = Column(Boolean, nullable=False, default=True)
    
    # Otomatik timestamp alanları
    CreatedAt = Column(DateTime, nullable=False, default=func.now())
    UpdatedAt = Column(DateTime, onupdate=func.now())
