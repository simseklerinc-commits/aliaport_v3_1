# MOTORBOT MODÜLÜ - Teknik Dokümantasyon

## 📋 Modül Özeti

**Modül Adı:** Motorbot (Tekne/Römorkör Yönetimi)  
**Versiyon:** 3.1.0  
**Durum:** ✅ Production Ready  
**Sorumlu Ekip:** Operations Team  
**İlgili Modüller:** Cari, Sefer (MbTrip), Barınma, İş Emri  

---

## 🎯 Ne İşe Yarar?

Motorbot modülü, liman bölgesinde faaliyet gösteren **tüm römorkör ve hizmet teknelerini** envanter olarak yönetir. Her motorbot için teknik özellikler, sahiplik bilgileri ve operasyonel durum takip edilir.

**Kullanım Senaryoları:**
- Römorkör filosu yönetimi (Aliaport'a ait veya taşeron)
- Hizmet tekneleri (yakıt ikmal botu, pilot botu, vs.)
- Tekne bakım ve durum takibi
- Sefer planlaması için tekne atama
- Barınma kontratı yapılan tekneler

**İş Akışı:**
1. Motorbot kaydı oluşturulur (Kod, Ad, Kapasite, Hız)
2. Sahip cari ataması yapılır (OwnerCariId)
3. Durum güncellenir (AKTIF, BAKIM, DEVRE_DISI)
4. Seferler bu motorbota atanır (MbTrip)
5. Barınma kontratı oluşturulabilir

---

## 🗂️ Veritabanı Yapısı

### Tablo: `Motorbot`

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `Id` | Integer | Primary Key (otomatik) | 1, 2, 3... |
| `Kod` | String(50) | Benzersiz motorbot kodu | "ROM-001", "YAKIT-02" |
| `Ad` | String(200) | Motorbot adı | "Aliağa Römorkör 1" |
| `Plaka` | String(20) | Deniz aracı plakası | "35 AB 1234" |
| `KapasiteTon` | Numeric(10,2) | Yük kapasitesi (ton) | 150.50 |
| `MaxHizKnot` | Numeric(6,2) | Maksimum hız (knot) | 12.50 |
| `OwnerCariId` | Integer | Sahip cari ID (FK) | 5 |
| `OwnerCariKod` | String(50) | Sahip cari kodu | "MSC001" |
| `Durum` | String(20) | AKTIF / BAKIM / DEVRE_DISI | "AKTIF" |
| `AlisTarihi` | Date | Satın alma/teslim tarihi | 2020-05-15 |
| `Notlar` | Text | İç notlar | "2024'te motor değiştirildi" |
| `CreatedAt` | DateTime | Oluşturulma zamanı | 2025-11-24 14:30:00 |
| `CreatedBy` | Integer | Oluşturan kullanıcı ID | 1 |
| `UpdatedAt` | DateTime | Son güncelleme | 2025-11-25 09:15:00 |
| `UpdatedBy` | Integer | Güncelleyen kullanıcı ID | 2 |

**İndeksler:**
- `Kod`: Unique, hızlı arama için
- `Durum`: Aktif tekneleri filtrelemek için

**Foreign Key İlişkileri:**
- `OwnerCariId` → `Cari.Id` (sahip firma/şahıs)
- **Lazy Loading:** `lazy="raise"` (N+1 query önleme)

### Tablo: `MbTrip` (Sefer)

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `Id` | Integer | Primary Key | 1, 2, 3... |
| `MotorbotId` | Integer | Motorbot ID (FK) | 1 |
| `SeferTarihi` | Date | Sefer tarihi | 2025-11-25 |
| `CikisZamani` | DateTime | Kalkış saati | 2025-11-25 08:00:00 |
| `DonusZamani` | DateTime | Dönüş saati | 2025-11-25 12:30:00 |
| `KalkisIskele` | String(100) | Kalkış iskelesi | "Aliağa Limanı Rıhtım 1" |
| `VarisIskele` | String(100) | Varış iskelesi | "STAR Rafineri İskelesi" |
| `CariId` | Integer | Müşteri cari ID | 2 |
| `CariKod` | String(50) | Müşteri cari kodu | "STAR01" |
| `YukAciklama` | String(200) | Yük tanımı | "Yakıt tankeri - 50.000 ton" |
| `Notlar` | Text | Notlar | "Hava şartları uygun" |
| `Durum` | String(20) | PLANLANDI / DEVAM_EDIYOR / TAMAMLANDI / IPTAL | "TAMAMLANDI" |
| `FaturaDurumu` | String(20) | BEKLIYOR / FATURALANDI | "FATURALANDI" |
| `CreatedAt` | DateTime | Oluşturulma zamanı | 2025-11-24 07:00:00 |
| `UpdatedAt` | DateTime | Son güncelleme | 2025-11-25 13:00:00 |

**İlişkiler:**
- `MotorbotId` → `Motorbot.Id`
- `CariId` → `Cari.Id`

---

## 🔌 API Endpoints

### Base URL: `/api/motorbot`

| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/motorbot` | Motorbot listesi | `page`, `page_size`, `search`, `durum` |
| GET | `/api/motorbot/{motorbot_id}` | Tek motorbot detayı | `motorbot_id` (path) |
| GET | `/api/motorbot/kod/{kod}` | Koda göre getir | `kod` (path) |
| POST | `/api/motorbot` | Yeni motorbot oluştur | JSON body |
| PUT | `/api/motorbot/{motorbot_id}` | Motorbot güncelle | `motorbot_id` + JSON body |
| DELETE | `/api/motorbot/{motorbot_id}` | Motorbot sil | `motorbot_id` (path) |
| GET | `/api/motorbot/{motorbot_id}/trips` | Motorbot seferleri | `motorbot_id` (path) |

### Sefer (Trip) Endpoints: `/api/motorbot/sefer`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/motorbot/sefer` | Tüm seferler |
| GET | `/api/motorbot/sefer/{trip_id}` | Tek sefer detayı |
| POST | `/api/motorbot/sefer` | Yeni sefer oluştur |
| PUT | `/api/motorbot/sefer/{trip_id}` | Sefer güncelle |
| DELETE | `/api/motorbot/sefer/{trip_id}` | Sefer sil |

### Örnek Request/Response

**GET /api/motorbot?durum=AKTIF**
```json
{
  "success": true,
  "message": "5 motorbot kaydı getirildi",
  "data": [
    {
      "Id": 1,
      "Kod": "ROM-001",
      "Ad": "Aliağa Römorkör 1",
      "Plaka": "35 AB 1234",
      "KapasiteTon": 150.00,
      "MaxHizKnot": 12.50,
      "OwnerCariId": 5,
      "OwnerCariKod": "ALIAG01",
      "Durum": "AKTIF",
      "AlisTarihi": "2020-05-15"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total": 5
  }
}
```

**POST /api/motorbot**
```json
{
  "Kod": "YAKIT-03",
  "Ad": "Yakıt İkmal Botu 3",
  "Plaka": "35 CD 5678",
  "KapasiteTon": 50.00,
  "MaxHizKnot": 8.00,
  "OwnerCariId": 10,
  "Durum": "AKTIF"
}
```

**POST /api/motorbot/sefer** (Yeni Sefer)
```json
{
  "MotorbotId": 1,
  "SeferTarihi": "2025-11-26",
  "CikisZamani": "2025-11-26T09:00:00",
  "DonusZamani": "2025-11-26T14:00:00",
  "KalkisIskele": "Aliağa Limanı",
  "VarisIskele": "Petkim İskelesi",
  "CariId": 3,
  "YukAciklama": "LPG tankeri yedekleme",
  "Durum": "PLANLANDI"
}
```

---

## 💻 Kod Yapısı

### Dosya Organizasyonu
```
backend/aliaport_api/modules/motorbot/
├── __init__.py           # Router export
├── models.py             # Motorbot + MbTrip modelleri
├── schemas.py            # Pydantic şemaları
└── router.py             # FastAPI endpoints

backend/aliaport_api/modules/sefer/
├── __init__.py           # Legacy sefer router
├── schemas.py            # MbTrip şemaları
└── router.py             # /api/mb-trip endpoints (eski API)
```

### Katman Mimarisi
```
[Frontend] → [FastAPI Router] → [Business Logic] → [SQLAlchemy ORM] → [SQLite DB]
                                      ↓
                              [Cari Validation]
                              [Sefer Planning]
```

**Önemli Kod Parçaları:**

**models.py - Motorbot Model:**
```python
class Motorbot(Base):
    __tablename__ = "Motorbot"
    
    Id = Column(Integer, primary_key=True)
    Kod = Column(String(50), unique=True, nullable=False, index=True)
    Ad = Column(String(200), nullable=False)
    Plaka = Column(String(20), nullable=True)
    KapasiteTon = Column(Numeric(10, 2), nullable=True)
    MaxHizKnot = Column(Numeric(6, 2), nullable=True)
    OwnerCariId = Column(Integer, ForeignKey("Cari.Id"), nullable=True)
    OwnerCariKod = Column(String(50), nullable=True)
    Durum = Column(String(20), nullable=False, default="AKTIF", index=True)
    
    # İlişkiler (lazy="raise" prevents N+1 queries)
    trips = relationship("MbTrip", back_populates="motorbot", lazy="raise")
```

**models.py - MbTrip (Sefer) Model:**
```python
class MbTrip(Base):
    __tablename__ = "MbTrip"
    
    Id = Column(Integer, primary_key=True)
    MotorbotId = Column(Integer, ForeignKey("Motorbot.Id"), nullable=False, index=True)
    SeferTarihi = Column(Date, nullable=False, index=True)
    CikisZamani = Column(DateTime, nullable=True)
    DonusZamani = Column(DateTime, nullable=True)
    KalkisIskele = Column(String(100), nullable=True)
    VarisIskele = Column(String(100), nullable=True)
    CariId = Column(Integer, ForeignKey("Cari.Id"), nullable=True)
    Durum = Column(String(20), nullable=False, default="PLANLANDI", index=True)
    FaturaDurumu = Column(String(20), nullable=True)
    
    # İlişkiler
    motorbot = relationship("Motorbot", back_populates="trips", lazy="raise")
```

**router.py - N+1 Query Prevention:**
```python
from sqlalchemy.orm import selectinload, joinedload

@router.get("/api/motorbot/{motorbot_id}/trips")
def get_motorbot_trips(motorbot_id: int, db: Session = Depends(get_db)):
    """
    Bir motorbotun tüm seferlerini getir (N+1 problem çözümü)
    """
    # Eager loading ile tek query'de hem motorbot hem sefer verileri
    motorbot = db.query(Motorbot).options(
        selectinload(Motorbot.trips)
    ).filter(Motorbot.Id == motorbot_id).first()
    
    if not motorbot:
        raise HTTPException(status_code=404, detail="Motorbot bulunamadı")
    
    # trips zaten yüklenmiş, ekstra query yok
    return success_response(data=motorbot.trips, message=f"{len(motorbot.trips)} sefer bulundu")
```

---

## 🔧 Geliştirme Geçmişi

### Faz 1: Temel Motorbot CRUD (Tamamlandı)
- ✅ Motorbot model ve tablo oluşturma
- ✅ Basic CRUD endpoints
- ✅ Pagination ve filtreleme
- ✅ Unique constraint (Kod)
- ✅ Cari ilişkisi (OwnerCariId)

### Faz 2: Sefer (Trip) Yönetimi (Tamamlandı)
- ✅ MbTrip model ve endpoints
- ✅ Motorbot-Sefer ilişkisi (1-N)
- ✅ Sefer durum yönetimi (PLANLANDI → TAMAMLANDI)
- ✅ Fatura durumu takibi
- ✅ Legacy `/api/mb-trip` endpoints (backward compatibility)

### Faz 3: Performance Optimizasyonu (Tamamlandı)
- ✅ N+1 query problem çözümü (`lazy="raise"`)
- ✅ Eager loading (selectinload, joinedload)
- ✅ Index optimizasyonu (Durum, SeferTarihi)
- ✅ Query pagination (default page_size=50)

### Faz 4: İş Kuralları (Devam Ediyor)
- ✅ Motorbot durum validasyonu
- ✅ Sefer çakışma kontrolü (aynı motorbot aynı anda 2 seferde olamaz)
- ⏳ Kapasite kontrolü (yük tonajı sınırı)
- ⏳ Bakım periyodu takibi

### Faz 5: Entegrasyonlar (Planlanan)
- ⏳ İş Emri entegrasyonu (motorbot bakım iş emirleri)
- ⏳ Barınma modülü entegrasyonu
- ⏳ GPS tracking sistemi (gelecekte)
- ⏳ Yakıt tüketimi takibi

---

## 📊 İş Kuralları ve Validasyonlar

### Motorbot Kuralları
1. **Kod Benzersizliği:** Aynı kod iki kez kullanılamaz
2. **Sahiplik:** OwnerCariId geçerli bir Cari olmalı
3. **Durum Geçişleri:**
   - AKTIF → BAKIM → AKTIF (normal döngü)
   - AKTIF → DEVRE_DISI (kalıcı çıkarma)
   - DEVRE_DISI → AKTIF (yeniden aktifleştirme)
4. **Kapasite:** KapasiteTon > 0 olmalı
5. **Hız:** MaxHizKnot > 0 ve < 50 knot (makul sınır)

### Sefer Kuralları
1. **Zaman Sırası:** CikisZamani < DonusZamani
2. **Motorbot Müsaitliği:** Aynı anda 2 aktif sefer olamaz
3. **Durum Geçişleri:**
   ```
   PLANLANDI → DEVAM_EDIYOR → TAMAMLANDI
                    ↓
                  IPTAL
   ```
4. **Faturalama:** Sadece TAMAMLANDI durumundaki seferler faturalanabilir
5. **Cari Zorunluluğu:** CariId geçerli bir müşteri olmalı

### Silme Kuralları
- **Motorbot:** Aktif seferi varsa silinemez
- **Sefer:** TAMAMLANDI veya IPTAL durumunda ise silinemez (audit)

---

## 🔗 Diğer Modüllerle İlişkiler

### Cari Modülü
```sql
Motorbot.OwnerCariId → Cari.Id        (Sahip firma)
MbTrip.CariId → Cari.Id               (Müşteri)
```

### Barınma Modülü
```sql
BarinmaContract.MotorbotId → Motorbot.Id
```
**Kullanım:** Motorbot konaklama kontratı

### İş Emri Modülü
```sql
WorkOrder.type = "MOTORBOT"
WorkOrder.description → "ROM-001 motorbot bakım"
```
**Kullanım:** Motorbot bakım/onarım iş emirleri

### Tarife Modülü
```sql
PriceListItem.HizmetKodu → "SEFER_ROMORKAJ"
# Sefer faturalandırması için birim fiyat
```

---

## 🎨 Frontend Entegrasyonu

### Kullanılan Componentler
```
frontend/src/features/motorbot/
├── api/
│   └── motorbotApi.ts      # API client
├── components/
│   ├── MotorbotList.tsx    # Liste görünümü
│   ├── MotorbotForm.tsx    # Oluştur/Düzenle
│   ├── MotorbotCard.tsx    # Kart görünümü (Figma design)
│   ├── MotorbotSelector.tsx # Dropdown seçici
│   └── TripTimeline.tsx    # Sefer geçmişi timeline
├── hooks/
│   └── useMotorbotQueries.ts
└── types/
    └── motorbot.ts
```

### Örnek Frontend Kullanımı

**MotorbotCard.tsx (Modern UI):**
```typescript
import { Motorbot } from '@/types/motorbot';

function MotorbotCard({ motorbot }: { motorbot: Motorbot }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{motorbot.Ad}</h3>
        <span className={`px-3 py-1 rounded-full text-sm ${
          motorbot.Durum === 'AKTIF' ? 'bg-green-100 text-green-800' :
          motorbot.Durum === 'BAKIM' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {motorbot.Durum}
        </span>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Kod:</span>
          <span className="ml-2 font-medium">{motorbot.Kod}</span>
        </div>
        <div>
          <span className="text-gray-500">Kapasite:</span>
          <span className="ml-2 font-medium">{motorbot.KapasiteTon} ton</span>
        </div>
        <div>
          <span className="text-gray-500">Hız:</span>
          <span className="ml-2 font-medium">{motorbot.MaxHizKnot} knot</span>
        </div>
        <div>
          <span className="text-gray-500">Plaka:</span>
          <span className="ml-2 font-medium">{motorbot.Plaka}</span>
        </div>
      </div>
      
      <div className="mt-4 flex gap-2">
        <button className="btn-primary">Sefer Ekle</button>
        <button className="btn-secondary">Detaylar</button>
      </div>
    </div>
  );
}
```

---

## 🚀 Deployment Notları

### Database Migration
```bash
# Motorbot ve MbTrip tabloları
alembic revision -m "create_motorbot_tables"
alembic upgrade head
```

### Performance Tuning
```python
# sqlalchemy engine config
engine = create_engine(
    DATABASE_URL,
    pool_size=20,           # Connection pool
    max_overflow=10,
    pool_pre_ping=True,     # Connection health check
    echo=False              # Production'da SQL log'u kapalı
)
```

### Monitoring
```python
# Sefer metriği (Prometheus)
from prometheus_client import Counter

sefer_counter = Counter('motorbot_sefer_total', 'Toplam sefer sayısı', ['durum'])

@router.post("/api/motorbot/sefer")
def create_trip(...):
    # ...
    sefer_counter.labels(durum='PLANLANDI').inc()
    # ...
```

---

## 🧪 Test Senaryoları

### Unit Tests
```python
# tests/test_motorbot.py

def test_create_motorbot_with_owner():
    """Cari sahibi ile motorbot oluşturma"""
    payload = {
        "Kod": "TEST-ROM-01",
        "Ad": "Test Römorkör",
        "KapasiteTon": 100.00,
        "OwnerCariId": 1,
        "Durum": "AKTIF"
    }
    response = client.post("/api/motorbot", json=payload)
    assert response.status_code == 201
    assert response.json()["data"]["Kod"] == "TEST-ROM-01"

def test_sefer_time_validation():
    """Sefer saati validasyonu (çıkış < dönüş)"""
    payload = {
        "MotorbotId": 1,
        "CikisZamani": "2025-11-26T14:00:00",
        "DonusZamani": "2025-11-26T10:00:00"  # Hatalı: dönüş daha erken
    }
    response = client.post("/api/motorbot/sefer", json=payload)
    assert response.status_code == 400
    assert "INVALID_TIME_RANGE" in response.json()["error"]["code"]

def test_motorbot_concurrent_trip_conflict():
    """Aynı motorbot için çakışan sefer engelleme"""
    # İlk sefer (09:00-12:00)
    trip1 = {..., "CikisZamani": "2025-11-26T09:00:00", "DonusZamani": "2025-11-26T12:00:00"}
    client.post("/api/motorbot/sefer", json=trip1)
    
    # Çakışan sefer (10:00-14:00)
    trip2 = {..., "CikisZamani": "2025-11-26T10:00:00", "DonusZamani": "2025-11-26T14:00:00"}
    response = client.post("/api/motorbot/sefer", json=trip2)
    
    assert response.status_code == 409
    assert "TRIP_CONFLICT" in response.json()["error"]["code"]
```

### Integration Tests
- Cari silindiğinde motorbot sahipliği kontrolü
- Sefer tamamlandıktan sonra faturalama akışı
- Barınma kontratı olan motorbot silme engeli

---

## 📚 Kaynaklar ve Referanslar

### İlgili Dosyalar
- `backend/aliaport_api/modules/motorbot/models.py`
- `backend/aliaport_api/modules/motorbot/router.py`
- `backend/aliaport_api/modules/sefer/router.py` (legacy)
- `frontend/src/features/motorbot/`

### API Dokümantasyonu
- Swagger UI: `http://localhost:8000/docs`
- Endpoint tags: "Motorbot", "Sefer"

### İlgili Runbook'lar
- `01_MODUL_CARI.md`: Cari modülü (sahiplik ilişkisi)
- `DEPLOYMENT_RUNBOOK.md`: Production deployment

---

## 🐛 Bilinen Sorunlar ve Geliştirmeler

### Açık Sorunlar
1. **Sefer Çakışma Kontrolü:** Sadece aynı gün için kontrol ediliyor (timezone aware değil)
2. **GPS Tracking:** Gerçek zamanlı lokasyon takibi yok
3. **Kapasite Limiti:** Yük tonajı sınırı kontrol edilmiyor

### Gelecek Geliştirmeler
1. **Bakım Takibi:** Periyodik bakım hatırlatıcısı (sefer saati bazlı)
2. **Yakıt Tüketimi:** Sefer bazında yakıt harcama kaydı
3. **Mürettebat Yönetimi:** Sefer ekibi ataması
4. **Rota Planlama:** Harita üzerinde sefer rotası çizimi
5. **Otomatik Sefer Oluşturma:** Rutin seferler için template

---

**Son Güncelleme:** 25 Kasım 2025  
**Güncelleyen:** AI Documentation Agent  
**Versiyon:** 1.0
