# backend/aliaport_api/modules/motorbot/router.py
# motorbot.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload, joinedload

from ...config.database import get_db
from ...core import (
    success_response,
    error_response,
    paginated_response,
    ErrorCode,
    get_http_status_for_error
)
from .models import Motorbot, MbTrip
from .schemas import MotorbotCreate, MotorbotUpdate, MotorbotOut, MbTripCreate, MbTripUpdate, MbTripOut


router = APIRouter(prefix="/api/motorbot", tags=["Motorbot"])


# === MbTrip (Sefer) Endpoints - MUST BE BEFORE MOTORBOT ENDPOINTS ===
# FastAPI matches routes in order, so /sefer must come before /{motorbot_id}

@router.get("/sefer", tags=["Sefer"])
def list_trips(
    page: int = Query(1, ge=1, description="Sayfa numarası"),
    page_size: int = Query(20, ge=1, le=1000, description="Sayfa başına kayıt"),
    mb_kod: Optional[str] = Query(None, description="Motorbot kodu filtresi"),
    db: Session = Depends(get_db)
):
    """
    Sefer listesini getir (sayfalanmış)
    
    Returns:
        PaginatedResponse with trip list
    """
    try:
        # Base query with eager loading (N+1 prevention for motorbot relation)
        query = db.query(MbTrip).options(
            joinedload(MbTrip.motorbot)
        )
        
        # MB filter (join with Motorbot table)
        if mb_kod:
            query = query.join(Motorbot).filter(Motorbot.Kod == mb_kod)
        
        # Total count
        total = query.count()
        
        # Pagination
        offset = (page - 1) * page_size
        items = query.order_by(
            MbTrip.SeferTarihi.desc(), 
            MbTrip.Id.desc()
        ).offset(offset).limit(page_size).all()
        
        # Convert to Pydantic models and then to dicts
        trip_list = [MbTripOut.model_validate(item).model_dump() for item in items]
        
        return paginated_response(
            data=trip_list,
            page=page,
            page_size=page_size,
            total=total,
            message=f"{total} sefer bulundu"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Sefer listesi getirilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.post("/sefer", status_code=status.HTTP_201_CREATED, tags=["Sefer"])
def create_trip(payload: MbTripCreate, db: Session = Depends(get_db)):
    """
    Yeni sefer oluştur
    
    Returns:
        StandardResponse with created trip
    """
    try:
        obj = MbTrip(**payload.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        
        trip_data = MbTripOut.model_validate(obj)
        return success_response(
            data=trip_data.model_dump(),
            message="Sefer başarıyla oluşturuldu"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Sefer oluşturulurken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/sefer/{trip_id}", tags=["Sefer"])
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    """
    ID ile sefer getir
    
    Returns:
        StandardResponse with trip data
    """
    # Eager loading ile N+1 problem çözümü (1 query with JOIN)
    obj = db.query(MbTrip).options(
        joinedload(MbTrip.motorbot)
    ).filter(MbTrip.Id == trip_id).first()
    
    if not obj:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.SEFER_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.SEFER_NOT_FOUND,
                message="Sefer kaydı bulunamadı",
                details={"trip_id": trip_id}
            )
        )
    
    trip_data = MbTripOut.model_validate(obj)
    return success_response(
        data=trip_data.model_dump(),
        message="Sefer başarıyla getirildi"
    )


@router.put("/sefer/{trip_id}", tags=["Sefer"])
def update_trip(
    trip_id: int,
    payload: MbTripUpdate,
    db: Session = Depends(get_db),
):
    """
    Sefer güncelle
    
    Returns:
        StandardResponse with updated trip
    """
    obj = db.get(MbTrip, trip_id)
    if not obj:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.SEFER_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.SEFER_NOT_FOUND,
                message="Sefer kaydı bulunamadı",
                details={"trip_id": trip_id}
            )
        )
    
    try:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        
        db.commit()
        db.refresh(obj)
        
        trip_data = MbTripOut.model_validate(obj)
        return success_response(
            data=trip_data.model_dump(),
            message="Sefer başarıyla güncellendi"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Sefer güncellenirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.delete("/sefer/{trip_id}", tags=["Sefer"])
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    """
    Sefer sil
    
    Returns:
        StandardResponse with success message
    """
    obj = db.get(MbTrip, trip_id)
    if not obj:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.SEFER_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.SEFER_NOT_FOUND,
                message="Sefer kaydı bulunamadı",
                details={"trip_id": trip_id}
            )
        )
    
    try:
        db.delete(obj)
        db.commit()
        
        return success_response(
            data={"id": trip_id, "deleted": True},
            message="Sefer başarıyla silindi"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Sefer silinirken hata oluştu",
                details={"error": str(e)}
            )
        )


# === Motorbot CRUD Endpoints ===

@router.get("/")
def list_motorbotlar(
    page: int = Query(1, ge=1, description="Sayfa numarası"),
    page_size: int = Query(20, ge=1, le=1000, description="Sayfa başına kayıt"),
    search: Optional[str] = Query(None, description="Kod veya ad ile arama"),
    db: Session = Depends(get_db)
):
    """
    Motorbot listesini getir (sayfalanmış)
    
    Returns:
        PaginatedResponse with motorbot list
    """
    try:
        # Base query with eager loading (N+1 prevention)
        query = db.query(Motorbot).options(
            selectinload(Motorbot.trips)
        )
        
        # Search filter
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (Motorbot.Kod.ilike(search_filter)) | 
                (Motorbot.Ad.ilike(search_filter))
            )
        
        # Total count
        total = query.count()
        
        # Pagination
        offset = (page - 1) * page_size
        items = query.order_by(Motorbot.Kod).offset(offset).limit(page_size).all()
        
        # Convert to Pydantic models and then to dicts
        motorbot_list = [MotorbotOut.model_validate(item).model_dump() for item in items]
        
        return paginated_response(
            data=motorbot_list,
            page=page,
            page_size=page_size,
            total=total,
            message=f"{total} motorbot bulundu"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Motorbot listesi getirilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/{motorbot_id}")
def get_motorbot(motorbot_id: int, db: Session = Depends(get_db)):
    """
    ID ile motorbot getir
    
    Returns:
        StandardResponse with motorbot data
    """
    # Eager loading ile N+1 problem çözümü (1 query with JOIN)
    obj = db.query(Motorbot).options(
        joinedload(Motorbot.trips)
    ).filter(Motorbot.Id == motorbot_id).first()
    
    if not obj:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.MOTORBOT_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.MOTORBOT_NOT_FOUND,
                message="Motorbot bulunamadı",
                details={"motorbot_id": motorbot_id}
            )
        )
    
    motorbot_data = MotorbotOut.model_validate(obj)
    return success_response(
        data=motorbot_data.model_dump(),
        message="Motorbot başarıyla getirildi"
    )


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_motorbot(payload: MotorbotCreate, db: Session = Depends(get_db)):
    """
    Yeni motorbot oluştur
    
    Returns:
        StandardResponse with created motorbot
    """
    # Duplicate code check
    if db.query(Motorbot).filter(Motorbot.Kod == payload.Kod).first():
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.MOTORBOT_DUPLICATE_CODE),
            detail=error_response(
                code=ErrorCode.MOTORBOT_DUPLICATE_CODE,
                message="Bu motorbot kodu zaten kullanılıyor",
                details={"kod": payload.Kod},
                field="Kod"
            )
        )
    
    try:
        obj = Motorbot(**payload.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        
        motorbot_data = MotorbotOut.model_validate(obj)
        return success_response(
            data=motorbot_data.model_dump(),
            message="Motorbot başarıyla oluşturuldu"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Motorbot oluşturulurken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.put("/{motorbot_id}")
def update_motorbot(
    motorbot_id: int,
    payload: MotorbotUpdate,
    db: Session = Depends(get_db),
):
    """
    Motorbot güncelle
    
    Returns:
        StandardResponse with updated motorbot
    """
    obj = db.get(Motorbot, motorbot_id)
    if not obj:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.MOTORBOT_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.MOTORBOT_NOT_FOUND,
                message="Motorbot bulunamadı",
                details={"motorbot_id": motorbot_id}
            )
        )
    
    try:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        
        db.commit()
        db.refresh(obj)
        
        motorbot_data = MotorbotOut.model_validate(obj)
        return success_response(
            data=motorbot_data.model_dump(),
            message="Motorbot başarıyla güncellendi"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Motorbot güncellenirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.delete("/{motorbot_id}")
def delete_motorbot(motorbot_id: int, db: Session = Depends(get_db)):
    """
    Motorbot sil
    
    Returns:
        StandardResponse with success message
    """
    obj = db.get(Motorbot, motorbot_id)
    if not obj:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.MOTORBOT_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.MOTORBOT_NOT_FOUND,
                message="Motorbot bulunamadı",
                details={"motorbot_id": motorbot_id}
            )
        )
    
    # Sefer kaydı var mı kontrol et
    trip_count = db.query(MbTrip).filter(MbTrip.MotorbotId == obj.Id).count()
    if trip_count > 0:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.MOTORBOT_IN_USE),
            detail=error_response(
                code=ErrorCode.MOTORBOT_IN_USE,
                message=f"Bu motorbot {trip_count} adet seferde kullanılmaktadır. Silme işlemi yapılamaz.",
                details={"motorbot_id": motorbot_id, "trip_count": trip_count}
            )
        )
    
    try:
        db.delete(obj)
        db.commit()
        
        return success_response(
            data={"id": motorbot_id, "deleted": True},
            message="Motorbot başarıyla silindi"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Motorbot silinirken hata oluştu",
                details={"error": str(e)}
            )
        )
