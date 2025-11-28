# ALIAPORT v3.1 - ÜRETİM HAZIRLIK YOL HARİTASI

**Oluşturulma Tarihi:** 23 Kasım 2025  
**Son Güncelleme:** 25 Kasım 2025  
**Güncel Durum:** FAZ 1-6 ✅ TAMAMLANDI | FAZ 7 Testing & Optimization BAŞLATILDI  
**Hedef:** Production-ready sistem (%95 olgunluk - 6 ay)

---

## 📊 MEVCUT DURUM

### ✅ Tamamlanan (13 Aktif Modül + 2 Planned)
- **13 Aktif Modül:** Cari, Motorbot, Sefer, Hizmet, Tarife, Barınma, Kurlar, Parametre, İş Emri, Saha Personeli, Güvenlik, Auth, Audit
- **2 Planned Modül:** Dijital Arşiv, Raporlar (sadece permission'larda tanımlı)
- FastAPI + SQLAlchemy modüler backend yapısı
- React + TypeScript feature-based frontend
- **✅ Alembic migration altyapısı (AKTIF)**
- **✅ Otomatik database backup sistemi (AKTIF - Her gün 03:00)**
- **✅ Requirements pinning (Development/Production stratejisi)**
- **✅ API Response Standardizasyonu (13/13 router - ISO8601 + ErrorCode)** (Auth + Audit eklendi)
- **✅ Structured Logging (JSON + 4 log tipi + Request ID tracking)**
- **✅ Global Error Handler (Production security + standardized errors)**
- **✅ Comprehensive Module Documentation** (13 modül runbook/)
- CORS ve multi-origin desteği

### ⚠️ Kalan Kritik İşler (FAZ 7 - Testing & Optimization)
- Test coverage artırımı (%10 → %80)
- Load testing & performance tuning
- Production deployment
- User acceptance testing

---

## 🎯 FAZ 1: VERİ GÜVENLİĞİ VE STABİLİTE (ACIL - 1-2 hafta)

### [✅] 1.1 Migration Yönetimi (TAMAMLANDI - 23 Kasım 2025)
**Durum:** ✅ Alembic aktif ve çalışıyor  
**Yapılanlar:**
- [x] İlk migration oluşturuldu: `5cb311f7ffd7_initial_migration_all_modules_with_updated_cari_fields`
- [x] Migration uygulandı: `alembic upgrade head`
- [x] main.py'den `Base.metadata.create_all(bind=engine)` kaldırıldı
- [x] Migration workflow dokümante edildi (main.py'de yorum olarak)
- [x] Downgrade stratejisi eklendi (Rollback rehberi + backup adımları)

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

### [✅] 2.1 API Response Standardizasyonu (TAMAMLANDI - 23 Kasım 2025)
**Hedef:** Tüm API yanıtları ISO8601 timestamp ve tutarlı format kullanacak  
**Durum:** ✅ 12/12 router tamamlandı - `success_response`, `error_response`, `paginated_response`

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

// Paginated
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total": 245,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  },
  "message": "Liste",
  "timestamp": "2025-11-23T10:30:00Z"
}
```

**✅ Yapılanlar:**
- [x] `backend/aliaport_api/core/responses.py` oluşturuldu
- [x] `StandardResponse`, `ErrorResponse`, `PaginatedResponse` Pydantic modelleri
- [x] ISO8601 timestamp auto-serialization
- [x] `core/error_codes.py` - ErrorCode enum (75+ kodlar) + HTTP status mapping
- [x] **12/12 Router Standardize Edildi:**

**✅ Tamamlanan Router'lar (13/13 - %100):**
1. **Cari** (`modules/cari/router.py`) - 7 endpoint
   - Paginated list, search, CRUD, soft delete
2. **Parametre** (`modules/parametre/router.py`) - 5 endpoint
   - Kategori filtresi, kod/değer araması
3. **Tarife** (`modules/tarife/router.py`) - 5 endpoint
   - Hizmet/cari filtresi, tarih validasyonu
4. **Kurlar** (`modules/kurlar/router.py`) - 6 endpoint
   - EVDS entegrasyonu, freeze mekanizması, published rate
5. **Hizmet** (`modules/hizmet/router.py`) - 5 endpoint
   - Tarife kullanım kontrolü, duplicate check
6. **Motorbot** (`modules/motorbot/router.py`) - 5 endpoint
   - Sefer sayısı kontrolü, mb_kod filtresi
7. **Sefer/MbTrip** (`modules/motorbot/router.py`) - 5 endpoint
   - Motorbot kullanım kontrolü, completion status
8. **Barınma** (`modules/barinma/router.py`) - 6 endpoint
   - Motorbot/cari filtreleri, aktif kontrat sorgusu
9. **İş Emri** (`modules/isemri/router.py`) - 17 endpoint
   - 9 WorkOrder + 8 WorkOrderItem
   - Stats, status change, WO numarası ile getir
   - Faturalama kontrolü, uninvoiced items
10. **WorkLog/Saha** (`modules/saha/router.py`) - 7 endpoint ✅ YENİ
    - Paginated list, stats (personel/servis tipi bazlı)
    - Duration hesaplama, onay mekanizması
11. **GateLog/Güvenlik** (`modules/guvenlik/router.py`) - 11 endpoint
    - 6 GateLog (giriş/çıkış, istisna+PIN, stats)
    - 5 GateChecklistItem (CRUD, seed default)
    - Exception PIN hash'leme
12. **Auth** (`modules/auth/router.py`) - 8 endpoint ✅
    - Login, logout, refresh token
    - User CRUD, password reset
    - RBAC (roles, permissions)
13. **Audit** (`modules/audit/router.py`) - 3 endpoint ✅
    - Audit log listing, filtering
    - Event detail, stats

**Error Codes Eklenenler:**
- `WO_*`, `WO_ITEM_NOT_FOUND` (İş Emri)
- `WORKLOG_*` (Saha Personeli)
- `GATELOG_*` (Güvenlik)
- Tüm kodlar `ERROR_CODE_TO_HTTP_STATUS` mapping'e dahil

**Yapılacaklar:**
- [ ] Frontend API client'larını güncelle (FAZ 3 ile birlikte)
- [ ] Swagger/OpenAPI dokümantasyonu güncellemesi

---

### [✅] 2.2 Logging Sistemi (TAMAMLANDI - 23 Kasım 2025)
**Hedef:** Structured JSON logging with rotation and filtering  
**Durum:** ✅ Tamamlandı - Request ID tracking + 4 log dosyası + rotation

**Yapılanlar:**
- [x] `backend/aliaport_api/core/logging_config.py` oluşturuldu
  - JSONFormatter - Structured JSON output
  - ColoredConsoleFormatter - Development için renkli console
  - setup_logging() - Merkezi konfigürasyon
  - Helper functions: log_api_request(), log_business_event(), log_error()
- [x] **4 Log Dosyası Türü:**
  - `logs/app.log` - Genel uygulama (JSON, daily rotation, 30 gün)
  - `logs/api.log` - API istekleri (JSON, daily rotation, 30 gün)
  - `logs/error.log` - Sadece ERROR/CRITICAL (JSON, 10MB size rotation)
  - `logs/audit.log` - İş kuralı olayları (JSON, daily rotation, 90 gün)
- [x] Request ID tracking - UUID bazlı unique ID
- [x] Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- [x] Third-party logger filtering (uvicorn, sqlalchemy)
- [x] Environment variable: `LOG_LEVEL` (default: INFO)

**Dosyalar:**
```
backend/aliaport_api/core/logging_config.py
logs/
  ├── app.log          # Genel (30d retention)
  ├── api.log          # API requests (30d retention)
  ├── error.log        # Errors only (10 files x 10MB)
  └── audit.log        # Critical events (90d retention)
```

**Kullanım:**
```python
from core.logging_config import get_logger, log_business_event

logger = get_logger(__name__)
logger.info("İşlem başarılı")

# Audit log
log_business_event(
    event_type="WO_APPROVED",
    description="İş emri onaylandı",
    user_id=123,
    entity_type="WorkOrder",
    entity_id=456
)
```

---

### [✅] 2.3 Error Handling Middleware (TAMAMLANDI - 23 Kasım 2025)
**Hedef:** Global exception handler + production error detail hiding  
**Durum:** ✅ Tamamlandı - Tüm hatalar standardize + security

**Yapılanlar:**
- [x] `backend/aliaport_api/middleware/error_handler.py` oluşturuldu
  - Global exception handler (tüm yakalanmamış hatalar)
  - HTTP exceptions → Standardized error_response
  - Validation errors (Pydantic) → 422 with details
  - Database errors (SQLAlchemy) → IntegrityError, OperationalError
  - Production mode → Detayları gizle
- [x] `backend/aliaport_api/middleware/request_logging.py` oluşturuldu
  - Her request için timing (milliseconds)
  - Request ID generation (UUID)
  - X-Request-ID response header
  - Query params + client IP logging
- [x] main.py'ye entegrasyon
  - app.add_exception_handler(Exception, global_exception_handler)
  - app.add_middleware(RequestLoggingMiddleware)
- [x] Environment variable: `ENVIRONMENT` (development/production)

**Özellikler:**
- ✅ Production'da SQL/exception detayları gizlenir
- ✅ Request ID her response header'da (`X-Request-ID`)
- ✅ Tüm hatalar error_response() formatında
- ✅ Database hataları özel işleme (409 Conflict, 503 Unavailable)
- ✅ Request timing her log'da (ms cinsinden)

**Dosyalar:**
```
backend/aliaport_api/middleware/
  ├── __init__.py
  ├── request_logging.py    # Request ID + timing
  └── error_handler.py      # Global exception handler
```

**Örnek Log Çıktısı:**
```json
{
  "timestamp": "2025-11-23T14:30:45Z",
  "level": "INFO",
  "logger": "aliaport_api.middleware.request_logging",
  "message": "GET /api/cari - 200 (45.23ms)",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "extra": {
    "type": "api_request",
    "method": "GET",
    "path": "/api/cari",
    "status_code": 200,
    "duration_ms": 45.23
  }
}
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

**Tamamlananlar (Sprint 1 - 23 Kasım 2025):**
- [x] `frontend/src/core` klasör yapısı (api, hooks, utils, constants, types, state)
- [x] `frontend/src/shared/ui` temel UI bileşenleri (Loader, ErrorMessage, PaginationControls)
- [x] Standart response TS tipleri (`core/types/responses.ts`)
- [x] API client wrapper (`core/api/client.ts`) – request ID propagation + unified error
- [x] Generic hooks (`useApi`, `usePaginated`)
- [x] Zustand store'lar (`authStore`, `themeStore`)
- [x] Domain tipleri (Cari, Hizmet, Tarife, Parametre) `shared/types` altında ✅ YENİ
- [x] Layout bileşenleri (`shared/layouts/AppLayout`, `PageLayout`) ✅ YENİ
- [x] Utils: tarih & sayı format helper'ları (`core/utils/date.ts`, `number.ts`) ✅ YENİ
- [x] Constants: ErrorCode map + API path map (`core/constants/errorCodes.ts`, `apiPaths.ts`) ✅ YENİ
- [x] Assets temel klasörü (`src/assets/` + README_ASSETS.md) ✅ YENİ
- [x] Form validation başlangıç (Zod + RHF adapter + `CariCreateForm`) ✅ YENİ

**Kalan Yapılacaklar (Güncel):**
- [x] Response meta (request_id) opsiyonel debug paneli ✅ TAMAMLANDI
- [x] Form yapıları için ortak Field bileşenleri ✅ TAMAMLANDI
- [x] API cache stratejisi değerlendirmesi ✅ TAMAMLANDI (React Query seçildi)
- [x] React Query kurulum + QueryClientProvider entegrasyonu ✅ TAMAMLANDI
- [x] İlk useQuery implementasyonu (Cari CRUD hooks) ✅ TAMAMLANDI
- [ ] Icon/SVG optimizasyon pipeline (sprite üretimi)
- [ ] Tematik (dark/light) görsel varyant stratejisi dokümantasyonu

**Öngörülen Sonraki Adım:** Form date/number parser entegrasyonu + debounce async validation.

---

### [ ] 3.2 State Management
**İlerleme (23 Kasım 2025):**
- ✅ Zustand eklendi (authStore, themeStore)
- ✅ Persist mekanizması uygulandı (`persistStore` util + localStorage)
  - Auth: sadece `user`, `token` partial persist (privacy)
  - Theme: `mode` kalıcı, sistem tercihi başlangıçta belirleniyor
- ✅ Global toast/notification store (`toastStore`) + UI renderer ✅ YENİ
- ✅ Request meta store (`requestMetaStore`) + API client entegrasyonu ✅ YENİ

**Yapılanlar:**
- `persistConfig.ts` generic wrapper (partialize + migrate hook)
- Token/user minimal saklama, logout'ta temizleme
- Theme toggle anında persist (flash azaltma)
- Toast queue + auto-dismiss + severity (info/success/warning/error)
- Request ID ve error code yakalama (X-Request-ID header)
- Debug panel komponenti (sağ alt köşede request_id + son hata)

**Kalan Yapılacaklar:**
- [x] API cache stratejisi (React Query vs SWR karar dokümanı) ✅ TAMAMLANDI
- [x] React Query kurulumu ve ilk entegrasyon (QueryClientProvider) ✅ TAMAMLANDI
- [x] Cari CRUD hooks (useQuery + useMutation + invalidateQueries) ✅ TAMAMLANDI
- [ ] Diğer modüller için React Query hooks (Hizmet, Tarife, Parametre, vb.)
- [ ] Role-based UI guard (FAZ 4 sonrası yetki ile)
- [ ] Persist version migration örneği (auth v2 -> ek refreshToken alanı)
- [ ] Toast position/theme customization

**Neden Gerekli:** Persist ile oturum/tema sürekliliği sağlandı; toast ile kullanıcı geri bildirimi; debug panel ile troubleshooting hızlandı; React Query ile cache & real-time updates.

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
**İlerleme:**
- ✅ React Hook Form + Zod entegrasyonu (ilk form: CariCreateForm)
- ✅ Generic adapter (`useZodForm`)
- ✅ Ortak FormField / TextInput / SelectInput / TextAreaInput bileşenleri ✅ YENİ
- ✅ Backend error → field map (`backendErrorMap.ts`) ✅ YENİ
- ✅ Hizmet ve Tarife form şemaları ✅ TAMAMLANDI
- ✅ Async doğrulama (unique Kod kontrolü) adaptörü ✅ TAMAMLANDI

**Kalan Yapılacaklar:**
- [ ] Date/number parse helper entegrasyonu (formatters ile)
- [ ] Global form error handler hook (API → setError otomasyonu)
- [ ] Async validation debounce implementasyonu

**Örnek (Cari Şeması):** `cariCreateSchema` (min/max, enum, opsiyonel alanlar, boş string -> undefined normalizasyonu)

**Kullanım Kılavuzu:** `FORM_COMPONENTS_GUIDE.md` dosyasında detaylı örnekler ve `injectBackendError` kullanımı.

---

###✅ 3.4 Data Fetching & Cache Management (TAMAMLANDI - 23 Kasım 2025)
**Durum:** ✅ React Query kuruldu + QueryClientProvider entegre + ilk hooks oluşturuldu

**Yapılanlar:**
- [x] `@tanstack/react-query` paket kurulumu (v5)
- [x] `core/cache/queryClient.ts` - QueryClient + cache policies
  - Modül bazlı cache zaman aşımları (CARI: 5dk, PARAMETRELER: 1s, KURLAR: 4s)
  - `createQueryKey()` ve `getQueryOptions()` helper'ları
  - Default ayarlar: staleTime 5dk, gcTime 10dk, retry 1
- [x] App.tsx'e QueryClientProvider + ReactQueryDevtools entegrasyonu
- [x] `core/hooks/queries/useCariQueries.ts` - İlk query hook seti
  - `useCariList()` - Paginated list with search
  - `useCariDetail()` - Single entity detail
  - `useCreateCari()` - Create mutation + invalidation
  - `useUpdateCari()` - Update mutation + invalidation
  - `useDeleteCari()` - Delete mutation + invalidation
  - `useUpdateCariOptimistic()` - Optimistic UI update örneği
- [x] API client güncellemesi (`get`, `post`, `put`, `delete` metodları)
- [x] Response type güncellemesi (`common.types.ts` - ApiResponse, ApiErrorResponse)

**Özellikler:**
- ✅ Auto-refetch on mount and reconnect
- ✅ Cache invalidation after mutations
- ✅ Query key factory pattern (cariKeys)
- ✅ Error handling with discriminated union (success check + throw)
- ✅ Optimistic update örneği (UI hemen güncellenir, hata varsa rollback)
- ✅ Development DevTools (bottom-left panel - React Query Explorer)

**Dosya Yapısı:**
```
frontend/src/
├── core/
│   ├── cache/
│   │   ├── queryClient.ts          ✅ YENİ
│   │   └── API_CACHE_STRATEGY.md   ✅ YENİ
│   ├── hooks/
│   │   └── queries/
│   │       └── useCariQueries.ts   ✅ YENİ
│   └── api/
│       └── client.ts (updated)     ✅ GÜNCELLENDI
└── shared/
    └── types/
        └── common.types.ts (updated) ✅ GÜNCELLENDI
```

**Kalan Yapılacaklar:**
- [ ] Diğer modüller için query hooks (Hizmet, Tarife, Parametre, Motorbot, vb.)
- [ ] Pagination meta bilgisini React Query sonuçlarına ekle
- [ ] Prefetch stratejisi (hover/route değişikliğinde)
- [ ] Query cancellation (unmount durumunda)
- [ ] TS type narrowing iyileştirmesi (discriminated union response'lar için)

---

## 🎯 FAZ 4: GÜVENLİK VE AUTH (✅ TAMAMLANDI - 23 Kasım 2025)

### [✅] 4.1 Authentication Sistemi (TAMAMLANDI)
**Durum:** ✅ JWT + Refresh Token implementasyonu tamamlandı  
**Yapılanlar:**
- [x] JWT token-based auth
- [x] Access token (15 dk) + Refresh token (7 gün)
- [x] `/api/auth/login` endpoint
- [x] `/api/auth/refresh` endpoint  
- [x] `/api/auth/logout` endpoint
- [x] Password hashing (bcrypt)
- [x] User model ve tablo
- [x] Frontend AuthContext + ProtectedRoute

**Dosyalar:**
- `backend/aliaport_api/modules/auth/` (models, router, dependencies)
- `docs/AUTH_GUIDE.md` ✅
- `frontend/src/core/state/authStore.ts` ✅

---

### [✅] 4.2 Role-Based Access Control (RBAC) (TAMAMLANDI)
**Durum:** ✅ 7 rol + 50+ permission + decorator sistemi aktif

**Yapılanlar:**
- [x] User, Role, Permission modelleri (many-to-many ilişkiler)
- [x] 7 Standart Rol: SISTEM_YONETICISI, MUHASEBE, OPERASYON_MUDURU, PERSONEL, PORTAL_KULLANICI, SAHA_PERSONELI, GUVENLIK_PERSONELI
- [x] 50+ Permission tanımı (resource:action formatı - cari:read, isemri:approve, worklog:write, vb.)
- [x] `@require_permission` decorator (backend/aliaport_api/modules/auth/utils.py)
- [x] `has_permission()` method (User model)
- [x] Seed scripts (admin user + default roles + permissions)
- [x] Permission seeding (startup'ta otomatik)
- [x] Frontend authStore (Zustand) + token management

**User Model:**
```python
class User(Base):
    __tablename__ = "users"
    
    id: int
    email: str (unique)
    hashed_password: str
    full_name: str
    is_superuser: bool
    is_active: bool
    cari_id: int (nullable - portal users)
    roles: List[Role] (many-to-many)
    created_at: datetime
    updated_at: datetime
```

**Permission Format:** `resource:action` (örn: `cari:read`, `isemri:approve`, `worklog:write`)

**Dosyalar:**
- `backend/aliaport_api/modules/auth/` (models, router, utils, dependencies)
- `backend/aliaport_api/modules/auth/README_RBAC.md` ✅
- `runbook/11_MODUL_AUTH.md` ✅

---

### [✅] 4.3 API Security (TAMAMLANDI)
**Durum:** ✅ Rate limiting, JWT, password hashing, security headers aktif

**Yapılanlar:**
- [x] Rate limiting (SlowAPI) - 300/min default, auth-aware key function
  - Authenticated users: user_id bazlı
  - Anonymous: IP bazlı
  - Farklı endpoint'ler için özelleştirilebilir limitler
- [x] JWT authentication (python-jose) - 15dk access + 7 gün refresh token
- [x] Password hashing (bcrypt) - passlib ile
- [x] Security headers middleware:
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Content-Security-Policy
  - Referrer-Policy
  - Strict-Transport-Security (production)
- [x] CORS configuration (environment-based)
- [x] SQL injection koruması (SQLAlchemy ORM)
- [x] Global error handler (production'da detay gizleme)

**Kalan Yapılacaklar:**
- [ ] CSRF token (form submission)
- [ ] API key support (external integrations için)
- [ ] XSS koruması genişletme (input sanitization)

**Dependencies (Kurulu):**
```python
slowapi==0.1.8              # Rate limiting ✅
python-jose[cryptography]==3.3.0  # JWT ✅
passlib[bcrypt]==1.7.4      # Password hashing ✅
bcrypt==4.0.1               # bcrypt backend ✅
```

---

## 🎯 FAZ 5: PERFORMANCE VE ÖLÇEKLENEBİLİRLİK (5-6 hafta)

### [🔄] 5.1 Database Optimization (Kısmen Tamamlandı)
**Durum:** ✅ N+1 prevention aktif, index stratejisi planlandı, PostgreSQL'e geçiş bekliyor

**Yapılanlar:**
- [x] N+1 problem önleme - `lazy="raise"` pattern (Cari, Motorbot, MbTrip)
- [x] Explicit eager loading (selectinload, joinedload kullanımı)
- [x] SQLAlchemy 2.0 modern query patterns
- [x] Primary key auto-index (tüm modellerde)
- [x] Unique constraints (CariKod, MbKod, wo_number, vb.)

**PostgreSQL Geçişi İçin Planlandı:**
- [ ] Kritik index stratejisi (Alembic migration ile):
  - `work_order.wo_number` (UNIQUE INDEX) ✅ Mevcut
  - `work_order.cari_code` (INDEX)
  - `work_order.status` (INDEX)
  - `work_order.created_at` (INDEX)
  - `cari.cari_code` (UNIQUE INDEX) ✅ Mevcut
  - `motorbot.mb_code` (UNIQUE INDEX) ✅ Mevcut
  - `exchange_rate(currency_code, rate_date)` composite index
- [ ] Connection pooling config (PostgreSQL için)
- [ ] EXPLAIN ANALYZE query profiling
- [ ] Slow query logging

**SQLite Mevcut:**
- Primary key indexes (otomatik)
- Unique constraints (otomatik index)

**PostgreSQL Migration Script Örneği:**
```sql
-- Alembic migration ile eklenecek
CREATE INDEX idx_wo_cari_code ON work_order(cari_code);
CREATE INDEX idx_wo_status ON work_order(status);
CREATE INDEX idx_wo_created_at ON work_order(created_at);
CREATE INDEX idx_exchange_rate_lookup ON exchange_rate(currency_code, rate_date);
```

---

### [✅] 5.2 Caching Strategy (TAMAMLANDI - Frontend)
**Durum:** ✅ Frontend React Query cache aktif, backend Redis planned

**Yapılanlar (Frontend):**
- [x] React Query (@tanstack/react-query) v5 kurulumu
- [x] Modül bazlı cache politikaları (`core/cache/queryClient.ts`):
  - CARI: 5 dakika staleTime
  - PARAMETRELER: 1 saat staleTime
  - KURLAR: 4 saat staleTime
  - HIZMET/TARIFE: 30 dakika staleTime
  - MOTORBOT: 30 dakika staleTime
  - WORKORDER: 30 saniye staleTime (real-time)
- [x] 7 modül için query hooks (77 hooks toplam)
- [x] Cache invalidation after mutations
- [x] Optimistic updates (örnek: Cari, PriceListItem)
- [x] React Query DevTools (development)

**Backend (Planned):**
- [ ] Redis integration (docker-compose.yml'de hazır)
- [ ] API response cache (Redis)
- [ ] Static data cache (parametreler, kurlar)
- [ ] Cache-Control headers

**Mevcut Cache Politikası (Frontend):**
```typescript
// core/cache/queryClient.ts
MODULE_CACHE_POLICIES = {
  CARI: { staleTime: 5 * 60 * 1000 },        // 5 dakika
  PARAMETRELER: { staleTime: 60 * 60 * 1000 }, // 1 saat
  KURLAR: { staleTime: 4 * 60 * 60 * 1000 },  // 4 saat
  HIZMET: { staleTime: 30 * 60 * 1000 },      // 30 dakika
  TARIFE: { staleTime: 30 * 60 * 1000 },      // 30 dakika
  MOTORBOT: { staleTime: 30 * 60 * 1000 },    // 30 dakika
  WORKORDER: { staleTime: 30 * 1000 },        // 30 saniye
}
```

---

### [✅] 5.3 Background Jobs Organization (TAMAMLANDI)
**Durum:** ✅ APScheduler aktif, kritik job'lar çalışıyor

**Yapılanlar:**
- [x] APScheduler 3.11.1 kurulumu ve konfigürasyonu
- [x] Scheduler başlatma/durdurma (main.py startup/shutdown events)
- [x] **Aktif Job'lar:**
  - Kur güncelleme (günlük 16:00) - EVDS API sync ✅
  - Database backup (günlük 03:00) - 3 tier retention ✅
  - Barınma faturalama (her ayın 1'i, 09:00) ✅
- [x] Job registry pattern (`core/scheduler.py` + `jobs/__init__.py`)
- [x] Istanbul timezone (pytz)
- [x] Job exception handling ve logging

**Dosya Yapısı (Mevcut):**
```
backend/aliaport_api/
  ├── core/
  │   └── scheduler.py          # APScheduler config ✅
  ├── jobs/
  │   ├── __init__.py           # Job registry ✅
  │   ├── currency_sync.py      # Kur güncelleme ✅
  │   └── (diğer job'lar main.py'de inline)
  └── scripts/
      └── backup_database.py    # Backup job ✅
```

**Kalan Yapılacaklar:**
- [ ] Email/notification queue (SMTP konfigürasyonu sonrası)
- [ ] Audit log archiving (90 gün sonra S3'e taşıma)
- [ ] Report generation queue (Raporlar modülü ile)
- [ ] Database cleanup (eski log'lar - 30 gün retention)

**Scheduler Komutları:**
```python
# main.py'de otomatik başlatılıyor
# Manuel kontrol:
from core.scheduler import get_scheduler
scheduler = get_scheduler()
scheduler.print_jobs()  # Aktif job'ları listele
```

---

## 🎯 FAZ 6: PRODUCTION HAZIRLIĞI (✅ TAMAMLANDI - 23 Kasım 2025)

### [✅] 6.1 Environment Configuration (TAMAMLANDI)
**Durum:** ✅ Tüm environment dosyaları oluşturuldu  
**Yapılanlar:**
- [x] `.env.example` template oluşturuldu
- [x] `.env.production.example` production template
- [x] Config validation yapısı hazır
- [x] Sensitive data handling (JWT_SECRET_KEY, EVDS_API_KEY)
- [x] Environment-specific configs (DATABASE_URL, CORS, SMTP)

**Dosyalar:**
- `backend/.env.example` ✅
- `backend/.env.production.example` ✅
- `backend/aliaport_api/core/config.py` (config loader)

---

### [✅] 6.2 Docker/Containerization (TAMAMLANDI - 23 Kasım 2025)
**Durum:** ✅ Full stack containerization tamamlandı  
**Yapılanlar:**
- [x] `backend/Dockerfile` - Multi-stage build
  - Python 3.11-slim base
  - Non-root user (aliaport:1000)
  - Health check endpoint
  - Production requirements
  - Size optimization (~150MB)
- [x] `frontend/Dockerfile` - Multi-stage build
  - Node 20 build stage
  - Nginx 1.25 runtime
  - Gzip compression
  - Security headers
  - SPA routing support
- [x] `frontend/nginx.conf` - Reverse proxy config
  - API proxy to backend:8000
  - Static file serving
  - Security headers (X-Frame-Options, CSP, etc.)
  - Gzip compression
- [x] `docker-compose.yml` - Full stack orchestration
  - PostgreSQL 16 (production database)
  - Redis 7 (cache layer)
  - Backend service (FastAPI)
  - Frontend service (React + Nginx)
  - Health checks for all services
  - Volume persistence (postgres_data, redis_data, logs, backups)
  - Bridge network
- [x] `docker-compose.dev.yml` - Development override
  - Hot reload (volumes)
  - Debug ports
  - SQLite for local dev
- [x] `.dockerignore` files (backend + frontend)
- [x] `DOCKER_GUIDE.md` documentation

**Docker Stack:**
```yaml
services:
  db:        postgres:16-alpine (persistent volume)
  redis:     redis:7-alpine (cache)
  backend:   aliaport-backend:latest (health check)
  frontend:  aliaport-frontend:latest (Nginx + React)
```

**Commands:**
```bash
# Production
docker-compose up -d

# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Logs
docker-compose logs -f backend

# Health check
curl http://localhost:8000/health
```

---

### [✅] 6.3 CI/CD Pipeline (TAMAMLANDI - 23 Kasım 2025)
**Durum:** ✅ GitHub Actions workflows tamamlandı  
**Yapılanlar:**
- [x] `.github/workflows/ci.yml` - Continuous Integration
  - Backend: pytest + coverage + pylint + mypy
  - Frontend: vitest + eslint + tsc
  - Docker build test
  - PostgreSQL test database service
  - Codecov upload
  - Triggers: push, pull_request
- [x] `.github/workflows/deploy-staging.yml` - Staging Deployment
  - Build + push Docker images (latest + SHA tag)
  - SSH deploy to staging server
  - Rolling restart (zero downtime)
  - Health check validation
  - Slack notifications
  - Auto-deploy on main push
- [x] `.github/workflows/deploy-production.yml` - Production Deployment
  - Pre-deploy database backup
  - Versioned images (v1.0.0 + stable tag)
  - Manual approval (GitHub Environments)
  - Auto-rollback on failure
  - Health check validation
  - Slack + email notifications
  - Triggered by release tags
- [x] `.github/workflows/security.yml` - Security Scanning
  - Trivy vulnerability scan (dependencies + Docker images)
  - TruffleHog secret detection
  - Schedule: Weekly (Monday 06:00) + on push/PR
- [x] `CICD_SETUP.md` documentation

**GitHub Secrets Required:**
```
DOCKER_USERNAME
DOCKER_PASSWORD
STAGING_HOST
STAGING_USER
STAGING_SSH_KEY
PRODUCTION_HOST
PRODUCTION_USER
PRODUCTION_SSH_KEY
SLACK_WEBHOOK
CODECOV_TOKEN (optional)
```

**Workflow Features:**
- ✅ Automated testing on every push/PR
- ✅ Staging auto-deploy on main push
- ✅ Production manual approval
- ✅ Zero-downtime rolling restart
- ✅ Auto-rollback on failure
- ✅ Health check validation
- ✅ Security scanning (weekly + on-demand)
- ✅ Slack notifications
- ✅ Codecov integration

---

### [✅] 6.4 Monitoring & Alerting (TAMAMLANDI - 23 Kasım 2025)
**Durum:** ✅ Full monitoring stack aktif  
**Yapılanlar:**
- [x] Health & Metrics Endpoints
  - `GET /health` - Uptime check
  - `GET /ready` - Database readiness
  - `GET /metrics` - Prometheus exposition
  - `GET /status` - Detailed system info
- [x] `backend/aliaport_api/core/monitoring.py` - Monitoring module (146 lines)
  - Prometheus metrics (Counter, Histogram, Gauge)
  - psutil system monitoring (CPU, memory, disk)
  - Database connection validation
  - Request/response tracking
- [x] Prometheus Metrics:
  - `aliaport_http_requests_total` (method, endpoint, status)
  - `aliaport_http_request_duration_seconds` (histogram)
  - `aliaport_active_users` (gauge)
  - `aliaport_db_connections` (gauge)
  - `aliaport_cache_hit_rate` (gauge)
  - `aliaport_work_orders_total` (counter by status)
  - `aliaport_gate_logs_total` (counter by direction)
  - `aliaport_currency_sync_success` (counter)
  - `aliaport_currency_sync_failure` (counter)
- [x] `docker-compose.monitoring.yml` - Monitoring stack
  - Prometheus (metrics collection)
  - Grafana (visualization)
  - Alertmanager (notifications)
  - Node Exporter (system metrics)
- [x] `monitoring/prometheus.yml` - Scrape configs
- [x] `monitoring/alert.rules.yml` - 10 alert rules
  - Service down
  - High error rate (>5%)
  - High response time (>1s)
  - High database connections (>80)
  - Currency sync failures (>3/hour)
  - High CPU/memory/disk usage
  - Low disk space (<10GB)
- [x] `monitoring/alertmanager.yml` - Notification routing
  - Slack webhooks (#aliaport-alerts, #aliaport-critical)
  - Email alerts (critical only)
  - Severity-based routing
- [x] `MONITORING_GUIDE.md` - Complete documentation (400+ lines)
  - Endpoint usage
  - Prometheus setup
  - Grafana dashboards
  - Sentry integration
  - UptimeRobot setup
  - Alert rules
  - Troubleshooting
  - Performance baselines

**Dependencies Added:**
```
prometheus-client==0.19.0
psutil==5.9.6
sentry-sdk[fastapi]==1.39.2
```

**Monitoring Stack Commands:**
```bash
# Start monitoring
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Access
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)
# Alertmanager: http://localhost:9093

# Check metrics
curl http://localhost:8000/metrics

# System status
curl http://localhost:8000/status
```

**Alert Channels:**
- Slack: #aliaport-alerts (warnings)
- Slack: #aliaport-critical (critical)
- Email: admin@aliaport.com (critical only)

**Performance Baselines:**
- API response time (p95): < 300ms (list), < 200ms (create), < 50ms (health)
- Error rate: < 1% (5xx), < 5% (4xx acceptable)
- System resources: CPU < 60%, Memory < 75%, Disk < 80%
- Database: Connection pool < 80%, Query duration (p95) < 100ms

---

## 🎯 FAZ 7: DOCUMENTATION VE TESTING (Başlatıldı - 23 Kasım 2025)

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

### Şu Anki Durum (%92 Olgunluk) ⬆️ +2%
- ✅ Fonksiyonel modüller (Backend): %100 (13 aktif modül)
- ✅ **Veri güvenliği: %100 (FAZ 1 TAMAMLANDI)**
- ✅ **Backend standardizasyon + observability: %100 (FAZ 2 TAMAMLANDI)**
- ✅ **Frontend olgunlaşma: %70** (+5%) - React Query (7 modül, 77 hooks), forms, cache, UI
- ✅ **Production hazırlığı: %100 (FAZ 6 TAMAMLANDI)**
- ✅ **Güvenlik (Auth/RBAC): %100 (FAZ 4 TAMAMLANDI)**
- ✅ **Ölçeklenebilirlik: %85** (FAZ 5 - N+1 ✅, Cache ✅, Jobs ✅, PostgreSQL pending)
- ✅ **Dokümantasyon: %90** (+20%) - 13 modül runbook ✅
- ⚠️ Test coverage: %10 (FAZ 7 bekliyor)

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

## 🎯 ACİL ÖNCELİKLİ 3 ADIM (Bu Hafta - Frontend Focus)

### ✅ 1. Frontend Çekirdek Yapı (Tamamlandı - 23 Kasım 2025)
```bash
frontend/src/core/{api,hooks,types,state}
frontend/src/shared/ui/{Loader,ErrorMessage,PaginationControls}
Zustand eklendi (authStore, themeStore)
```

### ✅ 2. Örnek Feature Entegrasyonu (Tamamlandı - 23 Kasım 2025)
```bash
Work Order list + pagination + error/loader bileşenleri
usePaginated hook ile entegrasyon
```

### ⏳ 3. Form Validation Altyapısı (Plan - Başlatılacak)
```python
React Hook Form + Zod adaptörü
Shared validation schemas (cari, iş emri, hizmet vs.)
```

---

## 🔄 Konsolidasyon & Güncel Odak (23 Kasım 2025)

Önceki dokümanda "Öncelik 4/5/6" olarak listelenen API Response Standardizasyonu, Logging Sistemi ve Error Handling Middleware tamamen TAMAMLANDI. Aşağıda tekrar eden maddeler çıkarıldı, güncel gerçek açık işler ve bir sonraki faza hazırlık maddeleri derlendi.

### ✅ FAZ 3 TAMAMLANDI (23 Kasım 2025)
- [x] `WorkOrderListModern.tsx` (durum makinesi buton seti + hızlı filtreler) ✅
- [x] Gelişmiş Formlar ✅
  - WorkOrderForm (create + basic fields + Zod schema)
  - MotorbotTripForm (MbTrip create + zaman validasyonu)
  - PriceListItemInlineForm (inline edit + optimistic update)
- [x] Icon/SVG sprite pipeline (build-time optimizasyon + tek HTTP isteği) ✅
  - 21 SVG icon (add, edit, delete, search, view, chevron-*, filter, etc.)
  - Auto-generated TypeScript types (icon-names.ts)
  - Build script (scripts/build-icons.js)
  - Single HTTP request (~3KB gzipped)
  - README_ICONS.md dokümantasyonu
- [x] Modern Liste Komponentleri ✅
  - ParametreListModern.tsx (kategori filtreleme + 14 themed badge)
  - KurlarListModern.tsx (TCMB sync + currency pairs + frozen status)
  - MotorbotListModern.tsx (sefer istatistikleri + durum select)
- [x] Barınma Modülü React Query Hooks ✅
  - useBarinmaQueries.ts (7 hooks: list, detail, active, create, update, end, delete)
  - Toast notifications (contract number display)
  - Cache invalidation strategy
- [x] Tema dokümantasyonu (dark/light varyant + contrast matrisi) ✅
- [x] Erişilebilirlik (WCAG 2.1 AA) dokümantasyonu ✅
- [x] Performans ölçüm stratejisi (React Profiler + bundle split) ✅
- [x] Pagination meta entegrasyonu (generic hook + SimplePagination) ✅
- [x] Skeleton komponentleri (4 variant + loading states) ✅
- [x] Toast standardizasyonu (6 modül, 28+ mutation) ✅
  - Hizmet, Tarife, Motorbot, Parametre, Kurlar, WorkOrder, Barınma

### 🔐 FAZ 4 (Auth & RBAC) Hazırlık Maddeleri
- [ ] JWT issuance service (access + refresh, rotation & blacklist tablosu)
- [ ] Şifre saklama: bcrypt + configurable work factor
- [ ] Role-permission matrisi (enum + permission set; dekorator: `@require_role`, `@require_permission`)
- [ ] Frontend guard komponentleri (ProtectedRoute, RoleBoundary)
- [ ] Güvenli parola reset akışı (token tablosu + expiry + tek kullanımlık)
- [ ] Audit trail ilerletme: user_id + role snapshot log_business_event içine ek alan
- [ ] Rate limiting tasarımı (SlowAPI / Redis tabanlı) – anonim & auth ayrımı
- [ ] Security headers (Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, Content-Security-Policy temel)

### 📦 FAZ 5 (Ölçeklenebilirlik) Ön Hazırlık Notları
- [ ] PostgreSQL şeması geçiş planı (typemap: SQLite -> PG; DATE/TIMESTAMP doğrulama)
- [ ] İlk kritik index setinin Alembic revision olarak eklenmesi
- [ ] k6 ile yük testi senaryoları taslağı (WorkOrder yoğun CRUD + GateLog yüksek frekans)
- [ ] Redis keşif: parametre/kurlar için TTL tabanlı hot cache

### 🛠 Teknik Borç & Refactor Adayları
- [ ] Hook duplication kontrolü (benzer patternleri `createMutationFactory` ile soyutla)
- [ ] Error code enum konsolidasyonu (aynı anlamlı varyantların sadeleşmesi)
- [ ] Tarih/sayı parse helper'ları formlarda tam kapsama (her form input → normalization pipeline)

### ⚠️ Riskler (Önleyici Aksiyon Gerektiriyor)
- R1: Auth implementasyonu gecikirse frontend korumasız kalır → FAZ 4 kickoff tarihine sadık kal (hafta 2 sonu).
- R2: PostgreSQL geçişi ertelenirse index & concurrency kazanımları kaçırılır → Geçiş planı ilk Alembic taslağı Ay 2 başı.
- R3: Test coverage düşük kalırsa refactor'lerde kırılma riski → Minimum %30 hedefi Ay 1 sonu, her merge'de incremental.
- R4: Icon/SVG sprite olmadan ağ istek sayısı artar → Pipeline'i FAZ 3 kapanmadan tamamlama.

### ✅ Tamamlanmış (Tekrarı Kaldırıldı)
- API Response Standardizasyonu (Pydantic modeller + tüm router'lar)
- Logging Sistemi (JSON, rotation, audit, request id)
- Global Error Handling Middleware (production sanitization)

Bu bölüm düzenli olarak güncellenecek; tamamlananlar alt kısımdaki "Tamamlanmış" listesine taşınacak, yeni maddeler ilgili faz altına eklenecek.

---

## 📝 NOTLAR

- SQLite şu an yeterli, ancak production'da PostgreSQL'e geçiş planla
- Replit ortamı development için ideal, production deployment ayrı sunucu gerektirir
- Her faz bittikten sonra staging ortamında test et
- Kullanıcı eğitimi ve dokümantasyon unutulmamalı
- Veri migration planı (eski sistemden yeniye) düşünülmeli

---

**Son Güncelleme:** 25 Kasım 2025  
**Sonraki Review:** Her ay sonu  
**Sorumlular:** Development team + Senior advisors

**🎯 Güncel Odak Noktaları:**
- FAZ 7: Unit & Integration Tests (pytest, coverage %80 hedefi)
- PostgreSQL Migration (SQLite → PostgreSQL production)
- Frontend modül completion (remaining list/form components)
- Load testing & performance tuning

---
### 📌 Gün Sonu Notu - 23 Kasım 2025 (FAZ 3 İlerleme Güncellemesi - Sprint 2 + Sprint 3 + Sprint 4)
Frontend olgunlaşma hızla ilerliyor. Sprint 2 + Sprint 3 + Sprint 4'te state, notification, form, cache stratejisi ve React Query entegrasyonu tamamlandı:

**Sprint 2 Tamamlananlar:**
- ✅ Global toast/notification store + `ToastRenderer` UI (auto-dismiss, queue, severity)
- ✅ Request meta store + API client entegrasyonu (request_id & error_code capture)
- ✅ Debug panel (`RequestDebugPanel`) → sağ alt köşede son request_id ve hata kodu
- ✅ Form bileşen kütüphanesi (`FormField`, `TextInput`, `SelectInput`, `TextAreaInput`)
- ✅ Backend error → field map helper (`backendErrorMap.ts` + `injectBackendError`)
- ✅ `CariCreateForm` güncellendi (ortak bileşenler kullanıyor)
- ✅ Form kullanım kılavuzu (`FORM_COMPONENTS_GUIDE.md`)

**Sprint 3 Tamamlananlar:**
- ✅ API cache stratejisi değerlendirmesi (`API_CACHE_STRATEGY.md`) → **React Query seçildi**
- ✅ Async validation hook (`useAsyncValidation` + `createUniqueCodeValidator`)
- ✅ Hizmet form şemaları (`hizmetSchema.ts` - create/update)
- ✅ Tarife form şemaları (`tarifeSchema.ts` - PriceList + PriceListItem, tarih cross-validation)

**Sprint 4 Tamamlananlar:**
- ✅ React Query (`@tanstack/react-query`) paket kurulumu
- ✅ `core/cache/queryClient.ts` oluşturuldu (modül bazlı cache politikaları)
  - CARI: 5dk, PARAMETRELER: 1h, KURLAR: 4h, HIZMET/TARIFE: 30dk, MOTORBOT: 30dk, WORKORDER: 30s
  - `createQueryKey()` ve `getQueryOptions()` helper'ları
- ✅ App.tsx'e `QueryClientProvider` + `ReactQueryDevtools` entegrasyonu
- ✅ API client güncellemesi (`get`, `post`, `put`, `delete` metodları eklendi)
- ✅ Response type güncellemesi (`common.types.ts` - ApiResponse + ApiErrorResponse)

**Sprint 4 - Query Hooks Tamamlananlar (7/7 Modül ✅ TAMAMLANDI):**
- ✅ `useCariQueries.ts` (7 hooks: list, detail, create, update, delete, optimistic)
- ✅ `useHizmetQueries.ts` (8 hooks: list, detail, byCode, create, update, delete, toggleStatus)
- ✅ `useTarifeQueries.ts` (12 hooks: PriceList 6 + PriceListItem 6, master-detail ilişkisi)
- ✅ `useParametreQueries.ts` (9 hooks: list, detail, byCode, byCategory, create, update, delete, updateValue)
- ✅ `useMotorbotQueries.ts` (14 hooks: Motorbot 9 + MbTrip 5, dual entity yönetimi)
- ✅ `useKurlarQueries.ts` (11 hooks: list, detail, byPair, latest, create, update, delete, fetchTCMB, bulk)
- ✅ `useWorkOrderQueries.ts` (16 hooks: WorkOrder 9 + WorkOrderItem 7, state machine transitions)
- ✅ Frontend type dosyaları (`motorbot.ts`, `kurlar.ts`, `workorder.ts` güncellendi)

**Sprint 4 - Form Utils Tamamlananlar:**
- ✅ `core/utils/date.ts` genişletildi (11 yeni fonksiyon)
  - Parse: `parseISODate`, `parseISODateTime`, `parseISOTime` (ISO → form input)
  - Format: `toISODate`, `toISODateTime`, `combineDateAndTime` (form input → ISO)
  - Validation: `isValidISODate`, `todayISODate`, `nowISODateTime`
- ✅ `core/utils/number.ts` genişletildi (9 yeni fonksiyon)
  - Parse: `parseDecimal`, `parseCurrency`, `parsePercentage`, `parseInteger` (TR/EN locale desteği)
  - Format: `formatPercentage` (yeni)
  - Validation: `isValidNumber`, `roundTo`, `clamp`

**Sprint 5 - UI Components & Validation Tamamlananlar (4/4 Görev ✅):**
- ✅ `shared/ui/Pagination.tsx` oluşturuldu (2 variant: Full + Simple)
  - Smart page number display (ellipsis, current page highlight)
  - Mobile & desktop responsive design
  - Tailwind CSS styling, accessibility support (aria-labels)
- ✅ `features/cari/CariListModern.tsx` oluşturuldu (React Query örneği)
  - `useCariList`, `useDeleteCari` hooks kullanımı
  - Search, filter (cari_tip), pagination desteği
  - CRUD actions (view, edit, delete) with loading states
- ✅ `core/validation/schemas/workorderSchema.ts` oluşturuldu
  - WorkOrder + WorkOrderItem create/update schemas
  - Date range validation (PlannedStart/End, ActualStart/End)
  - Calculated totals validation (Quantity × UnitPrice = TotalAmount, VAT calculations)
  - Status change schema
- ✅ `core/validation/schemas/motorbotSchema.ts` oluşturuldu
  - Motorbot + MbTrip create/update schemas
  - Kapasite/hız limit validations (max 1000 ton, 100 knot)
  - Sefer zaman validations (Çıkış < Dönüş, same day check)
  - İskele validation (en az biri dolu), Owner validation
- ✅ `useAsyncValidation` hook'a debounce implementasyonu eklendi
  - setTimeout + cleanup pattern (useRef + useEffect)
  - AbortController ile request cancellation
  - Önceki timeout/request iptal mekanizması
  - Loading state management during debounce

**Sprint 4 - Pagination Entegrasyonu:**
- ✅ `PaginatedApiResponse<T>` ve `PaginationMeta` type'ları eklendi (`common.types.ts`)
- ✅ Pagination kullanım kılavuzu oluşturuldu (`PAGINATION_GUIDE.md`)
- ✅ Kademeli migration stratejisi dokümante edildi (basit + paginated hook dual pattern)

**Mevcut Altyapı (Sprint 1 + Sprint 2 + Sprint 3):**
- TS Response tipleri + Discriminated union
- API client (network/parse/unhandled error normalizasyonu + meta capture)
- Generic hooks (useApi, usePaginated) + abort + requestId
- Zustand stores: auth (persist), theme (persist), toast, requestMeta
- UI primitives: Loader, ErrorMessage, PaginationControls, ToastRenderer, RequestDebugPanel, FormField set
- Domain tipleri (Cari, Hizmet, Tarife, Parametre) + Layout bileşenleri (AppLayout, PageLayout)
- Utils (date/number formatters) + Constants (errorCodes, apiPaths)
- Form validation: Zod + RHF + adapter + backend error map + async validation
- Validation schemas: Cari, Hizmet, Tarife (create/update)
- Cache strategy dokümanı (React Query önerisi)

**Sıradaki Öncelikler:**
- [x] HizmetListModern komponenti (tamamlandı)
- [x] TarifeListModern komponenti (paginated + skeleton + toast) TAMAMLANDI (23 Kasım 2025)
- [x] Tarife mutations toast pattern refaktörü TAMAMLANDI (23 Kasım 2025)
- [ ] Form component'leri genişlet (WorkOrderForm, MotorbotForm - React Hook Form + Zod)
- [ ] Icon/SVG sprite pipeline implementation
- [ ] Toast notification kullanımını diğer modüllere yaygınlaştır (success/error messages)
- [ ] Shared StatusBadge bileşeni (rol/durum/pasif tekrarlarını azaltma)

**Olgunluk Metrikleri (Güncel - 23 Kasım 2025 - Sprint 5 Tamamlandı):**
- **Backend:** %100 (FAZ 1 + FAZ 2 tamamlandı)
- **Frontend:** %60 (+5% - UI components + validation schemas + debounce)
- **Dokümantasyon:** %62 (+2% - WorkOrder/Motorbot schema docs)
- **Toplam Proje:** %88 (+2%)

**Not:** Frontend %60 olgunluğa ulaştı. React Query (7 modül, 77 hooks) ✅, Form utils ✅, Pagination UI ✅, Validation schemas (6 modül) ✅, Async validation debounce ✅, Modern liste örneği ✅. Core infrastructure tam. Sıradaki: Diğer modül liste/form component'leri.
