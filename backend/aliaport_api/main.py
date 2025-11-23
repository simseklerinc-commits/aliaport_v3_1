# backend/aliaport_api/main.py
"""
Aliaport Liman Yönetim Sistemi - Ana Uygulama
FastAPI backend application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date
import sys
from pathlib import Path

# .env dosyasını yükle
load_dotenv()

# Logging setup (önce başlatılmalı)
from .core.logging_config import setup_logging, get_logger

# Setup logging
setup_logging(
    log_dir=Path("logs"),
    log_level=os.getenv("LOG_LEVEL", "INFO"),
    enable_console=True,
    enable_json=True
)

logger = get_logger(__name__)

# Config
from .config.database import Base, engine

# Models - Import for table creation
from .modules.cari.models import Cari
from .modules.motorbot.models import Motorbot, MbTrip
from .modules.hizmet.models import Hizmet
from .modules.kurlar.models import ExchangeRate
from .modules.parametre.models import Parametre
from .modules.tarife.models import PriceList, PriceListItem
from .modules.barinma.models import BarinmaContract
from .modules.isemri.models import WorkOrder, WorkOrderItem
from .modules.saha.models import WorkLog
from .modules.guvenlik.models import GateLog, GateChecklistItem

# Routers
from .modules.cari import router as router_cari
from .modules.motorbot import router as router_motorbot
# sefer router motorbot içinde - /api/motorbot/sefer
from .modules.hizmet import router as router_hizmet
from .modules.kurlar import router as router_kurlar
from .modules.parametre import router as router_parametre
from .modules.tarife import router as router_tarife
from .modules.barinma import router as router_barinma
from .modules.isemri import router as router_isemri
from .modules.saha import router as router_saha
from .modules.guvenlik import router as router_guvenlik

# Middleware
from .middleware.request_logging import RequestLoggingMiddleware
from .middleware.error_handler import global_exception_handler

app = FastAPI(title="Aliaport v3.1 - Liman Yönetim Sistemi", version="3.1.0")

logger.info("Aliaport v3.1 starting up...")

# ============================================
# EXCEPTION HANDLERS
# ============================================

# Global exception handler
app.add_exception_handler(Exception, global_exception_handler)

# ============================================
# MIDDLEWARE
# ============================================

# Request logging middleware (her request için timing ve ID)
app.add_middleware(RequestLoggingMiddleware)

# CORS middleware - Frontend'in backend'e erişmesi için
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replit için tüm originlere izin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# DATABASE MIGRATIONS
# ============================================
# REMOVED: Base.metadata.create_all(bind=engine)
# Database schema now managed by Alembic migrations
# To create/update tables: `alembic upgrade head`
# To create new migration: `alembic revision --autogenerate -m "description"`

# ============================================
# SCHEDULER - Otomatik Görevler
# ============================================

# Backup fonksiyonunu import et
sys.path.insert(0, str(Path(__file__).parent.parent))
from scripts.backup_database import scheduled_backup

# Background scheduler oluştur
scheduler = BackgroundScheduler(timezone="Europe/Istanbul")

# Günlük backup - Her gün saat 03:00'da
scheduler.add_job(
    scheduled_backup,
    trigger='cron',
    hour=3,
    minute=0,
    id='daily_database_backup',
    name='Günlük Database Backup',
    replace_existing=True
)

# Scheduler'ı başlat
try:
    scheduler.start()
    logger.info("✅ APScheduler başlatıldı - Günlük backup: 03:00")
except Exception as e:
    logger.error(f"❌ Scheduler başlatma hatası: {e}")

# Uygulama kapanırken scheduler'ı durdur
import atexit
atexit.register(lambda: scheduler.shutdown())

# ============================================

# Router'ları ekle
app.include_router(router_cari)
app.include_router(router_motorbot)  # içinde /sefer endpoints var
# app.include_router(router_mbtrip)  # motorbot içinde
app.include_router(router_hizmet, prefix="/api/hizmet", tags=["Hizmet"])
app.include_router(router_kurlar, prefix="/api/exchange-rate", tags=["Kurlar"])
app.include_router(router_parametre)
app.include_router(router_tarife, prefix="/api/price-list", tags=["Tarife"])
app.include_router(router_barinma, prefix="/api/barinma", tags=["Barinma"])
app.include_router(router_isemri, prefix="/api", tags=["İş Emri"])
app.include_router(router_saha)  # /api/worklog
app.include_router(router_guvenlik)  # /api/gatelog


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
            "parametre": "/api/parametre",
            "barinma": "/api/barinma",
            "price_list": "/api/price-list",
            "work_order": "/api/work-order",
            "worklog": "/api/worklog",
            "gatelog": "/api/gatelog",
            "docs": "/docs"
        }
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "sqlite"}
