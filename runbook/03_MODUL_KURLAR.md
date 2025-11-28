# KURLAR MODÜLÜ - Teknik Dokümantasyon

## 📋 Modül Özeti

**Modül Adı:** Kurlar (Döviz Kuru Yönetimi)  
**Versiyon:** 3.1.0  
**Durum:** ✅ Production Ready + EVDS Entegre  
**Sorumlu Ekip:** Finance & Integration Team  
**Harici Entegrasyon:** TCMB EVDS API  
**İlgili Modüller:** Tarife, İş Emri, Fatura  

---

## 🎯 Ne İşe Yarar?

Kurlar modülü, **günlük döviz kurlarını** otomatik olarak **TCMB (Türkiye Cumhuriyet Merkez Bankası) EVDS API**'sinden çekerek sistemde saklar. Tüm mali işlemlerde (fatura, ödeme, tarife) kullanılır.

**Kullanım Senaryoları:**
- Günlük döviz kurlarını otomatik güncelleme (USD, EUR, GBP, CHF, JPY)
- Fatura oluşturma sırasında ilgili tarihteki kur bilgisi
- Tarife fiyatlarının döviz çevrimi
- Cari hesap bakiyelerinin TL karşılığı hesaplama
- Geçmiş kur sorgulama (tarih bazlı)

**İş Akışı:**
1. **Otomatik Sync:** APScheduler her gün 16:00'da EVDS API'yi çağırır
2. **Fallback Mekanizması:** Hafta sonu/tatil kontrolü, 10 gün geriye gider
3. **Upsert Logic:** Aynı tarih+döviz için güncelleme yapar (duplicate önleme)
4. **Manuel Fetch:** Kullanıcı isterse anlık güncelleme yapabilir
5. **4 Kur Tipi:** Döviz Alış, Döviz Satış, Efektif Alış, Efektif Satış

---

## 🗂️ Veritabanı Yapısı

### Tablo: `ExchangeRate`

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `Id` | Integer | Primary Key | 1, 2, 3... |
| `CurrencyFrom` | String(10) | Kaynak döviz | "USD", "EUR", "GBP" |
| `CurrencyTo` | String(10) | Hedef para birimi | "TRY" (varsayılan) |
| `Rate` | Float | **Döviz Alış Kuru** (Forex Buying) | 34.5678 |
| `SellRate` | Float | **Döviz Satış Kuru** (Forex Selling) | 34.6789 |
| `BanknoteBuyingRate` | Float | **Efektif Alış Kuru** (Banknote Buying) | 34.5000 |
| `BanknoteSellRate` | Float | **Efektif Satış Kuru** (Banknote Selling) | 34.7000 |
| `RateDate` | Date | Kur tarihi | 2025-11-24 |
| `Source` | String(50) | Veri kaynağı | "EVDS", "TCMB", "MANUEL" |
| `CreatedAt` | DateTime | Kayıt zamanı | 2025-11-24 16:05:00 |
| `UpdatedAt` | DateTime | Son güncelleme | 2025-11-25 16:05:00 |

**İndeksler:**
- `ix_exchangerate_date_currency`: (RateDate, CurrencyFrom) → Hızlı tarih+döviz sorguları
- `ix_exchangerate_unique`: (RateDate, CurrencyFrom, CurrencyTo) UNIQUE → Duplicate önleme

**EVDS Seri Kodları (TCMB):**
```
TP.DK.USD.A      → USD Döviz Alış
TP.DK.USD.S      → USD Döviz Satış
TP.DK.USD.A.YTL  → USD Efektif Alış (Banknote Buying)
TP.DK.USD.S.YTL  → USD Efektif Satış (Banknote Selling)

# Diğer dövizler: EUR, GBP, CHF, JPY (aynı format)
```

---

## 🔌 API Endpoints

### Base URL: `/api/exchange-rate`

| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/exchange-rate/` | Kur listesi (sayfalı) | `page`, `page_size`, `currency_from`, `currency_to`, `date_from`, `date_to` |
| GET | `/api/exchange-rate/today` | Bugünün kurları | - |
| GET | `/api/exchange-rate/date/{rate_date}` | Belirli tarihteki kurlar | `rate_date` (YYYY-MM-DD) |
| GET | `/api/exchange-rate/latest/{currency_from}/{currency_to}` | En güncel kur | `currency_from`, `currency_to` |
| GET | `/api/exchange-rate/{currency_from}/{currency_to}/{rate_date}` | Özel kur sorgusu | path params |
| GET | `/api/exchange-rate/convert` | Döviz çevrimi | `amount`, `from`, `to`, `date`, `rate_type` |
| GET | `/api/exchange-rate/{rate_id}` | ID ile kur getir | `rate_id` |
| POST | `/api/exchange-rate/` | Manuel kur oluştur | JSON body |
| PUT | `/api/exchange-rate/{rate_id}` | Kur güncelle | `rate_id` + JSON body |
| DELETE | `/api/exchange-rate/{rate_id}` | Kur sil | `rate_id` |
| POST | `/api/exchange-rate/bulk` | Toplu kur ekleme | JSON array |
| POST | `/api/exchange-rate/fetch-evds` | **EVDS API'den çek** | `currencies` (array), `date` (optional) |
| POST | `/api/exchange-rate/fetch-tcmb` | TCMB XML'den çek (eski) | (deprecated) |

### Örnek Request/Response

**GET /api/exchange-rate/today**
```json
{
  "success": true,
  "message": "Bugünün kurları (5 döviz, 4 kur tipi)",
  "data": [
    {
      "Id": 123,
      "CurrencyFrom": "USD",
      "CurrencyTo": "TRY",
      "Rate": 34.5678,
      "SellRate": 34.6789,
      "BanknoteBuyingRate": 34.5000,
      "BanknoteSellRate": 34.7000,
      "RateDate": "2025-11-25",
      "Source": "EVDS",
      "CreatedAt": "2025-11-25T16:05:00"
    },
    {
      "CurrencyFrom": "EUR",
      "Rate": 37.1234,
      "SellRate": 37.2345,
      ...
    }
  ]
}
```

**POST /api/exchange-rate/fetch-evds** (EVDS API'den çek)
```json
{
  "currencies": ["USD", "EUR", "GBP"],
  "date": "2025-11-24"  // opsiyonel, yoksa bugün
}
```

**Response:**
```json
{
  "success": true,
  "message": "EVDS'den 3 döviz için 4 kur tipi başarıyla çekildi",
  "data": {
    "fetched": 3,
    "updated": 3,
    "created": 0,
    "failed": 0,
    "source": "EVDS",
    "date": "2025-11-24"
  }
}
```

**GET /api/exchange-rate/convert?amount=1000&from=USD&to=TRY&date=2025-11-24&rate_type=buying**
```json
{
  "success": true,
  "message": "1000.00 USD = 34567.80 TRY (2025-11-24, Döviz Alış)",
  "data": {
    "amount": 1000.00,
    "from_currency": "USD",
    "to_currency": "TRY",
    "rate": 34.5678,
    "rate_type": "buying",
    "converted_amount": 34567.80,
    "rate_date": "2025-11-24"
  }
}
```

---

## 💻 Kod Yapısı

### Dosya Organizasyonu
```
backend/aliaport_api/modules/kurlar/
├── __init__.py                # Router export
├── models.py                  # ExchangeRate modeli
├── schemas.py                 # Pydantic şemaları
├── router.py                  # FastAPI endpoints
└── router_evds_new.py         # EVDS helper functions (opsiyonel)

backend/aliaport_api/integrations/
└── evds_client.py             # EVDS API client (official)

backend/aliaport_api/jobs/
└── kur_guncelleme_job.py      # APScheduler daily job
```

### Katman Mimarisi
```
[APScheduler Job] ──────────┐
[Manual POST Request] ──────┤
                            ↓
                    [EVDS API Client]
                            ↓
                  [ExchangeRate ORM]
                            ↓
                      [SQLite DB]
                            ↓
              [Frontend React Query] ← [GET Endpoints]
```

**Önemli Kod Parçaları:**

**integrations/evds_client.py - EVDS Client:**
```python
import requests
from datetime import datetime, timedelta

class EVDSClient:
    BASE_URL = "https://evds2.tcmb.gov.tr/service/evds/"
    
    # TCMB Resmi Seri Kodları
    SERIES_CODES = {
        "USD": {
            "buying": "TP.DK.USD.A",
            "selling": "TP.DK.USD.S",
            "banknote_buying": "TP.DK.USD.A.YTL",
            "banknote_selling": "TP.DK.USD.S.YTL"
        },
        "EUR": {...},
        "GBP": {...},
        "CHF": {...},
        "JPY": {...}
    }
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("EVDS_API_KEY")
    
    def fetch_rates(self, currency: str, date: date) -> dict:
        """
        EVDS API'den 4 kur tipini çeker
        
        Returns:
            {
                "buying": 34.5678,
                "selling": 34.6789,
                "banknote_buying": 34.5000,
                "banknote_selling": 34.7000
            }
        """
        series_codes = self.SERIES_CODES.get(currency)
        if not series_codes:
            raise ValueError(f"Unsupported currency: {currency}")
        
        date_str = date.strftime("%d-%m-%Y")
        
        # 4 seri kodunu birleştir (virgülle)
        series = ",".join(series_codes.values())
        
        params = {
            "key": self.api_key,
            "series": series,
            "startDate": date_str,
            "endDate": date_str,
            "type": "json"
        }
        
        response = requests.get(f"{self.BASE_URL}series=...", params=params)
        response.raise_for_status()
        
        data = response.json()
        # Parse ve return...
        return parsed_rates
```

**jobs/kur_guncelleme_job.py - APScheduler Job:**
```python
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import pytz

def kur_guncelleme_daily():
    """
    Her gün 16:00'da EVDS'den kurları çeker (Türkiye saati)
    
    Auto-fallback: Hafta sonu/tatil kontrolü, 10 gün geriye gider
    """
    logger.info("🔄 Günlük kur güncelleme başlatıldı")
    
    client = EVDSClient()
    db = SessionLocal()
    
    currencies = ["USD", "EUR", "GBP", "CHF", "JPY"]
    target_date = datetime.now().date()
    max_retries = 10  # 10 gün geriye git
    
    for retry in range(max_retries):
        check_date = target_date - timedelta(days=retry)
        
        try:
            for currency in currencies:
                rates = client.fetch_rates(currency, check_date)
                
                # Upsert (güncelle veya oluştur)
                existing = db.query(ExchangeRate).filter(
                    ExchangeRate.RateDate == check_date,
                    ExchangeRate.CurrencyFrom == currency,
                    ExchangeRate.CurrencyTo == "TRY"
                ).first()
                
                if existing:
                    existing.Rate = rates["buying"]
                    existing.SellRate = rates["selling"]
                    existing.BanknoteBuyingRate = rates["banknote_buying"]
                    existing.BanknoteSellRate = rates["banknote_selling"]
                    existing.UpdatedAt = datetime.now()
                else:
                    new_rate = ExchangeRate(
                        CurrencyFrom=currency,
                        CurrencyTo="TRY",
                        Rate=rates["buying"],
                        SellRate=rates["selling"],
                        BanknoteBuyingRate=rates["banknote_buying"],
                        BanknoteSellRate=rates["banknote_selling"],
                        RateDate=check_date,
                        Source="EVDS"
                    )
                    db.add(new_rate)
            
            db.commit()
            logger.info(f"✅ Kurlar güncellendi: {check_date} ({len(currencies)} döviz)")
            break  # Başarılı, döngüden çık
            
        except Exception as e:
            logger.warning(f"⚠️ {check_date} için kur bulunamadı, geriye gidiliyor...")
            continue
    
    db.close()

# Scheduler'a ekle
scheduler = BackgroundScheduler(timezone=pytz.timezone('Europe/Istanbul'))
scheduler.add_job(
    kur_guncelleme_daily,
    trigger='cron',
    hour=16,
    minute=0,
    id='kur_guncelleme_daily',
    replace_existing=True
)
```

---

## 🔧 Geliştirme Geçmişi

### Faz 1: Temel CRUD (Tamamlandı)
- ✅ ExchangeRate model ve tablo
- ✅ Basic CRUD endpoints
- ✅ Pagination ve filtreleme (tarih, döviz)
- ✅ Unique constraint (tarih + döviz)

### Faz 2: TCMB XML Entegrasyonu (Deprecated)
- ⚠️ TCMB XML parsing (eski metod, artık kullanılmıyor)
- ⚠️ `/fetch-tcmb` endpoint (backward compatibility için korundu)

### Faz 3: EVDS API Entegrasyonu (Tamamlandı) ⭐
- ✅ EVDS client implementation (official TCMB API)
- ✅ 4 kur tipi desteği (Buying, Selling, Banknote Buying, Banknote Selling)
- ✅ Auto-fallback mekanizması (10 gün geriye)
- ✅ Hafta sonu/tatil kontrolü
- ✅ `/fetch-evds` endpoint
- ✅ EVDS_API_KEY environment variable

### Faz 4: Otomatik Senkronizasyon (Tamamlandı)
- ✅ APScheduler daily job (16:00 İstanbul)
- ✅ Upsert logic (duplicate önleme)
- ✅ Error handling ve retry mekanizması
- ✅ Logging (successful/failed fetch)

### Faz 5: Frontend Modernizasyonu (Tamamlandı)
- ✅ Modern gradient UI (ExchangeRateListModern.tsx)
- ✅ Date picker (tarih seçimi)
- ✅ 4 kur tipi toggle (Döviz/Efektif)
- ✅ EVDS fetch butonu (manual trigger)
- ✅ Source badge (EVDS/TCMB/MANUEL)

### Faz 6: Gelişmiş Özellikler (Planlanan)
- ⏳ Historical chart (kur grafiği)
- ⏳ Rate alert (kur uyarısı, threshold bazlı)
- ⏳ Multi-currency conversion (çapraz kur)
- ⏳ Excel export (tarih aralığı kurlar)

---

## 📊 İş Kuralları ve Validasyonlar

### EVDS API Kuralları
1. **API Key:** `.env` dosyasında `EVDS_API_KEY` zorunlu
2. **Rate Limit:** 1000 request/gün (free tier)
3. **Tarih Formatı:** DD-MM-YYYY (TCMB standardı)
4. **Seri Kodları:** TP.DK.{CURRENCY}.{TYPE} formatı

### Veri Kuralları
1. **Unique Constraint:** Aynı tarih + döviz için tek kayıt
2. **Upsert Logic:** Var olan güncellenir, yok ise oluşturulur
3. **Source:** EVDS, TCMB, MANUEL (manuel girişler için)
4. **CurrencyTo:** Varsayılan "TRY" (gelecekte USD→EUR gibi çapraz kurlar eklenebilir)

### Fallback Mekanizması
```
Bugün (2025-11-25) → EVDS API çağrısı
  ├─ Başarısız (Pazar, veri yok)
  ├─ 1 gün geri (2025-11-24 Cumartesi) → Veri yok
  ├─ 2 gün geri (2025-11-23 Cuma) → ✅ Veri bulundu!
  └─ Return ve DB'ye kaydet

Max 10 gün geriye gider, hala yoksa hata döner
```

### Kur Çevrimi Kuralları
```
GET /api/exchange-rate/convert?amount=1000&from=USD&to=TRY&rate_type=buying

rate_type options:
- "buying"           → Rate (Döviz Alış)
- "selling"          → SellRate (Döviz Satış)
- "banknote_buying"  → BanknoteBuyingRate (Efektif Alış)
- "banknote_selling" → BanknoteSellRate (Efektif Satış)

Varsayılan: "buying"
```

---

## 🔗 Diğer Modüllerle İlişkiler

### Tarife Modülü
```typescript
// Tarife fiyatlarının döviz çevrimi
const priceInTRY = priceInUSD * exchange_rate.Rate;
```

### İş Emri Modülü
```typescript
// İş emri faturalandırma (USD → TRY)
WorkOrder.total_amount_usd * ExchangeRate(date=WorkOrder.completed_date, from=USD)
```

### Fatura Modülü (Gelecek)
```sql
Invoice.amount_foreign_currency → ExchangeRate.Rate → Invoice.amount_try
```

---

## 🎨 Frontend Entegrasyonu

### Kullanılan Componentler
```
frontend/src/features/kurlar/
├── api/
│   └── kurlarApi.ts                    # API client
├── components/
│   ├── ExchangeRateListModern.tsx     # Modern UI (gradient header)
│   ├── ExchangeRateList.tsx           # Eski liste (deprecated)
│   └── KurlarModule.tsx               # Wrapper component
├── hooks/
│   └── useKurlarQueries.ts            # React Query hooks
└── types/
    └── kurlar.ts                       # TypeScript types
```

### Modern UI Özellikleri

**ExchangeRateListModern.tsx:**
```typescript
// Gradient header (blue → indigo)
<div className="bg-gradient-to-r from-blue-600 to-indigo-600">
  <h1>Döviz Kurları</h1>
  <p>TCMB EVDS - Günlük Otomatik Güncelleme</p>
</div>

// EVDS Fetch Section
<button onClick={() => fetchEVDS({ currencies: ["USD", "EUR", "GBP"] })}>
  🔄 EVDS'den Güncelle
</button>
<DatePicker value={selectedDate} onChange={setSelectedDate} />

// Filters
<Select options={["USD", "EUR", "GBP", "CHF", "JPY"]} /> // Kaynak Döviz
<Select options={["TRY"]} />                             // Hedef Döviz
<DateRangePicker from={dateFrom} to={dateTo} />

// Table with 4 rate types
<Table>
  <thead>
    <tr>
      <th>Döviz</th>
      <th>Tarih</th>
      <th>Döviz Alış</th>
      <th>Döviz Satış</th>
      {showEfektif && <th>Efektif Alış</th>}
      {showEfektif && <th>Efektif Satış</th>}
      <th>Kaynak</th>
    </tr>
  </thead>
  <tbody>
    {rates.map(rate => (
      <tr>
        <td>{rate.CurrencyFrom}/{rate.CurrencyTo}</td>
        <td>{formatDate(rate.RateDate)}</td>
        <td>{rate.Rate.toFixed(4)}</td>
        <td>{rate.SellRate?.toFixed(4)}</td>
        {showEfektif && <td>{rate.BanknoteBuyingRate?.toFixed(4)}</td>}
        {showEfektif && <td>{rate.BanknoteSellRate?.toFixed(4)}</td>}
        <td>
          <Badge color={rate.Source === 'EVDS' ? 'blue' : 'amber'}>
            {rate.Source}
          </Badge>
        </td>
      </tr>
    ))}
  </tbody>
</Table>

// Toggle: Efektif Kurları Göster/Gizle
<Switch checked={showEfektif} onChange={setShowEfektif} />
```

---

## 🚀 Deployment Notları

### Environment Variables
```ini
# .env
EVDS_API_KEY=10uUNFzxXP          # TCMB EVDS API key (free tier)
```

**API Key Alma:**
1. https://evds2.tcmb.gov.tr/ adresine git
2. Kayıt ol (ücretsiz)
3. API Key al (1000 request/gün limit)

### APScheduler Konfigürasyonu
```python
# backend/aliaport_api/core/scheduler.py

from apscheduler.schedulers.background import BackgroundScheduler
import pytz

scheduler = BackgroundScheduler(
    timezone=pytz.timezone('Europe/Istanbul'),
    job_defaults={
        'coalesce': True,           # Birden fazla missed job varsa sadece 1 kez çalıştır
        'max_instances': 1,         # Aynı anda 1 instance
        'misfire_grace_time': 3600  # 1 saat içinde missed job'u çalıştır
    }
)

# Job ekle
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

### Database Migration
```bash
# ExchangeRate tablosu (4 kur tipi ile)
alembic revision -m "add_banknote_rates_to_exchange_rate"
alembic upgrade head
```

**Migration SQL:**
```sql
ALTER TABLE ExchangeRate ADD COLUMN BanknoteBuyingRate FLOAT;
ALTER TABLE ExchangeRate ADD COLUMN BanknoteSellRate FLOAT;
ALTER TABLE ExchangeRate ADD COLUMN UpdatedAt DATETIME;
```

### Monitoring
```python
# Prometheus metrik
from prometheus_client import Counter, Histogram

evds_fetch_counter = Counter(
    'kurlar_evds_fetch_total',
    'EVDS API fetch sayısı',
    ['status', 'currency']
)

evds_fetch_duration = Histogram(
    'kurlar_evds_fetch_duration_seconds',
    'EVDS API fetch süresi'
)

# Kullanım
with evds_fetch_duration.time():
    rates = client.fetch_rates("USD", today)
    evds_fetch_counter.labels(status='success', currency='USD').inc()
```

---

## 🧪 Test Senaryoları

### Unit Tests
```python
# tests/test_kurlar.py

def test_evds_fetch_usd():
    """EVDS API'den USD kuru çekme"""
    client = EVDSClient(api_key="test_key")
    rates = client.fetch_rates("USD", date(2025, 11, 24))
    
    assert "buying" in rates
    assert "selling" in rates
    assert "banknote_buying" in rates
    assert "banknote_selling" in rates
    assert rates["buying"] > 0

def test_fallback_mechanism():
    """Hafta sonu için fallback (10 gün geriye)"""
    sunday = date(2025, 11, 23)  # Pazar
    
    # EVDS'de veri yok, 1-2 gün geriye gitmeli
    rate = get_latest_rate_with_fallback("USD", sunday, max_days=10)
    
    assert rate is not None
    assert rate.RateDate < sunday  # Daha eski bir tarih

def test_upsert_logic():
    """Aynı tarih+döviz için güncelleme"""
    # İlk kayıt
    rate1 = create_exchange_rate("USD", "TRY", 34.50, date(2025, 11, 24))
    
    # Aynı tarih+döviz, farklı kur (güncelleme)
    rate2 = create_exchange_rate("USD", "TRY", 34.60, date(2025, 11, 24))
    
    # DB'de tek kayıt olmalı
    count = db.query(ExchangeRate).filter(
        ExchangeRate.RateDate == date(2025, 11, 24),
        ExchangeRate.CurrencyFrom == "USD"
    ).count()
    
    assert count == 1
    assert rate2.Rate == 34.60

def test_convert_endpoint():
    """Döviz çevrimi endpoint testi"""
    response = client.get("/api/exchange-rate/convert", params={
        "amount": 1000,
        "from": "USD",
        "to": "TRY",
        "date": "2025-11-24",
        "rate_type": "buying"
    })
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["converted_amount"] > 30000  # 1000 USD > 30000 TRY
```

### Integration Tests
- APScheduler job manuel tetikleme
- EVDS API timeout handling
- Database constraint violation (duplicate)
- Frontend EVDS fetch butonu click simülasyonu

---

## 📚 Kaynaklar ve Referanslar

### İlgili Dosyalar
- `backend/aliaport_api/modules/kurlar/models.py`
- `backend/aliaport_api/modules/kurlar/router.py`
- `backend/aliaport_api/integrations/evds_client.py`
- `backend/aliaport_api/jobs/kur_guncelleme_job.py`
- `frontend/src/features/kurlar/components/ExchangeRateListModern.tsx`

### Harici API Dokümantasyonu
- **TCMB EVDS API:** https://evds2.tcmb.gov.tr/
- **EVDS API Dokümantasyon:** https://evds2.tcmb.gov.tr/help/videos/EVDS_Web_Servis_Kullanim_Kilavuzu.pdf
- **EVDS Python Client:** https://github.com/fbuyukb/evds (3rd party)

### İlgili Runbook'lar
- `KURLAR_FINAL_DURUM.md`: Kur modülü nihai durum raporu
- `KURLAR_GUNCELLEME_RAPORU.md`: EVDS entegrasyon raporu

---

## 🐛 Bilinen Sorunlar ve Geliştirmeler

### Açık Sorunlar
1. **EVDS API 403 Error:** Bazı API key'lerde geçici erişim sorunu (TCMB sunucu tarafı)
2. **Timezone Handling:** Frontend tarih seçici UTC/Istanbul timezone dönüşümü
3. **Rate Type Confusion:** Kullanıcılar "Efektif" vs "Döviz" farkını bilmiyor

### Gelecek Geliştirmeler
1. **Kur Grafiği:** Historical chart (30 gün, 90 gün, 1 yıl)
2. **Kur Uyarısı:** Threshold bazlı email/SMS (örn: USD > 35 TL olduğunda bildir)
3. **Çapraz Kur:** USD→EUR gibi direkt dönüşümler
4. **Cache Mekanizması:** Redis ile günlük kurları cache'le (DB yükünü azalt)
5. **Excel Export:** Tarih aralığı seçip kurları indirme

---

**Son Güncelleme:** 25 Kasım 2025  
**Güncelleyen:** AI Documentation Agent  
**Versiyon:** 1.0  
**EVDS API Versiyonu:** 2.0 (TCMB Official)
