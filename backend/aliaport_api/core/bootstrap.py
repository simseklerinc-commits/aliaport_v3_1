"""
Application Bootstrap
Uygulama başlangıcında çalışan otomatik kurulum işlemleri
"""
import os
from sqlalchemy.orm import Session
from ..config.database import SessionLocal, engine, Base
from ..modules.auth.models import User, Role, Permission
from ..modules.auth.utils import hash_password
from ..modules.dijital_arsiv.models import PortalUser
from ..modules.cari.models import Cari
from datetime import datetime


def ensure_admin_user(db: Session) -> User:
    """
    Admin kullanıcısının var olduğundan emin olur.
    Yoksa .env'den alınan bilgilerle oluşturur.
    """
    admin_email = os.getenv("ADMIN_EMAIL", "admin@aliaport.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "Admin1234!")
    admin_fullname = os.getenv("ADMIN_FULL_NAME", "Sistem Yöneticisi")
    
    # Admin kullanıcısını kontrol et
    admin_user = db.query(User).filter(User.email == admin_email).first()
    
    if not admin_user:
        # Kullanıcı yoksa oluştur
        admin_user = User(
            email=admin_email,
            hashed_password=hash_password(admin_password),
            full_name=admin_fullname,
            is_active=True,
            is_superuser=True,
            created_at=datetime.utcnow()
        )
        db.add(admin_user)
        db.flush()
        print(f"✅ Admin kullanıcı oluşturuldu: {admin_email}")
    else:
        # Kullanıcı varsa şifreyi güncelle (development için)
        if os.getenv("DEBUG", "False").lower() == "true":
            admin_user.hashed_password = hash_password(admin_password)
            admin_user.is_active = True
            admin_user.is_superuser = True
            admin_user.updated_at = datetime.utcnow()
            print(f"ℹ️  Admin kullanıcı güncellendi: {admin_email}")
    
    return admin_user


def ensure_admin_roles(db: Session, admin_user: User):
    """
    ADMIN ve SISTEM_YONETICISI rollerinin var olduğundan emin olur.
    Admin kullanıcısına bu rolleri atar.
    """
    role_names = ["ADMIN", "SISTEM_YONETICISI"]
    
    for role_name in role_names:
        role = db.query(Role).filter(Role.name == role_name).first()
        
        if not role:
            role = Role(
                name=role_name,
                description=f"{role_name} rolü",
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(role)
            db.flush()
            print(f"✅ Rol oluşturuldu: {role_name}")
        
        # Rolü kullanıcıya ekle (yoksa)
        if role not in admin_user.roles:
            admin_user.roles.append(role)
            print(f"✅ {role_name} rolü admin kullanıcıya eklendi")


def ensure_basic_permissions(db: Session):
    """
    Temel permission'ların var olduğundan emin olur.
    """
    basic_permissions = [
        {"name": "admin:*", "resource": "admin", "action": "*", "description": "Tüm admin işlemleri"},
        {"name": "cari:read", "resource": "cari", "action": "read", "description": "Cari okuma"},
        {"name": "cari:write", "resource": "cari", "action": "write", "description": "Cari yazma"},
        {"name": "cari:delete", "resource": "cari", "action": "delete", "description": "Cari silme"},
    ]
    
    created_count = 0
    for perm_data in basic_permissions:
        existing = db.query(Permission).filter(Permission.name == perm_data["name"]).first()
        if not existing:
            permission = Permission(**perm_data)
            db.add(permission)
            created_count += 1
    
    if created_count > 0:
        print(f"✅ {created_count} temel permission oluşturuldu")
    
    return created_count


def link_admin_permissions(db: Session):
    """
    ADMIN rolüne tüm permission'ları bağlar.
    """
    admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
    
    if not admin_role:
        return
    
    # Tüm permission'ları al
    all_permissions = db.query(Permission).all()
    
    # ADMIN rolünün mevcut permission'ları
    current_perms = set(p.id for p in admin_role.permissions)
    all_perm_ids = set(p.id for p in all_permissions)
    
    # Eksik permission'ları ekle
    missing_perms = all_perm_ids - current_perms
    
    if missing_perms:
        for perm in all_permissions:
            if perm.id in missing_perms and perm not in admin_role.permissions:
                admin_role.permissions.append(perm)
        print(f"✅ ADMIN rolüne {len(missing_perms)} permission eklendi")


def ensure_test_portal_user(db: Session):
    """
    Test portal kullanıcısının (test@aliaport.com) var olduğundan emin olur.
    Şifre: Test1234!
    """
    test_email = "test@aliaport.com"
    test_password = "Test1234!"
    
    # Test kullanıcısını kontrol et
    test_user = db.query(PortalUser).filter(PortalUser.email == test_email).first()
    
    # Test cari'yi bul veya oluştur (ID: 1, CariKod: '01.001')
    test_cari = db.query(Cari).filter(Cari.CariKod == '01.001').first()
    if not test_cari:
        # Test cari yoksa ilk cari'yi kullan
        test_cari = db.query(Cari).first()
    
    if not test_cari:
        print("⚠️  Test portal kullanıcısı için cari bulunamadı, atlanıyor")
        return None
    
    if not test_user:
        # Kullanıcı yoksa oluştur
        test_user = PortalUser(
            email=test_email,
            full_name="Test User",
            cari_id=test_cari.Id,
            is_admin=False,
            is_active=True,
            must_change_password=False,  # Test kullanıcısı için zorunlu değiştirme kapalı
            created_at=datetime.utcnow()
        )
        test_user.set_password(test_password)
        db.add(test_user)
        db.flush()
        print(f"✅ Test portal kullanıcısı oluşturuldu: {test_email}")
    else:
        # Kullanıcı varsa şifreyi güncelle (development için)
        test_user.set_password(test_password)
        test_user.is_active = True
        test_user.must_change_password = False
        test_user.updated_at = datetime.utcnow()
        print(f"ℹ️  Test portal kullanıcısı güncellendi: {test_email}")
    
    return test_user


def bootstrap_application():
    """
    Uygulama başlangıcında çalışan ana bootstrap fonksiyonu.
    Development ortamında otomatik olarak:
    - Database tablolarını oluşturur
    - Admin kullanıcısını oluşturur/günceller
    - Gerekli rolleri oluşturur
    - Temel permission'ları oluşturur
    """
    # DEBUG değişkenini kontrol et (hem os.getenv hem de .env'den)
    from dotenv import load_dotenv
    import os
    from pathlib import Path
    
    # Backend root dizinindeki .env dosyasını yükle
    backend_root = Path(__file__).parent.parent.parent
    env_path = backend_root / ".env"
    if env_path.exists():
        load_dotenv(env_path)
    
    # Sadece DEBUG modunda otomatik bootstrap yap
    debug_mode = os.getenv("DEBUG", "False").lower() == "true"
    
    if not debug_mode:
        return
    
    print("\n" + "=" * 80)
    print("🚀 ALIAPORT BOOTSTRAP - Development Mode")
    print("=" * 80)
    
    # Database tablolarını oluştur
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Admin kullanıcısını oluştur/güncelle
        admin_user = ensure_admin_user(db)
        
        # 2. Rolleri oluştur ve admin'e ekle
        ensure_admin_roles(db, admin_user)
        
        # 3. Temel permission'ları oluştur
        ensure_basic_permissions(db)
        
        # 4. ADMIN rolüne tüm permission'ları bağla
        link_admin_permissions(db)
        
        # 5. Test portal kullanıcısını oluştur/güncelle
        test_portal_user = ensure_test_portal_user(db)
        
        # Değişiklikleri kaydet
        db.commit()
        
        print("\n✅ Bootstrap tamamlandı!")
        print(f"   👤 Admin: {admin_user.email}")
        print(f"   🔐 Roller: {', '.join([r.name for r in admin_user.roles])}")
        print(f"   🎯 Superuser: {admin_user.is_superuser}")
        if test_portal_user:
            print(f"   👥 Portal Test: {test_portal_user.email} (Firma: {test_portal_user.cari.Unvan if test_portal_user.cari else 'N/A'})")
        print("=" * 80 + "\n")
        
    except Exception as e:
        print(f"❌ Bootstrap hatası: {e}")
        db.rollback()
        raise
    finally:
        db.close()
