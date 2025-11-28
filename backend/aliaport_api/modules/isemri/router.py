"""
İŞ EMRİ MODÜLÜ - FastAPI Router
WorkOrder ve WorkOrderItem CRUD endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload, joinedload
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
import uuid

from ...config.database import get_db
from ...core.responses import success_response, error_response, paginated_response
from ...core.error_codes import ErrorCode, get_http_status_for_error
from . import models as models_isemri, schemas as schemas_isemri
from ..hizmet.models import Hizmet
from ..hizmet.pricing_engine import PricingEngine
from ..sgk.models import SgkPeriodCheck
from ..dijital_arsiv.models import PortalEmployee


router = APIRouter()


# ============================================
# HELPER FUNCTIONS
# ============================================

def generate_wo_number() -> str:
    """İş emri numarası oluştur (WO + YYYYMM + UUID ilk 8 karakter)"""
    timestamp = datetime.now().strftime("%Y%m")
    unique_id = str(uuid.uuid4()).replace('-', '').upper()[:8]
    return f"WO{timestamp}{unique_id}"


def _calculate_reference_date(work_order: schemas_isemri.WorkOrderCreate) -> datetime:
    """Referans tarihi (planlanan başlangıç varsa onu, yoksa sistem tarihini) döndür."""
    return work_order.PlannedStart or datetime.utcnow()


def _determine_target_period(reference_date: datetime) -> tuple[str, str]:
    """Bir önceki aya ait SGK dönemini (YYYYMM) ve okunabilir formatını hesapla."""
    year = reference_date.year
    month = reference_date.month - 1
    if month == 0:
        month = 12
        year -= 1
    normalized = f"{year}{month:02d}"
    readable = f"{year}-{month:02d}"
    return normalized, readable


def ensure_sgk_compliance_for_firma_and_period(
    work_order: schemas_isemri.WorkOrderCreate,
    db: Session = Depends(get_db)
) -> schemas_isemri.WorkOrderCreate:
    """İş emri oluşturulmadan önce SGK dönem kayıtlarını zorunlu kılan guard."""
    reference_date = _calculate_reference_date(work_order)
    target_period, readable_period = _determine_target_period(reference_date)

    sgk_period_exists = (
        db.query(SgkPeriodCheck.id)
        .filter(
            SgkPeriodCheck.firma_id == work_order.CariId,
            SgkPeriodCheck.period == target_period,
            SgkPeriodCheck.status == "OK"
        )
        .first()
    )

    if not sgk_period_exists:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.INVALID_INPUT),
            detail=error_response(
                code=ErrorCode.INVALID_INPUT,
                message=(
                    f"Bu firma için {readable_period} dönemine ait SGK hizmet listesi sisteme yüklenmemiş. "
                    f"Önce ilgili dönemin SGK hizmet listesini yükleyin."
                ),
                details={"cari_id": work_order.CariId, "period": target_period}
            )
        )

    employee_ids = work_order.EmployeeIds or []
    if employee_ids:
        employees = (
            db.query(PortalEmployee)
            .filter(PortalEmployee.id.in_(employee_ids))
            .all()
        )
        employee_map = {employee.id: employee for employee in employees}
        invalid_employee_ids = []

        for employee_id in employee_ids:
            employee = employee_map.get(employee_id)
            if not employee or employee.cari_id != work_order.CariId:
                invalid_employee_ids.append(employee_id)
                continue
            if employee.sgk_last_check_period != target_period or not employee.sgk_is_active_last_period:
                invalid_employee_ids.append(employee_id)

        if invalid_employee_ids:
            raise HTTPException(
                status_code=get_http_status_for_error(ErrorCode.INVALID_INPUT),
                detail=error_response(
                    code=ErrorCode.INVALID_INPUT,
                    message=(
                        f"Seçilen çalışanlardan bazıları için {readable_period} dönemine ait SGK kaydı bulunmamaktadır."
                    ),
                    details={"invalid_employee_ids": invalid_employee_ids, "period": target_period}
                )
            )

    return work_order


# ============================================
# WORK ORDER ENDPOINTS
# ============================================

@router.get("/work-order")
def get_work_orders(
    page: int = Query(1, ge=1, description="Sayfa numarası"),
    page_size: int = Query(50, ge=1, le=500, description="Sayfa başına kayıt"),
    search: Optional[str] = Query(None, description="İş emri no, konu veya açıklama araması"),
    cari_code: Optional[str] = Query(None, description="Cari kodu filtresi"),
    status: Optional[schemas_isemri.WorkOrderStatus] = Query(None, description="Durum filtresi"),
    type: Optional[schemas_isemri.WorkOrderType] = Query(None, description="Tip filtresi"),
    priority: Optional[schemas_isemri.WorkOrderPriority] = Query(None, description="Öncelik filtresi"),
    db: Session = Depends(get_db)
):
    """
    İş emirlerini listele (filtreleme ve pagination)
    """
    # Eager loading ile N+1 problem çözümü (1 main query + 1 batch IN query)
    query = db.query(models_isemri.WorkOrder).options(
        selectinload(models_isemri.WorkOrder.items)
    ).filter(models_isemri.WorkOrder.is_active == True)
    
    # Filtreleme
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models_isemri.WorkOrder.wo_number.ilike(search_filter)) |
            (models_isemri.WorkOrder.subject.ilike(search_filter)) |
            (models_isemri.WorkOrder.description.ilike(search_filter))
        )
    
    if cari_code:
        query = query.filter(models_isemri.WorkOrder.cari_code == cari_code)
    
    if status:
        query = query.filter(models_isemri.WorkOrder.status == status)
    
    if type:
        query = query.filter(models_isemri.WorkOrder.type == type)
    
    if priority:
        query = query.filter(models_isemri.WorkOrder.priority == priority)
    
    # Total count
    total = query.count()
    
    # Sıralama ve pagination
    work_orders = query.order_by(models_isemri.WorkOrder.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    # Serialize
    items = [schemas_isemri.WorkOrderResponse.model_validate(wo) for wo in work_orders]
    
    return paginated_response(
        data=items,
        page=page,
        page_size=page_size,
        total=total
    )


@router.get("/work-order/stats")
def get_work_order_stats(
    date_from: Optional[str] = Query(None, description="Başlangıç tarihi (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Bitiş tarihi (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    İş emri istatistikleri - RUNBOOK UYUMLU
    Stats kartları: Onay Bekleyen, Eksik Belgeler, Aktif, Bugün Biten
    """
    from datetime import date, timedelta
    query = db.query(models_isemri.WorkOrder).filter(models_isemri.WorkOrder.is_active == True)
    
    if date_from:
        query = query.filter(models_isemri.WorkOrder.created_at >= date_from)
    if date_to:
        query = query.filter(models_isemri.WorkOrder.created_at <= date_to)
    
    all_orders = query.all()
    
    # Durum bazında
    by_status = {}
    for status in schemas_isemri.WorkOrderStatus:
        count = sum(1 for wo in all_orders if wo.status == status)
        by_status[status.value] = count
    
    # Öncelik bazında
    by_priority = {}
    for priority in schemas_isemri.WorkOrderPriority:
        count = sum(1 for wo in all_orders if wo.priority == priority)
        by_priority[priority.value] = count
    
    # Tip bazında
    by_type = {}
    for wo_type in schemas_isemri.WorkOrderType:
        count = sum(1 for wo in all_orders if wo.type == wo_type)
        by_type[wo_type.value] = count
    
    # RUNBOOK KARTLARı HESAPLAMA
    # 1. Onay Bekleyen (SUBMITTED)
    pending_approval = sum(1 for wo in all_orders if wo.status == models_isemri.WorkOrderStatus.SUBMITTED)
    
    # 2. Eksik Belgeler (MissingDocuments)
    # TODO: ArchiveDocument entegrasyonu ile gerçek sayı hesaplanacak
    # Şimdilik PENDING_APPROVAL statusundekiler eksik belge olarak sayılıyor
    missing_documents = sum(1 for wo in all_orders if wo.status == models_isemri.WorkOrderStatus.PENDING_APPROVAL)
    
    # 3. Aktif (SAHADA, IN_PROGRESS)
    active = sum(1 for wo in all_orders if wo.status in [
        models_isemri.WorkOrderStatus.SAHADA,
        models_isemri.WorkOrderStatus.IN_PROGRESS,
        models_isemri.WorkOrderStatus.APPROVED  # Onaylandı ama henüz başlamadı
    ])
    
    # 4. Bugün Biten (PlannedEnd bugün)
    today = date.today()
    due_today = sum(1 for wo in all_orders if wo.planned_end and wo.planned_end.date() == today)
    
    stats = {
        "Total": len(all_orders),
        "ByStatus": by_status,
        "ByPriority": by_priority,
        "ByType": by_type,
        "MissingDocuments": missing_documents,
        "Active": active,
        "DueToday": due_today
    }
    
    stats_obj = schemas_isemri.WorkOrderStats.model_validate(stats)
    return success_response(data=stats_obj, message="İş emri istatistikleri")


@router.get("/work-order/pending-approval")
def get_pending_approval_work_orders(
    page: int = Query(1, ge=1, description="Sayfa numarası"),
    page_size: int = Query(50, ge=1, le=500, description="Sayfa başına kayıt"),
    db: Session = Depends(get_db)
):
    """
    Onay bekleyen iş emirleri (PENDING_APPROVAL veya SUBMITTED durumunda)
    Dijital Arşiv modülü için - belge yüklendi ama henüz onaylanmadı
    """
    query = db.query(models_isemri.WorkOrder).options(
        selectinload(models_isemri.WorkOrder.items)
    ).filter(
        models_isemri.WorkOrder.is_active == True,
        models_isemri.WorkOrder.status.in_([
            models_isemri.WorkOrderStatus.PENDING_APPROVAL,
            models_isemri.WorkOrderStatus.SUBMITTED
        ])
    )
    
    # Total count
    total = query.count()
    
    # Pagination - en yeni başta
    work_orders = query.order_by(models_isemri.WorkOrder.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    # Serialize
    items = [schemas_isemri.WorkOrderResponse.model_validate(wo) for wo in work_orders]
    
    return paginated_response(
        data=items,
        page=page,
        page_size=page_size,
        total=total,
        message=f"{total} iş emri onay bekliyor"
    )


@router.get("/work-order/{work_order_id}")
def get_work_order(work_order_id: int, db: Session = Depends(get_db)):
    """
    Tek iş emri detayı
    """
    # Eager loading ile N+1 problem çözümü (1 query with JOIN)
    work_order = db.query(models_isemri.WorkOrder).options(
        joinedload(models_isemri.WorkOrder.items)
    ).filter(
        models_isemri.WorkOrder.id == work_order_id,
        models_isemri.WorkOrder.is_active == True
    ).first()
    
    if not work_order:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.WO_NOT_FOUND,
                message="İş emri bulunamadı",
                details={"work_order_id": work_order_id}
            )
        )
    
    wo_data = schemas_isemri.WorkOrderResponse.model_validate(work_order)
    return success_response(data=wo_data, message="İş emri detayı")


@router.get("/work-order/number/{wo_number}")
def get_work_order_by_number(wo_number: str, db: Session = Depends(get_db)):
    """
    İş emri numarası ile getir
    """
    # Eager loading ile N+1 problem çözümü (1 query with JOIN)
    work_order = db.query(models_isemri.WorkOrder).options(
        joinedload(models_isemri.WorkOrder.items)
    ).filter(
        models_isemri.WorkOrder.wo_number == wo_number,
        models_isemri.WorkOrder.is_active == True
    ).first()
    
    if not work_order:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.WO_NOT_FOUND,
                message="İş emri bulunamadı",
                details={"wo_number": wo_number}
            )
        )
    
    wo_data = schemas_isemri.WorkOrderResponse.model_validate(work_order)
    return success_response(data=wo_data, message="İş emri detayı")


@router.get("/work-order/cari/{cari_code}")
def get_work_orders_by_cari(
    cari_code: str,
    status: Optional[schemas_isemri.WorkOrderStatus] = Query(None, description="Durum filtresi"),
    db: Session = Depends(get_db)
):
    """
    Cariye göre iş emirleri
    """
    # Eager loading ile N+1 problem çözümü (1 main query + 1 batch IN query)
    query = db.query(models_isemri.WorkOrder).options(
        selectinload(models_isemri.WorkOrder.items)
    ).filter(
        models_isemri.WorkOrder.cari_code == cari_code,
        models_isemri.WorkOrder.is_active == True
    )
    
    if status:
        query = query.filter(models_isemri.WorkOrder.status == status)
    
    work_orders = query.order_by(models_isemri.WorkOrder.created_at.desc()).all()
    
    items = [schemas_isemri.WorkOrderResponse.model_validate(wo) for wo in work_orders]
    return success_response(data=items, message="Cariye ait iş emirleri")


@router.post("/work-order", status_code=201)
def create_work_order(
    work_order: schemas_isemri.WorkOrderCreate = Depends(ensure_sgk_compliance_for_firma_and_period),
    db: Session = Depends(get_db)
):
    """
    Yeni iş emri oluştur
    """
    # İş emri numarası oluştur
    wo_number = generate_wo_number()
    
    # Schema'dan gelen verileri snake_case'e çevir (alias kullanarak)
    work_order_dict = work_order.model_dump(by_alias=True, exclude_unset=True)
    
    # Alias'ları (cari_id, cari_code, vb.) kullanarak model oluştur
    db_work_order = models_isemri.WorkOrder(
        wo_number=wo_number,
        **work_order_dict
    )
    
    db.add(db_work_order)
    db.commit()
    db.refresh(db_work_order)
    
    wo_data = schemas_isemri.WorkOrderResponse.model_validate(db_work_order)
    return success_response(data=wo_data, message="İş emri oluşturuldu")


@router.put("/work-order/{work_order_id}")
def update_work_order(
    work_order_id: int,
    work_order: schemas_isemri.WorkOrderUpdate,
    db: Session = Depends(get_db)
):
    """
    İş emri güncelle
    """
    db_work_order = db.query(models_isemri.WorkOrder).filter(
        models_isemri.WorkOrder.id == work_order_id,
        models_isemri.WorkOrder.is_active == True
    ).first()
    
    if not db_work_order:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.WO_NOT_FOUND,
                message="İş emri bulunamadı",
                details={"work_order_id": work_order_id}
            )
        )
    
    # Güncelleme
    # Alias'ları kullanarak snake_case alanları elde et
    update_data = work_order.model_dump(by_alias=True, exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_work_order, key, value)
    
    db_work_order.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_work_order)
    
    wo_data = schemas_isemri.WorkOrderResponse.model_validate(db_work_order)
    return success_response(data=wo_data, message="İş emri güncellendi")


@router.delete("/work-order/{work_order_id}")
def delete_work_order(work_order_id: int, db: Session = Depends(get_db)):
    """
    İş emri sil (soft delete)
    """
    db_work_order = db.query(models_isemri.WorkOrder).filter(
        models_isemri.WorkOrder.id == work_order_id,
        models_isemri.WorkOrder.is_active == True
    ).first()
    
    if not db_work_order:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.WO_NOT_FOUND,
                message="İş emri bulunamadı",
                details={"work_order_id": work_order_id}
            )
        )
    
    # Soft delete
    db_work_order.is_active = False
    db_work_order.updated_at = datetime.utcnow()
    
    db.commit()
    
    return success_response(data=None, message="İş emri silindi")


@router.patch("/work-order/{work_order_id}/status")
def change_work_order_status(
    work_order_id: int,
    status_change: schemas_isemri.WorkOrderStatusChange,
    db: Session = Depends(get_db)
):
    """
    İş emri durumunu değiştir
    """
    db_work_order = db.query(models_isemri.WorkOrder).filter(
        models_isemri.WorkOrder.id == work_order_id,
        models_isemri.WorkOrder.is_active == True
    ).first()
    
    if not db_work_order:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.WO_NOT_FOUND,
                message="İş emri bulunamadı",
                details={"work_order_id": work_order_id}
            )
        )
    
    db_work_order.status = status_change.Status
    if status_change.Notes:
        db_work_order.notes = (db_work_order.notes or "") + f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M')}] {status_change.Notes}"
    
    db_work_order.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_work_order)
    
    wo_data = schemas_isemri.WorkOrderResponse.model_validate(db_work_order)
    return success_response(data=wo_data, message="İş emri durumu güncellendi")


@router.get("/work-order/{work_order_id}/calculate-overtime")
def calculate_work_order_overtime(
    work_order_id: int,
    hourly_rate: float = Query(100.0, description="Saat başı ücret (TRY)"),
    auto_create_item: bool = Query(False, description="Otomatik WorkOrderItem oluştur"),
    db: Session = Depends(get_db)
):
    """
    4 Saat Kuralı - Fazla mesai hesaplama
    
    Güvenlik çıkış saati (gate_exit_time) ile fiili iş bitişi (actual_end) arasındaki
    fark 4 saati aşarsa, aşan süre için ek ücret hesaplanır.
    
    Formula: (çıkış_zamanı - iş_bitiş_zamanı - 4 saat) × saat_ücreti
    
    Returns:
        - overtime_minutes: 4 saati aşan dakika
        - overtime_hours: Aşan saat (ondalıklı)
        - overtime_charge: Hesaplanan ek ücret
        - is_overtime: 4 saati aştı mı?
        - work_order_item: (Opsiyonel) Oluşturulan WorkOrderItem
    """
    # İş emrini getir
    work_order = db.query(models_isemri.WorkOrder).filter(
        models_isemri.WorkOrder.id == work_order_id,
        models_isemri.WorkOrder.is_active == True
    ).first()
    
    if not work_order:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.WO_NOT_FOUND,
                message="İş emri bulunamadı",
                details={"work_order_id": work_order_id}
            )
        )
    
    # Güvenlik çıkış saatini bul (GateLog'dan en son çıkış)
    from .models import WorkOrderPerson
    from ..guvenlik.models import GateLog
    
    gate_exit_time = None
    
    # Güvenlik çıkış saatini GateLog'dan al
    latest_gatelog = db.query(GateLog).filter(
        GateLog.work_order_id == work_order_id,
        GateLog.exit_time.isnot(None)
    ).order_by(GateLog.exit_time.desc()).first()
    
    if latest_gatelog:
        gate_exit_time = latest_gatelog.exit_time
    else:
        # WorkOrderPerson'dan en son çıkış
        latest_person_exit = db.query(WorkOrderPerson).filter(
            WorkOrderPerson.work_order_id == work_order_id,
            WorkOrderPerson.gate_exit_time.isnot(None)
        ).order_by(WorkOrderPerson.gate_exit_time.desc()).first()
        
        if latest_person_exit:
            gate_exit_time = latest_person_exit.gate_exit_time
    
    # İş bitiş zamanı
    actual_end = work_order.actual_end
    
    # Validasyon
    if not gate_exit_time:
        return success_response(
            data={
                "is_overtime": False,
                "overtime_minutes": 0,
                "overtime_hours": 0.0,
                "overtime_charge": 0.0,
                "message": "Güvenlik çıkış saati bulunamadı"
            },
            message="4 saat kuralı uygulanamaz - çıkış saati yok"
        )
    
    if not actual_end:
        return success_response(
            data={
                "is_overtime": False,
                "overtime_minutes": 0,
                "overtime_hours": 0.0,
                "overtime_charge": 0.0,
                "message": "İş bitiş saati (actual_end) girilmemiş"
            },
            message="4 saat kuralı uygulanamaz - iş bitiş saati yok"
        )
    
    # Süre farkını hesapla (dakika)
    time_delta = gate_exit_time - actual_end
    total_minutes = int(time_delta.total_seconds() / 60)
    
    # 4 saat = 240 dakika
    BASE_MINUTES = 240
    
    # 4 saati aşan süre
    overtime_minutes = max(0, total_minutes - BASE_MINUTES)
    overtime_hours = round(overtime_minutes / 60.0, 2)
    
    # Ek ücret hesaplama
    overtime_charge = round(overtime_hours * hourly_rate, 2)
    
    is_overtime = overtime_minutes > 0
    
    result = {
        "work_order_id": work_order_id,
        "wo_number": work_order.wo_number,
        "actual_end": actual_end.isoformat() if actual_end else None,
        "gate_exit_time": gate_exit_time.isoformat() if gate_exit_time else None,
        "total_duration_minutes": total_minutes,
        "base_minutes": BASE_MINUTES,
        "overtime_minutes": overtime_minutes,
        "overtime_hours": overtime_hours,
        "hourly_rate": hourly_rate,
        "overtime_charge": overtime_charge,
        "is_overtime": is_overtime,
        "currency": "TRY",
        "work_order_item_id": None
    }
    
    # Otomatik WorkOrderItem oluştur
    if auto_create_item and is_overtime:
        # Daha önce oluşturulmuş mu kontrol et
        existing_item = db.query(models_isemri.WorkOrderItem).filter(
            models_isemri.WorkOrderItem.work_order_id == work_order_id,
            models_isemri.WorkOrderItem.item_type == models_isemri.WorkOrderItemType.WORKLOG,
            models_isemri.WorkOrderItem.resource_code == "OVERTIME_4H"
        ).first()
        
        if existing_item:
            # Mevcut kalemi güncelle
            existing_item.quantity = overtime_hours
            existing_item.unit_price = hourly_rate
            existing_item.total_amount = overtime_charge
            existing_item.vat_amount = round(overtime_charge * existing_item.vat_rate / 100, 2)
            existing_item.grand_total = existing_item.total_amount + existing_item.vat_amount
            existing_item.notes = f"4 saat kuralı aşımı: {overtime_minutes} dakika ({overtime_hours} saat)"
            
            db.commit()
            db.refresh(existing_item)
            
            result["work_order_item_id"] = existing_item.id
            result["message"] = "Mevcut fazla mesai kalemi güncellendi"
        else:
            # Yeni kalem oluştur
            vat_rate = 20.0
            total_amount = overtime_charge
            vat_amount = round(total_amount * vat_rate / 100, 2)
            grand_total = total_amount + vat_amount
            
            new_item = models_isemri.WorkOrderItem(
                work_order_id=work_order_id,
                wo_number=work_order.wo_number,
                item_type=models_isemri.WorkOrderItemType.WORKLOG,
                resource_code="OVERTIME_4H",
                resource_name="Fazla Mesai (4 Saat Kuralı Aşımı)",
                quantity=overtime_hours,
                unit="SAAT",
                unit_price=hourly_rate,
                currency="TRY",
                total_amount=total_amount,
                vat_rate=vat_rate,
                vat_amount=vat_amount,
                grand_total=grand_total,
                notes=f"4 saat kuralı aşımı: {overtime_minutes} dakika ({overtime_hours} saat). Çıkış: {gate_exit_time.strftime('%Y-%m-%d %H:%M')}, İş bitişi: {actual_end.strftime('%Y-%m-%d %H:%M')}",
                is_invoiced=False
            )
            
            db.add(new_item)
            db.commit()
            db.refresh(new_item)
            
            result["work_order_item_id"] = new_item.id
            result["message"] = "Fazla mesai kalemi oluşturuldu"
    
    return success_response(
        data=result,
        message="4 saat kuralı hesaplandı" if is_overtime else "4 saat kuralı aşılmadı"
    )


# ============================================
# WORK ORDER ITEM ENDPOINTS
# ============================================

@router.get("/work-order-item/uninvoiced")
def get_uninvoiced_items(
    cari_code: Optional[str] = Query(None, description="Cari kodu filtresi"),
    date_from: Optional[str] = Query(None, description="Başlangıç tarihi (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Faturalanmamış kalemleri getir.
    Statik path dinamik /work-order-item/{item_id} path'inden önce tanımlandığı için 422 çakışması engellenir.
    """
    query = db.query(models_isemri.WorkOrderItem).join(
        models_isemri.WorkOrder,
        models_isemri.WorkOrderItem.work_order_id == models_isemri.WorkOrder.id
    ).filter(
        models_isemri.WorkOrderItem.is_invoiced == False,
        models_isemri.WorkOrder.is_active == True
    )
    if cari_code:
        query = query.filter(models_isemri.WorkOrder.cari_code == cari_code)
    if date_from:
        query = query.filter(models_isemri.WorkOrderItem.created_at >= date_from)
    items = query.order_by(models_isemri.WorkOrderItem.created_at.desc()).all()
    items_data = [schemas_isemri.WorkOrderItemResponse.model_validate(item) for item in items]
    return success_response(data=items_data, message="Faturalanmamış kalemler")

@router.get("/work-order-item/wo/{work_order_id}")
def get_work_order_items(work_order_id: int, db: Session = Depends(get_db)):
    """
    İş emrine ait kalemleri getir
    """
    items = db.query(models_isemri.WorkOrderItem).filter(
        models_isemri.WorkOrderItem.work_order_id == work_order_id
    ).order_by(models_isemri.WorkOrderItem.created_at.desc()).all()
    
    items_data = [schemas_isemri.WorkOrderItemResponse.model_validate(item) for item in items]
    return success_response(data=items_data, message="İş emri kalemleri")


@router.get("/work-order-item/{item_id}")
def get_work_order_item(item_id: int, db: Session = Depends(get_db)):
    """
    Kalem detayı
    """
    item = db.query(models_isemri.WorkOrderItem).filter(
        models_isemri.WorkOrderItem.id == item_id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_ITEM_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.WO_ITEM_NOT_FOUND,
                message="Kalem bulunamadı",
                details={"item_id": item_id}
            )
        )
    
    item_data = schemas_isemri.WorkOrderItemResponse.model_validate(item)
    return success_response(data=item_data, message="Kalem detayı")




@router.post("/work-order-item", status_code=201)
def create_work_order_item(
    item: schemas_isemri.WorkOrderItemCreate,
    db: Session = Depends(get_db)
):
    """
    Yeni kalem ekle
    """
    # İş emri var mı kontrol et
    work_order = db.query(models_isemri.WorkOrder).filter(
        models_isemri.WorkOrder.id == item.WorkOrderId,
        models_isemri.WorkOrder.is_active == True
    ).first()
    
    if not work_order:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.WO_NOT_FOUND,
                message="İş emri bulunamadı",
                details={"work_order_id": item.WorkOrderId}
            )
        )
    
    # Model oluştur
    # Alias'ları kullanarak snake_case alanları elde et
    db_item = models_isemri.WorkOrderItem(
        **item.model_dump(by_alias=True, exclude_unset=True)
    )
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    item_data = schemas_isemri.WorkOrderItemResponse.model_validate(db_item)
    return success_response(data=item_data, message="Kalem eklendi")


@router.put("/work-order-item/{item_id}")
def update_work_order_item(
    item_id: int,
    item: schemas_isemri.WorkOrderItemUpdate,
    db: Session = Depends(get_db)
):
    """
    Kalem güncelle
    """
    db_item = db.query(models_isemri.WorkOrderItem).filter(
        models_isemri.WorkOrderItem.id == item_id
    ).first()
    
    if not db_item:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_ITEM_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.WO_ITEM_NOT_FOUND,
                message="Kalem bulunamadı",
                details={"item_id": item_id}
            )
        )
    
    # Faturalanan kalem güncellenemez
    if db_item.is_invoiced:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_ALREADY_INVOICED),
            detail=error_response(
                code=ErrorCode.WO_ALREADY_INVOICED,
                message="Faturalanmış kalem güncellenemez",
                details={"item_id": item_id}
            )
        )
    
    # Güncelleme
    # Alias kullanarak snake_case alan isimlerini elde et
    update_data = item.model_dump(by_alias=True, exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    
    item_data = schemas_isemri.WorkOrderItemResponse.model_validate(db_item)
    return success_response(data=item_data, message="Kalem güncellendi")


@router.delete("/work-order-item/{item_id}")
def delete_work_order_item(item_id: int, db: Session = Depends(get_db)):
    """
    Kalem sil
    """
    db_item = db.query(models_isemri.WorkOrderItem).filter(
        models_isemri.WorkOrderItem.id == item_id
    ).first()
    
    if not db_item:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_ITEM_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.WO_ITEM_NOT_FOUND,
                message="Kalem bulunamadı",
                details={"item_id": item_id}
            )
        )
    
    # Faturalanan kalem silinemez
    if db_item.is_invoiced:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_ALREADY_INVOICED),
            detail=error_response(
                code=ErrorCode.WO_ALREADY_INVOICED,
                message="Faturalanmış kalem silinemez",
                details={"item_id": item_id}
            )
        )
    
    db.delete(db_item)
    db.commit()
    
    return success_response(data=None, message="Kalem silindi")


@router.get("/work-order-item/wo/{work_order_id}/worklogs")
def get_work_order_worklogs(work_order_id: int, db: Session = Depends(get_db)):
    """
    WorkLog kalemleri (zamana dayalı)
    """
    items = db.query(models_isemri.WorkOrderItem).filter(
        models_isemri.WorkOrderItem.work_order_id == work_order_id,
        models_isemri.WorkOrderItem.item_type == models_isemri.WorkOrderItemType.WORKLOG
    ).order_by(models_isemri.WorkOrderItem.start_time.desc()).all()
    
    items_data = [schemas_isemri.WorkOrderItemResponse.model_validate(item) for item in items]
    return success_response(data=items_data, message="WorkLog kalemleri")


# ============================================
# WORK ORDER PERSON ENDPOINTS
# ============================================

@router.get("/work-order-person")
def get_work_order_persons(
    work_order_id: Optional[int] = Query(None, description="İş emri ID filtresi"),
    approved_by_security: Optional[bool] = Query(None, description="Güvenlik onayı filtresi"),
    search: Optional[str] = Query(None, description="İsim, TC kimlik veya pasaport araması"),
    page: int = Query(1, ge=1, description="Sayfa numarası"),
    page_size: int = Query(50, ge=1, le=500, description="Sayfa başına kayıt"),
    db: Session = Depends(get_db)
):
    """
    İş emri kişi listesini getir
    """
    query = db.query(models_isemri.WorkOrderPerson)
    
    # Filtreleme
    if work_order_id:
        query = query.filter(models_isemri.WorkOrderPerson.work_order_id == work_order_id)
    
    if approved_by_security is not None:
        query = query.filter(models_isemri.WorkOrderPerson.approved_by_security == approved_by_security)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models_isemri.WorkOrderPerson.full_name.ilike(search_filter)) |
            (models_isemri.WorkOrderPerson.tc_kimlik_no.ilike(search_filter)) |
            (models_isemri.WorkOrderPerson.passport_no.ilike(search_filter))
        )
    
    # Total count
    total = query.count()
    
    # Pagination
    persons = query.order_by(models_isemri.WorkOrderPerson.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    # Serialize
    items = [schemas_isemri.WorkOrderPersonResponse.model_validate(p) for p in persons]
    
    return paginated_response(
        data=items,
        page=page,
        page_size=page_size,
        total=total,
        message=f"{total} kişi bulundu"
    )


@router.get("/work-order-person/{person_id}")
def get_work_order_person(person_id: int, db: Session = Depends(get_db)):
    """
    Kişi detayı
    """
    person = db.query(models_isemri.WorkOrderPerson).filter(
        models_isemri.WorkOrderPerson.id == person_id
    ).first()
    
    if not person:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_PERSON_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.WO_PERSON_NOT_FOUND,
                message="Kişi bulunamadı",
                details={"person_id": person_id}
            )
        )
    
    person_data = schemas_isemri.WorkOrderPersonResponse.model_validate(person)
    return success_response(data=person_data, message="Kişi detayı")


@router.get("/work-order-person/wo/{work_order_id}")
def get_work_order_persons_by_wo(work_order_id: int, db: Session = Depends(get_db)):
    """
    İş emrine ait kişileri getir
    """
    persons = db.query(models_isemri.WorkOrderPerson).filter(
        models_isemri.WorkOrderPerson.work_order_id == work_order_id
    ).order_by(models_isemri.WorkOrderPerson.created_at.asc()).all()
    
    items = [schemas_isemri.WorkOrderPersonResponse.model_validate(p) for p in persons]
    return success_response(data=items, message=f"{len(items)} kişi bulundu")


@router.post("/work-order-person", status_code=201)
def create_work_order_person(
    person: schemas_isemri.WorkOrderPersonCreate,
    db: Session = Depends(get_db)
):
    """
    İş emrine kişi ekle
    """
    # İş emri var mı kontrol et
    work_order = db.query(models_isemri.WorkOrder).filter(
        models_isemri.WorkOrder.id == person.WorkOrderId,
        models_isemri.WorkOrder.is_active == True
    ).first()
    
    if not work_order:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.WO_NOT_FOUND,
                message="İş emri bulunamadı",
                details={"work_order_id": person.WorkOrderId}
            )
        )
    
    # TC Kimlik veya Pasaport en az biri olmalı
    if not person.TcKimlikNo and not person.PassportNo:
        raise HTTPException(
            status_code=400,
            detail=error_response(
                code=ErrorCode.VALIDATION_ERROR,
                message="TC Kimlik No veya Pasaport No girilmelidir",
                details={}
            )
        )
    
    # Model oluştur
    db_person = models_isemri.WorkOrderPerson(
        **person.model_dump(by_alias=True, exclude_unset=True)
    )
    
    db.add(db_person)
    db.commit()
    db.refresh(db_person)
    
    person_data = schemas_isemri.WorkOrderPersonResponse.model_validate(db_person)
    return success_response(data=person_data, message="Kişi eklendi")


@router.put("/work-order-person/{person_id}")
def update_work_order_person(
    person_id: int,
    person: schemas_isemri.WorkOrderPersonUpdate,
    db: Session = Depends(get_db)
):
    """
    Kişi bilgilerini güncelle
    """
    db_person = db.query(models_isemri.WorkOrderPerson).filter(
        models_isemri.WorkOrderPerson.id == person_id
    ).first()
    
    if not db_person:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_PERSON_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.WO_PERSON_NOT_FOUND,
                message="Kişi bulunamadı",
                details={"person_id": person_id}
            )
        )
    
    # Güvenlik onayı verilmişse güncelleme yapılamaz
    if db_person.approved_by_security:
        raise HTTPException(
            status_code=400,
            detail=error_response(
                code=ErrorCode.WO_ALREADY_APPROVED,
                message="Güvenlik onayı verilmiş kişi bilgileri güncellenemez",
                details={"person_id": person_id}
            )
        )
    
    # Güncelleme
    update_data = person.model_dump(by_alias=True, exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_person, key, value)
    
    db_person.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_person)
    
    person_data = schemas_isemri.WorkOrderPersonResponse.model_validate(db_person)
    return success_response(data=person_data, message="Kişi bilgileri güncellendi")


@router.delete("/work-order-person/{person_id}")
def delete_work_order_person(person_id: int, db: Session = Depends(get_db)):
    """
    Kişiyi sil
    """
    db_person = db.query(models_isemri.WorkOrderPerson).filter(
        models_isemri.WorkOrderPerson.id == person_id
    ).first()
    
    if not db_person:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_PERSON_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.WO_PERSON_NOT_FOUND,
                message="Kişi bulunamadı",
                details={"person_id": person_id}
            )
        )
    
    # Güvenlik onayı verilmişse silinemez
    if db_person.approved_by_security:
        raise HTTPException(
            status_code=400,
            detail=error_response(
                code=ErrorCode.WO_ALREADY_APPROVED,
                message="Güvenlik onayı verilmiş kişi silinemez",
                details={"person_id": person_id}
            )
        )
    
    db.delete(db_person)
    db.commit()
    
    return success_response(data=None, message="Kişi silindi")


@router.patch("/work-order-person/{person_id}/security-approval")
def security_approve_person(
    person_id: int,
    approval: schemas_isemri.SecurityApprovalRequest,
    db: Session = Depends(get_db)
):
    """
    Güvenlik onayı ver/çek
    """
    db_person = db.query(models_isemri.WorkOrderPerson).filter(
        models_isemri.WorkOrderPerson.id == person_id
    ).first()
    
    if not db_person:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.WO_PERSON_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.WO_PERSON_NOT_FOUND,
                message="Kişi bulunamadı",
                details={"person_id": person_id}
            )
        )
    
    # Güvenlik onayı bilgilerini güncelle
    db_person.approved_by_security = approval.ApprovedBySecurity
    db_person.approved_by_security_user_id = approval.SecurityUserId
    db_person.approved_at = datetime.utcnow() if approval.ApprovedBySecurity else None
    
    if approval.GateEntryTime:
        db_person.gate_entry_time = approval.GateEntryTime
    
    if approval.GateExitTime:
        db_person.gate_exit_time = approval.GateExitTime
    
    if approval.SecurityNotes:
        db_person.security_notes = approval.SecurityNotes
    
    db_person.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_person)
    
    person_data = schemas_isemri.WorkOrderPersonResponse.model_validate(db_person)
    return success_response(data=person_data, message="Güvenlik onayı güncellendi")


@router.get("/work-order-person/pending-approval")
def get_pending_security_approval(
    page: int = Query(1, ge=1, description="Sayfa numarası"),
    page_size: int = Query(50, ge=1, le=500, description="Sayfa başına kayıt"),
    db: Session = Depends(get_db)
):
    """
    Güvenlik onayı bekleyen kişiler
    """
    query = db.query(models_isemri.WorkOrderPerson).filter(
        models_isemri.WorkOrderPerson.approved_by_security == False
    )
    
    total = query.count()
    
    persons = query.order_by(models_isemri.WorkOrderPerson.created_at.asc()).offset((page - 1) * page_size).limit(page_size).all()
    
    items = [schemas_isemri.WorkOrderPersonResponse.model_validate(p) for p in persons]
    
    return paginated_response(
        data=items,
        page=page,
        page_size=page_size,
        total=total,
        message=f"{total} kişi güvenlik onayı bekliyor"
    )


# ============================================
# PRICING ENGINE ENDPOINT
# ============================================

@router.post("/api/work-order/calculate-price", response_model=schemas_isemri.PriceCalculationResponse)
def calculate_service_price(
    request: schemas_isemri.PriceCalculationRequest,
    db: Session = Depends(get_db)
):
    """
    Hizmet fiyatı hesaplama endpoint'i
    
    - Hizmet koduna göre Hizmet tablosundan fiyat bilgilerini al
    - PricingEngine ile hesaplama tipine göre fiyat hesapla
    - Kur çevrimi yap (USD/EUR -> TRY)
    - KDV hesapla (%20)
    - Detaylı kırılım döndür
    
    Args:
        request: PriceCalculationRequest (service_code, quantity, weight, days, minutes, vb.)
    
    Returns:
        PriceCalculationResponse: base_price, converted_price, vat_amount, grand_total, calculation_details
    """
    
    # 1. Hizmet bilgilerini getir
    hizmet = db.query(Hizmet).filter(
        Hizmet.Kod == request.ServiceCode,
        Hizmet.AktifMi == True
    ).first()
    
    if not hizmet:
        raise HTTPException(
            status_code=404,
            detail=f"Hizmet bulunamadı: {request.ServiceCode}"
        )
    
    if hizmet.Fiyat is None:
        raise HTTPException(
            status_code=400,
            detail=f"Hizmet fiyatı tanımlanmamış: {request.ServiceCode}"
        )
    
    # 2. PricingEngine input_data hazırla
    input_data = {}
    if request.Quantity is not None:
        input_data["quantity"] = request.Quantity
    if request.Weight is not None:
        input_data["weight"] = request.Weight
    if request.Days is not None:
        input_data["days"] = request.Days
    if request.Minutes is not None:
        input_data["minutes"] = request.Minutes
    if request.Hours is not None:
        input_data["hours"] = request.Hours
    if request.Grt is not None:
        input_data["grt"] = request.Grt
    if request.SqMeter is not None:
        input_data["sqmeter"] = request.SqMeter
    
    # 3. PricingEngine hesaplama
    engine = PricingEngine()
    
    # FormulaParams JSON string ise parse et
    formula_params = hizmet.FormulaParams or {}
    if isinstance(formula_params, str):
        import json
        formula_params = json.loads(formula_params)
    
    calculation_result = engine.calculate(
        calculation_type=hizmet.CalculationType,
        base_price=Decimal(str(hizmet.Fiyat)),
        formula_params=formula_params,
        input_data=input_data,
        currency=hizmet.ParaBirimi
    )
    
    subtotal = calculation_result["subtotal"]
    
    # 4. Kur çevrimi (USD/EUR -> TRY)
    # TODO: Gerçek kur API'sinden al (şimdilik sabit kur)
    exchange_rate = None
    converted_price_try = subtotal
    
    if hizmet.ParaBirimi == "USD":
        exchange_rate = Decimal("34.50")  # TODO: Güncel USD/TRY kuru
        converted_price_try = subtotal * exchange_rate
    elif hizmet.ParaBirimi == "EUR":
        exchange_rate = Decimal("37.80")  # TODO: Güncel EUR/TRY kuru
        converted_price_try = subtotal * exchange_rate
    elif hizmet.ParaBirimi == "TRY":
        exchange_rate = Decimal("1.00")
        converted_price_try = subtotal
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Desteklenmeyen para birimi: {hizmet.ParaBirimi}"
        )
    
    # 5. KDV hesaplama
    vat_rate = hizmet.KdvOrani if hizmet.KdvOrani else Decimal("20.00")
    vat_amount = converted_price_try * (vat_rate / Decimal("100"))
    grand_total = converted_price_try + vat_amount
    
    # 6. Response oluştur
    return schemas_isemri.PriceCalculationResponse(
        service_code=hizmet.Kod,
        service_name=hizmet.Ad,
        base_price=float(subtotal),
        base_currency=hizmet.ParaBirimi,
        converted_price=float(converted_price_try),
        vat_rate=float(vat_rate),
        vat_amount=float(vat_amount),
        grand_total=float(grand_total),
        calculation_details=calculation_result["calculation_details"],
        breakdown=calculation_result["breakdown"],
        exchange_rate=float(exchange_rate) if exchange_rate else None
    )


# ============================================
# DISCOUNT & PRICING RULES ENDPOINTS
# ============================================

@router.put("/api/work-order/{work_order_id}/apply-cabotage-discount")
def apply_cabotage_discount(
    work_order_id: int,
    db: Session = Depends(get_db)
):
    """
    Türk Bayraklı Gemi Kabotaj İndirimi Uygula
    
    - is_cabatoge_tr_flag=True ise %10 indirim uygula
    - WorkOrder.total_amount'u güncelle
    - Notes'a indirim bilgisi ekle
    
    Args:
        work_order_id: İş emri ID
    
    Returns:
        Updated WorkOrder with discount applied
    """
    
    # 1. İş emrini getir
    work_order = db.query(models_isemri.WorkOrder).options(
        selectinload(models_isemri.WorkOrder.items)
    ).filter(
        models_isemri.WorkOrder.id == work_order_id,
        models_isemri.WorkOrder.is_active == True
    ).first()
    
    if not work_order:
        raise HTTPException(
            status_code=404,
            detail=f"İş emri bulunamadı: {work_order_id}"
        )
    
    # 2. Türk bayraklı kontrol
    if not work_order.is_cabatoge_tr_flag:
        raise HTTPException(
            status_code=400,
            detail="Bu iş emri Türk bayraklı değil. Kabotaj indirimi uygulanamaz."
        )
    
    # 3. Mevcut toplam tutarı hesapla (items toplamı)
    # WorkOrderItem'da is_active yok, tüm aktif kalemler topla
    items_total = sum(Decimal(str(item.total_amount)) for item in work_order.items)
    
    if items_total == 0:
        raise HTTPException(
            status_code=400,
            detail="İş emrinde kalem bulunmuyor. İndirim uygulanamaz."
        )
    
    # 4. %10 indirim hesapla
    discount_rate = Decimal("10.00")
    discount_amount = items_total * (discount_rate / Decimal("100"))
    discounted_total = items_total - discount_amount
    
    # 5. WorkOrder.total_amount güncelle
    work_order.total_amount = float(discounted_total)
    
    # 6. completion_notes'a indirim bilgisi ekle (notes kolonu mevcut değil, completion_notes kullan)
    discount_note = f"\n[KABOTAJ İNDİRİMİ] %{discount_rate} indirim uygulandı. Orijinal tutar: {items_total:.2f} TRY, İndirim: {discount_amount:.2f} TRY, Yeni toplam: {discounted_total:.2f} TRY - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    
    if work_order.completion_notes:
        work_order.completion_notes += discount_note
    else:
        work_order.completion_notes = discount_note.strip()
    
    # 7. Kaydet
    work_order.updated_at = datetime.now()
    db.commit()
    db.refresh(work_order)
    
    # 8. Response
    return success_response(
        data={
            "work_order_id": work_order.id,
            "wo_number": work_order.wo_number,
            "original_total": float(items_total),
            "discount_rate": float(discount_rate),
            "discount_amount": float(discount_amount),
            "discounted_total": float(discounted_total),
            "is_cabatoge_tr_flag": work_order.is_cabatoge_tr_flag
        },
        message=f"Kabotaj indirimi uygulandı: %{discount_rate} indirim ({discount_amount:.2f} TRY)"
    )


# ============================================
# TARIFF RULES ENDPOINT
# ============================================

@router.put("/api/work-order/{work_order_id}/apply-tariff-rules")
def apply_tariff_rules(
    work_order_id: int,
    night_shift: bool = Query(False, description="Gece vardiyası (+%25)"),
    weekend: bool = Query(False, description="Hafta sonu (+%50)"),
    urgent: bool = Query(False, description="Acil işlem (+%30)"),
    db: Session = Depends(get_db)
):
    """
    Tarife kurallarını uygula
    
    İş emrinin apply_rule_addons=True olması gerekiyor.
    
    Kurallar:
    - Gece vardiyası (22:00-06:00): +%25
    - Hafta sonu (Cumartesi/Pazar): +%50
    - Acil işlem: +%30
    
    Kurallar kümülatif (birbiri üzerine eklenir):
    Örnek: Gece + Hafta sonu = 1.25 × 1.50 = 1.875 (toplam %87.5 artış)
    
    Args:
        work_order_id: İş emri ID
        night_shift: Gece vardiyası uygulanacak mı?
        weekend: Hafta sonu uygulanacak mı?
        urgent: Acil işlem uygulanacak mı?
    
    Returns:
        Güncellenmiş iş emri bilgileri + uygulanan kurallar
    """
    
    # 1. İş emrini getir (items ile birlikte)
    work_order = db.query(models_isemri.WorkOrder).options(
        selectinload(models_isemri.WorkOrder.items)
    ).filter(
        models_isemri.WorkOrder.id == work_order_id,
        models_isemri.WorkOrder.is_active == True
    ).first()
    
    if not work_order:
        raise HTTPException(
            status_code=404,
            detail=f"İş emri bulunamadı: {work_order_id}"
        )
    
    # 2. apply_rule_addons kontrolü
    if not work_order.apply_rule_addons:
        raise HTTPException(
            status_code=400,
            detail="Bu iş emrinde tarife kuralları uygulaması devre dışı (apply_rule_addons=False)"
        )
    
    # 3. Mevcut toplam tutarı hesapla
    base_total = sum(Decimal(str(item.total_amount)) for item in work_order.items)
    
    if base_total == 0:
        raise HTTPException(
            status_code=400,
            detail="İş emrinde kalem bulunmuyor. Tarife kuralları uygulanamaz."
        )
    
    # 4. Tarife kurallarını uygula (kümülatif)
    multiplier = Decimal("1.00")
    applied_rules = []
    
    if night_shift:
        multiplier *= Decimal("1.25")
        applied_rules.append("Gece Vardiyası (+%25)")
    
    if weekend:
        multiplier *= Decimal("1.50")
        applied_rules.append("Hafta Sonu (+%50)")
    
    if urgent:
        multiplier *= Decimal("1.30")
        applied_rules.append("Acil İşlem (+%30)")
    
    if not applied_rules:
        raise HTTPException(
            status_code=400,
            detail="En az bir tarife kuralı seçilmelidir (night_shift, weekend, urgent)"
        )
    
    # 5. Yeni toplam hesapla
    new_total = base_total * multiplier
    increase_amount = new_total - base_total
    increase_percentage = ((multiplier - Decimal("1.00")) * Decimal("100"))
    
    # 6. WorkOrder.total_amount güncelle
    work_order.total_amount = float(new_total)
    
    # 7. completion_notes'a kural bilgisi ekle
    rules_text = ", ".join(applied_rules)
    rule_note = f"\n[TARİFE KURALLARI] Uygulanan: {rules_text}. Baz tutar: {base_total:.2f} TRY, Artış: {increase_amount:.2f} TRY (%{increase_percentage:.2f}), Yeni toplam: {new_total:.2f} TRY - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    
    if work_order.completion_notes:
        work_order.completion_notes += rule_note
    else:
        work_order.completion_notes = rule_note.strip()
    
    # 8. Kaydet
    work_order.updated_at = datetime.now()
    db.commit()
    db.refresh(work_order)
    
    # 9. Response
    return success_response(
        data={
            "work_order_id": work_order.id,
            "wo_number": work_order.wo_number,
            "base_total": float(base_total),
            "multiplier": float(multiplier),
            "increase_percentage": float(increase_percentage),
            "increase_amount": float(increase_amount),
            "new_total": float(new_total),
            "applied_rules": applied_rules,
            "night_shift": night_shift,
            "weekend": weekend,
            "urgent": urgent
        },
        message=f"Tarife kuralları uygulandı: {rules_text} (Toplam artış: %{increase_percentage:.2f})"
    )


# ============================================
# WORK ORDER PERSON ENDPOINTS
# ============================================

@router.get("/work-order/{work_order_id}/persons")
def get_work_order_persons(
    work_order_id: int,
    db: Session = Depends(get_db)
):
    """
    İş emrine bağlı kişi listesi
    Güvenlik için gerekli kimlik bilgileri
    """
    # İş emri kontrolü
    work_order = db.query(models_isemri.WorkOrder).filter(
        models_isemri.WorkOrder.id == work_order_id,
        models_isemri.WorkOrder.is_active == True
    ).first()
    
    if not work_order:
        raise HTTPException(
            status_code=404,
            detail=f"İş emri bulunamadı: {work_order_id}"
        )
    
    # Kişi listesi
    persons = db.query(models_isemri.WorkOrderPerson).filter(
        models_isemri.WorkOrderPerson.work_order_id == work_order_id,
        models_isemri.WorkOrderPerson.is_active == True
    ).all()
    
    # Serialize
    persons_data = [schemas_isemri.WorkOrderPersonResponse.model_validate(p) for p in persons]
    
    return success_response(
        data=persons_data,
        message=f"{len(persons_data)} kişi bulundu"
    )


@router.post("/work-order/{work_order_id}/persons")
def create_work_order_person(
    work_order_id: int,
    person: schemas_isemri.WorkOrderPersonCreate,
    db: Session = Depends(get_db)
):
    """
    İş emrine kişi ekle
    TC Kimlik No veya Pasaport No zorunlu
    """
    # İş emri kontrolü
    work_order = db.query(models_isemri.WorkOrder).filter(
        models_isemri.WorkOrder.id == work_order_id,
        models_isemri.WorkOrder.is_active == True
    ).first()
    
    if not work_order:
        raise HTTPException(
            status_code=404,
            detail=f"İş emri bulunamadı: {work_order_id}"
        )
    
    # Validasyon: TC veya Pasaport zorunlu
    if not person.TcKimlikNo and not person.PassportNo:
        raise HTTPException(
            status_code=400,
            detail="TC Kimlik No veya Pasaport No zorunludur"
        )
    
    # TC Kimlik No validasyonu (11 haneli)
    if person.TcKimlikNo and len(person.TcKimlikNo) != 11:
        raise HTTPException(
            status_code=400,
            detail="TC Kimlik No 11 haneli olmalıdır"
        )
    
    # Duplicate kontrolü
    existing = db.query(models_isemri.WorkOrderPerson).filter(
        models_isemri.WorkOrderPerson.work_order_id == work_order_id,
        models_isemri.WorkOrderPerson.is_active == True
    )
    
    if person.TcKimlikNo:
        existing = existing.filter(models_isemri.WorkOrderPerson.tc_kimlik_no == person.TcKimlikNo)
    elif person.PassportNo:
        existing = existing.filter(models_isemri.WorkOrderPerson.passport_no == person.PassportNo)
    
    if existing.first():
        raise HTTPException(
            status_code=400,
            detail="Bu kişi zaten bu iş emrinde kayıtlı"
        )
    
    # Oluştur
    new_person = models_isemri.WorkOrderPerson(
        work_order_id=work_order_id,
        work_order_item_id=person.WorkOrderItemId,
        full_name=person.FullName,
        tc_kimlik_no=person.TcKimlikNo,
        passport_no=person.PassportNo,
        nationality=person.Nationality,
        phone=person.Phone,
        identity_document_id=person.IdentityDocumentId,
        identity_photo_url=person.IdentityPhotoUrl,
        security_notes=person.SecurityNotes,
        is_active=True,
        created_by=1,  # TODO: Get from auth context
    )
    
    db.add(new_person)
    db.commit()
    db.refresh(new_person)
    
    # Response
    person_data = schemas_isemri.WorkOrderPersonResponse.model_validate(new_person)
    
    return success_response(
        data=person_data,
        message=f"Kişi eklendi: {new_person.full_name}"
    )


@router.put("/work-order/{work_order_id}/persons/{person_id}")
def update_work_order_person(
    work_order_id: int,
    person_id: int,
    person: schemas_isemri.WorkOrderPersonUpdate,
    db: Session = Depends(get_db)
):
    """
    Kişi bilgilerini güncelle
    """
    # Kişi kontrolü
    existing_person = db.query(models_isemri.WorkOrderPerson).filter(
        models_isemri.WorkOrderPerson.id == person_id,
        models_isemri.WorkOrderPerson.work_order_id == work_order_id,
        models_isemri.WorkOrderPerson.is_active == True
    ).first()
    
    if not existing_person:
        raise HTTPException(
            status_code=404,
            detail=f"Kişi bulunamadı: {person_id}"
        )
    
    # TC Kimlik No validasyonu
    if person.TcKimlikNo and len(person.TcKimlikNo) != 11:
        raise HTTPException(
            status_code=400,
            detail="TC Kimlik No 11 haneli olmalıdır"
        )
    
    # Güncelle
    update_data = person.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        # Pydantic alias'ları snake_case'e çevir
        snake_field = field[0].lower() + ''.join(['_' + c.lower() if c.isupper() else c for c in field[1:]])
        setattr(existing_person, snake_field, value)
    
    existing_person.updated_at = datetime.now()
    
    db.commit()
    db.refresh(existing_person)
    
    # Response
    person_data = schemas_isemri.WorkOrderPersonResponse.model_validate(existing_person)
    
    return success_response(
        data=person_data,
        message=f"Kişi güncellendi: {existing_person.full_name}"
    )


@router.delete("/work-order/{work_order_id}/persons/{person_id}")
def delete_work_order_person(
    work_order_id: int,
    person_id: int,
    db: Session = Depends(get_db)
):
    """
    Kişiyi sil (soft delete)
    """
    # Kişi kontrolü
    existing_person = db.query(models_isemri.WorkOrderPerson).filter(
        models_isemri.WorkOrderPerson.id == person_id,
        models_isemri.WorkOrderPerson.work_order_id == work_order_id,
        models_isemri.WorkOrderPerson.is_active == True
    ).first()
    
    if not existing_person:
        raise HTTPException(
            status_code=404,
            detail=f"Kişi bulunamadı: {person_id}"
        )
    
    # Soft delete
    existing_person.is_active = False
    existing_person.updated_at = datetime.now()
    
    db.commit()
    
    return success_response(
        data={"id": person_id},
        message=f"Kişi silindi: {existing_person.full_name}"
    )


# ============================================
# WORK ORDER APPROVAL ENDPOINTS
# ============================================

@router.get("/work-order/pending-approval")
def get_pending_approval_work_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    Onay bekleyen iş emirlerini listele
    
    - approval_status = 'PENDING' olanlar
    - portal_user_id doluysa portal talebi
    - Cari bilgileri dahil
    """
    query = db.query(models_isemri.WorkOrder).filter(
        models_isemri.WorkOrder.is_active == True,
        models_isemri.WorkOrder.approval_status == "PENDING"
    )
    
    total = query.count()
    
    # Pagination
    offset = (page - 1) * page_size
    work_orders = query.order_by(
        models_isemri.WorkOrder.created_at.desc()
    ).offset(offset).limit(page_size).all()
    
    # Response
    items = []
    for wo in work_orders:
        items.append({
            "id": wo.id,
            "wo_number": wo.wo_number,
            "cari_id": wo.cari_id,
            "cari_code": wo.cari_code,
            "cari_title": wo.cari_title,
            "portal_user_id": wo.portal_user_id,
            "requester_user_name": wo.requester_user_name,
            "type": wo.type,
            "service_code": wo.service_code,
            "subject": wo.subject,
            "description": wo.description,
            "priority": wo.priority,
            "status": wo.status,
            "approval_status": wo.approval_status,
            "created_at": wo.created_at.isoformat() if wo.created_at else None,
            "planned_start": wo.planned_start.isoformat() if wo.planned_start else None,
            "planned_end": wo.planned_end.isoformat() if wo.planned_end else None,
        })
    
    return paginated_response(
        data=items,
        total=total,
        page=page,
        page_size=page_size,
        message=f"{total} onay bekleyen iş emri bulundu"
    )


@router.post("/work-order/{work_order_id}/approve")
def approve_work_order(
    work_order_id: int,
    approval_note: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    İş emrini onayla
    
    - approval_status = 'APPROVED'
    - status = 'PENDING_APPROVAL' → 'APPROVED'
    - Email notification gönder
    """
    work_order = db.query(models_isemri.WorkOrder).filter(
        models_isemri.WorkOrder.id == work_order_id,
        models_isemri.WorkOrder.is_active == True
    ).first()
    
    if not work_order:
        raise HTTPException(status_code=404, detail="İş emri bulunamadı")
    
    if work_order.approval_status == "APPROVED":
        raise HTTPException(status_code=400, detail="İş emri zaten onaylanmış")
    
    # Onayla
    work_order.approval_status = "APPROVED"
    if work_order.status in ["DRAFT", "SUBMITTED", "PENDING_APPROVAL"]:
        work_order.status = "APPROVED"
    
    work_order.notes = f"ONAY: {approval_note}" if approval_note else "Onaylandı"
    work_order.updated_at = datetime.now()
    
    db.commit()
    db.refresh(work_order)
    
    # TODO: Email notification gönder
    # if work_order.portal_user_id:
    #     EmailService.send_work_order_approved(work_order)
    
    return success_response(
        data=schemas_isemri.WorkOrderResponse.model_validate(work_order),
        message=f"İş emri onaylandı: {work_order.wo_number}"
    )


@router.post("/work-order/{work_order_id}/reject")
def reject_work_order(
    work_order_id: int,
    rejection_reason: str,
    db: Session = Depends(get_db)
):
    """
    İş emrini reddet
    
    - approval_status = 'REJECTED'
    - status = 'REJECTED'
    - Email notification gönder
    """
    if not rejection_reason or len(rejection_reason.strip()) < 3:
        raise HTTPException(status_code=400, detail="Red nedeni zorunludur (min 3 karakter)")
    
    work_order = db.query(models_isemri.WorkOrder).filter(
        models_isemri.WorkOrder.id == work_order_id,
        models_isemri.WorkOrder.is_active == True
    ).first()
    
    if not work_order:
        raise HTTPException(status_code=404, detail="İş emri bulunamadı")
    
    if work_order.approval_status == "REJECTED":
        raise HTTPException(status_code=400, detail="İş emri zaten reddedilmiş")
    
    # Reddet
    work_order.approval_status = "REJECTED"
    work_order.status = "REJECTED"
    work_order.notes = f"RED: {rejection_reason}"
    work_order.updated_at = datetime.now()
    
    db.commit()
    db.refresh(work_order)
    
    # TODO: Email notification gönder
    # if work_order.portal_user_id:
    #     EmailService.send_work_order_rejected(work_order, rejection_reason)
    
    return success_response(
        data=schemas_isemri.WorkOrderResponse.model_validate(work_order),
        message=f"İş emri reddedildi: {work_order.wo_number}"
    )


















