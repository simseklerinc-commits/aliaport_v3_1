"""
İŞ EMRİ MODÜLÜ - FastAPI Router
WorkOrder ve WorkOrderItem CRUD endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload, joinedload
from typing import List, Optional
from datetime import datetime
import uuid

from ...config.database import get_db
from ...core.responses import success_response, error_response, paginated_response
from ...core.error_codes import ErrorCode, get_http_status_for_error
from . import models as models_isemri, schemas as schemas_isemri


router = APIRouter()


# ============================================
# HELPER FUNCTIONS
# ============================================

def generate_wo_number() -> str:
    """İş emri numarası oluştur (WO + YYYYMM + UUID ilk 8 karakter)"""
    timestamp = datetime.now().strftime("%Y%m")
    unique_id = str(uuid.uuid4()).replace('-', '').upper()[:8]
    return f"WO{timestamp}{unique_id}"


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
    İş emri istatistikleri
    """
    query = db.query(models_isemri.WorkOrder).filter(models_isemri.WorkOrder.is_active == True)
    
    if date_from:
        query = query.filter(models_isemri.WorkOrder.created_at >= date_from)
    if date_to:
        query = query.filter(models_isemri.WorkOrder.created_at <= date_to)
    
    all_orders = query.all()
    
    stats = {
        "Total": len(all_orders),
        "ByStatus": {},
        "ByPriority": {},
        "ByType": {}
    }
    
    # Durum bazında
    for status in schemas_isemri.WorkOrderStatus:
        count = sum(1 for wo in all_orders if wo.status == status)
        stats["ByStatus"][status.value] = count
    
    # Öncelik bazında
    for priority in schemas_isemri.WorkOrderPriority:
        count = sum(1 for wo in all_orders if wo.priority == priority)
        stats["ByPriority"][priority.value] = count
    
    # Tip bazında
    for wo_type in schemas_isemri.WorkOrderType:
        count = sum(1 for wo in all_orders if wo.type == wo_type)
        stats["ByType"][wo_type.value] = count
    
    stats_obj = schemas_isemri.WorkOrderStats.model_validate(stats)
    return success_response(data=stats_obj, message="İş emri istatistikleri")


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
    work_order: schemas_isemri.WorkOrderCreate,
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


