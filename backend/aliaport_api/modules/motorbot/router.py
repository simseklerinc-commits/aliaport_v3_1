# backend/aliaport_api/modules/motorbot/router.py
# motorbot.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...config.database import get_db
from .models import Motorbot, MbTrip
from .schemas import MotorbotCreate, MotorbotUpdate, MotorbotOut, MbTripCreate, MbTripUpdate, MbTripOut


router = APIRouter(prefix="/api/motorbot", tags=["Motorbot"])


@router.get("/", response_model=List[MotorbotOut])
def list_motorbotlar(db: Session = Depends(get_db)):
    return db.query(Motorbot).order_by(Motorbot.Kod).all()


@router.get("/{motorbot_id}", response_model=MotorbotOut)
def get_motorbot(motorbot_id: int, db: Session = Depends(get_db)):
    obj = db.get(Motorbot, motorbot_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Motorbot bulunamadı")
    return obj


@router.post("/", response_model=MotorbotOut, status_code=status.HTTP_201_CREATED)
def create_motorbot(payload: MotorbotCreate, db: Session = Depends(get_db)):
    # CreatedAt otomatik olarak func.now() ile set edilecek
    obj = Motorbot(**payload.model_dump())
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
    obj = db.get(Motorbot, motorbot_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Motorbot bulunamadı")

    # UpdatedAt otomatik olarak func.now() ile güncellenecek
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)

    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{motorbot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_motorbot(motorbot_id: int, db: Session = Depends(get_db)):
    obj = db.get(Motorbot, motorbot_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Motorbot bulunamadı")
    db.delete(obj)
    db.commit()
    return None


# === MbTrip (Sefer) Endpoints ===

@router.get("/sefer", response_model=List[MbTripOut], tags=["Sefer"])
def list_trips(db: Session = Depends(get_db)):
    return (
        db.query(MbTrip)
        .order_by(MbTrip.SeferTarihi.desc(), MbTrip.Id.desc())
        .all()
    )


@router.get("/sefer/{trip_id}", response_model=MbTripOut, tags=["Sefer"])
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    obj = db.get(MbTrip, trip_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Sefer kaydı bulunamadı")
    return obj


@router.post("/sefer", response_model=MbTripOut, status_code=status.HTTP_201_CREATED, tags=["Sefer"])
def create_trip(payload: MbTripCreate, db: Session = Depends(get_db)):
    obj = MbTrip(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/sefer/{trip_id}", response_model=MbTripOut, tags=["Sefer"])
def update_trip(
    trip_id: int,
    payload: MbTripUpdate,
    db: Session = Depends(get_db),
):
    obj = db.get(MbTrip, trip_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Sefer kaydı bulunamadı")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)

    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/sefer/{trip_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Sefer"])
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    obj = db.get(MbTrip, trip_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Sefer kaydı bulunamadı")
    db.delete(obj)
    db.commit()
    return None
