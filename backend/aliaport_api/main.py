# backend/aliaport_api/main.py
"""
Aliaport Liman Yönetim Sistemi - Ana Uygulama
FastAPI backend application
"""
from fastapi import FastAPI, Request
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi.responses import JSONResponse
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
from .modules.auth.models import User, Role, Permission  # FAZ 4: Authentication models

# Create all tables on startup
Base.metadata.create_all(bind=engine)
logger.info("✅ Database tables created/verified")

# Routers
from .modules.cari import router as router_cari
from .modules.motorbot import router as router_motorbot
# sefer router ayrı modülde (legacy /api/mb-trip)
try:
    from .modules.sefer import router as router_sefer  # optional mb-trip legacy endpoints
except Exception:
    router_sefer = None
from .modules.hizmet import router as router_hizmet
from .modules.kurlar import router as router_kurlar
from .modules.parametre import router as router_parametre
from .modules.tarife import router as router_tarife
from .modules.barinma import router as router_barinma
from .modules.isemri import router as router_isemri
from .modules.saha import router as router_saha
from .modules.guvenlik import router as router_guvenlik
from .modules.auth import auth_router  # FAZ 4: Authentication endpoints
from .modules.audit.router import router as audit_router
from .core.monitoring import router as monitoring_router  # FAZ 6: Monitoring

# Middleware
from .middleware.request_logging import RequestLoggingMiddleware
from .middleware.error_handler import global_exception_handler
from .modules.audit.utils import persist_audit_event
import time

app = FastAPI(
    title="Aliaport v3.1 - Liman Yönetim Sistemi",
    version="3.1.0",
    description="Aliaport Liman Yönetim Sistemi API. Standart yanıt zarfı: success, message, data, error, pagination. Hata kodları için ErrorResponse şemasını inceleyin."
)

# TODO(RATE_LIMITS.md): Belgele
# Örnek politikalar:
#   - Genel: 300/dakika (user/IP birleşik)
#   - /auth/login: 10/dakika (brute force azaltma)
#   - /auth/request-reset: 5/saat (email spam önleme)
#   - /auth/reset-password: 10/saat (token kötüye kullanım önleme)
# Gelecek: Dinamik limitler (örn. rol bazlı), yazma işlemleri için daha düşük eşikler

# OpenAPI tag metadata (dokümanda açıklama ve grupla görünürlük sağlar)
openapi_tags = [
    {"name": "Monitoring", "description": "Sistem durumu, sağlık ve metrik endpointleri"},
    {"name": "Auth", "description": "Kimlik doğrulama, oturum ve kullanıcı yönetimi"},
    {"name": "Audit", "description": "İstek ve olay denetim kayıtları"},
    {"name": "Cari", "description": "Cari kayıtları ve ilişkili temel işlemler"},
    {"name": "Motorbot", "description": "Motorbot envanteri ve CRUD işlemleri"},
    {"name": "Sefer", "description": "Motorbot sefer (MbTrip) yönetimi"},
    {"name": "Hizmet", "description": "Hizmet tanımları ve operasyonel veriler"},
    {"name": "Kurlar", "description": "Döviz kurları senkron ve sorgulama"},
    {"name": "Parametre", "description": "Sistem parametreleri ve yapılandırma kayıtları"},
    {"name": "Tarife", "description": "Fiyat listeleri ve kalemleri"},
    {"name": "Barinma", "description": "Barınma kontratları yönetimi"},
    {"name": "İş Emri", "description": "İş emri yaşam döngüsü ve kalemleri"},
    {"name": "Saha Personeli", "description": "Saha personel iş kayıtları (WorkLog)"},
    {"name": "Güvenlik", "description": "Giriş/çıkış (GateLog) ve checklist yönetimi"},
]

# ============================================
# RATE LIMITING
# ============================================
DEFAULT_RATE_LIMITS = ["300/minute"]  # TODO: Config'e alınabilir (ENV: RATE_LIMIT_DEFAULT)

def auth_aware_key_func(request: Request):
    """Kimlik doğrulanmış isteklerde user_id, aksi halde IP bazlı anahtar döndürür.
    Not: Performans için JWT decode minimal yapılır; başarısız olursa IP'ye düşer.
    """
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth.split(" ", 1)[1]
        try:
            from .modules.auth.utils import verify_token
            payload = verify_token(token, token_type="access")
            if payload and payload.get("user_id"):
                return f"user:{payload['user_id']}"
        except Exception:
            pass
    # Fallback IP
    return f"ip:{get_remote_address(request)}"

limiter = Limiter(key_func=auth_aware_key_func, default_limits=DEFAULT_RATE_LIMITS, headers_enabled=True)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Standart JSON zarf + otomatik X-RateLimit-* başlıkları.
    SlowAPI'nin private _inject_headers fonksiyonu ile pencere değerleri eklenir.
    """
    from .core.error_codes import ErrorCode
    logger.warning(f"Rate limit exceeded: key={auth_aware_key_func(request)} path={request.url.path} limit={exc.detail}")
    response = JSONResponse(
        status_code=429,
        content={
            "success": False,
            "message": "İstek sınırı aşıldı",
            "error": {
                "code": ErrorCode.RATE_LIMIT_EXCEEDED,
                "message": "Çok fazla istek. Lütfen daha sonra tekrar deneyin.",
                "details": {
                    "route": request.url.path,
                    "policy": exc.detail
                }
            }
        }
    )
    # Dinamik header ekleme (X-RateLimit-Limit, Remaining, Reset, Retry-After)
    try:
        limiter._inject_headers(response, getattr(request.state, 'view_rate_limit', None))
    except Exception:
        # Header ekleme başarısız olursa sessiz geç (loglamaya gerek yok, zaten limit hit log'u var)
        pass
    return response

app.add_middleware(SlowAPIMiddleware)

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

# Audit middleware (her HTTP isteğini DB'ye yazar)
@app.middleware("http")
async def audit_middleware(request: Request, call_next):
    start = time.monotonic()
    response = await call_next(request)
    duration_ms = int((time.monotonic() - start) * 1000)
    # Persist audit (non-blocking, safe-fail)
    try:
        persist_audit_event(request, response, duration_ms)
    except Exception:
        pass
    return response

# CORS middleware - Frontend'in backend'e erişmesi için
# Tüm origins'i dev modunda allow et
ALLOWED_ORIGINS = ["http://localhost:5000", "http://localhost:5173", "http://127.0.0.1:5000", "http://127.0.0.1:5173"]
if os.getenv("ENVIRONMENT") == "production":
    ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["x-request-id", "x-ratelimit-limit", "x-ratelimit-remaining"],
    max_age=3600,
)

# ============================================
# SECURITY HEADERS MIDDLEWARE
# ============================================
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    # Temel güvenlik başlıkları
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=()"  # gerekirse genişlet
    # Dev ortamında CSP esnek; prod'da sıkılaştırılmalı
    csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    response.headers["Content-Security-Policy"] = csp
    # HTTPS production için
    if os.getenv("ENABLE_HSTS","0") == "1":
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    return response

# ============================================
# DATABASE MIGRATIONS
# ============================================
# REMOVED: Base.metadata.create_all(bind=engine)
# Database schema now managed by Alembic migrations
# To create/update tables: `alembic upgrade head`
# To create new migration: `alembic revision --autogenerate -m "description"`

# ============================================
# SCHEDULER - Background Jobs (FAZ 5)
# ============================================
# APScheduler ile background jobs (kur update, log archiving, vb.)

@app.on_event("startup")
async def startup_event():
    """Uygulama başlangıcında scheduler ve job'ları başlat"""
    from .core.scheduler import start_scheduler
    from .jobs import register_jobs
    
    # Scheduler'ı başlat
    start_scheduler()
    
    # Job'ları kaydet (kur sync, audit archive, vb.)
    register_jobs()
    
    logger.info("✅ Background jobs initialized")


@app.on_event("shutdown")
async def shutdown_event():
    """Uygulama kapanışında scheduler'ı gracefully durdur"""
    from .core.scheduler import shutdown_scheduler
    
    shutdown_scheduler()
    logger.info("✅ Application shutdown complete")

# ============================================

# Router'ları ekle
app.include_router(monitoring_router)  # FAZ 6: /health, /ready, /metrics, /status
if auth_router is not None:
    app.include_router(auth_router, prefix="/api/auth")  # FAZ 4: /api/auth endpoints (login, logout, refresh, users)
app.include_router(audit_router)  # Register audit router
app.include_router(router_cari)
app.include_router(router_motorbot)  # içinde /sefer endpoints var
if router_sefer is not None:
    app.include_router(router_sefer)  # /api/mb-trip legacy sefer endpoints
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
        "standard_envelope": {
            "success": True,
            "message": "İşlem mesajı",
            "data": {"id": 123, "example": True},
            "error": {"code": "ERROR_CODE", "message": "Hata açıklaması"},
            "pagination": {"page": 1, "page_size": 20, "total": 100}
        },
        "endpoints": {
            "monitoring": {
                "health": "/health",
                "ready": "/ready",
                "metrics": "/metrics",
                "status": "/status"
            },
            "auth": "/auth",
            "cari": "/api/cari",
            "motorbot": "/api/motorbot",
            "sefer": "/api/motorbot/sefer",
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


# Legacy health endpoint (backward compatibility)
@app.get("/health")
def health_check_legacy():
    """Deprecated: Use root /health instead"""
    return {"status": "healthy", "database": "sqlite"}

# Custom OpenAPI şeması: global response örnekleri ve tag listesi
from .core.responses import StandardResponse, ErrorResponse, PaginatedResponse

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        tags=openapi_tags
    )
    schema.setdefault("components", {})
    comps = schema["components"]
    comps.setdefault("examples", {})
    comps["examples"].update({
        "StandardSuccess": {
            "summary": "Başarılı cevap",
            "value": {"success": True, "message": "İşlem başarılı", "data": {"id": 1}}
        },
        "ErrorEnvelope": {
            "summary": "Hata cevabı",
            "value": {"success": False, "message": "İşlem başarısız", "error": {"code": "CARI_NOT_FOUND", "message": "Cari bulunamadı"}}
        },
        "PaginatedEnvelope": {
            "summary": "Sayfalanmış cevap",
            "value": {"success": True, "message": "Kayıtlar getirildi", "data": [{"id": 1}], "pagination": {"page": 1, "page_size": 20, "total": 1}}
        }
    })
    comps.setdefault("responses", {})
    comps["responses"].update({
        "StandardResponse": {
            "description": "Standart başarılı yanıt zarfı",
            "content": {"application/json": {"schema": {"$ref": "#/components/schemas/StandardResponse"}, "examples": {"success": {"$ref": "#/components/examples/StandardSuccess"}}}}
        },
        "ErrorResponse": {
            "description": "Hata yanıt zarfı",
            "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "examples": {"error": {"$ref": "#/components/examples/ErrorEnvelope"}}}}
        },
        "PaginatedResponse": {
            "description": "Sayfalanmış veri yanıt zarfı",
            "content": {"application/json": {"schema": {"$ref": "#/components/schemas/PaginatedResponse"}, "examples": {"paginated": {"$ref": "#/components/examples/PaginatedEnvelope"}}}}
        }
    })
    app.openapi_schema = schema
    return app.openapi_schema

app.openapi = custom_openapi
