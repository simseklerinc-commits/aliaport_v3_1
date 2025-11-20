from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime
from sqlalchemy.sql import func
from .database import Base


class Hizmet(Base):
    __tablename__ = "Hizmet"

    Id = Column(Integer, primary_key=True, index=True)
    Kod = Column(String(50), unique=True, nullable=False, index=True)
    Ad = Column(String(200), nullable=False)
    GrupKod = Column(String(50), nullable=True)
    Birim = Column(String(20), nullable=True)
    Fiyat = Column(Numeric(18, 4), nullable=True)
    ParaBirimi = Column(String(10), nullable=False, default="TRY")
    KdvOrani = Column(Numeric(5, 2), nullable=True)
    SiraNo = Column(Integer, nullable=True)
    AktifMi = Column(Boolean, nullable=False, default=True)
    
    # Otomatik timestamp alanları (Cari ve Motorbot ile aynı pattern)
    CreatedAt = Column(DateTime, nullable=False, default=func.now())
    UpdatedAt = Column(DateTime, onupdate=func.now())
