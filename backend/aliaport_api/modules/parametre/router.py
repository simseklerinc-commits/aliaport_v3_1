from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ...config.database import get_db
from ...core import (
    success_response,
    error_response,
    paginated_response,
    ErrorCode,
    get_http_status_for_error
)
from .models import Parametre
from .schemas import (
    ParametreResponse,
    ParametreCreate,
    ParametreUpdate,
)

router = APIRouter(prefix="/api/parametre", tags=["Parametre"])


@router.get("/")
def get_all_parametreler(
    page: int = Query(1, ge=1, description="Sayfa numarası"),
    page_size: int = Query(50, ge=1, le=1000, description="Sayfa başına kayıt"),
    kategori: Optional[str] = Query(None, description="Kategori filtresi"),
    aktif: Optional[bool] = Query(None, description="Aktif/Pasif filtresi"),
    db: Session = Depends(get_db),
):
    """
    Tüm parametreleri listele (pagination + filtreler)
    
    Returns:
        PaginatedResponse with parametre list
    """
    try:
        query = db.query(Parametre)
        
        # Kategori filtresi
        if kategori:
            query = query.filter(Parametre.Kategori == kategori)
        
        # Aktif filtresi
        if aktif is not None:
            query = query.filter(Parametre.AktifMi == aktif)
        
        # Toplam kayıt sayısı
        total = query.count()
        
        # Pagination
        offset = (page - 1) * page_size
        items = query.order_by(Parametre.Kategori, Parametre.Kod).offset(offset).limit(page_size).all()
        
        # Convert to Pydantic and then dict
        parametre_list = [ParametreResponse.model_validate(item).model_dump() for item in items]
        
        return paginated_response(
            data=parametre_list,
            page=page,
            page_size=page_size,
            total=total,
            message=f"{total} parametre bulundu"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Parametre listesi getirilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/by-kategori/{kategori}")
def get_by_kategori(
    kategori: str, 
    include_inactive: bool = Query(False, description="Pasif parametreleri de getir"),
    db: Session = Depends(get_db)
):
    """
    Belirli kategori altındaki parametreleri listele
    
    Returns:
        StandardResponse with parametre list
    """
    try:
        query = db.query(Parametre).filter(Parametre.Kategori == kategori)
        
        if not include_inactive:
            query = query.filter(Parametre.AktifMi == True)
        
        items = query.order_by(Parametre.Kod).all()
        
        if not items:
            return success_response(
                data=[],
                message=f"{kategori} kategorisinde parametre bulunamadı"
            )
        
        parametre_list = [ParametreResponse.model_validate(item).model_dump() for item in items]
        
        return success_response(
            data=parametre_list,
            message=f"{kategori} kategorisinde {len(parametre_list)} parametre bulundu"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Kategori parametreleri getirilirken hata oluştu",
                details={"kategori": kategori, "error": str(e)}
            )
        )


@router.get("/{parametre_id}")
def get_parametre(parametre_id: int, db: Session = Depends(get_db)):
    """
    Belirli bir parametreyi getir
    
    Returns:
        StandardResponse with parametre data
    """
    parametre = db.query(Parametre).filter(Parametre.Id == parametre_id).first()
    
    if not parametre:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.PARAMETRE_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.PARAMETRE_NOT_FOUND,
                message="Parametre bulunamadı",
                details={"parametre_id": parametre_id}
            )
        )
    
    parametre_data = ParametreResponse.model_validate(parametre)
    return success_response(
        data=parametre_data.model_dump(),
        message="Parametre başarıyla getirildi"
    )


@router.post("/")
def create_parametre(parametre_data: ParametreCreate, db: Session = Depends(get_db)):
    """
    Yeni parametre ekle
    
    Returns:
        StandardResponse with created parametre
    """
    # Kod benzersizliğini kontrol et
    existing = db.query(Parametre).filter(Parametre.Kod == parametre_data.Kod).first()
    if existing:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.PARAMETRE_DUPLICATE_CODE),
            detail=error_response(
                code=ErrorCode.PARAMETRE_DUPLICATE_CODE,
                message="Bu parametre kodu zaten kullanılıyor",
                details={"kod": parametre_data.Kod},
                field="Kod"
            )
        )
    
    try:
        new_parametre = Parametre(**parametre_data.model_dump())
        db.add(new_parametre)
        db.commit()
        db.refresh(new_parametre)
        
        parametre_result = ParametreResponse.model_validate(new_parametre)
        return success_response(
            data=parametre_result.model_dump(),
            message="Parametre başarıyla oluşturuldu"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Parametre oluşturulurken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.put("/{parametre_id}")
def update_parametre(
    parametre_id: int,
    parametre_data: ParametreUpdate,
    db: Session = Depends(get_db),
):
    """
    Parametre güncelle
    
    Returns:
        StandardResponse with updated parametre
    """
    parametre = db.query(Parametre).filter(Parametre.Id == parametre_id).first()
    
    if not parametre:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.PARAMETRE_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.PARAMETRE_NOT_FOUND,
                message="Parametre bulunamadı",
                details={"parametre_id": parametre_id}
            )
        )
    
    # Kod benzersizliğini kontrol et (eğer değiştiriliyorsa)
    if parametre_data.Kod and parametre_data.Kod != parametre.Kod:
        existing = db.query(Parametre).filter(Parametre.Kod == parametre_data.Kod).first()
        if existing:
            raise HTTPException(
                status_code=get_http_status_for_error(ErrorCode.PARAMETRE_DUPLICATE_CODE),
                detail=error_response(
                    code=ErrorCode.PARAMETRE_DUPLICATE_CODE,
                    message="Bu parametre kodu zaten kullanılıyor",
                    details={"kod": parametre_data.Kod},
                    field="Kod"
                )
            )
    
    try:
        # Güncelleme
        update_data = parametre_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(parametre, key, value)
        
        db.commit()
        db.refresh(parametre)
        
        parametre_result = ParametreResponse.model_validate(parametre)
        return success_response(
            data=parametre_result.model_dump(),
            message="Parametre başarıyla güncellendi"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Parametre güncellenirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.delete("/{parametre_id}")
def delete_parametre(parametre_id: int, db: Session = Depends(get_db)):
    """
    Parametre sil (soft delete - AktifMi=False)
    
    Returns:
        StandardResponse with success message
    """
    parametre = db.query(Parametre).filter(Parametre.Id == parametre_id).first()
    
    if not parametre:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.PARAMETRE_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.PARAMETRE_NOT_FOUND,
                message="Parametre bulunamadı",
                details={"parametre_id": parametre_id}
            )
        )
    
    try:
        # Soft delete: AktifMi bayrağını False yap
        parametre.AktifMi = False
        parametre.UpdatedAt = datetime.utcnow()
        db.commit()
        db.refresh(parametre)
        
        return success_response(
            data={"id": parametre_id, "deleted": True, "aktif": False},
            message="Parametre pasif hale getirildi"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Parametre silinirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.patch("/{parametre_id}/toggle-active")
def toggle_parametre_active(parametre_id: int, db: Session = Depends(get_db)):
    """
    Parametre aktif/pasif durumunu değiştir
    
    Returns:
        StandardResponse with updated parametre
    """
    parametre = db.query(Parametre).filter(Parametre.Id == parametre_id).first()
    
    if not parametre:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.PARAMETRE_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.PARAMETRE_NOT_FOUND,
                message="Parametre bulunamadı",
                details={"parametre_id": parametre_id}
            )
        )
    
    try:
        # Toggle AktifMi
        parametre.AktifMi = not parametre.AktifMi
        parametre.UpdatedAt = datetime.utcnow()
        db.commit()
        db.refresh(parametre)
        
        parametre_result = ParametreResponse.model_validate(parametre)
        return success_response(
            data=parametre_result.model_dump(),
            message=f"Parametre {'aktif' if parametre.AktifMi else 'pasif'} hale getirildi"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Parametre durumu değiştirilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/", response_model=PaginatedParametreResponse)
def get_all_parametreler(
    page: int = 1,
    page_size: int = 50,
    kategori: Optional[str] = None,
    aktif: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """
    Tüm parametreleri listele (pagination + filtreler)
    """
    query = db.query(Parametre)
    
    # Kategori filtresi
    if kategori:
        query = query.filter(Parametre.Kategori == kategori)
    
    # Aktif filtresi
    if aktif is not None:
        query = query.filter(Parametre.AktifMi == aktif)
    
    # Toplam kayıt sayısı
    total = query.count()
    
    # Pagination
    offset = (page - 1) * page_size
    parametreler = query.order_by(Parametre.Kategori, Parametre.Kod).offset(offset).limit(page_size).all()
    
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    return {
        "items": parametreler,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/by-kategori/{kategori}", response_model=List[ParametreResponse])
def get_by_kategori(
    kategori: str, 
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    """
    Belirli kategori altındaki parametreleri listele
    - include_inactive=False: Sadece aktif parametreler (varsayılan)
    - include_inactive=True: Tüm parametreler (aktif + pasif)
    """
    query = db.query(Parametre).filter(Parametre.Kategori == kategori)
    
    if not include_inactive:
        query = query.filter(Parametre.AktifMi == True)
    
    parametreler = query.order_by(Parametre.Kod).all()
    return parametreler


@router.get("/{parametre_id}", response_model=ParametreResponse)
def get_parametre(parametre_id: int, db: Session = Depends(get_db)):
    """
    Belirli bir parametreyi getir
    """
    parametre = db.query(Parametre).filter(Parametre.Id == parametre_id).first()
    if not parametre:
        raise HTTPException(status_code=404, detail="Parametre bulunamadı")
    return parametre


@router.post("/", response_model=ParametreResponse)
def create_parametre(parametre_data: ParametreCreate, db: Session = Depends(get_db)):
    """
    Yeni parametre ekle
    """
    # Kod benzersizliğini kontrol et
    existing = db.query(Parametre).filter(Parametre.Kod == parametre_data.Kod).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu kod zaten kullanılıyor")
    
    new_parametre = Parametre(**parametre_data.model_dump())
    db.add(new_parametre)
    db.commit()
    db.refresh(new_parametre)
    return new_parametre


@router.put("/{parametre_id}", response_model=ParametreResponse)
def update_parametre(
    parametre_id: int,
    parametre_data: ParametreUpdate,
    db: Session = Depends(get_db),
):
    """
    Parametre güncelle
    """
    parametre = db.query(Parametre).filter(Parametre.Id == parametre_id).first()
    if not parametre:
        raise HTTPException(status_code=404, detail="Parametre bulunamadı")
    
    # Kod benzersizliğini kontrol et (eğer değiştiriliyorsa)
    if parametre_data.Kod and parametre_data.Kod != parametre.Kod:
        existing = db.query(Parametre).filter(Parametre.Kod == parametre_data.Kod).first()
        if existing:
            raise HTTPException(status_code=400, detail="Bu kod zaten kullanılıyor")
    
    # Güncelleme
    update_data = parametre_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(parametre, key, value)
    
    db.commit()
    db.refresh(parametre)
    return parametre


@router.delete("/{parametre_id}")
def delete_parametre(parametre_id: int, db: Session = Depends(get_db)):
    """
    Parametre sil (soft delete - AktifMi=False)
    """
    parametre = db.query(Parametre).filter(Parametre.Id == parametre_id).first()
    if not parametre:
        raise HTTPException(status_code=404, detail="Parametre bulunamadı")
    
    # Soft delete: AktifMi bayrağını False yap
    parametre.AktifMi = False
    parametre.UpdatedAt = datetime.utcnow()
    db.commit()
    db.refresh(parametre)
    return {"success": True, "message": "Parametre pasif hale getirildi"}


@router.patch("/{parametre_id}/toggle-active", response_model=ParametreResponse)
def toggle_parametre_active(parametre_id: int, db: Session = Depends(get_db)):
    """
    Parametre aktif/pasif durumunu değiştir
    """
    parametre = db.query(Parametre).filter(Parametre.Id == parametre_id).first()
    if not parametre:
        raise HTTPException(status_code=404, detail="Parametre bulunamadı")
    
    # Toggle AktifMi
    parametre.AktifMi = not parametre.AktifMi
    parametre.UpdatedAt = datetime.utcnow()
    db.commit()
    db.refresh(parametre)
    return parametre
