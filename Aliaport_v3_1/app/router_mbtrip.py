from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models_motorbot import MbTrip
from .schemas_motorbot import MbTripCreate, MbTripUpdate, MbTripOut


router = APIRouter(prefix="/api/mb-trip", tags=["MbTrip"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[MbTripOut])
def list_trips(db: Session = Depends(get_db)):
    return (
        db.query(MbTrip)
        .order_by(MbTrip.SeferTarihi.desc(), MbTrip.Id.desc())
        .all()
    )


@router.get("/{trip_id}", response_model=MbTripOut)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    obj = db.query(MbTrip).get(trip_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Sefer kaydı bulunamadı")
    return obj


@router.post("/", response_model=MbTripOut, status_code=status.HTTP_201_CREATED)
def create_trip(payload: MbTripCreate, db: Session = Depends(get_db)):
    obj = MbTrip(**payload.dict())
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
    obj = db.query(MbTrip).get(trip_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Sefer kaydı bulunamadı")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(obj, field, value)

    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    obj = db.query(MbTrip).get(trip_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Sefer kaydı bulunamadı")
    db.delete(obj)
    db.commit()
    return None
