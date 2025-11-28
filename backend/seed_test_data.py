"""
Test Data Seeder for Aliaport
Creates sample data for testing WorkOrderPerson, Security, and Saha modules
"""
import sys
from pathlib import Path
from datetime import datetime, timedelta
import random

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from sqlalchemy.orm import Session
from aliaport_api.config.database import SessionLocal, engine, Base
from aliaport_api.modules.isemri.models import WorkOrderPerson
from aliaport_api.modules.guvenlik.models import GateLog
from aliaport_api.modules.auth.models import User


def get_admin_user(db: Session) -> User:
    """Get or create admin user"""
    admin = db.query(User).filter(User.email == "admin@aliaport.com").first()
    if not admin:
        print("❌ Admin user not found. Run bootstrap first!")
        sys.exit(1)
    return admin


def create_sample_persons(db: Session, admin: User, count: int = 10):
    """Create sample WorkOrderPerson records (without work orders for now)"""
    tc_samples = [
        "12345678901", "23456789012", "34567890123", 
        "45678901234", "56789012345", "67890123456"
    ]
    passport_samples = [
        "AB123456", "CD789012", "EF345678", 
        "GH901234", "IJ567890", "KL123456"
    ]
    names = [
        "Ahmet Yılmaz", "Mehmet Kaya", "Ayşe Demir",
        "Fatma Şahin", "Ali Çelik", "Zeynep Aydın",
        "Hasan Öztürk", "Emine Arslan", "Mustafa Koç"
    ]
    nationalities = ["TUR", "USA", "GBR", "DEU", "FRA"]
    
    persons = []
    # For testing, we'll use work_order_id = 1 (assuming it exists or NULL is allowed)
    for i in range(count):
        use_tc = random.choice([True, False])
        
        person = WorkOrderPerson(
            work_order_id=1,  # Dummy work order ID
            full_name=names[random.randint(0, len(names)-1)],
            tc_kimlik_no=tc_samples[i % len(tc_samples)] if use_tc else None,
            passport_no=passport_samples[i % len(passport_samples)] if not use_tc else None,
            nationality=nationalities[random.randint(0, len(nationalities)-1)],
            phone=f"+905{random.randint(300000000, 599999999)}",
            approved_by_security=random.choice([True, False, False]),  # Some pending
            approved_by_security_user_id=admin.id if random.choice([True, False]) else None,
            approved_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48)) if random.choice([True, False]) else None,
            security_notes=random.choice([None, "Kimlik kontrolü yapıldı", "Fotoğraf alındı"]),
            is_active=True,
            created_by=admin.id,
            created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 72))
        )
        db.add(person)
        persons.append(person)
    
    print(f"✅ Created {count} sample persons")
    db.flush()
    return persons


def create_sample_gate_logs(db: Session, admin: User, count: int = 10):
    """Create sample gate logs (vehicle entry/exit)"""
    plates = [
        "34ABC123", "06XYZ456", "35DEF789",
        "16GHI012", "07JKL345", "01MNO678"
    ]
    drivers = [
        "Ali Veli", "Mehmet Demir", "Ahmet Kaya",
        "Hasan Yılmaz", "Mustafa Öz", "İbrahim Ak"
    ]
    
    logs = []
    for i in range(count):
        entry_time = datetime.utcnow() - timedelta(hours=random.randint(1, 72))
        
        # Some vehicles still inside, some exited
        has_exited = random.choice([True, True, False])  # 2/3 exited
        exit_time = entry_time + timedelta(hours=random.randint(1, 8)) if has_exited else None
        
        # Calculate extra charge if over 4 hours
        extra_charge = 0.0
        if exit_time:
            duration_hours = (exit_time - entry_time).total_seconds() / 3600
            if duration_hours > 4:
                extra_charge = (duration_hours - 4) * 50  # 50 TL per hour
        
        log = GateLog(
            plate_number=plates[i % len(plates)],
            driver_name=drivers[i % len(drivers)],
            entry_time=entry_time,
            exit_time=exit_time,
            duration_minutes=int((exit_time - entry_time).total_seconds() / 60) if exit_time else None,
            extra_charge_amount=extra_charge if extra_charge > 0 else None,
            created_by=admin.id
        )
        db.add(log)
        logs.append(log)
    
    print(f"✅ Created {count} gate logs ({len([l for l in logs if l.exit_time])} exited, {len([l for l in logs if not l.exit_time])} still inside)")
    db.flush()
    return logs


def main():
    """Main seeder function"""
    print("\n" + "="*80)
    print("🌱 ALIAPORT TEST DATA SEEDER")
    print("="*80 + "\n")
    
    db = SessionLocal()
    try:
        # Get admin user
        admin = get_admin_user(db)
        print(f"👤 Using admin user: {admin.email}\n")
        
        # Create sample data
        print("👥 Creating persons...")
        persons = create_sample_persons(db, admin, count=10)
        
        print("\n🚗 Creating gate logs...")
        gate_logs = create_sample_gate_logs(db, admin, count=10)
        
        # Commit all changes
        db.commit()
        
        print("\n" + "="*80)
        print("✅ TEST DATA SEEDING COMPLETED!")
        print("="*80)
        print(f"📊 Summary:")
        print(f"   - Persons: {len(persons)}")
        print(f"   - Gate Logs: {len(gate_logs)}")
        print(f"   - Active Vehicles: {len([l for l in gate_logs if not l.exit_time])}")
        print(f"   - Pending Approvals: {len([p for p in persons if not p.approved_by_security])}")
        print("="*80 + "\n")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
