from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from sqlalchemy.sql import func
from .database import Base


class ExchangeRate(Base):
    __tablename__ = "ExchangeRate"
    
    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    CurrencyFrom = Column(String(10), nullable=False, index=True)
    CurrencyTo = Column(String(10), nullable=False, index=True)
    Rate = Column(Float, nullable=False)
    RateDate = Column(Date, nullable=False, index=True)
    Source = Column(String(50), nullable=True)
    CreatedAt = Column(DateTime, nullable=False, default=func.now())
    
    def __repr__(self):
        return f"<ExchangeRate(Id={self.Id}, CurrencyFrom='{self.CurrencyFrom}', CurrencyTo='{self.CurrencyTo}', Rate={self.Rate}, RateDate='{self.RateDate}')>"
