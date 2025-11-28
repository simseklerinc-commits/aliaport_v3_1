# ALIAPORT V3.1 - MODÜL DOKÜMANTASYONLARı İNDEKS

## 📚 Genel Bakış

Bu dizin, **Aliaport Liman Yönetim Sistemi v3.1** için **13 temel modülün** detaylı teknik dokümantasyonunu içerir. Her modül ayrı bir dosyada (`XX_MODUL_XXX.md`) dokümante edilmiştir.

**Hedef Kitle:** Backend/Frontend geliştiriciler, sistem yöneticisi, proje yöneticisi  
**Güncelleme Tarihi:** 25 Kasım 2025  
**Dokümantasyon Versiyonu:** 1.0  

---

## 🗂️ Modül Listesi (13 Modül)

### 1️⃣ CARİ MODÜLÜ
**Dosya:** [`01_MODUL_CARI.md`](./01_MODUL_CARI.md)  
**Kapsam:** Müşteri/Tedarikçi yönetimi  
**Özellikler:**
- TUZEL (tüzel kişi) vs GERCEK (gerçek kişi) ayrımı
- VergiNo (11 haneli) vs TCKN (kimlik no) validasyonu
- Rol: MUSTERI, TEDARIKCI, DIGER
- N+1 query önleme (lazy="raise")
- Unique constraint (CariKod)

**Entegrasyonlar:** Motorbot, İş Emri, Barınma, Sefer, Auth (portal kullanıcı)

---

### 2️⃣ MOTORBOT MODÜLÜ
**Dosya:** [`02_MODUL_MOTORBOT.md`](./02_MODUL_MOTORBOT.md)  
**Kapsam:** Motorbot (römorkör) ve Sefer (MbTrip) yönetimi  
**Özellikler:**
- Motorbot: GT (Gross Tonnage), BG (Beygir Gücü), Boy, Su Çekimi
- MbTrip (Sefer): PLANLANDI → DEVAM_EDIYOR → TAMAMLANDI → FATURALANDI
- Çakışma kontrolü (aynı motorbot aynı saatte 2 sefer yapamaz)
- N+1 prevention: `lazy="raise"` ile explicit eager loading
- CariId ile sahiplik ilişkisi

**Entegrasyonlar:** Cari, Barınma, İş Emri, Saha Personel, Güvenlik

---

### 3️⃣ KURLAR MODÜLÜ
**Dosya:** [`03_MODUL_KURLAR.md`](./03_MODUL_KURLAR.md)  
**Kapsam:** Döviz kuru yönetimi (TCMB EVDS API)  
**Özellikler:**
- **4 Kur Tipi:** Döviz Alış, Döviz Satış, Efektif Alış, Efektif Satış
- EVDS API entegrasyonu (resmi TCMB API)
- Otomatik günlük sync (APScheduler, her gün 16:00)
- Fallback mekanizması (10 gün geriye gider, hafta sonu/tatil kontrolü)
- Upsert logic (duplicate önleme)
- 5 döviz: USD, EUR, GBP, CHF, JPY

**Entegrasyonlar:** Tarife, İş Emri (faturalama), Barınma (döviz çevrimi)

---

### 4️⃣ İŞ EMRİ MODÜLÜ
**Dosya:** [`04_MODUL_ISEMRI.md`](./04_MODUL_ISEMRI.md)  
**Kapsam:** İş emri yönetimi + Portal entegrasyonu  
**Özellikler:**
- **8 Durum:** DRAFT → SUBMITTED → APPROVED → REJECTED → SAHADA → TAMAMLANDI → FATURALANDI → KAPANDI
- **4 İş Türü:** HIZMET, MOTORBOT, BARINMA, DIGER
- **Özel Alanlar:**
  - `is_cabatoge_tr_flag`: Türk bayraklı gemi %10 indirim
  - `apply_rule_addons`: Tarife kurallarını uygula (gece +%25, hafta sonu +%50)
  - `security_exit_time`: 4 saat kontrolü (GateLog entegrasyonu)
  - `attached_letter_approved`: Vinç/forklift izin belgesi
- **Portal Workflow:** Portal kullanıcı talep (DRAFT) → Personel onay/red
- WorkOrderItem: WORKLOG (saha saati), RESOURCE (ekipman), SERVICE (hizmet kartı)

**Entegrasyonlar:** Cari, Motorbot, Barınma, Hizmet, Tarife, Saha Personel, Güvenlik, Kurlar

---

### 5️⃣ BARINMA MODÜLÜ
**Dosya:** [`05_MODUL_BARINMA.md`](./05_MODUL_BARINMA.md)  
**Kapsam:** Motorbot konaklama kontratları  
**Özellikler:**
- Kontrat yönetimi (StartDate, EndDate, UnitPrice)
- Açık uçlu kontrat desteği (EndDate NULL)
- **Faturalama Periyodu:** MONTHLY, QUARTERLY, YEARLY
- Otomatik fatura oluşturma (APScheduler, her ayın 1'inde)
- Kontrat yenileme/sonlandırma endpoints
- Yakında bitecek kontratlar (30 gün uyarısı)

**Entegrasyonlar:** Motorbot, Cari, Hizmet, Tarife, İş Emri

---

### 6️⃣ TARİFE MODÜLÜ
**Dosya:** [`06_MODUL_TARIFE.md`](./06_MODUL_TARIFE.md)  
**Kapsam:** Fiyat listesi yönetimi  
**Özellikler:**
- PriceList + PriceListItem (master-detail)
- **Kademeli Fiyatlandırma:** MinQuantity/MaxQuantity (örn: 1-5 saat 3000 TL, 6-10 saat 2800 TL)
- Tarih bazlı geçerlilik (ValidFrom, ValidTo)
- Varsayılan tarife (IsDefault)
- Toplu fiyat güncelleme (%10 artış vs.)
- Fiyat hesaplama servisi (quantity → otomatik kademe seçimi)

**Entegrasyonlar:** Hizmet, İş Emri, Barınma, Kurlar (döviz çevrimi - gelecek)

---

### 7️⃣ HİZMET MODÜLÜ
**Dosya:** [`07_MODUL_HIZMET.md`](./07_MODUL_HIZMET.md)  
**Kapsam:** Hizmet kartları (Service Cards)  
**Özellikler:**
- Hizmet tanımları (Kod, Ad, Açıklama)
- Muhasebe entegrasyonu (MuhasebeKodu)
- GrupKod ile kategorizasyon
- Temel fiyat (Fiyat, ParaBirimi, KdvOrani)
- JSON metadata (tags, custom fields)
- Gelecek: Parametre modülü ile FK ilişkileri (UnitId, VatRateId, GroupId)

**Entegrasyonlar:** Tarife, İş Emri, Barınma, Parametre

---

### 8️⃣ PARAMETRE MODÜLÜ
**Dosya:** [`08_MODUL_PARAMETRE.md`](./08_MODUL_PARAMETRE.md)  
**Kapsam:** Sistem parametreleri (Key-Value store)  
**Özellikler:**
- Kategori bazlı gruplama (SISTEM, IS_KURALI, ENTEGRASYON, FEATURE_FLAG)
- Kod-Değer yapısı
- **Örnek Parametreler:**
  - `SMTP_HOST`, `SMTP_PORT` (Email)
  - `CABATOGE_DISCOUNT_PERCENT` (10.0)
  - `SECURITY_EXIT_THRESHOLD_HOURS` (4.0)
  - `EVDS_API_KEY` (TCMB entegrasyonu)
  - `PORTAL_ENABLED` (true/false)
- Utility functions: `get_parameter_value()`, `get_parameter_bool()`, `get_parameter_int()`

**Entegrasyonlar:** Tüm modüller (sistem geneli ayarlar)

---

### 9️⃣ SAHA PERSONEL MODÜLÜ
**Dosya:** [`09_MODUL_SAHA_PERSONEL.md`](./09_MODUL_SAHA_PERSONEL.md)  
**Kapsam:** Saha personel iş kayıtları (WorkLog)  
**Özellikler:**
- Tablet entegrasyonu (saha personeli giriş)
- Zaman kaydı (time_start, time_end, duration_minutes)
- Fotoğraf upload
- **Onay Mekanizması:**
  - `is_processed=0, is_approved=0` → Beklemede
  - `is_approved=1` → Admin onayı
  - `is_processed=1` → WorkOrderItem'e eklendi
- İş emri/sefer bazlı kayıt

**Entegrasyonlar:** İş Emri (WorkOrderItem), Motorbot, Sefer

---

### 🔟 GÜVENLİK MODÜLÜ
**Dosya:** [`10_MODUL_GUVENLIK.md`](./10_MODUL_GUVENLIK.md)  
**Kapsam:** Liman giriş/çıkış kapı kontrolü  
**Özellikler:**
- **GateLog:** Giriş/çıkış kayıtları (GIRIS, CIKIS)
- İş emri doğrulama (wo_status kontrolü)
- **Checklist Sistemi:** İş emri tipi bazlı otomatik checklist (motorbot ruhsatı, vinç izni vs.)
- İstisna durumu (PIN yetkilendirmesi)
- Fotoğraf kaydı
- **4 Saat Kontrolü:** Çıkış zamanı - iş emri bitiş > 4 saat → ek ücret

**Entegrasyonlar:** İş Emri (security_exit_time), Motorbot

---

### 1️⃣1️⃣ AUTH MODÜLÜ
**Dosya:** [`11_MODUL_AUTH.md`](./11_MODUL_AUTH.md)  
**Kapsam:** Kimlik doğrulama ve yetkilendirme (JWT + RBAC)  
**Özellikler:**
- **JWT Authentication:** Login → access_token (python-jose, bcrypt)
- **RBAC:** User → Role → Permission (resource:action formatı)
- **Standart Roller:** SISTEM_YONETICISI, MUHASEBE, OPERASYON_MUDURU, PERSONEL, PORTAL_KULLANICI, SAHA_PERSONELI, GUVENLIK_PERSONELI
- **Permission Sistem:** `cari:read`, `isemri:approve`, `worklog:approve`
- Password reset (token bazlı)
- Portal kullanıcı: cari_id ile Cari bağlantısı

**Entegrasyonlar:** Tüm modüller (sistem geneli kimlik doğrulama)

---

### 1️⃣2️⃣ AUDIT MODÜLÜ
**Dosya:** [`12_MODUL_AUDIT.md`](./12_MODUL_AUDIT.md)  
**Kapsam:** Audit trail / Event logging  
**Özellikler:**
- **HTTP Request Logging:** Her API isteği kaydedilir
- AuditEvent: user_id, method, path, action, resource, status_code, duration_ms, IP, user_agent
- **Action İnference:** Path'den otomatik action çıkarımı (PUT /api/cari/123 → cari:update)
- Non-blocking kayıt (async middleware)
- KVKK uyumluluğu (veri erişim kayıtları)
- Güvenlik analizi (başarısız login denemeleri)

**Entegrasyonlar:** Tüm modüller (sistem geneli logging)

---

### 1️⃣3️⃣ SEFER MODÜLÜ
**Dosya:** [`13_MODUL_SEFER.md`](./13_MODUL_SEFER.md)  
**Kapsam:** Motorbot sefer yönetimi (MbTrip)  
**Özellikler:**
- **Not:** Bu modül `02_MODUL_MOTORBOT.md`'de detaylı dokümante edilmiştir
- MbTrip: MotorbotId, CariId, TripStartDate, TripEndDate, Status
- Durum state machine: PLANLANDI → DEVAM_EDIYOR → TAMAMLANDI → FATURALANDI
- Çakışma kontrolü (aynı motorbot aynı saatte 2 sefer yapamaz)
- N+1 prevention (lazy="raise")

**Entegrasyonlar:** Motorbot, Cari, İş Emri, Saha Personel

---

## 🔗 Modül Bağımlılık Matrisi

```
                 Cari  Mbot  Sefer  İşE  Bar  Tar  Hiz  Para  Saha  Güv  Auth  Audit  Kur
Cari             -     ✅    ✅     ✅   ✅   -    -    -     -     -    ✅    ✅     -
Motorbot         ✅    -     ✅     ✅   ✅   -    -    -     ✅    ✅   -     ✅     -
Sefer            ✅    ✅    -      ✅   -    -    -    -     ✅    -    -     ✅     -
İş Emri          ✅    ✅    ✅     -    ✅   ✅   ✅   ✅    ✅    ✅   ✅    ✅     ✅
Barınma          ✅    ✅    -      ✅   -    ✅   ✅   -     -     -    -     ✅     ✅
Tarife           -     -     -      ✅   ✅   -    ✅   -     -     -    -     ✅     ✅
Hizmet           -     -     -      ✅   ✅   ✅   -    ✅    -     -    -     ✅     -
Parametre        -     -     -      ✅   -    -    ✅   -     -     -    -     ✅     ✅
Saha Personel    -     ✅    ✅     ✅   -    -    -    -     -     -    ✅    ✅     -
Güvenlik         -     ✅    -      ✅   -    -    -    -     -     -    ✅    ✅     -
Auth             ✅    -     -      ✅   -    -    -    -     ✅    ✅   -     ✅     -
Audit            ✅    ✅    ✅     ✅   ✅   ✅   ✅   ✅    ✅    ✅   ✅    -      ✅
Kurlar           -     -     -      ✅   ✅   ✅   -    -     -     -    -     ✅     -
```

**Notasyon:**
- ✅ = Modül A, Modül B'yi kullanır (foreign key, API çağrısı, business logic)
- `-` = Doğrudan bağımlılık yok

---

## 📊 Teknoloji Stack

### Backend
- **Framework:** FastAPI 0.121.3
- **ORM:** SQLAlchemy 2.0.44
- **Database:** SQLite (dev), PostgreSQL 14 (production)
- **Authentication:** python-jose (JWT), passlib + bcrypt
- **Rate Limiting:** SlowAPI (300 requests/min)
- **Scheduler:** APScheduler 3.11.1 (kurlar, faturalama)
- **Monitoring:** Prometheus, Sentry, psutil

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **State Management:** React Query (TanStack Query)
- **UI Library:** Tailwind CSS + Custom Components

### DevOps
- **Deployment:** Ubuntu 22.04, NGINX, Gunicorn + Uvicorn
- **SSL:** Let's Encrypt (Certbot)
- **Monitoring:** Prometheus + Grafana, Sentry
- **VPN:** OpenVPN (Mikro Jump 17 erişimi)
- **Cloud:** Turkcell Cloud / Doruknet VDS

---

## 🔍 Ortak Kod Patterns

### 1. N+1 Query Önleme
```python
# ❌ YANLIŞ (N+1 query)
motorbot = db.query(Motorbot).first()
for trip in motorbot.trips:  # Her trip için ayrı query!
    print(trip.cari.CariAd)

# ✅ DOĞRU (Explicit eager loading)
motorbot = db.query(Motorbot).options(
    selectinload(Motorbot.trips).selectinload(MbTrip.cari)
).first()

for trip in motorbot.trips:  # Tek query
    print(trip.cari.CariAd)
```

### 2. Permission Check Pattern
```python
from modules.auth.utils import require_permission

@router.post("/api/cari/")
@require_permission("cari:create")
def create_cari(data: CariCreate, user: User = Depends(get_current_user)):
    # ...
```

### 3. Audit Log Pattern
```python
# Otomatik (middleware ile)
# Her HTTP isteği otomatik AuditEvent oluşturur

# Manuel (özel durumlar için)
db.add(AuditLog(
    event_type="WORK_ORDER_APPROVED",
    entity_type="WorkOrder",
    entity_id=wo.Id,
    user_id=user.Id,
    details={"wo_number": wo.wo_number, "notes": notes}
))
```

### 4. APScheduler Job Pattern
```python
from apscheduler.schedulers.background import BackgroundScheduler
import pytz

scheduler = BackgroundScheduler(timezone=pytz.timezone('Europe/Istanbul'))

# Her gün 16:00'da kurları güncelle
scheduler.add_job(
    kur_guncelleme_daily,
    trigger='cron',
    hour=16,
    minute=0,
    id='kur_guncelleme_daily',
    replace_existing=True
)

scheduler.start()
```

---

## 🚀 Deployment Checklist

1. **Sunucu Hazırlığı:**
   - Ubuntu 22.04 kurulumu
   - PostgreSQL 14 kurulumu
   - Python 3.11 + venv kurulumu

2. **Backend Deployment:**
   - `.env` dosyası (SECRET_KEY, EVDS_API_KEY, DATABASE_URL)
   - `pip install -r requirements.txt`
   - Database migration: `alembic upgrade head`
   - Gunicorn + Uvicorn workers: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app`

3. **Frontend Deployment:**
   - `npm run build`
   - Static files → NGINX `/var/www/aliaport/`

4. **NGINX Konfigürasyonu:**
   - Reverse proxy (backend)
   - Static file serving (frontend)
   - Let's Encrypt SSL

5. **APScheduler Jobs:**
   - Kurlar otomatik sync (16:00 günlük)
   - Barınma faturalama (her ayın 1'i 09:00)

6. **Monitoring:**
   - Prometheus metrics: `/metrics`
   - Sentry error tracking
   - Log rotation (90 gün)

**Detaylı Deployment:** [`DEPLOYMENT_RUNBOOK.md`](../DEPLOYMENT_RUNBOOK.md)

---

## 🧪 Test Coverage

### Unit Tests
```bash
pytest tests/unit/
```

**Kapsam:**
- Cari validasyonları (VergiNo, TCKN)
- Tarife kademeli fiyatlandırma
- İş emri durum geçişleri (state machine)
- Sefer çakışma kontrolü
- Auth permission check

### Integration Tests
```bash
pytest tests/integration/
```

**Kapsam:**
- EVDS API entegrasyonu
- Portal workflow (DRAFT → APPROVED)
- Barınma otomatik faturalama
- 4 saat kontrolü (GateLog)

---

## 📝 Dokümantasyon Konvansiyonları

Her modül dokümantasyonu şu yapıyı takip eder:

1. **📋 Modül Özeti:** Versiyon, durum, sorumlu ekip, ilgili modüller
2. **🎯 Ne İşe Yarar?:** Kullanım senaryoları, iş akışı
3. **🗂️ Veritabanı Yapısı:** Tablolar, kolonlar, indeksler, FK ilişkileri
4. **🔌 API Endpoints:** Method, endpoint, açıklama, parametreler
5. **💻 Kod Yapısı:** Dosya organizasyonu, katman mimarisi, önemli kod parçaları
6. **🔧 Geliştirme Geçmişi:** Tamamlanan fazlar, planlanan özellikler
7. **📊 İş Kuralları ve Validasyonlar:** Business rules, validation logic
8. **🔗 Diğer Modüllerle İlişkiler:** Foreign key bağlantıları, entegrasyonlar
9. **🎨 Frontend Entegrasyonu:** Component'ler, React Query hooks
10. **🚀 Deployment Notları:** Migration, konfigürasyon, monitoring
11. **🧪 Test Senaryoları:** Unit test, integration test örnekleri
12. **📚 Kaynaklar ve Referanslar:** İlgili dosyalar, harici API dokümantasyonu
13. **🐛 Bilinen Sorunlar ve Geliştirmeler:** Açık sorunlar, gelecek geliştirmeler

---

## 🤝 Katkıda Bulunma

Dokümantasyonu güncel tutmak için:

1. **Yeni Özellik Ekleme:**
   - İlgili modül dosyasını güncelleyin
   - Geliştirme Geçmişi bölümüne faz ekleyin
   - Varsa yeni endpoint'leri dokümante edin

2. **Bug Fix:**
   - Bilinen Sorunlar bölümünü güncelleyin
   - Çözüm detaylarını ekleyin

3. **API Değişikliği:**
   - API Endpoints bölümünü güncelleyin
   - Breaking change ise CHANGELOG.md'ye ekleyin

---

## 📞 İletişim

**Proje Sahibi:** Aliaport Liman İşletmesi  
**Teknik Ekip:** Backend, Frontend, DevOps  
**Dokümantasyon:** AI Documentation Agent  
**Son Güncelleme:** 25 Kasım 2025  

---

**Tüm modül dokümantasyonları hazır! Başka bir programcı bu dosyaları okuyarak projenin tüm altyapısını, geliştirme süreçlerini ve planlanmış özellikleri öğrenebilir.**

---

## 🎯 Hızlı Başlangıç

1. **Backend Geliştiricisi İseniz:**
   - `01_MODUL_CARI.md` → Temel veri modeli
   - `11_MODUL_AUTH.md` → Kimlik doğrulama
   - `04_MODUL_ISEMRI.md` → İş akışları

2. **Frontend Geliştiricisi İseniz:**
   - Tüm modüllerin "Frontend Entegrasyonu" bölümüne bakın
   - API Endpoints bölümlerinden request/response örnekleri

3. **DevOps İseniz:**
   - `DEPLOYMENT_RUNBOOK.md` → Production deployment
   - Tüm modüllerin "Deployment Notları" bölümüne bakın

4. **Proje Yöneticisi İseniz:**
   - Her modülün "Geliştirme Geçmişi" bölümüne bakın
   - Tamamlanan/planlanan özellikler listesini inceleyin

---

**İyi çalışmalar! 🚀**
