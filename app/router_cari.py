# app/router_cari.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .database import get_db
from .models import Cari
from .schemas import CariCreate, CariUpdate, CariOut

router = APIRouter(prefix="/api/cari", tags=["Cari"])


@router.get("/", response_model=List[CariOut])
def list_cari(db: Session = Depends(get_db)):
    return db.query(Cari).order_by(Cari.Unvan).all()


@router.get("/{cari_id}", response_model=CariOut)
def get_cari(cari_id: int, db: Session = Depends(get_db)):
    obj = db.get(Cari, cari_id)
    if not obj:
        raise HTTPException(404, "Cari bulunamadı")
    return obj


@router.post("/", response_model=CariOut)
def create_cari(payload: CariCreate, db: Session = Depends(get_db)):
    if db.query(Cari).filter(Cari.CariKod == payload.CariKod).first():
        raise HTTPException(400, "Bu CariKod zaten kayıtlı")
    obj = Cari(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{cari_id}", response_model=CariOut)
def update_cari(cari_id: int, payload: CariUpdate, db: Session = Depends(get_db)):
    obj = db.get(Cari, cari_id)
    if not obj:
        raise HTTPException(404, "Cari bulunamadı")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{cari_id}")
def delete_cari(cari_id: int, db: Session = Depends(get_db)):
    obj = db.get(Cari, cari_id)
    if not obj:
        raise HTTPException(404, "Cari bulunamadı")
    db.delete(obj)
    db.commit()
    return {"ok": True}
