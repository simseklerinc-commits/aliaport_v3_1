from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ...config.database import get_db
from ...core import (
    success_response,
    error_response,
    paginated_response,
    ErrorCode,
    get_http_status_for_error
)
from .models import Hizmet
from ..tarife.models import PriceListItem
from .schemas import HizmetResponse, HizmetCreate, HizmetUpdate

router = APIRouter()


@router.get("/")
def get_all_hizmetler(
    page: int = Query(1, ge=1, description="Sayfa numarası"),
    page_size: int = Query(20, ge=1, le=1000, description="Sayfa başına kayıt"),
    is_active: Optional[bool] = Query(None, description="Aktif/pasif filtresi"),
    search: Optional[str] = Query(None, description="Kod veya ad ile arama"),
    db: Session = Depends(get_db),
):
    """
    Hizmet listesini getir (sayfalanmış)
    
    Returns:
        PaginatedResponse with hizmet list
    """
    try:
        # Base query
        query = db.query(Hizmet)
        
        # Active filter
        if is_active is not None:
            query = query.filter(Hizmet.AktifMi == is_active)
        
        # Search filter
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (Hizmet.Kod.ilike(search_filter)) | 
                (Hizmet.Ad.ilike(search_filter))
            )
        
        # Total count
        total = query.count()
        
        # Pagination
        offset = (page - 1) * page_size
        items = query.order_by(Hizmet.Kod).offset(offset).limit(page_size).all()
        
        # Convert to Pydantic models and then to dicts
        hizmet_list = [HizmetResponse.model_validate(item).model_dump() for item in items]
        
        return paginated_response(
            data=hizmet_list,
            page=page,
            page_size=page_size,
            total=total,
            message=f"{total} hizmet bulundu"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Hizmet listesi getirilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/{hizmet_id}")
def get_hizmet(hizmet_id: int, db: Session = Depends(get_db)):
    """
    ID ile hizmet getir
    
    Returns:
        StandardResponse with hizmet data
    """
    obj = db.get(Hizmet, hizmet_id)
    if not obj:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.HIZMET_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.HIZMET_NOT_FOUND,
                message="Hizmet bulunamadı",
                details={"hizmet_id": hizmet_id}
            )
        )
    
    hizmet_data = HizmetResponse.model_validate(obj)
    return success_response(
        data=hizmet_data.model_dump(),
        message="Hizmet başarıyla getirildi"
    )


@router.post("/")
def create_hizmet(payload: HizmetCreate, db: Session = Depends(get_db)):
    """
    Yeni hizmet oluştur
    
    Returns:
        StandardResponse with created hizmet
    """
    # Duplicate code check
    if db.query(Hizmet).filter(Hizmet.Kod == payload.Kod).first():
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.HIZMET_DUPLICATE_CODE),
            detail=error_response(
                code=ErrorCode.HIZMET_DUPLICATE_CODE,
                message="Bu hizmet kodu zaten kullanılıyor",
                details={"kod": payload.Kod},
                field="Kod"
            )
        )
    
    try:
        obj = Hizmet(**payload.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        
        hizmet_data = HizmetResponse.model_validate(obj)
        return success_response(
            data=hizmet_data.model_dump(),
            message="Hizmet başarıyla oluşturuldu"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Hizmet oluşturulurken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.put("/{hizmet_id}")
def update_hizmet(
    hizmet_id: int,
    payload: HizmetUpdate,
    db: Session = Depends(get_db),
):
    """
    Hizmet güncelle
    
    Returns:
        StandardResponse with updated hizmet
    """
    obj = db.get(Hizmet, hizmet_id)
    if not obj:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.HIZMET_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.HIZMET_NOT_FOUND,
                message="Hizmet bulunamadı",
                details={"hizmet_id": hizmet_id}
            )
        )
    
    # Kod değiştiriliyor mu ve duplicate var mı?
    update_data = payload.model_dump(exclude_unset=True)
    if "Kod" in update_data and update_data["Kod"] != obj.Kod:
        existing = db.query(Hizmet).filter(Hizmet.Kod == update_data["Kod"]).first()
        if existing:
            raise HTTPException(
                status_code=get_http_status_for_error(ErrorCode.HIZMET_DUPLICATE_CODE),
                detail=error_response(
                    code=ErrorCode.HIZMET_DUPLICATE_CODE,
                    message="Bu hizmet kodu zaten kullanılıyor",
                    details={"kod": update_data["Kod"]},
                    field="Kod"
                )
            )
    
    try:
        for k, v in update_data.items():
            setattr(obj, k, v)
        db.commit()
        db.refresh(obj)
        
        hizmet_data = HizmetResponse.model_validate(obj)
        return success_response(
            data=hizmet_data.model_dump(),
            message="Hizmet başarıyla güncellendi"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Hizmet güncellenirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.delete("/{hizmet_id}")
def delete_hizmet(hizmet_id: int, db: Session = Depends(get_db)):
    """
    Hizmet sil - İşlem görmüş ise silmeyi engelle
    
    Returns:
        StandardResponse with success message
    """
    obj = db.get(Hizmet, hizmet_id)
    if not obj:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.HIZMET_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.HIZMET_NOT_FOUND,
                message="Hizmet bulunamadı",
                details={"hizmet_id": hizmet_id}
            )
        )
    
    # Tarife kalemlerinde kullanılıp kullanılmadığını kontrol et
    tarife_kullanim = db.query(PriceListItem).filter(
        PriceListItem.HizmetKodu == obj.Kod
    ).count()
    
    if tarife_kullanim > 0:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.HIZMET_INACTIVE),
            detail=error_response(
                code=ErrorCode.HIZMET_INACTIVE,
                message=f"Bu hizmet {tarife_kullanim} adet tarife kaleminde kullanılmaktadır. Silme işlemi yapılamaz.",
                details={"hizmet_id": hizmet_id, "kullanim_sayisi": tarife_kullanim}
            )
        )
    
    try:
        db.delete(obj)
        db.commit()
        
        return success_response(
            data={"id": hizmet_id, "deleted": True},
            message="Hizmet başarıyla silindi"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Hizmet silinirken hata oluştu",
                details={"error": str(e)}
            )
        )
