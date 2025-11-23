"""
Background Jobs & Task Scheduling - APScheduler Setup
Aliaport v3.1 - FAZ 5 (Performance & Scalability)
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.executors.pool import ThreadPoolExecutor, ProcessPoolExecutor
from datetime import datetime
import logging
import os

logger = logging.getLogger(__name__)

# Database URL (PostgreSQL için job persistence)
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./aliaport.db"  # Development fallback
)

# Job stores (PostgreSQL'de job metadata sakla)
jobstores = {
    'default': SQLAlchemyJobStore(url=DATABASE_URL)
}

# Executors (thread ve process pool)
executors = {
    'default': ThreadPoolExecutor(max_workers=5),
    'processpool': ProcessPoolExecutor(max_workers=3)
}

# Job defaults (global ayarlar)
job_defaults = {
    'coalesce': True,  # Birden fazla missed run varsa tek seferde çalıştır
    'max_instances': 1,  # Aynı job'dan sadece 1 instance çalışsın (overlap prevention)
    'misfire_grace_time': 300  # 5 dakika geç başlama toleransı
}

# Scheduler instance (AsyncIO - FastAPI ile uyumlu)
scheduler = AsyncIOScheduler(
    jobstores=jobstores,
    executors=executors,
    job_defaults=job_defaults,
    timezone='Europe/Istanbul'  # Türkiye saati
)


def start_scheduler():
    """
    Scheduler'ı başlat
    
    FastAPI startup event'inde çağrılır.
    """
    if not scheduler.running:
        scheduler.start()
        logger.info("✅ APScheduler started successfully")
        
        # Mevcut job'ları logla
        jobs = scheduler.get_jobs()
        if jobs:
            logger.info(f"📋 Registered jobs ({len(jobs)}):")
            for job in jobs:
                logger.info(f"  - {job.id}: {job.name} (next run: {job.next_run_time})")
        else:
            logger.warning("⚠️  No jobs registered yet")
    else:
        logger.warning("⚠️  APScheduler already running")


def shutdown_scheduler():
    """
    Scheduler'ı gracefully durdur
    
    FastAPI shutdown event'inde çağrılır.
    Running job'ların tamamlanmasını bekler.
    """
    if scheduler.running:
        logger.info("🛑 Shutting down APScheduler...")
        scheduler.shutdown(wait=True)  # wait=True: Running job'ları bekle
        logger.info("✅ APScheduler shutdown complete")
    else:
        logger.warning("⚠️  APScheduler not running")


def get_scheduler_info():
    """
    Scheduler durumu ve job listesi
    
    Returns:
        dict: Scheduler metadata
    """
    jobs = scheduler.get_jobs()
    
    job_list = []
    for job in jobs:
        job_list.append({
            "id": job.id,
            "name": job.name,
            "trigger": str(job.trigger),
            "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
            "max_instances": job.max_instances,
            "coalesce": job.coalesce
        })
    
    return {
        "running": scheduler.running,
        "state": scheduler.state,
        "timezone": str(scheduler.timezone),
        "jobs_count": len(jobs),
        "jobs": job_list
    }


def pause_job(job_id: str):
    """Job'ı geçici olarak durdur"""
    scheduler.pause_job(job_id)
    logger.info(f"⏸️  Job paused: {job_id}")


def resume_job(job_id: str):
    """Durdurulmuş job'ı devam ettir"""
    scheduler.resume_job(job_id)
    logger.info(f"▶️  Job resumed: {job_id}")


def remove_job(job_id: str):
    """Job'ı tamamen kaldır"""
    scheduler.remove_job(job_id)
    logger.info(f"🗑️  Job removed: {job_id}")


def run_job_now(job_id: str):
    """Job'ı hemen çalıştır (zamanlanmış run'dan bağımsız)"""
    job = scheduler.get_job(job_id)
    if job:
        job.modify(next_run_time=datetime.now())
        logger.info(f"🚀 Job triggered manually: {job_id}")
    else:
        logger.error(f"❌ Job not found: {job_id}")
