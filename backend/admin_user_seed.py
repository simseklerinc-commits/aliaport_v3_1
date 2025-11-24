# admin_user_seed.py
"""
Aliaport için admin kullanıcı ekleme scripti.
Kullanım: python -m admin_user_seed.py
"""
from aliaport_api.config.database import SessionLocal
from aliaport_api.modules.auth.models import User
from aliaport_api.modules.auth.utils import hash_password
from aliaport_api.modules.auth.models import Role

ADMIN_EMAIL = "admin@aliaport.com"
ADMIN_PASSWORD = "Admin1234"
ADMIN_FULLNAME = "Admin User"

# Admin rolü ismi (varsa)
ADMIN_ROLE_NAME = "SISTEM_YONETICISI"

def main():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if user:
            print(f"[!] Admin kullanıcısı zaten var: {ADMIN_EMAIL}")
            return
        # Admin rolünü bul
        admin_role = db.query(Role).filter(Role.name == ADMIN_ROLE_NAME).first()
        if not admin_role:
            print(f"[!] Admin rolü bulunamadı, sadece kullanıcı oluşturulacak.")
        user = User(
            email=ADMIN_EMAIL,
            hashed_password=hash_password(ADMIN_PASSWORD),
            full_name=ADMIN_FULLNAME,
            is_active=True,
            is_superuser=True
        )
        if admin_role:
            user.roles.append(admin_role)
        db.add(user)
        db.commit()
        print(f"[+] Admin kullanıcı oluşturuldu: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
