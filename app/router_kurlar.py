from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from .database import get_db
from .models_kurlar import ExchangeRate as ExchangeRateModel
from .schemas_kurlar import ExchangeRate, ExchangeRateCreate, ExchangeRateUpdate

router = APIRouter()

# ============================================
# EXCHANGE RATE ENDPOINTS
# ============================================

@router.get("/", response_model=List[ExchangeRate])
def get_exchange_rates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    currency_from: Optional[str] = None,
    currency_to: Optional[str] = None,
    rate_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """
    Döviz kurlarını listele - filtreleme seçenekleri ile
    """
    query = db.query(ExchangeRateModel)
    
    if currency_from:
        query = query.filter(ExchangeRateModel.CurrencyFrom == currency_from)
    
    if currency_to:
        query = query.filter(ExchangeRateModel.CurrencyTo == currency_to)
    
    if rate_date:
        query = query.filter(ExchangeRateModel.RateDate == rate_date)
    
    # En yeni tarihler önce gelsin
    query = query.order_by(ExchangeRateModel.RateDate.desc(), ExchangeRateModel.Id.desc())
    
    rates = query.offset(skip).limit(limit).all()
    return rates

@router.get("/today", response_model=List[ExchangeRate])
def get_today_rates(db: Session = Depends(get_db)):
    """
    Bugünün tüm kurlarını getir
    """
    from datetime import date
    today = date.today()
    
    rates = db.query(ExchangeRateModel).filter(
        ExchangeRateModel.RateDate == today
    ).all()
    
    return rates

@router.get("/date/{rate_date}", response_model=List[ExchangeRate])
def get_rates_by_date(rate_date: date, db: Session = Depends(get_db)):
    """
    Belirli tarihteki tüm kurları getir
    """
    rates = db.query(ExchangeRateModel).filter(
        ExchangeRateModel.RateDate == rate_date
    ).all()
    
    return rates

@router.get("/latest/{currency_from}/{currency_to}", response_model=ExchangeRate)
def get_latest_rate(
    currency_from: str,
    currency_to: str,
    db: Session = Depends(get_db)
):
    """
    İki para birimi arasındaki en güncel kuru getir
    """
    rate = db.query(ExchangeRateModel).filter(
        ExchangeRateModel.CurrencyFrom == currency_from,
        ExchangeRateModel.CurrencyTo == currency_to
    ).order_by(ExchangeRateModel.RateDate.desc()).first()
    
    if not rate:
        raise HTTPException(
            status_code=404,
            detail=f"Kur bulunamadı: {currency_from}/{currency_to}"
        )
    
    return rate

@router.get("/{currency_from}/{currency_to}/{rate_date}", response_model=ExchangeRate)
def get_rate_by_date(
    currency_from: str,
    currency_to: str,
    rate_date: date,
    db: Session = Depends(get_db)
):
    """
    Belirli tarihteki belirli para birimi kurunu getir
    """
    rate = db.query(ExchangeRateModel).filter(
        ExchangeRateModel.CurrencyFrom == currency_from,
        ExchangeRateModel.CurrencyTo == currency_to,
        ExchangeRateModel.RateDate == rate_date
    ).first()
    
    if not rate:
        raise HTTPException(
            status_code=404,
            detail=f"Kur bulunamadı: {currency_from}/{currency_to} - {rate_date}"
        )
    
    return rate

@router.get("/{rate_id}", response_model=ExchangeRate)
def get_exchange_rate(rate_id: int, db: Session = Depends(get_db)):
    """
    Tek bir kur kaydını ID ile getir
    """
    rate = db.query(ExchangeRateModel).filter(ExchangeRateModel.Id == rate_id).first()
    
    if not rate:
        raise HTTPException(status_code=404, detail="Kur kaydı bulunamadı")
    
    return rate

@router.post("/", response_model=ExchangeRate)
def create_exchange_rate(rate: ExchangeRateCreate, db: Session = Depends(get_db)):
    """
    Yeni döviz kuru kaydı oluştur
    """
    # Aynı tarih ve para birimi için kayıt var mı kontrol et
    existing = db.query(ExchangeRateModel).filter(
        ExchangeRateModel.CurrencyFrom == rate.CurrencyFrom,
        ExchangeRateModel.CurrencyTo == rate.CurrencyTo,
        ExchangeRateModel.RateDate == rate.RateDate
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Bu tarih için kur zaten mevcut: {rate.CurrencyFrom}/{rate.CurrencyTo} - {rate.RateDate}"
        )
    
    db_rate = ExchangeRateModel(**rate.model_dump())
    db.add(db_rate)
    db.commit()
    db.refresh(db_rate)
    return db_rate

@router.put("/{rate_id}", response_model=ExchangeRate)
def update_exchange_rate(
    rate_id: int,
    rate: ExchangeRateUpdate,
    db: Session = Depends(get_db)
):
    """
    Mevcut kur kaydını güncelle
    """
    db_rate = db.query(ExchangeRateModel).filter(ExchangeRateModel.Id == rate_id).first()
    
    if not db_rate:
        raise HTTPException(status_code=404, detail="Kur kaydı bulunamadı")
    
    update_data = rate.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_rate, field, value)
    
    db.commit()
    db.refresh(db_rate)
    return db_rate

@router.delete("/{rate_id}")
def delete_exchange_rate(rate_id: int, db: Session = Depends(get_db)):
    """
    Kur kaydını sil
    """
    db_rate = db.query(ExchangeRateModel).filter(ExchangeRateModel.Id == rate_id).first()
    
    if not db_rate:
        raise HTTPException(status_code=404, detail="Kur kaydı bulunamadı")
    
    db.delete(db_rate)
    db.commit()
    
    return {"message": "Kur kaydı silindi", "id": rate_id}
