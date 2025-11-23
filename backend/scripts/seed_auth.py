# backend/scripts/seed_auth.py
"""
Seed script: Create roles, permissions, and admin user for authentication system.

Run with: python -m scripts.seed_auth
"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from aliaport_api.config.database import SessionLocal, engine, Base
from aliaport_api.modules.auth.models import User, Role, Permission, user_roles, role_permissions
from aliaport_api.modules.auth.utils import hash_password
from datetime import datetime


# ============================================
# Role Definitions (Aliaport RBAC)
# ============================================

ROLES = [
    {
        "name": "SISTEM_YONETICISI",
        "description": "Sistem yöneticisi - Tüm erişimler",
    },
    {
        "name": "OPERASYON",
        "description": "Operasyon yöneticisi - Cari, Motorbot, Barınma, İş Emri",
    },
    {
        "name": "GUVENLIK",
        "description": "Güvenlik personeli - Gate kontrolleri",
    },
    {
        "name": "FINANS",
        "description": "Finans yöneticisi - Kurlar, Tarife, Fatura",
    },
    {
        "name": "SAHA",
        "description": "Saha personeli - WorkLog, İş Emri",
    },
    {
        "name": "READONLY",
        "description": "Salt okuma - Tüm modüller için okuma yetkisi",
    },
]


# ============================================
# Permission Definitions (Resource:Action)
# ============================================

PERMISSIONS = [
    # Cari Permissions
    {"name": "cari:read", "resource": "cari", "action": "read", "description": "Cari okuma"},
    {"name": "cari:write", "resource": "cari", "action": "write", "description": "Cari oluşturma/güncelleme"},
    {"name": "cari:delete", "resource": "cari", "action": "delete", "description": "Cari silme"},
    
    # Motorbot Permissions
    {"name": "motorbot:read", "resource": "motorbot", "action": "read", "description": "Motorbot okuma"},
    {"name": "motorbot:write", "resource": "motorbot", "action": "write", "description": "Motorbot oluşturma/güncelleme"},
    {"name": "motorbot:delete", "resource": "motorbot", "action": "delete", "description": "Motorbot silme"},
    
    # Barınma Permissions
    {"name": "barinma:read", "resource": "barinma", "action": "read", "description": "Barınma kontratları okuma"},
    {"name": "barinma:write", "resource": "barinma", "action": "write", "description": "Barınma kontratları oluşturma/güncelleme"},
    {"name": "barinma:delete", "resource": "barinma", "action": "delete", "description": "Barınma kontratları silme"},
    
    # İş Emri Permissions
    {"name": "workorder:read", "resource": "workorder", "action": "read", "description": "İş emri okuma"},
    {"name": "workorder:write", "resource": "workorder", "action": "write", "description": "İş emri oluşturma/güncelleme"},
    {"name": "workorder:delete", "resource": "workorder", "action": "delete", "description": "İş emri silme"},
    
    # Kurlar Permissions
    {"name": "kurlar:read", "resource": "kurlar", "action": "read", "description": "Döviz kurları okuma"},
    {"name": "kurlar:write", "resource": "kurlar", "action": "write", "description": "Döviz kurları oluşturma/güncelleme"},
    {"name": "kurlar:delete", "resource": "kurlar", "action": "delete", "description": "Döviz kurları silme"},
    
    # Tarife Permissions
    {"name": "tarife:read", "resource": "tarife", "action": "read", "description": "Fiyat listeleri okuma"},
    {"name": "tarife:write", "resource": "tarife", "action": "write", "description": "Fiyat listeleri oluşturma/güncelleme"},
    {"name": "tarife:delete", "resource": "tarife", "action": "delete", "description": "Fiyat listeleri silme"},
    
    # Güvenlik Permissions
    {"name": "guvenlik:read", "resource": "guvenlik", "action": "read", "description": "Gate log okuma"},
    {"name": "guvenlik:write", "resource": "guvenlik", "action": "write", "description": "Gate log oluşturma/güncelleme"},
    {"name": "guvenlik:delete", "resource": "guvenlik", "action": "delete", "description": "Gate log silme"},
    
    # Saha Permissions
    {"name": "saha:read", "resource": "saha", "action": "read", "description": "WorkLog okuma"},
    {"name": "saha:write", "resource": "saha", "action": "write", "description": "WorkLog oluşturma/güncelleme"},
    {"name": "saha:delete", "resource": "saha", "action": "delete", "description": "WorkLog silme"},
    
    # Parametre Permissions
    {"name": "parametre:read", "resource": "parametre", "action": "read", "description": "Parametre okuma"},
    {"name": "parametre:write", "resource": "parametre", "action": "write", "description": "Parametre oluşturma/güncelleme"},
    {"name": "parametre:delete", "resource": "parametre", "action": "delete", "description": "Parametre silme"},
    
    # Hizmet Permissions
    {"name": "hizmet:read", "resource": "hizmet", "action": "read", "description": "Hizmet okuma"},
    {"name": "hizmet:write", "resource": "hizmet", "action": "write", "description": "Hizmet oluşturma/güncelleme"},
    {"name": "hizmet:delete", "resource": "hizmet", "action": "delete", "description": "Hizmet silme"},
]


# ============================================
# Role-Permission Matrix
# ============================================

ROLE_PERMISSION_MAP = {
    "SISTEM_YONETICISI": ["*"],  # All permissions
    "OPERASYON": [
        "cari:*", "motorbot:*", "barinma:*", "workorder:*", 
        "hizmet:*", "parametre:read", "saha:read"
    ],
    "GUVENLIK": [
        "guvenlik:*", "motorbot:read", "cari:read"
    ],
    "FINANS": [
        "kurlar:*", "tarife:*", "cari:*", "hizmet:read", "workorder:read"
    ],
    "SAHA": [
        "saha:*", "workorder:*", "motorbot:read", "cari:read"
    ],
    "READONLY": [
        "cari:read", "motorbot:read", "barinma:read", "workorder:read",
        "kurlar:read", "tarife:read", "guvenlik:read", "saha:read",
        "parametre:read", "hizmet:read"
    ],
}


def expand_permission_wildcard(pattern: str, all_permissions: list) -> list:
    """Expand wildcard patterns (e.g., 'cari:*') to actual permissions."""
    if pattern == "*":
        return all_permissions
    
    if pattern.endswith(":*"):
        resource = pattern[:-2]
        return [p for p in all_permissions if p.startswith(f"{resource}:")]
    
    return [pattern]


def seed_auth_data(db: Session):
    """Seed roles, permissions, and admin user."""
    
    print("🌱 Starting auth seed...")
    
    # Create permissions
    print("\n📋 Creating permissions...")
    permission_objs = {}
    for perm_data in PERMISSIONS:
        perm = db.query(Permission).filter(Permission.name == perm_data["name"]).first()
        if not perm:
            perm = Permission(**perm_data)
            db.add(perm)
            db.flush()  # Get ID
            print(f"  ✅ Created permission: {perm.name}")
        else:
            print(f"  ⏭️  Permission exists: {perm.name}")
        permission_objs[perm.name] = perm
    
    db.commit()
    
    # Get all permission names for wildcard expansion
    all_perm_names = [p["name"] for p in PERMISSIONS]
    
    # Create roles
    print("\n👥 Creating roles...")
    role_objs = {}
    for role_data in ROLES:
        role = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not role:
            role = Role(**role_data)
            db.add(role)
            db.flush()
            print(f"  ✅ Created role: {role.name}")
        else:
            print(f"  ⏭️  Role exists: {role.name}")
        role_objs[role.name] = role
    
    db.commit()
    
    # Assign permissions to roles
    print("\n🔗 Assigning permissions to roles...")
    for role_name, permission_patterns in ROLE_PERMISSION_MAP.items():
        role = role_objs[role_name]
        
        # Expand wildcards
        assigned_perms = []
        for pattern in permission_patterns:
            expanded = expand_permission_wildcard(pattern, all_perm_names)
            assigned_perms.extend(expanded)
        
        # Assign permissions
        role.permissions = [permission_objs[pname] for pname in assigned_perms if pname in permission_objs]
        print(f"  ✅ {role.name}: {len(role.permissions)} permissions")
    
    db.commit()
    
    # Create admin user
    print("\n👤 Creating admin user...")
    admin_email = "admin@aliaport.com"
    admin = db.query(User).filter(User.email == admin_email).first()
    
    if not admin:
        admin = User(
            email=admin_email,
            hashed_password=hash_password("Admin123!"),  # Default password
            full_name="Sistem Yöneticisi",
            is_active=True,
            is_superuser=True,
        )
        admin.roles = [role_objs["SISTEM_YONETICISI"]]
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"  ✅ Created admin user: {admin.email}")
        print(f"     Password: Admin123!")
        print(f"     Role: SISTEM_YONETICISI")
        print(f"     Superuser: True")
    else:
        print(f"  ⏭️  Admin user exists: {admin.email}")
    
    # Create sample users
    print("\n👥 Creating sample users...")
    sample_users = [
        {
            "email": "operasyon@aliaport.com",
            "password": "Operasyon123!",
            "full_name": "Operasyon Yöneticisi",
            "role": "OPERASYON"
        },
        {
            "email": "guvenlik@aliaport.com",
            "password": "Guvenlik123!",
            "full_name": "Güvenlik Personeli",
            "role": "GUVENLIK"
        },
        {
            "email": "finans@aliaport.com",
            "password": "Finans123!",
            "full_name": "Finans Yöneticisi",
            "role": "FINANS"
        },
    ]
    
    for user_data in sample_users:
        user = db.query(User).filter(User.email == user_data["email"]).first()
        if not user:
            user = User(
                email=user_data["email"],
                hashed_password=hash_password(user_data["password"]),
                full_name=user_data["full_name"],
                is_active=True,
                is_superuser=False,
            )
            user.roles = [role_objs[user_data["role"]]]
            db.add(user)
            db.flush()
            print(f"  ✅ Created user: {user.email} (Role: {user_data['role']})")
        else:
            print(f"  ⏭️  User exists: {user.email}")
    
    db.commit()
    
    # Summary
    print("\n" + "="*60)
    print("✅ Auth seed completed!")
    print("="*60)
    print(f"Roles created: {len(ROLES)}")
    print(f"Permissions created: {len(PERMISSIONS)}")
    print(f"Admin user: admin@aliaport.com (Password: Admin123!)")
    print(f"Sample users: {len(sample_users)}")
    print("\n🔐 Login credentials:")
    print("  admin@aliaport.com / Admin123!")
    print("  operasyon@aliaport.com / Operasyon123!")
    print("  guvenlik@aliaport.com / Guvenlik123!")
    print("  finans@aliaport.com / Finans123!")
    print("="*60)


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_auth_data(db)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()
