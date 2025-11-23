"""
GÜVENLİK MODÜLÜ - Router
GateLog API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
import hashlib

from ...config.database import get_db
from ...core.responses import success_response, error_response, paginated_response
from ...core.error_codes import ErrorCode, get_http_status_for_error
from .models import GateLog, GateChecklistItem
from .schemas import (
    GateLogCreate, GateLogCreateWithException, GateLogResponse,
    GateChecklistItemCreate, GateChecklistItemUpdate, GateChecklistItemResponse,
    GateStats
)

router = APIRouter(prefix="/api/gatelog", tags=["Güvenlik"])


# ============================================
# GATE LOG ENDPOINTS
# ============================================

@router.get("/")
def get_gate_logs(
    page: int = Query(1, ge=1, description="Sayfa numarası"),
    page_size: int = Query(50, ge=1, le=500, description="Sayfa başına kayıt"),
    entry_type: Optional[str] = Query(None, description="Giriş tipi (GIRIS/CIKIS)"),
    work_order_id: Optional[int] = Query(None, description="İş emri ID filtresi"),
    is_approved: Optional[bool] = Query(None, description="Onay durumu"),
    is_exception: Optional[bool] = Query(None, description="İstisna durumu"),
    date_from: Optional[date] = Query(None, description="Başlangıç tarihi"),
    date_to: Optional[date] = Query(None, description="Bitiş tarihi"),
    db: Session = Depends(get_db)
):
    """Kapı giriş/çıkış kayıtlarını listele"""
    query = db.query(GateLog)
    
    if entry_type:
        query = query.filter(GateLog.entry_type == entry_type)
    if work_order_id:
        query = query.filter(GateLog.work_order_id == work_order_id)
    if is_approved is not None:
        query = query.filter(GateLog.is_approved == is_approved)
    if is_exception is not None:
        query = query.filter(GateLog.is_exception == is_exception)
    if date_from:
        query = query.filter(GateLog.gate_time >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.filter(GateLog.gate_time <= datetime.combine(date_to, datetime.max.time()))
    
    # Total count
    total = query.count()
    
    # Sıralama ve pagination
    gate_logs = query.order_by(GateLog.gate_time.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    # Serialize
    items = [GateLogResponse.model_validate(log) for log in gate_logs]
    
    return paginated_response(
        items=items,
        page=page,
        page_size=page_size,
        total=total
    )


@router.get("/stats")
def get_gate_stats(
    date_from: Optional[date] = Query(None, description="Başlangıç tarihi"),
    date_to: Optional[date] = Query(None, description="Bitiş tarihi"),
    db: Session = Depends(get_db)
):
    """Güvenlik istatistikleri"""
    query = db.query(GateLog)
    
    if date_from:
        query = query.filter(GateLog.gate_time >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.filter(GateLog.gate_time <= datetime.combine(date_to, datetime.max.time()))
    
    logs = query.all()
    
    total_entries = len([l for l in logs if l.entry_type == "GIRIS"])
    total_exits = len([l for l in logs if l.entry_type == "CIKIS"])
    approved_count = len([l for l in logs if l.is_approved])
    rejected_count = len([l for l in logs if not l.is_approved])
    exception_count = len([l for l in logs if l.is_exception])
    
    # İş emri durumuna göre
    by_wo_status = {}
    for log in logs:
        status = log.wo_status
        if status not in by_wo_status:
            by_wo_status[status] = 0
        by_wo_status[status] += 1
    
    # Son 10 kayıt
    recent_query = db.query(GateLog).order_by(GateLog.gate_time.desc()).limit(10)
    if date_from:
        recent_query = recent_query.filter(GateLog.gate_time >= datetime.combine(date_from, datetime.min.time()))
    recent_logs = recent_query.all()
    
    stats_data = GateStats(
        total_entries=total_entries,
        total_exits=total_exits,
        approved_count=approved_count,
        rejected_count=rejected_count,
        exception_count=exception_count,
        by_wo_status=by_wo_status,
        recent_logs=[GateLogResponse.model_validate(l) for l in recent_logs]
    )
    
    return success_response(data=stats_data, message="Güvenlik istatistikleri")


@router.get("/{log_id}")
def get_gate_log(log_id: int, db: Session = Depends(get_db)):
    """Tekil GateLog kaydı getir"""
    log = db.query(GateLog).filter(GateLog.id == log_id).first()
    if not log:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.GATELOG_NOT_FOUND),
            detail=error_response(
                error_code=ErrorCode.GATELOG_NOT_FOUND,
                message="GateLog bulunamadı",
                details={"log_id": log_id}
            )
        )
    
    log_data = GateLogResponse.model_validate(log)
    return success_response(data=log_data, message="GateLog detayı")


@router.post("/", status_code=201)
def create_gate_log(log_data: GateLogCreate, db: Session = Depends(get_db)):
    """Yeni kapı giriş/çıkış kaydı oluştur"""
    new_log = GateLog(**log_data.model_dump())
    
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    
    log_response = GateLogResponse.model_validate(new_log)
    return success_response(data=log_response, message="GateLog oluşturuldu")


@router.post("/exception", status_code=201)
def create_gate_log_with_exception(log_data: GateLogCreateWithException, db: Session = Depends(get_db)):
    """İstisna ile kapı giriş/çıkış kaydı oluştur"""
    # PIN'i hash'le (güvenlik için)
    hashed_pin = hashlib.sha256(log_data.exception_pin.encode()).hexdigest()[:10]
    
    log_dict = log_data.model_dump()
    log_dict["exception_pin"] = hashed_pin  # Hash'lenmiş PIN kaydet
    
    new_log = GateLog(**log_dict)
    
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    
    log_response = GateLogResponse.model_validate(new_log)
    return success_response(data=log_response, message="İstisna ile GateLog oluşturuldu")


@router.delete("/{log_id}")
def delete_gate_log(log_id: int, db: Session = Depends(get_db)):
    """GateLog kaydını sil"""
    log = db.query(GateLog).filter(GateLog.id == log_id).first()
    if not log:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.GATELOG_NOT_FOUND),
            detail=error_response(
                error_code=ErrorCode.GATELOG_NOT_FOUND,
                message="GateLog bulunamadı",
                details={"log_id": log_id}
            )
        )
    
    db.delete(log)
    db.commit()
    
    return success_response(data=None, message="GateLog silindi")


# ============================================
# CHECKLIST ENDPOINTS
# ============================================

@router.get("/checklist/items")
def get_checklist_items(
    wo_type: Optional[str] = Query(None, description="İş emri tipi filtresi"),
    is_active: Optional[bool] = Query(None, description="Aktif durum filtresi"),
    db: Session = Depends(get_db)
):
    """Checklist itemlarını listele"""
    query = db.query(GateChecklistItem)
    
    if wo_type:
        query = query.filter(GateChecklistItem.wo_type == wo_type)
    if is_active is not None:
        query = query.filter(GateChecklistItem.is_active == is_active)
    
    items = query.order_by(GateChecklistItem.wo_type, GateChecklistItem.display_order).all()
    
    items_data = [GateChecklistItemResponse.model_validate(item) for item in items]
    return success_response(data=items_data, message="Checklist itemları")


@router.post("/checklist/items", status_code=201)
def create_checklist_item(item_data: GateChecklistItemCreate, db: Session = Depends(get_db)):
    """Yeni checklist item oluştur"""
    new_item = GateChecklistItem(**item_data.model_dump())
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    item_response = GateChecklistItemResponse.model_validate(new_item)
    return success_response(data=item_response, message="Checklist item oluşturuldu")


@router.put("/checklist/items/{item_id}")
def update_checklist_item(
    item_id: int,
    item_data: GateChecklistItemUpdate,
    db: Session = Depends(get_db)
):
    """Checklist item güncelle"""
    item = db.query(GateChecklistItem).filter(GateChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.NOT_FOUND),
            detail=error_response(
                error_code=ErrorCode.NOT_FOUND,
                message="Checklist item bulunamadı",
                details={"item_id": item_id}
            )
        )
    
    update_data = item_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    
    item_response = GateChecklistItemResponse.model_validate(item)
    return success_response(data=item_response, message="Checklist item güncellendi")


@router.delete("/checklist/items/{item_id}")
def delete_checklist_item(item_id: int, db: Session = Depends(get_db)):
    """Checklist item sil"""
    item = db.query(GateChecklistItem).filter(GateChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.NOT_FOUND),
            detail=error_response(
                error_code=ErrorCode.NOT_FOUND,
                message="Checklist item bulunamadı",
                details={"item_id": item_id}
            )
        )
    
    db.delete(item)
    db.commit()
    
    return success_response(data=None, message="Checklist item silindi")


@router.post("/checklist/seed")
def seed_default_checklist(db: Session = Depends(get_db)):
    """Varsayılan checklist itemlarını oluştur"""
    default_items = [
        # HIZMET
        {"wo_type": "HIZMET", "item_label": "İş Emri Belgesi", "is_required": True, "display_order": 1},
        {"wo_type": "HIZMET", "item_label": "Motorbot Ruhsatı", "is_required": True, "display_order": 2},
        {"wo_type": "HIZMET", "item_label": "Sigorta Poliçesi", "is_required": True, "display_order": 3},
        {"wo_type": "HIZMET", "item_label": "Yetkili İmzası", "is_required": True, "display_order": 4},
        {"wo_type": "HIZMET", "item_label": "Malzeme Listesi", "is_required": False, "display_order": 5},
        # MOTORBOT
        {"wo_type": "MOTORBOT", "item_label": "İş Emri Belgesi", "is_required": True, "display_order": 1},
        {"wo_type": "MOTORBOT", "item_label": "Motorbot Belgesi", "is_required": True, "display_order": 2},
        {"wo_type": "MOTORBOT", "item_label": "Sertifika", "is_required": True, "display_order": 3},
        {"wo_type": "MOTORBOT", "item_label": "Yetkili İmzası", "is_required": True, "display_order": 4},
        # BARINMA
        {"wo_type": "BARINMA", "item_label": "İş Emri Belgesi", "is_required": True, "display_order": 1},
        {"wo_type": "BARINMA", "item_label": "Barınma Kontratı", "is_required": True, "display_order": 2},
        {"wo_type": "BARINMA", "item_label": "Motorbot Ruhsatı", "is_required": True, "display_order": 3},
        {"wo_type": "BARINMA", "item_label": "Sigorta Belgesi", "is_required": True, "display_order": 4},
    ]
    
    created_count = 0
    for item_data in default_items:
        # Aynı item zaten var mı kontrol et
        existing = db.query(GateChecklistItem).filter(
            GateChecklistItem.wo_type == item_data["wo_type"],
            GateChecklistItem.item_label == item_data["item_label"]
        ).first()
        
        if not existing:
            new_item = GateChecklistItem(**item_data)
            db.add(new_item)
            created_count += 1
    
    db.commit()
    
    return success_response(
        data={"created_count": created_count},
        message=f"{created_count} checklist item oluşturuldu"
    )
