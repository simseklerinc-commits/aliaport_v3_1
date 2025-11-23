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

@router.get("/", response_model=List[GateLogResponse])
def get_gate_logs(
    skip: int = 0,
    limit: int = 100,
    entry_type: Optional[str] = None,
    work_order_id: Optional[int] = None,
    is_approved: Optional[bool] = None,
    is_exception: Optional[bool] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
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
    
    query = query.order_by(GateLog.gate_time.desc())
    return query.offset(skip).limit(limit).all()


@router.get("/stats", response_model=GateStats)
def get_gate_stats(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
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
    
    return {
        "total_entries": total_entries,
        "total_exits": total_exits,
        "approved_count": approved_count,
        "rejected_count": rejected_count,
        "exception_count": exception_count,
        "by_wo_status": by_wo_status,
        "recent_logs": recent_logs
    }


@router.get("/{log_id}", response_model=GateLogResponse)
def get_gate_log(log_id: int, db: Session = Depends(get_db)):
    """Tekil GateLog kaydı getir"""
    log = db.query(GateLog).filter(GateLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="GateLog bulunamadı")
    return log


@router.post("/", response_model=GateLogResponse)
def create_gate_log(log_data: GateLogCreate, db: Session = Depends(get_db)):
    """Yeni kapı giriş/çıkış kaydı oluştur"""
    new_log = GateLog(**log_data.model_dump())
    
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log


@router.post("/exception", response_model=GateLogResponse)
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
    return new_log


@router.delete("/{log_id}")
def delete_gate_log(log_id: int, db: Session = Depends(get_db)):
    """GateLog kaydını sil"""
    log = db.query(GateLog).filter(GateLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="GateLog bulunamadı")
    
    db.delete(log)
    db.commit()
    return {"message": "GateLog silindi", "id": log_id}


# ============================================
# CHECKLIST ENDPOINTS
# ============================================

@router.get("/checklist/items", response_model=List[GateChecklistItemResponse])
def get_checklist_items(
    wo_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Checklist itemlarını listele"""
    query = db.query(GateChecklistItem)
    
    if wo_type:
        query = query.filter(GateChecklistItem.wo_type == wo_type)
    if is_active is not None:
        query = query.filter(GateChecklistItem.is_active == is_active)
    
    query = query.order_by(GateChecklistItem.wo_type, GateChecklistItem.display_order)
    return query.all()


@router.post("/checklist/items", response_model=GateChecklistItemResponse)
def create_checklist_item(item_data: GateChecklistItemCreate, db: Session = Depends(get_db)):
    """Yeni checklist item oluştur"""
    new_item = GateChecklistItem(**item_data.model_dump())
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.put("/checklist/items/{item_id}", response_model=GateChecklistItemResponse)
def update_checklist_item(
    item_id: int,
    item_data: GateChecklistItemUpdate,
    db: Session = Depends(get_db)
):
    """Checklist item güncelle"""
    item = db.query(GateChecklistItem).filter(GateChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item bulunamadı")
    
    update_data = item_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return item


@router.delete("/checklist/items/{item_id}")
def delete_checklist_item(item_id: int, db: Session = Depends(get_db)):
    """Checklist item sil"""
    item = db.query(GateChecklistItem).filter(GateChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item bulunamadı")
    
    db.delete(item)
    db.commit()
    return {"message": "Checklist item silindi", "id": item_id}


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
    return {"message": f"{created_count} checklist item oluşturuldu"}
