"""
DİJİTAL ARŞİV - Analitik ve Raporlama
"""

from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from .models import ArchiveDocument, DocumentStatus, DocumentCategory, DocumentType


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
        
        # Onay bekleyen
        pending_approval = by_status.get(DocumentStatus.UPLOADED.value, 0)
        
        # Süresi dolacak (30 gün)
        thirty_days = datetime.utcnow() + timedelta(days=30)
        expiring_soon = self.db.query(ArchiveDocument).filter(
            ArchiveDocument.is_latest_version == True,
            ArchiveDocument.status == DocumentStatus.APPROVED,
            ArchiveDocument.expires_at.isnot(None),
            ArchiveDocument.expires_at <= thirty_days,
            ArchiveDocument.expires_at > datetime.utcnow()
        ).count()
        
        return {
            'total_documents': total,
            'pending_approval': pending_approval,
            'approved': by_status.get(DocumentStatus.APPROVED.value, 0),
            'rejected': by_status.get(DocumentStatus.REJECTED.value, 0),
            'expired': by_status.get(DocumentStatus.EXPIRED.value, 0),
            'expiring_soon_30_days': expiring_soon,
            'by_status': by_status,
            'by_category': by_category,
            'recent_uploads_7_days': recent_uploads,
            'recent_approvals_7_days': recent_approvals
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
            if doc.approved_at and doc.uploaded_at:
                delta = doc.approved_at - doc.uploaded_at
                hours = delta.total_seconds() / 3600
                approval_times.append(hours)
        
        if not approval_times:
            return {
                'average_approval_time_hours': 0,
                'fastest_approval_hours': 0,
                'slowest_approval_hours': 0
            }
        
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
