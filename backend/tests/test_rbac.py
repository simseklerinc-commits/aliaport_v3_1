"""
Quick test script for RBAC dependencies.
Creates a test user, assigns roles, and tests permission checks.

Usage:
    python -m tests.test_rbac
"""
from sqlalchemy.orm import Session
from aliaport_api.config.database import SessionLocal
from aliaport_api.modules.auth.models import User, Role, Permission
from aliaport_api.modules.auth.dependencies import require_role, require_permission
from aliaport_api.modules.auth.utils import hash_password


def test_rbac():
    """Test RBAC dependencies"""
    db = SessionLocal()
    
    try:
        print("\n🧪 Testing RBAC dependencies...\n")
        
        # 1. Check if permissions exist
        perms = db.query(Permission).all()
        print(f"✓ Total permissions: {len(perms)}")
        print(f"  Sample: {perms[0].name if perms else 'None'}")
        
        # 2. Check if roles exist
        roles = db.query(Role).all()
        print(f"\n✓ Total roles: {len(roles)}")
        for role in roles:
            perm_count = len(role.permissions)
            print(f"  - {role.name}: {perm_count} permissions")
        
        # 3. Create test user if not exists
        test_email = "rbac.test@aliaport.com"
        test_user = db.query(User).filter(User.email == test_email).first()
        
        if not test_user:
            test_user = User(
                email=test_email,
                hashed_password=hash_password("TestPass123!"),
                full_name="RBAC Test User",
                is_active=True,
                is_superuser=False
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"\n✓ Created test user: {test_email}")
        else:
            print(f"\n✓ Test user exists: {test_email}")
        
        # 4. Assign OPERASYON role
        operasyon_role = db.query(Role).filter(Role.name == "OPERASYON").first()
        if operasyon_role and operasyon_role not in test_user.roles:
            test_user.roles.append(operasyon_role)
            db.commit()
            print(f"✓ Assigned OPERASYON role to test user")
        
        # 5. List user permissions
        user_perms = []
        for role in test_user.roles:
            for perm in role.permissions:
                user_perms.append(perm.name)
        
        print(f"\n✓ Test user permissions ({len(user_perms)}):")
        for perm in sorted(user_perms)[:10]:
            print(f"  - {perm}")
        if len(user_perms) > 10:
            print(f"  ... and {len(user_perms) - 10} more")
        
        # 6. Test permission checks
        print("\n📋 Permission check tests:")
        
        # Should PASS (OPERASYON has cari:write)
        has_cari_write = "cari:write" in user_perms
        print(f"  - cari:write: {'✓ PASS' if has_cari_write else '✗ FAIL'}")
        
        # Should PASS (OPERASYON has workorder:approve)
        has_wo_approve = "workorder:approve" in user_perms
        print(f"  - workorder:approve: {'✓ PASS' if has_wo_approve else '✗ FAIL'}")
        
        # Should FAIL (OPERASYON doesn't have admin:*)
        has_admin = "admin:*" in user_perms
        print(f"  - admin:* (wildcard): {'✗ UNEXPECTED' if has_admin else '✓ PASS (should fail)'}")
        
        # 7. Test wildcard permission
        admin_role = db.query(Role).filter(Role.name == "SISTEM_YONETICISI").first()
        if admin_role:
            admin_perms = [p.name for p in admin_role.permissions]
            has_wildcard = "admin:*" in admin_perms
            print(f"\n✓ SISTEM_YONETICISI has admin:*: {has_wildcard}")
        
        print("\n✅ RBAC test complete!\n")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    test_rbac()
