# Aliaport v3.1 - Enterprise Edition

## 🏗️ Proje Yapısı

```
Aliaport_v3_1/
├── backend/                      # Backend API
│   ├── aliaport_api/
│   │   ├── modules/             # Modüler yapı (13 modül aktif + 2 planned)
│   │   │   ├── cari/           # Cari hesap modülü ✅
│   │   │   ├── motorbot/       # Motorbot & Sefer modülü ✅
│   │   │   ├── sefer/          # Sefer (MbTrip) modülü ✅
│   │   │   ├── hizmet/         # Hizmet modülü ✅
│   │   │   ├── isemri/         # İş Emri modülü ✅
│   │   │   ├── barinma/        # Barınma kontratları modülü ✅
│   │   │   ├── tarife/         # Tarife modülü ✅
│   │   │   ├── kurlar/         # Döviz kurları modülü ✅
│   │   │   ├── parametre/      # Parametre modülü ✅
│   │   │   ├── saha/           # Saha Personeli modülü ✅
│   │   │   ├── guvenlik/       # Güvenlik modülü ✅
│   │   │   ├── auth/           # Authentication & Authorization ✅
│   │   │   ├── audit/          # Audit Trail & Logging ✅
│   │   │   ├── dijital_arsiv/  # Dijital Arşiv modülü (planned)
│   │   │   └── raporlar/       # Raporlar modülü (planned)
│   │   ├── config/
│   │   │   └── database.py     # Database konfigürasyonu
│   │   └── main.py             # FastAPI uygulaması
│   ├── requirements.txt
│   └── requirements-dev.txt
│
├── frontend/                     # React Frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── database/
│   └── aliaport.db              # SQLite Database (dev ortamı)
│
├── runbook/                     # Modül Dokümantasyonları (13 modül)
├── docs/                        # Teknik Dokümantasyon
├── scripts/                     # Utility scriptler
└── infrastructure/              # Docker, deployment

```

## 🚀 Kurulum

### Backend

```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn aliaport_api.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

## 📡 API Endpoints

### Ana Endpoint'ler

- **Backend API**: http://127.0.0.1:8000
- **Swagger UI**: http://127.0.0.1:8000/docs
- **Frontend**: http://localhost:5000

### Modül Endpoint'leri

| Modül | Endpoint | Açıklama | Durum |
|-------|----------|----------|-------|
| **Monitoring** | `/health`, `/ready`, `/metrics`, `/status` | Sistem durumu ve metrikler | ✅ Aktif |
| **Auth** | `/api/auth` | JWT authentication, kullanıcı yönetimi | ✅ Aktif |
| **Audit** | `/api/audit` | HTTP request logging, audit trail | ✅ Aktif |
| Cari | `/api/cari` | Cari hesap işlemleri | ✅ Aktif |
| Motorbot | `/api/motorbot` | Tekne yönetimi | ✅ Aktif |
| Sefer | `/api/motorbot/sefer` | Sefer kayıtları | ✅ Aktif |
| Hizmet | `/api/hizmet` | Hizmet tanımları | ✅ Aktif |
| İş Emri | `/api/work-order` | İş emri yönetimi | ✅ Aktif |
| Barınma | `/api/barinma` | Barınma kontratları | ✅ Aktif |
| Tarife | `/api/price-list` | Fiyat listeleri | ✅ Aktif |
| Kurlar | `/api/exchange-rate` | Döviz kurları | ✅ Aktif |
| Parametre | `/api/parametre` | Sistem parametreleri | ✅ Aktif |
| Saha Personeli | `/api/worklog` | Saha çalışma kayıtları | ✅ Aktif |
| Güvenlik | `/api/gatelog` | Güvenlik giriş/çıkış kayıtları | ✅ Aktif |
| Dijital Arşiv | `/api/archive` | Belge yönetimi | 📋 Planned |
| Raporlar | `/api/reports` | Rapor oluşturma | 📋 Planned |

## 🔧 Teknolojiler

### Backend
- **FastAPI** 0.121.3
- **SQLAlchemy** 2.0.44
- **Pydantic** 2.12.4
- **Uvicorn** 0.38.0 (ASGI server)
- **Alembic** 1.13.1 (Database migrations)
- **APScheduler** 3.11.1 (Background jobs)
- **SlowAPI** 0.1.8 (Rate limiting)
- **python-jose** 3.3.0 (JWT)
- **bcrypt** 4.0.1 (Password hashing)
- **Sentry** 1.39.2 (Error tracking)
- **Prometheus** 0.19.0 (Metrics)

### Frontend
- **React** 18
- **TypeScript**
- **Vite** 6
- **Tailwind CSS**
- **shadcn/ui**

### Database
- **SQLite** 3 (Üretim için PostgreSQL/MySQL önerilir)

## 📝 Modül Yapısı

Her modül kendi içinde:
- `models.py` - SQLAlchemy modelleri
- `schemas.py` - Pydantic şemaları
- `router.py` - FastAPI endpoint'leri
- `__init__.py` - Modül export'ları

## 🔄 Değişiklikler (v3.0 → v3.1)

### ✅ Tamamlanan (v3.1)
- ✅ Replit yapısından Enterprise yapıya geçiş
- ✅ Modüler backend mimarisi (13 modül aktif)
- ✅ Sefer modülü motorbot ile birleştirildi
- ✅ Database path düzenlendi (`database/aliaport.db`)
- ✅ Import path'leri güncellendi
- ✅ SQLAlchemy `extend_existing` desteği
- ✅ Primary key index duplikasyonu çözüldü
- ✅ **Alembic migration sistemi aktif**
- ✅ **JWT Authentication + RBAC** (7 rol, permission sistemi)
- ✅ **Audit Trail** (HTTP request logging)
- ✅ **Rate Limiting** (SlowAPI, auth-aware, 300/min)
- ✅ **Structured Logging** (JSON logs, request IDs)
- ✅ **Error Handling** (global exception handler, error codes)
- ✅ **Monitoring** (Prometheus metrics, Sentry, health checks)
- ✅ **APScheduler** (Kurlar sync, barınma faturalama)
- ✅ **Security Headers** (CORS, CSP, X-Frame-Options)
- ✅ **Comprehensive Documentation** (13 modül runbook)

### ⚠️ Devam Eden / Planlı
- 📋 **PostgreSQL Migration** (SQLite → PostgreSQL production)
- 📋 **Automated Backup** (Database + file backups)
- 📋 **Docker Containerization** (docker-compose.yml mevcut)
- 📋 **CI/CD Pipeline** (GitHub Actions)
- 📋 **Dijital Arşiv Modülü** (Belge yönetimi)
- 📋 **Raporlar Modülü** (Excel/PDF export)
- 📋 **Frontend API Integration** (Saha, Güvenlik modülleri)
- 📋 **Load Testing** (Performance benchmarks)

## 🐛 Bilinen Sorunlar ve Planlı Geliştirmeler

### ✅ Çözülmüş Sorunlar (v3.1)
- ✅ **Migration Yönetimi**: Alembic aktif, `alembic upgrade head` ile çalışıyor
- ✅ **Authentication**: JWT + RBAC sistemi tamamlandı (7 rol, permission sistemi)
- ✅ **Logging**: Structured logging aktif (JSON logs, request IDs)
- ✅ **Rate Limiting**: SlowAPI entegrasyonu tamamlandı (300/min, auth-aware)
- ✅ **Error Handling**: Global exception handler ve error codes eklendi
- ✅ **Scheduler**: APScheduler aktif (kurlar sync, barınma faturalama)
- ✅ **API Standardizasyonu**: StandardResponse zarfı tüm endpoint'lerde kullanılıyor

### 📋 Üretim Öncesi Gereksinimler
1. **Database Migration**: SQLite → PostgreSQL geçişi (production için)
2. **CORS Configuration**: Wildcard origins production'da kaldırılacak
3. **Backup Sistemi**: Otomatik database + file backup kurulacak
4. **Load Testing**: Performance benchmarks ve optimizasyonlar
5. **SSL/TLS**: Production domain için Let's Encrypt konfigürasyonu
6. **Environment Variables**: Production secrets yönetimi (.env.production)

### 🔧 Bilinen Teknik Limitasyonlar
1. **SQLite Concurrent Writes**: Yüksek yük altında PostgreSQL'e geçilmeli
2. **File Upload**: Dijital arşiv için S3/MinIO gibi object storage entegrasyonu gerekli
3. **Email Service**: SMTP konfigürasyonu tamamlanacak (şifre sıfırlama için)
4. **Mikro Jump 17 Sync**: ERP entegrasyonu test edilecek (VPN üzerinden)

### 🚀 Gelecek Özellikler (Roadmap)
- Dijital Arşiv Modülü (belge yönetimi, OCR)
- Raporlar Modülü (Excel/PDF export, dashboard)
- Mobil Uygulama (React Native - saha personeli için)
- Webhook Sistemi (dış sistem entegrasyonları)
- GraphQL API (alternatif REST'e)

## 📚 Dokümantasyon

- **API Dokümantasyonu**: http://127.0.0.1:8000/docs (Swagger UI)
- **ReDoc**: http://127.0.0.1:8000/redoc
- **Modül Dokümantasyonları**: [`runbook/`](./runbook/) - 13 modül için detaylı teknik dokümantasyon
  - [`00_INDEX.md`](./runbook/00_INDEX.md) - Master index ve hızlı başlangıç
  - [`01_MODUL_CARI.md`](./runbook/01_MODUL_CARI.md) - Cari modülü
  - [`02_MODUL_MOTORBOT.md`](./runbook/02_MODUL_MOTORBOT.md) - Motorbot + Sefer
  - [`03_MODUL_KURLAR.md`](./runbook/03_MODUL_KURLAR.md) - Döviz kurları
  - [`04_MODUL_ISEMRI.md`](./runbook/04_MODUL_ISEMRI.md) - İş emri
  - [`05_MODUL_BARINMA.md`](./runbook/05_MODUL_BARINMA.md) - Barınma kontratları
  - [`06_MODUL_TARIFE.md`](./runbook/06_MODUL_TARIFE.md) - Fiyat listeleri
  - [`07_MODUL_HIZMET.md`](./runbook/07_MODUL_HIZMET.md) - Hizmet kartları
  - [`08_MODUL_PARAMETRE.md`](./runbook/08_MODUL_PARAMETRE.md) - Sistem parametreleri
  - [`09_MODUL_SAHA_PERSONEL.md`](./runbook/09_MODUL_SAHA_PERSONEL.md) - WorkLog
  - [`10_MODUL_GUVENLIK.md`](./runbook/10_MODUL_GUVENLIK.md) - GateLog
  - [`11_MODUL_AUTH.md`](./runbook/11_MODUL_AUTH.md) - Authentication + RBAC
  - [`12_MODUL_AUDIT.md`](./runbook/12_MODUL_AUDIT.md) - Audit trail
  - [`13_MODUL_SEFER.md`](./runbook/13_MODUL_SEFER.md) - Sefer yönetimi
- **RBAC Dokümantasyonu**: [`backend/aliaport_api/modules/auth/README_RBAC.md`](./backend/aliaport_api/modules/auth/README_RBAC.md)
- **Docker Guide**: [`DOCKER_GUIDE.md`](./DOCKER_GUIDE.md)
- **Mikro Integration**: [`MIKRO_JUMP_ENTEGRASYON.md`](./MIKRO_JUMP_ENTEGRASYON.md)

## 🤝 Katkıda Bulunma

Projeye katkıda bulunmak için:
1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişiklikleri commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'i push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📄 Lisans

Bu proje özel mülkiyettir.

## 📞 İletişim

- Proje Sahibi: [alicetin]
- Email: [ali.cetin@malihaber.com.tr]

---

**Aliaport v3.1** - Profesyonel Liman Yönetim Sistemi
