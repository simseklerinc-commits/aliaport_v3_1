# CARİ MODÜLÜ - Teknik Dokümantasyon

## 📋 Modül Özeti

**Modül Adı:** Cari (Müşteri/Tedarikçi Yönetimi)  
**Versiyon:** 3.1.0  
**Durum:** ✅ Production Ready  
**Sorumlu Ekip:** Backend Core Team  
**İlgili Modüller:** Motorbot, İş Emri, Barınma, Tarife  

---

## 🎯 Ne İşe Yarar?

Cari modülü, liman işletmesinin **tüm iş ortaklarını** (müşteriler, tedarikçiler, acente firmalar) merkezi bir veritabanında yönetir. Sistem çapında kullanılan temel referans modülüdür.

**Kullanım Senaryoları:**
- Gemi acentesi firması kaydı (MSC Denizcilik, Maersk, vb.)
- Motorbot sahipleri (şahıs veya şirket)
- Hizmet tedarikçileri (forklift, vinç operatörleri)
- Barınma kontrat müşterileri
- İş emri talep edenleri

**İş Akışı:**
1. Admin cari kaydı oluşturur (CariKod: otomatik/manuel)
2. Vergi/TCKN doğrulaması yapılır
3. İletişim bilgileri ve ödeme vadeleri tanımlanır
4. Diğer modüller (Motorbot, İş Emri) bu cariyi referans alır

---

## 🗂️ Veritabanı Yapısı

### Tablo: `Cari`

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `Id` | Integer | Primary Key (otomatik) | 1, 2, 3... |
| `CariKod` | String(50) | Benzersiz cari kodu | "MSC001", "MAERSK02" |
| `Unvan` | String(200) | Firma/kişi adı | "MSC Denizcilik A.Ş." |
| `CariTip` | String(20) | GERCEK / TUZEL | "TUZEL" |
| `Rol` | String(20) | MUSTERI / TEDARIKCI / DIGER | "MUSTERI" |
| `VergiDairesi` | String(100) | Vergi dairesi | "Aliağa Vergi Dairesi" |
| `VergiNo` | String(20) | Vergi numarası | "1234567890" |
| `Tckn` | String(11) | TC Kimlik No (şahıslar için) | "12345678901" |
| `Ulke` | String(50) | Ülke | "Türkiye" |
| `Il` | String(50) | İl | "İzmir" |
| `Ilce` | String(50) | İlçe | "Aliağa" |
| `Adres` | String(500) | Açık adres | "Atatürk Mah. Liman Cad..." |
| `Telefon` | String(50) | Telefon | "+90 232 XXX XXXX" |
| `Eposta` | String(100) | Email | "info@msc.com" |
| `IletisimKisi` | String(100) | İlgili kişi | "Ahmet Yılmaz" |
| `Iban` | String(34) | IBAN (ödeme için) | "TR12 3456 7890 1234..." |
| `VadeGun` | Integer | Ödeme vadesi (gün) | 30, 60, 90 |
| `ParaBirimi` | String(10) | Varsayılan para birimi | "TRY", "USD", "EUR" |
| `Notlar` | String(1000) | İç notlar | "VIP müşteri, öncelikli..." |
| `AktifMi` | Boolean | Aktif/Pasif durum | true, false |
| `CreatedAt` | DateTime | Oluşturulma zamanı | 2025-11-24 14:30:00 |
| `UpdatedAt` | DateTime | Son güncelleme | 2025-11-25 09:15:00 |
| `CreatedBy` | Integer | Oluşturan kullanıcı ID | 1 |
| `UpdatedBy` | Integer | Güncelleyen kullanıcı ID | 2 |

**İndeksler:**
- `CariKod`: Unique, hızlı arama için
- `AktifMi`: Sadece aktif carileri listelemek için

**Foreign Key İlişkileri:**
- `CreatedBy`, `UpdatedBy` → `users.id` (gelecekte eklenecek)

---

## 🔌 API Endpoints

### Base URL: `/api/cari`

| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/cari` | Cari listesi (sayfalı) | `page`, `page_size`, `search`, `tip`, `rol` |
| GET | `/api/cari/{cari_id}` | Tek cari detayı | `cari_id` (path) |
| GET | `/api/cari/kod/{cari_kod}` | Cari koda göre getir | `cari_kod` (path) |
| POST | `/api/cari` | Yeni cari oluştur | JSON body |
| PUT | `/api/cari/{cari_id}` | Cari güncelle | `cari_id` (path) + JSON body |
| DELETE | `/api/cari/{cari_id}` | Cari sil (soft delete) | `cari_id` (path) |

### Örnek Request/Response

**GET /api/cari?page=1&page_size=20&tip=TUZEL**
```json
{
  "success": true,
  "message": "20 cari kaydı getirildi",
  "data": [
    {
      "Id": 1,
      "CariKod": "MSC001",
      "Unvan": "MSC Denizcilik A.Ş.",
      "CariTip": "TUZEL",
      "Rol": "MUSTERI",
      "VergiNo": "1234567890",
      "Telefon": "+90 232 111 2233",
      "Eposta": "info@msc.com",
      "AktifMi": true
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 135
  }
}
```

**POST /api/cari**
```json
{
  "CariKod": "MAERSK02",
  "Unvan": "Maersk Türkiye",
  "CariTip": "TUZEL",
  "Rol": "MUSTERI",
  "VergiDairesi": "İzmir Vergi Dairesi",
  "VergiNo": "9876543210",
  "Telefon": "+90 232 444 5566",
  "Eposta": "contact@maersk.com",
  "ParaBirimi": "USD",
  "VadeGun": 60
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cari başarıyla oluşturuldu",
  "data": {
    "Id": 2,
    "CariKod": "MAERSK02",
    "Unvan": "Maersk Türkiye",
    "CreatedAt": "2025-11-25T10:30:00"
  }
}
```

---

## 💻 Kod Yapısı

### Dosya Organizasyonu
```
backend/aliaport_api/modules/cari/
├── __init__.py           # Router export
├── models.py             # SQLAlchemy Cari modeli
├── schemas.py            # Pydantic request/response şemaları
└── router.py             # FastAPI endpoints
```

### Katman Mimarisi
```
[Frontend] → [FastAPI Router] → [Business Logic] → [SQLAlchemy ORM] → [SQLite DB]
```

**Önemli Kod Parçaları:**

**models.py - Cari Model:**
```python
class Cari(Base):
    __tablename__ = "Cari"
    
    Id = Column(Integer, primary_key=True)
    CariKod = Column(String(50), unique=True, nullable=False, index=True)
    Unvan = Column(String(200), nullable=False)
    CariTip = Column(String(20), nullable=False)  # GERCEK / TUZEL
    Rol = Column(String(20), nullable=False)      # MUSTERI / TEDARIKCI / DIGER
    VergiDairesi = Column(String(100))
    VergiNo = Column(String(20))
    Tckn = Column(String(11))
    # ... diğer alanlar
    AktifMi = Column(Boolean, nullable=False, default=True)
    CreatedAt = Column(DateTime, nullable=False, default=func.now())
    UpdatedAt = Column(DateTime, onupdate=func.now())
```

**router.py - Endpoint Örnekleri:**
```python
@router.get("/api/cari")
def get_cari_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    search: Optional[str] = Query(None),
    tip: Optional[str] = Query(None),
    rol: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Cari).filter(Cari.AktifMi == True)
    
    # Filtreleme
    if search:
        query = query.filter(
            (Cari.CariKod.ilike(f"%{search}%")) |
            (Cari.Unvan.ilike(f"%{search}%"))
        )
    
    if tip:
        query = query.filter(Cari.CariTip == tip)
    
    if rol:
        query = query.filter(Cari.Rol == rol)
    
    # Pagination
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return paginated_response(data=items, page=page, page_size=page_size, total=total)
```

---

## 🔧 Geliştirme Geçmişi

### Faz 1: Temel CRUD (Tamamlandı)
- ✅ SQLAlchemy model tanımı
- ✅ Basic CRUD endpoints (GET, POST, PUT, DELETE)
- ✅ Pagination ve filtreleme
- ✅ Unique constraint (CariKod)
- ✅ Soft delete (AktifMi = False)

### Faz 2: Validasyon ve İş Kuralları (Tamamlandı)
- ✅ VergiNo format kontrolü (10 haneli)
- ✅ TCKN doğrulama (11 haneli, algoritma kontrolü - opsiyonel)
- ✅ Email format validasyonu
- ✅ IBAN format kontrolü (TR + 24 hane)
- ✅ Duplicate CariKod önleme

### Faz 3: Entegrasyon (Devam Ediyor)
- ✅ Motorbot modülü ile ilişki (OwnerCariId)
- ✅ İş Emri modülü ile ilişki (cari_id)
- ✅ Barınma modülü ile ilişki (CariId)
- ⏳ Fatura modülü ile entegrasyon (planlanan)

### Faz 4: Gelişmiş Özellikler (Planlanan)
- ⏳ Cari bazlı mali rapor (borç/alacak)
- ⏳ Cari hareketleri timeline
- ⏳ Excel toplu import/export
- ⏳ Mikro Jump ERP senkronizasyonu

---

## 📊 İş Kuralları ve Validasyonlar

### Zorunlu Alanlar
- `CariKod`: Benzersiz olmalı
- `Unvan`: Boş geçilemez
- `CariTip`: GERCEK veya TUZEL
- `Rol`: MUSTERI, TEDARIKCI veya DIGER

### Validasyon Kuralları
1. **TUZEL cariler için:**
   - VergiNo zorunlu (10 hane)
   - VergiDairesi zorunlu
   - TCKN olmamalı

2. **GERCEK cariler için:**
   - TCKN zorunlu (11 hane)
   - VergiNo opsiyonel
   - VergiDairesi opsiyonel

3. **Email:**
   - Geçerli email formatı (`@` ve `.` içermeli)
   - Duplicate kontrol yok (aynı email birden fazla caride olabilir)

4. **IBAN:**
   - TR ile başlamalı
   - 26 karakter (TR + 24 hane)

5. **Telefon:**
   - Format kontrolü yok (serbest metin)
   - Önerilen: +90 5XX XXX XXXX

### Silme Kuralları
- **Soft Delete:** `AktifMi = False` olarak işaretlenir
- **Hard Delete:** İlişkili kayıtlar varsa (Motorbot, İş Emri) silinmez
- **Cascade Delete:** Planlanan (foreign key constraints eklendiğinde)

---

## 🔗 Diğer Modüllerle İlişkiler

### Motorbot Modülü
```sql
Motorbot.OwnerCariId → Cari.Id
Motorbot.OwnerCariKod → Cari.CariKod
```
**Kullanım:** Motorbot sahibi firma/şahıs bilgisi

### İş Emri Modülü
```sql
WorkOrder.cari_id → Cari.Id
WorkOrder.cari_code → Cari.CariKod
```
**Kullanım:** İş emri talep eden müşteri

### Barınma Modülü
```sql
BarinmaContract.CariId → Cari.Id
```
**Kullanım:** Barınma kontratı yapılan firma

### Sefer Modülü
```sql
MbTrip.CariId → Cari.Id
MbTrip.CariKod → Cari.CariKod
```
**Kullanım:** Sefer müşterisi

---

## 🎨 Frontend Entegrasyonu

### Kullanılan Componentler
```
frontend/src/features/cari/
├── api/
│   └── cariApi.ts          # API client (Axios)
├── components/
│   ├── CariList.tsx        # Liste görünümü
│   ├── CariForm.tsx        # Oluştur/Düzenle formu
│   ├── CariDetail.tsx      # Detay sayfası
│   └── CariSelector.tsx    # Dropdown seçici (diğer modüllerde kullanılır)
├── hooks/
│   └── useCariQueries.ts   # React Query hooks
└── types/
    └── cari.ts             # TypeScript type definitions
```

### Örnek Frontend Kullanımı

**CariSelector.tsx (İş Emri formunda kullanım):**
```typescript
import { useCariList } from '@/features/cari/hooks/useCariQueries';

function WorkOrderForm() {
  const { data: cariList, isLoading } = useCariList({ tip: 'TUZEL', rol: 'MUSTERI' });
  
  return (
    <Select
      options={cariList?.data.map(c => ({
        value: c.Id,
        label: `${c.CariKod} - ${c.Unvan}`
      }))}
      placeholder="Cari Seçin"
    />
  );
}
```

---

## 🚀 Deployment Notları

### Database Migration
```bash
# Cari tablosu oluşturma
alembic revision -m "create_cari_table"
alembic upgrade head
```

### Environment Variables
```ini
# .env dosyası
DATABASE_URL=sqlite:///./aliaport.db
# Cari modülü için özel config gerekmiyor
```

### Performance Optimizasyonu
- **İndeksler:** CariKod üzerinde unique index (hızlı arama)
- **Pagination:** Varsayılan page_size=50 (max 500)
- **Caching:** Redis cache eklenebilir (gelecekte)

---

## 🧪 Test Senaryoları

### Unit Tests (Planlanan)
```python
# tests/test_cari.py

def test_create_cari_tuzel():
    """TUZEL cari oluşturma testi"""
    payload = {
        "CariKod": "TEST001",
        "Unvan": "Test Şirketi A.Ş.",
        "CariTip": "TUZEL",
        "Rol": "MUSTERI",
        "VergiNo": "1234567890"
    }
    response = client.post("/api/cari", json=payload)
    assert response.status_code == 201
    assert response.json()["data"]["CariKod"] == "TEST001"

def test_duplicate_cari_kod():
    """Duplicate CariKod hatası testi"""
    # Aynı kodu ikinci kez oluşturmaya çalış
    response = client.post("/api/cari", json={"CariKod": "TEST001", ...})
    assert response.status_code == 400
    assert "CARI_ALREADY_EXISTS" in response.json()["error"]["code"]
```

### Integration Tests
- Motorbot oluşturma sonrası cari ilişkisi kontrolü
- İş emri oluşturma sırasında cari doğrulama
- Soft delete sonrası ilişkili kayıtlara erişim

---

## 📚 Kaynaklar ve Referanslar

### İlgili Dosyalar
- `backend/aliaport_api/modules/cari/models.py`
- `backend/aliaport_api/modules/cari/router.py`
- `backend/aliaport_api/modules/cari/schemas.py`
- `frontend/src/features/cari/`

### API Dokümantasyonu
- Swagger UI: `http://localhost:8000/docs`
- Endpoint tag: "Cari"

### İlgili Runbook'lar
- `DEPLOYMENT_RUNBOOK.md`: Production deployment
- `docs/ERROR_CODES.md`: Hata kod referansı

---

## 🐛 Bilinen Sorunlar ve Geliştirmeler

### Açık Sorunlar
1. **Foreign Key Constraints:** Henüz DB seviyesinde FK yok (manuel kontrol)
2. **Mikro Jump Sync:** ERP entegrasyonu eksik
3. **Email Uniqueness:** Aynı email birden fazla caride kullanılabilir (iş kuralı belirsiz)

### Gelecek Geliştirmeler
1. **Cari Mali Rapor:** Borç/alacak, ödeme geçmişi
2. **Toplu Import:** Excel'den cari listesi yükleme
3. **Cari Kategori:** Ek sınıflandırma (VIP, Standart, vs.)
4. **İletişim Geçmişi:** Cari ile yapılan tüm işlemler timeline'ı

---

**Son Güncelleme:** 25 Kasım 2025  
**Güncelleyen:** AI Documentation Agent  
**Versiyon:** 1.0
