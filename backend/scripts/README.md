# Backend Scripts

Bu klasör, veritabanı yönetimi ve bakım script'lerini içerir.

## Mevcut Script'ler

### setup_admin.py
Admin kullanıcısı oluşturur veya günceller.

**Kullanım:**
```bash
cd backend
python scripts/setup_admin.py
```

### seed_admin_permissions.py
ADMIN rolüne tüm yetkileri verir ve permission tablosunu doldurur.

**Kullanım:**
```bash
cd backend
python scripts/seed_admin_permissions.py
```

## Notlar
- Script'leri çalıştırmadan önce PYTHONPATH ayarlandığından emin olun
- Production ortamında dikkatli kullanın
