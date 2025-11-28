"""
Dijital Arşiv Belge Süre Takibi Job
Belge sürelerini kontrol eder, uyarı bildirimleri gönderir ve süresi dolmuş belgeleri işaretler

Workflow:
1. 09:00 - Dolacak Belgeleri Kontrol:
   - 30 gün içinde dolacak belgeleri bul
   - Henüz bildirim gönderilmemişse e-posta/bildirim gönder
   - expiry_notification_sent = True olarak işaretle

2. 00:00 - Dolmuş Belgeleri İşaretle:
   - expires_at < bugün olan belgeleri bul
   - Status → EXPIRED olarak güncelle
   - Cari ve Aliaport personeline bildirim gönder

Schedule:
- 09:00: Dolacak belge uyarıları (workday hours)
- 00:00: Dolmuş belge kontrolü (off-hours)

Retry: 3 kez, 10 dakika ara ile
"""

from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


async def check_expiring_documents_job():
    """
    30 gün içinde dolacak belgeler için uyarı bildirimleri gönder
    
    Flow:
    1. DocumentExpiryManager.get_expiring_documents(days_before=30)
    2. expiry_notification_sent=False olanları filtrele
    3. Her belge için:
       - Portal user'a bildirim + e-posta gönder
       - İlgili Aliaport personeline bildirim gönder
       - expiry_notification_sent = True işaretle
    
    Schedule: Her gün 09:00 (işgünü saatleri)
    """
    from ..config.database import get_db
    from ..modules.dijital_arsiv.expiry import DocumentExpiryManager
    from ..modules.dijital_arsiv.models import Notification, NotificationType
    
    start_time = datetime.utcnow()
    db: Session = next(get_db())
    
    try:
        logger.info("🔄 Dolacak belge kontrolü başladı (30 gün)")
        
        expiry_manager = DocumentExpiryManager(db)
        
        # 30 gün içinde dolacak belgeleri al
        expiring_docs = expiry_manager.get_expiring_documents(days_before=30)
        
        # Henüz bildirim gönderilmemişleri filtrele
        pending_notifications = [
            doc for doc in expiring_docs 
            if not doc.expiry_notification_sent
        ]
        
        logger.info(
            f"📊 {len(expiring_docs)} belge dolmak üzere, "
            f"{len(pending_notifications)} bildirim gönderilecek"
        )
        
        if not pending_notifications:
            logger.info("✅ Bildirim gönderilecek belge yok")
            db.close()
            return
        
        notification_count = 0
        
        for doc in pending_notifications:
            try:
                days_remaining = doc.days_until_expiry
                
                # Portal user'a bildirim oluştur
                if doc.uploaded_by_portal_user_id:
                    portal_notification = Notification(
                        portal_user_id=doc.uploaded_by_portal_user_id,
                        type=NotificationType.DOCUMENT_EXPIRING,
                        title=f"Belge Süre Uyarısı - {doc.document_type.value}",
                        message=(
                            f"{doc.document_type.value} belgesi {days_remaining} gün içinde sona erecek.\n"
                            f"Belge: {doc.file_name}\n"
                            f"İş Emri: {doc.work_order.work_order_no if doc.work_order else 'N/A'}\n"
                            f"Son Geçerlilik: {doc.expires_at.strftime('%d.%m.%Y')}\n"
                            f"Lütfen yeni belgeyi yükleyin."
                        ),
                        work_order_id=doc.work_order_id,
                        document_id=doc.id
                    )
                    db.add(portal_notification)
                    logger.debug(
                        f"📧 Portal bildirim oluşturuldu: {doc.file_name} "
                        f"({days_remaining} gün kaldı)"
                    )
                
                # TODO: E-posta gönderimi (EmailService entegrasyonu)
                # email_service.send_expiry_warning_email(
                #     to_email=doc.uploaded_by_portal_user.email,
                #     document=doc,
                #     days_remaining=days_remaining
                # )
                
                # İlgili Aliaport personeline bildirim (iş emri sahibi/sorumlu)
                if doc.work_order and doc.work_order.created_by_id:
                    internal_notification = Notification(
                        user_id=doc.work_order.created_by_id,
                        type=NotificationType.DOCUMENT_EXPIRING,
                        title=f"Müşteri Belgesi Dolmak Üzere - {doc.document_type.value}",
                        message=(
                            f"İş Emri: {doc.work_order.work_order_no}\n"
                            f"Belge: {doc.document_type.value}\n"
                            f"{days_remaining} gün içinde sona erecek.\n"
                            f"Müşteriyle iletişime geçin."
                        ),
                        work_order_id=doc.work_order_id,
                        document_id=doc.id
                    )
                    db.add(internal_notification)
                
                # Bildirimi işaretle
                doc.expiry_notification_sent = True
                notification_count += 1
                
            except Exception as e:
                logger.error(
                    f"❌ Belge bildirim hatası (ID: {doc.id}): {e}",
                    exc_info=True
                )
                continue
        
        db.commit()
        
        duration = (datetime.utcnow() - start_time).total_seconds()
        logger.info(
            f"✅ Dolacak belge kontrolü tamamlandı!\n"
            f"   📊 {notification_count} bildirim gönderildi\n"
            f"   ⏱️  Süre: {duration:.2f}s"
        )
        
    except Exception as e:
        logger.error(
            f"❌ Dolacak belge kontrolü job failed: {str(e)}",
            exc_info=True
        )
        db.rollback()
        raise
    
    finally:
        db.close()


async def mark_expired_documents_job():
    """
    Süresi dolmuş belgeleri EXPIRED olarak işaretle
    
    Flow:
    1. DocumentExpiryManager.get_expired_documents()
    2. Her belge için:
       - Status → EXPIRED olarak güncelle
       - mark_as_expired() çağır
       - Portal user'a bildirim + e-posta gönder
       - İlgili Aliaport personeline bildirim gönder
    
    Schedule: Her gün 00:00 (gece yarısı batch job)
    """
    from ..config.database import get_db
    from ..modules.dijital_arsiv.expiry import DocumentExpiryManager
    from ..modules.dijital_arsiv.models import Notification, NotificationType
    
    start_time = datetime.utcnow()
    db: Session = next(get_db())
    
    try:
        logger.info("🔄 Dolmuş belge kontrolü başladı")
        
        expiry_manager = DocumentExpiryManager(db)
        
        # Süresi dolmuş belgeleri al
        expired_docs = expiry_manager.get_expired_documents()
        
        logger.info(f"📊 {len(expired_docs)} belge süresi dolmuş")
        
        if not expired_docs:
            logger.info("✅ Süresi dolmuş belge yok")
            db.close()
            return
        
        expired_count = 0
        
        for doc in expired_docs:
            try:
                # Belgeyi EXPIRED olarak işaretle
                expiry_manager.mark_as_expired(doc.id)
                
                # Portal user'a bildirim oluştur
                if doc.uploaded_by_portal_user_id:
                    portal_notification = Notification(
                        portal_user_id=doc.uploaded_by_portal_user_id,
                        type=NotificationType.DOCUMENT_EXPIRED,
                        title=f"Belge Süresi Doldu - {doc.document_type.value}",
                        message=(
                            f"{doc.document_type.value} belgesinin süresi doldu!\n"
                            f"Belge: {doc.file_name}\n"
                            f"İş Emri: {doc.work_order.work_order_no if doc.work_order else 'N/A'}\n"
                            f"Son Geçerlilik: {doc.expires_at.strftime('%d.%m.%Y')}\n"
                            f"Lütfen acilen yeni belgeyi yükleyin."
                        ),
                        work_order_id=doc.work_order_id,
                        document_id=doc.id
                    )
                    db.add(portal_notification)
                    logger.debug(f"📧 Portal bildirim oluşturuldu: {doc.file_name} (EXPIRED)")
                
                # TODO: E-posta gönderimi (EmailService entegrasyonu)
                # email_service.send_document_expired_email(
                #     to_email=doc.uploaded_by_portal_user.email,
                #     document=doc
                # )
                
                # İlgili Aliaport personeline bildirim (iş emri sahibi/sorumlu)
                if doc.work_order and doc.work_order.created_by_id:
                    internal_notification = Notification(
                        user_id=doc.work_order.created_by_id,
                        type=NotificationType.DOCUMENT_EXPIRED,
                        title=f"Müşteri Belgesi Süresi Doldu - {doc.document_type.value}",
                        message=(
                            f"İş Emri: {doc.work_order.work_order_no}\n"
                            f"Belge: {doc.document_type.value}\n"
                            f"Süre: {doc.expires_at.strftime('%d.%m.%Y')} (DOLMUŞ)\n"
                            f"Müşteriyle acil iletişime geçin!"
                        ),
                        work_order_id=doc.work_order_id,
                        document_id=doc.id
                    )
                    db.add(internal_notification)
                
                expired_count += 1
                
            except Exception as e:
                logger.error(
                    f"❌ Belge expired işaretleme hatası (ID: {doc.id}): {e}",
                    exc_info=True
                )
                continue
        
        db.commit()
        
        duration = (datetime.utcnow() - start_time).total_seconds()
        logger.info(
            f"✅ Dolmuş belge kontrolü tamamlandı!\n"
            f"   📊 {expired_count} belge EXPIRED olarak işaretlendi\n"
            f"   ⏱️  Süre: {duration:.2f}s"
        )
        
    except Exception as e:
        logger.error(
            f"❌ Dolmuş belge kontrolü job failed: {str(e)}",
            exc_info=True
        )
        db.rollback()
        raise
    
    finally:
        db.close()


def register_document_expiry_job(scheduler):
    """
    Belge süre takibi job'larını APScheduler'a kaydet
    
    3 Job:
    1. check_expiring_documents: Her gün 09:00 (30 gün uyarısı) - Employee docs
    2. mark_expired_documents: Her gün 00:00 (süre dolmuş işaretleme) - Employee docs
    3. check_vehicle_document_expiry: Her gün 00:30 (araç evrakları)
    
    Args:
        scheduler: APScheduler instance
    """
    # Job 1: Dolacak belge uyarıları (09:00)
    scheduler.add_job(
        check_expiring_documents_job,
        trigger=CronTrigger(
            hour=9,
            minute=0,
            timezone='Europe/Istanbul'
        ),
        id='document_expiry_warnings',
        name='Dolacak Belge Uyarıları',
        replace_existing=True,
        misfire_grace_time=600,  # 10 dakika geç başlama toleransı
        max_instances=1
    )
    logger.info("📋 Dolacak belge uyarı job registered (daily at 09:00 Istanbul)")
    
    # Job 2: Dolmuş belge kontrolü (00:00)
    scheduler.add_job(
        mark_expired_documents_job,
        trigger=CronTrigger(
            hour=0,
            minute=0,
            timezone='Europe/Istanbul'
        ),
        id='document_expiry_check',
        name='Dolmuş Belge Kontrolü',
        replace_existing=True,
        misfire_grace_time=600,  # 10 dakika geç başlama toleransı
        max_instances=1
    )
    logger.info("📋 Dolmuş belge kontrol job registered (daily at 00:00 Istanbul)")
    
    # Job 3: Araç evrakları süre kontrolü (00:30)
    scheduler.add_job(
        check_vehicle_documents_expiry_job,
        trigger=CronTrigger(
            hour=0,
            minute=30,
            timezone='Europe/Istanbul'
        ),
        id='vehicle_document_expiry_check',
        name='Araç Evrakları Süre Kontrolü',
        replace_existing=True,
        misfire_grace_time=600,
        max_instances=1
    )
    logger.info("📋 Araç evrakları süre kontrolü job registered (daily at 00:30 Istanbul)")


async def check_vehicle_documents_expiry_job():
    """
    Araç evraklarının süre kontrolü - APPROVED belgeleri kontrol eder
    expires_at < bugün olanları EXPIRED olarak işaretler
    
    Schedule: Her gün 00:30 (employee docs'tan 30 dakika sonra)
    """
    from ..config.database import get_db
    from ..modules.dijital_arsiv.vehicle_documents import check_document_expiry
    
    start_time = datetime.utcnow()
    db: Session = next(get_db())
    
    try:
        logger.info("🚗 Araç evrakları süre kontrolü başladı...")
        
        # Helper fonksiyonu çağır
        check_document_expiry(db)
        
        duration = (datetime.utcnow() - start_time).total_seconds()
        logger.info(
            f"✅ Araç evrakları süre kontrolü tamamlandı!\n"
            f"   ⏱️  Süre: {duration:.2f}s"
        )
        
    except Exception as e:
        logger.error(
            f"❌ Araç evrakları süre kontrolü job failed: {str(e)}",
            exc_info=True
        )
        db.rollback()
        raise
    
    finally:
        db.close()
