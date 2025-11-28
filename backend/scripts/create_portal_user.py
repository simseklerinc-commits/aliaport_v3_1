"""
PORTAL USER TEST VERİSİ OLUŞTURMA
Dış müşteri (firma temsilcisi) için test kullanıcısı
"""

import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from datetime import datetime
from sqlalchemy.orm import Session

from aliaport_api.config.database import SessionLocal
from aliaport_api.modules.cari.models import Cari
from aliaport_api.modules.dijital_arsiv.models import PortalUser


def create_portal_user_test_data(db: Session):
    """Test portal user oluştur"""
    print("👤 Portal User Test Verisi Oluşturuluyor...")
    
    # TEST_MAERSK cari ID'sini bul
    test_cari = db.query(Cari).filter(Cari.CariKod == "TEST_MAERSK").first()
    
    if not test_cari:
        print("❌ TEST_MAERSK cari kartı bulunamadı! Önce seed_test_data.py çalıştırın.")
        return None
    
    # Mevcut portal user kontrolü
    existing_user = db.query(PortalUser).filter(PortalUser.email == "test@firma.com").first()
    
    if existing_user:
        print("⚠️  test@firma.com kullanıcısı zaten var, siliniyor...")
        db.delete(existing_user)
        db.commit()
    
    # Yeni portal user oluştur
    portal_user = PortalUser(
        cari_id=test_cari.Id,
        email="test@firma.com",
        full_name="Ahmet Yılmaz",
        phone="+90 532 123 45 67",
        position="Firma Temsilcisi",
        is_admin=True,  # Bu kullanıcı firmanın admin'i (tüm talepleri görebilir)
        is_active=True,
        must_change_password=False,  # Test için şifre değiştirme zorunluluğu yok
        created_at=datetime.utcnow(),
        login_count=0
    )
    
    # Şifreyi set et (passlib ile hash'lenir)
    portal_user.set_password("Test123!")
    
    db.add(portal_user)
    db.commit()
    db.refresh(portal_user)
    
    print(f"✅ Portal User Oluşturuldu:")
    print(f"   - ID: {portal_user.id}")
    print(f"   - Email: {portal_user.email}")
    print(f"   - Şifre: Test123!")
    print(f"   - Ad Soyad: {portal_user.full_name}")
    print(f"   - Firma: {test_cari.Unvan} ({test_cari.CariKod})")
    print(f"   - Pozisyon: {portal_user.position}")
    print(f"   - Admin: {portal_user.is_admin}")
    print(f"   - Aktif: {portal_user.is_active}")
    
    return portal_user


def main():
    """Ana fonksiyon"""
    print("=" * 60)
    print("🔐 PORTAL USER TEST VERİSİ")
    print("=" * 60 + "\n")
    
    db = SessionLocal()
    
    try:
        portal_user = create_portal_user_test_data(db)
        
        if portal_user:
            print("\n" + "=" * 60)
            print("✅ PORTAL USER OLUŞTURULDU!")
            print("=" * 60)
            print("\n📝 GİRİŞ BİLGİLERİ:")
            print(f"   🌐 URL: http://localhost:5001/portal/login")
            print(f"   📧 Email: test@firma.com")
            print(f"   🔑 Şifre: Test123!")
            print("\n💡 Portal user olarak login olup iş emri talebi oluşturabilirsiniz!")
        
    except Exception as e:
        print(f"\n❌ HATA: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
