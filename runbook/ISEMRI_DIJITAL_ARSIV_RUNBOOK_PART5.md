# Aliaport İş Emri ve Dijital Arşiv Modülü - RUNBOOK (Bölüm 5/5)

**Versiyon:** 2.0  
**Tarih:** 25 Kasım 2025  
**Kapsam:** İleri Seviye Özellikler - Versiyon Kontrolü, Süre Takibi, Otomatik İşlemler  
**Hazırlayan:** GitHub Copilot + Aliaport Ekibi

---

## 🚀 BÖLÜM 5: İLERİ SEVİYE ÖZELLİKLER

### 5.1. Belge Versiyon Kontrolü

#### 5.1.1. Versiyon Mekanizması

```python
# backend/aliaport_api/modules/dijital_arsiv/services.py

from typing import Optional
from sqlalchemy.orm import Session
from .models import ArchiveDocument, DocumentStatus
from datetime import datetime

class DocumentVersionService:
    """Belge versiyon yönetimi"""
    
    def create_new_version(
        self, 
        db: Session, 
        original_document_id: int, 
        new_file_data: dict,
        uploaded_by_id: Optional[int] = None,
        uploaded_by_portal_user_id: Optional[int] = None
    ) -> ArchiveDocument:
        """
        Yeni belge versiyonu oluştur
        
        Senaryo: Belge reddedildi, müşteri düzeltilmiş belgeyi yükler
        
        İşlem adımları:
        1. Eski belgeyi arşivle (is_latest_version = False, status = ARCHIVED)
        2. Yeni belge oluştur (version = eski_version + 1)
        3. Yeni belgeyi son versiyon yap (is_latest_version = True)
        """
        # Eski belgeyi bul
        old_doc = db.query(ArchiveDocument).filter(
            ArchiveDocument.id == original_document_id
        ).first()
        
        if not old_doc:
            raise ValueError(f"Document {original_document_id} not found")
        
        # Sadece reddedilen belgeler için yeni versiyon
        if old_doc.status != DocumentStatus.REJECTED:
            raise ValueError("Only rejected documents can be replaced")
        
        # Eski belgeyi arşivle
        old_doc.is_latest_version = False
        old_doc.status = DocumentStatus.ARCHIVED
        
        # Yeni belge oluştur
        new_doc = ArchiveDocument(
            category=old_doc.category,
            document_type=old_doc.document_type,
            work_order_id=old_doc.work_order_id,
            cari_id=old_doc.cari_id,
            
            # Dosya bilgileri (yeni)
            file_name=new_file_data['file_name'],
            file_path=new_file_data['file_path'],
            file_size=new_file_data['file_size'],
            file_type=new_file_data['file_type'],
            file_hash=new_file_data['file_hash'],
            
            # Versiyon
            version=old_doc.version + 1,
            is_latest_version=True,
            previous_version_id=old_doc.id,
            
            # Durum
            status=DocumentStatus.UPLOADED,  # Yeni belge onay bekliyor
            
            # Yükleyen
            uploaded_by_id=uploaded_by_id,
            uploaded_by_portal_user_id=uploaded_by_portal_user_id,
            uploaded_at=datetime.utcnow(),
            
            # Metadata
            description=old_doc.description,
            tags=old_doc.tags
        )
        
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
        
        return new_doc
    
    def get_version_history(self, db: Session, document_id: int) -> list[ArchiveDocument]:
        """
        Belge versiyon geçmişini getir
        
        Returns:
            [v3 (latest), v2 (archived), v1 (archived)]
        """
        # Son versiyonu bul
        latest = db.query(ArchiveDocument).filter(
            ArchiveDocument.id == document_id
        ).first()
        
        if not latest:
            return []
        
        # Versiyon zincirini takip et
        versions = [latest]
        current = latest
        
        while current.previous_version_id:
            prev = db.query(ArchiveDocument).filter(
                ArchiveDocument.id == current.previous_version_id
            ).first()
            if prev:
                versions.append(prev)
                current = prev
            else:
                break
        
        return versions  # [v3, v2, v1]
    
    def rollback_to_version(self, db: Session, target_version_id: int) -> ArchiveDocument:
        """
        Belirli bir versiyona geri dön (admin işlemi)
        
        Dikkat: Bu işlem nadiren kullanılır
        """
        target = db.query(ArchiveDocument).filter(
            ArchiveDocument.id == target_version_id
        ).first()
        
        if not target:
            raise ValueError(f"Version {target_version_id} not found")
        
        # Tüm versiyonları bul
        versions = self.get_version_history(db, target_version_id)
        
        # Son versiyonu arşivle
        for v in versions:
            if v.is_latest_version:
                v.is_latest_version = False
                v.status = DocumentStatus.ARCHIVED
        
        # Hedef versiyonu son versiyon yap
        target.is_latest_version = True
        target.status = DocumentStatus.APPROVED  # Rollback edilenler otomatik onaylı
        
        db.commit()
        return target
```

---

#### 5.1.2. Versiyon Karşılaştırma UI

```
┌─────────────────────────────────────────────────────────────────┐
│ BELGE VERSİYON GEÇMİŞİ - WO202511025                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📄 Gümrük İzin Belgesi - 3 Versiyon                           │
│                                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                 │
│  ✅ Versiyon 3 (Aktif)                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Dosya: gumruk_izin_v3.pdf (2.3 MB)                      │   │
│  │ Yüklenme: 26 Kasım 2025, 10:30                          │   │
│  │ Yükleyen: Ahmet Yılmaz (Portal)                         │   │
│  │ Durum: ✅ ONAYLANDI                                     │   │
│  │ Onaylayan: Ahmet Yıldız                                 │   │
│  │ Onay Tarihi: 26 Kasım 2025, 11:00                       │   │
│  │ Not: "Güncel belge, uygun"                              │   │
│  │                                                         │   │
│  │ [ GÖRÜNTÜLE ]  [ İNDİR ]                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                 │
│  ❌ Versiyon 2 (Arşiv)                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Dosya: gumruk_izin_v2.pdf (2.1 MB)                      │   │
│  │ Yüklenme: 25 Kasım 2025, 17:00                          │   │
│  │ Yükleyen: Ahmet Yılmaz (Portal)                         │   │
│  │ Durum: ❌ REDDEDİLDİ                                    │   │
│  │ Reddeden: Mehmet Kaya                                   │   │
│  │ Red Tarihi: 25 Kasım 2025, 18:00                        │   │
│  │ Red Sebebi: "Belge tarihi hatalı"                       │   │
│  │                                                         │   │
│  │ [ GÖRÜNTÜLE ]  [ İNDİR ]                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                 │
│  ❌ Versiyon 1 (Arşiv)                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Dosya: gumruk_izin.pdf (2.5 MB)                         │   │
│  │ Yüklenme: 25 Kasım 2025, 15:45                          │   │
│  │ Yükleyen: Ahmet Yılmaz (Portal)                         │   │
│  │ Durum: ❌ REDDEDİLDİ                                    │   │
│  │ Reddeden: Ahmet Yıldız                                  │   │
│  │ Red Tarihi: 25 Kasım 2025, 16:30                        │   │
│  │ Red Sebebi: "Belge tarihi eski (30 günden fazla)"      │   │
│  │                                                         │   │
│  │ [ GÖRÜNTÜLE ]  [ İNDİR ]                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5.2. Süre Sınırlı Belgeler

#### 5.2.1. Süre Takip Sistemi

```python
# backend/aliaport_api/modules/dijital_arsiv/expiry.py

from datetime import datetime, timedelta
from typing import Dict
from .models import DocumentType

class DocumentExpiryManager:
    """Belge süre takip yöneticisi"""
    
    # Belge tipine göre geçerlilik süreleri (gün)
    EXPIRY_PERIODS: Dict[DocumentType, int] = {
        # Çalışan belgeleri
        DocumentType.SRC5: 365,              # 1 yıl
        DocumentType.SIGORTA_LISTESI: 365,   # 1 yıl
        
        # Araç belgeleri
        DocumentType.ARAC_MUAYENE: 730,      # 2 yıl
        DocumentType.ARAC_SIGORTA: 365,      # 1 yıl
    }
    
    def calculate_expiry_date(self, document_type: DocumentType, issue_date: datetime) -> datetime:
        """
        Belge geçerlilik bitiş tarihini hesapla
        
        Args:
            document_type: Belge tipi
            issue_date: Düzenlenme tarihi
        
        Returns:
            Geçerlilik bitiş tarihi veya None (süreli değilse)
        """
        if document_type not in self.EXPIRY_PERIODS:
            return None  # Süreli belge değil
        
        days = self.EXPIRY_PERIODS[document_type]
        return issue_date + timedelta(days=days)
    
    def get_expiring_documents(self, db, days_before: int = 30) -> list:
        """
        Süresi dolmak üzere olan belgeleri getir
        
        Args:
            days_before: Kaç gün önceden uyarı (default 30)
        
        Returns:
            [
                {document, days_until_expiry},
                ...
            ]
        """
        from .models import ArchiveDocument, DocumentStatus
        
        now = datetime.utcnow()
        threshold = now + timedelta(days=days_before)
        
        # Süreli belgeler
        expiring = db.query(ArchiveDocument).filter(
            ArchiveDocument.is_latest_version == True,
            ArchiveDocument.status == DocumentStatus.APPROVED,
            ArchiveDocument.expires_at.isnot(None),
            ArchiveDocument.expires_at <= threshold,
            ArchiveDocument.expires_at > now  # Henüz dolmamış
        ).all()
        
        return [
            {
                'document': doc,
                'days_until_expiry': (doc.expires_at - now).days
            }
            for doc in expiring
        ]
    
    def get_expired_documents(self, db) -> list:
        """
        Süresi dolmuş belgeleri getir
        """
        from .models import ArchiveDocument, DocumentStatus
        
        now = datetime.utcnow()
        
        expired = db.query(ArchiveDocument).filter(
            ArchiveDocument.is_latest_version == True,
            ArchiveDocument.status == DocumentStatus.APPROVED,
            ArchiveDocument.expires_at.isnot(None),
            ArchiveDocument.expires_at <= now
        ).all()
        
        return expired
    
    def mark_as_expired(self, db, document_id: int):
        """Belgeyi süresi doldu olarak işaretle"""
        from .models import ArchiveDocument, DocumentStatus
        
        doc = db.query(ArchiveDocument).filter(
            ArchiveDocument.id == document_id
        ).first()
        
        if doc and doc.is_expired:
            doc.status = DocumentStatus.EXPIRED
            db.commit()
```

---

#### 5.2.2. Otomatik Süre Kontrolü (Scheduler)

```python
# backend/aliaport_api/scheduler/jobs/document_expiry_check.py

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from aliaport_api.modules.dijital_arsiv.expiry import DocumentExpiryManager
from aliaport_api.core.email import EmailService
import logging

logger = logging.getLogger(__name__)

class DocumentExpiryJob:
    """Belge süre kontrolü scheduler job"""
    
    def __init__(self, db: Session, email_service: EmailService):
        self.db = db
        self.email_service = email_service
        self.expiry_manager = DocumentExpiryManager()
    
    def check_expiring_documents(self):
        """
        30 gün içinde süresi dolacak belgeleri kontrol et ve bildir
        
        Çalışma: Her gün saat 09:00
        """
        logger.info("🔍 Checking expiring documents...")
        
        # 30 gün içinde dolacaklar
        expiring_30 = self.expiry_manager.get_expiring_documents(self.db, days_before=30)
        
        for item in expiring_30:
            doc = item['document']
            days_left = item['days_until_expiry']
            
            # 30 gün uyarısı (ilk kez)
            if days_left <= 30 and days_left > 7 and not doc.expiry_notification_sent:
                self._send_expiry_warning(doc, days_left, urgency="normal")
                doc.expiry_notification_sent = True
                self.db.commit()
            
            # 7 gün uyarısı (kritik)
            elif days_left <= 7:
                self._send_expiry_warning(doc, days_left, urgency="urgent")
        
        logger.info(f"✅ Checked {len(expiring_30)} expiring documents")
    
    def check_expired_documents(self):
        """
        Süresi dolmuş belgeleri kontrol et ve işaretle
        
        Çalışma: Her gün saat 00:00
        """
        logger.info("🔍 Checking expired documents...")
        
        expired = self.expiry_manager.get_expired_documents(self.db)
        
        for doc in expired:
            if doc.status != DocumentStatus.EXPIRED:
                # Belgeyi süresi doldu olarak işaretle
                self.expiry_manager.mark_as_expired(self.db, doc.id)
                
                # Bildirim gönder
                self._send_expired_notification(doc)
        
        logger.info(f"✅ Marked {len(expired)} documents as expired")
    
    def _send_expiry_warning(self, doc, days_left: int, urgency: str):
        """Süre sonu uyarısı gönder"""
        # Çalışan belgesi ise → çalışana email
        # Araç belgesi ise → araç sahibine email
        # Cari belgesi ise → cari firmaya email
        
        if urgency == "urgent":
            subject = f"⚠️ ACİL: {doc.document_type.value} belgeniz {days_left} gün içinde sona erecek"
        else:
            subject = f"🔔 Hatırlatma: {doc.document_type.value} belgeniz {days_left} gün içinde sona erecek"
        
        # Email gönder (örnek)
        logger.info(f"📧 Sending expiry warning: {subject}")
        # self.email_service.send_expiry_warning(...)
    
    def _send_expired_notification(self, doc):
        """Süre doldu bildirimi gönder"""
        subject = f"❌ {doc.document_type.value} belgenizin süresi doldu"
        logger.info(f"📧 Sending expired notification: {subject}")
        # self.email_service.send_expired_notification(...)

# Scheduler setup
def setup_expiry_scheduler(db: Session, email_service: EmailService):
    """Belge süre kontrolü scheduler'ı başlat"""
    scheduler = BackgroundScheduler()
    job = DocumentExpiryJob(db, email_service)
    
    # Her gün saat 09:00'da dolacakları kontrol et
    scheduler.add_job(
        job.check_expiring_documents,
        'cron',
        hour=9,
        minute=0,
        id='check_expiring_documents'
    )
    
    # Her gün saat 00:00'da dolmuşları işaretle
    scheduler.add_job(
        job.check_expired_documents,
        'cron',
        hour=0,
        minute=0,
        id='check_expired_documents'
    )
    
    scheduler.start()
    logger.info("✅ Document expiry scheduler started")
```

---

### 5.3. Otomatik Bildirimler

#### 5.3.1. Bildirim Sistemi

```python
# backend/aliaport_api/core/notifications.py

from enum import Enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from aliaport_api.database import Base

class NotificationType(str, Enum):
    """Bildirim tipleri"""
    WORK_ORDER_CREATED = "WORK_ORDER_CREATED"           # İş emri oluşturuldu
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED"             # Belge yüklendi
    DOCUMENT_APPROVED = "DOCUMENT_APPROVED"             # Belge onaylandı
    DOCUMENT_REJECTED = "DOCUMENT_REJECTED"             # Belge reddedildi
    WORK_ORDER_STARTED = "WORK_ORDER_STARTED"           # İş emri başlatıldı
    WORK_ORDER_COMPLETED = "WORK_ORDER_COMPLETED"       # İş emri tamamlandı
    INVOICE_CREATED = "INVOICE_CREATED"                 # Fatura oluşturuldu
    DOCUMENT_EXPIRING_SOON = "DOCUMENT_EXPIRING_SOON"   # Belge süresi dolmak üzere
    DOCUMENT_EXPIRED = "DOCUMENT_EXPIRED"               # Belge süresi doldu
    PASSWORD_RESET = "PASSWORD_RESET"                   # Şifre sıfırlama

class Notification(Base):
    """Bildirim tablosu"""
    __tablename__ = "notification"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Alıcı
    user_id = Column(Integer, ForeignKey("user.id"), nullable=True)               # Internal user
    portal_user_id = Column(Integer, ForeignKey("portal_user.id"), nullable=True) # Portal user
    
    # Bildirim
    type = Column(Enum(NotificationType), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # İlişkili kayıtlar
    work_order_id = Column(Integer, ForeignKey("work_order.id"), nullable=True)
    document_id = Column(Integer, ForeignKey("archive_document.id"), nullable=True)
    
    # Durum
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)
    
    # Email gönderildi mi?
    email_sent = Column(Boolean, default=False, nullable=False)
    email_sent_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    portal_user = relationship("PortalUser", foreign_keys=[portal_user_id])
    work_order = relationship("WorkOrder", foreign_keys=[work_order_id])
    document = relationship("ArchiveDocument", foreign_keys=[document_id])

class NotificationService:
    """Bildirim servisi"""
    
    def __init__(self, db, email_service):
        self.db = db
        self.email_service = email_service
    
    def create_notification(
        self, 
        notification_type: NotificationType,
        title: str,
        message: str,
        user_id: int = None,
        portal_user_id: int = None,
        work_order_id: int = None,
        document_id: int = None,
        send_email: bool = True
    ) -> Notification:
        """
        Bildirim oluştur
        
        Args:
            notification_type: Bildirim tipi
            title: Başlık
            message: Mesaj
            user_id: Internal kullanıcı (opsiyonel)
            portal_user_id: Portal kullanıcı (opsiyonel)
            work_order_id: İş emri (opsiyonel)
            document_id: Belge (opsiyonel)
            send_email: Email gönder mi?
        """
        # Bildirim oluştur
        notification = Notification(
            type=notification_type,
            title=title,
            message=message,
            user_id=user_id,
            portal_user_id=portal_user_id,
            work_order_id=work_order_id,
            document_id=document_id
        )
        
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        
        # Email gönder
        if send_email:
            self._send_notification_email(notification)
        
        # WebSocket bildirimi (real-time)
        # self._broadcast_websocket(notification)
        
        return notification
    
    def _send_notification_email(self, notification: Notification):
        """Bildirim emaili gönder"""
        if notification.portal_user_id:
            # Portal kullanıcıya email
            user = notification.portal_user
            email = user.email
        elif notification.user_id:
            # Internal kullanıcıya email
            user = notification.user
            email = user.email
        else:
            return
        
        # Email gönder
        try:
            self.email_service.send_notification(
                to_email=email,
                subject=notification.title,
                body=notification.message
            )
            
            notification.email_sent = True
            notification.email_sent_at = datetime.utcnow()
            self.db.commit()
        except Exception as e:
            logger.error(f"Failed to send notification email: {e}")
    
    def mark_as_read(self, notification_id: int, user_id: int = None, portal_user_id: int = None):
        """Bildirimi okundu işaretle"""
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id
        ).first()
        
        if notification:
            # Yetki kontrolü
            if (notification.user_id == user_id) or (notification.portal_user_id == portal_user_id):
                notification.is_read = True
                notification.read_at = datetime.utcnow()
                self.db.commit()
    
    def get_unread_count(self, user_id: int = None, portal_user_id: int = None) -> int:
        """Okunmamış bildirim sayısı"""
        query = self.db.query(Notification).filter(
            Notification.is_read == False
        )
        
        if user_id:
            query = query.filter(Notification.user_id == user_id)
        elif portal_user_id:
            query = query.filter(Notification.portal_user_id == portal_user_id)
        
        return query.count()
```

---

### 5.4. Raporlama ve Analitik

#### 5.4.1. Dashboard İstatistikleri

```python
# backend/aliaport_api/modules/dijital_arsiv/analytics.py

from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from .models import ArchiveDocument, DocumentStatus, DocumentCategory

class ArchiveAnalytics:
    """Dijital arşiv analitik ve raporlama"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_dashboard_stats(self) -> dict:
        """
        Dashboard özet istatistikleri
        
        Returns:
            {
                'total_documents': 245,
                'by_status': {...},
                'by_category': {...},
                'recent_activity': {...}
            }
        """
        # Toplam belge sayısı (son versiyonlar)
        total = self.db.query(ArchiveDocument).filter(
            ArchiveDocument.is_latest_version == True
        ).count()
        
        # Durum bazlı
        by_status = {}
        for status in DocumentStatus:
            count = self.db.query(ArchiveDocument).filter(
                ArchiveDocument.is_latest_version == True,
                ArchiveDocument.status == status
            ).count()
            by_status[status.value] = count
        
        # Kategori bazlı
        by_category = {}
        for category in DocumentCategory:
            count = self.db.query(ArchiveDocument).filter(
                ArchiveDocument.is_latest_version == True,
                ArchiveDocument.category == category
            ).count()
            by_category[category.value] = count
        
        # Son 7 gün aktivite
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_uploads = self.db.query(ArchiveDocument).filter(
            ArchiveDocument.uploaded_at >= seven_days_ago
        ).count()
        
        recent_approvals = self.db.query(ArchiveDocument).filter(
            ArchiveDocument.approved_at >= seven_days_ago
        ).count()
        
        return {
            'total_documents': total,
            'by_status': by_status,
            'by_category': by_category,
            'recent_activity': {
                'last_7_days': {
                    'uploads': recent_uploads,
                    'approvals': recent_approvals
                }
            }
        }
    
    def get_work_order_document_status(self, work_order_id: int) -> dict:
        """
        İş emri belge durumu raporu
        
        Returns:
            {
                'required_documents': [
                    {type: 'GUMRUK_IZIN_BELGESI', status: 'APPROVED', ...}
                ],
                'optional_documents': [...],
                'completion_percentage': 100
            }
        """
        docs = self.db.query(ArchiveDocument).filter(
            ArchiveDocument.work_order_id == work_order_id,
            ArchiveDocument.is_latest_version == True
        ).all()
        
        required_types = [DocumentType.GUMRUK_IZIN_BELGESI]
        
        required = [d for d in docs if d.document_type in required_types]
        optional = [d for d in docs if d.document_type not in required_types]
        
        # Tamamlanma yüzdesi
        if required_types:
            approved_required = sum(1 for d in required if d.status == DocumentStatus.APPROVED)
            completion = (approved_required / len(required_types)) * 100
        else:
            completion = 100
        
        return {
            'required_documents': [self._serialize_doc(d) for d in required],
            'optional_documents': [self._serialize_doc(d) for d in optional],
            'completion_percentage': completion
        }
    
    def get_expiry_report(self) -> dict:
        """
        Süre sonu raporu
        
        Returns:
            {
                'expiring_soon': 12,  # 30 gün içinde
                'expired': 3,
                'by_document_type': {...}
            }
        """
        now = datetime.utcnow()
        thirty_days = now + timedelta(days=30)
        
        # 30 gün içinde dolacaklar
        expiring_soon = self.db.query(ArchiveDocument).filter(
            ArchiveDocument.is_latest_version == True,
            ArchiveDocument.status == DocumentStatus.APPROVED,
            ArchiveDocument.expires_at.isnot(None),
            ArchiveDocument.expires_at <= thirty_days,
            ArchiveDocument.expires_at > now
        ).count()
        
        # Dolmuşlar
        expired = self.db.query(ArchiveDocument).filter(
            ArchiveDocument.is_latest_version == True,
            ArchiveDocument.expires_at.isnot(None),
            ArchiveDocument.expires_at <= now
        ).count()
        
        return {
            'expiring_soon': expiring_soon,
            'expired': expired
        }
    
    def get_approval_time_stats(self, days: int = 30) -> dict:
        """
        Belge onay süreleri istatistiği
        
        Returns:
            {
                'average_approval_time_hours': 3.2,
                'fastest_approval_hours': 0.5,
                'slowest_approval_hours': 24.0
            }
        """
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        approved_docs = self.db.query(ArchiveDocument).filter(
            ArchiveDocument.status == DocumentStatus.APPROVED,
            ArchiveDocument.approved_at >= cutoff
        ).all()
        
        if not approved_docs:
            return {
                'average_approval_time_hours': 0,
                'fastest_approval_hours': 0,
                'slowest_approval_hours': 0
            }
        
        approval_times = []
        for doc in approved_docs:
            delta = doc.approved_at - doc.uploaded_at
            hours = delta.total_seconds() / 3600
            approval_times.append(hours)
        
        return {
            'average_approval_time_hours': round(sum(approval_times) / len(approval_times), 2),
            'fastest_approval_hours': round(min(approval_times), 2),
            'slowest_approval_hours': round(max(approval_times), 2)
        }
    
    def _serialize_doc(self, doc: ArchiveDocument) -> dict:
        """Belgeyi serialize et"""
        return {
            'id': doc.id,
            'document_type': doc.document_type.value,
            'status': doc.status.value,
            'file_name': doc.file_name,
            'uploaded_at': doc.uploaded_at.isoformat(),
            'approved_at': doc.approved_at.isoformat() if doc.approved_at else None
        }
```

---

#### 5.4.2. Excel Rapor Export

```python
# backend/aliaport_api/modules/dijital_arsiv/export.py

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from datetime import datetime
from io import BytesIO

class ArchiveReportExporter:
    """Excel rapor export"""
    
    def export_document_list(self, documents: list, filters: dict = None) -> BytesIO:
        """
        Belge listesini Excel'e export et
        
        Returns:
            BytesIO (Excel dosyası)
        """
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Belgeler"
        
        # Header
        headers = [
            "ID", "Belge Tipi", "Kategori", "Durum", "İş Emri No", 
            "Yükleyen", "Yüklenme Tarihi", "Onaylayan", "Onay Tarihi",
            "Dosya Adı", "Boyut (MB)"
        ]
        
        ws.append(headers)
        
        # Header styling
        for cell in ws[1]:
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
            cell.alignment = Alignment(horizontal="center")
        
        # Data rows
        for doc in documents:
            ws.append([
                doc.id,
                doc.document_type.value,
                doc.category.value,
                doc.status.value,
                doc.work_order.work_order_no if doc.work_order else "",
                doc.uploaded_by.full_name if doc.uploaded_by else 
                    doc.uploaded_by_portal_user.full_name if doc.uploaded_by_portal_user else "",
                doc.uploaded_at.strftime("%Y-%m-%d %H:%M"),
                doc.approved_by.full_name if doc.approved_by else "",
                doc.approved_at.strftime("%Y-%m-%d %H:%M") if doc.approved_at else "",
                doc.file_name,
                doc.file_size_mb
            ])
        
        # Auto-adjust column widths
        for column in ws.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                if cell.value:
                    max_length = max(max_length, len(str(cell.value)))
            adjusted_width = min(max_length + 2, 50)
            ws.column_dimensions[column_letter].width = adjusted_width
        
        # Save to BytesIO
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        
        return output
    
    def export_expiry_report(self, expiring_docs: list, expired_docs: list) -> BytesIO:
        """
        Süre sonu raporu Excel'e export
        """
        wb = openpyxl.Workbook()
        
        # Sheet 1: Dolmak üzere
        ws1 = wb.active
        ws1.title = "Dolmak Üzere"
        
        headers = ["Belge Tipi", "Çalışan/Araç", "Geçerlilik Bitiş", "Kalan Gün"]
        ws1.append(headers)
        
        for doc in expiring_docs:
            ws1.append([
                doc.document_type.value,
                # Employee/Vehicle name (ilişkiye göre)
                doc.expires_at.strftime("%Y-%m-%d"),
                doc.days_until_expiry
            ])
        
        # Sheet 2: Dolmuş
        ws2 = wb.create_sheet("Dolmuş")
        ws2.append(headers)
        
        for doc in expired_docs:
            ws2.append([
                doc.document_type.value,
                # Employee/Vehicle name
                doc.expires_at.strftime("%Y-%m-%d"),
                0
            ])
        
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        
        return output
```

---

### 5.5. WebSocket Real-Time Bildirimler

```python
# backend/aliaport_api/websocket/notifications.py

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """WebSocket bağlantı yöneticisi"""
    
    def __init__(self):
        # user_id → set of websockets
        self.active_connections: Dict[int, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Bağlantı ekle"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected via WebSocket")
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        """Bağlantı kaldır"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        logger.info(f"User {user_id} disconnected from WebSocket")
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Belirli kullanıcıya mesaj gönder"""
        if user_id in self.active_connections:
            disconnected = set()
            
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.add(connection)
            
            # Disconnect failed connections
            for conn in disconnected:
                self.disconnect(conn, user_id)
    
    async def broadcast(self, message: dict):
        """Tüm bağlantılara mesaj gönder"""
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(message, user_id)

# Global connection manager
manager = ConnectionManager()

# WebSocket endpoint
from fastapi import APIRouter, Depends
from aliaport_api.core.auth import get_current_user

router = APIRouter()

@router.websocket("/ws/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    current_user = Depends(get_current_user)
):
    """
    WebSocket endpoint for real-time notifications
    
    Usage (Client):
        const ws = new WebSocket('ws://localhost:8000/ws/notifications?token=...')
        ws.onmessage = (event) => {
            const notification = JSON.parse(event.data)
            showNotification(notification)
        }
    """
    await manager.connect(websocket, current_user.id)
    
    try:
        while True:
            # Keep connection alive (ping/pong)
            data = await websocket.receive_text()
            
            if data == "ping":
                await websocket.send_text("pong")
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, current_user.id)

# Helper function to broadcast notifications
async def broadcast_notification(notification_type: str, data: dict, user_id: int = None):
    """
    Bildirim gönder (WebSocket)
    
    Usage:
        await broadcast_notification(
            notification_type="DOCUMENT_APPROVED",
            data={
                'work_order_no': 'WO202511025',
                'document_type': 'GUMRUK_IZIN_BELGESI'
            },
            user_id=123
        )
    """
    message = {
        'type': notification_type,
        'timestamp': datetime.utcnow().isoformat(),
        'data': data
    }
    
    if user_id:
        await manager.send_personal_message(message, user_id)
    else:
        await manager.broadcast(message)
```

---

## 📊 Özet: Tüm Runbook Tamamlandı

### ✅ Part 1: Genel Bakış ve Mimari
- Proje özeti, sistem mimarisi
- Roller ve yetkiler
- VisitPro'dan ilham alınan özellikler

### ✅ Part 2: Portal Kullanıcı Rehberi
- İlk giriş ve kurulum
- İş emri talebi oluşturma
- Belge yükleme
- Talep takibi

### ✅ Part 3: Aliaport Personel Rehberi (3A, 3B, 3C)
- Dashboard ve kullanıcı yönetimi
- Belge inceleme ve onaylama
- İş emri başlatma ve tamamlama
- Fatura oluşturma

### ✅ Part 4: Teknik Spesifikasyonlar (4A, 4B)
- Database schema (ArchiveDocument, PortalUser, WorkOrder)
- Alembic migrations
- Pydantic schemas
- API endpoints (Portal + Internal)
- İş akışı diyagramları
- Entegrasyon servisleri

### ✅ Part 5: İleri Seviye Özellikler
- Belge versiyon kontrolü (version chain, rollback)
- Süre sınırlı belgeler (SRC-5, araç sigortası)
- Otomatik süre kontrolü (APScheduler jobs)
- Bildirim sistemi (Database + Email + WebSocket)
- Raporlama ve analitik (Dashboard stats, Excel export)
- Real-time bildirimler (WebSocket)

---

## 🎯 Tüm Sistem Özeti

**13 Aktif Modül + 2 Planned + Dijital Arşiv = 16 Modül**

```
ALIAPORT V3.1 - TAM SİSTEM
├── Backend (FastAPI 0.121.3)
│   ├── 13 Aktif Modül (Cari, Motorbot, Sefer, Hizmet, İş Emri, ...)
│   ├── Dijital Arşiv (Merkez Belge Deposu) ✅ YENİ
│   ├── Portal API (Dış Müşteri) ✅ YENİ
│   ├── Auth + RBAC (7 rol, 50+ permission)
│   ├── APScheduler (Background jobs)
│   └── Mikro Jump Entegrasyonu
│
├── Frontend (React 18 + TypeScript)
│   ├── 7 Modül (React Query, 77 hooks)
│   ├── Portal UI (Müşteri Arayüzü) ✅ YENİ
│   └── Internal UI (Aliaport Personeli)
│
├── Database (SQLite → PostgreSQL planned)
│   ├── 3 Yeni Tablo: archive_document, portal_user, notification
│   └── WorkOrder güncellemesi (approval_status, portal_user_id)
│
├── Scheduler (APScheduler)
│   ├── Belge süre kontrolü (her gün 09:00)
│   ├── Süresi dolmuş belgeler (her gün 00:00)
│   └── EVDS kur çekme (mevcut)
│
└── Monitoring (Prometheus + Grafana + Sentry)
    └── İş emri metrikleri, belge onay süreleri
```

**Tamamlanan Runbook'lar:**
- ✅ 5 ana bölüm (Part 1-5)
- ✅ 9 dosya (Part1, Part2, Part3A-B-C, Part4A-B, Part5)
- ✅ 150+ sayfa dokümantasyon
- ✅ Kod örnekleri (Python, SQLAlchemy, Pydantic)
- ✅ UI mockup'ları (ASCII art)
- ✅ İş akışı diyagramları

**Sırada:** Backend kod implementasyonu başlatalım mı?