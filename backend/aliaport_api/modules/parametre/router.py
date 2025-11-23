from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from ...config.database import get_db
from ...core import (
    success_response,
    error_response,
    paginated_response,
    ErrorCode,
    get_http_status_for_error,
)
from ...core.cache import cache_key, cached_get_or_set, cache
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
    """Tüm parametreleri listele (pagination + filtreler)."""
    try:
        query = db.query(Parametre)
        if kategori:
            query = query.filter(Parametre.Kategori == kategori)
        if aktif is not None:
            query = query.filter(Parametre.AktifMi == aktif)
        total = query.count()
        offset = (page - 1) * page_size
        items = (
            query.order_by(Parametre.Kategori, Parametre.Kod)
            .offset(offset)
            .limit(page_size)
            .all()
        )
        data = [ParametreResponse.model_validate(i).model_dump() for i in items]
        return paginated_response(
            data=data,
            page=page,
            page_size=page_size,
            total=total,
            message=f"{total} parametre bulundu",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Parametre listesi getirilirken hata oluştu",
                details={"error": str(e)},
            ),
        )


@router.get("/by-kategori/{kategori}")
def get_by_kategori(
    kategori: str,
    include_inactive: bool = Query(False, description="Pasif parametreleri de getir"),
    db: Session = Depends(get_db),
):
    """Belirli kategori altındaki parametreleri TTL cache ile listele."""
    try:
        key = cache_key(
            "parametre:kategori", kategori=kategori, inactive=include_inactive
        )

        def fetch():
            q = db.query(Parametre).filter(Parametre.Kategori == kategori)
            if not include_inactive:
                q = q.filter(Parametre.AktifMi == True)  # noqa: E712
            records = q.order_by(Parametre.Kod).all()
            return [
                ParametreResponse.model_validate(r).model_dump() for r in records
            ]

        data, hit = cached_get_or_set(key, ttl_seconds=3600, fetcher=fetch)
        if not data:
            return success_response(
                data=[], message=f"{kategori} kategorisinde parametre bulunamadı"
            )
        return success_response(
            data=data,
            message=f"{kategori} kategorisinde {len(data)} parametre bulundu"
            + (" (cache)" if hit else ""),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Kategori parametreleri getirilirken hata oluştu",
                details={"kategori": kategori, "error": str(e)},
            ),
        )


@router.get("/{parametre_id}")
def get_parametre(parametre_id: int, db: Session = Depends(get_db)):
    parametre = (
        db.query(Parametre).filter(Parametre.Id == parametre_id).first()
    )
    if not parametre:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.PARAMETRE_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.PARAMETRE_NOT_FOUND,
                message="Parametre bulunamadı",
                details={"parametre_id": parametre_id},
            ),
        )
    data = ParametreResponse.model_validate(parametre).model_dump()
    return success_response(data=data, message="Parametre başarıyla getirildi")


@router.post("/")
def create_parametre(parametre_data: ParametreCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(Parametre).filter(Parametre.Kod == parametre_data.Kod).first()
    )
    if existing:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.PARAMETRE_DUPLICATE_CODE),
            detail=error_response(
                code=ErrorCode.PARAMETRE_DUPLICATE_CODE,
                message="Bu parametre kodu zaten kullanılıyor",
                details={"kod": parametre_data.Kod},
                field="Kod",
            ),
        )
    try:
        new_parametre = Parametre(**parametre_data.model_dump())
        db.add(new_parametre)
        db.commit()
        db.refresh(new_parametre)
        cache.invalidate("parametre:kategori")
        data = ParametreResponse.model_validate(new_parametre).model_dump()
        return success_response(data=data, message="Parametre başarıyla oluşturuldu")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Parametre oluşturulurken hata oluştu",
                details={"error": str(e)},
            ),
        )


@router.put("/{parametre_id}")
def update_parametre(
    parametre_id: int, parametre_data: ParametreUpdate, db: Session = Depends(get_db)
):
    parametre = (
        db.query(Parametre).filter(Parametre.Id == parametre_id).first()
    )
    if not parametre:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.PARAMETRE_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.PARAMETRE_NOT_FOUND,
                message="Parametre bulunamadı",
                details={"parametre_id": parametre_id},
            ),
        )
    if parametre_data.Kod and parametre_data.Kod != parametre.Kod:
        existing = (
            db.query(Parametre).filter(Parametre.Kod == parametre_data.Kod).first()
        )
        if existing:
            raise HTTPException(
                status_code=get_http_status_for_error(ErrorCode.PARAMETRE_DUPLICATE_CODE),
                detail=error_response(
                    code=ErrorCode.PARAMETRE_DUPLICATE_CODE,
                    message="Bu parametre kodu zaten kullanılıyor",
                    details={"kod": parametre_data.Kod},
                    field="Kod",
                ),
            )
    try:
        update_data = parametre_data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(parametre, k, v)
        db.commit()
        db.refresh(parametre)
        cache.invalidate("parametre:kategori")
        data = ParametreResponse.model_validate(parametre).model_dump()
        return success_response(data=data, message="Parametre başarıyla güncellendi")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Parametre güncellenirken hata oluştu",
                details={"error": str(e)},
            ),
        )


@router.delete("/{parametre_id}")
def delete_parametre(parametre_id: int, db: Session = Depends(get_db)):
    parametre = (
        db.query(Parametre).filter(Parametre.Id == parametre_id).first()
    )
    if not parametre:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.PARAMETRE_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.PARAMETRE_NOT_FOUND,
                message="Parametre bulunamadı",
                details={"parametre_id": parametre_id},
            ),
        )
    try:
        parametre.AktifMi = False
        parametre.UpdatedAt = datetime.utcnow()
        db.commit()
        db.refresh(parametre)
        cache.invalidate("parametre:kategori")
        return success_response(
            data={"id": parametre_id, "deleted": True, "aktif": False},
            message="Parametre pasif hale getirildi",
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Parametre silinirken hata oluştu",
                details={"error": str(e)},
            ),
        )


@router.patch("/{parametre_id}/toggle-active")
def toggle_parametre_active(parametre_id: int, db: Session = Depends(get_db)):
    parametre = (
        db.query(Parametre).filter(Parametre.Id == parametre_id).first()
    )
    if not parametre:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.PARAMETRE_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.PARAMETRE_NOT_FOUND,
                message="Parametre bulunamadı",
                details={"parametre_id": parametre_id},
            ),
        )
    try:
        parametre.AktifMi = not parametre.AktifMi
        parametre.UpdatedAt = datetime.utcnow()
        db.commit()
        db.refresh(parametre)
        cache.invalidate("parametre:kategori")
        data = ParametreResponse.model_validate(parametre).model_dump()
        return success_response(
            data=data,
            message=f"Parametre {'aktif' if parametre.AktifMi else 'pasif'} hale getirildi",
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Parametre durumu değiştirilirken hata oluştu",
                details={"error": str(e)},
            ),
        )
