# admin_reset_password.py
"""
Admin kullanıcısının şifresini ve durumunu sıfırlar.
Kullanım: python admin_reset_password.py
"""
from aliaport_api.config.database import SessionLocal
from aliaport_api.modules.auth.models import User
from aliaport_api.modules.auth.utils import hash_password

ADMIN_EMAIL = "admin@aliaport.com"
NEW_PASSWORD = "admin1234"

def main():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if not user:
            print(f"[!] Kullanıcı bulunamadı: {ADMIN_EMAIL}")
            return
        user.hashed_password = hash_password(NEW_PASSWORD)
        user.is_active = True
        user.is_superuser = True
        db.commit()
        print(f"[+] Şifre sıfırlandı ve kullanıcı aktif/superuser yapıldı: {ADMIN_EMAIL} / {NEW_PASSWORD}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
