# Database Backup Sistemi

## 📦 Özet

Otomatik database yedekleme ve retention yönetimi sistemi. APScheduler ile günlük, haftalık ve aylık backup'lar oluşturur.

## 🎯 Özellikler

- ✅ **Otomatik Backup**: Her gün saat 03:00'da otomatik yedekleme
- ✅ **Retention Policy**: Günlük 30 gün, haftalık 12 hafta, aylık 12 ay
- ✅ **VACUUM Optimization**: SQLite VACUUM ile optimize edilmiş backup
- ✅ **Backup Verification**: Her backup SQLite integrity check ile doğrulanır
- ✅ **Auto Cleanup**: Eski backup'lar otomatik temizlenir
- ✅ **Restore Support**: Backup'tan geri yükleme desteği
- ✅ **Statistics**: Detaylı backup istatistikleri

## 📁 Backup Klasör Yapısı

```
backend/
├── aliaport.db                   # Ana database
└── backups/
    └── database/
        ├── daily/                # Günlük backups (30 gün)
        │   ├── aliaport_daily_20251123_030000.db
        │   └── ...
        ├── weekly/               # Haftalık backups (12 hafta)
        │   ├── aliaport_weekly_20251120_030000.db
        │   └── ...
        └── monthly/              # Aylık backups (12 ay)
            ├── aliaport_monthly_20251101_030000.db
            └── ...
```

## 🚀 Kullanım

### Otomatik Backup (Production)

Backend başlatıldığında APScheduler otomatik çalışır:

```bash
cd backend
python -m uvicorn aliaport_api.main:app --reload
```

**Zamanlama:**
- **Günlük**: Her gün 03:00
- **Haftalık**: Her Pazar 03:00
- **Aylık**: Her ayın 1'i 03:00

### Manuel Backup

```bash
cd backend
python scripts/backup_database.py
```

### Programatik Kullanım

```python
from scripts.backup_database import DatabaseBackupManager

# Manager oluştur
manager = DatabaseBackupManager()

# Backup oluştur
backup_path = manager.create_backup(backup_type="daily")

# İstatistikleri al
stats = manager.get_backup_stats()
print(stats)

# Eski backup'ları temizle
deleted = manager.cleanup_old_backups()

# Restore (DİKKATLE!)
success = manager.restore_from_backup(backup_path)
```

## ⚙️ Konfigürasyon

### Retention Policy Değiştirme

`scripts/backup_database.py` dosyasında `cleanup_old_backups()` metodunu düzenleyin:

```python
# Daily backups - 30 gün → 60 gün
deleted_counts["daily"] = self._cleanup_directory(
    self.daily_dir, 
    timedelta(days=60),  # Değiştir
    now
)
```

### Backup Zamanını Değiştirme

`backend/aliaport_api/main.py` dosyasında scheduler job'ını düzenleyin:

```python
scheduler.add_job(
    scheduled_backup,
    trigger='cron',
    hour=3,  # Saat
    minute=0,  # Dakika
    id='daily_database_backup'
)
```

### Timezone Ayarı

```python
scheduler = BackgroundScheduler(timezone="Europe/Istanbul")
```

## 📊 İstatistikler

```python
stats = manager.get_backup_stats()
# {
#     "daily": {
#         "count": 5,
#         "total_size_mb": 0.15,
#         "files": ["aliaport_daily_20251123_030000.db", ...]
#     },
#     "weekly": {...},
#     "monthly": {...}
# }
```

## 🔄 Restore İşlemi

**⚠️ UYARI**: Restore işlemi mevcut database'i değiştirir!

```python
from scripts.backup_database import DatabaseBackupManager
from pathlib import Path

manager = DatabaseBackupManager()

# Backup dosyasını seç
backup_path = Path("backups/database/daily/aliaport_daily_20251123_030000.db")

# Restore (güvenlik yedeği otomatik oluşturulur)
success = manager.restore_from_backup(backup_path)

if success:
    print("✅ Restore başarılı!")
    print("⚠️ Uygulamayı yeniden başlatın")
else:
    print("❌ Restore başarısız!")
```

## 🧪 Test

```bash
# Backend dizininden
cd backend

# Test backup oluştur
python scripts/backup_database.py

# Beklenen çıktı:
# ✅ Backup başarılı: aliaport_daily_YYYYMMDD_HHMMSS.db (X.XX MB)
# Daily: 1 dosya, X.XX MB
```

## 📝 Logging

Backup işlemleri otomatik loglanır:

```
2025-11-23 03:00:00 - INFO - ============================================================
2025-11-23 03:00:00 - INFO - GÜNLÜK BACKUP BAŞLADI
2025-11-23 03:00:01 - INFO - Backup başlatılıyor: backups/database/daily/aliaport_daily_20251123_030000.db
2025-11-23 03:00:02 - INFO - ✅ Backup başarılı: aliaport_daily_20251123_030000.db (0.15 MB)
2025-11-23 03:00:02 - INFO - 📊 Backup İstatistikleri:
2025-11-23 03:00:02 - INFO -   Daily: 5 dosya, 0.75 MB
```

## 🔒 Güvenlik

- ✅ Backup oluşturulmadan önce doğrulama yapılır
- ✅ Restore işleminde güvenlik yedeği otomatik oluşturulur
- ✅ SQLite VACUUM ile optimize edilmiş backup
- ✅ Integrity check ile backup geçerliliği kontrol edilir

## 🚨 Sorun Giderme

### "Database dosyası bulunamadı"

```bash
# Database path'i kontrol et
cd backend
ls aliaport.db

# Eğer farklı yerde ise:
python
>>> from scripts.backup_database import DatabaseBackupManager
>>> manager = DatabaseBackupManager(db_path="doğru/path/aliaport.db")
```

### "Backup doğrulama başarısız"

- Database dosyası corrupt olabilir
- SQLite integrity check çalıştırın:
  ```bash
  sqlite3 aliaport.db "PRAGMA integrity_check;"
  ```

### APScheduler çalışmıyor

```python
# main.py'de kontrol et
import logging
logging.basicConfig(level=logging.DEBUG)

# Scheduler loglarını gör
```

## 📦 Dependencies

```txt
APScheduler==3.11.1  # Background scheduler
SQLAlchemy>=2.0.0    # Database ORM (opsiyonel)
```

## 🔗 İlgili Dosyalar

- `backend/aliaport_api/main.py` - APScheduler entegrasyonu
- `backend/scripts/backup_database.py` - Backup manager
- `backend/backups/database/` - Backup dosyaları
- [PRODUCTION_ROADMAP.md](../PRODUCTION_ROADMAP.md) - Production plan

---

**Son Güncelleme**: 23 Kasım 2025  
**Versiyon**: 1.0.0
