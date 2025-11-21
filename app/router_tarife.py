from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import math
from .database import get_db
from .models_tarife import PriceList, PriceListItem
from .schemas_tarife import (
    PriceListResponse,
    PriceListCreate,
    PriceListUpdate,
    PriceListItemResponse,
    PriceListItemCreate,
    PriceListItemUpdate,
    PriceListWithItems,
    PaginatedPriceListResponse,
)

router = APIRouter()


# ============================================
# PRICE LIST ENDPOINTS (Ana Tarife)
# ============================================

@router.get("/", response_model=PaginatedPriceListResponse)
def get_all_price_lists(
    page: int = 1,
    page_size: int = 50,
    search: Optional[str] = None,
    status: Optional[str] = None,
    currency: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Tüm tarifeleri listele (pagination + filtreler)
    """
    query = db.query(PriceList)
    
    # Arama filtresi
    if search:
        query = query.filter(
            (PriceList.Kod.contains(search)) | (PriceList.Ad.contains(search))
        )
    
    # Durum filtresi
    if status:
        query = query.filter(PriceList.Durum == status)
    
    # Para birimi filtresi
    if currency:
        query = query.filter(PriceList.ParaBirimi == currency)
    
    # Toplam kayıt sayısı
    total = query.count()
    
    # Pagination
    offset = (page - 1) * page_size
    price_lists = query.order_by(PriceList.CreatedAt.desc()).offset(offset).limit(page_size).all()
    
    # Toplam sayfa sayısı
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    return {
        "items": price_lists,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/active", response_model=List[PriceListResponse])
def get_active_price_lists(db: Session = Depends(get_db)):
    """
    Sadece aktif tarifeleri getir
    """
    price_lists = (
        db.query(PriceList)
        .filter(PriceList.AktifMi == True, PriceList.Durum == "AKTIF")
        .order_by(PriceList.Ad)
        .all()
    )
    return price_lists


@router.get("/{price_list_id}", response_model=PriceListResponse)
def get_price_list(price_list_id: int, db: Session = Depends(get_db)):
    """
    Belirli bir tarifeyi getir
    """
    price_list = db.query(PriceList).filter(PriceList.Id == price_list_id).first()
    if not price_list:
        raise HTTPException(status_code=404, detail="Tarife bulunamadı")
    return price_list


@router.get("/code/{code}", response_model=PriceListResponse)
def get_price_list_by_code(code: str, db: Session = Depends(get_db)):
    """
    Kod ile tarife getir
    """
    price_list = db.query(PriceList).filter(PriceList.Kod == code).first()
    if not price_list:
        raise HTTPException(status_code=404, detail="Tarife bulunamadı")
    return price_list


@router.get("/{price_list_id}/with-items", response_model=PriceListWithItems)
def get_price_list_with_items(price_list_id: int, db: Session = Depends(get_db)):
    """
    Tarife + Kalemleri birlikte getir
    """
    price_list = db.query(PriceList).filter(PriceList.Id == price_list_id).first()
    if not price_list:
        raise HTTPException(status_code=404, detail="Tarife bulunamadı")
    
    items = (
        db.query(PriceListItem)
        .filter(PriceListItem.PriceListId == price_list_id, PriceListItem.AktifMi == True)
        .order_by(PriceListItem.SiraNo, PriceListItem.HizmetAdi)
        .all()
    )
    
    return {**price_list.__dict__, "items": items}


@router.post("/", response_model=PriceListResponse)
def create_price_list(price_list_data: PriceListCreate, db: Session = Depends(get_db)):
    """
    Yeni tarife oluştur
    """
    # Kod benzersizliğini kontrol et
    existing = db.query(PriceList).filter(PriceList.Kod == price_list_data.Kod).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu kod zaten kullanılıyor")
    
    new_price_list = PriceList(**price_list_data.model_dump())
    db.add(new_price_list)
    db.commit()
    db.refresh(new_price_list)
    return new_price_list


@router.put("/{price_list_id}", response_model=PriceListResponse)
def update_price_list(
    price_list_id: int,
    price_list_data: PriceListUpdate,
    db: Session = Depends(get_db),
):
    """
    Tarife güncelle
    """
    price_list = db.query(PriceList).filter(PriceList.Id == price_list_id).first()
    if not price_list:
        raise HTTPException(status_code=404, detail="Tarife bulunamadı")
    
    # Kod benzersizliğini kontrol et (eğer değiştiriliyorsa)
    if price_list_data.Kod and price_list_data.Kod != price_list.Kod:
        existing = db.query(PriceList).filter(PriceList.Kod == price_list_data.Kod).first()
        if existing:
            raise HTTPException(status_code=400, detail="Bu kod zaten kullanılıyor")
    
    # Güncelleme
    update_data = price_list_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(price_list, key, value)
    
    db.commit()
    db.refresh(price_list)
    return price_list


@router.patch("/{price_list_id}/status", response_model=PriceListResponse)
def update_price_list_status(
    price_list_id: int,
    status: str,
    db: Session = Depends(get_db),
):
    """
    Tarife durumunu güncelle
    """
    price_list = db.query(PriceList).filter(PriceList.Id == price_list_id).first()
    if not price_list:
        raise HTTPException(status_code=404, detail="Tarife bulunamadı")
    
    price_list.Durum = status
    price_list.UpdatedAt = datetime.utcnow()
    db.commit()
    db.refresh(price_list)
    return price_list


@router.delete("/{price_list_id}")
def delete_price_list(price_list_id: int, db: Session = Depends(get_db)):
    """
    Tarife sil
    """
    price_list = db.query(PriceList).filter(PriceList.Id == price_list_id).first()
    if not price_list:
        raise HTTPException(status_code=404, detail="Tarife bulunamadı")
    
    # İlişkili kalemleri de sil
    db.query(PriceListItem).filter(PriceListItem.PriceListId == price_list_id).delete()
    
    db.delete(price_list)
    db.commit()
    return {"message": "Tarife başarıyla silindi"}


# ============================================
# PRICE LIST ITEM ENDPOINTS (Tarife Kalemleri)
# ============================================

@router.get("/{price_list_id}/items", response_model=List[PriceListItemResponse])
def get_price_list_items(price_list_id: int, db: Session = Depends(get_db)):
    """
    Tarifeye ait tüm kalemleri getir
    """
    items = (
        db.query(PriceListItem)
        .filter(PriceListItem.PriceListId == price_list_id)
        .order_by(PriceListItem.SiraNo, PriceListItem.HizmetAdi)
        .all()
    )
    return items


@router.get("/item/{item_id}", response_model=PriceListItemResponse)
def get_price_list_item(item_id: int, db: Session = Depends(get_db)):
    """
    Tek kalem detayı
    """
    item = db.query(PriceListItem).filter(PriceListItem.Id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Kalem bulunamadı")
    return item


@router.post("/item", response_model=PriceListItemResponse)
def create_price_list_item(item_data: PriceListItemCreate, db: Session = Depends(get_db)):
    """
    Yeni kalem ekle
    """
    # Tarife var mı kontrol et
    price_list = db.query(PriceList).filter(PriceList.Id == item_data.PriceListId).first()
    if not price_list:
        raise HTTPException(status_code=404, detail="Tarife bulunamadı")
    
    new_item = PriceListItem(**item_data.model_dump())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.put("/item/{item_id}", response_model=PriceListItemResponse)
def update_price_list_item(
    item_id: int,
    item_data: PriceListItemUpdate,
    db: Session = Depends(get_db),
):
    """
    Kalem güncelle
    """
    item = db.query(PriceListItem).filter(PriceListItem.Id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Kalem bulunamadı")
    
    # Güncelleme
    update_data = item_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    
    db.commit()
    db.refresh(item)
    return item


@router.delete("/item/{item_id}")
def delete_price_list_item(item_id: int, db: Session = Depends(get_db)):
    """
    Kalem sil
    """
    item = db.query(PriceListItem).filter(PriceListItem.Id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Kalem bulunamadı")
    
    db.delete(item)
    db.commit()
    return {"message": "Kalem başarıyla silindi"}


@router.post("/{price_list_id}/items/bulk", response_model=List[PriceListItemResponse])
def create_bulk_items(
    price_list_id: int,
    items: List[PriceListItemCreate],
    db: Session = Depends(get_db),
):
    """
    Toplu kalem ekleme
    """
    # Tarife var mı kontrol et
    price_list = db.query(PriceList).filter(PriceList.Id == price_list_id).first()
    if not price_list:
        raise HTTPException(status_code=404, detail="Tarife bulunamadı")
    
    new_items = []
    for item_data in items:
        new_item = PriceListItem(**item_data.model_dump())
        db.add(new_item)
        new_items.append(new_item)
    
    db.commit()
    for item in new_items:
        db.refresh(item)
    
    return new_items
