# Aliaport Liman Yönetim Sistemi - Replit Edition

## 🚀 Projeye Genel Bakış

Bu proje, Aliaport Liman Yönetim Sistemi'nin Replit ortamında çalışan full-stack versiyonudur.

### Teknoloji Stack
- **Backend**: Python FastAPI + SQLite
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Veritabanı**: SQLite (Replit ortamı için SQL Server'dan dönüştürüldü)
- **UI Kütüphanesi**: Radix UI + Shadcn/ui

## 📁 Proje Yapısı

```
Aliaport/
├── app/                      # Backend (Python FastAPI)
│   ├── aliaport_web.py       # Ana FastAPI uygulaması
│   ├── database.py           # SQLite bağlantısı
│   ├── models.py             # SQLAlchemy modelleri (Cari, Motorbot, MbTrip)
│   ├── schemas.py            # Pydantic şemaları
│   ├── router_cari.py        # Cari API endpoints
│   ├── router_motorbot.py    # Motorbot API endpoints
│   └── router_mbtrip.py      # Sefer API endpoints
│
├── src/                      # Frontend (React + TypeScript)
│   ├── components/           # React bileşenleri
│   │   ├── modules/          # Ana modül bileşenleri
│   │   ├── ui/               # Shadcn UI bileşenleri
│   │   └── ...               # Diğer bileşenler
│   ├── lib/                  # Yardımcı kütüphaneler
│   │   └── api/              # API client fonksiyonları
│   ├── database/             # Database şema ve dokümantasyon
│   │   ├── schema.sql        # PostgreSQL şeması (referans)
│   │   └── API_SQL_MAPPING.md # API-SQL eşleme dokümantasyonu
│   └── App.tsx               # Ana React uygulama
│
├── aliaport.db               # SQLite veritabanı (otomatik oluşturulur)
├── requirements.txt          # Python bağımlılıkları
├── package.json              # Node.js bağımlılıkları
└── vite.config.ts            # Vite yapılandırması (Replit için optimize edildi)
```

## 🔧 Yerel Geliştirme

### Backend Başlatma
```bash
uvicorn app.aliaport_web:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Başlatma
```bash
npm run dev
```

## 🌐 API Endpoints

### Backend API (Port 8000)
- **Root**: `GET /` - API durumu
- **Health**: `GET /health` - Sağlık kontrolü
- **Docs**: `GET /docs` - Swagger API dokümantasyonu
- **Cari**: `GET/POST/PUT/DELETE /api/cari` - Cari yönetimi
- **Motorbot**: `GET/POST/PUT/DELETE /api/motorbot` - Motorbot yönetimi
- **Sefer**: `GET/POST/PUT/DELETE /api/mb-trip` - Sefer yönetimi

### Frontend (Port 5000)
React uygulaması port 5000'de çalışır ve Replit webview ile erişilebilir.

## 📊 Ana Modüller

1. **Cari Yönetimi**
   - Müşteri/tedarikçi kartları
   - Cari hesap hareketleri
   - Ekstre ve bakiye takibi

2. **Motorbot Yönetimi**
   - Motorbot kartları
   - Barınma kontratları
   - Master data yönetimi

3. **Sefer Takibi**
   - Sefer çıkış/dönüş kayıtları
   - Sefer raporları
   - Faturalandırma entegrasyonu

4. **Hizmet & Tarife**
   - Hizmet kartları
   - Fiyat listeleri
   - Tarife yönetimi

5. **Fatura Yönetimi**
   - Fatura oluşturma
   - E-Fatura entegrasyonu (hazırlık aşamasında)
   - Tahsilat takibi

6. **Barınma Yönetimi**
   - Barınma sözleşmeleri
   - Dönemsel faturalandırma
   - Gelir raporları

7. **İş Emri Sistemi**
   - İş emri talebi
   - Onay süreçleri
   - İş emri takibi

8. **Raporlama**
   - Gelir raporları
   - Sefer raporları
   - Cari raporları

9. **Dijital Arşiv**
   - Firma belgeleri
   - Personel evrakları
   - Motorbot belgeleri

## 🔄 Veritabanı Dönüşümü

### SQL Server → SQLite Değişiklikleri

1. **Connection String**
   ```python
   # Eski (SQL Server)
   "mssql+pyodbc://@localhost/Aliaport_v3_1"
   
   # Yeni (SQLite)
   "sqlite:///./aliaport.db"
   ```

2. **Timestamp Fonksiyonları**
   ```python
   # Eski (SQL Server)
   server_default=func.sysdatetime()
   
   # Yeni (SQLite)
   default=func.now()
   ```

3. **Auto-Update Timestamps**
   - `CreatedAt`: Otomatik olarak `func.now()` ile set edilir
   - `UpdatedAt`: Update sırasında otomatik güncellenir

## 🎨 Frontend Yapılandırması

### Vite Config (Replit için optimize)
```typescript
server: {
  host: '0.0.0.0',        // Replit proxy için gerekli
  port: 5000,             // Webview için port 5000 şart
  strictPort: true,
  hmr: {
    clientPort: 5000,     // HMR için aynı port
  },
}
```

### API Client
```typescript
// Base URL otomatik olarak localhost:8000 kullanır
const API_BASE_URL = 'http://localhost:8000/api';
```

## 📝 Gelecek Geliştirmeler

### Planlanan Özellikler
- [ ] Kullanıcı yetkilendirme sistemi (JWT)
- [ ] E-Fatura API entegrasyonu (gerçek servis)
- [ ] Excel/PDF export özellikleri
- [ ] Gelişmiş raporlama dashboardları
- [ ] Dosya yükleme sistemi (Dijital Arşiv)
- [ ] PostgreSQL migration (production için)
- [ ] WebSocket ile real-time güncellemeler

### Bilinen Sınırlamalar
- SQLite single-user mode (production için PostgreSQL önerilir)
- E-Fatura entegrasyonu placeholder
- Kullanıcı authentication henüz yok
- File upload sistemi bekleme aşamasında

## 🛠️ Troubleshooting

### Backend Hatası
```bash
# Veritabanını sıfırla
rm aliaport.db
# Backend'i yeniden başlat
```

### Frontend Hatası
```bash
# node_modules'u temizle
rm -rf node_modules package-lock.json
npm install
# Vite binary'e execute izni ver
chmod +x node_modules/.bin/vite
```

### CORS Hatası
Backend'de CORS middleware zaten aktif. Eğer hata alırsanız:
- Backend'in 8000 portunda çalıştığından emin olun
- Frontend'in 5000 portunda çalıştığından emin olun

## 📞 Destek

Proje ile ilgili sorularınız için:
- API Dokümantasyonu: http://localhost:8000/docs
- Database Şema: src/database/schema.sql
- API Mapping: src/database/API_SQL_MAPPING.md

---

**Geliştirici Notu**: Bu proje SQL Server'dan SQLite'a başarıyla migrate edilmiş ve Replit ortamında çalışacak şekilde optimize edilmiştir. Tüm ana modüller functional durumda ve backend API'leri aktif olarak çalışmaktadır.
