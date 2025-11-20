from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .database import get_db
from .models_hizmet import Hizmet
from .schemas_hizmet import HizmetResponse, HizmetCreate, HizmetUpdate

router = APIRouter()


@router.get("/", response_model=List[HizmetResponse])
def get_all_hizmetler(
    page: int = 1,
    page_size: int = 100,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """
    Tüm hizmetleri listele (isteğe bağlı is_active filtresi ile)
    """
    query = db.query(Hizmet)
    
    if is_active is not None:
        query = query.filter(Hizmet.AktifMi == is_active)
    
    # Pagination
    offset = (page - 1) * page_size
    hizmetler = query.offset(offset).limit(page_size).all()
    
    return hizmetler


@router.get("/{hizmet_id}", response_model=HizmetResponse)
def get_hizmet(hizmet_id: int, db: Session = Depends(get_db)):
    """
    Belirli bir hizmeti getir
    """
    hizmet = db.query(Hizmet).filter(Hizmet.Id == hizmet_id).first()
    if not hizmet:
        raise HTTPException(status_code=404, detail="Hizmet bulunamadı")
    return hizmet


@router.post("/", response_model=HizmetResponse)
def create_hizmet(hizmet_data: HizmetCreate, db: Session = Depends(get_db)):
    """
    Yeni hizmet ekle
    """
    # Kod benzersizliğini kontrol et
    existing = db.query(Hizmet).filter(Hizmet.Kod == hizmet_data.Kod).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu kod zaten kullanılıyor")
    
    new_hizmet = Hizmet(**hizmet_data.model_dump())
    db.add(new_hizmet)
    db.commit()
    db.refresh(new_hizmet)
    return new_hizmet


@router.put("/{hizmet_id}", response_model=HizmetResponse)
def update_hizmet(
    hizmet_id: int,
    hizmet_data: HizmetUpdate,
    db: Session = Depends(get_db),
):
    """
    Hizmet güncelle
    """
    hizmet = db.query(Hizmet).filter(Hizmet.Id == hizmet_id).first()
    if not hizmet:
        raise HTTPException(status_code=404, detail="Hizmet bulunamadı")
    
    # Kod benzersizliğini kontrol et (eğer değiştiriliyorsa)
    if hizmet_data.Kod and hizmet_data.Kod != hizmet.Kod:
        existing = db.query(Hizmet).filter(Hizmet.Kod == hizmet_data.Kod).first()
        if existing:
            raise HTTPException(status_code=400, detail="Bu kod zaten kullanılıyor")
    
    # Güncelleme
    update_data = hizmet_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(hizmet, key, value)
    
    db.commit()
    db.refresh(hizmet)
    return hizmet


@router.delete("/{hizmet_id}")
def delete_hizmet(hizmet_id: int, db: Session = Depends(get_db)):
    """
    Hizmet sil
    """
    hizmet = db.query(Hizmet).filter(Hizmet.Id == hizmet_id).first()
    if not hizmet:
        raise HTTPException(status_code=404, detail="Hizmet bulunamadı")
    
    db.delete(hizmet)
    db.commit()
    return {"message": "Hizmet başarıyla silindi"}
