# ============================================
# EVDS API INTEGRATION (Modern EVDSClient)
# ============================================

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime
import os
import logging

from ...config.database import get_db
from ...core.responses import success_response, error_response
from ...core.cache import cache
from ...core.error_codes import ErrorCode
from ...integrations.evds_client import EVDSClient, EVDSAPIError
from .models import ExchangeRate as ExchangeRateModel
from .schemas import ExchangeRate, FetchAPIRequest

logger = logging.getLogger(__name__)


def fetch_from_evds_handler(request: FetchAPIRequest, db: Session):
    """
    EVDS API'den güncel döviz kurlarını çek ve DB'ye kaydet
    
    EVDS Resmi Web Servis Entegrasyonu:
    - Primary veri kaynağı (TCMB resmi API)
    - Tarihsel veri desteği
    - Çoklu döviz batch request
    - JSON format response
    
    Args:
        request: FetchAPIRequest (date, currencies opsiyonel)
        db: Database session
    
    Returns:
        success_response: Kaydedilen kurlar listesi
    
    Raises:
        HTTPException: EVDS API hatası, validation error, vs.
    """
    # Tarih parse
    if request.date:
        try:
            target_date = datetime.strptime(request.date, '%Y-%m-%d').date()
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail=error_response(
                    code=ErrorCode.KUR_INVALID_DATE, 
                    message="Geçersiz tarih formatı (YYYY-MM-DD olmalı)", 
                    details={"value": request.date}
                )
            )
    else:
        target_date = date.today()
    
    # Döviz listesi
    currencies = request.currencies or ["USD", "EUR", "GBP", "CHF", "JPY"]
    
    try:
        # EVDS Client init
        api_key = os.getenv("EVDS_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail=error_response(
                    code=ErrorCode.EVDS_API_ERROR,
                    message="EVDS_API_KEY environment variable tanımlı değil",
                    details={
                        "hint": "https://evds2.tcmb.gov.tr/ adresinden API key alın ve .env'ye ekleyin"
                    }
                )
            )
        
        evds_client = EVDSClient(api_key=api_key)
        
        # EVDS API call
        logger.info(f"📡 EVDS API request: {target_date}, currencies={currencies}")
        kurlar = evds_client.get_daily_rates(target_date=target_date, currencies=currencies)
        
        if not kurlar:
            raise HTTPException(
                status_code=404,
                detail=error_response(
                    code=ErrorCode.KUR_RATE_NOT_AVAILABLE,
                    message="EVDS'den kur verisi alınamadı",
                    details={"rate_date": target_date.isoformat(), "currencies": currencies}
                )
            )
        
        # DB'ye UPSERT
        saved: List[ExchangeRateModel] = []
        
        for kur_data in kurlar:
            try:
                # Mevcut kayıt kontrolü
                existing = db.query(ExchangeRateModel).filter(
                    ExchangeRateModel.RateDate == target_date,
                    ExchangeRateModel.CurrencyFrom == kur_data["doviz_kodu"],
                    ExchangeRateModel.CurrencyTo == "TRY"
                ).first()
                
                if existing:
                    # UPDATE
                    existing.Rate = kur_data["alis"]
                    existing.SellRate = kur_data.get("satis")
                    existing.BanknoteBuyingRate = kur_data.get("efektif_alis")
                    existing.BanknoteSellRate = kur_data.get("efektif_satis")
                    existing.Source = "EVDS"
                    existing.UpdatedAt = datetime.utcnow()
                    saved.append(existing)
                    logger.debug(f"✏️  {kur_data['doviz_kodu']} güncellendi")
                else:
                    # INSERT
                    new_rate = ExchangeRateModel(
                        RateDate=target_date,
                        CurrencyFrom=kur_data["doviz_kodu"],
                        CurrencyTo="TRY",
                        Rate=kur_data["alis"],
                        SellRate=kur_data.get("satis"),
                        BanknoteBuyingRate=kur_data.get("efektif_alis"),
                        BanknoteSellRate=kur_data.get("efektif_satis"),
                        Source="EVDS"
                    )
                    db.add(new_rate)
                    saved.append(new_rate)
                    logger.debug(f"➕ {kur_data['doviz_kodu']} eklendi")
            
            except Exception as e:
                logger.error(f"❌ {kur_data.get('doviz_kodu', 'UNKNOWN')} kayıt hatası: {e}")
                continue
        
        db.commit()
        
        # Refresh all saved records
        for s in saved:
            db.refresh(s)
        
        # Cache invalidation
        cache.invalidate("kurlar:")
        
        # Response
        data = [ExchangeRate.model_validate(x).model_dump() for x in saved]
        
        logger.info(f"✅ EVDS: {len(data)} kur kaydedildi")
        
        return success_response(
            data=data, 
            message=f"EVDS'den {len(data)} kur başarıyla kaydedildi (Tarih: {target_date.isoformat()})"
        )
    
    except EVDSAPIError as e:
        logger.error(f"❌ EVDS API error: {e}")
        raise HTTPException(
            status_code=503,
            detail=error_response(
                code=ErrorCode.EVDS_API_ERROR,
                message="EVDS API hatası",
                details={"error": str(e), "rate_date": target_date.isoformat()}
            )
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"❌ EVDS fetch unexpected error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="EVDS kur kaydı sırasında hata",
                details={"error": str(e)}
            )
        )
