"""
DİJİTAL ARŞİV - Belge Versiyon Yönetimi
"""

from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime

from .models import ArchiveDocument, DocumentStatus


class DocumentVersionService:
    """Belge versiyon yönetimi servisi"""
    
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
            tags=old_doc.tags,
            issue_date=new_file_data.get('issue_date'),
            expires_at=new_file_data.get('expires_at')
        )
        
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
        
        return new_doc
    
    def get_version_history(self, db: Session, document_id: int) -> list:
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
        
        # Eğer latest versiyon değilse, latest'i bul
        if not latest.is_latest_version:
            # Find the latest version with same work_order_id and document_type
            latest = db.query(ArchiveDocument).filter(
                ArchiveDocument.work_order_id == latest.work_order_id,
                ArchiveDocument.document_type == latest.document_type,
                ArchiveDocument.is_latest_version == True
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
