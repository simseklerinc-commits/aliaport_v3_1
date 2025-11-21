from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .database import get_db
from .models_parametre import Parametre
from .schemas_parametre import (
    ParametreResponse,
    ParametreCreate,
    ParametreUpdate,
    PaginatedParametreResponse,
)
import math

router = APIRouter(prefix="/api/parametre", tags=["Parametre"])


@router.get("/", response_model=PaginatedParametreResponse)
def get_all_parametreler(
    page: int = 1,
    page_size: int = 50,
    kategori: Optional[str] = None,
    aktif: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """
    Tüm parametreleri listele (pagination + filtreler)
    """
    query = db.query(Parametre)
    
    # Kategori filtresi
    if kategori:
        query = query.filter(Parametre.Kategori == kategori)
    
    # Aktif filtresi
    if aktif is not None:
        query = query.filter(Parametre.AktifMi == aktif)
    
    # Toplam kayıt sayısı
    total = query.count()
    
    # Pagination
    offset = (page - 1) * page_size
    parametreler = query.order_by(Parametre.Kategori, Parametre.Kod).offset(offset).limit(page_size).all()
    
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    return {
        "items": parametreler,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/by-kategori/{kategori}", response_model=List[ParametreResponse])
def get_by_kategori(kategori: str, db: Session = Depends(get_db)):
    """
    Belirli kategori altındaki tüm aktif parametreleri listele
    """
    parametreler = (
        db.query(Parametre)
        .filter(Parametre.Kategori == kategori, Parametre.AktifMi == True)
        .order_by(Parametre.Kod)
        .all()
    )
    return parametreler


@router.get("/{parametre_id}", response_model=ParametreResponse)
def get_parametre(parametre_id: int, db: Session = Depends(get_db)):
    """
    Belirli bir parametreyi getir
    """
    parametre = db.query(Parametre).filter(Parametre.Id == parametre_id).first()
    if not parametre:
        raise HTTPException(status_code=404, detail="Parametre bulunamadı")
    return parametre


@router.post("/", response_model=ParametreResponse)
def create_parametre(parametre_data: ParametreCreate, db: Session = Depends(get_db)):
    """
    Yeni parametre ekle
    """
    # Kod benzersizliğini kontrol et
    existing = db.query(Parametre).filter(Parametre.Kod == parametre_data.Kod).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu kod zaten kullanılıyor")
    
    new_parametre = Parametre(**parametre_data.model_dump())
    db.add(new_parametre)
    db.commit()
    db.refresh(new_parametre)
    return new_parametre


@router.put("/{parametre_id}", response_model=ParametreResponse)
def update_parametre(
    parametre_id: int,
    parametre_data: ParametreUpdate,
    db: Session = Depends(get_db),
):
    """
    Parametre güncelle
    """
    parametre = db.query(Parametre).filter(Parametre.Id == parametre_id).first()
    if not parametre:
        raise HTTPException(status_code=404, detail="Parametre bulunamadı")
    
    # Kod benzersizliğini kontrol et (eğer değiştiriliyorsa)
    if parametre_data.Kod and parametre_data.Kod != parametre.Kod:
        existing = db.query(Parametre).filter(Parametre.Kod == parametre_data.Kod).first()
        if existing:
            raise HTTPException(status_code=400, detail="Bu kod zaten kullanılıyor")
    
    # Güncelleme
    update_data = parametre_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(parametre, key, value)
    
    db.commit()
    db.refresh(parametre)
    return parametre


@router.delete("/{parametre_id}")
def delete_parametre(parametre_id: int, db: Session = Depends(get_db)):
    """
    Parametre sil (hard delete)
    """
    parametre = db.query(Parametre).filter(Parametre.Id == parametre_id).first()
    if not parametre:
        raise HTTPException(status_code=404, detail="Parametre bulunamadı")
    
    db.delete(parametre)
    db.commit()
    return {"success": True, "message": "Parametre başarıyla silindi"}
