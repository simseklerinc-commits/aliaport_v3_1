"""
Admin endpoint: Mevcut araçlar için default document kayıtları oluşturur
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .config.database import get_db
from .modules.dijital_arsiv.models import PortalVehicle
from .modules.dijital_arsiv.vehicle_documents import (
    create_default_vehicle_documents, 
    compute_vehicle_status
)

router = APIRouter(tags=["admin"])

@router.post("/admin/vehicles/init-documents")
def initialize_vehicle_documents(db: Session = Depends(get_db)):
    """Mevcut tüm araçlar için default vehicle document kayıtları oluşturur"""
    
    vehicles = db.query(PortalVehicle).all()
    results = []
    
    for vehicle in vehicles:
        # Default document'ları oluştur (duplicate olmadan)
        create_default_vehicle_documents(db, vehicle.id)
        
        # Status hesapla
        status = compute_vehicle_status(db, vehicle.id)
        
        results.append({
            "vehicle_id": vehicle.id,
            "plaka": vehicle.plaka,
            "status": status
        })
    
    return {
        "message": f"{len(vehicles)} araç için document kayıtları oluşturuldu",
        "vehicles": results
    }
