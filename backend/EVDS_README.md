# KURLAR MOD ÜLÜNÜN - EVDS API Entegrasyonu

## 🎯 Genel Bakış

Aliaport Kurlar modülü, TCMB (Türkiye Cumhuriyet Merkez Bankası) döviz kurlarını otomatik çekmek için EVDS (Elektronik Veri Dağıtım Sistemi) API entegrasyonu kullanır.

## 🔑 EVDS API Key Alma

1. **EVDS Kayıt**: https://evds2.tcmb.gov.tr/ adresine gidin
2. **Üyelik**: Ücretsiz üyelik oluşturun
3. **API Key**: Profil sayfasından API key'inizi alın
4. **Limit**: Free tier 1000 request/day

## ⚙️ Konfigürasyon

### `.env` Dosyası

```dotenv
# EVDS API (TCMB Elektronik Veri Dağıtım Sistemi)
EVDS_API_KEY=your_api_key_here

# Örnek (gerçek key ile değiştirin)
# EVDS_API_KEY=abc123def456ghi789jkl012mno345
```

### API Key Test

```bash
# Backend klasöründe
cd backend
python test_evds.py
```

Beklenen çıktı:
```
🔑 EVDS API Key: abc123de...
📡 EVDS bağlantı testi...
✅ EVDS API bağlantı başarılı

📊 Bugünkü kurlar çekiliyor...
  USD: Alış=34.5678, Satış=34.6789
  EUR: Alış=37.1234, Satış=37.2345
  GBP: Alış=43.5678, Satış=43.6789
  CHF: Alış=38.1234, Satış=38.2345
  JPY: Alış=0.2345, Satış=0.2456

✅ Toplam 5 kur çekildi
```

## 📡 API Endpoints

### 1. EVDS'den Kur Çekme (Primary)

```http
POST /api/kurlar/fetch-evds
Content-Type: application/json

{
  "date": "2025-11-24",  // Opsiyonel, default: bugün
  "currencies": ["USD", "EUR", "GBP"]  // Opsiyonel, default: tümü
}
```

**Response:**
```json
{
  "success": true,
  "message": "EVDS'den 5 kur başarıyla kaydedildi (Tarih: 2025-11-24)",
  "data": [
    {
      "Id": 1,
      "CurrencyFrom": "USD",
      "CurrencyTo": "TRY",
      "Rate": 34.5678,
      "SellRate": 34.6789,
      "BanknoteBuyingRate": 34.5000,
      "BanknoteSellRate": 34.7000,
      "RateDate": "2025-11-24",
      "Source": "EVDS",
      "CreatedAt": "2025-11-24T10:00:00",
      "UpdatedAt": null
    }
  ]
}
```

### 2. TCMB XML'den Kur Çekme (Fallback)

```http
POST /api/kurlar/fetch-tcmb
Content-Type: application/json

{
  "date": "2025-11-24"  // Opsiyonel
}
```

### 3. Bugünün Kurları

```http
GET /api/kurlar/today
```

### 4. Tarih Filtreli Kurlar

```http
GET /api/kurlar/date/2025-11-24
```

### 5. Kur Dönüşümü

```http
GET /api/kurlar/convert?amount=100&from=USD&to=TRY&date=2025-11-24
```

## 🤖 Otomatik Senkronizasyon

### APScheduler Job

Kurlar her gün otomatik güncellenir:

- **Schedule**: Her gün saat 16:00 (İstanbul)
- **Primary**: EVDS API
- **Fallback**: TCMB XML
- **Retry**: 3 kez, 5 dakika grace time

### Job Logs

```
🔄 Kur güncelleme job başladı
📡 EVDS API çağrısı: 2025-11-24 - ['USD', 'EUR', 'GBP', 'CHF', 'JPY']
✅ EVDS'den 5 kur alındı (primary)
✅ Kur güncelleme başarılı!
   📊 5/5 kur güncellendi
   🌐 Kaynak: EVDS
   ⏱️  Süre: 1.23s
```

## 📊 Database Schema

### ExchangeRate Tablosu

```sql
CREATE TABLE ExchangeRate (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CurrencyFrom VARCHAR(10) NOT NULL,  -- USD, EUR, GBP, CHF, JPY
    CurrencyTo VARCHAR(10) DEFAULT 'TRY',
    Rate FLOAT NOT NULL,  -- Döviz Alış (Forex Buying)
    SellRate FLOAT,  -- Döviz Satış (Forex Selling)
    BanknoteBuyingRate FLOAT,  -- Efektif Alış
    BanknoteSellRate FLOAT,  -- Efektif Satış
    RateDate DATE NOT NULL,
    Source VARCHAR(50) DEFAULT 'EVDS',  -- EVDS, TCMB, MANUEL
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME
);

CREATE UNIQUE INDEX ix_exchangerate_unique 
ON ExchangeRate(RateDate, CurrencyFrom, CurrencyTo);
```

## 🔧 Teknik Detaylar

### EVDS Seri Kodları

| Döviz | Alış | Satış | Efektif Alış | Efektif Satış |
|-------|------|-------|--------------|---------------|
| USD | TP.DK.USD.A | TP.DK.USD.S | TP.DK.USD.A.YTL | TP.DK.USD.S.YTL |
| EUR | TP.DK.EUR.A | TP.DK.EUR.S | TP.DK.EUR.A.YTL | TP.DK.EUR.S.YTL |
| GBP | TP.DK.GBP.A | TP.DK.GBP.S | TP.DK.GBP.A.YTL | TP.DK.GBP.S.YTL |
| CHF | TP.DK.CHF.A | TP.DK.CHF.S | TP.DK.CHF.A.YTL | TP.DK.CHF.S.YTL |
| JPY | TP.DK.JPY.A | TP.DK.JPY.S | TP.DK.JPY.A.YTL | TP.DK.JPY.S.YTL |

### EVDS API Request Format

```
GET https://evds2.tcmb.gov.tr/service/evds/series={SERIES_CODES}&startDate={DD-MM-YYYY}&endDate={DD-MM-YYYY}&type=json&key={API_KEY}
```

### Response Format

```json
{
  "totalCount": 1,
  "items": [
    {
      "Tarih": "24-11-2025",
      "TP_DK_USD_A": "34.5678",
      "TP_DK_USD_S": "34.6789",
      "TP_DK_EUR_A": "37.1234",
      "TP_DK_EUR_S": "37.2345"
    }
  ]
}
```

## 🛠️ Troubleshooting

### API Key Hatası

**Error**: `EVDS_API_KEY environment variable tanımlı değil`

**Çözüm**:
1. `.env` dosyasında `EVDS_API_KEY=your_key` ekleyin
2. Backend'i yeniden başlatın

### 403 Forbidden

**Nedenleri**:
- API key geçersiz
- Rate limit aşıldı (1000 request/day)
- EVDS hesabı pasif

**Çözüm**:
1. API key'i kontrol edin
2. Yeni API key alın
3. TCMB XML fallback kullanın

### Veri Yok (404)

**Nedenleri**:
- Hafta sonu/resmi tatil (kur yayınlanmamış)
- Geçmiş tarih (arşivde yok)

**Çözüm**:
- Önceki iş günü için sorgulayın
- TCMB XML API deneyin

## 📚 Kaynaklar

- **EVDS Portal**: https://evds2.tcmb.gov.tr/
- **EVDS Döküman**: https://evds2.tcmb.gov.tr/help/videos/EVDS_Web_Servis_Kullanim_Kilavuzu.pdf
- **TCMB Kurlar**: https://www.tcmb.gov.tr/kurlar/today.xml

## 🔄 Migration Guide

### Eski yapıdan güncelleme

```sql
-- Yeni kolonlar ekle
ALTER TABLE ExchangeRate ADD COLUMN BanknoteBuyingRate FLOAT;
ALTER TABLE ExchangeRate ADD COLUMN BanknoteSellRate FLOAT;
ALTER TABLE ExchangeRate ADD COLUMN UpdatedAt DATETIME;

-- Source kolonunu güncelle
UPDATE ExchangeRate SET Source = 'EVDS' WHERE Source IS NULL;
```

### Mevcut verileri koruma

```bash
# Backup
python -c "from aliaport_api.config.database import engine; import pandas as pd; df = pd.read_sql('SELECT * FROM ExchangeRate', engine); df.to_csv('exchange_rate_backup.csv', index=False)"

# Restore (gerekirse)
python -c "import pandas as pd; from aliaport_api.config.database import engine; df = pd.read_csv('exchange_rate_backup.csv'); df.to_sql('ExchangeRate', engine, if_exists='append', index=False)"
```

## ✅ Test Checklist

- [ ] EVDS API key alındı ve `.env`'ye eklendi
- [ ] `test_evds.py` başarıyla çalıştı
- [ ] Database schema güncellendi (BanknoteBuyingRate, BanknoteSellRate kolonları)
- [ ] `/fetch-evds` endpoint test edildi
- [ ] Otomatik job 16:00'da çalışıyor
- [ ] Frontend güncellenmiş kurları gösteriyor
- [ ] Cache invalidation çalışıyor

## 📞 Destek

Sorun yaşarsanız:
1. `test_evds.py` çalıştırın
2. Backend loglarını kontrol edin
3. EVDS API status: https://evds2.tcmb.gov.tr/
