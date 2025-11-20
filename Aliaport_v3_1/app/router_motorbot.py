from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models_motorbot import Motorbot
from .schemas_motorbot import (
    MotorbotCreate,
    MotorbotUpdate,
    MotorbotOut,
)


router = APIRouter(prefix="/api/motorbot", tags=["Motorbot"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[MotorbotOut])
def list_motorbotlar(db: Session = Depends(get_db)):
    return db.query(Motorbot).order_by(Motorbot.Kod).all()


@router.get("/{motorbot_id}", response_model=MotorbotOut)
def get_motorbot(motorbot_id: int, db: Session = Depends(get_db)):
    obj = db.query(Motorbot).get(motorbot_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Motorbot bulunamadı")
    return obj


@router.post("/", response_model=MotorbotOut, status_code=status.HTTP_201_CREATED)
def create_motorbot(payload: MotorbotCreate, db: Session = Depends(get_db)):
    obj = Motorbot(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{motorbot_id}", response_model=MotorbotOut)
def update_motorbot(
    motorbot_id: int,
    payload: MotorbotUpdate,
    db: Session = Depends(get_db),
):
    obj = db.query(Motorbot).get(motorbot_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Motorbot bulunamadı")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(obj, field, value)

    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{motorbot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_motorbot(motorbot_id: int, db: Session = Depends(get_db)):
    obj = db.query(Motorbot).get(motorbot_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Motorbot bulunamadı")
    db.delete(obj)
    db.commit()
    return None
