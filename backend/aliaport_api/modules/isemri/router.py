"""
İŞ EMRİ MODÜLÜ - FastAPI Router
WorkOrder ve WorkOrderItem CRUD endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from ...config.database import get_db
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

@router.get("/work-order", response_model=List[schemas_isemri.WorkOrderResponse])
def get_work_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    cari_code: Optional[str] = None,
    status: Optional[schemas_isemri.WorkOrderStatus] = None,
    type: Optional[schemas_isemri.WorkOrderType] = None,
    priority: Optional[schemas_isemri.WorkOrderPriority] = None,
    db: Session = Depends(get_db)
):
    """
    İş emirlerini listele (filtreleme ve pagination)
    """
    query = db.query(models_isemri.WorkOrder).filter(models_isemri.WorkOrder.is_active == True)
    
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
    
    # Sıralama ve pagination
    work_orders = query.order_by(models_isemri.WorkOrder.created_at.desc()).offset(skip).limit(limit).all()
    
    return work_orders


@router.get("/work-order/stats", response_model=schemas_isemri.WorkOrderStats)
def get_work_order_stats(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
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
    
    return stats


@router.get("/work-order/{work_order_id}", response_model=schemas_isemri.WorkOrderResponse)
def get_work_order(work_order_id: int, db: Session = Depends(get_db)):
    """
    Tek iş emri detayı
    """
    work_order = db.query(models_isemri.WorkOrder).filter(
        models_isemri.WorkOrder.id == work_order_id,
        models_isemri.WorkOrder.is_active == True
    ).first()
    
    if not work_order:
        raise HTTPException(status_code=404, detail="İş emri bulunamadı")
    
    return work_order


@router.get("/work-order/number/{wo_number}", response_model=schemas_isemri.WorkOrderResponse)
def get_work_order_by_number(wo_number: str, db: Session = Depends(get_db)):
    """
    İş emri numarası ile getir
    """
    work_order = db.query(models_isemri.WorkOrder).filter(
        models_isemri.WorkOrder.wo_number == wo_number,
        models_isemri.WorkOrder.is_active == True
    ).first()
    
    if not work_order:
        raise HTTPException(status_code=404, detail="İş emri bulunamadı")
    
    return work_order


@router.get("/work-order/cari/{cari_code}", response_model=List[schemas_isemri.WorkOrderResponse])
def get_work_orders_by_cari(
    cari_code: str,
    status: Optional[schemas_isemri.WorkOrderStatus] = None,
    db: Session = Depends(get_db)
):
    """
    Cariye göre iş emirleri
    """
    query = db.query(models_isemri.WorkOrder).filter(
        models_isemri.WorkOrder.cari_code == cari_code,
        models_isemri.WorkOrder.is_active == True
    )
    
    if status:
        query = query.filter(models_isemri.WorkOrder.status == status)
    
    work_orders = query.order_by(models_isemri.WorkOrder.created_at.desc()).all()
    
    return work_orders


@router.post("/work-order", response_model=schemas_isemri.WorkOrderResponse, status_code=201)
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
    
    return db_work_order


@router.put("/work-order/{work_order_id}", response_model=schemas_isemri.WorkOrderResponse)
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
        raise HTTPException(status_code=404, detail="İş emri bulunamadı")
    
    # Güncelleme
    update_data = work_order.model_dump(by_alias=False, exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_work_order, key, value)
    
    db_work_order.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_work_order)
    
    return db_work_order


@router.delete("/work-order/{work_order_id}", status_code=204)
def delete_work_order(work_order_id: int, db: Session = Depends(get_db)):
    """
    İş emri sil (soft delete)
    """
    db_work_order = db.query(models_isemri.WorkOrder).filter(
        models_isemri.WorkOrder.id == work_order_id,
        models_isemri.WorkOrder.is_active == True
    ).first()
    
    if not db_work_order:
        raise HTTPException(status_code=404, detail="İş emri bulunamadı")
    
    # Soft delete
    db_work_order.is_active = False
    db_work_order.updated_at = datetime.utcnow()
    
    db.commit()
    
    return None


@router.patch("/work-order/{work_order_id}/status", response_model=schemas_isemri.WorkOrderResponse)
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
        raise HTTPException(status_code=404, detail="İş emri bulunamadı")
    
    db_work_order.status = status_change.Status
    if status_change.Notes:
        db_work_order.notes = (db_work_order.notes or "") + f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M')}] {status_change.Notes}"
    
    db_work_order.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_work_order)
    
    return db_work_order


# ============================================
# WORK ORDER ITEM ENDPOINTS
# ============================================

@router.get("/work-order-item/wo/{work_order_id}", response_model=List[schemas_isemri.WorkOrderItemResponse])
def get_work_order_items(work_order_id: int, db: Session = Depends(get_db)):
    """
    İş emrine ait kalemleri getir
    """
    items = db.query(models_isemri.WorkOrderItem).filter(
        models_isemri.WorkOrderItem.work_order_id == work_order_id
    ).order_by(models_isemri.WorkOrderItem.created_at.desc()).all()
    
    return items


@router.get("/work-order-item/{item_id}", response_model=schemas_isemri.WorkOrderItemResponse)
def get_work_order_item(item_id: int, db: Session = Depends(get_db)):
    """
    Kalem detayı
    """
    item = db.query(models_isemri.WorkOrderItem).filter(
        models_isemri.WorkOrderItem.id == item_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Kalem bulunamadı")
    
    return item


@router.post("/work-order-item", response_model=schemas_isemri.WorkOrderItemResponse, status_code=201)
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
        raise HTTPException(status_code=404, detail="İş emri bulunamadı")
    
    # Model oluştur
    db_item = models_isemri.WorkOrderItem(
        **item.model_dump(by_alias=False, exclude_unset=True)
    )
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    return db_item


@router.put("/work-order-item/{item_id}", response_model=schemas_isemri.WorkOrderItemResponse)
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
        raise HTTPException(status_code=404, detail="Kalem bulunamadı")
    
    # Faturalanan kalem güncellenemez
    if db_item.is_invoiced:
        raise HTTPException(status_code=400, detail="Faturalanmış kalem güncellenemez")
    
    # Güncelleme
    update_data = item.model_dump(by_alias=False, exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    
    return db_item


@router.delete("/work-order-item/{item_id}", status_code=204)
def delete_work_order_item(item_id: int, db: Session = Depends(get_db)):
    """
    Kalem sil
    """
    db_item = db.query(models_isemri.WorkOrderItem).filter(
        models_isemri.WorkOrderItem.id == item_id
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Kalem bulunamadı")
    
    # Faturalanan kalem silinemez
    if db_item.is_invoiced:
        raise HTTPException(status_code=400, detail="Faturalanmış kalem silinemez")
    
    db.delete(db_item)
    db.commit()
    
    return None


@router.get("/work-order-item/wo/{work_order_id}/worklogs", response_model=List[schemas_isemri.WorkOrderItemResponse])
def get_work_order_worklogs(work_order_id: int, db: Session = Depends(get_db)):
    """
    WorkLog kalemleri (zamana dayalı)
    """
    items = db.query(models_isemri.WorkOrderItem).filter(
        models_isemri.WorkOrderItem.work_order_id == work_order_id,
        models_isemri.WorkOrderItem.item_type == models_isemri.WorkOrderItemType.WORKLOG
    ).order_by(models_isemri.WorkOrderItem.start_time.desc()).all()
    
    return items


@router.get("/work-order-item/uninvoiced", response_model=List[schemas_isemri.WorkOrderItemResponse])
def get_uninvoiced_items(
    cari_code: Optional[str] = None,
    date_from: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Faturalanamayan kalemleri getir
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
    
    return items
