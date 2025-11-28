from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Index
from sqlalchemy.sql import func
from ...config.database import Base


class ExchangeRate(Base):
    """
    Döviz Kuru Modeli (EVDS/TCMB Entegrasyonu)
    
    EVDS Veri Yapısı:
    - Tarih: DD-MM-YYYY (RateDate)
    - Döviz Kodu: USD, EUR, GBP, CHF, JPY (CurrencyFrom)
    - Ana Para Birimi: TRY (CurrencyTo)
    - Döviz Alış: Forex Buying Rate (Rate)
    - Döviz Satış: Forex Selling Rate (SellRate)
    - Efektif Alış: Banknote Buying Rate (BanknoteBuyingRate)
    - Efektif Satış: Banknote Selling Rate (BanknoteSellRate)
    - Kaynak: EVDS, TCMB, MANUEL (Source)
    
    Örnek:
    - CurrencyFrom: "USD"
    - CurrencyTo: "TRY"
    - Rate: 34.5678 (Döviz Alış)
    - SellRate: 34.6789 (Döviz Satış)
    - BanknoteBuyingRate: 34.5000 (Efektif Alış)
    - BanknoteSellRate: 34.7000 (Efektif Satış)
    - RateDate: 2025-11-24
    - Source: "EVDS"
    """
    __tablename__ = "ExchangeRate"
    __table_args__ = (
        # Compound index: Hızlı tarih + döviz sorguları için
        Index('ix_exchangerate_date_currency', 'RateDate', 'CurrencyFrom'),
        # Uniqueness: Aynı tarih + döviz için tek kayıt (UPSERT için)
        Index('ix_exchangerate_unique', 'RateDate', 'CurrencyFrom', 'CurrencyTo', unique=True),
        {"extend_existing": True}
    )
    
    Id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Döviz Bilgileri
    CurrencyFrom = Column(String(10), nullable=False, index=True, comment="Kaynak döviz (USD, EUR, GBP, CHF, JPY)")
    CurrencyTo = Column(String(10), nullable=False, default="TRY", comment="Hedef para birimi (varsayılan: TRY)")
    
    # Döviz Kurları (TCMB/EVDS Standart)
    Rate = Column(Float, nullable=False, comment="Döviz Alış Kuru (Forex Buying)")
    SellRate = Column(Float, nullable=True, comment="Döviz Satış Kuru (Forex Selling)")
    BanknoteBuyingRate = Column(Float, nullable=True, comment="Efektif Alış Kuru (Banknote Buying)")
    BanknoteSellRate = Column(Float, nullable=True, comment="Efektif Satış Kuru (Banknote Selling)")
    
    # Tarih ve Kaynak
    RateDate = Column(Date, nullable=False, index=True, comment="Kur tarihi")
    Source = Column(String(50), nullable=True, default="EVDS", comment="Veri kaynağı (EVDS, TCMB, MANUEL)")
    
    # Audit Fields
    CreatedAt = Column(DateTime, nullable=False, default=func.now(), comment="Kayıt oluşturma zamanı")
    UpdatedAt = Column(DateTime, nullable=True, onupdate=func.now(), comment="Son güncelleme zamanı")
    
    def __repr__(self):
        return (
            f"<ExchangeRate(Id={self.Id}, "
            f"{self.CurrencyFrom}/{self.CurrencyTo}, "
            f"Alış={self.Rate:.4f}, Satış={self.SellRate:.4f if self.SellRate else 'N/A'}, "
            f"Tarih={self.RateDate}, Kaynak={self.Source})>"
        )
    
    def to_dict(self):
        """Dict representation (API response için)"""
        return {
            "Id": self.Id,
            "CurrencyFrom": self.CurrencyFrom,
            "CurrencyTo": self.CurrencyTo,
            "Rate": self.Rate,
            "SellRate": self.SellRate,
            "BanknoteBuyingRate": self.BanknoteBuyingRate,
            "BanknoteSellRate": self.BanknoteSellRate,
            "RateDate": self.RateDate.isoformat() if self.RateDate else None,
            "Source": self.Source,
            "CreatedAt": self.CreatedAt.isoformat() if self.CreatedAt else None,
            "UpdatedAt": self.UpdatedAt.isoformat() if self.UpdatedAt else None
        }
