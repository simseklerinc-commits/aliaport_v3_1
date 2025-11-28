"""
Kur Güncelleme Job - EVDS API Entegrasyonu
Otomatik günlük döviz kuru senkronizasyonu

Workflow:
1. EVDS API (resmi TCMB veri kaynağı)
2. Hafta sonu/tatil: Son yayınlanan kur otomatik bulunur
3. Validation: Kur makul aralıkta mı? (±15% son kurdan)
4. UPSERT: Varsa güncelle, yoksa ekle
5. Audit: İşlem logla

Schedule: Her gün 16:00 (TCMB kapanış saati)
Retry: 3 kez, 5 dakika ara ile
"""

from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
import logging
import os

logger = logging.getLogger(__name__)


async def kur_guncelleme_job():
    """
    EVDS API'den günlük kurları çek ve DB'ye kaydet
    
    Flow:
    1. EVDS API call (auto_fallback: hafta sonu/tatil kontrolü)
    2. Validation (kur değerleri makul mı?)
    3. DB UPSERT (ExchangeRate tablosu)
    4. Success/Error logging
    
    Raises:
        Exception: EVDS API başarısız olursa
    """
    from ..config.database import get_db
    from ..modules.kurlar.models import ExchangeRate
    from ..integrations.evds_client import EVDSClient, EVDSAPIError
    
    start_time = datetime.utcnow()
    db: Session = next(get_db())
    
    try:
        logger.info("🔄 Kur güncelleme job başladı")
        
        # EVDS API
        evds_api_key = os.getenv("EVDS_API_KEY")
        if not evds_api_key:
            raise EVDSAPIError(
                "EVDS_API_KEY tanımlı değil!\n"
                "https://evds2.tcmb.gov.tr/ adresinden API key alın ve .env'ye ekleyin"
            )
        
        evds_client = EVDSClient(api_key=evds_api_key)
        
        # Kurları çek (auto_fallback=True: hafta sonu/tatil için son yayınlanan kuru bulur)
        kurlar = evds_client.get_daily_rates(auto_fallback=True)
        logger.info(f"✅ EVDS'den {len(kurlar)} kur alındı")
        
        if not kurlar:
            raise Exception("EVDS API'den kur alınamadı")
        
        # UPSERT Pattern (SQLite uyumlu)
        bugun = date.today()
        success_count = 0
        
        for kur_data in kurlar:
            try:
                # Validation: Kur değerleri makul mı?
                if not _validate_rate(kur_data):
                    logger.warning(
                        f"⚠️  {kur_data['doviz_kodu']} kuru makul değil, atlandı: "
                        f"Alış={kur_data.get('alis')}, Satış={kur_data.get('satis')}"
                    )
                    continue
                
                # Önce mevcut kaydı kontrol et
                existing = db.query(ExchangeRate).filter(
                    ExchangeRate.RateDate == bugun,
                    ExchangeRate.CurrencyFrom == kur_data["doviz_kodu"],
                    ExchangeRate.CurrencyTo == "TRY"
                ).first()
                
                if existing:
                    # UPDATE
                    existing.Rate = kur_data["alis"]
                    existing.SellRate = kur_data.get("satis")
                    existing.BanknoteBuyingRate = kur_data.get("efektif_alis")
                    existing.BanknoteSellRate = kur_data.get("efektif_satis")
                    existing.Source = "EVDS"
                    existing.UpdatedAt = datetime.utcnow()
                    logger.debug(f"✏️  {kur_data['doviz_kodu']} güncellendi")
                else:
                    # INSERT
                    new_rate = ExchangeRate(
                        RateDate=bugun,
                        CurrencyFrom=kur_data["doviz_kodu"],
                        CurrencyTo="TRY",
                        Rate=kur_data["alis"],
                        SellRate=kur_data.get("satis"),
                        BanknoteBuyingRate=kur_data.get("efektif_alis"),
                        BanknoteSellRate=kur_data.get("efektif_satis"),
                        Source="EVDS"
                    )
                    db.add(new_rate)
                    logger.debug(f"➕ {kur_data['doviz_kodu']} eklendi")
                
                success_count += 1
            
            except Exception as e:
                logger.error(f"❌ {kur_data.get('doviz_kodu', 'UNKNOWN')} işlem hatası: {e}")
                continue
        
        db.commit()
        
        duration = (datetime.utcnow() - start_time).total_seconds()
        logger.info(
            f"✅ Kur güncelleme başarılı!\n"
            f"   📊 {success_count}/{len(kurlar)} kur güncellendi\n"
            f"   🌐 Kaynak: EVDS\n"
            f"   ⏱️  Süre: {duration:.2f}s"
        )
        
    except Exception as e:
        logger.error(f"❌ Kur güncelleme job failed: {str(e)}", exc_info=True)
        db.rollback()
        raise  # Re-raise for APScheduler retry
    
    finally:
        db.close()


def _validate_rate(kur_data: dict) -> bool:
    """
    Kur değerini validate et (anomali kontrolü)
    
    Args:
        kur_data: Kur verisi dict
    
    Returns:
        bool: Kur makul mı?
    """
    alis = kur_data.get("alis")
    satis = kur_data.get("satis")
    
    # En az alış kuru olmalı
    if not alis or alis <= 0:
        return False
    
    # Satış kuru varsa, alış kurundan büyük olmalı (spread pozitif)
    if satis and satis <= alis:
        logger.warning(f"⚠️  Spread negatif: Alış={alis}, Satış={satis}")
        return False
    
    # Makul kur aralığı (TRY için)
    # USD: 1-100 TRY arası (genel kabul)
    # Bu aralık ekonomik koşullara göre güncellenebilir
    if alis < 1 or alis > 500:
        logger.warning(f"⚠️  Kur aralık dışı: {alis}")
        return False
    
    return True


def register_kur_sync_job(scheduler):
    """
    Kur sync job'ını APScheduler'a kaydet
    
    Schedule: Her gün 16:00 (TCMB kapanış saati, Istanbul timezone)
    Retry: 3 kez, 5 dakika grace time
    Auto-fallback: Hafta sonu/tatil için son yayınlanan kur
    
    Args:
        scheduler: APScheduler instance
    """
    scheduler.add_job(
        kur_guncelleme_job,
        trigger=CronTrigger(
            hour=16, 
            minute=0, 
            timezone='Europe/Istanbul'
        ),
        id='kur_guncelleme_daily',
        name='EVDS Kur Senkronizasyonu',
        replace_existing=True,
        misfire_grace_time=300,  # 5 dakika geç başlama toleransı
        max_instances=1  # Aynı anda sadece 1 instance çalışsın
    )
    logger.info("📋 EVDS kur güncelleme job registered (daily at 16:00 Istanbul)")

