# NOTE: Barınma (accommodation/berth contract) model - schema.sql ve API_SQL_MAPPING.md'ye uyumlu
from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, Text, Date, ForeignKey
from sqlalchemy.sql import func
from .database import Base


class BarinmaContract(Base):
    """
    Barınma Kontratları - Motorbot konaklama kontratları
    SQL Tablo: barinma_contract
    """
    __tablename__ = "barinma_contract"

    # Primary Key
    Id = Column(Integer, primary_key=True, index=True)
    
    # Contract Info
    ContractNumber = Column(String(50), unique=True, nullable=False, index=True)
    
    # Foreign Keys (RESTRICT - veri kaybını önler)
    MotorbotId = Column(Integer, nullable=False, index=True)  # FK → motorbot.Id
    CariId = Column(Integer, nullable=False, index=True)  # FK → tmm_cari.Id
    ServiceCardId = Column(Integer, nullable=False)  # FK → service_card.Id
    PriceListId = Column(Integer, nullable=False)  # FK → price_list.Id
    
    # Date Range
    StartDate = Column(Date, nullable=False)
    EndDate = Column(Date, nullable=True)  # NULL = open-ended contract
    
    # Pricing
    UnitPrice = Column(Numeric(15, 2), nullable=False)
    Currency = Column(String(3), nullable=False, default="TRY")
    VatRate = Column(Numeric(5, 2), nullable=False, default=20.00)
    
    # Billing Configuration
    BillingPeriod = Column(String(20), nullable=False, default="MONTHLY")  # MONTHLY, QUARTERLY, YEARLY
    
    # Status & Notes
    IsActive = Column(Boolean, nullable=False, default=True, index=True)
    Notes = Column(Text, nullable=True)
    
    # Audit Fields
    CreatedAt = Column(DateTime, nullable=False, default=func.now())
    UpdatedAt = Column(DateTime, onupdate=func.now())
    CreatedBy = Column(Integer, nullable=True)  # FK → users
    UpdatedBy = Column(Integer, nullable=True)  # FK → users
