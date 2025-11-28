# PARAMETRE MODÜLÜ - Teknik Dokümantasyon

## 📋 Modül Özeti

**Modül Adı:** Parametre (System Parameters)  
**Versiyon:** 3.1.0  
**Durum:** ✅ Production Ready  
**Sorumlu Ekip:** System Admin Team  
**İlgili Modüller:** Tüm modüller (sistem geneli ayarlar)  

---

## 🎯 Ne İşe Yarar?

Parametre modülü, **sistem genelindeki yapılandırılabilir ayarları** Key-Value formatında saklar. Kodda hardcode edilmesi gereken değerleri dinamik hale getirir.

**Kullanım Senaryoları:**
- **Sistem Ayarları:** SMTP, email templates, timeout değerleri
- **İş Kuralları:** 4 saat kontrolü threshold, %10 Türk bayraklı indirim
- **Lookup Tabloları:** Birim tipleri (SAAT, ADET, TON), KDV oranları
- **Feature Flags:** Yeni özelliklerin açık/kapalı kontrolü
- **Entegrasyon:** EVDS API key, Mikro Jump server IP

**İş Akışı:**
```
Parametre Tanımı (Kategori + Kod + Değer)
         ↓
Backend API → get_parameter("SISTEM.SMTP_HOST")
         ↓
Frontend → Feature flag kontrolü
```

---

## 🗂️ Veritabanı Yapısı

### Tablo: `Parametre`

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `Id` | Integer | Primary Key | 1, 2, 3... |
| `Kategori` | String(50) | **Kategori** (gruplama) | "SISTEM", "IS_KURALI", "ENTEGRASYON" |
| `Kod` | String(100) | **Parametre kodu** (unique) | "SMTP_HOST", "CABATOGE_DISCOUNT_PERCENT" |
| `Ad` | String(200) | Parametre adı | "SMTP Sunucu Adresi" |
| `Deger` | String(500) | **Değer** | "smtp.gmail.com", "10.0" |
| `Aciklama` | String(1000) | Açıklama | "Email gönderimi için SMTP sunucu" |
| `AktifMi` | Boolean | Aktif mi? | True |
| `CreatedAt` | DateTime | Kayıt zamanı | 2025-01-01 10:00:00 |
| `UpdatedAt` | DateTime | Son güncelleme | 2025-02-01 14:30:00 |

**Kategori Örnekleri:**
```
SISTEM       → Sistem yapılandırmaları (SMTP, logging, timeout)
IS_KURALI    → İş kuralları (indirim oranları, threshold değerleri)
ENTEGRASYON  → Harici API entegrasyonları (EVDS, Mikro Jump)
FEATURE_FLAG → Özellik açık/kapalı kontrolleri
LOOKUP       → Lookup tabloları (birim tipleri, KDV oranları)
```

**Örnek Parametreler:**
```
Kategori: SISTEM
- SMTP_HOST = "smtp.gmail.com"
- SMTP_PORT = "587"
- SMTP_USERNAME = "noreply@aliaport.com"
- MAX_FILE_UPLOAD_MB = "10"

Kategori: IS_KURALI
- CABATOGE_DISCOUNT_PERCENT = "10.0"
- SECURITY_EXIT_THRESHOLD_HOURS = "4.0"
- ARCHIVE_AFTER_DAYS = "30"

Kategori: ENTEGRASYON
- EVDS_API_KEY = "10uUNFzxXP..."
- MIKRO_JUMP_SERVER_IP = "192.168.1.100"
- MIKRO_JUMP_DB_NAME = "MikroJump17"

Kategori: FEATURE_FLAG
- PORTAL_ENABLED = "true"
- INVOICE_MODULE_ENABLED = "false"
- EXCEL_IMPORT_ENABLED = "true"
```

**İndeksler:**
- `ix_parametre_kategori`: (Kategori) → Kategori bazlı sorgular
- `ix_parametre_kod`: (Kod) UNIQUE → Parametre kodu

---

## 🔌 API Endpoints

### Base URL: `/api/parametre`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/parametre/` | Parametre listesi |
| GET | `/api/parametre/by-category/{kategori}` | Kategori bazlı liste |
| GET | `/api/parametre/{kod}` | Kod ile parametre getir |
| GET | `/api/parametre/value/{kod}` | **Sadece değer getir** |
| POST | `/api/parametre/` | Yeni parametre oluştur |
| PUT | `/api/parametre/{parametre_id}` | Parametre güncelle |
| DELETE | `/api/parametre/{parametre_id}` | Parametre sil |

**Örnek Kullanım:**
```python
# Backend'de parametre kullanımı
from modules.parametre.utils import get_parameter_value

smtp_host = get_parameter_value("SMTP_HOST")  # → "smtp.gmail.com"
discount = float(get_parameter_value("CABATOGE_DISCOUNT_PERCENT"))  # → 10.0
```

---

## 💻 Kod Yapısı

**models.py:**
```python
class Parametre(Base):
    __tablename__ = "Parametre"
    
    Id = Column(Integer, primary_key=True)
    Kategori = Column(String(50), nullable=False, index=True)
    Kod = Column(String(100), nullable=False, unique=True, index=True)
    Ad = Column(String(200), nullable=False)
    Deger = Column(String(500), nullable=True)
    Aciklama = Column(String(1000), nullable=True)
    AktifMi = Column(Boolean, nullable=False, default=True)
    
    CreatedAt = Column(DateTime, nullable=False, default=func.now())
    UpdatedAt = Column(DateTime, onupdate=func.now())
```

**utils.py - Helper Functions:**
```python
def get_parameter_value(kod: str, default=None) -> str:
    """Parametre değeri getir"""
    db = SessionLocal()
    param = db.query(Parametre).filter(
        Parametre.Kod == kod,
        Parametre.AktifMi == True
    ).first()
    db.close()
    
    if param:
        return param.Deger
    return default

def get_parameter_bool(kod: str, default=False) -> bool:
    """Boolean parametre"""
    value = get_parameter_value(kod)
    if value is None:
        return default
    return value.lower() in ["true", "1", "yes", "on"]

def get_parameter_int(kod: str, default=0) -> int:
    """Integer parametre"""
    value = get_parameter_value(kod)
    if value is None:
        return default
    return int(value)

def get_parameter_float(kod: str, default=0.0) -> float:
    """Float parametre"""
    value = get_parameter_value(kod)
    if value is None:
        return default
    return float(value)
```

---

## 🔧 Geliştirme Geçmişi

### Faz 1: Temel Parametre Yönetimi (Tamamlandı)
- ✅ Parametre CRUD
- ✅ Kategori bazlı gruplama
- ✅ Key-Value storage

### Faz 2: Utility Functions (Tamamlandı)
- ✅ get_parameter_value()
- ✅ get_parameter_bool()
- ✅ get_parameter_int/float()

### Faz 3: Frontend Admin Panel (Planlanan)
- ⏳ Parametre düzenleme ekranı
- ⏳ Kategori filtreleme
- ⏳ Validation kuralları

---

## 🔗 Diğer Modüllerle İlişkiler

**Tüm Modüller:**
- İş Emri → CABATOGE_DISCOUNT_PERCENT, SECURITY_EXIT_THRESHOLD_HOURS
- Kurlar → EVDS_API_KEY
- Email → SMTP_HOST, SMTP_PORT, SMTP_USERNAME
- Portal → PORTAL_ENABLED, ARCHIVE_AFTER_DAYS

---

## 📚 Kaynaklar

**İlgili Dosyalar:**
- `backend/aliaport_api/modules/parametre/models.py`
- `backend/aliaport_api/modules/parametre/utils.py`
- `frontend/src/features/parametre/components/ParametreList.tsx`

---

**Son Güncelleme:** 25 Kasım 2025  
**Güncelleyen:** AI Documentation Agent  
**Versiyon:** 1.0
