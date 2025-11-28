"""
Mevcut araçlar için default vehicle document kayıtları oluşturur
"""
import sys
sys.path.insert(0, '.')

from aliaport_api.core.database import SessionLocal
from aliaport_api.modules.dijital_arsiv.models import PortalVehicle
from aliaport_api.modules.dijital_arsiv.vehicle_documents import create_default_vehicle_documents, compute_vehicle_status

def main():
    db = SessionLocal()
    
    try:
        vehicles = db.query(PortalVehicle).all()
        print(f"Toplam {len(vehicles)} araç bulundu\n")
        
        for vehicle in vehicles:
            # Default document'ları oluştur
            create_default_vehicle_documents(db, vehicle.id)
            
            # Status hesapla
            status = compute_vehicle_status(db, vehicle.id)
            print(f"  {vehicle.plaka}: {status}")
        
        print("\n✅ Tamamlandı!")
        
    except Exception as e:
        print(f"❌ Hata: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
