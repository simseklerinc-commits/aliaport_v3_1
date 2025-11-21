# app/aliaport_web.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .models import Cari, Motorbot, MbTrip  # tablonun ORM'i yüklensin
from .models_hizmet import Hizmet  # Hizmet tablosu
from .models_kurlar import ExchangeRate  # Kur tablosu
from . import router_cari
from . import router_motorbot
from . import router_mbtrip
from . import router_hizmet
from . import router_kurlar
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date
import logging

# Logging konfigürasyonu
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Aliaport v3.1 - Liman Yönetim Sistemi", version="3.1.0")

# CORS middleware - Frontend'in backend'e erişmesi için
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replit için tüm originlere izin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ORM tabloları oluştur (ilk çalıştırmada)
Base.metadata.create_all(bind=engine)

# ============================================
# OTOMATIK KUR GÜNCELLEME SCHEDULER
# ============================================

def scheduled_rate_update():
    """
    Her gün saat 16:05'te otomatik olarak bugünün kurlarını çek
    TCMB kurları 16:00-16:30 arası yayınlanır
    """
    try:
        from .database import SessionLocal
        from .router_kurlar import fetch_evds_rates
        from .models_kurlar import ExchangeRate
        
        today = date.today()
        logger.info(f"📊 Otomatik kur güncelleme başladı: {today}")
        
        db = SessionLocal()
        try:
            # Bugünün kurları veritabanında var mı kontrol et
            existing = db.query(ExchangeRate).filter(ExchangeRate.RateDate == today).first()
            
            if existing:
                logger.info(f"✅ {today} için kurlar zaten mevcut, güncelleme atlandı")
                return
            
            # EVDS'den kurları çek
            rates = fetch_evds_rates(today)
            
            # Veritabanına kaydet
            for rate_data in rates:
                rate_obj = ExchangeRate(**rate_data.dict())
                db.add(rate_obj)
            
            db.commit()
            logger.info(f"✅ {today} için {len(rates)} kur otomatik olarak güncellendi")
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Otomatik kur güncelleme hatası: {e}")
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"❌ Scheduler hatası: {e}")

# Scheduler oluştur ve başlat
scheduler = BackgroundScheduler(timezone="Europe/Istanbul")
scheduler.add_job(
    scheduled_rate_update,
    'cron',
    hour=16,
    minute=5,
    id='daily_rate_update',
    replace_existing=True
)

@app.on_event("startup")
def startup_event():
    """FastAPI başlatma eventi - Scheduler'ı başlat"""
    try:
        scheduler.start()
        logger.info("✅ Otomatik kur güncelleme scheduler başlatıldı (Her gün 16:05)")
    except Exception as e:
        logger.error(f"❌ Scheduler başlatma hatası: {e}")

@app.on_event("shutdown")
def shutdown_event():
    """FastAPI kapatma eventi - Scheduler'ı durdur"""
    try:
        scheduler.shutdown()
        logger.info("✅ Scheduler kapatıldı")
    except Exception as e:
        logger.error(f"❌ Scheduler kapatma hatası: {e}")

# Router'ları ekle
app.include_router(router_cari.router)
app.include_router(router_motorbot.router)
app.include_router(router_mbtrip.router)
app.include_router(router_hizmet.router, prefix="/api/hizmet", tags=["Hizmet"])
app.include_router(router_kurlar.router, prefix="/api/exchange-rate", tags=["Kurlar"])


@app.get("/")
def root():
    return {
        "status": "ok",
        "app": "Aliaport v3.1",
        "message": "Liman Yönetim Sistemi API",
        "endpoints": {
            "cari": "/api/cari",
            "motorbot": "/api/motorbot",
            "mb_trip": "/api/mb-trip",
            "hizmet": "/api/hizmet",
            "exchange_rate": "/api/exchange-rate",
            "docs": "/docs"
        }
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "sqlite"}
