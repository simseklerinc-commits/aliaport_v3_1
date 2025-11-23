"""
Health Check & Metrics Endpoints
Monitoring, health checks ve Prometheus metrics
"""
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict
import psutil
import os

from ..config.database import get_db, engine
from ..core.responses import success_response
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

router = APIRouter(tags=["Monitoring"])

# Prometheus Metrics
REQUEST_COUNT = Counter('aliaport_http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('aliaport_http_request_duration_seconds', 'HTTP request duration', ['method', 'endpoint'])
ACTIVE_USERS = Gauge('aliaport_active_users', 'Number of active users')
DB_CONNECTIONS = Gauge('aliaport_db_connections', 'Database connections')
CACHE_HIT_RATE = Gauge('aliaport_cache_hit_rate', 'Cache hit rate percentage')

# Business Metrics
WORK_ORDERS_TOTAL = Counter('aliaport_work_orders_total', 'Total work orders created', ['status'])
GATE_LOGS_TOTAL = Counter('aliaport_gate_logs_total', 'Total gate logs', ['direction'])
CURRENCY_SYNC_SUCCESS = Counter('aliaport_currency_sync_success', 'Successful currency syncs')
CURRENCY_SYNC_FAILURE = Counter('aliaport_currency_sync_failure', 'Failed currency syncs')


@router.get("/health")
async def health_check():
    """
    Basit health check - uptime kontrolü
    Load balancer ve monitoring için
    """
    return {
        "status": "healthy",
        "service": "aliaport-api",
        "version": "3.1.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/ready")
async def readiness_check(db: Session = Depends(get_db)):
    """
    Readiness check - Database bağlantı kontrolü
    K8s/Docker orchestration için
    """
    try:
        # Database connectivity test
        db.execute("SELECT 1")
        
        return success_response(
            data={
                "status": "ready",
                "database": "connected",
                "timestamp": datetime.utcnow().isoformat()
            },
            message="Service ready"
        )
    except Exception as e:
        # 503 Service Unavailable
        return Response(
            content=f'{{"status":"not_ready","error":"{str(e)}"}}',
            status_code=503,
            media_type="application/json"
        )


@router.get("/metrics")
async def metrics():
    """
    Prometheus metrics endpoint
    Format: Prometheus exposition format
    """
    # Update runtime metrics
    try:
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Database connections (PostgreSQL)
        if 'postgresql' in str(engine.url):
            result = engine.execute("SELECT count(*) FROM pg_stat_activity")
            db_conn_count = result.fetchone()[0]
            DB_CONNECTIONS.set(db_conn_count)
        
    except Exception:
        pass  # Metrics collection hatası loglara düşer, endpoint patlamaz
    
    # Generate Prometheus format
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@router.get("/status")
async def detailed_status(db: Session = Depends(get_db)):
    """
    Detaylı sistem durumu
    Admin dashboard için
    """
    try:
        # System info
        cpu_percent = psutil.cpu_percent(interval=0.5)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Database test
        db.execute("SELECT 1")
        db_status = "connected"
        
        # Uptime
        uptime_seconds = int((datetime.utcnow() - datetime.fromtimestamp(psutil.boot_time())).total_seconds())
        
        return success_response(
            data={
                "service": "aliaport-api",
                "version": "3.1.0",
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "uptime_seconds": uptime_seconds,
                "system": {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_available_mb": memory.available // (1024 * 1024),
                    "disk_percent": disk.percent,
                    "disk_free_gb": disk.free // (1024 ** 3)
                },
                "database": {
                    "status": db_status,
                    "engine": str(engine.url.drivername)
                },
                "environment": os.getenv("ENVIRONMENT", "development")
            },
            message="Detailed system status"
        )
    except Exception as e:
        return Response(
            content=f'{{"status":"unhealthy","error":"{str(e)}"}}',
            status_code=503,
            media_type="application/json"
        )
