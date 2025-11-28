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
    GateStats,
    VehicleEntryRequest, VehicleExitRequest, VehicleExitResponse,
    PersonIdentityUploadRequest, SecurityApprovalBulkRequest
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
        data=items,
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
                code=ErrorCode.GATELOG_NOT_FOUND,
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
                code=ErrorCode.GATELOG_NOT_FOUND,
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
                code=ErrorCode.NOT_FOUND,
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
                code=ErrorCode.NOT_FOUND,
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


# ============================================
# YENİ: ARAÇ GİRİŞ/ÇIKIŞ ENDPOINTS (4 Saat Kuralı)
# ============================================

@router.post("/vehicle/entry", status_code=201)
def vehicle_entry(entry_data: VehicleEntryRequest, db: Session = Depends(get_db)):
    """
    Araç giriş kaydı oluştur
    4 saat kuralı için entry_time kaydedilir
    """
    from ..isemri.models import WorkOrder
    
    # İş emri kontrolü
    work_order = db.query(WorkOrder).filter(WorkOrder.id == entry_data.work_order_id).first()
    if not work_order:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.WO_NOT_FOUND,
                message="İş emri bulunamadı",
                details={"work_order_id": entry_data.work_order_id}
            )
        )
    
    # GateLog kaydı oluştur
    new_log = GateLog(
        work_order_id=entry_data.work_order_id,
        work_order_person_id=entry_data.work_order_person_id,
        wo_number=entry_data.wo_number,
        wo_status="ONAYLANDI",
        entry_type="GIRIS",
        security_personnel=entry_data.security_personnel,
        is_approved=True,
        vehicle_plate=entry_data.vehicle_plate,
        vehicle_type=entry_data.vehicle_type,
        driver_name=entry_data.driver_name,
        entry_time=entry_data.entry_time,
        identity_documents_uploaded=entry_data.identity_documents_uploaded,
        identity_document_count=entry_data.identity_document_count,
        notes=entry_data.notes
    )
    
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    
    log_response = GateLogResponse.model_validate(new_log)
    return success_response(data=log_response, message="Araç giriş kaydı oluşturuldu")


@router.post("/vehicle/exit")
def vehicle_exit(exit_data: VehicleExitRequest, db: Session = Depends(get_db)):
    """
    Araç çıkış kaydı ve 4 saat kuralı hesaplaması
    
    4 Saat Kuralı:
    - İlk 4 saat: Kesin ücret (base_charge)
    - 4 saatten sonra: Dakika başı ek ücret
    """
    # Giriş kaydını bul
    entry_log = db.query(GateLog).filter(
        GateLog.id == exit_data.gate_log_id,
        GateLog.entry_type == "GIRIS"
    ).first()
    
    if not entry_log:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.GATELOG_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.GATELOG_NOT_FOUND,
                message="Giriş kaydı bulunamadı",
                details={"gate_log_id": exit_data.gate_log_id}
            )
        )
    
    if entry_log.exit_time:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.GATELOG_ALREADY_EXITED),
            detail=error_response(
                code=ErrorCode.GATELOG_ALREADY_EXITED,
                message="Bu araç zaten çıkış yapmış",
                details={"gate_log_id": exit_data.gate_log_id}
            )
        )
    
    # Çıkış zamanını kaydet
    entry_log.exit_time = exit_data.exit_time
    
    # Süre hesapla (dakika)
    if entry_log.entry_time:
        delta = exit_data.exit_time - entry_log.entry_time
        duration_minutes = int(delta.total_seconds() / 60)
        entry_log.duration_minutes = duration_minutes
        
        # 4 saat kuralı hesaplaması
        base_minutes = entry_log.base_charge_hours * 60
        extra_minutes = max(0, duration_minutes - base_minutes)
        entry_log.extra_minutes = extra_minutes
        
        # Ek ücret hesaplanacaksa (fiyat motoru ile hesaplanmalı - şimdilik sadece flag)
        needs_extra_charge = extra_minutes > 0
        
        if exit_data.notes:
            entry_log.notes = (entry_log.notes or "") + f"\n[Çıkış] {exit_data.notes}"
    
    db.commit()
    db.refresh(entry_log)
    
    # Response oluştur
    response = VehicleExitResponse(
        gate_log_id=entry_log.id,
        vehicle_plate=entry_log.vehicle_plate,
        entry_time=entry_log.entry_time,
        exit_time=entry_log.exit_time,
        duration_minutes=entry_log.duration_minutes or 0,
        base_charge_hours=entry_log.base_charge_hours,
        extra_minutes=entry_log.extra_minutes,
        needs_extra_charge=needs_extra_charge,
        extra_charge_amount=float(entry_log.extra_charge_calculated) if entry_log.extra_charge_calculated else None,
        message=f"Araç çıkış kaydı tamamlandı. Kalış süresi: {entry_log.duration_minutes} dakika"
    )
    
    return success_response(data=response, message="Araç çıkış işlemi tamamlandı")


@router.get("/vehicle/active")
def get_active_vehicles(
    page: int = Query(1, ge=1, description="Sayfa numarası"),
    page_size: int = Query(50, ge=1, le=500, description="Sayfa başına kayıt"),
    db: Session = Depends(get_db)
):
    """
    Aktif araçlar (henüz çıkış yapmamış)
    """
    query = db.query(GateLog).filter(
        GateLog.entry_type == "GIRIS",
        GateLog.vehicle_plate.isnot(None),
        GateLog.exit_time.is_(None)
    )
    
    total = query.count()
    
    active_vehicles = query.order_by(GateLog.entry_time.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    items = [GateLogResponse.model_validate(v) for v in active_vehicles]
    
    return paginated_response(
        data=items,
        page=page,
        page_size=page_size,
        total=total,
        message=f"{total} araç halen limanda"
    )


# ============================================
# YENİ: WORKORDERPERSON GÜVENLIK ENTEGRASYONU
# ============================================

@router.get("/pending-persons")
def get_pending_security_persons(
    page: int = Query(1, ge=1, description="Sayfa numarası"),
    page_size: int = Query(50, ge=1, le=500, description="Sayfa başına kayıt"),
    db: Session = Depends(get_db)
):
    """
    Güvenlik onayı bekleyen kişiler
    """
    from ..isemri.models import WorkOrderPerson
    
    query = db.query(WorkOrderPerson).filter(
        WorkOrderPerson.approved_by_security == False
    )
    
    total = query.count()
    
    persons = query.order_by(WorkOrderPerson.created_at.asc()).offset((page - 1) * page_size).limit(page_size).all()
    
    # Serialize (WorkOrderPersonResponse import edilmeli)
    from ..isemri.schemas import WorkOrderPersonResponse
    items = [WorkOrderPersonResponse.model_validate(p) for p in persons]
    
    return paginated_response(
        data=items,
        page=page,
        page_size=page_size,
        total=total,
        message=f"{total} kişi güvenlik onayı bekliyor"
    )


@router.post("/person/identity-upload")
def upload_person_identity(upload_data: PersonIdentityUploadRequest, db: Session = Depends(get_db)):
    """
    Kişi kimlik belgesi fotoğrafı yükleme kaydı
    """
    from ..isemri.models import WorkOrderPerson
    
    person = db.query(WorkOrderPerson).filter(
        WorkOrderPerson.id == upload_data.work_order_person_id
    ).first()
    
    if not person:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_PERSON_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.WO_PERSON_NOT_FOUND,
                message="Kişi bulunamadı",
                details={"work_order_person_id": upload_data.work_order_person_id}
            )
        )
    
    # Kimlik belgesi ID'sini kaydet
    person.identity_document_id = upload_data.identity_document_id
    
    if upload_data.notes:
        person.security_notes = (person.security_notes or "") + f"\n[Kimlik] {upload_data.notes}"
    
    person.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(person)
    
    from ..isemri.schemas import WorkOrderPersonResponse
    person_data = WorkOrderPersonResponse.model_validate(person)
    
    return success_response(data=person_data, message="Kimlik belgesi kaydedildi")


@router.post("/person/bulk-approval")
def bulk_security_approval(bulk_data: SecurityApprovalBulkRequest, db: Session = Depends(get_db)):
    """
    Toplu güvenlik onayı
    """
    from ..isemri.models import WorkOrderPerson
    
    persons = db.query(WorkOrderPerson).filter(
        WorkOrderPerson.id.in_(bulk_data.person_ids)
    ).all()
    
    if len(persons) != len(bulk_data.person_ids):
        raise HTTPException(
            status_code=400,
            detail=error_response(
                code=ErrorCode.VALIDATION_ERROR,
                message="Bazı kişiler bulunamadı",
                details={"requested": len(bulk_data.person_ids), "found": len(persons)}
            )
        )
    
    updated_count = 0
    for person in persons:
        person.approved_by_security = bulk_data.approved
        person.approved_by_security_user_id = bulk_data.security_user_id
        person.approved_at = datetime.utcnow() if bulk_data.approved else None
        
        if bulk_data.gate_entry_time:
            person.gate_entry_time = bulk_data.gate_entry_time
        
        if bulk_data.notes:
            person.security_notes = (person.security_notes or "") + f"\n[Toplu Onay] {bulk_data.notes}"
        
        person.updated_at = datetime.utcnow()
        updated_count += 1
    
    db.commit()
    
    return success_response(
        data={"updated_count": updated_count, "person_ids": bulk_data.person_ids},
        message=f"{updated_count} kişi için güvenlik onayı güncellendi"
    )
