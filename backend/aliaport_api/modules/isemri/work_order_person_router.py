"""
WORK ORDER PERSON ROUTER
API endpoints for WorkOrderPerson management
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import Optional
from datetime import datetime
import os
import uuid
from pathlib import Path

from ...config.database import get_db
from ...core import success_response, error_response, ErrorCode, get_http_status_for_error
from .models import WorkOrder, WorkOrderPerson
from .work_order_person_schemas import (
    WorkOrderPersonCreate,
    WorkOrderPersonUpdate,
    WorkOrderPersonResponse,
    SecurityApprovalRequest,
    SecurityApprovalBulkRequest,
    PaginatedWorkOrderPersonResponse
)

router = APIRouter()


@router.get("/work-order-person")
def get_all_work_order_persons(
    page: int = Query(1, ge=1, description="Sayfa numarası"),
    page_size: int = Query(20, ge=1, le=100, description="Sayfa başına kayıt"),
    work_order_id: Optional[int] = Query(None, description="İş emri ID filtresi"),
    security_approved: Optional[bool] = Query(None, description="Güvenlik onayı filtresi"),
    db: Session = Depends(get_db),
):
    """
    Get all work order persons (paginated)
    
    Query Parameters:
        - page: Page number (default: 1)
        - page_size: Items per page (default: 20, max: 100)
        - work_order_id: Filter by work order ID
        - security_approved: Filter by security approval status
    """
    try:
        # Base query
        query = db.query(WorkOrderPerson)
        
        # Filters
        if work_order_id is not None:
            query = query.filter(WorkOrderPerson.WorkOrderId == work_order_id)
        
        if security_approved is not None:
            query = query.filter(WorkOrderPerson.SecurityApproved == security_approved)
        
        # Total count
        total = query.count()
        
        # Pagination
        offset = (page - 1) * page_size
        items = query.order_by(WorkOrderPerson.Id.desc()).offset(offset).limit(page_size).all()
        
        # Convert to Pydantic models
        person_list = [WorkOrderPersonResponse.model_validate(item) for item in items]
        
        pages = (total + page_size - 1) // page_size
        
        response_data = PaginatedWorkOrderPersonResponse(
            items=person_list,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages
        )
        
        return success_response(
            data=response_data.model_dump(),
            message=f"{total} kişi kaydı bulundu"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Kişi listesi getirilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/work-order-person/pending-approval")
def get_pending_approval_persons(
    db: Session = Depends(get_db)
):
    """Get all persons pending security approval"""
    try:
        persons = db.execute(
            select(WorkOrderPerson).where(WorkOrderPerson.SecurityApproved == False)
        ).scalars().all()
        
        person_list = [WorkOrderPersonResponse.model_validate(p) for p in persons]
        
        return success_response(
            data={"persons": [p.model_dump() for p in person_list], "total": len(persons)},
            message=f"{len(persons)} onay bekleyen kişi bulundu"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Onay bekleyen kişiler getirilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/work-order-person/{person_id}")
def get_work_order_person(person_id: int, db: Session = Depends(get_db)):
    """Get work order person by ID"""
    try:
        person = db.get(WorkOrderPerson, person_id)
        
        if not person:
            raise HTTPException(
                status_code=404,
                detail=error_response(
                    code=ErrorCode.NOT_FOUND,
                    message="Kişi kaydı bulunamadı",
                    details={"person_id": person_id}
                )
            )
        
        return success_response(
            data=WorkOrderPersonResponse.model_validate(person).model_dump(),
            message="Kişi kaydı getirildi"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Kişi kaydı getirilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/work-order/{work_order_id}/persons")
def get_work_order_persons_by_wo_id(
    work_order_id: int,
    db: Session = Depends(get_db)
):
    """Get all persons for a specific work order"""
    try:
        # Check if work order exists
        work_order = db.get(WorkOrder, work_order_id)
        if not work_order:
            raise HTTPException(
                status_code=404,
                detail=error_response(
                    code=ErrorCode.NOT_FOUND,
                    message="İş emri bulunamadı",
                    details={"work_order_id": work_order_id}
                )
            )
        
        # Get all persons for this work order
        persons = db.execute(
            select(WorkOrderPerson).where(WorkOrderPerson.WorkOrderId == work_order_id)
        ).scalars().all()
        
        person_list = [WorkOrderPersonResponse.model_validate(p) for p in persons]
        
        return success_response(
            data={"persons": [p.model_dump() for p in person_list]},
            message=f"{len(persons)} kişi bulundu"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Kişiler getirilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.post("/work-order-person")
def create_work_order_person(
    person_data: WorkOrderPersonCreate,
    db: Session = Depends(get_db)
):
    """Create a new work order person"""
    try:
        # Check if work order exists
        work_order = db.get(WorkOrder, person_data.WorkOrderId)
        if not work_order:
            raise HTTPException(
                status_code=404,
                detail=error_response(
                    code=ErrorCode.NOT_FOUND,
                    message="İş emri bulunamadı",
                    details={"work_order_id": person_data.WorkOrderId}
                )
            )
        
        # Create new person
        new_person = WorkOrderPerson(
            WorkOrderId=person_data.WorkOrderId,
            FullName=person_data.FullName,
            TcKimlik=person_data.TcKimlik,
            Pasaport=person_data.Pasaport,
            SecurityNotes=person_data.SecurityNotes,
            SecurityApproved=False,  # Default: not approved
        )
        
        db.add(new_person)
        db.commit()
        db.refresh(new_person)
        
        return success_response(
            data=WorkOrderPersonResponse.model_validate(new_person).model_dump(),
            message="Kişi kaydı oluşturuldu"
        )
    
    except HTTPException:
        raise
    except ValueError as e:
        # Validation error from Pydantic
        raise HTTPException(
            status_code=400,
            detail=error_response(
                code=ErrorCode.VALIDATION_ERROR,
                message=str(e),
                details={}
            )
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Kişi kaydı oluşturulurken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.put("/work-order-person/{person_id}")
def update_work_order_person(
    person_id: int,
    person_data: WorkOrderPersonUpdate,
    db: Session = Depends(get_db)
):
    """Update work order person"""
    try:
        person = db.get(WorkOrderPerson, person_id)
        
        if not person:
            raise HTTPException(
                status_code=404,
                detail=error_response(
                    code=ErrorCode.NOT_FOUND,
                    message="Kişi kaydı bulunamadı",
                    details={"person_id": person_id}
                )
            )
        
        # Check if already approved (cannot edit after approval)
        if person.SecurityApproved:
            raise HTTPException(
                status_code=400,
                detail=error_response(
                    code=ErrorCode.VALIDATION_ERROR,
                    message="Güvenlik onayı almış kayıtlar düzenlenemez",
                    details={"person_id": person_id}
                )
            )
        
        # Update fields
        update_data = person_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(person, field, value)
        
        person.UpdatedAt = datetime.now()
        
        db.commit()
        db.refresh(person)
        
        return success_response(
            data=WorkOrderPersonResponse.model_validate(person).model_dump(),
            message="Kişi kaydı güncellendi"
        )
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=error_response(
                code=ErrorCode.VALIDATION_ERROR,
                message=str(e),
                details={}
            )
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Kişi kaydı güncellenirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.delete("/work-order-person/{person_id}")
def delete_work_order_person(person_id: int, db: Session = Depends(get_db)):
    """Delete work order person"""
    try:
        person = db.get(WorkOrderPerson, person_id)
        
        if not person:
            raise HTTPException(
                status_code=404,
                detail=error_response(
                    code=ErrorCode.NOT_FOUND,
                    message="Kişi kaydı bulunamadı",
                    details={"person_id": person_id}
                )
            )
        
        # Check if already approved (cannot delete after approval)
        if person.SecurityApproved:
            raise HTTPException(
                status_code=400,
                detail=error_response(
                    code=ErrorCode.VALIDATION_ERROR,
                    message="Güvenlik onayı almış kayıtlar silinemez",
                    details={"person_id": person_id}
                )
            )
        
        db.delete(person)
        db.commit()
        
        return success_response(
            data={"deleted_id": person_id},
            message="Kişi kaydı silindi"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Kişi kaydı silinirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.post("/work-order-person/security-approval")
def security_approval(
    approval_data: SecurityApprovalRequest,
    db: Session = Depends(get_db)
):
    """Approve or reject a person by security"""
    try:
        person = db.get(WorkOrderPerson, approval_data.person_id)
        
        if not person:
            raise HTTPException(
                status_code=404,
                detail=error_response(
                    code=ErrorCode.NOT_FOUND,
                    message="Kişi kaydı bulunamadı",
                    details={"person_id": approval_data.person_id}
                )
            )
        
        # Update approval status
        person.SecurityApproved = approval_data.approved
        person.ApprovalDate = datetime.now() if approval_data.approved else None
        
        if approval_data.notes:
            person.SecurityNotes = approval_data.notes
        
        db.commit()
        db.refresh(person)
        
        status_text = "onaylandı" if approval_data.approved else "reddedildi"
        
        return success_response(
            data=WorkOrderPersonResponse.model_validate(person).model_dump(),
            message=f"Kişi {status_text}"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Güvenlik onayı işlenirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.post("/work-order-person/bulk-security-approval")
def bulk_security_approval(
    approval_data: SecurityApprovalBulkRequest,
    db: Session = Depends(get_db)
):
    """Bulk approve or reject multiple persons"""
    try:
        # Get all persons
        persons = db.execute(
            select(WorkOrderPerson).where(WorkOrderPerson.Id.in_(approval_data.person_ids))
        ).scalars().all()
        
        if len(persons) != len(approval_data.person_ids):
            found_ids = [p.Id for p in persons]
            missing_ids = [pid for pid in approval_data.person_ids if pid not in found_ids]
            raise HTTPException(
                status_code=404,
                detail=error_response(
                    code=ErrorCode.NOT_FOUND,
                    message="Bazı kişiler bulunamadı",
                    details={"missing_ids": missing_ids}
                )
            )
        
        # Update all persons
        approval_time = datetime.now() if approval_data.approved else None
        
        for person in persons:
            person.SecurityApproved = approval_data.approved
            person.ApprovalDate = approval_time
            
            if approval_data.notes:
                person.SecurityNotes = approval_data.notes
        
        db.commit()
        
        status_text = "onaylandı" if approval_data.approved else "reddedildi"
        
        return success_response(
            data={"updated_count": len(persons), "person_ids": approval_data.person_ids},
            message=f"{len(persons)} kişi {status_text}"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Toplu güvenlik onayı işlenirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.post("/work-order/{work_order_id}/persons/{person_id}/upload-identity")
async def upload_identity_photo(
    work_order_id: int,
    person_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Kimlik fotoğrafı yükle
    
    Args:
        work_order_id: İş emri ID
        person_id: Kişi ID
        file: Kimlik fotoğrafı (JPEG/PNG)
    """
    try:
        # Kişi kaydını kontrol et
        person = db.get(WorkOrderPerson, person_id)
        
        if not person:
            raise HTTPException(
                status_code=404,
                detail=error_response(
                    code=ErrorCode.NOT_FOUND,
                    message="Kişi kaydı bulunamadı",
                    details={"person_id": person_id}
                )
            )
        
        # İş emri kontrolü
        if person.WorkOrderId != work_order_id:
            raise HTTPException(
                status_code=400,
                detail=error_response(
                    code=ErrorCode.VALIDATION_ERROR,
                    message="Kişi bu iş emrine ait değil",
                    details={"person_work_order_id": person.WorkOrderId, "requested_work_order_id": work_order_id}
                )
            )
        
        # Dosya tipi kontrolü
        allowed_types = ["image/jpeg", "image/jpg", "image/png"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=error_response(
                    code=ErrorCode.VALIDATION_ERROR,
                    message="Sadece JPEG/PNG dosyaları yüklenebilir",
                    details={"uploaded_type": file.content_type}
                )
            )
        
        # Dosya boyutu kontrolü (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        contents = await file.read()
        if len(contents) > max_size:
            raise HTTPException(
                status_code=400,
                detail=error_response(
                    code=ErrorCode.VALIDATION_ERROR,
                    message="Dosya boyutu 5MB'dan büyük olamaz",
                    details={"file_size_mb": len(contents) / (1024 * 1024)}
                )
            )
        
        # Upload klasörü oluştur
        upload_dir = Path("uploads/identity_photos")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Unique dosya adı oluştur
        file_ext = file.filename.split(".")[-1]
        unique_filename = f"{person_id}_{uuid.uuid4().hex[:8]}.{file_ext}"
        file_path = upload_dir / unique_filename
        
        # Dosyayı kaydet
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Kişi kaydına dosya yolunu ekle
        person.IdentityPhotoPath = str(file_path)
        person.IdentityPhotoUrl = f"/uploads/identity_photos/{unique_filename}"
        person.UpdatedAt = datetime.now()
        
        db.commit()
        db.refresh(person)
        
        return success_response(
            data={
                "person_id": person_id,
                "photo_url": person.IdentityPhotoUrl,
                "file_size_kb": len(contents) / 1024
            },
            message="Kimlik fotoğrafı yüklendi"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Kimlik fotoğrafı yüklenirken hata oluştu",
                details={"error": str(e)}
            )
        )
