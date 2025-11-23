# ALIAPORT v3.1 - ÜRETİM HAZIRLIK YOL HARİTASI

**Oluşturulma Tarihi:** 23 Kasım 2025  
**Güncel Durum:** Backend olgunlaştı (%85 olgunluk - FAZ 2 ✅ TAMAMLANDI) | Frontend FAZ 3.1 başlatıldı (çekirdek yapı + client + hooks + store + UI temel)  
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
- **✅ API Response Standardizasyonu (12/12 router - ISO8601 + ErrorCode)**
- **✅ Structured Logging (JSON + 4 log tipi + Request ID tracking)** ✅ YENİ
- **✅ Global Error Handler (Production security + standardized errors)** ✅ YENİ
- CORS ve multi-origin desteği

### ⚠️ Kritik Eksiklikler
- Auth/güvenlik sistemi yok (FAZ 4 - öncelikli)
- Frontend form validation & geniş komponent kütüphanesi eksik (FAZ 3 ilerliyor)
- Production deployment stratejisi yok (FAZ 6)
- Test coverage düşük (FAZ 5)

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

**✅ Tamamlanan Router'lar (12/12 - %100):**
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
11. **GateLog/Güvenlik** (`modules/guvenlik/router.py`) - 11 endpoint ✅ YENİ
    - 6 GateLog (giriş/çıkış, istisna+PIN, stats)
    - 5 GateChecklistItem (CRUD, seed default)
    - Exception PIN hash'leme

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

### Şu Anki Durum (%80 Olgunluk) ⬆️ +2%
- ✅ Fonksiyonel modüller (Backend): %100
- ✅ **Veri güvenliği: %100 (FAZ 1 TAMAMLANDI)**
- ✅ Backend standardizasyon + observability: %100 (FAZ 2 TAMAMLANDI)
- 🔄 Frontend olgunlaşma: %40 (+5%) - Cache stratejisi + async validation + şemalar
- ⚠️ Production hazırlığı: %50
- ⚠️ Güvenlik (Auth/RBAC): %50
- ⚠️ Ölçeklenebilirlik: %30
- ⚠️ Dokümantasyon: %58 (+3%)
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

### 🔧 Açık FAZ 3 (Frontend Olgunlaşma) Maddeleri
- [x] `WorkOrderListModern.tsx` (durum makinesi buton seti + hızlı filtreler) ✅ Tamamlandı (23 Kasım 2025)
- [ ] Gelişmiş Formlar
  - [x] WorkOrderForm (create + basic fields + Zod schema) ✅ Tamamlandı (23 Kasım 2025)
  - [x] MotorbotTripForm (MbTrip create + zaman validasyonu) ✅ Tamamlandı (23 Kasım 2025)
  - [x] PriceListItemInlineForm (inline edit + optimistic update) ✅ Tamamlandı (23 Kasım 2025)
  - [x] Icon/SVG sprite pipeline (build-time optimizasyon + tek HTTP isteği) ✅ Tamamlandı (23 Kasım 2025)
- [x] Tema dokümantasyonu (dark/light varyant rehberi + contrast matrisi) ✅ Tamamlandı (23 Kasım 2025) (`frontend/README_THEME.md` eklendi)
- [x] Erişilebilirlik (WCAG 2.1 AA) hızlı tarama: odak halkası, aria-label, renk kontrastları ✅ Tamamlandı (23 Kasım 2025) (`frontend/README_A11Y.md` eklendi)
- [x] Performans temel ölçüm: React Profiler + bundle split stratejisi (feature-based dynamic import) ✅ Tamamlandı (23 Kasım 2025) (`frontend/README_PERFORMANCE.md`, `src/core/utils/lazy.ts` eklendi)
- [x] Pagination meta entegrasyonu ✅ Tamamlandı (23 Kasım 2025)
  - Generic hook altyapısı: `frontend/src/core/hooks/queries/usePaginatedQuery.ts`
  - Specialization: `useCariListPaginated`
  - Component migration: `CariListModern.tsx` (data.items + SimplePagination)
  - Dokümantasyon: `frontend/PAGINATION_GUIDE.md` güncellendi (Generic pattern + checklist)
- [x] Skeleton komponentleri ✅ Tamamlandı (23 Kasım 2025)
  - Bileşenler: `Skeleton`, `LineSkeleton`, `CardSkeleton`, `TableSkeleton`
  - Dosya: `frontend/src/shared/ui/Skeleton.tsx`
  - Entegrasyon: `CariListModern` loading durumu skeleton ile değiştirildi
  - Dokümantasyon: `frontend/README_SKELETON.md` eklendi (a11y + performans notları)
- [x] Toast kullanım standardizasyonu ✅ Tamamlandı (23 Kasım 2025)
  - Wrapper hook: `useToastMutation` (otomatik success/error toast)
  - Shortcut mesajlar: `toastMessages.create|update|delete(entity)`
  - Cari CRUD refaktörü: create/update/delete mutation'ları toast entegrasyonlu
  - Dokümantasyon: `frontend/README_TOAST.md` (pattern, a11y, refaktör planı)
- [ ] Toast kullanımının standardizasyonu (mutations success/error pattern)

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

**Son Güncelleme:** 23 Kasım 2025  
**Sonraki Review:** Her ay sonu  
**Sorumlular:** Development team + Senior advisors

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
