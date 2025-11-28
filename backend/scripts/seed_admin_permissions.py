"""
Seed admin permissions - one-time script to grant all permissions to ADMIN role
"""
import sys
sys.path.insert(0, r"c:\Aliaport\Aliaport_v3_1\backend")

from sqlalchemy.orm import Session
from aliaport_api.config.database import SessionLocal, Base, engine
from aliaport_api.modules.auth.models import Role, Permission


# Default permissions structure
DEFAULT_PERMISSIONS = [
    # Cari (Customer) permissions
    {"name": "cari:read", "resource": "cari", "action": "read", "description": "Cari kayıtlarını görüntüleme"},
    {"name": "cari:write", "resource": "cari", "action": "write", "description": "Cari oluşturma ve güncelleme"},
    {"name": "cari:delete", "resource": "cari", "action": "delete", "description": "Cari silme"},
    
    # İş Emri (Work Order) permissions
    {"name": "workorder:read", "resource": "workorder", "action": "read", "description": "İş emirlerini görüntüleme"},
    {"name": "workorder:write", "resource": "workorder", "action": "write", "description": "İş emri oluşturma ve güncelleme"},
    {"name": "workorder:delete", "resource": "workorder", "action": "delete", "description": "İş emri silme"},
    {"name": "workorder:approve", "resource": "workorder", "action": "approve", "description": "İş emri onaylama"},
    
    # Motorbot permissions
    {"name": "motorbot:read", "resource": "motorbot", "action": "read", "description": "Motorbot kayıtlarını görüntüleme"},
    {"name": "motorbot:write", "resource": "motorbot", "action": "write", "description": "Motorbot oluşturma ve güncelleme"},
    {"name": "motorbot:delete", "resource": "motorbot", "action": "delete", "description": "Motorbot silme"},
    
    # Tarife (Pricing) permissions
    {"name": "tarife:read", "resource": "tarife", "action": "read", "description": "Tarifeleri görüntüleme"},
    {"name": "tarife:write", "resource": "tarife", "action": "write", "description": "Tarife oluşturma ve güncelleme"},
    {"name": "tarife:delete", "resource": "tarife", "action": "delete", "description": "Tarife silme"},
    
    # Sefer (Trip) permissions
    {"name": "sefer:read", "resource": "sefer", "action": "read", "description": "Seferleri görüntüleme"},
    {"name": "sefer:write", "resource": "sefer", "action": "write", "description": "Sefer oluşturma ve güncelleme"},
    {"name": "sefer:delete", "resource": "sefer", "action": "delete", "description": "Sefer silme"},
    
    # Barınma (Accommodation) permissions
    {"name": "barinma:read", "resource": "barinma", "action": "read", "description": "Barınma kayıtlarını görüntüleme"},
    {"name": "barinma:write", "resource": "barinma", "action": "write", "description": "Barınma oluşturma ve güncelleme"},
    {"name": "barinma:approve", "resource": "barinma", "action": "approve", "description": "Barınma kontratı onaylama"},
    
    # Güvenlik (Security) permissions
    {"name": "security:read", "resource": "security", "action": "read", "description": "Güvenlik loglarını görüntüleme"},
    {"name": "security:write", "resource": "security", "action": "write", "description": "Güvenlik kayıtları oluşturma"},
    {"name": "security:gate", "resource": "security", "action": "gate", "description": "Gate giriş/çıkış işlemleri"},
    
    # Raporlar (Reports) permissions
    {"name": "reports:read", "resource": "reports", "action": "read", "description": "Raporları görüntüleme"},
    {"name": "reports:export", "resource": "reports", "action": "export", "description": "Rapor dışa aktarma"},
    
    # Parametreler (Parameters) permissions
    {"name": "parameters:read", "resource": "parameters", "action": "read", "description": "Parametreleri görüntüleme"},
    {"name": "parameters:write", "resource": "parameters", "action": "write", "description": "Parametreleri güncelleme"},
    
    # Admin wildcard permissions
    {"name": "admin:*", "resource": "admin", "action": "*", "description": "Tüm admin işlemleri (wildcard)"},
]


def main():
    """Seed permissions and grant all to ADMIN role."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Create permissions
        print("🌱 Creating permissions...")
        created_perms = 0
        for perm_data in DEFAULT_PERMISSIONS:
            existing = db.query(Permission).filter(Permission.name == perm_data["name"]).first()
            if not existing:
                permission = Permission(**perm_data)
                db.add(permission)
                created_perms += 1
        
        db.commit()
        print(f"✅ Created {created_perms} new permissions (total: {len(DEFAULT_PERMISSIONS)})")
        
        # 2. Get ADMIN role
        admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
        if not admin_role:
            print("❌ ADMIN role not found!")
            return
        
        # 3. Grant all permissions to ADMIN
        print(f"\n🔐 Granting all permissions to ADMIN role...")
        admin_role.permissions.clear()
        
        all_permissions = db.query(Permission).all()
        for permission in all_permissions:
            admin_role.permissions.append(permission)
        
        db.commit()
        print(f"✅ ADMIN role now has {len(all_permissions)} permissions")
        
        # 4. Verify
        db.refresh(admin_role)
        print(f"\n📋 ADMIN role permissions:")
        for perm in admin_role.permissions:
            print(f"   • {perm.name} - {perm.description}")
        
        print("\n🎉 Admin permissions seed complete!")
        
    except Exception as e:
        print(f"❌ Seed failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
