from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ...config.database import get_db
from ...core.responses import success_response, error_response, paginated_response
from ...core.error_codes import ErrorCode, raise_api_error, get_http_status_for_error
from .models import PriceList, PriceListItem
from .schemas import (
    PriceListResponse,
    PriceListCreate,
    PriceListUpdate,
    PriceListItemResponse,
    PriceListItemCreate,
    PriceListItemUpdate,
    PriceListWithItems,
)

router = APIRouter()


# ============================================
# PRICE LIST ENDPOINTS (Ana Tarife)
# ============================================

@router.get("/")
def get_all_price_lists(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    currency: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Tüm tarifeleri listele (pagination + filtreler)
    """
    try:
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
        
        # Convert to dict
        price_list_data = [PriceListResponse.model_validate(pl).model_dump() for pl in price_lists]
        
        return paginated_response(
            data=price_list_data,
            page=page,
            page_size=page_size,
            total=total,
            message=f"{total} tarife bulundu"
        )
    except Exception as e:
        return error_response(
            code=ErrorCode.INTERNAL_SERVER_ERROR,
            message=f"Tarife listesi alınırken hata: {str(e)}"
        )


@router.get("/active")
def get_active_price_lists(db: Session = Depends(get_db)):
    """
    Sadece aktif tarifeleri getir
    """
    try:
        price_lists = (
            db.query(PriceList)
            .filter(PriceList.AktifMi == True, PriceList.Durum == "AKTIF")
            .order_by(PriceList.Ad)
            .all()
        )
        
        price_list_data = [PriceListResponse.model_validate(pl).model_dump() for pl in price_lists]
        
        return success_response(
            data=price_list_data,
            message=f"{len(price_list_data)} aktif tarife bulundu"
        )
    except Exception as e:
        return error_response(
            code=ErrorCode.INTERNAL_SERVER_ERROR,
            message=f"Aktif tarife listesi alınırken hata: {str(e)}"
        )


@router.get("/{price_list_id}")
def get_price_list(price_list_id: int, db: Session = Depends(get_db)):
    """
    Belirli bir tarifeyi getir
    """
    try:
        price_list = db.query(PriceList).filter(PriceList.Id == price_list_id).first()
        if not price_list:
            raise_api_error(
                error_code=ErrorCode.TARIFE_NOT_FOUND,
                message="Tarife bulunamadı",
                details={"price_list_id": price_list_id}
            )
        
        price_list_data = PriceListResponse.model_validate(price_list).model_dump()
        
        return success_response(
            data=price_list_data,
            message="Tarife başarıyla getirildi"
        )
    except Exception as e:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.INTERNAL_SERVER_ERROR),
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message=f"Tarife getirilirken hata: {str(e)}",
                details={"price_list_id": price_list_id}
            )
        )


@router.get("/code/{code}")
def get_price_list_by_code(code: str, db: Session = Depends(get_db)):
    """
    Kod ile tarife getir
    """
    try:
        price_list = db.query(PriceList).filter(PriceList.Kod == code).first()
        if not price_list:
            raise_api_error(
                error_code=ErrorCode.TARIFE_NOT_FOUND,
                message="Tarife bulunamadı",
                details={"kod": code}
            )
        
        price_list_data = PriceListResponse.model_validate(price_list).model_dump()
        
        return success_response(
            data=price_list_data,
            message="Tarife başarıyla getirildi"
        )
    except Exception as e:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.INTERNAL_SERVER_ERROR),
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message=f"Tarife getirilirken hata: {str(e)}",
                details={"kod": code}
            )
        )


@router.get("/{price_list_id}/with-items")
def get_price_list_with_items(price_list_id: int, db: Session = Depends(get_db)):
    """
    Tarife + Kalemleri birlikte getir
    """
    try:
        price_list = db.query(PriceList).filter(PriceList.Id == price_list_id).first()
        if not price_list:
            raise_api_error(
                error_code=ErrorCode.TARIFE_NOT_FOUND,
                message="Tarife bulunamadı",
                details={"price_list_id": price_list_id}
            )
        
        items = (
            db.query(PriceListItem)
            .filter(PriceListItem.PriceListId == price_list_id, PriceListItem.AktifMi == True)
            .order_by(PriceListItem.SiraNo, PriceListItem.HizmetAdi)
            .all()
        )
        
        price_list_data = PriceListResponse.model_validate(price_list).model_dump()
        items_data = [PriceListItemResponse.model_validate(item).model_dump() for item in items]
        
        result = {**price_list_data, "items": items_data}
        
        return success_response(
            data=result,
            message=f"Tarife ve {len(items_data)} kalem getirildi"
        )
    except Exception as e:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.INTERNAL_SERVER_ERROR),
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message=f"Tarife ve kalemler getirilirken hata: {str(e)}",
                details={"price_list_id": price_list_id}
            )
        )


@router.post("/")
def create_price_list(price_list_data: PriceListCreate, db: Session = Depends(get_db)):
    """
    Yeni tarife oluştur
    """
    try:
        # Kod benzersizliğini kontrol et
        existing = db.query(PriceList).filter(PriceList.Kod == price_list_data.Kod).first()
        if existing:
            raise_api_error(
                error_code=ErrorCode.TARIFE_DUPLICATE,
                message="Bu kod zaten kullanılıyor",
                details={"kod": price_list_data.Kod}
            )
        
        new_price_list = PriceList(**price_list_data.model_dump())
        db.add(new_price_list)
        db.commit()
        db.refresh(new_price_list)
        
        result = PriceListResponse.model_validate(new_price_list).model_dump()
        
        return success_response(
            data=result,
            message="Tarife başarıyla oluşturuldu"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.DATABASE_ERROR),
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message=f"Tarife oluşturulurken hata: {str(e)}"
            )
        )


@router.put("/{price_list_id}")
def update_price_list(
    price_list_id: int,
    price_list_data: PriceListUpdate,
    db: Session = Depends(get_db),
):
    """
    Tarife güncelle
    """
    try:
        price_list = db.query(PriceList).filter(PriceList.Id == price_list_id).first()
        if not price_list:
            return error_response(
                code=ErrorCode.TARIFE_NOT_FOUND,
                message="Tarife bulunamadı",
                details={"price_list_id": price_list_id}
            )
        
        # Kod benzersizliğini kontrol et (eğer değiştiriliyorsa)
        if price_list_data.Kod and price_list_data.Kod != price_list.Kod:
            existing = db.query(PriceList).filter(PriceList.Kod == price_list_data.Kod).first()
            if existing:
                return error_response(
                    code=ErrorCode.TARIFE_DUPLICATE,
                    message="Bu kod zaten kullanılıyor",
                    details={"kod": price_list_data.Kod}
                )
        
        # Güncelleme
        update_data = price_list_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(price_list, key, value)
        
        db.commit()
        db.refresh(price_list)
        
        result = PriceListResponse.model_validate(price_list).model_dump()
        
        return success_response(
            data=result,
            message="Tarife başarıyla güncellendi"
        )
    except Exception as e:
        db.rollback()
        return error_response(
            code=ErrorCode.INTERNAL_SERVER_ERROR,
            message=f"Tarife güncellenirken hata: {str(e)}",
            details={"price_list_id": price_list_id}
        )


@router.patch("/{price_list_id}/status")
def update_price_list_status(
    price_list_id: int,
    status: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    Tarife durumunu güncelle
    """
    try:
        price_list = db.query(PriceList).filter(PriceList.Id == price_list_id).first()
        if not price_list:
            return error_response(
                code=ErrorCode.TARIFE_NOT_FOUND,
                message="Tarife bulunamadı",
                details={"price_list_id": price_list_id}
            )
        
        price_list.Durum = status
        price_list.UpdatedAt = datetime.utcnow()
        db.commit()
        db.refresh(price_list)
        
        result = PriceListResponse.model_validate(price_list).model_dump()
        
        return success_response(
            data=result,
            message=f"Tarife durumu '{status}' olarak güncellendi"
        )
    except Exception as e:
        db.rollback()
        return error_response(
            code=ErrorCode.INTERNAL_SERVER_ERROR,
            message=f"Tarife durumu güncellenirken hata: {str(e)}",
            details={"price_list_id": price_list_id}
        )


@router.delete("/{price_list_id}")
def delete_price_list(price_list_id: int, db: Session = Depends(get_db)):
    """
    Tarife sil (ilişkili kalemlerle birlikte)
    """
    try:
        price_list = db.query(PriceList).filter(PriceList.Id == price_list_id).first()
        if not price_list:
            return error_response(
                code=ErrorCode.TARIFE_NOT_FOUND,
                message="Tarife bulunamadı",
                details={"price_list_id": price_list_id}
            )
        
        # İlişkili kalemleri say
        items_count = db.query(PriceListItem).filter(PriceListItem.PriceListId == price_list_id).count()
        
        # İlişkili kalemleri de sil (bug fix: doğru foreign key alanı)
        db.query(PriceListItem).filter(PriceListItem.PriceListId == price_list_id).delete()
        
        db.delete(price_list)
        db.commit()
        
        return success_response(
            data={"price_list_id": price_list_id, "deleted_items": items_count},
            message=f"Tarife ve {items_count} kalem başarıyla silindi"
        )
    except Exception as e:
        db.rollback()
        return error_response(
            code=ErrorCode.INTERNAL_SERVER_ERROR,
            message=f"Tarife silinirken hata: {str(e)}",
            details={"price_list_id": price_list_id}
        )


# ============================================
# PRICE LIST ITEM ENDPOINTS (Tarife Kalemleri)
# ============================================

@router.get("/{price_list_id}/items")
def get_price_list_items(price_list_id: int, db: Session = Depends(get_db)):
    """
    Tarifeye ait tüm kalemleri getir
    """
    try:
        # Tarife var mı kontrol et
        price_list = db.query(PriceList).filter(PriceList.Id == price_list_id).first()
        if not price_list:
            return error_response(
                code=ErrorCode.TARIFE_NOT_FOUND,
                message="Tarife bulunamadı",
                details={"price_list_id": price_list_id}
            )
        
        items = (
            db.query(PriceListItem)
            .filter(PriceListItem.PriceListId == price_list_id)
            .order_by(PriceListItem.SiraNo, PriceListItem.HizmetAdi)
            .all()
        )
        
        items_data = [PriceListItemResponse.model_validate(item).model_dump() for item in items]
        
        return success_response(
            data=items_data,
            message=f"{len(items_data)} kalem bulundu"
        )
    except Exception as e:
        return error_response(
            code=ErrorCode.INTERNAL_SERVER_ERROR,
            message=f"Kalemler getirilirken hata: {str(e)}",
            details={"price_list_id": price_list_id}
        )


@router.get("/item/{item_id}")
def get_price_list_item(item_id: int, db: Session = Depends(get_db)):
    """
    Tek kalem detayı
    """
    try:
        item = db.query(PriceListItem).filter(PriceListItem.Id == item_id).first()
        if not item:
            return error_response(
                code=ErrorCode.TARIFE_ITEM_NOT_FOUND,
                message="Kalem bulunamadı",
                details={"item_id": item_id}
            )
        
        item_data = PriceListItemResponse.model_validate(item).model_dump()
        
        return success_response(
            data=item_data,
            message="Kalem başarıyla getirildi"
        )
    except Exception as e:
        return error_response(
            code=ErrorCode.INTERNAL_SERVER_ERROR,
            message=f"Kalem getirilirken hata: {str(e)}",
            details={"item_id": item_id}
        )


@router.post("/item")
def create_price_list_item(item_data: PriceListItemCreate, db: Session = Depends(get_db)):
    """
    Yeni kalem ekle
    """
    try:
        # Tarife var mı kontrol et
        price_list = db.query(PriceList).filter(PriceList.Id == item_data.PriceListId).first()
        if not price_list:
            return error_response(
                code=ErrorCode.TARIFE_NOT_FOUND,
                message="Tarife bulunamadı",
                details={"price_list_id": item_data.PriceListId}
            )
        
        new_item = PriceListItem(**item_data.model_dump())
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        
        result = PriceListItemResponse.model_validate(new_item).model_dump()
        
        return success_response(
            data=result,
            message="Kalem başarıyla eklendi"
        )
    except Exception as e:
        db.rollback()
        return error_response(
            code=ErrorCode.INTERNAL_SERVER_ERROR,
            message=f"Kalem eklenirken hata: {str(e)}"
        )


@router.put("/item/{item_id}")
def update_price_list_item(
    item_id: int,
    item_data: PriceListItemUpdate,
    db: Session = Depends(get_db),
):
    """
    Kalem güncelle
    """
    try:
        item = db.query(PriceListItem).filter(PriceListItem.Id == item_id).first()
        if not item:
            return error_response(
                code=ErrorCode.TARIFE_ITEM_NOT_FOUND,
                message="Kalem bulunamadı",
                details={"item_id": item_id}
            )
        
        # Güncelleme
        update_data = item_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(item, key, value)
        
        db.commit()
        db.refresh(item)
        
        result = PriceListItemResponse.model_validate(item).model_dump()
        
        return success_response(
            data=result,
            message="Kalem başarıyla güncellendi"
        )
    except Exception as e:
        db.rollback()
        return error_response(
            code=ErrorCode.INTERNAL_SERVER_ERROR,
            message=f"Kalem güncellenirken hata: {str(e)}",
            details={"item_id": item_id}
        )


@router.delete("/item/{item_id}")
def delete_price_list_item(item_id: int, db: Session = Depends(get_db)):
    """
    Kalem sil
    """
    try:
        item = db.query(PriceListItem).filter(PriceListItem.Id == item_id).first()
        if not item:
            return error_response(
                code=ErrorCode.TARIFE_ITEM_NOT_FOUND,
                message="Kalem bulunamadı",
                details={"item_id": item_id}
            )
        
        db.delete(item)
        db.commit()
        
        return success_response(
            data={"item_id": item_id},
            message="Kalem başarıyla silindi"
        )
    except Exception as e:
        db.rollback()
        return error_response(
            code=ErrorCode.INTERNAL_SERVER_ERROR,
            message=f"Kalem silinirken hata: {str(e)}",
            details={"item_id": item_id}
        )


@router.post("/{price_list_id}/items/bulk")
def create_bulk_items(
    price_list_id: int,
    items: List[PriceListItemCreate],
    db: Session = Depends(get_db),
):
    """
    Toplu kalem ekleme
    """
    try:
        # Tarife var mı kontrol et
        price_list = db.query(PriceList).filter(PriceList.Id == price_list_id).first()
        if not price_list:
            return error_response(
                code=ErrorCode.TARIFE_NOT_FOUND,
                message="Tarife bulunamadı",
                details={"price_list_id": price_list_id}
            )
        
        new_items = []
        for item_data in items:
            new_item = PriceListItem(**item_data.model_dump())
            db.add(new_item)
            new_items.append(new_item)
        
        db.commit()
        for item in new_items:
            db.refresh(item)
        
        items_data = [PriceListItemResponse.model_validate(item).model_dump() for item in new_items]
        
        return success_response(
            data=items_data,
            message=f"{len(items_data)} kalem toplu olarak eklendi"
        )
    except Exception as e:
        db.rollback()
        return error_response(
            code=ErrorCode.INTERNAL_SERVER_ERROR,
            message=f"Toplu kalem ekleme sırasında hata: {str(e)}",
            details={"price_list_id": price_list_id}
        )
