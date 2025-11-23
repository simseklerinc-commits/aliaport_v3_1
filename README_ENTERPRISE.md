# Aliaport v3.1 - Enterprise Edition

## 🏗️ Proje Yapısı

```
Aliaport_v3_1/
├── backend/                      # Backend API
│   ├── aliaport_api/
│   │   ├── modules/             # Modüler yapı (12 modül)
│   │   │   ├── cari/           # Cari hesap modülü
│   │   │   ├── motorbot/       # Motorbot & Sefer modülü
│   │   │   ├── hizmet/         # Hizmet modülü
│   │   │   ├── isemri/         # İş Emri modülü
│   │   │   ├── barinma/        # Barınma kontratları modülü
│   │   │   ├── tarife/         # Tarife modülü
│   │   │   ├── kurlar/         # Döviz kurları modülü
│   │   │   ├── parametre/      # Parametre modülü
│   │   │   ├── saha/           # Saha Personeli modülü
│   │   │   ├── guvenlik/       # Güvenlik modülü
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
├── backend/
│   └── aliaport.db              # SQLite Database (production'da backend/ içinde)
│
├── docs/                        # Dokümantasyon
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

| Modül | Endpoint | Açıklama |
|-------|----------|----------|
| Cari | `/api/cari` | Cari hesap işlemleri |
| Motorbot | `/api/motorbot` | Tekne yönetimi |
| Sefer | `/api/motorbot/sefer` | Sefer kayıtları |
| Hizmet | `/api/hizmet` | Hizmet tanımları |
| İş Emri | `/api/work-order` | İş emri yönetimi |
| Barınma | `/api/barinma` | Barınma kontratları |
| Tarife | `/api/price-list` | Fiyat listeleri |
| Kurlar | `/api/exchange-rate` | Döviz kurları |
| Parametre | `/api/parametre` | Sistem parametreleri |
| Saha Personeli | `/api/worklog` | Saha çalışma kayıtları |
| Güvenlik | `/api/gatelog` | Güvenlik giriş/çıkış kayıtları |
| Dijital Arşiv | `/api/archive` | Belge yönetimi (planned) |
| Raporlar | `/api/reports` | Rapor oluşturma (planned) |

## 🔧 Teknolojiler

### Backend
- **FastAPI** 0.115.0
- **SQLAlchemy** 2.0.36
- **Pydantic** 2.10.0
- **Uvicorn** (ASGI server)

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

### ✅ Tamamlanan
- Replit yapısından Enterprise yapıya geçiş
- Modüler backend mimarisi
- Sefer modülü motorbot ile birleştirildi
- Database path düzenlendi (`database/aliaport.db`)
- Import path'leri güncellendi
- SQLAlchemy `extend_existing` desteği
- Primary key index duplikasyonu çözüldü

### ⚠️ Devam Eden
- **Production Hazırlık:** Detaylı roadmap için [PRODUCTION_ROADMAP.md](PRODUCTION_ROADMAP.md) dosyasına bakın
- Migration yönetimi aktif hale getirilecek
- Requirements version pinning yapılacak
- Automated backup sistemi kurulacak
- Authentication & Authorization sistemi eklenecek
- Docker konfigürasyonu eklenecek
- CI/CD pipeline kurulacak

## 🐛 Bilinen Sorunlar ve Eksiklikler

### Kritik Eksiklikler (Production Blocker)
1. **Migration Yönetimi**: Alembic yapılandırıldı ancak aktif değil - her restart'ta `Base.metadata.create_all()` çalışıyor
2. **Dependency Versioning**: requirements.txt'te bazı paketlerin versiyonu sabitlenememiş (requests, evds, pandas)
3. **Authentication**: Kullanıcı girişi ve yetkilendirme sistemi yok
4. **Logging**: Structured logging yapısı eksik
5. **Backup**: Otomatik database backup sistemi kurulmamış

### Bilinen Teknik Sorunlar
1. **Scheduler**: Geçici olarak devre dışı, yeni modül yapısına uyarlanacak
2. **Frontend API Integration**: Saha ve Güvenlik modüllerinin API entegrasyonu tamamlanacak
3. **Alembic CLI Bug**: Migration komutları eski revision referansı arıyor (workaround uygulandı)

### Üretim Öncesi Gereksinimler
- SQLite → PostgreSQL/MySQL geçişi planlanmalı
- CORS wildcard production'da kaldırılmalı
- Rate limiting eklenmelidir
- Error handling middleware geliştirilmelidir
- API response standardizasyonu yapılmalıdır

**📋 Detaylı roadmap ve çözüm planı için:** [PRODUCTION_ROADMAP.md](PRODUCTION_ROADMAP.md)

## 📚 Dokümantasyon

- **API Dokümantasyonu**: http://127.0.0.1:8000/docs (Swagger UI)
- **ReDoc**: http://127.0.0.1:8000/redoc
- **Production Roadmap**: [PRODUCTION_ROADMAP.md](PRODUCTION_ROADMAP.md) - 7 fazlı üretim hazırlık planı
- **Migration Guide**: `backend/MIGRATION_GUIDE.md`
- **Architecture Docs**: `docs/architecture/`

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
