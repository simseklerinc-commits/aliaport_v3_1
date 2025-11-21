from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from .database import Base


class Parametre(Base):
    __tablename__ = "Parametre"

    Id = Column(Integer, primary_key=True, index=True)
    Kategori = Column(String(50), nullable=False, index=True)
    Kod = Column(String(100), nullable=False, unique=True, index=True)
    Ad = Column(String(200), nullable=False)
    Deger = Column(String(500), nullable=True)
    Aciklama = Column(String(1000), nullable=True)
    AktifMi = Column(Boolean, nullable=False, default=True)
    
    # Otomatik timestamp alanları
    CreatedAt = Column(DateTime, nullable=False, default=func.now())
    UpdatedAt = Column(DateTime, onupdate=func.now())
