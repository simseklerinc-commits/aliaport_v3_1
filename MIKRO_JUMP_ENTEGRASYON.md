# MİKRO JUMP 17 API ENTEGRASYON REHBERİ

## 📋 Genel Bakış

Aliaport, **Mikro Jump 17** muhasebe yazılımı ile **Mikro API v1.0** üzerinden entegre olur.

**API Dokümantasyon:** https://apidocs.mikro.com.tr/apis

### Desteklenen İşlemler:

✅ **Cari Hesaplar** - Listeleme, ekleme, güncelleme  
✅ **Stok Kartları** - Listeleme, ekleme  
✅ **Fatura** - Oluşturma (FaturaKaydetV3)  
✅ **Tahsilat/Tediye** - Ödeme kayıtları  
✅ **SQL Sorgulama** - Özel sorgu çalıştırma  
✅ **İrsaliye, Sipariş, Dekont** - Tüm evrak tipleri  

---

## 🔧 Kurulum

### 1. Mikro API Servisi Başlatma

Mikro Jump'ta API servisi aktif edilmelidir:

**Mikro Jump → Sistem → API Ayarları**
- API Servisi: Aktif
- Port: 8094 (varsayılan)
- SSL: İsteğe bağlı

### 2. .env Dosyası Konfigürasyonu

`.env` dosyasındaki Mikro API ayarlarını düzenleyin:

```env
# Mikro API Ayarları
MIKRO_API_URL=http://localhost:8094              # Mikro API URL (port genellikle 8094)
MIKRO_API_USERNAME=admin                         # Mikro kullanıcı adı
MIKRO_API_PASSWORD=admin123                      # Mikro şifresi
MIKRO_COMPANY_CODE=1                             # Firma numarası (1, 2, 3, ...)
MIKRO_PERIOD=1                                   # Dönem (1-12)
```

### 3. API Bağlantı Testi

Backend çalışırken şu endpoint'i test edin:

```
GET http://localhost:8000/api/mikro/test-connection
```

Başarılı yanıt:
```json
{
  "success": true,
  "message": "Mikro Jump API bağlantısı başarılı",
  "api_url": "http://localhost:8094",
  "firma_no": "1",
  "donem": "1"
}
```

---

## 📡 Aliaport API Endpoints

### Bağlantı Testi
```http
GET /api/mikro/test-connection
```

### Cari Hesaplar

**API ile Liste:**
```http
GET /api/mikro/api/cari/list?filtre=120
```

**API ile Yeni Cari:**
```http
POST /api/mikro/api/cari/create
Content-Type: application/json

{
  "CariKod": "120.01.999",
  "CariIsim": "Test Cari A.Ş.",
  "VKN_TCKN": "1234567890",
  "CariGrupKodu": "120"
}
```

**SQL ile Liste (Doğrudan DB):**
```http
GET /api/mikro/cari/list?kod=120
```

**SQL ile Bakiye:**
```http
GET /api/mikro/cari/{cari_kod}/bakiye
```

### Stok Kartları

**API ile Liste:**
```http
GET /api/mikro/api/stok/list?filtre=BAR
```

**SQL ile Liste:**
```http
GET /api/mikro/stok/list?kod=BAR
```

### Faturalar

**API ile Fatura Oluştur:**
```http
POST /api/mikro/api/fatura/create
Content-Type: application/json

{
  "BelgeTuru": 0,
  "BelgeNo": "FAT2025000001",
  "Tarih": "2025-11-22",
  "CariKod": "120.01.001",
  "Satirlar": [
    {
      "StokKod": "BAR-001",
      "Miktar": 1,
      "BirimFiyat": 50000,
      "KDVOrani": 20
    }
  ]
}
```

### SQL Sorgulama

**Özel SQL Çalıştır:**
```http
POST /api/mikro/api/sql/query
Content-Type: application/json

{
  "sql": "SELECT TOP 10 cari_kod, cari_unvan1 FROM CARI_HESAPLAR"
}
```

---

## 🔐 Kimlik Doğrulama (Authentication)

Mikro API her istek için Session ID kullanır:

### 1. Login İsteği
```http
POST /Api/APIMethods/APILogin
Content-Type: application/json

{
  "KullaniciAdi": "admin",
  "Sifre": "admin123",
  "FirmaNo": 1,
  "Donem": 1
}
```

### 2. Yanıt
```json
{
  "Basarili": true,
  "SessionId": "abc123-xyz-456",
  "Mesaj": "Başarılı"
}
```

### 3. İşlem İsteği
```http
POST /Api/APIMethods/CariListesiV3
Content-Type: application/json

{
  "SessionId": "abc123-xyz-456",
  "Filtre": {}
}
```

### 4. Logout
```http
POST /Api/apiMethods/APILogoff

{
  "SessionId": "abc123-xyz-456"
}
```

**Not:** Aliaport entegrasyonu bu adımları otomatik yapar!

---

## 📊 Mikro API Endpoint'leri

### Cari İşlemleri
| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/Api/APIMethods/CariListesiV3` | POST | Cari listesi |
| `/API/APIMethods/CariKaydetV2` | POST | Yeni cari |
| `/API/APIMethods/CariGuncelleV2` | POST | Cari güncelle |

### Stok İşlemleri
| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/Api/APIMethods/StokListesiV2` | POST | Stok listesi |
| `/API/APIMethods/StokKaydetV2` | POST | Yeni stok kartı |

### Fatura İşlemleri
| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/api/APIMethods/FaturaKaydetV3` | POST | Fatura oluştur |
| `/Api/apiMethods/AlimSatimEvragiKaydetV2` | POST | Alım/Satım evrakı |
| `/API/APIMethods/FaturaPdfV2` | POST | Fatura PDF |

### E-Fatura
| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/Api/apiMethods/FaturaToEFaturaV2` | POST | E-Fatura gönder |
| `/Api/apiMethods/GelenFaturalarV2` | POST | Gelen E-Faturalar |
| `/API/APIMethods/EMukellefSorgulamaV2` | POST | E-Mükellef sorgula |

### Tahsilat/Tediye
| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/Api/apiMethods/TahsilatTediyeKaydetV3` | POST | Tahsilat/Tediye kaydet |

### SQL Sorgulama
| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/Api/apiMethods/SqlVeriOkuV2` | POST | SQL sorgusu çalıştır |

**Tam liste:** https://apidocs.mikro.com.tr/apis

---

## 💡 Kullanım Örnekleri

### Python - Mikro API Kullanımı

```python
from app.mikro_integration import MikroJumpAPI

# API nesnesini oluştur
mikro = MikroJumpAPI()

# Kimlik doğrulama
if mikro.authenticate():
    # Cari listesi çek
    cariler = mikro.get_cari_listesi(filtre={"CariKod": "120"})
    print(f"{len(cariler)} cari bulundu")
    
    # Yeni fatura oluştur
    fatura = {
        "BelgeTuru": 0,  # Satış faturası
        "CariKod": "120.01.001",
        "Tarih": "2025-11-22",
        "Satirlar": [
            {
                "StokKod": "BAR-001",
                "Miktar": 1,
                "BirimFiyat": 50000
            }
        ]
    }
    result = mikro.create_fatura(fatura)
    
    # Logout
    mikro.logout()
```

### JavaScript - Fetch API

```javascript
// Cari listesi çek
fetch('http://localhost:8000/api/mikro/api/cari/list?filtre=120')
  .then(res => res.json())
  .then(data => console.log(data));

// Fatura oluştur
fetch('http://localhost:8000/api/mikro/api/fatura/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    BelgeTuru: 0,
    CariKod: '120.01.001',
    Tarih: '2025-11-22',
    Satirlar: [...]
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 🛠️ Troubleshooting

### API Bağlantı Hatası

**Hata:** "Mikro API bağlantı hatası"

**Çözüm:**
1. Mikro Jump'ta API servisi çalışıyor mu kontrol edin
2. Port 8094 açık mı? `Test-NetConnection localhost -Port 8094`
3. .env dosyasındaki URL doğru mu?
4. Firewall API portunu engelliyor mu?

### Kimlik Doğrulama Hatası

**Hata:** "SessionId geçersiz"

**Çözüm:**
1. Kullanıcı adı/şifre doğru mu?
2. Firma numarası ve dönem doğru mu?
3. Kullanıcının API erişim yetkisi var mı?

### SQL Sorgu Hatası

**Hata:** "Invalid object name"

**Çözüm:**
- Tablo adlarını kontrol edin (Mikro tablolar BÜYÜK HARFLE)
- Doğru veritabanını seçtiğinizden emin olun
- Firma ve dönem parametreleri doğru mu?

---

## 📞 Destek

**Mikro API Dokümantasyonu:** https://apidocs.mikro.com.tr/apis  
**Mikro Teknik Destek:** https://www.mikro.com.tr/  
**Aliaport Issues:** https://github.com/simseklerinc-commits/Aliaport_v3_1/issues

---

## ✅ Checklist

- [ ] Mikro Jump'ta API servisi aktif edildi
- [ ] .env dosyasında API ayarları yapıldı
- [ ] API bağlantı testi başarılı
- [ ] Cari listesi çekildi
- [ ] Test faturası oluşturuldu
- [ ] E-Fatura entegrasyonu test edildi (opsiyonel)


---

## 📡 API Endpoints

### Bağlantı Testi
```
GET /api/mikro/test-connection
```

### Cari Hesaplar

**Liste:**
```
GET /api/mikro/cari/list?kod=120
```

**Bakiye:**
```
GET /api/mikro/cari/{cari_kod}/bakiye
```

### Stok Kartları

```
GET /api/mikro/stok/list?kod=BAR
```

### Faturalar

**Liste:**
```
GET /api/mikro/fatura/list?cari_kod=120.01.001&baslangic_tarih=2025-01-01&bitis_tarih=2025-12-31
```

**Satırlar:**
```
GET /api/mikro/fatura/{evrak_seri}/{evrak_no}/satirlar
```

### Senkronizasyon

**Cari Hesapları Senkronize Et:**
```
POST /api/mikro/sync/cari
```

**Genel Senkronizasyon:**
```
POST /api/mikro/sync
Body: {
  "sync_type": "cari",
  "filters": {}
}
```

---

## 🗄️ Mikro Jump Veritabanı Tabloları

### Önemli Tablolar:

| Tablo | Açıklama |
|-------|----------|
| `CARI_HESAPLAR` | Cari hesap kartları |
| `CARI_HESAP_HAREKETLERI` | Cari hareketler |
| `STOKLAR` | Stok/Hizmet kartları |
| `FATURALAR` | Fatura başlıkları |
| `FATURA_SATIRLARI` | Fatura satırları |
| `KASA_HAREKETLERI` | Kasa hareketleri |
| `BANKA_HAREKETLERI` | Banka hareketleri |

### Örnek SQL Sorguları:

**Cari Bakiye:**
```sql
SELECT 
    cha_kod,
    SUM(CASE WHEN cha_tip = 0 THEN cha_meblag ELSE -cha_meblag END) as bakiye
FROM CARI_HESAP_HAREKETLERI
WHERE cha_kod = '120.01.001'
GROUP BY cha_kod
```

**Fatura Toplamları:**
```sql
SELECT 
    fat_cari_kod,
    COUNT(*) as fatura_sayisi,
    SUM(fat_geneltoplam) as toplam_tutar
FROM FATURALAR
WHERE fat_tarih BETWEEN '2025-01-01' AND '2025-12-31'
GROUP BY fat_cari_kod
```

---

## 🔄 Veri Senkronizasyon Stratejisi

### 1. Tek Yönlü: Mikro Jump → Aliaport

```python
# Mikro Jump'tan cari hesapları çek ve Aliaport'a kaydet
POST /api/mikro/sync/cari
```

**Kullanım Senaryosu:**
- Aliaport'ta yeni cari seçiciler için Mikro Jump verilerini kullan
- Güncel bakiyeleri görüntüle

### 2. Tek Yönlü: Aliaport → Mikro Jump

```python
# Aliaport'ta oluşturulan faturayı Mikro Jump'a aktar
from app.mikro_integration import MikroJumpAPI

mikro_api = MikroJumpAPI()
mikro_api.create_invoice(invoice_data)
```

**Kullanım Senaryosu:**
- Aliaport'ta kesilen hizmet faturalarını Mikro Jump'a aktar
- Otomatik muhasebe entegrasyonu

### 3. Çift Yönlü Senkronizasyon

- Scheduled job ile belirli aralıklarla senkronizasyon
- Webhook ile anlık veri aktarımı (Mikro Jump destekliyorsa)

---

## 🛠️ Geliştirme Notları

### Mikro Jump Tablo Yapısını İnceleme

SSMS ile Mikro Jump veritabanına bağlanıp tablo yapılarını inceleyin:

```sql
-- Tablo listesi
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME

-- Tablo kolonları
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'CARI_HESAPLAR'
```

### API Dokümantasyonu

Mikro Jump'ın REST API dokümantasyonunu edinin:
- Endpoint listesi
- Authentication yöntemi (Bearer token, API key, vs.)
- Request/Response formatları
- Rate limiting kuralları

### Hata Yönetimi

```python
try:
    mikro_db = MikroJumpDatabase()
    mikro_db.connect()
    # işlemler
except pyodbc.Error as e:
    print(f"SQL Hatası: {e}")
except Exception as e:
    print(f"Genel Hata: {e}")
finally:
    mikro_db.disconnect()
```

---

## 📞 Destek

Mikro Jump API dokümantasyonu için:
- Mikro Yazılım Teknik Destek
- Mikro Jump Developer Portal (varsa)

Aliaport entegrasyon sorunları için:
- GitHub Issues: https://github.com/simseklerinc-commits/Aliaport_v3_1/issues

---

## ✅ Checklist

- [ ] ODBC Driver 17 kuruldu
- [ ] .env dosyasında SQL Server ayarları yapıldı
- [ ] SQL Server bağlantı testi başarılı
- [ ] Mikro Jump tablo yapıları incelendi
- [ ] API dokümantasyonu edinildi
- [ ] Test senkronizasyonu yapıldı
- [ ] Cari bakiye sorguları test edildi
- [ ] Fatura aktarımı test edildi
