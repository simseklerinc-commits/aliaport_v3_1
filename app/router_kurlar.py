from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta
import requests
import xml.etree.ElementTree as ET
import os
import pandas as pd

from .database import get_db
from .models_kurlar import ExchangeRate as ExchangeRateModel
from .schemas_kurlar import (
    ExchangeRate, 
    ExchangeRateCreate, 
    ExchangeRateUpdate,
    PaginatedExchangeRateResponse,
    BulkExchangeRateRequest,
    FetchTCMBRequest
)

router = APIRouter()

# ============================================
# EXCHANGE RATE ENDPOINTS
# ============================================

@router.get("/", response_model=PaginatedExchangeRateResponse)
def get_exchange_rates(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    currency_from: Optional[str] = None,
    currency_to: Optional[str] = None,
    rate_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """
    Döviz kurlarını listele - filtreleme ve pagination
    """
    query = db.query(ExchangeRateModel)
    
    if currency_from:
        query = query.filter(ExchangeRateModel.CurrencyFrom == currency_from)
    
    if currency_to:
        query = query.filter(ExchangeRateModel.CurrencyTo == currency_to)
    
    if rate_date:
        query = query.filter(ExchangeRateModel.RateDate == rate_date)
    
    # Toplam kayıt sayısı
    total = query.count()
    
    # En yeni tarihler önce gelsin
    query = query.order_by(ExchangeRateModel.RateDate.desc(), ExchangeRateModel.Id.desc())
    
    # Pagination
    skip = (page - 1) * page_size
    rates = query.offset(skip).limit(page_size).all()
    
    # Total pages hesapla
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return PaginatedExchangeRateResponse(
        items=rates,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

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

@router.get("/convert", response_model=dict)
def convert_currency(
    amount: float = Query(..., gt=0),
    from_currency: str = Query(..., alias="from"),
    to_currency: str = Query(..., alias="to"),
    date_param: Optional[str] = Query(None, alias="date"),
    db: Session = Depends(get_db)
):
    """
    Kur dönüşümü yap
    """
    from datetime import date as date_type
    
    # Tarih parse
    if date_param:
        rate_date = date_type.fromisoformat(date_param)
    else:
        rate_date = date_type.today()
    
    # Aynı para birimi
    if from_currency == to_currency:
        return {
            "amount": amount,
            "from": from_currency,
            "to": to_currency,
            "rate": 1.0,
            "converted_amount": amount,
            "rate_date": rate_date.isoformat()
        }
    
    # Kur bul
    rate_record = db.query(ExchangeRateModel).filter(
        ExchangeRateModel.CurrencyFrom == from_currency,
        ExchangeRateModel.CurrencyTo == to_currency,
        ExchangeRateModel.RateDate == rate_date
    ).first()
    
    # Ters kur dene
    if not rate_record:
        reverse_rate = db.query(ExchangeRateModel).filter(
            ExchangeRateModel.CurrencyFrom == to_currency,
            ExchangeRateModel.CurrencyTo == from_currency,
            ExchangeRateModel.RateDate == rate_date
        ).first()
        
        if reverse_rate:
            rate_value = 1.0 / reverse_rate.Rate
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Kur bulunamadı: {from_currency}/{to_currency} - {rate_date}"
            )
    else:
        rate_value = rate_record.Rate
    
    converted_amount = round(amount * rate_value, 2)
    
    return {
        "amount": amount,
        "from": from_currency,
        "to": to_currency,
        "rate": rate_value,
        "converted_amount": converted_amount,
        "rate_date": rate_date.isoformat()
    }

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

@router.post("/bulk", response_model=List[ExchangeRate])
def create_bulk_exchange_rates(
    request: BulkExchangeRateRequest,
    db: Session = Depends(get_db)
):
    """
    Toplu kur ekleme (günlük kur güncelleme için)
    """
    created_rates = []
    
    for rate in request.rates:
        # Duplicate check
        existing = db.query(ExchangeRateModel).filter(
            ExchangeRateModel.CurrencyFrom == rate.CurrencyFrom,
            ExchangeRateModel.CurrencyTo == rate.CurrencyTo,
            ExchangeRateModel.RateDate == rate.RateDate
        ).first()
        
        if not existing:
            db_rate = ExchangeRateModel(**rate.model_dump())
            db.add(db_rate)
            created_rates.append(db_rate)
    
    db.commit()
    
    for rate in created_rates:
        db.refresh(rate)
    
    return created_rates

def fetch_tcmb_xml(target_date: Optional[date] = None) -> str:
    """
    TCMB XML'ini fetch et
    
    ÖNEMLİ TCMB MANTIĞI:
    - TCMB kurları bir gün önceden yayınlanır
    - 20 Kasım 15:30'da yayınlanan kurlar → 21 Kasım için geçerli
    - 21 Kasım 15:30'da yayınlanan kurlar → 22, 23, 24 Kasım için geçerli (hafta sonu)
    
    Örnek: Kullanıcı "21 Kasım 2025" seçerse → 20112025.xml dosyasını çek
    """
    if target_date is None:
        # Bugünün kurları - today.xml kullan (bugün için geçerli kurlar)
        url = "https://www.tcmb.gov.tr/kurlar/today.xml"
    else:
        # TCMB mantığı: Kurlar bir gün önceden yayınlanır
        # Kullanıcının seçtiği tarih için geçerli kurları almak için
        # bir gün önceki TCMB yayınını çek
        tcmb_publish_date = target_date - timedelta(days=1)
        
        year_month = tcmb_publish_date.strftime("%y%m")  # 2411
        day_month_year = tcmb_publish_date.strftime("%d%m%Y")  # 20112024
        url = f"https://www.tcmb.gov.tr/kurlar/{year_month}/{day_month_year}.xml"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.text
    except requests.exceptions.HTTPError as e:
        # 404 = hafta sonu/tatil günü, diğerleri network hatası
        if e.response.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail="Bu tarih için TCMB kuru bulunamadı. Hafta sonu veya resmi tatil günü olabilir."
            )
        else:
            raise HTTPException(
                status_code=502,
                detail=f"TCMB API hatası: {str(e)}"
            )
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=502,
            detail=f"TCMB bağlantı hatası: {str(e)}"
        )

def parse_tcmb_xml(xml_content: str, rate_date: date) -> List[ExchangeRateCreate]:
    """
    TCMB XML'ini parse et ve ExchangeRateCreate listesi döndür
    """
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as e:
        raise HTTPException(
            status_code=502,
            detail=f"TCMB XML parse hatası: {str(e)}"
        )
    
    rates = []
    
    # Her currency elementi için
    for currency_elem in root.findall('Currency'):
        currency_code = currency_elem.get('CurrencyCode')
        
        # Sadece major currency'leri al
        if currency_code not in ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'SAR', 'SEK', 'NOK', 'DKK', 'KWD']:
            continue
        
        # ForexSelling kurunu kullan (döviz satış)
        forex_selling_elem = currency_elem.find('ForexSelling')
        
        if forex_selling_elem is not None and forex_selling_elem.text:
            try:
                rate_value = float(forex_selling_elem.text)
                
                rates.append(ExchangeRateCreate(
                    CurrencyFrom=currency_code,
                    CurrencyTo='TRY',
                    Rate=rate_value,
                    RateDate=rate_date,
                    Source='TCMB'
                ))
            except (ValueError, TypeError):
                # Geçersiz rate value, skip
                continue
    
    return rates

@router.post("/fetch-tcmb", response_model=List[ExchangeRate])
def fetch_from_tcmb(
    request: FetchTCMBRequest,
    db: Session = Depends(get_db)
):
    """
    TCMB'den güncel kurları çek ve database'e kaydet
    
    Request Body:
        {
            "date": "YYYY-MM-DD" (opsiyonel, default: bugün)
        }
    
    Returns:
        Kaydedilen kur listesi
    
    Error Codes:
        - 400: Geçersiz tarih formatı
        - 404: TCMB'de bu tarih için kur bulunamadı (hafta sonu/tatil günleri)
        - 502: TCMB API bağlantı hatası
    """
    # Tarihi parse et
    date_param = request.date
    if date_param:
        try:
            target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Geçersiz tarih formatı. YYYY-MM-DD formatında olmalı."
            )
        # Belirli tarih için: TCMB mantığı (bir gün önceki XML)
        xml_content = fetch_tcmb_xml(target_date)
    else:
        # Bugünün kurları için: today.xml kullan
        target_date = date.today()
        xml_content = fetch_tcmb_xml(None)  # None = today.xml
    
    # XML'i parse et (target_date = kurların geçerli olduğu tarih)
    rate_creates = parse_tcmb_xml(xml_content, target_date)
    
    if not rate_creates:
        raise HTTPException(
            status_code=404,
            detail=f"TCMB'den {target_date} tarihi için kur bilgisi bulunamadı. Hafta sonu veya resmi tatil günü olabilir."
        )
    
    # Database'e kaydet
    saved_rates = []
    
    for rate_create in rate_creates:
        # Aynı tarih ve currency için kayıt var mı kontrol et
        existing = db.query(ExchangeRateModel).filter(
            ExchangeRateModel.CurrencyFrom == rate_create.CurrencyFrom,
            ExchangeRateModel.CurrencyTo == rate_create.CurrencyTo,
            ExchangeRateModel.RateDate == rate_create.RateDate
        ).first()
        
        if existing:
            # Güncelle
            existing.Rate = rate_create.Rate
            existing.Source = 'TCMB'
            db.commit()
            db.refresh(existing)
            saved_rates.append(existing)
        else:
            # Yeni kayıt ekle
            db_rate = ExchangeRateModel(**rate_create.model_dump())
            db.add(db_rate)
            saved_rates.append(db_rate)
    
    db.commit()
    
    # Refresh all
    for rate in saved_rates:
        db.refresh(rate)
    
    return saved_rates

# ============================================
# EVDS API INTEGRATION (Resmi TCMB API)
# ============================================

def fetch_evds_rates(target_date: date) -> List[ExchangeRateCreate]:
    """
    TCMB EVDS API'sinden kurları çek (resmi Python paketi)
    
    Avantajlar:
    - Geçmiş tarih verilerine erişim (yıllara uzanan arşiv)
    - Daha güvenilir ve profesyonel
    - TCMB'nin resmi veri dağıtım servisi
    
    Args:
        target_date: Kurların geçerli olduğu tarih
        
    Returns:
        ExchangeRateCreate listesi
    """
    api_key = os.getenv("EVDS_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="EVDS_API_KEY environment variable not set"
        )
    
    try:
        from evds import evdsAPI
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="evds package not installed. Run: pip install evds"
        )
    
    # EVDS API client
    evds = evdsAPI(api_key)
    
    # Döviz kuru seri kodları (TCMB format)
    # TP.DK.<CURRENCY>.A = Döviz Kurları, Alış
    currency_series = {
        'USD': 'TP.DK.USD.A',
        'EUR': 'TP.DK.EUR.A',
        'GBP': 'TP.DK.GBP.A',
        'CHF': 'TP.DK.CHF.A',
        'JPY': 'TP.DK.JPY.A',
        'CAD': 'TP.DK.CAD.A',
        'AUD': 'TP.DK.AUD.A',
        'SAR': 'TP.DK.SAR.A',
        'SEK': 'TP.DK.SEK.A',
        'NOK': 'TP.DK.NOK.A',
        'DKK': 'TP.DK.DKK.A',
        'KWD': 'TP.DK.KWD.A',
    }
    
    # Tarih formatı: DD-MM-YYYY (EVDS format)
    date_str = target_date.strftime('%d-%m-%Y')
    
    try:
        # EVDS'den verileri çek
        series_list = list(currency_series.values())
        df = evds.get_data(series_list, startdate=date_str, enddate=date_str)
        
        if df is None or df.empty:
            raise HTTPException(
                status_code=404,
                detail=f"{target_date} tarihi için EVDS'de kur bilgisi bulunamadı."
            )
        
        # DataFrame'den kurları parse et
        # NOT: EVDS API seri kodlarındaki noktaları alt çizgiye dönüştürüyor
        # Örn: 'TP.DK.USD.A' -> 'TP_DK_USD_A'
        rates = []
        for currency_code, series_code in currency_series.items():
            # Column adı: noktalar alt çizgiye dönüşüyor
            column_name = series_code.replace('.', '_')
            
            if column_name in df.columns:
                rate_value = df[column_name].iloc[0]
                
                # None veya NaN kontrolü
                if rate_value is not None and not pd.isna(rate_value):
                    rates.append(ExchangeRateCreate(
                        CurrencyFrom=currency_code,
                        CurrencyTo='TRY',
                        Rate=float(rate_value),
                        RateDate=target_date,
                        Source='EVDS'
                    ))
        
        return rates
        
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"EVDS API hatası: {str(e)}"
        )

@router.post("/fetch-evds", response_model=List[ExchangeRate])
def fetch_from_evds(
    request: FetchTCMBRequest,
    db: Session = Depends(get_db)
):
    """
    TCMB EVDS API'sinden kurları çek (resmi Python API)
    
    EVDS avantajları:
    - Geçmiş tarih verilerine erişim (yıllara uzanan)
    - Daha güvenilir ve profesyonel
    - TCMB'nin resmi veri dağıtım servisi
    
    Request Body:
        {
            "date": "YYYY-MM-DD" (opsiyonel, default: bugün)
        }
    
    Returns:
        Kaydedilen kur listesi
    """
    # Tarihi parse et
    date_param = request.date
    if date_param:
        try:
            target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Geçersiz tarih formatı. YYYY-MM-DD formatında olmalı."
            )
    else:
        target_date = date.today()
    
    # EVDS API'den kurları fetch et
    rate_creates = fetch_evds_rates(target_date)
    
    if not rate_creates:
        raise HTTPException(
            status_code=404,
            detail=f"EVDS'den {target_date} tarihi için kur bilgisi bulunamadı."
        )
    
    # Database'e kaydet (upsert logic)
    saved_rates = []
    
    for rate_create in rate_creates:
        existing = db.query(ExchangeRateModel).filter(
            ExchangeRateModel.CurrencyFrom == rate_create.CurrencyFrom,
            ExchangeRateModel.CurrencyTo == rate_create.CurrencyTo,
            ExchangeRateModel.RateDate == rate_create.RateDate
        ).first()
        
        if existing:
            # Güncelle
            existing.Rate = rate_create.Rate
            existing.Source = 'EVDS'
            db.commit()
            db.refresh(existing)
            saved_rates.append(existing)
        else:
            # Yeni kayıt ekle
            db_rate = ExchangeRateModel(**rate_create.model_dump())
            db.add(db_rate)
            saved_rates.append(db_rate)
    
    db.commit()
    
    # Refresh all
    for rate in saved_rates:
        db.refresh(rate)
    
    return saved_rates
