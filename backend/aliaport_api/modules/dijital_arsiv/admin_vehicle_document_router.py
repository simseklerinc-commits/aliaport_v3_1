"""
ADMIN VEHICLE DOCUMENT APPROVAL ENDPOINTS
Araç evraklarının onay/red işlemleri için admin endpoint'leri
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel

from ...config.database import get_db
from .models import VehicleDocument, VehicleDocumentType, PortalVehicle, PortalUser
from ...modules.auth.dependencies import require_permission
from ...services.email_service import EmailService

router = APIRouter(prefix="/admin/vehicles/documents", tags=["admin-vehicle-documents"])
email_service = EmailService()


# ============================================
# PYDANTIC MODELS
# ============================================

class PendingDocumentItem(BaseModel):
    """Onay bekleyen evrak özet bilgisi"""
    id: int
    vehicle_id: int
    vehicle_plaka: str
    cari_id: int
    cari_name: str
    doc_type_code: str
    doc_type_name: str
    uploaded_at: datetime
    file_storage_key: Optional[str]
    expiry_date: Optional[date]
    
    class Config:
        from_attributes = True


class PendingDocumentsResponse(BaseModel):
    """Onay bekleyen evraklar listesi"""
    total: int
    items: List[PendingDocumentItem]


class ApproveDocumentRequest(BaseModel):
    """Evrak onaylama request body"""
    expiry_date: Optional[str] = None  # YYYY-MM-DD format
    notes: Optional[str] = None


class RejectDocumentRequest(BaseModel):
    """Evrak reddetme request body"""
    reject_reason: str


# ============================================
# ENDPOINTS
# ============================================

@router.get("/pending", response_model=PendingDocumentsResponse)
def get_pending_documents(
    skip: int = 0,
    limit: int = 50,
    cari_id: Optional[int] = None,
    doc_type_code: Optional[str] = None,
    db: Session = Depends(get_db),
    _perm = Depends(require_permission("vehicle_documents", "read"))
):
    """
    Onay bekleyen tüm evrakları listele (PENDING durumundaki)
    
    Query Parameters:
    - skip: Pagination offset
    - limit: Sayfa başına kayıt
    - cari_id: Firmaya göre filtrele (opsiyonel)
    - doc_type_code: Evrak tipine göre filtrele (opsiyonel)
    """
    query = db.query(
        VehicleDocument,
        PortalVehicle.plaka,
        PortalVehicle.cari_id,
        PortalUser.company_name,
        VehicleDocumentType.code,
        VehicleDocumentType.name
    ).join(
        PortalVehicle, VehicleDocument.vehicle_id == PortalVehicle.id
    ).join(
        VehicleDocumentType, VehicleDocument.doc_type_id == VehicleDocumentType.id
    ).join(
        PortalUser, PortalVehicle.cari_id == PortalUser.cari_id
    ).filter(
        VehicleDocument.status == "PENDING"
    )
    
    # Filtreler
    if cari_id:
        query = query.filter(PortalVehicle.cari_id == cari_id)
    
    if doc_type_code:
        query = query.filter(VehicleDocumentType.code == doc_type_code.upper())
    
    # Toplam sayı
    total = query.count()
    
    # Sayfalama
    results = query.order_by(VehicleDocument.uploaded_at.desc()).offset(skip).limit(limit).all()
    
    # Response oluştur
    items = []
    for doc, plaka, cari_id, company_name, doc_code, doc_name in results:
        items.append(PendingDocumentItem(
            id=doc.id,
            vehicle_id=doc.vehicle_id,
            vehicle_plaka=plaka,
            cari_id=cari_id,
            cari_name=company_name,
            doc_type_code=doc_code,
            doc_type_name=doc_name,
            uploaded_at=doc.uploaded_at,
            file_storage_key=doc.file_storage_key,
            expiry_date=doc.expiry_date
        ))
    
    return PendingDocumentsResponse(total=total, items=items)


@router.put("/{document_id}/approve")
def approve_document(
    document_id: int,
    request: ApproveDocumentRequest,
    db: Session = Depends(get_db),
    _perm = Depends(require_permission("vehicle_documents", "approve"))
):
    """
    Evrakı onayla (PENDING → APPROVED)
    
    Body:
    - expiry_date: Geçerlilik tarihi (opsiyonel, YYYY-MM-DD)
    - notes: Admin notları (opsiyonel)
    """
    doc = db.query(VehicleDocument).filter(VehicleDocument.id == document_id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Evrak bulunamadı")
    
    if doc.status != "PENDING":
        raise HTTPException(
            status_code=400, 
            detail=f"Sadece PENDING durumundaki evraklar onaylanabilir (Mevcut: {doc.status})"
        )
    
    # Onayla
    doc.status = "APPROVED"
    doc.approved_at = datetime.utcnow()
    # doc.approved_by_user_id = current_admin.id  # TODO: Admin ID
    
    # Eğer expiry_date verilmişse güncelle
    if request.expiry_date:
        try:
            doc.expiry_date = datetime.fromisoformat(request.expiry_date).date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Geçersiz tarih formatı (YYYY-MM-DD)")
    
    # Red bilgilerini temizle
    doc.reject_reason = None
    doc.rejected_at = None
    
    db.commit()
    db.refresh(doc)
    
    # Email bildirimi gönder
    try:
        vehicle = db.query(PortalVehicle).filter(PortalVehicle.id == doc.vehicle_id).first()
        if vehicle:
            portal_user = db.query(PortalUser).filter(PortalUser.cari_id == vehicle.cari_id).first()
            if portal_user and portal_user.email:
                doc_type = db.query(VehicleDocumentType).filter(VehicleDocumentType.id == doc.doc_type_id).first()
                email_service.send_vehicle_document_approved_email(
                    to_email=portal_user.email,
                    company_name=portal_user.company_name,
                    vehicle_plaka=vehicle.plaka,
                    doc_type_name=doc_type.name if doc_type else "Evrak",
                    expiry_date=doc.expiry_date
                )
    except Exception as email_error:
        # Email hatası onay işlemini engellemesin
        print(f"Email gönderme hatası: {email_error}")
    
    return {
        "message": "Evrak onaylandı",
        "document_id": doc.id,
        "status": doc.status,
        "approved_at": doc.approved_at
    }


@router.put("/{document_id}/reject")
def reject_document(
    document_id: int,
    request: RejectDocumentRequest,
    db: Session = Depends(get_db),
    _perm = Depends(require_permission("vehicle_documents", "reject"))
):
    """
    Evrakı reddet (PENDING → REJECTED)
    
    Body:
    - reject_reason: Red nedeni (zorunlu)
    """
    if not request.reject_reason or len(request.reject_reason.strip()) < 5:
        raise HTTPException(status_code=400, detail="Red nedeni en az 5 karakter olmalı")
    
    doc = db.query(VehicleDocument).filter(VehicleDocument.id == document_id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Evrak bulunamadı")
    
    if doc.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail=f"Sadece PENDING durumundaki evraklar reddedilebilir (Mevcut: {doc.status})"
        )
    
    # Reddet
    doc.status = "REJECTED"
    doc.reject_reason = request.reject_reason.strip()
    doc.rejected_at = datetime.utcnow()
    
    # Onay bilgilerini temizle
    doc.approved_at = None
    doc.approved_by_user_id = None
    
    db.commit()
    db.refresh(doc)
    
    # Email bildirimi gönder
    try:
        vehicle = db.query(PortalVehicle).filter(PortalVehicle.id == doc.vehicle_id).first()
        if vehicle:
            portal_user = db.query(PortalUser).filter(PortalUser.cari_id == vehicle.cari_id).first()
            if portal_user and portal_user.email:
                doc_type = db.query(VehicleDocumentType).filter(VehicleDocumentType.id == doc.doc_type_id).first()
                email_service.send_vehicle_document_rejected_email(
                    to_email=portal_user.email,
                    company_name=portal_user.company_name,
                    vehicle_plaka=vehicle.plaka,
                    doc_type_name=doc_type.name if doc_type else "Evrak",
                    reject_reason=doc.reject_reason
                )
    except Exception as email_error:
        # Email hatası red işlemini engellemesin
        print(f"Email gönderme hatası: {email_error}")
    
    return {
        "message": "Evrak reddedildi",
        "document_id": doc.id,
        "status": doc.status,
        "reject_reason": doc.reject_reason,
        "rejected_at": doc.rejected_at
    }


@router.get("/stats")
def get_approval_stats(
    db: Session = Depends(get_db),
    _perm = Depends(require_permission("vehicle_documents", "read"))
):
    """
    Evrak onay istatistikleri
    """
    total_pending = db.query(VehicleDocument).filter(VehicleDocument.status == "PENDING").count()
    total_approved = db.query(VehicleDocument).filter(VehicleDocument.status == "APPROVED").count()
    total_rejected = db.query(VehicleDocument).filter(VehicleDocument.status == "REJECTED").count()
    total_expired = db.query(VehicleDocument).filter(VehicleDocument.status == "EXPIRED").count()
    total_missing = db.query(VehicleDocument).filter(VehicleDocument.status == "MISSING").count()
    
    return {
        "pending": total_pending,
        "approved": total_approved,
        "rejected": total_rejected,
        "expired": total_expired,
        "missing": total_missing,
        "total": total_pending + total_approved + total_rejected + total_expired + total_missing
    }
