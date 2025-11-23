# ALIAPORT v3.1 - ÜRETİM HAZIRLIK YOL HARİTASI

**Oluşturulma Tarihi:** 23 Kasım 2025  
**Güncel Durum:** Fonksiyonel modüller tamamlandı (%65 olgunluk)  
**Hedef:** Production-ready sistem (%90 olgunluk - 6 ay)

---

## 📊 MEVCUT DURUM

### ✅ Tamamlanan
- 12 Ana Modül: Cari, Motorbot, Hizmet, Tarife, Barınma, Kurlar, Parametreler, İş Emri, Dijital Arşiv, Raporlar, Saha Personeli, Güvenlik
- FastAPI + SQLAlchemy modüler backend yapısı
- React + TypeScript feature-based frontend
- **✅ Alembic migration altyapısı (AKTIF)**
- **✅ Otomatik database backup sistemi (AKTIF - Her gün 03:00)**
- **✅ Requirements pinning (Development/Production stratejisi)**
- CORS ve multi-origin desteği

### ⚠️ Kritik Eksiklikler (FAZ 1 TAMAMLANDI ✅)
- ~~Migration yönetimi aktif değil~~ ✅ ÇÖZÜLDÜ
- ~~Sürüm sabitleme yok~~ ✅ ÇÖZÜLDÜ
- ~~Backup stratejisi yok~~ ✅ ÇÖZÜLDÜ
- Auth/güvenlik sistemi yok (FAZ 4)
- Logging yapısı eksik (FAZ 2)
- Production deployment stratejisi yok (FAZ 6)

---

## 🎯 FAZ 1: VERİ GÜVENLİĞİ VE STABİLİTE (ACIL - 1-2 hafta)

### [✅] 1.1 Migration Yönetimi (TAMAMLANDI - 23 Kasım 2025)
**Durum:** ✅ Alembic aktif ve çalışıyor  
**Yapılanlar:**
- [x] İlk migration oluşturuldu: `5cb311f7ffd7_initial_migration_all_modules_with_updated_cari_fields`
- [x] Migration uygulandı: `alembic upgrade head`
- [x] main.py'den `Base.metadata.create_all(bind=engine)` kaldırıldı
- [x] Migration workflow dokümante edildi (main.py'de yorum olarak)
- [ ] Downgrade stratejisi belirle (İleride yapılacak)

**Neden Kritikti:** Şu anda her restart'ta tablolar yeniden oluşturuluyor. Production'da veri kaybı riski var. ✅ ÇÖZÜLDÜ

**Dosyalar:**
- `backend/alembic.ini` ✅ Mevcut
- `backend/alembic/env.py` ✅ Mevcut
- `backend/alembic/versions/5cb311f7ffd7_*.py` ✅ Oluşturuldu
- `backend/aliaport_api/main.py` ✅ Güncellendi

**Sonraki Migration İçin:**
```bash
# Yeni migration oluştur
alembic revision --autogenerate -m "Açıklama"

# Migration'ı uygula
alembic upgrade head

# Geri al (dikkatli kullan!)
alembic downgrade -1
```

---

### [✅] 1.2 Sürüm Sabitleme (TAMAMLANDI - 23 Kasım 2025)
**Durum:** ✅ Tüm paketler versiyonlarıyla sabitlendi  
**Yapılanlar:**
- [x] `pip freeze > backend/requirements-pinned.txt` çalıştırıldı
- [x] Production için pinned, development için loose versiyon stratejisi oluşturuldu
- [x] `alembic` paketi zaten requirements.txt'te var (v1.13.1)
- [ ] Her major update'te requirements dosyalarını güncelle (İleride)

**Mevcut Pinned Versions:**
```
✅ alembic==1.13.1
✅ fastapi==0.121.3
✅ uvicorn==0.36.2
✅ sqlalchemy==2.0.36
✅ pydantic==2.11.1
✅ requests==2.32.3
✅ evds==0.3.2
✅ pandas==2.3.3
✅ APScheduler==3.11.1
```

**Kullanım:**
```bash
# Development (gevşek versiyonlar)
pip install -r requirements.txt

# Production (sabit versiyonlar)
pip install -r requirements-pinned.txt
```

---

### [✅] 1.3 Database Backup Stratejisi (TAMAMLANDI - 23 Kasım 2025)
**Durum:** ✅ Otomatik backup sistemi aktif ve çalışıyor  
**Yapılanlar:**
- [x] `scripts/backup_database.py` oluşturuldu (DatabaseBackupManager class)
- [x] Günlük otomatik backup (APScheduler ile) - Her gün 03:00
- [x] Retention policy aktif:
  - Daily: 30 gün
  - Weekly: 12 hafta (Pazar günleri)
  - Monthly: 12 ay (Ayın 1'i)
- [x] Backup dosya formatı: `aliaport_{type}_YYYYMMDD_HHMMSS.db`
- [x] VACUUM optimize ile backup
- [x] Backup verification (SQLite integrity check)
- [x] Otomatik cleanup (eski backup'lar silinir)

**Mevcut Backup Klasör Yapısı:**
```
backend/backups/database/
  ├── daily/     ✅ 2 backup mevcut (0.02 MB)
  ├── weekly/    (Pazar günleri dolacak)
  └── monthly/   (Ayın 1'i dolacak)
```

**APScheduler Job (Aktif):**
```python
# main.py'de tanımlı
scheduler.add_job(
    scheduled_backup,
    trigger='cron',
    hour=3,
    minute=0,
    id='daily_database_backup',
    name='Günlük Database Backup'
)
```

**Manuel Backup Komutu:**
```bash
cd backend
python scripts/backup_database.py
```

**Restore Komutu (ACİL DURUM):**
```python
from scripts.backup_database import DatabaseBackupManager
manager = DatabaseBackupManager()
manager.restore_from_backup(Path("backups/database/daily/aliaport_daily_20251123_032711.db"))
```

---

## 🎯 FAZ 2: KOD KALİTESİ VE STANDARDİZASYON (2-3 hafta)

### [ ] 2.1 API Response Standardizasyonu
**Hedef Format:**
```json
// Başarılı
{
  "success": true,
  "data": {...},
  "message": "İşlem başarılı",
  "timestamp": "2025-11-23T10:30:00Z"
}

// Hata
{
  "success": false,
  "error": {
    "code": "CARI_NOT_FOUND",
    "message": "Cari bulunamadı",
    "details": {...}
  },
  "timestamp": "2025-11-23T10:30:00Z"
}
```

**Yapılacaklar:**
- [ ] `backend/aliaport_api/core/responses.py` oluştur
- [ ] `StandardResponse` Pydantic model
- [ ] `ErrorResponse` Pydantic model
- [ ] Tüm router'larda standardize et
- [ ] Frontend API client'larını güncelle

---

### [ ] 2.2 Logging Sistemi
**Yapılacaklar:**
- [ ] Structured logging (JSON format)
- [ ] Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- [ ] Dosyaya yazma + console output
- [ ] Rotate policy (günlük, 30 gün saklama)
- [ ] Request ID tracking (her API isteğine unique ID)

**Klasör Yapısı:**
```
logs/
  ├── app.log          # Genel uygulama
  ├── api.log          # API istekleri
  ├── error.log        # Sadece ERROR ve CRITICAL
  └── audit.log        # Kritik işlemler (fatura, onay, vs)
```

**Konfigürasyon:**
```python
# backend/aliaport_api/core/logging_config.py
LOGGING_CONFIG = {
    'version': 1,
    'formatters': {
        'json': {
            'format': '{"time":"%(asctime)s","level":"%(levelname)s","module":"%(module)s","message":"%(message)s"}'
        }
    },
    'handlers': {
        'file': {...},
        'console': {...}
    }
}
```

---

### [ ] 2.3 Error Handling Middleware
**Yapılacaklar:**
- [ ] Global exception handler
- [ ] HTTP exception mapping
- [ ] Validation error formatting
- [ ] 500 hatalarında detay gizleme (production)
- [ ] Error logging integration
- [ ] Sentry/Rollbar hazırlığı

**Dosya:**
```python
# backend/aliaport_api/middleware/error_handler.py
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    # Log error
    # Return standardized error response
    # Hide sensitive details in production
```

---

## 🎯 FAZ 3: FRONTEND OLGUNLAŞMA (3-4 hafta)

### [ ] 3.1 Klasör Yapısı Reorganizasyonu
**Hedef Yapı:**
```
frontend/src/
├── core/              # ← YENİ: Çekirdek utilities
│   ├── api/          # API client base
│   ├── hooks/        # Shared hooks
│   ├── utils/        # Helper functions
│   └── constants/    # Sabitler
├── features/         # ✅ MEVCUT: Feature modülleri
├── shared/           # ← YENİ: Shared components
│   ├── ui/          # Ortak UI components
│   ├── layouts/     # Layout components
│   └── types/       # Shared TypeScript types
├── assets/          # ← TAŞINACAK: Statik dosyalar
└── lib/             # ← MEVCUT ama organize edilecek
```

**Yapılacaklar:**
- [ ] `core/` klasörü oluştur
- [ ] Ortak API client logic'i buraya taşı
- [ ] `shared/` klasörü oluştur
- [ ] UI component'leri kategorize et
- [ ] Type definitions birleştir

---

### [ ] 3.2 State Management
**Yapılacaklar:**
- [ ] Zustand veya Jotai ekle (hafif state management)
- [ ] Global user state store
- [ ] Auth state store
- [ ] Theme preferences store
- [ ] API cache stratejisi (React Query veya SWR)

**Neden Gerekli:** Şu anda her modül kendi state'ini yönetiyor (iyi), ancak cross-module state paylaşımı için merkezi bir çözüm gerekli.

**Store Yapısı:**
```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
}

// stores/themeStore.ts
interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme) => void;
}
```

---

### [ ] 3.3 Form Validation
**Yapılacaklar:**
- [ ] React Hook Form entegrasyonu
- [ ] Zod schema validation
- [ ] Tüm formlarda validation
- [ ] Backend error'ları frontend'e map et
- [ ] Ortak validation schemas

**Örnek:**
```typescript
// schemas/cariSchema.ts
import { z } from 'zod';

export const cariSchema = z.object({
  code: z.string().min(3).max(20),
  title: z.string().min(1).max(255),
  email: z.string().email().optional(),
});
```

---

## 🎯 FAZ 4: GÜVENLİK VE AUTH (4-5 hafta)

### [ ] 4.1 Authentication Sistemi
**Yapılacaklar:**
- [ ] JWT token-based auth
- [ ] Access token (15 dk) + Refresh token (7 gün)
- [ ] `/api/auth/login` endpoint
- [ ] `/api/auth/refresh` endpoint
- [ ] `/api/auth/logout` endpoint
- [ ] Password hashing (bcrypt)
- [ ] User model ve tablo

**User Model:**
```python
class User(Base):
    __tablename__ = "users"
    
    id: int
    username: str (unique)
    email: str (unique)
    password_hash: str
    full_name: str
    role: str  # ADMIN, OPERASYON, GUVENLIK, SAHA, etc.
    is_active: bool
    last_login: datetime
    created_at: datetime
```

---

### [ ] 4.2 Role-Based Access Control (RBAC)
**Roller:**
- `SISTEM_YONETICISI` - Tüm yetkiler
- `OPERASYON` - İş emri create/approve
- `GUVENLIK` - Gate IN/OUT, fotoğraf, istisna PIN
- `SAHA` - WorkLog write (kısıtlı)
- `FATURALAMA` - UBL create/send
- `CARI_PORTAL` - Talep create, belge upload
- `ARSIV_YONETICISI` - Arşiv yönetimi
- `TARIFECI` - Tarife düzenleme

**Yapılacaklar:**
- [ ] `@require_role` decorator
- [ ] `@require_permission` decorator
- [ ] Role-permission mapping
- [ ] Frontend route guards

**Örnek:**
```python
@router.post("/work-order")
@require_role(["OPERASYON", "SISTEM_YONETICISI"])
async def create_work_order(...):
    ...
```

---

### [ ] 4.3 API Security
**Yapılacaklar:**
- [ ] Rate limiting (per user/IP)
  - 100 req/min authenticated users
  - 20 req/min anonymous
- [ ] CORS fine-tuning (production'da wildcard kaldır)
- [ ] SQL injection koruması audit (SQLAlchemy zaten koruyor)
- [ ] XSS koruması (response sanitization)
- [ ] CSRF token (form submission)
- [ ] API key support (external integrations)

**Dependencies:**
```python
pip install slowapi  # Rate limiting
pip install python-jose[cryptography]  # JWT
pip install passlib[bcrypt]  # Password hashing
```

---

## 🎯 FAZ 5: PERFORMANCE VE ÖLÇEKLENEBİLİRLİK (5-6 hafta)

### [ ] 5.1 Database Optimization
**Yapılacaklar:**
- [ ] Index stratejisi:
  - `work_order.wo_number` (UNIQUE INDEX)
  - `work_order.cari_code` (INDEX)
  - `work_order.status` (INDEX)
  - `work_order.created_at` (INDEX)
  - `cari.cari_code` (UNIQUE INDEX)
  - `motorbot.mb_code` (UNIQUE INDEX)
- [ ] Query optimization (N+1 problem kontrolü)
- [ ] Lazy loading vs eager loading stratejisi
- [ ] Connection pooling config
- [ ] EXPLAIN QUERY PLAN analizi

**SQLite Index Örneği:**
```sql
CREATE INDEX idx_wo_cari_code ON work_order(cari_code);
CREATE INDEX idx_wo_status ON work_order(status);
CREATE INDEX idx_wo_created_at ON work_order(created_at);
```

---

### [ ] 5.2 Caching Strategy
**Katmanlar:**
- [ ] API response cache (Redis veya in-memory)
- [ ] Static data cache (parametreler, kurlar)
- [ ] Query result cache
- [ ] Frontend cache (React Query)

**Cache Politikası:**
```python
# Parametreler: 1 saat
# Kurlar: 4 saat
# Cari listesi: 5 dakika
# İş emri listesi: No cache (real-time)
# Stats: 1 dakika
```

---

### [ ] 5.3 Background Jobs Organization
**APScheduler Jobs:**
- [ ] Kur güncelleme (günlük 09:00)
- [ ] Rapor oluşturma (async queue)
- [ ] Email/notification queue
- [ ] Database cleanup (eski log'lar)
- [ ] Audit log archiving
- [ ] Backup (günlük 03:00)

**Job Dosya Yapısı:**
```
backend/aliaport_api/jobs/
  ├── __init__.py
  ├── scheduler.py       # APScheduler config
  ├── currency_update.py
  ├── backup.py
  ├── cleanup.py
  └── notifications.py
```

---

## 🎯 FAZ 6: PRODUCTION HAZIRLIĞI (6-8 hafta)

### [ ] 6.1 Environment Configuration
**Yapılacaklar:**
- [ ] `.env.example` oluştur (template)
- [ ] `.env.development` (local development)
- [ ] `.env.staging` (test sunucusu)
- [ ] `.env.production` (production)
- [ ] Sensitive data encryption
- [ ] Config validation on startup

**Örnek .env.production:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/aliaport
# (SQLite'tan PostgreSQL'e geçiş)

# Auth
JWT_SECRET_KEY=<random-256-bit-key>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# External APIs
EVDS_API_KEY=<tcmb-api-key>

# CORS
ALLOWED_ORIGINS=https://aliaport.com,https://www.aliaport.com

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@aliaport.com
SMTP_PASSWORD=<app-password>
```

---

### [ ] 6.2 Docker/Containerization
**Yapılacaklar:**
- [ ] `Dockerfile.backend` (multi-stage build)
- [ ] `Dockerfile.frontend` (Nginx ile)
- [ ] `docker-compose.yml` (tüm servisler)
- [ ] PostgreSQL container (production için)
- [ ] Redis container (cache için)
- [ ] Nginx reverse proxy
- [ ] Volume management (database, logs, backups)

**docker-compose.yml Yapısı:**
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs
      - ./backups:/app/backups
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
  
  db:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
```

---

### [ ] 6.3 CI/CD Pipeline
**GitHub Actions Workflow:**
- [ ] `.github/workflows/test.yml` (her commit'te)
  - Linting (pylint, eslint)
  - Type checking (mypy, tsc)
  - Unit tests (pytest, vitest)
  - Coverage report
- [ ] `.github/workflows/deploy-staging.yml` (main branch)
  - Build Docker images
  - Push to registry
  - Deploy to staging server
- [ ] `.github/workflows/deploy-prod.yml` (release tag)
  - Manual approval
  - Deploy to production
  - Rollback plan

---

### [ ] 6.4 Monitoring & Alerting
**Yapılacaklar:**
- [ ] Health check endpoint: `/health`
- [ ] Readiness endpoint: `/ready` (database check)
- [ ] Metrics endpoint: `/metrics` (Prometheus format)
- [ ] Request count, response time tracking
- [ ] Error tracking (Sentry integration)
- [ ] Uptime monitoring (UptimeRobot veya Pingdom)
- [ ] Email alerts (critical errors)
- [ ] Slack/Teams webhook integration

**Health Check Örneği:**
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "3.1.0",
        "timestamp": datetime.utcnow()
    }

@app.get("/ready")
async def readiness_check(db: Session = Depends(get_db)):
    try:
        # Database bağlantı testi
        db.execute("SELECT 1")
        return {"status": "ready"}
    except Exception as e:
        raise HTTPException(status_code=503, detail="Database not ready")
```

---

## 🎯 FAZ 7: DOCUMENTATION VE TESTING (Sürekli)

### [ ] 7.1 API Documentation
**Yapılacaklar:**
- [ ] Swagger UI iyileştirme (zaten var, zenginleştirilecek)
- [ ] API kullanım örnekleri
- [ ] Postman collection export
- [ ] Error code reference
- [ ] Rate limit documentation
- [ ] Authentication guide

**Dosya:**
```
docs/
  ├── API_REFERENCE.md
  ├── AUTHENTICATION.md
  ├── ERROR_CODES.md
  ├── RATE_LIMITS.md
  └── postman/
      └── Aliaport_v3_1.postman_collection.json
```

---

### [ ] 7.2 Unit Tests
**Yapılacaklar:**
- [ ] pytest setup
- [ ] Model tests (her model için)
- [ ] API endpoint tests (her endpoint için)
- [ ] Business logic tests
- [ ] Coverage target: %80+
- [ ] CI/CD'ye entegrasyon

**Test Yapısı:**
```
backend/tests/
  ├── conftest.py           # Fixtures
  ├── test_models.py
  ├── test_api_cari.py
  ├── test_api_isemri.py
  ├── test_api_worklog.py
  └── test_business_logic.py
```

**Örnek Test:**
```python
def test_create_work_order(client, db):
    response = client.post("/api/work-order", json={
        "cari_id": 1,
        "cari_code": "TEST001",
        "type": "HIZMET",
        "subject": "Test"
    })
    assert response.status_code == 200
    assert "wo_number" in response.json()
```

---

### [ ] 7.3 Integration Tests
**Senaryolar:**
- [ ] İş Emri Tam Flow:
  1. Talep oluştur (DRAFT)
  2. Onayla (APPROVED)
  3. Sahaya gönder (SAHADA)
  4. WorkLog kaydet
  5. Tamamla (TAMAMLANDI)
  6. Faturala (FATURALANDI)
  7. Kapat (KAPANDI)

- [ ] Güvenlik Flow:
  1. İş emri sorgula
  2. Checklist kontrol
  3. Giriş izni ver
  4. Çıkış kaydı

- [ ] Cari Flow:
  1. Cari oluştur
  2. İş emri ekle
  3. Fatura kes
  4. Ekstre görüntüle

**Test Dosyası:**
```python
# tests/integration/test_work_order_flow.py
def test_complete_work_order_lifecycle(client, db):
    # 1. Create
    wo = create_work_order(...)
    
    # 2. Approve
    approve_work_order(wo.id)
    
    # 3. Start work
    start_field_work(wo.id)
    
    # 4. Complete
    complete_work_order(wo.id)
    
    # 5. Invoice
    invoice = create_invoice(wo.id)
    
    # Assertions
    assert wo.status == "KAPANDI"
    assert invoice.amount > 0
```

---

## 📈 İLERLEME METRİKLERİ

### Şu Anki Durum (%72 Olgunluk) ⬆️ +7%
- ✅ Fonksiyonel modüller: %100
- ✅ **Veri güvenliği: %100 (FAZ 1 TAMAMLANDI)**
- ⚠️ Production hazırlığı: %50 (+10%)
- ⚠️ Güvenlik (Auth/RBAC): %50
- ⚠️ Ölçeklenebilirlik: %30
- ⚠️ Dokümantasyon: %50 (+5%)
- ⚠️ Test coverage: %10

### 6 Ay Sonra Hedef (%90 Olgunluk)
- ✅ Fonksiyonel modüller: %100
- ✅ Veri güvenliği: %100
- ✅ Production hazırlığı: %90
- ✅ Güvenlik: %85
- ✅ Ölçeklenebilirlik: %80
- ✅ Dokümantasyon: %85
- ✅ Test coverage: %80

---

## 📅 ÖNERİLEN ZAMAN ÇİZELGESİ

### Ay 1-2: Temel Altyapı
- ✅ Migration aktivasyonu
- ✅ Backup sistemi
- ✅ Logging yapısı
- ✅ Error handling
- ✅ API standardization

### Ay 3-4: Güvenlik
- ✅ Auth sistemi
- ✅ RBAC
- ✅ Rate limiting
- ✅ Security audit

### Ay 5-6: Ölçeklenebilirlik
- ✅ Database optimization
- ✅ Caching
- ✅ Performance tuning
- ✅ Load testing

### Ay 6-8: Production
- ✅ Docker
- ✅ CI/CD
- ✅ Monitoring
- ✅ Deployment
- ✅ Documentation

---

## 🎯 ACİL ÖNCELİKLİ 3 ADIM (Bu Hafta)

### ✅ 1. Migration Aktivasyonu (TAMAMLANDI - 23 Kasım 2025)
```bash
cd backend
alembic revision --autogenerate -m "Initial migration - all modules"
alembic upgrade head
# main.py'den Base.metadata.create_all kaldırıldı
```

### ✅ 2. Requirements Pinning (TAMAMLANDI - 23 Kasım 2025)
```bash
pip freeze > backend/requirements-pinned.txt
# 88 paket versiyonları sabitlendi
```

### ✅ 3. Backup Script (TAMAMLANDI - 23 Kasım 2025)
```python
# scripts/backup_database.py oluşturuldu
# APScheduler'a eklendi - Her gün 03:00'da çalışıyor
# Retention policy: Daily 30d, Weekly 12w, Monthly 12m
```

---

## 🎯 SONRAKİ ÖNCELİKLER (FAZ 1 TAMAMLANDI ✅ - FAZ 2'ye Geçiliyor)

### Öncelik 4: API Response Standardizasyonu (FAZ 2.1)
- [ ] `backend/aliaport_api/core/responses.py` oluştur
- [ ] `StandardResponse` ve `ErrorResponse` Pydantic modelleri
- [ ] Tüm router'larda standardize et

### Öncelik 5: Logging Sistemi (FAZ 2.2)
- [ ] Structured logging (JSON format)
- [ ] Request ID tracking
- [ ] Log rotation (30 gün)

### Öncelik 6: Error Handling Middleware (FAZ 2.3)
- [ ] Global exception handler
- [ ] HTTP exception mapping
- [ ] Production'da detay gizleme

---

## 📝 NOTLAR

- SQLite şu an yeterli, ancak production'da PostgreSQL'e geçiş planla
- Replit ortamı development için ideal, production deployment ayrı sunucu gerektirir
- Her faz bittikten sonra staging ortamında test et
- Kullanıcı eğitimi ve dokümantasyon unutulmamalı
- Veri migration planı (eski sistemden yeniye) düşünülmeli

---

**Son Güncelleme:** 23 Kasım 2025  
**Sonraki Review:** Her ay sonu  
**Sorumlular:** Development team + Senior advisors

---
### 📌 Gün Sonu Notu - 23 Kasım 2025
Bugün FAZ 2.1 (API Response Standardizasyonu) kapsamında toplam 6 router standardize edildi:
- Cari, Parametre, Tarife, Kurlar (CRUD + özel endpoint'ler)
- Ortak: success_response / error_response / paginated_response kullanımı
- Hata kodları: ErrorCode ile eşlenmiş (KUR_*, TARIFE_*, vb.)

Tamamlananlar:
- Datetime ISO serialization merkezi hale getirildi
- TCMB ve EVDS fetch süreçleri ErrorCode tablosuna entegre edildi
- Duplicate / not found / external API hataları unified formatta dönüyor

Yarın Başlanacak:
- Hizmet router standardizasyonu (liste + filtre + CRUD)
- Sonrasında Motorbot → Sefer → Barınma sırayla ele alınacak

Plan Notu:
Önce tüm router'lar unify edilecek, ardından FAZ 2.2 (Logging) ve FAZ 2.3 (Global Error Middleware) aşamalarına geçilecek.
