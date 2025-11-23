# backend/aliaport_api/modules/sefer/router.py
# mbtrip.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...config.database import get_db
from .models import MbTrip
from .schemas import MbTripCreate, MbTripUpdate, MbTripOut


router = APIRouter(prefix="/api/mb-trip", tags=["MbTrip"])


@router.get("/", response_model=List[MbTripOut])
def list_trips(db: Session = Depends(get_db)):
    return (
        db.query(MbTrip)
        .order_by(MbTrip.SeferTarihi.desc(), MbTrip.Id.desc())
        .all()
    )


@router.get("/{trip_id}", response_model=MbTripOut)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    obj = db.get(MbTrip, trip_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Sefer kaydı bulunamadı")
    return obj


@router.post("/", response_model=MbTripOut, status_code=status.HTTP_201_CREATED)
def create_trip(payload: MbTripCreate, db: Session = Depends(get_db)):
    # CreatedAt otomatik olarak func.now() ile set edilecek
    obj = MbTrip(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{trip_id}", response_model=MbTripOut)
def update_trip(
    trip_id: int,
    payload: MbTripUpdate,
    db: Session = Depends(get_db),
):
    obj = db.get(MbTrip, trip_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Sefer kaydı bulunamadı")

    # UpdatedAt otomatik olarak func.now() ile güncellenecek
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)

    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    obj = db.get(MbTrip, trip_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Sefer kaydı bulunamadı")
    db.delete(obj)
    db.commit()
    return None
