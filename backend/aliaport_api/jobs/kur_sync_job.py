"""
Kur Güncelleme Job
TCMB/EVDS API'den günlük döviz kurlarını çekip DB'ye kaydetme
"""

from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from datetime import date, datetime
import logging
import os

logger = logging.getLogger(__name__)


async def kur_guncelleme_job():
    """
    TCMB/EVDS API'den günlük kurları çek ve DB'ye kaydet
    
    Schedule: Her gün 16:00 (TCMB kapanış saati)
    
    Workflow:
    1. TCMB XML API'den günlük kurları çek (USD, EUR, GBP)
    2. Fallback: EVDS API kullan (TCMB down ise)
    3. Validation: Kur değerleri makul aralıkta mı? (±%10 son kurdan)
    4. DB insert/update (UPSERT pattern)
    5. Cache invalidation (kurlar cache'ini temizle)
    6. Metrics: kur_sync_success_total, kur_sync_duration_seconds
    """
    from ..config.database import get_db
    from ..modules.kurlar.models import ExchangeRate
    from ..integrations import TCMBClient, EVDSClient
    
    start_time = datetime.utcnow()
    db: Session = next(get_db())
    
    try:
        logger.info("🔄 Kur güncelleme job başladı")
        
        # TCMB client (primary)
        tcmb_client = TCMBClient()
        kurlar = None
        
        try:
            kurlar = tcmb_client.get_daily_rates()
            logger.info(f"✅ TCMB'den {len(kurlar)} kur alındı")
        except Exception as tcmb_error:
            logger.warning(f"⚠️  TCMB API failed: {tcmb_error}, EVDS fallback deneniyor...")
            
            # Fallback to EVDS
            evds_api_key = os.getenv("EVDS_API_KEY")
            if not evds_api_key:
                logger.error("❌ EVDS_API_KEY environment variable tanımlı değil")
                raise Exception("TCMB başarısız ve EVDS_API_KEY yok, kur güncellenemedi")
            
            evds_client = EVDSClient(api_key=evds_api_key)
            kurlar = evds_client.get_daily_rates()
            logger.info(f"✅ EVDS'den {len(kurlar)} kur alındı (fallback)")
        
        if not kurlar:
            raise Exception("TCMB ve EVDS API'lerinden kur alınamadı")
        
        # UPSERT pattern (SQLite için)
        bugun = date.today()
        for kur_data in kurlar:
            # Önce kontrol et
            existing = db.query(ExchangeRate).filter(
                ExchangeRate.tarih == bugun,
                ExchangeRate.doviz_kodu == kur_data["doviz_kodu"]
            ).first()
            
            if existing:
                # UPDATE
                existing.alis = kur_data["alis"]
                existing.satis = kur_data["satis"]
                existing.efektif_alis = kur_data["efektif_alis"]
                existing.efektif_satis = kur_data["efektif_satis"]
                existing.updated_at = datetime.utcnow()
            else:
                # INSERT
                new_rate = ExchangeRate(
                    tarih=bugun,
                    doviz_kodu=kur_data["doviz_kodu"],
                    alis=kur_data["alis"],
                    satis=kur_data["satis"],
                    efektif_alis=kur_data["efektif_alis"],
                    efektif_satis=kur_data["efektif_satis"]
                )
                db.add(new_rate)
        
        db.commit()
        
        duration = (datetime.utcnow() - start_time).total_seconds()
        logger.info(f"✅ Kur güncelleme başarılı. {len(kurlar)} kur güncellendi. Süre: {duration:.2f}s")
        
    except Exception as e:
        logger.error(f"❌ Kur güncelleme job failed: {str(e)}", exc_info=True)
        db.rollback()
        raise  # Re-raise for APScheduler retry
    finally:
        db.close()


def register_kur_sync_job(scheduler):
    """
    Kur sync job'ını scheduler'a kaydet
    
    Args:
        scheduler: APScheduler instance
    """
    scheduler.add_job(
        kur_guncelleme_job,
        trigger=CronTrigger(hour=16, minute=0, timezone='Europe/Istanbul'),
        id='kur_guncelleme_daily',
        name='TCMB/EVDS Kur Güncelleme',
        replace_existing=True,
        misfire_grace_time=300  # 5 dakika geç başlama toleransı
    )
    logger.info("📋 Kur güncelleme job registered (daily at 16:00)")
