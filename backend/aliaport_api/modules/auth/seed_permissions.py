"""
Seed script for common permissions and roles.
Run this after initial migration to populate default RBAC structure.

Usage:
    python -m aliaport_api.modules.auth.seed_permissions
"""
from sqlalchemy.orm import Session
from ...config.database import SessionLocal
from .models import Role, Permission, user_roles, role_permissions


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


# Default roles with permission assignments
DEFAULT_ROLES = [
    {
        "name": "SISTEM_YONETICISI",
        "description": "Tam yetki - tüm modüllere erişim",
        "permissions": ["admin:*"]  # Wildcard grants everything
    },
    {
        "name": "OPERASYON",
        "description": "İş emri, sefer, barınma yönetimi",
        "permissions": [
            "cari:read", "cari:write",
            "workorder:read", "workorder:write", "workorder:approve",
            "sefer:read", "sefer:write",
            "barinma:read", "barinma:write", "barinma:approve",
            "motorbot:read", "motorbot:write",
            "reports:read", "reports:export",
        ]
    },
    {
        "name": "FINANS",
        "description": "Cari, tarife, fatura yönetimi",
        "permissions": [
            "cari:read", "cari:write",
            "tarife:read", "tarife:write",
            "workorder:read",
            "reports:read", "reports:export",
        ]
    },
    {
        "name": "GUVENLIK",
        "description": "Gate giriş/çıkış, güvenlik işlemleri",
        "permissions": [
            "security:read", "security:write", "security:gate",
            "barinma:read",
            "sefer:read",
        ]
    },
    {
        "name": "READONLY",
        "description": "Salt okuma yetkisi - tüm modüller",
        "permissions": [
            "cari:read",
            "workorder:read",
            "sefer:read",
            "barinma:read",
            "motorbot:read",
            "tarife:read",
            "security:read",
            "reports:read",
            "parameters:read",
        ]
    },
]


def seed_permissions(db: Session):
    """Create default permissions if they don't exist."""
    print("🌱 Seeding permissions...")
    created = 0
    
    for perm_data in DEFAULT_PERMISSIONS:
        existing = db.query(Permission).filter(Permission.name == perm_data["name"]).first()
        if not existing:
            permission = Permission(**perm_data)
            db.add(permission)
            created += 1
    
    db.commit()
    print(f"✅ Created {created} new permissions (total: {len(DEFAULT_PERMISSIONS)})")


def seed_roles(db: Session):
    """Create default roles and assign permissions."""
    print("🌱 Seeding roles...")
    created = 0
    
    for role_data in DEFAULT_ROLES:
        existing = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing:
            # Create role
            role = Role(
                name=role_data["name"],
                description=role_data["description"],
                is_active=True
            )
            db.add(role)
            db.flush()  # Get role.id
            
            # Assign permissions
            for perm_name in role_data["permissions"]:
                permission = db.query(Permission).filter(Permission.name == perm_name).first()
                if permission:
                    role.permissions.append(permission)
            
            created += 1
        else:
            # Update existing role permissions
            existing.permissions.clear()
            for perm_name in role_data["permissions"]:
                permission = db.query(Permission).filter(Permission.name == perm_name).first()
                if permission:
                    existing.permissions.append(permission)
    
    db.commit()
    print(f"✅ Created/updated {created} roles (total: {len(DEFAULT_ROLES)})")


def main():
    """Run all seed operations."""
    db = SessionLocal()
    try:
        seed_permissions(db)
        seed_roles(db)
        print("\n🎉 RBAC seed complete!")
    except Exception as e:
        print(f"❌ Seed failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
