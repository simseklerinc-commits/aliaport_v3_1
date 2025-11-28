from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, Text, Date, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from ...config.database import Base


class CalculationType(str, enum.Enum):
    """
    Hesaplama Tipleri - Excel FiyatModeli ile uyumlu
    
    Excel Mapping:
    - PER_UNIT → Birim başı (fiyat × miktar)
    - X_SECONDARY → İki boyutlu (ardiye: KG × GÜN)
    - PER_BLOCK → Blok bazlı (forklift: ton/3 × dakika/30)
    - BASE_PLUS_INCREMENT → Baz + artış (liman: 950 + GRT×0.03)
    - VEHICLE_4H_RULE → Araç 4 saat kuralı (240 dk kesin + fazlası)
    """
    FIXED = "FIXED"                          # Sabit ücret
    PER_UNIT = "PER_UNIT"                    # Birim başı çarpma
    X_SECONDARY = "X_SECONDARY"              # İki parametre çarpımı
    PER_BLOCK = "PER_BLOCK"                  # Blok hesaplama
    BASE_PLUS_INCREMENT = "BASE_PLUS_INCREMENT"  # Baz fiyat + artış
    VEHICLE_4H_RULE = "VEHICLE_4H_RULE"      # Araç giriş 4 saat kuralı


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
    
    # YENİ: Excel Tarife Yapısı Entegrasyonu (25 Kasım 2025)
    CalculationType = Column(SQLEnum(CalculationType), default=CalculationType.FIXED, nullable=True)
    FormulaParams = Column(JSON, nullable=True)  # Excel ModelParam JSON
    
    # YENİ: İş Emri Gereksinimleri
    RequiresPersonCount = Column(Boolean, default=False, nullable=False)  # Kişi sayısı gerekli mi?
    RequiresVehicleInfo = Column(Boolean, default=False, nullable=False)  # Araç bilgisi gerekli mi?
    RequiresWeightInfo = Column(Boolean, default=False, nullable=False)   # Ağırlık bilgisi gerekli mi?
    
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


class TarifeListesi(Base):
    """
    Tarife Listesi - Tarih bazlı fiyat versiyonlaması
    
    Her hizmet için tarih aralığına göre farklı fiyatlar tanımlanabilir.
    Yeni tarife başladığında eski tarife otomatik pasif olur.
    
    Örnek:
    - 2025-01-01 → 2025-06-30: Transpalet 20 USD/saat
    - 2025-07-01 → NULL: Transpalet 22 USD/saat (aktif)
    """
    __tablename__ = "TarifeListesi"
    __table_args__ = {"extend_existing": True}
    
    Id = Column(Integer, primary_key=True, index=True)
    
    # Hizmet FK
    HizmetId = Column(Integer, ForeignKey("Hizmet.Id"), nullable=False, index=True)
    
    # Geçerlilik Tarihleri
    ValidFrom = Column(Date, nullable=False, index=True)  # Başlangıç tarihi (dahil)
    ValidTo = Column(Date, nullable=True, index=True)      # Bitiş tarihi (NULL ise sonsuz)
    
    # Fiyat Override (Tarife farklıysa)
    OverridePrice = Column(Numeric(18, 4), nullable=True)
    OverrideCurrency = Column(String(10), nullable=True)
    OverrideKdvOrani = Column(Numeric(5, 2), nullable=True)
    
    # Durum
    IsActive = Column(Boolean, default=True, nullable=False, index=True)
    
    # Notlar
    VersionNote = Column(Text, nullable=True)  # "2025 Yaz Tarifesi"
    
    # Audit
    CreatedAt = Column(DateTime, nullable=False, default=func.now())
    CreatedBy = Column(Integer, nullable=True)  # FK → users


# Excel'den veri import için mapping
EXCEL_CALCULATION_TYPE_MAPPING = {
    "PER_UNIT": CalculationType.PER_UNIT,
    "X_SECONDARY": CalculationType.X_SECONDARY,
    "PER_UNIT_X_SECONDARY": CalculationType.X_SECONDARY,  # Alias
    "PER_BLOCK": CalculationType.PER_BLOCK,
    "BASE_PLUS_INCREMENT": CalculationType.BASE_PLUS_INCREMENT,
    None: CalculationType.FIXED,  # Boşsa FIXED
    "": CalculationType.FIXED,
}
