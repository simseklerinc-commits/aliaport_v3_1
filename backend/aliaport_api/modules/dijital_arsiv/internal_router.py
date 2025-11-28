"""
DİJİTAL ARŞİV MODÜLÜ - Internal API Router  
Aliaport personeli için endpoints (belge onaylama, portal kullanıcı yönetimi, vb.)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
import os
from pathlib import Path

from ...config.database import get_db
from ..auth.dependencies import get_current_user  # FIXED: Auth dependency doğru konumdan import
from .models import (
    PortalUser, ArchiveDocument, Notification,
    DocumentStatus, DocumentCategory, DocumentType
)
from ..isemri.models import WorkOrder, WorkOrderStatus
from ..auth.models import User
from .schemas import (
    PortalUserCreate, PortalUserUpdate, PortalUserResponse, PortalUserDetailResponse,
    ArchiveDocumentResponse, ArchiveDocumentDetailResponse, ArchiveDocumentListResponse,
    ArchiveDocumentApprove, ArchiveDocumentReject, ArchiveDocumentVersionHistory,
    ArchiveDashboardStats, WorkOrderStartRequest, WorkOrderCompleteRequest,
    WorkOrderApproveRequest, WorkOrderRejectRequest, DocumentAnalytics, ExpiryReport
)

router = APIRouter(prefix="/internal", tags=["Internal - Dijital Arşiv"])


# ============================================
# PORTAL USER MANAGEMENT
# ============================================

@router.post("/portal-users", response_model=PortalUserResponse, status_code=status.HTTP_201_CREATED)
def create_portal_user(
    request: PortalUserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Portal kullanıcı oluştur
    
    Yetkiler:
    - portal_user:write gerekli
    """
    # TODO: Permission kontrolü (portal_user:write)
    
    # Email kontrolü
    existing = db.query(PortalUser).filter(PortalUser.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu email adresi zaten kullanılıyor")
    
    # Cari kontrolü
    from ..cari.models import Cari
    cari = db.query(Cari).filter(Cari.Id == request.cari_id).first()
    if not cari:
        raise HTTPException(status_code=404, detail="Cari bulunamadı")
    
    # PortalUser oluştur
    portal_user = PortalUser(
        cari_id=request.cari_id,
        email=request.email,
        full_name=request.full_name,
        phone=request.phone,
        position=request.position,
        is_admin=request.is_admin,
        is_active=request.is_active,
        created_by_id=current_user.id
    )
    
    # Şifre hashle
    portal_user.set_password(request.password)
    
    db.add(portal_user)
    db.commit()
    db.refresh(portal_user)
    
    # Welcome email gönder
    # TODO: EmailService.send_welcome_email(portal_user.email, request.password)
    
    return PortalUserResponse.from_orm(portal_user)


@router.get("/portal-users", response_model=List[PortalUserResponse])
def list_portal_users(
    cari_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Portal kullanıcıları listele"""
    query = db.query(PortalUser).options(joinedload(PortalUser.cari))
    
    if cari_id:
        query = query.filter(PortalUser.cari_id == cari_id)
    
    if is_active is not None:
        query = query.filter(PortalUser.is_active == is_active)
    
    portal_users = query.order_by(PortalUser.created_at.desc()).offset(skip).limit(limit).all()
    
    return [PortalUserResponse.from_orm(pu) for pu in portal_users]


@router.get("/portal-users/{portal_user_id}", response_model=PortalUserDetailResponse)
def get_portal_user(
    portal_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Portal kullanıcı detayı"""
    portal_user = db.query(PortalUser).options(
        joinedload(PortalUser.cari),
        joinedload(PortalUser.created_by)
    ).filter(PortalUser.id == portal_user_id).first()
    
    if not portal_user:
        raise HTTPException(status_code=404, detail="Portal kullanıcı bulunamadı")
    
    return PortalUserDetailResponse.from_orm(portal_user)


@router.put("/portal-users/{portal_user_id}", response_model=PortalUserResponse)
def update_portal_user(
    portal_user_id: int,
    request: PortalUserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Portal kullanıcı güncelle"""
    portal_user = db.query(PortalUser).filter(PortalUser.id == portal_user_id).first()
    
    if not portal_user:
        raise HTTPException(status_code=404, detail="Portal kullanıcı bulunamadı")
    
    # Update fields
    if request.full_name:
        portal_user.full_name = request.full_name
    if request.phone:
        portal_user.phone = request.phone
    if request.position:
        portal_user.position = request.position
    if request.is_admin is not None:
        portal_user.is_admin = request.is_admin
    if request.is_active is not None:
        portal_user.is_active = request.is_active
    
    db.commit()
    db.refresh(portal_user)
    
    return PortalUserResponse.from_orm(portal_user)


@router.post("/portal-users/{portal_user_id}/reset-password")
def reset_portal_user_password(
    portal_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Portal kullanıcı şifresini sıfırla
    
    - Rastgele şifre oluştur
    - Email gönder
    - must_change_password = True
    """
    portal_user = db.query(PortalUser).filter(PortalUser.id == portal_user_id).first()
    
    if not portal_user:
        raise HTTPException(status_code=404, detail="Portal kullanıcı bulunamadı")
    
    # Rastgele şifre oluştur
    import secrets
    import string
    alphabet = string.ascii_letters + string.digits
    new_password = ''.join(secrets.choice(alphabet) for i in range(12))
    
    portal_user.set_password(new_password)
    portal_user.must_change_password = True
    db.commit()
    
    # Email gönder
    # TODO: EmailService.send_password_reset_email(portal_user.email, new_password)
    
    return {"message": "Şifre sıfırlandı ve email gönderildi", "new_password": new_password}


@router.post("/portal-users/{portal_user_id}/activate")
def activate_portal_user(
    portal_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Portal kullanıcıyı aktifleştir"""
    portal_user = db.query(PortalUser).filter(PortalUser.id == portal_user_id).first()
    
    if not portal_user:
        raise HTTPException(status_code=404, detail="Portal kullanıcı bulunamadı")
    
    portal_user.is_active = True
    db.commit()
    
    return {"message": "Portal kullanıcı aktifleştirildi"}


@router.post("/portal-users/{portal_user_id}/deactivate")
def deactivate_portal_user(
    portal_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Portal kullanıcıyı devre dışı bırak"""
    portal_user = db.query(PortalUser).filter(PortalUser.id == portal_user_id).first()
    
    if not portal_user:
        raise HTTPException(status_code=404, detail="Portal kullanıcı bulunamadı")
    
    portal_user.is_active = False
    db.commit()
    
    return {"message": "Portal kullanıcı devre dışı bırakıldı"}


# ============================================
# WORK ORDER APPROVAL
# ============================================

@router.post("/work-orders/{work_order_id}/approve")
def approve_work_order(
    work_order_id: int,
    request: WorkOrderApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    İş emrini onayla
    
    Koşullar:
    - GUMRUK_IZIN_BELGESI onaylanmış olmalı
    - Durum: SUBMITTED → APPROVED
    """
    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    
    if not work_order:
        raise HTTPException(status_code=404, detail="İş emri bulunamadı")
    
    if work_order.status != WorkOrderStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Sadece SUBMITTED durumundaki iş emirleri onaylanabilir")
    
    # Zorunlu belge kontrolü
    required_doc = db.query(ArchiveDocument).filter(
        ArchiveDocument.work_order_id == work_order_id,
        ArchiveDocument.document_type == DocumentType.GUMRUK_IZIN_BELGESI,
        ArchiveDocument.status == DocumentStatus.APPROVED,
        ArchiveDocument.is_latest_version == True
    ).first()
    
    if not required_doc:
        raise HTTPException(
            status_code=400,
            detail="GUMRUK_IZIN_BELGESI belgesi onaylanmadan iş emri onaylanamaz"
        )
    
    # İş emrini onayla
    work_order.status = WorkOrderStatus.APPROVED
    work_order.approval_status = "APPROVED"
    work_order.approved_by_id = current_user.id
    work_order.approved_at = datetime.utcnow()
    db.commit()
    
    # Bildirim oluştur (portal user'a)
    if work_order.portal_user_id:
        notification = Notification(
            portal_user_id=work_order.portal_user_id,
            type="WORK_ORDER_APPROVED",
            title=f"İş Emri Onaylandı: {work_order.wo_number}",
            message=f"İş emriniz onaylandı ve başlatılmaya hazır. {request.approval_note or ''}",
            work_order_id=work_order.id
        )
        db.add(notification)
        db.commit()
    
    # Email gönder
    # TODO: EmailService.send_work_order_approved_email(...)
    
    return {"message": "İş emri onaylandı", "work_order_no": work_order.wo_number}


@router.post("/work-orders/{work_order_id}/reject")
def reject_work_order(
    work_order_id: int,
    request: WorkOrderRejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """İş emrini reddet"""
    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    
    if not work_order:
        raise HTTPException(status_code=404, detail="İş emri bulunamadı")
    
    work_order.status = WorkOrderStatus.REJECTED
    work_order.approval_status = "REJECTED"
    work_order.rejection_reason = request.rejection_reason
    db.commit()
    
    # Bildirim oluştur
    if work_order.portal_user_id:
        notification = Notification(
            portal_user_id=work_order.portal_user_id,
            type="WORK_ORDER_REJECTED",
            title=f"İş Emri Reddedildi: {work_order.wo_number}",
            message=f"İş emriniz reddedildi. Sebep: {request.rejection_reason}",
            work_order_id=work_order.id
        )
        db.add(notification)
        db.commit()
    
    return {"message": "İş emri reddedildi"}


@router.post("/work-orders/{work_order_id}/start")
def start_work_order(
    work_order_id: int,
    request: WorkOrderStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    İş emrini başlat
    
    Koşullar:
    - Durum: APPROVED → IN_PROGRESS
    - Zorunlu belgeler onaylanmış olmalı (GUMRUK_IZIN_BELGESI)
    """
    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    
    if not work_order:
        raise HTTPException(status_code=404, detail="İş emri bulunamadı")
    
    if work_order.status != WorkOrderStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Sadece APPROVED durumundaki iş emirleri başlatılabilir")
    
    # 🔴 ZORUNLU BELGE KONTROLÜ (VisitPro Uyumluluğu)
    required_doc_approved = db.query(ArchiveDocument).filter(
        ArchiveDocument.work_order_id == work_order_id,
        ArchiveDocument.document_type == DocumentType.GUMRUK_IZIN_BELGESI,
        ArchiveDocument.status == DocumentStatus.APPROVED,
        ArchiveDocument.is_latest_version == True
    ).count() > 0
    
    if not required_doc_approved:
        raise HTTPException(
            status_code=400, 
            detail="İş emri başlatılamaz: Gümrük izin belgesi onaylanmamış. Lütfen zorunlu belgeleri yükleyip onay bekleyin."
        )
    
    # İş emrini başlat
    work_order.status = WorkOrderStatus.IN_PROGRESS
    work_order.started_by_id = current_user.id
    work_order.started_at = datetime.utcnow()
    work_order.estimated_completion = request.estimated_completion
    work_order.notes = request.notes
    db.commit()
    
    # Bildirim oluştur
    if work_order.portal_user_id:
        notification = Notification(
            portal_user_id=work_order.portal_user_id,
            type="WORK_ORDER_STARTED",
            title=f"İş Emri Başlatıldı: {work_order.wo_number}",
            message=f"İş emriniz başlatıldı. {request.notes or ''}",
            work_order_id=work_order.id
        )
        db.add(notification)
        db.commit()
    
    return {"message": "İş emri başlatıldı", "work_order_no": work_order.wo_number}


@router.post("/work-orders/{work_order_id}/complete")
def complete_work_order(
    work_order_id: int,
    request: WorkOrderCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    İş emrini tamamla
    
    Koşullar:
    - Durum: IN_PROGRESS → COMPLETED
    """
    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    
    if not work_order:
        raise HTTPException(status_code=404, detail="İş emri bulunamadı")
    
    if work_order.status != WorkOrderStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Sadece IN_PROGRESS durumundaki iş emirleri tamamlanabilir")
    
    # İş emrini tamamla
    work_order.status = WorkOrderStatus.COMPLETED
    work_order.completed_by_id = current_user.id
    work_order.completed_at = datetime.utcnow()
    work_order.completion_notes = request.completion_notes
    db.commit()
    
    # Bildirim oluştur
    if work_order.portal_user_id:
        notification = Notification(
            portal_user_id=work_order.portal_user_id,
            type="WORK_ORDER_COMPLETED",
            title=f"İş Emri Tamamlandı: {work_order.wo_number}",
            message=f"İş emriniz tamamlandı. {request.completion_notes or ''}",
            work_order_id=work_order.id
        )
        db.add(notification)
        db.commit()
    
    return {"message": "İş emri tamamlandı", "work_order_no": work_order.wo_number}


@router.post("/work-orders/{work_order_id}/close")
def close_work_order(
    work_order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    İş emrini kapat
    
    Koşullar:
    - Durum: INVOICED → CLOSED
    - Fatura oluşturulmuş olmalı
    """
    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    
    if not work_order:
        raise HTTPException(status_code=404, detail="İş emri bulunamadı")
    
    if work_order.status != WorkOrderStatus.INVOICED:
        raise HTTPException(status_code=400, detail="Sadece INVOICED durumundaki iş emirleri kapatılabilir")
    
    work_order.status = WorkOrderStatus.CLOSED
    db.commit()
    
    return {"message": "İş emri kapatıldı", "work_order_no": work_order.wo_number}


# ============================================
# DOCUMENT APPROVAL
# ============================================

@router.get("/archive/dashboard", response_model=ArchiveDashboardStats)
def get_archive_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Dashboard istatistikleri"""
    from .analytics import ArchiveAnalytics
    
    analytics = ArchiveAnalytics(db)
    stats = analytics.get_dashboard_stats()
    
    return ArchiveDashboardStats(**stats)


@router.get("/archive/documents", response_model=ArchiveDocumentListResponse)
def list_archive_documents(
    status: Optional[DocumentStatus] = None,
    category: Optional[DocumentCategory] = None,
    work_order_id: Optional[int] = None,
    cari_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Arşiv belgeleri listele"""
    query = db.query(ArchiveDocument).options(
        joinedload(ArchiveDocument.work_order),
        joinedload(ArchiveDocument.cari),
        joinedload(ArchiveDocument.uploaded_by),
        joinedload(ArchiveDocument.uploaded_by_portal_user),
        joinedload(ArchiveDocument.approved_by),
        joinedload(ArchiveDocument.rejected_by)
    ).filter(ArchiveDocument.is_latest_version == True)
    
    if status:
        query = query.filter(ArchiveDocument.status == status)
    
    if category:
        query = query.filter(ArchiveDocument.category == category)
    
    if work_order_id:
        query = query.filter(ArchiveDocument.work_order_id == work_order_id)
    
    if cari_id:
        query = query.filter(ArchiveDocument.cari_id == cari_id)
    
    total = query.count()
    documents = query.order_by(ArchiveDocument.uploaded_at.desc()).offset(skip).limit(limit).all()
    
    return ArchiveDocumentListResponse(
        total=total,
        items=[ArchiveDocumentResponse.from_orm(doc) for doc in documents]
    )


@router.get("/archive/documents/{document_id}", response_model=ArchiveDocumentDetailResponse)
def get_archive_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Belge detayı"""
    document = db.query(ArchiveDocument).options(
        joinedload(ArchiveDocument.work_order),
        joinedload(ArchiveDocument.cari),
        joinedload(ArchiveDocument.uploaded_by),
        joinedload(ArchiveDocument.uploaded_by_portal_user),
        joinedload(ArchiveDocument.approved_by),
        joinedload(ArchiveDocument.rejected_by)
    ).filter(ArchiveDocument.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
    
    return ArchiveDocumentDetailResponse.from_orm(document)


@router.get("/archive/documents/{document_id}/preview")
def preview_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Belge önizleme (PDF stream)"""
    document = db.query(ArchiveDocument).filter(ArchiveDocument.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
    
    file_path = Path(document.file_path)
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")
    
    return FileResponse(
        path=str(file_path),
        media_type=document.file_type,
        filename=document.file_name
    )


@router.post("/archive/documents/{document_id}/approve")
def approve_document(
    document_id: int,
    request: ArchiveDocumentApprove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Belgeyi onayla
    
    Koşullar:
    - Durum: UPLOADED → APPROVED
    - Eğer GUMRUK_IZIN_BELGESI ise, WorkOrder.approval_status = APPROVED
    """
    document = db.query(ArchiveDocument).filter(ArchiveDocument.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
    
    if document.status != DocumentStatus.UPLOADED:
        raise HTTPException(status_code=400, detail="Sadece UPLOADED durumundaki belgeler onaylanabilir")
    
    # Belgeyi onayla
    document.status = DocumentStatus.APPROVED
    document.approved_by_id = current_user.id
    document.approved_at = datetime.utcnow()
    document.approval_note = request.approval_note
    db.commit()
    
    # Eğer GUMRUK_IZIN_BELGESI ise, WorkOrder'ı güncelle
    if document.document_type == DocumentType.GUMRUK_IZIN_BELGESI and document.work_order_id:
        work_order = db.query(WorkOrder).filter(WorkOrder.id == document.work_order_id).first()
        if work_order:
            # Tüm zorunlu belgeler onaylandı mı kontrol et
            all_approved = True  # Sadece GUMRUK_IZIN_BELGESI zorunlu
            
            if all_approved:
                work_order.approval_status = "APPROVED"
                db.commit()
    
    # Bildirim oluştur (portal user'a)
    if document.uploaded_by_portal_user_id:
        notification = Notification(
            portal_user_id=document.uploaded_by_portal_user_id,
            type="DOCUMENT_APPROVED",
            title=f"Belge Onaylandı: {document.document_type.value}",
            message=f"Yüklediğiniz belge onaylandı. {request.approval_note or ''}",
            document_id=document.id,
            work_order_id=document.work_order_id
        )
        db.add(notification)
        db.commit()
    
    # Email gönder
    # TODO: EmailService.send_document_approved_email(...)
    
    return {"message": "Belge onaylandı", "document_id": document.id}


@router.post("/archive/documents/{document_id}/reject")
def reject_document(
    document_id: int,
    request: ArchiveDocumentReject,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Belgeyi reddet
    
    Koşullar:
    - Durum: UPLOADED → REJECTED
    - WorkOrder.approval_status = REJECTED (eğer GUMRUK_IZIN_BELGESI ise)
    """
    document = db.query(ArchiveDocument).filter(ArchiveDocument.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
    
    if document.status != DocumentStatus.UPLOADED:
        raise HTTPException(status_code=400, detail="Sadece UPLOADED durumundaki belgeler reddedilebilir")
    
    # Belgeyi reddet
    document.status = DocumentStatus.REJECTED
    document.rejected_by_id = current_user.id
    document.rejected_at = datetime.utcnow()
    document.rejection_reason = request.rejection_reason
    db.commit()
    
    # Eğer GUMRUK_IZIN_BELGESI ise, WorkOrder'ı güncelle
    if document.document_type == DocumentType.GUMRUK_IZIN_BELGESI and document.work_order_id:
        work_order = db.query(WorkOrder).filter(WorkOrder.id == document.work_order_id).first()
        if work_order:
            work_order.approval_status = "REJECTED"
            work_order.rejection_reason = request.rejection_reason
            db.commit()
    
    # Bildirim oluştur (portal user'a)
    if document.uploaded_by_portal_user_id:
        notification = Notification(
            portal_user_id=document.uploaded_by_portal_user_id,
            type="DOCUMENT_REJECTED",
            title=f"Belge Reddedildi: {document.document_type.value}",
            message=f"Yüklediğiniz belge reddedildi. Sebep: {request.rejection_reason}",
            document_id=document.id,
            work_order_id=document.work_order_id
        )
        db.add(notification)
        db.commit()
    
    # Email gönder
    # TODO: EmailService.send_document_rejected_email(...)
    
    return {"message": "Belge reddedildi", "document_id": document.id}


@router.get("/archive/documents/{document_id}/versions", response_model=List[ArchiveDocumentVersionHistory])
def get_document_versions(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Belge versiyon geçmişi"""
    from .services import DocumentVersionService
    
    version_service = DocumentVersionService()
    versions = version_service.get_version_history(db, document_id)
    
    return [ArchiveDocumentVersionHistory.from_orm(v) for v in versions]


# ============================================
# ANALYTICS & REPORTING
# ============================================

@router.get("/archive/analytics", response_model=DocumentAnalytics)
def get_document_analytics(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Belge analitikleri"""
    from .analytics import ArchiveAnalytics
    
    analytics = ArchiveAnalytics(db)
    
    # Dashboard stats
    dashboard = analytics.get_dashboard_stats()
    
    # Onay süreleri
    approval_times = analytics.get_approval_time_stats(days=days)
    
    return DocumentAnalytics(
        total_documents=dashboard['total_documents'],
        by_status=dashboard['by_status'],
        by_category=dashboard['by_category'],
        by_document_type={},  # TODO: Implement
        average_approval_time_hours=approval_times['average_approval_time_hours'],
        fastest_approval_hours=approval_times['fastest_approval_hours'],
        slowest_approval_hours=approval_times['slowest_approval_hours']
    )


@router.get("/archive/expiry-report", response_model=ExpiryReport)
def get_expiry_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Süre sonu raporu"""
    from .expiry import DocumentExpiryManager
    
    expiry_manager = DocumentExpiryManager()
    
    # 30 gün içinde dolacaklar
    expiring = expiry_manager.get_expiring_documents(db, days_before=30)
    
    # Dolmuşlar
    expired = expiry_manager.get_expired_documents(db)
    
    # TODO: Serialize to ExpiryReportItem
    
    return ExpiryReport(
        expiring_soon=[],
        expired=[],
        total_expiring_soon=len(expiring),
        total_expired=len(expired)
    )


@router.get("/archive/export/excel")
def export_documents_excel(
    status: Optional[DocumentStatus] = None,
    category: Optional[DocumentCategory] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Belge listesini Excel'e export"""
    from .export import ArchiveReportExporter
    from io import BytesIO
    
    # Belgeler getir
    query = db.query(ArchiveDocument).filter(ArchiveDocument.is_latest_version == True)
    
    if status:
        query = query.filter(ArchiveDocument.status == status)
    
    if category:
        query = query.filter(ArchiveDocument.category == category)
    
    documents = query.all()
    
    # Excel oluştur
    exporter = ArchiveReportExporter()
    excel_file = exporter.export_document_list(documents)
    
    # Stream response
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=belgeler_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    )
