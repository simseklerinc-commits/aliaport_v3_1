# Aliaport - Teknik Borç ve Aksiyon Planı

## 📋 Analiz: "Excel'den Uygulamaya Geçiş" Sendromu

> **Doğru Tanı**: Klasik liman işletmesi mantığı + modern web teknolojisi  
> **Durum**: Proje artık "deneme maketi" değil, **üretim adayı**  
> **Risk**: Kontrol edilmezse "parçalı ekosistem" olabilir

---

## 🎯 Kritik Noktalar ve Çözümler

### 1️⃣ **Migration Yönetimi** - "SQL ve Python betikleri karışık"

#### Mevcut Sorun
```
scripts/
├── import_cari_from_zip.py        # Tek seferlik mi? Tekrarlanan mi?
├── import_sample_barinma.py       # Test data mı? Prod data mı?
├── Aliaport_v3_1_SQL_Init.ps1    # Manuel SQL injection
└── *.sql                          # Versiyonsuz schema değişiklikleri
```

**Risk**: Hangi script ne zaman çalıştı? Veritabanı hangi versiyonda? Rollback nasıl?

#### Çözüm: Alembic + Migration Strategy

**Adım 1**: Alembic kurulumu
```bash
cd backend
pip install alembic
alembic init alembic
```

**Adım 2**: Migration yapısı
```
backend/
├── alembic/
│   ├── versions/
│   │   ├── 001_initial_schema.py
│   │   ├── 002_add_audit_fields.py
│   │   ├── 003_add_work_order_module.py
│   │   └── ...
│   ├── env.py
│   └── script.py.mako
└── alembic.ini
```

**Adım 3**: Her değişiklik versiyonlanır
```python
# alembic/versions/001_initial_schema.py
def upgrade():
    op.create_table('Cari',
        sa.Column('Id', sa.Integer(), primary_key=True),
        sa.Column('Kod', sa.String(50), nullable=False),
        # ...
    )

def downgrade():
    op.drop_table('Cari')
```

**Adım 4**: Migration komutları
```bash
# Yeni migration oluştur
alembic revision --autogenerate -m "add new field"

# Upgrade (ileri)
alembic upgrade head

# Downgrade (geri)
alembic downgrade -1

# Hangi versiyondayız?
alembic current

# Geçmiş
alembic history
```

**scripts/ için yeni yapı**:
```
scripts/
├── migrations/              # Alembic versiyonları (otomatik)
├── seed_data/              # Başlangıç verileri (tekrarlanabilir)
│   ├── seed_cari.py
│   └── seed_hizmet.py
├── one_time/               # Tek seferlik işler (tarihli)
│   ├── 2025_11_22_import_legacy_cari.py
│   └── 2025_11_23_fix_duplicate_codes.py
└── maintenance/            # Periyodik bakım
    ├── backup_database.py
    └── cleanup_old_logs.py
```

---

### 2️⃣ **Dosya İşleme Mantığı** - "Loglama, queue, hata toleransı"

#### Mevcut Sorun
`import_cari_from_zip.py`:
- ❌ Hata olursa ne olur?
- ❌ Yarım kalan import nasıl devam eder?
- ❌ Hangi satır başarılı, hangisi başarısız?
- ❌ 1000 kayıt varsa hepsi memory'de mi?

#### Çözüm: Robust Import Pipeline

**Adım 1**: İşlem kaydı
```python
# backend/aliaport_api/infrastructure/import_tracker.py
class ImportJob:
    id: int
    filename: str
    total_records: int
    processed_records: int
    success_count: int
    error_count: int
    status: str  # PENDING, PROCESSING, COMPLETED, FAILED
    started_at: datetime
    completed_at: datetime
    errors: JSON  # [{row: 5, error: "Kod duplicate"}]
```

**Adım 2**: Batch processing
```python
# scripts/seed_data/import_cari_robust.py
import logging
from typing import Iterator

logger = logging.getLogger(__name__)

def read_cari_from_zip(filepath: str) -> Iterator[dict]:
    """Generator - memory efficient"""
    with zipfile.ZipFile(filepath) as z:
        for entry in z.namelist():
            yield parse_cari_row(entry)

def import_cari_batch(batch_size: int = 100):
    job = ImportJob.create(filename="cari_export.zip")
    
    try:
        for batch in chunk(read_cari_from_zip(), batch_size):
            try:
                # Batch insert
                db.bulk_insert_mappings(Cari, batch)
                db.commit()
                
                job.processed_records += len(batch)
                job.success_count += len(batch)
                
            except Exception as e:
                db.rollback()
                # Teker teker dene
                for row in batch:
                    try:
                        db.add(Cari(**row))
                        db.commit()
                        job.success_count += 1
                    except Exception as row_error:
                        job.error_count += 1
                        job.errors.append({
                            "kod": row['Kod'],
                            "error": str(row_error)
                        })
                        logger.error(f"Row failed: {row['Kod']} - {row_error}")
            
            job.save()  # Progress tracking
        
        job.status = "COMPLETED"
        
    except Exception as e:
        job.status = "FAILED"
        logger.exception("Import failed")
        raise
    
    finally:
        job.completed_at = datetime.now()
        job.save()
    
    return job
```

**Adım 3**: Background job (Celery)
```python
# backend/aliaport_api/tasks/import_tasks.py
from celery import Celery

celery = Celery('aliaport', broker='redis://localhost:6379')

@celery.task
def import_cari_async(filepath: str):
    """Arka planda çalışır, API bloklamaz"""
    return import_cari_batch(filepath)

# API'den çağrı
@router.post("/import")
async def trigger_import(file: UploadFile):
    task = import_cari_async.delay(file.filename)
    return {"job_id": task.id, "status": "QUEUED"}

@router.get("/import/{job_id}")
async def check_import_status(job_id: str):
    task = celery.AsyncResult(job_id)
    return {
        "status": task.state,
        "progress": task.info
    }
```

---

### 3️⃣ **UI Modülerleştirme** - "assets, partials, routes ayrılmalı"

#### Mevcut Sorun
```
frontend/src/
├── App.tsx                    # 2000+ satır
├── components/               
│   ├── Sidebar.tsx           # İçinde hem layout hem business logic
│   ├── CariList.tsx          # Hem UI hem API call
│   └── ...
└── İç içe bağımlılıklar
```

**Risk**: Bir değişiklik domino etkisi yaratır.

#### Çözüm: Feature-Based Architecture

```
frontend/src/
├── app/                      # Uygulama çekirdeği
│   ├── App.tsx
│   ├── router.tsx
│   └── store.ts             # Global state (Redux/Zustand)
│
├── features/                # Feature modülleri
│   ├── cari/
│   │   ├── api/            # API calls
│   │   │   └── cariApi.ts
│   │   ├── components/     # UI components
│   │   │   ├── CariList.tsx
│   │   │   ├── CariForm.tsx
│   │   │   └── CariCard.tsx
│   │   ├── hooks/          # Custom hooks
│   │   │   └── useCari.ts
│   │   ├── types/          # TypeScript types
│   │   │   └── cari.types.ts
│   │   └── index.ts        # Barrel export
│   │
│   ├── work-order/
│   ├── vessel/
│   └── ...
│
├── shared/                  # Paylaşılan kod
│   ├── components/         # Generic UI
│   │   ├── Button/
│   │   ├── Table/
│   │   └── Modal/
│   ├── hooks/              # Generic hooks
│   │   ├── useApi.ts
│   │   └── useAuth.ts
│   ├── utils/              # Helpers
│   │   ├── formatters.ts
│   │   └── validators.ts
│   └── types/              # Shared types
│       └── common.types.ts
│
├── layouts/                # Layout components
│   ├── MainLayout.tsx
│   ├── Sidebar.tsx
│   └── Header.tsx
│
└── assets/                 # Static files
    ├── images/
    ├── fonts/
    └── styles/
        └── globals.css
```

**Örnek: Cari Feature**
```typescript
// features/cari/api/cariApi.ts
export const cariApi = {
  getAll: () => api.get<Cari[]>('/api/cari'),
  getById: (id: number) => api.get<Cari>(`/api/cari/${id}`),
  create: (data: CariCreate) => api.post<Cari>('/api/cari', data),
  // ...
}

// features/cari/hooks/useCari.ts
export function useCari() {
  const { data, isLoading, error } = useQuery(
    ['cari'],
    cariApi.getAll
  )
  
  const createMutation = useMutation(cariApi.create)
  
  return {
    cariList: data,
    isLoading,
    createCari: createMutation.mutate
  }
}

// features/cari/components/CariList.tsx
export function CariList() {
  const { cariList, isLoading } = useCari()
  
  if (isLoading) return <Spinner />
  
  return (
    <Table data={cariList} columns={columns} />
  )
}
```

**Faydası**:
- ✅ Her feature bağımsız çalışır
- ✅ Test etmek kolay
- ✅ Yeni geliştirici hemen anlar
- ✅ Kod tekrarı azalır

---

### 4️⃣ **Build Pipeline** - "PostCSS ve build pipeline kalıcı hâle gelmeli"

#### Mevcut Sorun
```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

**Eksikler**:
- CSS optimization yok
- Bundle analysis yok
- Environment-specific builds yok
- Source maps kontrolü yok

#### Çözüm: Production-Ready Build

**postcss.config.js güncellemesi**:
```javascript
export default {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    
    // Production optimizations
    ...(process.env.NODE_ENV === 'production' ? {
      'cssnano': {
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
        }]
      },
      '@fullhuman/postcss-purgecss': {
        content: [
          './src/**/*.{js,jsx,ts,tsx}',
          './index.html'
        ],
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
      }
    } : {})
  }
}
```

**vite.config.ts güncellemesi**:
```typescript
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  const isProd = mode === 'production'
  
  return {
    plugins: [react()],
    
    build: {
      target: 'esnext',
      outDir: 'dist',
      sourcemap: isDev,
      
      // Bundle analysis
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-select'],
            'vendor-utils': ['date-fns', 'zod']
          }
        }
      },
      
      // Minification
      minify: isProd ? 'terser' : false,
      terserOptions: isProd ? {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      } : undefined
    },
    
    // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    }
  }
})
```

**package.json scripts**:
```json
{
  "scripts": {
    "dev": "vite --mode development",
    "build": "tsc && vite build --mode production",
    "build:staging": "vite build --mode staging",
    "preview": "vite preview",
    "analyze": "vite-bundle-visualizer"
  }
}
```

**Environment files**:
```
frontend/
├── .env.development
├── .env.staging
└── .env.production
```

---

### 5️⃣ **Dependency Management** - "Sürüm sabitleme"

#### Mevcut Sorun
```txt
# requirements.txt
fastapi
sqlalchemy
pydantic
```

**Risk**: Yarın `pip install` farklı versiyonlar getirir → Kırılma

#### Çözüm: Lock Files

**Backend - requirements.txt**:
```txt
# requirements.txt (production)
fastapi==0.115.0
sqlalchemy==2.0.36
pydantic==2.10.0
uvicorn[standard]==0.32.1
python-dotenv==1.0.0
APScheduler==3.10.4

# requirements-dev.txt (development)
-r requirements.txt
pytest==8.3.4
pytest-cov==6.0.0
black==24.10.0
mypy==1.13.0
ruff==0.8.4
```

**Generate lock file**:
```bash
pip install pip-tools
pip-compile requirements.in > requirements.txt
pip-compile requirements-dev.in > requirements-dev.txt
```

**Frontend - package.json**:
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

**Lock dosyası**:
```bash
npm install  # package-lock.json oluşturur
```

**Docker'da pin**:
```dockerfile
FROM python:3.11.9-slim  # Exact version

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
```

---

## 📊 Öncelik Matrisi

| Alan | Aciliyet | Etki | Süre | Öncelik |
|------|----------|------|------|---------|
| Alembic Migration | 🔴 Yüksek | 🔴 Yüksek | 2 gün | **1** |
| Sürüm Sabitleme | 🔴 Yüksek | 🟡 Orta | 2 saat | **2** |
| UI Modülerleştirme | 🟡 Orta | 🔴 Yüksek | 1 hafta | **3** |
| Import Pipeline | 🟡 Orta | 🟡 Orta | 3 gün | **4** |
| Build Optimization | 🟢 Düşük | 🟡 Orta | 1 gün | **5** |

---

## 🚀 4 Haftalık Aksiyon Planı

### Hafta 1: Temel Stabilite
- [ ] Alembic kurulumu
- [ ] İlk migration: mevcut schema
- [ ] requirements.txt pin
- [ ] package-lock.json commit

### Hafta 2: Veri Güvenliği
- [ ] ImportJob tablosu
- [ ] Batch import refactor
- [ ] Error logging
- [ ] Manual test (1000 kayıt)

### Hafta 3: UI Refactor Başlangıç
- [ ] Feature klasör yapısı
- [ ] Cari feature modülü
- [ ] Shared components
- [ ] React Query entegrasyonu

### Hafta 4: Production Hazırlık
- [ ] Build pipeline optimize
- [ ] Environment configs
- [ ] Docker Compose setup
- [ ] Deployment checklist

---

## 💡 "Excel'den Uygulamaya" İçin Özel Notlar

### 1. Veri Tutarlılığı
```python
# Excel'de: Manuel kontrol
# Uygulamada: Otomatik validation

class CariValidator:
    @staticmethod
    def validate_kod(kod: str) -> bool:
        if not kod:
            raise ValueError("Kod boş olamaz")
        if len(kod) > 50:
            raise ValueError("Kod max 50 karakter")
        if db.query(Cari).filter(Cari.Kod == kod).first():
            raise ValueError("Kod duplicate")
        return True
```

### 2. Audit Trail
```python
# Excel'de: Kim ne zaman değiştirdi? Bilinmez
# Uygulamada: Her değişiklik kaydedilir

@event_handler("before_update")
def log_change(entity, old_values):
    AuditLog.create(
        entity_type="Cari",
        entity_id=entity.id,
        user_id=current_user.id,
        action="UPDATE",
        old_value=old_values,
        new_value=entity.to_dict()
    )
```

### 3. İş Kuralları
```python
# Excel'de: Formül hücreleri
# Uygulamada: Domain logic

class TarifeCalculator:
    def calculate_price(
        self,
        hizmet_id: int,
        miktar: Decimal,
        para_birimi: Currency
    ) -> Money:
        tarife = self.get_active_tarife(hizmet_id)
        birim_fiyat = tarife.get_price_in_currency(para_birimi)
        
        # İndirim varsa
        if miktar > 100:
            birim_fiyat *= Decimal("0.95")  # %5 indirim
        
        return Money(
            amount=birim_fiyat * miktar,
            currency=para_birimi
        )
```

---

## 🎯 Sonuç

Proje "deneme maketi" olmaktan çıktı → **Üretime hazırlık zamanı**

**Kritik 3 adım**:
1. ✅ **Migration yönetimi** (Alembic)
2. ✅ **Sürüm kontrolü** (lock files)
3. ✅ **Modülerleştirme** (feature-based)

Bu temeller atılınca:
- Güvenle deploy edilir
- Ekip büyütülebilir
- Yeni özellikler hızla eklenir
- Hata riski minimize olur

**Soru**: Hangi adımdan başlamak istersiniz?
