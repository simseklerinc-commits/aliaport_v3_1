# app/aliaport_web.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .models import Cari, Motorbot, MbTrip  # tablonun ORM'i yüklensin
from . import router_cari
from . import router_motorbot
from . import router_mbtrip

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

# Router'ları ekle
app.include_router(router_cari.router)
app.include_router(router_motorbot.router)
app.include_router(router_mbtrip.router)


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
            "docs": "/docs"
        }
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "sqlite"}
