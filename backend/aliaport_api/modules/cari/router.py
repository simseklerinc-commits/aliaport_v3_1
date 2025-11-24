# backend/aliaport_api/modules/cari/router.py
# cari.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ...config.database import get_db
from ...core import (
    success_response,
    error_response,
    paginated_response,
    ErrorCode,
    get_http_status_for_error
)
from .models import Cari
from ..isemri.models import WorkOrder
from .schemas import CariCreate, CariUpdate, CariOut

router = APIRouter(prefix="/api/cari", tags=["Cari"])


@router.get("/")
def list_cari(
    page: int = Query(1, ge=1, description="Sayfa numarası"),
    page_size: int = Query(20, ge=1, le=1000, description="Sayfa başına kayıt"),
    search: Optional[str] = Query(None, description="Unvan veya kod ile arama"),
    db: Session = Depends(get_db)
):
    """
    Cari listesini getir (sayfalanmış)
    
    Returns:
        PaginatedResponse with cari list
    """
    try:
        # Base query
        query = db.query(Cari)
        
        # Search filter
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (Cari.Unvan.ilike(search_filter)) | 
                (Cari.CariKod.ilike(search_filter))
            )
        
        # Total count
        total = query.count()
        
        # Pagination
        offset = (page - 1) * page_size
        items = query.order_by(Cari.Unvan).offset(offset).limit(page_size).all()
        
        # Convert to Pydantic models and then to dicts
        cari_list = [CariOut.model_validate(item).model_dump() for item in items]
        
        return paginated_response(
            data=cari_list,
            page=page,
            page_size=page_size,
            total=total,
            message=f"{total} cari bulundu"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Cari listesi getirilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/{cari_id}")
def get_cari(cari_id: int, db: Session = Depends(get_db)):
    """
    ID ile cari getir
    
    Returns:
        StandardResponse with cari data
    """
    obj = db.get(Cari, cari_id)
    if not obj:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.CARI_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.CARI_NOT_FOUND,
                message="Cari bulunamadı",
                details={"cari_id": cari_id}
            )
        )
    
    cari_data = CariOut.model_validate(obj)
    return success_response(
        data=cari_data.model_dump(),
        message="Cari başarıyla getirildi"
    )


@router.post("/")
def create_cari(payload: CariCreate, db: Session = Depends(get_db)):
    """
    Yeni cari oluştur
    
    Returns:
        StandardResponse with created cari
    """
    # Duplicate code check
    if db.query(Cari).filter(Cari.CariKod == payload.CariKod).first():
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.CARI_DUPLICATE_CODE),
            detail=error_response(
                code=ErrorCode.CARI_DUPLICATE_CODE,
                message="Bu cari kodu zaten kullanılıyor",
                details={"cari_kod": payload.CariKod},
                field="CariKod"
            )
        )
    
    try:
        obj = Cari(**payload.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        
        cari_data = CariOut.model_validate(obj)
        return success_response(
            data=cari_data.model_dump(),
            message="Cari başarıyla oluşturuldu"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Cari oluşturulurken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.put("/{cari_id}")
def update_cari(cari_id: int, payload: CariUpdate, db: Session = Depends(get_db)):
    """
    Cari güncelle
    
    Returns:
        StandardResponse with updated cari
    """
    obj = db.get(Cari, cari_id)
    if not obj:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.CARI_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.CARI_NOT_FOUND,
                message="Cari bulunamadı",
                details={"cari_id": cari_id}
            )
        )
    
    try:
        for k, v in payload.model_dump(exclude_unset=True).items():
            setattr(obj, k, v)
        db.commit()
        db.refresh(obj)
        
        cari_data = CariOut.model_validate(obj)
        return success_response(
            data=cari_data.model_dump(),
            message="Cari başarıyla güncellendi"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Cari güncellenirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.delete("/{cari_id}")
def delete_cari(cari_id: int, db: Session = Depends(get_db)):
    """
    Cari sil
    
    Returns:
        StandardResponse with success message
    """
    obj = db.get(Cari, cari_id)
    if not obj:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.CARI_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.CARI_NOT_FOUND,
                message="Cari bulunamadı",
                details={"cari_id": cari_id}
            )
        )
    
    # İlişkili iş emri var mı? (FK yok ama logical relation: cari_id veya cari_code eşleşmesi)
    related_count = (
        db.query(WorkOrder)
        .filter((WorkOrder.cari_id == cari_id) | (WorkOrder.cari_code == obj.CariKod))
        .count()
    )
    if related_count > 0:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.CARI_DELETE_HAS_RELATIONS),
            detail=error_response(
                code=ErrorCode.CARI_DELETE_HAS_RELATIONS,
                message="Bu cari silinemez, ilişkili iş emirleri mevcut",
                details={"cari_id": cari_id, "workorder_count": related_count}
            )
        )

    try:
        db.delete(obj)
        db.commit()
        
        return success_response(
            data={"id": cari_id, "deleted": True},
            message="Cari başarıyla silindi"
        )
    
    except Exception as e:
        db.rollback()
        # Check if it's a foreign key constraint error
        if "FOREIGN KEY constraint failed" in str(e):
            raise HTTPException(
                status_code=get_http_status_for_error(ErrorCode.CARI_DELETE_HAS_RELATIONS),
                detail=error_response(
                    code=ErrorCode.CARI_DELETE_HAS_RELATIONS,
                    message="Bu cari silinemez, ilişkili kayıtlar var (iş emirleri, faturalar vs.)",
                    details={"cari_id": cari_id}
                )
            )
        
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Cari silinirken hata oluştu",
                details={"error": str(e)}
            )
        )
