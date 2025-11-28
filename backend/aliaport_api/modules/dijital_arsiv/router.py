"""
DİJİTAL ARŞİV MODÜLÜ - FastAPI Router
ArchiveDocument CRUD + stats endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta
import os
import hashlib
import uuid

from ...config.database import get_db
from ...core.responses import success_response, error_response
from ...services.email_service import get_email_service
from . import models as models_archive


router = APIRouter()


# ============================================
# HELPER FUNCTIONS
# ============================================

def calculate_file_hash(file_content: bytes) -> str:
    """Dosya SHA-256 hash'ini hesapla"""
    return hashlib.sha256(file_content).hexdigest()


def get_upload_path(category: str, entity_identifier: str) -> str:
    """Upload dizin yolunu oluştur"""
    base_dir = "uploads/documents"
    return os.path.join(base_dir, category.lower(), entity_identifier)


# ============================================
# ARCHIVE STATS ENDPOINT
# ============================================

@router.get("/api/archive/stats")
def get_archive_stats(db: Session = Depends(get_db)):
    """
    Dijital arşiv istatistikleri (4 durum kartı)
    
    Returns:
        - uploaded_count: Yüklendi (onay bekliyor)
        - approved_count: Onaylandı
        - rejected_count: Reddedildi
        - expired_count: Süresi doldu
    """
    
    # Sadece en son versiyonları say
    stats = {
        "uploaded_count": db.query(models_archive.ArchiveDocument).filter(
            models_archive.ArchiveDocument.status == models_archive.DocumentStatus.UPLOADED,
            models_archive.ArchiveDocument.is_latest_version == True
        ).count(),
        
        "approved_count": db.query(models_archive.ArchiveDocument).filter(
            models_archive.ArchiveDocument.status == models_archive.DocumentStatus.APPROVED,
            models_archive.ArchiveDocument.is_latest_version == True
        ).count(),
        
        "rejected_count": db.query(models_archive.ArchiveDocument).filter(
            models_archive.ArchiveDocument.status == models_archive.DocumentStatus.REJECTED,
            models_archive.ArchiveDocument.is_latest_version == True
        ).count(),
        
        "expired_count": db.query(models_archive.ArchiveDocument).filter(
            models_archive.ArchiveDocument.status == models_archive.DocumentStatus.EXPIRED,
            models_archive.ArchiveDocument.is_latest_version == True
        ).count(),
    }
    
    # Toplam
    stats["total_count"] = sum(stats.values())
    
    # Ek bilgiler
    stats["expiring_soon_count"] = db.query(models_archive.ArchiveDocument).filter(
        models_archive.ArchiveDocument.expires_at != None,
        models_archive.ArchiveDocument.expires_at > datetime.utcnow(),
        models_archive.ArchiveDocument.expires_at <= datetime.utcnow() + timedelta(days=30),
        models_archive.ArchiveDocument.is_latest_version == True
    ).count()
    
    return success_response(
        data=stats,
        message="Dijital arşiv istatistikleri"
    )


# ============================================
# UPLOAD ENDPOINT
# ============================================

@router.post("/api/archive/upload")
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form(...),
    document_type: str = Form(...),
    work_order_id: Optional[int] = Form(None),
    cari_id: Optional[int] = Form(None),
    description: Optional[str] = Form(None),
    issue_date: Optional[str] = Form(None),
    expires_at: Optional[str] = Form(None),
    uploaded_by_id: Optional[int] = Form(None),
    uploaded_by_portal_user_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Belge yükleme endpoint'i (multipart/form-data)
    
    Args:
        file: Yüklenecek dosya
        category: Belge kategorisi (WORK_ORDER, EMPLOYEE, VEHICLE, CARI, GENERAL)
        document_type: Belge tipi (GUMRUK_IZIN_BELGESI, SRC5, vb.)
        work_order_id: İş emri ID (opsiyonel)
        cari_id: Cari ID (opsiyonel)
        description: Açıklama
        issue_date: Belge düzenlenme tarihi
        expires_at: Geçerlilik bitiş tarihi
        uploaded_by_id: Yükleyen internal user ID
        uploaded_by_portal_user_id: Yükleyen portal user ID
    
    Returns:
        Yüklenen belge bilgileri
    """
    
    try:
        # 1. Dosyayı oku
        file_content = await file.read()
        file_size = len(file_content)
        
        # 2. Hash hesapla (duplicate kontrolü)
        file_hash = calculate_file_hash(file_content)
        
        # Duplicate kontrol
        existing_doc = db.query(models_archive.ArchiveDocument).filter(
            models_archive.ArchiveDocument.file_hash == file_hash,
            models_archive.ArchiveDocument.is_latest_version == True
        ).first()
        
        if existing_doc:
            return success_response(
                data={"id": existing_doc.id, "is_duplicate": True},
                message="Bu dosya zaten yüklenmiş (aynı hash)"
            )
        
        # 3. Upload path oluştur
        entity_identifier = f"wo_{work_order_id}" if work_order_id else f"cari_{cari_id}" if cari_id else "general"
        upload_dir = get_upload_path(category, entity_identifier)
        os.makedirs(upload_dir, exist_ok=True)
        
        # 4. Unique filename oluştur
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{timestamp}_{unique_id}{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # 5. Dosyayı kaydet
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # 6. Database kaydı
        doc = models_archive.ArchiveDocument(
            category=category,
            document_type=document_type,
            work_order_id=work_order_id,
            cari_id=cari_id,
            file_name=file.filename,
            file_path=file_path,
            file_size=file_size,
            file_type=file.content_type or "application/octet-stream",
            file_hash=file_hash,
            version=1,
            is_latest_version=True,
            status=models_archive.DocumentStatus.UPLOADED,
            uploaded_by_id=uploaded_by_id,
            uploaded_by_portal_user_id=uploaded_by_portal_user_id,
            uploaded_at=datetime.utcnow(),
            description=description,
            issue_date=datetime.fromisoformat(issue_date) if issue_date else None,
            expires_at=datetime.fromisoformat(expires_at) if expires_at else None,
            created_at=datetime.utcnow()
        )
        
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        return success_response(
            data={
                "id": doc.id,
                "file_name": doc.file_name,
                "file_size": doc.file_size,
                "file_type": doc.file_type,
                "status": doc.status.value,
                "category": doc.category.value,
                "document_type": doc.document_type.value,
                "is_duplicate": False
            },
            message=f"Belge başarıyla yüklendi: {file.filename}"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Belge yükleme hatası: {str(e)}")


# ============================================
# APPROVE ENDPOINT
# ============================================

@router.put("/api/archive/{document_id}/approve")
def approve_document(
    document_id: int,
    approved_by_id: int = Form(...),
    approval_note: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Belgeyi onayla
    
    Args:
        document_id: Belge ID
        approved_by_id: Onaylayan user ID
        approval_note: Onay notu
    
    Returns:
        Güncellenmiş belge bilgileri
    """
    
    # 1. Belgeyi getir
    doc = db.query(models_archive.ArchiveDocument).filter(
        models_archive.ArchiveDocument.id == document_id
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail=f"Belge bulunamadı: {document_id}")
    
    # 2. Durum kontrolü
    if doc.status != models_archive.DocumentStatus.UPLOADED:
        raise HTTPException(
            status_code=400,
            detail=f"Sadece UPLOADED durumundaki belgeler onaylanabilir. Mevcut durum: {doc.status.value}"
        )
    
    # 3. Onayla
    doc.status = models_archive.DocumentStatus.APPROVED
    doc.approved_by_id = approved_by_id
    doc.approved_at = datetime.utcnow()
    doc.approval_note = approval_note
    doc.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(doc)
    
    # 4. Email bildirimi gönder
    try:
        # WorkOrder ve User bilgilerini al
        from ..isemri.models import WorkOrder
        from ..dijital_arsiv.models import PortalUser
        from ...models import User
        
        wo = db.query(WorkOrder).filter(WorkOrder.id == doc.work_order_id).first() if doc.work_order_id else None
        portal_user = db.query(PortalUser).filter(PortalUser.id == doc.uploaded_by_portal_user_id).first() if doc.uploaded_by_portal_user_id else None
        approver = db.query(User).filter(User.id == approved_by_id).first()
        
        if portal_user and portal_user.email:
            email_service = get_email_service()
            email_service.send_document_approval_notification(
                to_email=portal_user.email,
                document_name=doc.file_name,
                wo_number=wo.wo_number if wo else 'N/A',
                approved_by=approver.full_name if approver else 'Admin',
                approved_at=doc.approved_at
            )
    except Exception as email_error:
        # Email hatası belge onayını engellemez
        print(f"Email gönderme hatası (onay): {email_error}")
    
    return success_response(
        data={
            "id": doc.id,
            "file_name": doc.file_name,
            "status": doc.status.value,
            "approved_by_id": doc.approved_by_id,
            "approved_at": doc.approved_at.isoformat(),
            "approval_note": doc.approval_note
        },
        message=f"Belge onaylandı: {doc.file_name}"
    )


# ============================================
# REJECT ENDPOINT
# ============================================

@router.put("/api/archive/{document_id}/reject")
def reject_document(
    document_id: int,
    rejected_by_id: int = Form(...),
    rejection_reason: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Belgeyi reddet
    
    Args:
        document_id: Belge ID
        rejected_by_id: Reddeden user ID
        rejection_reason: Red sebebi (zorunlu)
    
    Returns:
        Güncellenmiş belge bilgileri
    """
    
    # 1. Belgeyi getir
    doc = db.query(models_archive.ArchiveDocument).filter(
        models_archive.ArchiveDocument.id == document_id
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail=f"Belge bulunamadı: {document_id}")
    
    # 2. Durum kontrolü
    if doc.status != models_archive.DocumentStatus.UPLOADED:
        raise HTTPException(
            status_code=400,
            detail=f"Sadece UPLOADED durumundaki belgeler reddedilebilir. Mevcut durum: {doc.status.value}"
        )
    
    # 3. Reddet
    doc.status = models_archive.DocumentStatus.REJECTED
    doc.rejected_by_id = rejected_by_id
    doc.rejected_at = datetime.utcnow()
    doc.rejection_reason = rejection_reason
    doc.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(doc)
    
    # 4. Email bildirimi gönder
    try:
        # WorkOrder ve User bilgilerini al
        from ..isemri.models import WorkOrder
        from ..dijital_arsiv.models import PortalUser
        from ...models import User
        
        wo = db.query(WorkOrder).filter(WorkOrder.id == doc.work_order_id).first() if doc.work_order_id else None
        portal_user = db.query(PortalUser).filter(PortalUser.id == doc.uploaded_by_portal_user_id).first() if doc.uploaded_by_portal_user_id else None
        rejecter = db.query(User).filter(User.id == rejected_by_id).first()
        
        if portal_user and portal_user.email:
            email_service = get_email_service()
            email_service.send_document_rejection_notification(
                to_email=portal_user.email,
                document_name=doc.file_name,
                wo_number=wo.wo_number if wo else 'N/A',
                rejected_by=rejecter.full_name if rejecter else 'Admin',
                rejection_reason=rejection_reason,
                rejected_at=doc.rejected_at
            )
    except Exception as email_error:
        # Email hatası belge reddetmeyi engellemez
        print(f"Email gönderme hatası (red): {email_error}")
    
    return success_response(
        data={
            "id": doc.id,
            "file_name": doc.file_name,
            "status": doc.status.value,
            "rejected_by_id": doc.rejected_by_id,
            "rejected_at": doc.rejected_at.isoformat(),
            "rejection_reason": doc.rejection_reason
        },
        message=f"Belge reddedildi: {doc.file_name}"
    )
