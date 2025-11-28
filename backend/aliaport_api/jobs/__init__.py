"""
Background Jobs Module
Tekrarlayan görevlerin (kur update, log archiving, vb.) tanımları
"""

__all__ = ['register_jobs']

import logging

logger = logging.getLogger(__name__)


def register_jobs():
    """
    Tüm background job'ları scheduler'a kaydet
    
    FastAPI startup event'inde çağrılır.
    Her job modülünden register fonksiyonu import edilir ve çalıştırılır.
    """
    from ..core.scheduler import scheduler
    
    logger.info("📋 Registering background jobs...")
    
    # Job registration fonksiyonlarını import et
    try:
        from .kur_sync_job import register_kur_sync_job
        register_kur_sync_job(scheduler)
        logger.info("✅ Kur sync job registered")
    except ImportError as e:
        logger.warning(f"⚠️  Kur sync job not available: {e}")
    
    try:
        from .audit_archive_job import register_audit_archive_job
        register_audit_archive_job(scheduler)
        logger.info("✅ Audit archive job registered")
    except ImportError as e:
        logger.warning(f"⚠️  Audit archive job not available: {e}")
    
    try:
        from .document_expiry_job import register_document_expiry_job
        register_document_expiry_job(scheduler)
        logger.info("✅ Document expiry job registered")
    except ImportError as e:
        logger.warning(f"⚠️  Document expiry job not available: {e}")

    try:
        from .sgk_reminder_job import register_sgk_reminder_job
        register_sgk_reminder_job(scheduler)
        logger.info("✅ SGK reminder job registered")
    except ImportError as e:
        logger.warning(f"⚠️  SGK reminder job not available: {e}")
    
    # Gelecekte eklenecek job'lar
    # try:
    #     from .backup_job import register_backup_job
    #     register_backup_job(scheduler)
    # except ImportError:
    #     pass
    
    logger.info("✅ All background jobs registered")
