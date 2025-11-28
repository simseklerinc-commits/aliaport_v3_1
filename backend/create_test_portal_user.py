"""Portal test kullanıcısı oluştur"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from aliaport_api.config.database import SessionLocal
from aliaport_api.modules.cari.models import Cari
from aliaport_api.modules.dijital_arsiv.models import PortalUser
from datetime import datetime

db = SessionLocal()
try:
    # TEST_MAERSK cari'yi bul veya ilk cari'yi al
    test_cari = db.query(Cari).filter(Cari.CariKod == 'TEST_MAERSK').first()
    if not test_cari:
        test_cari = db.query(Cari).first()
    
    if not test_cari:
        print('❌ Hiç cari bulunamadı!')
        sys.exit(1)
    
    # Mevcut test@aliaport.com kullanıcısını kontrol et
    existing = db.query(PortalUser).filter(PortalUser.email == 'test@aliaport.com').first()
    if existing:
        print(f'✅ test@aliaport.com zaten var (ID: {existing.id})')
        # Şifreyi güncelle
        existing.set_password('Test1234!')
        existing.is_active = True
        db.commit()
        print('✅ Şifre güncellendi: Test1234!')
    else:
        # Yeni kullanıcı oluştur
        portal_user = PortalUser(
            cari_id=test_cari.Id,
            email='test@aliaport.com',
            full_name='Test Kullanıcı',
            phone='+90 532 123 45 67',
            position='Firma Temsilcisi',
            is_admin=True,
            is_active=True,
            must_change_password=False,
            created_at=datetime.utcnow(),
            login_count=0
        )
        portal_user.set_password('Test1234!')
        db.add(portal_user)
        db.commit()
        db.refresh(portal_user)
        print(f'✅ Portal user oluşturuldu (ID: {portal_user.id})')
        print(f'   Email: test@aliaport.com')
        print(f'   Şifre: Test1234!')
        print(f'   Firma: {test_cari.Unvan}')
        print(f'   Cari ID: {test_cari.Id}')
finally:
    db.close()

print('\n🎉 Portal girişi hazır!')
print('📧 Email: test@aliaport.com')
print('🔑 Şifre: Test1234!')
