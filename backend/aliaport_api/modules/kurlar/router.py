from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta
import requests
import xml.etree.ElementTree as ET
import os
import pandas as pd

from ...config.database import get_db
from ...core.responses import success_response, error_response, paginated_response
from ...core.error_codes import ErrorCode, get_http_status_for_error
from .models import ExchangeRate as ExchangeRateModel
from .schemas import (
    ExchangeRate,
    ExchangeRateCreate,
    ExchangeRateUpdate,
    BulkExchangeRateRequest,
    FetchTCMBRequest
)

router = APIRouter()

# ============================================
# LIST & QUERY ENDPOINTS
# ============================================

@router.get("/")
def get_exchange_rates(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    currency_from: Optional[str] = None,
    currency_to: Optional[str] = None,
    rate_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Kurlar (filtre + pagination)."""
    try:
        query = db.query(ExchangeRateModel)
        if currency_from:
            query = query.filter(ExchangeRateModel.CurrencyFrom == currency_from)
        if currency_to:
            query = query.filter(ExchangeRateModel.CurrencyTo == currency_to)
        if rate_date:
            query = query.filter(ExchangeRateModel.RateDate == rate_date)
        total = query.count()
        query = query.order_by(ExchangeRateModel.RateDate.desc(), ExchangeRateModel.Id.desc())
        skip = (page - 1) * page_size
        items = query.offset(skip).limit(page_size).all()
        data = [ExchangeRate.model_validate(r).model_dump() for r in items]
        return paginated_response(data=data, page=page, page_size=page_size, total=total, message="Kurlar listelendi")
    except Exception as e:
        raise HTTPException(status_code=500, detail=error_response(code=ErrorCode.INTERNAL_SERVER_ERROR, message="Kurlar listelenemedi", details={"error": str(e)}))


@router.get("/today")
def get_today_rates(db: Session = Depends(get_db)):
    """Bugünün kurları."""
    try:
        today = date.today()
        records = db.query(ExchangeRateModel).filter(ExchangeRateModel.RateDate == today).all()
        data = [ExchangeRate.model_validate(r).model_dump() for r in records]
        return success_response(data=data, message="Bugünün kurları getirildi")
    except Exception as e:
        raise HTTPException(status_code=500, detail=error_response(code=ErrorCode.INTERNAL_SERVER_ERROR, message="Bugünün kurları alınamadı", details={"error": str(e)}))


@router.get("/date/{rate_date}")
def get_rates_by_date(rate_date: date, db: Session = Depends(get_db)):
    """Belirli tarihteki tüm kurlar."""
    try:
        records = db.query(ExchangeRateModel).filter(ExchangeRateModel.RateDate == rate_date).all()
        data = [ExchangeRate.model_validate(r).model_dump() for r in records]
        return success_response(data=data, message="Tarih kurları getirildi")
    except Exception as e:
        raise HTTPException(status_code=500, detail=error_response(code=ErrorCode.INTERNAL_SERVER_ERROR, message="Tarih kurları alınamadı", details={"error": str(e)}))


@router.get("/latest/{currency_from}/{currency_to}")
def get_latest_rate(currency_from: str, currency_to: str, db: Session = Depends(get_db)):
    """İki para birimi arasındaki en güncel kur."""
    rate = db.query(ExchangeRateModel).filter(
        ExchangeRateModel.CurrencyFrom == currency_from,
        ExchangeRateModel.CurrencyTo == currency_to
    ).order_by(ExchangeRateModel.RateDate.desc()).first()
    if not rate:
        raise HTTPException(status_code=404, detail=error_response(code=ErrorCode.KUR_NOT_FOUND, message="Kur bulunamadı", details={"pair": f"{currency_from}/{currency_to}"}))
    data = ExchangeRate.model_validate(rate).model_dump()
    return success_response(data=data, message="Güncel kur getirildi")


@router.get("/{currency_from}/{currency_to}/{rate_date}")
def get_rate_by_date(currency_from: str, currency_to: str, rate_date: date, db: Session = Depends(get_db)):
    """Belirli tarihte iki para birimi kur."""
    rate = db.query(ExchangeRateModel).filter(
        ExchangeRateModel.CurrencyFrom == currency_from,
        ExchangeRateModel.CurrencyTo == currency_to,
        ExchangeRateModel.RateDate == rate_date
    ).first()
    if not rate:
        raise HTTPException(status_code=404, detail=error_response(code=ErrorCode.KUR_NOT_FOUND, message="Tarih için kur yok", details={"pair": f"{currency_from}/{currency_to}", "rate_date": rate_date.isoformat()}))
    data = ExchangeRate.model_validate(rate).model_dump()
    return success_response(data=data, message="Kur getirildi")


@router.get("/convert")
def convert_currency(
    amount: float = Query(..., gt=0),
    from_currency: str = Query(..., alias="from"),
    to_currency: str = Query(..., alias="to"),
    date_param: Optional[str] = Query(None, alias="date"),
    db: Session = Depends(get_db)
):
    """Kur dönüşümü."""
    target_date = date.today() if not date_param else date.fromisoformat(date_param)
    if from_currency == to_currency:
        return success_response(data={
            "amount": amount,
            "from": from_currency,
            "to": to_currency,
            "rate": 1.0,
            "converted_amount": amount,
            "rate_date": target_date.isoformat()
        }, message="Aynı para birimi")
    rate_record = db.query(ExchangeRateModel).filter(
        ExchangeRateModel.CurrencyFrom == from_currency,
        ExchangeRateModel.CurrencyTo == to_currency,
        ExchangeRateModel.RateDate == target_date
    ).first()
    if not rate_record:
        reverse_rate = db.query(ExchangeRateModel).filter(
            ExchangeRateModel.CurrencyFrom == to_currency,
            ExchangeRateModel.CurrencyTo == from_currency,
            ExchangeRateModel.RateDate == target_date
        ).first()
        if not reverse_rate:
            raise HTTPException(status_code=404, detail=error_response(code=ErrorCode.KUR_RATE_NOT_AVAILABLE, message="Kur bulunamadı", details={"pair": f"{from_currency}/{to_currency}", "rate_date": target_date.isoformat()}))
        rate_value = 1.0 / reverse_rate.Rate
    else:
        rate_value = rate_record.Rate
    converted = round(amount * rate_value, 2)
    return success_response(data={
        "amount": amount,
        "from": from_currency,
        "to": to_currency,
        "rate": rate_value,
        "converted_amount": converted,
        "rate_date": target_date.isoformat()
    }, message="Dönüşüm başarılı")


@router.get("/{rate_id}")
def get_exchange_rate(rate_id: int, db: Session = Depends(get_db)):
    """ID ile kur kaydı."""
    rate = db.query(ExchangeRateModel).filter(ExchangeRateModel.Id == rate_id).first()
    if not rate:
        raise HTTPException(status_code=404, detail=error_response(code=ErrorCode.KUR_NOT_FOUND, message="Kur kaydı yok", details={"id": rate_id}))
    data = ExchangeRate.model_validate(rate).model_dump()
    return success_response(data=data, message="Kur kaydı getirildi")


@router.post("/")
def create_exchange_rate(rate: ExchangeRateCreate, db: Session = Depends(get_db)):
    """Yeni kur oluştur."""
    existing = db.query(ExchangeRateModel).filter(
        ExchangeRateModel.CurrencyFrom == rate.CurrencyFrom,
        ExchangeRateModel.CurrencyTo == rate.CurrencyTo,
        ExchangeRateModel.RateDate == rate.RateDate
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail=error_response(code=ErrorCode.DUPLICATE_ENTRY, message="Bu tarih için kur mevcut", details={"pair": f"{rate.CurrencyFrom}/{rate.CurrencyTo}", "rate_date": rate.RateDate.isoformat()}))
    db_rate = ExchangeRateModel(**rate.model_dump())
    db.add(db_rate)
    db.commit()
    db.refresh(db_rate)
    data = ExchangeRate.model_validate(db_rate).model_dump()
    return success_response(data=data, message="Kur oluşturuldu")


@router.put("/{rate_id}")
def update_exchange_rate(rate_id: int, rate: ExchangeRateUpdate, db: Session = Depends(get_db)):
    """Kur güncelle."""
    db_rate = db.query(ExchangeRateModel).filter(ExchangeRateModel.Id == rate_id).first()
    if not db_rate:
        raise HTTPException(status_code=404, detail=error_response(code=ErrorCode.KUR_NOT_FOUND, message="Kur kaydı yok", details={"id": rate_id}))
    update_data = rate.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_rate, field, value)
    db.commit()
    db.refresh(db_rate)
    data = ExchangeRate.model_validate(db_rate).model_dump()
    return success_response(data=data, message="Kur güncellendi")


@router.delete("/{rate_id}")
def delete_exchange_rate(rate_id: int, db: Session = Depends(get_db)):
    """Kur sil."""
    db_rate = db.query(ExchangeRateModel).filter(ExchangeRateModel.Id == rate_id).first()
    if not db_rate:
        raise HTTPException(status_code=404, detail=error_response(code=ErrorCode.KUR_NOT_FOUND, message="Silinecek kayıt yok", details={"id": rate_id}))
    db.delete(db_rate)
    db.commit()
    return success_response(data={"id": rate_id}, message="Kur silindi")


@router.post("/bulk")
def create_bulk_exchange_rates(request: BulkExchangeRateRequest, db: Session = Depends(get_db)):
    """Toplu kur ekleme."""
    created: List[ExchangeRateModel] = []
    try:
        for rate in request.rates:
            existing = db.query(ExchangeRateModel).filter(
                ExchangeRateModel.CurrencyFrom == rate.CurrencyFrom,
                ExchangeRateModel.CurrencyTo == rate.CurrencyTo,
                ExchangeRateModel.RateDate == rate.RateDate
            ).first()
            if not existing:
                db_rate = ExchangeRateModel(**rate.model_dump())
                db.add(db_rate)
                created.append(db_rate)
        db.commit()
        for r in created:
            db.refresh(r)
        data = [ExchangeRate.model_validate(r).model_dump() for r in created]
        return success_response(data=data, message="Toplu ekleme tamamlandı")
    except Exception as e:
        raise HTTPException(status_code=500, detail=error_response(code=ErrorCode.INTERNAL_SERVER_ERROR, message="Toplu ekleme hatası", details={"error": str(e)}))


# ============================================
# TCMB XML HELPERS
# ============================================

def fetch_tcmb_xml(target_date: Optional[date] = None) -> str:
    if target_date is None:
        url = "https://www.tcmb.gov.tr/kurlar/today.xml"
    else:
        tcmb_publish_date = target_date - timedelta(days=1)
        year_month = tcmb_publish_date.strftime("%y%m")
        day_month_year = tcmb_publish_date.strftime("%d%m%Y")
        url = f"https://www.tcmb.gov.tr/kurlar/{year_month}/{day_month_year}.xml"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.text
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail=error_response(code=ErrorCode.KUR_RATE_NOT_AVAILABLE, message="TCMB kuru yok", details={"url": url}))
        raise HTTPException(status_code=503, detail=error_response(code=ErrorCode.KUR_FETCH_ERROR, message="TCMB API hatası", details={"error": str(e)}))
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=error_response(code=ErrorCode.KUR_FETCH_ERROR, message="TCMB bağlantı hatası", details={"error": str(e)}))


def parse_tcmb_xml(xml_content: str, rate_date: date) -> List[ExchangeRateCreate]:
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as e:
        raise HTTPException(status_code=503, detail=error_response(code=ErrorCode.KUR_FETCH_ERROR, message="TCMB XML parse hatası", details={"error": str(e)}))
    currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'SAR', 'SEK', 'NOK', 'DKK', 'KWD']
    results: List[ExchangeRateCreate] = []
    for currency_elem in root.findall('Currency'):
        code = currency_elem.get('CurrencyCode')
        if code not in currencies:
            continue
        forex_selling_elem = currency_elem.find('ForexSelling')
        if forex_selling_elem is not None and forex_selling_elem.text:
            try:
                rate_value = float(forex_selling_elem.text)
                results.append(ExchangeRateCreate(
                    CurrencyFrom=code,
                    CurrencyTo='TRY',
                    Rate=rate_value,
                    RateDate=rate_date,
                    Source='TCMB'
                ))
            except (ValueError, TypeError):
                continue
    return results


@router.post("/fetch-tcmb")
def fetch_from_tcmb(request: FetchTCMBRequest, db: Session = Depends(get_db)):
    date_param = request.date
    if date_param:
        try:
            target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
        except ValueError:
            raise HTTPException(status_code=400, detail=error_response(code=ErrorCode.KUR_INVALID_DATE, message="Geçersiz tarih formatı", details={"value": date_param}))
        xml_content = fetch_tcmb_xml(target_date)
    else:
        target_date = date.today()
        xml_content = fetch_tcmb_xml(None)
    rate_creates = parse_tcmb_xml(xml_content, target_date)
    if not rate_creates:
        raise HTTPException(status_code=404, detail=error_response(code=ErrorCode.KUR_RATE_NOT_AVAILABLE, message="Kur verisi yok", details={"rate_date": target_date.isoformat()}))
    saved: List[ExchangeRateModel] = []
    for r in rate_creates:
        existing = db.query(ExchangeRateModel).filter(
            ExchangeRateModel.CurrencyFrom == r.CurrencyFrom,
            ExchangeRateModel.CurrencyTo == r.CurrencyTo,
            ExchangeRateModel.RateDate == r.RateDate
        ).first()
        if existing:
            existing.Rate = r.Rate
            existing.Source = 'TCMB'
            db.commit()
            db.refresh(existing)
            saved.append(existing)
        else:
            db_rate = ExchangeRateModel(**r.model_dump())
            db.add(db_rate)
            saved.append(db_rate)
    db.commit()
    for s in saved:
        db.refresh(s)
    data = [ExchangeRate.model_validate(x).model_dump() for x in saved]
    return success_response(data=data, message="TCMB kurları kaydedildi")


# ============================================
# EVDS HELPERS & FETCH
# ============================================

def find_latest_available_rate_date(target_date: date, evds_client, currency_list: list) -> date:
    max_attempts = 15
    current_date = target_date - timedelta(days=1)
    test_series = ['TP.DK.USD.A', 'TP.DK.EUR.A', 'TP.DK.GBP.A']
    for _ in range(max_attempts):
        if current_date.weekday() == 5:
            current_date = current_date - timedelta(days=1)
        elif current_date.weekday() == 6:
            current_date = current_date - timedelta(days=2)
        date_str = current_date.strftime('%d-%m-%Y')
        try:
            df = evds_client.get_data(test_series, startdate=date_str, enddate=date_str)
            if df is not None and not df.empty:
                available_cols = [c for c in df.columns if c.startswith('TP_DK_') and c.endswith('_A')]
                if len(available_cols) >= 2:
                    return current_date
        except Exception as e:
            msg = str(e).lower()
            if any(k in msg for k in ['api key', 'unauthorized', 'forbidden']):
                raise HTTPException(status_code=503, detail=error_response(code=ErrorCode.EVDS_API_ERROR, message="EVDS yetkilendirme hatası", details={"error": str(e)}))
            if any(k in msg for k in ['timeout', 'connection', 'network']):
                raise HTTPException(status_code=503, detail=error_response(code=ErrorCode.EVDS_API_ERROR, message="EVDS bağlantı hatası", details={"error": str(e)}))
        current_date = current_date - timedelta(days=1)
    raise HTTPException(status_code=404, detail=error_response(code=ErrorCode.KUR_RATE_NOT_AVAILABLE, message="EVDS'de yayınlanmış kur yok", details={"target_date": target_date.isoformat(), "attempts": max_attempts}))


def fetch_evds_rates(target_date: date) -> List[ExchangeRateCreate]:
    api_key = os.getenv("EVDS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail=error_response(code=ErrorCode.EVDS_API_ERROR, message="EVDS_API_KEY tanımlı değil", details={"env": "EVDS_API_KEY"}))
    try:
        from evds import evdsAPI
    except ImportError:
        raise HTTPException(status_code=500, detail=error_response(code=ErrorCode.EVDS_API_ERROR, message="evds paketi kurulu değil", details={"hint": "pip install evds"}))
    evds = evdsAPI(api_key)
    currency_list = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'SAR', 'SEK', 'NOK', 'DKK', 'KWD']
    currency_series_buy = {c: f'TP.DK.{c}.A' for c in currency_list}
    currency_series_sell = {c: f'TP.DK.{c}.S' for c in currency_list}
    publish_date = find_latest_available_rate_date(target_date, evds, currency_list)
    date_str = publish_date.strftime('%d-%m-%Y')
    try:
        all_series = list(currency_series_buy.values()) + list(currency_series_sell.values())
        df = evds.get_data(all_series, startdate=date_str, enddate=date_str)
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail=error_response(code=ErrorCode.KUR_RATE_NOT_AVAILABLE, message="EVDS kuru yok", details={"rate_date": target_date.isoformat()}))
        rates: List[ExchangeRateCreate] = []
        for code in currency_list:
            buy_col = currency_series_buy[code].replace('.', '_')
            sell_col = currency_series_sell[code].replace('.', '_')
            if buy_col in df.columns:
                buy_rate = df[buy_col].iloc[0]
                sell_rate = df[sell_col].iloc[0] if sell_col in df.columns else None
                if buy_rate is not None and not pd.isna(buy_rate):
                    rates.append(ExchangeRateCreate(
                        CurrencyFrom=code,
                        CurrencyTo='TRY',
                        Rate=float(buy_rate),
                        SellRate=float(sell_rate) if sell_rate and not pd.isna(sell_rate) else None,
                        RateDate=target_date,
                        Source='EVDS'
                    ))
        return rates
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=error_response(code=ErrorCode.EVDS_API_ERROR, message="EVDS API hatası", details={"error": str(e)}))


@router.post("/fetch-evds")
def fetch_from_evds(request: FetchTCMBRequest, db: Session = Depends(get_db)):
    date_param = request.date
    if date_param:
        try:
            target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
        except ValueError:
            raise HTTPException(status_code=400, detail=error_response(code=ErrorCode.KUR_INVALID_DATE, message="Geçersiz tarih formatı", details={"value": date_param}))
    else:
        target_date = date.today()
    rate_creates = fetch_evds_rates(target_date)
    if not rate_creates:
        raise HTTPException(status_code=404, detail=error_response(code=ErrorCode.KUR_RATE_NOT_AVAILABLE, message="EVDS verisi yok", details={"rate_date": target_date.isoformat()}))
    saved: List[ExchangeRateModel] = []
    for r in rate_creates:
        existing = db.query(ExchangeRateModel).filter(
            ExchangeRateModel.CurrencyFrom == r.CurrencyFrom,
            ExchangeRateModel.CurrencyTo == r.CurrencyTo,
            ExchangeRateModel.RateDate == r.RateDate
        ).first()
        if existing:
            existing.Rate = r.Rate
            existing.Source = 'EVDS'
            db.commit()
            db.refresh(existing)
            saved.append(existing)
        else:
            db_rate = ExchangeRateModel(**r.model_dump())
            db.add(db_rate)
            saved.append(db_rate)
    db.commit()
    for s in saved:
        db.refresh(s)
    data = [ExchangeRate.model_validate(x).model_dump() for x in saved]
    return success_response(data=data, message="EVDS kurları kaydedildi")
