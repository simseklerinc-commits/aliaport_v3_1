# Aliaport Development Bootstrap

## 🚀 Otomatik Kurulum Sistemi

Backend başlatıldığında **DEBUG modunda** otomatik olarak:

✅ Admin kullanıcısı oluşturulur/güncellenir  
✅ ADMIN ve SISTEM_YONETICISI rolleri atanır  
✅ Tüm permission'lar (43 adet) verilir  
✅ Superuser yetkisi aktif edilir  

## 📋 Nasıl Çalışır?

### 1. `.env` Dosyası Ayarları

```env
# Application
DEBUG=True

# Admin User (Default credentials)
ADMIN_EMAIL=admin@aliaport.com
ADMIN_PASSWORD=Admin1234!
ADMIN_FULL_NAME=Sistem Yöneticisi
```

### 2. Otomatik Bootstrap

Backend başlatıldığında `aliaport_api/core/bootstrap.py` otomatik çalışır:

```bash
cd backend
python -m uvicorn aliaport_api.main:app --reload
```

**Konsol Çıktısı:**
```
🚀 ALIAPORT BOOTSTRAP - Development Mode
================================================================================
ℹ️  Admin kullanıcı güncellendi: admin@aliaport.com
✅ Bootstrap tamamlandı!
   👤 Admin: admin@aliaport.com
   🔐 Roller: SISTEM_YONETICISI, ADMIN
   🎯 Superuser: True
================================================================================
```

### 3. Production Modu

Production'da (`DEBUG=False`) bootstrap **çalışmaz**. Manuel kurulum gerekir:

```bash
python scripts/setup_admin.py
python scripts/seed_admin_permissions.py
```

## 🔐 Giriş Bilgileri

Development ortamında her zaman:

- **Email:** admin@aliaport.com
- **Şifre:** Admin1234!
- **Yetkiler:** 43 permission (tüm modüller)
- **Roller:** ADMIN, SISTEM_YONETICISI
- **Superuser:** True

## 🎯 Avantajlar

✅ **Her başlatmada hazır:** Database sıfırlansa bile admin kullanıcı otomatik oluşur  
✅ **Tutarlı şifre:** .env'de tanımlı, her seferinde aynı  
✅ **Geliştirme hızı:** Manuel setup_admin.py çalıştırmaya gerek yok  
✅ **Production güvenliği:** Sadece DEBUG=True iken çalışır  

## 📝 Notlar

- Bootstrap her backend başlangıcında çalışır
- Mevcut admin kullanıcısı varsa şifreyi günceller (.env'deki ile)
- Permission'lar eksikse otomatik ekler
- Rolleri her zaman kontrol edip ekler

## 🔧 Özelleştirme

`.env` dosyasında istediğiniz admin bilgilerini tanımlayın:

```env
ADMIN_EMAIL=myemail@company.com
ADMIN_PASSWORD=MySecurePassword123!
ADMIN_FULL_NAME=John Doe
```

Backend yeniden başlatıldığında yeni bilgilerle güncellenecektir.
