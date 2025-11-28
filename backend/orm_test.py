import sys
sys.path.insert(0, '.')

from sqlalchemy.orm import Session
from aliaport_api.core.database import SessionLocal
from aliaport_api.modules.dijital_arsiv.models import PortalEmployee, PortalVehicle, PortalUser

db = SessionLocal()

# Portal user
user = db.query(PortalUser).filter(PortalUser.email == "test@aliaport.com").first()
print(f"Portal User ORM: id={user.id}, email={user.email}, cari_id={user.cari_id}")

# Employees
employees = db.query(PortalEmployee).filter(PortalEmployee.cari_id == user.cari_id).limit(5).all()
print(f"\n=== EMPLOYEES ORM (cari_id={user.cari_id}) ===")
for emp in employees:
    print(f"  {emp.id}: {emp.full_name} ({emp.position})")

# Vehicles
vehicles = db.query(PortalVehicle).filter(PortalVehicle.cari_id == user.cari_id).limit(5).all()
print(f"\n=== VEHICLES ORM (cari_id={user.cari_id}) ===")
for veh in vehicles:
    print(f"  {veh.id}: {veh.plaka} - {veh.marka} {veh.model}")

db.close()
