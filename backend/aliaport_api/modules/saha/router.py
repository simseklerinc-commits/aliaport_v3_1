"""
SAHA PERSONEL MODÜLÜ - Router
WorkLog API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date

from ...config.database import get_db
from ...core.responses import success_response, error_response, paginated_response
from ...core.error_codes import ErrorCode, get_http_status_for_error
from .models import WorkLog
from .schemas import WorkLogCreate, WorkLogUpdate, WorkLogResponse, WorkLogStats

router = APIRouter(prefix="/api/worklog", tags=["Saha Personeli"])


@router.get("/")
def get_worklogs(
    page: int = Query(1, ge=1, description="Sayfa numarası"),
    page_size: int = Query(50, ge=1, le=500, description="Sayfa başına kayıt"),
    work_order_id: Optional[int] = Query(None, description="İş emri ID filtresi"),
    sefer_id: Optional[int] = Query(None, description="Sefer ID filtresi"),
    personnel_name: Optional[str] = Query(None, description="Personel adı araması"),
    is_approved: Optional[int] = Query(None, description="Onay durumu (0/1)"),
    date_from: Optional[date] = Query(None, description="Başlangıç tarihi"),
    date_to: Optional[date] = Query(None, description="Bitiş tarihi"),
    db: Session = Depends(get_db)
):
    """WorkLog kayıtlarını listele (filtreleme ile)"""
    query = db.query(WorkLog)
    
    if work_order_id:
        query = query.filter(WorkLog.work_order_id == work_order_id)
    if sefer_id:
        query = query.filter(WorkLog.sefer_id == sefer_id)
    if personnel_name:
        query = query.filter(WorkLog.personnel_name.ilike(f"%{personnel_name}%"))
    if is_approved is not None:
        query = query.filter(WorkLog.is_approved == is_approved)
    if date_from:
        query = query.filter(WorkLog.time_start >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.filter(WorkLog.time_start <= datetime.combine(date_to, datetime.max.time()))
    
    # Total count
    total = query.count()
    
    # Sıralama ve pagination
    worklogs = query.order_by(WorkLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    # Serialize
    items = [WorkLogResponse.model_validate(log) for log in worklogs]
    
    return paginated_response(
        items=items,
        page=page,
        page_size=page_size,
        total=total
    )


@router.get("/stats")
def get_worklog_stats(
    date_from: Optional[date] = Query(None, description="Başlangıç tarihi"),
    date_to: Optional[date] = Query(None, description="Bitiş tarihi"),
    db: Session = Depends(get_db)
):
    """WorkLog istatistikleri"""
    query = db.query(WorkLog)
    
    if date_from:
        query = query.filter(WorkLog.time_start >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.filter(WorkLog.time_start <= datetime.combine(date_to, datetime.max.time()))
    
    logs = query.all()
    
    # İstatistikleri hesapla
    total_logs = len(logs)
    pending_approval = len([l for l in logs if l.is_approved == 0])
    approved = len([l for l in logs if l.is_approved == 1])
    
    total_minutes = sum([l.duration_minutes or 0 for l in logs])
    total_hours = round(total_minutes / 60, 2)
    
    # Personel bazında
    by_personnel = {}
    for log in logs:
        name = log.personnel_name
        if name not in by_personnel:
            by_personnel[name] = {"count": 0, "hours": 0}
        by_personnel[name]["count"] += 1
        by_personnel[name]["hours"] += round((log.duration_minutes or 0) / 60, 2)
    
    # Hizmet tipi bazında
    by_service_type = {}
    for log in logs:
        stype = log.service_type or "TANIMSIZ"
        if stype not in by_service_type:
            by_service_type[stype] = {"count": 0, "hours": 0}
        by_service_type[stype]["count"] += 1
        by_service_type[stype]["hours"] += round((log.duration_minutes or 0) / 60, 2)
    
    stats_data = WorkLogStats(
        total_logs=total_logs,
        pending_approval=pending_approval,
        approved=approved,
        total_hours=total_hours,
        by_personnel=by_personnel,
        by_service_type=by_service_type
    )
    
    return success_response(data=stats_data, message="WorkLog istatistikleri")


@router.get("/{worklog_id}")
def get_worklog(worklog_id: int, db: Session = Depends(get_db)):
    """Tekil WorkLog kaydı getir"""
    log = db.query(WorkLog).filter(WorkLog.id == worklog_id).first()
    if not log:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WORKLOG_NOT_FOUND),
            detail=error_response(
                error_code=ErrorCode.WORKLOG_NOT_FOUND,
                message="WorkLog bulunamadı",
                details={"worklog_id": worklog_id}
            )
        )
    
    log_data = WorkLogResponse.model_validate(log)
    return success_response(data=log_data, message="WorkLog detayı")


@router.post("/", status_code=201)
def create_worklog(log_data: WorkLogCreate, db: Session = Depends(get_db)):
    """Yeni WorkLog kaydı oluştur"""
    new_log = WorkLog(**log_data.model_dump())
    
    # Süreyi hesapla
    if new_log.time_end:
        new_log.calculate_duration()
    
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    
    log_response = WorkLogResponse.model_validate(new_log)
    return success_response(data=log_response, message="WorkLog oluşturuldu")


@router.put("/{worklog_id}")
def update_worklog(worklog_id: int, log_data: WorkLogUpdate, db: Session = Depends(get_db)):
    """WorkLog kaydını güncelle"""
    log = db.query(WorkLog).filter(WorkLog.id == worklog_id).first()
    if not log:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WORKLOG_NOT_FOUND),
            detail=error_response(
                error_code=ErrorCode.WORKLOG_NOT_FOUND,
                message="WorkLog bulunamadı",
                details={"worklog_id": worklog_id}
            )
        )
    
    # Sadece None olmayan alanları güncelle
    update_data = log_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(log, key, value)
    
    # Onay işlemi yapılıyorsa zaman damgası ekle
    if log_data.is_approved == 1 and log.approved_at is None:
        log.approved_at = datetime.utcnow()
    
    # Süreyi yeniden hesapla
    if log.time_end:
        log.calculate_duration()
    
    log.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(log)
    
    log_response = WorkLogResponse.model_validate(log)
    return success_response(data=log_response, message="WorkLog güncellendi")


@router.delete("/{worklog_id}")
def delete_worklog(worklog_id: int, db: Session = Depends(get_db)):
    """WorkLog kaydını sil"""
    log = db.query(WorkLog).filter(WorkLog.id == worklog_id).first()
    if not log:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WORKLOG_NOT_FOUND),
            detail=error_response(
                error_code=ErrorCode.WORKLOG_NOT_FOUND,
                message="WorkLog bulunamadı",
                details={"worklog_id": worklog_id}
            )
        )
    
    db.delete(log)
    db.commit()
    
    return success_response(data=None, message="WorkLog silindi")


@router.post("/{worklog_id}/approve")
def approve_worklog(
    worklog_id: int,
    approved_by: str = Query(..., description="Onaylayan kişi"),
    db: Session = Depends(get_db)
):
    """WorkLog kaydını onayla"""
    log = db.query(WorkLog).filter(WorkLog.id == worklog_id).first()
    if not log:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WORKLOG_NOT_FOUND),
            detail=error_response(
                error_code=ErrorCode.WORKLOG_NOT_FOUND,
                message="WorkLog bulunamadı",
                details={"worklog_id": worklog_id}
            )
        )
    
    log.is_approved = 1
    log.approved_by = approved_by
    log.approved_at = datetime.utcnow()
    log.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(log)
    
    log_response = WorkLogResponse.model_validate(log)
    return success_response(data=log_response, message="WorkLog onaylandı")
