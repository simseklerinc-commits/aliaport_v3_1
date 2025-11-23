from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, Text
from sqlalchemy.sql import func
from ...config.database import Base


class Hizmet(Base):
    __tablename__ = "Hizmet"
    __table_args__ = {"extend_existing": True}

    Id = Column(Integer, primary_key=True)
    Kod = Column(String(50), unique=True, nullable=False, index=True)
    Ad = Column(String(200), nullable=False)
    Aciklama = Column(Text, nullable=True)  # Description
    MuhasebeKodu = Column(String(50), nullable=True)  # Accounting Code
    
    # Basit alanlar (daha sonra FK'e dönüşebilir)
    GrupKod = Column(String(50), nullable=True)
    Birim = Column(String(20), nullable=True)
    
    # Fiyat alanları (Tarife yönetiminde de kullanılıyor)
    Fiyat = Column(Numeric(18, 4), nullable=True)
    ParaBirimi = Column(String(10), nullable=False, default="TRY")
    KdvOrani = Column(Numeric(5, 2), nullable=True)
    
    # İlişkisel alanlar (gelecekte FK olabilir)
    UnitId = Column(Integer, nullable=True)  # FK → parameters.units
    VatRateId = Column(Integer, nullable=True)  # FK → parameters.vat_rates
    VatExemptionId = Column(Integer, nullable=True)  # FK → parameters.vat_exemptions
    GroupId = Column(Integer, nullable=True)  # FK → parameters.service_groups
    CategoryId = Column(Integer, nullable=True)  # FK → parameters.service_categories
    PricingRuleId = Column(Integer, nullable=True)  # FK → parameters.pricing_rules
    
    # Metadata
    MetadataJson = Column(Text, nullable=True)  # JSON metadata (tags, custom fields)
    
    SiraNo = Column(Integer, nullable=True)
    AktifMi = Column(Boolean, nullable=False, default=True)
    
    # Audit fields
    CreatedAt = Column(DateTime, nullable=False, default=func.now())
    UpdatedAt = Column(DateTime, onupdate=func.now())
    CreatedBy = Column(Integer, nullable=True)  # FK → users
    UpdatedBy = Column(Integer, nullable=True)  # FK → users
