"""
Admin kullanıcı oluşturma scripti
Email: admin@aliaport.com
Password: Admin1234!
"""
import sys
from pathlib import Path

# Backend root'u path'e ekle
backend_root = Path(__file__).parent
sys.path.insert(0, str(backend_root))

from sqlalchemy.orm import Session
from aliaport_api.config.database import SessionLocal, engine, Base
from aliaport_api.modules.auth.models import User, Role
from aliaport_api.modules.auth.utils import hash_password
from datetime import datetime

def create_admin_user():
    """Admin kullanıcı ve ADMIN rolü oluştur"""
    
    # Tabloları oluştur
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # ADMIN rolü kontrol/oluştur
        admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
        if not admin_role:
            admin_role = Role(
                name="ADMIN",
                description="System Administrator - Full Access",
                is_active=True
            )
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
            print(f"✅ ADMIN rolü oluşturuldu (ID: {admin_role.id})")
        else:
            print(f"ℹ️  ADMIN rolü zaten mevcut (ID: {admin_role.id})")
        
        # Admin kullanıcı kontrol
        admin_user = db.query(User).filter(User.email == "admin@aliaport.com").first()
        
        if admin_user:
            # Var olan kullanıcının şifresini güncelle
            admin_user.hashed_password = hash_password("Admin1234!")
            admin_user.is_active = True
            admin_user.role_id = admin_role.id
            admin_user.updated_at = datetime.utcnow()
            db.commit()
            print(f"✅ Admin kullanıcı güncellendi: admin@aliaport.com")
        else:
            # Yeni admin kullanıcı oluştur
            admin_user = User(
                email="admin@aliaport.com",
                username="admin",
                full_name="System Administrator",
                hashed_password=hash_password("Admin1234!"),
                role_id=admin_role.id,
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(f"✅ Admin kullanıcı oluşturuldu: admin@aliaport.com")
        
        print(f"\n🔐 Giriş Bilgileri:")
        print(f"   Email: admin@aliaport.com")
        print(f"   Şifre: Admin1234!")
        print(f"   Rol: {admin_role.name}")
        
        return True
        
    except Exception as e:
        print(f"❌ Hata: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Admin kullanıcı kurulumu başlıyor...")
    success = create_admin_user()
    if success:
        print("\n✅ Kurulum tamamlandı!")
        sys.exit(0)
    else:
        print("\n❌ Kurulum başarısız!")
        sys.exit(1)
