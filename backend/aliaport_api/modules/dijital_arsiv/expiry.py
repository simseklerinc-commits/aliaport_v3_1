"""
DİJİTAL ARŞİV - Belge Süre Takip Yöneticisi
"""

from datetime import datetime, timedelta
from typing import Dict
from .models import DocumentType, ArchiveDocument, DocumentStatus


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
        doc = db.query(ArchiveDocument).filter(
            ArchiveDocument.id == document_id
        ).first()
        
        if doc and doc.is_expired:
            doc.status = DocumentStatus.EXPIRED
            db.commit()
