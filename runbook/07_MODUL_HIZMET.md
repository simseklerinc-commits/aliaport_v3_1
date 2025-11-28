# HİZMET MODÜLÜ - Teknik Dokümantasyon

## 📋 Modül Özeti

**Modül Adı:** Hizmet (Service Card Management)  
**Versiyon:** 3.1.0  
**Durum:** ✅ Production Ready  
**Sorumlu Ekip:** Operations & Finance Team  
**İlgili Modüller:** Tarife, İş Emri, Barınma, Parametre  

---

## 🎯 Ne İşe Yarar?

Hizmet modülü, **tüm liman hizmetlerinin merkezi tanım kartlarını** yönetir. Her hizmet için kod, ad, birim, fiyat, KDV bilgilerini saklar ve Tarife modülünde kullanılır.

**Kullanım Senaryoları:**
- **Standart Hizmetler:** Motorbot çekme, vinç, yükleme-boşaltma
- **Muhasebe Entegrasyonu:** MuhasebeKodu ile ERP bağlantısı
- **Fiyatlandırma:** Temel fiyat + Tarife modülünde özel fiyat
- **Gruplama:** GrupKod ile hizmet kategorileri
- **Metadata:** JSON formatında özel alanlar (tags, custom fields)

**İş Akışı:**
```
Hizmet Tanımı (Kod + Ad + Birim + Fiyat)
         ↓
   Tarife Modülü → Özel fiyatlandırma
         ↓
   İş Emri / Barınma → Hizmet seçimi
         ↓
   Fatura → Muhasebe kodu ile entegrasyon
```

---

## 🗂️ Veritabanı Yapısı

### Tablo: `Hizmet`

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `Id` | Integer | Primary Key | 1, 2, 3... |
| `Kod` | String(50) | **Hizmet kodu** (unique) | "SRV-MOTORBOT-001" |
| `Ad` | String(200) | **Hizmet adı** | "Motorbot Gemi Çekme" |
| `Aciklama` | Text | Detaylı açıklama | "Gemi rıhtıma yanaştırma hizmeti" |
| `MuhasebeKodu` | String(50) | Muhasebe/ERP kodu | "601.01.001" |
| `GrupKod` | String(50) | Grup kodu | "MOTORBOT", "VINC", "YUKLEME" |
| `Birim` | String(20) | Birim (SAAT/ADET/TON/M2) | "SAAT" |
| `Fiyat` | Decimal(18,4) | **Temel fiyat** | 2500.0000 |
| `ParaBirimi` | String(10) | Para birimi | "TRY" (varsayılan) |
| `KdvOrani` | Decimal(5,2) | KDV oranı (%) | 20.00 |
| `UnitId` | Integer | FK → parameters.units (gelecek) | NULL |
| `VatRateId` | Integer | FK → parameters.vat_rates (gelecek) | NULL |
| `VatExemptionId` | Integer | FK → parameters.vat_exemptions | NULL |
| `GroupId` | Integer | FK → parameters.service_groups | NULL |
| `CategoryId` | Integer | FK → parameters.service_categories | NULL |
| `PricingRuleId` | Integer | FK → parameters.pricing_rules | NULL |
| `MetadataJson` | Text | **JSON metadata** | `{"tags": ["acil"], "custom": {...}}` |
| `SiraNo` | Integer | Sıra numarası (görüntüleme) | 1, 2, 3... |
| `AktifMi` | Boolean | **Aktif mi?** | True |
| `CreatedAt` | DateTime | Kayıt zamanı | 2025-01-01 10:00:00 |
| `UpdatedAt` | DateTime | Son güncelleme | 2025-02-01 14:30:00 |
| `CreatedBy` | Integer | FK → User.Id | 3 |
| `UpdatedBy` | Integer | FK → User.Id | 5 |

**MetadataJson Örneği:**
```json
{
  "tags": ["acil", "gece_vardiyasi", "ozel_ekipman"],
  "custom_fields": {
    "requires_permit": true,
    "min_crew_size": 3,
    "equipment_type": "heavy_duty"
  },
  "notes": "Vinç ruhsatı zorunlu"
}
```

**İndeksler:**
- `ix_hizmet_kod`: (Kod) UNIQUE → Hizmet kodu
- `ix_hizmet_grup_kod`: (GrupKod) → Grup bazlı sorgular
- `ix_hizmet_aktif_mi`: (AktifMi) → Aktif hizmetler

---

## 🔌 API Endpoints

### Base URL: `/api/hizmet`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/hizmet/` | Hizmet listesi (sayfalı, filtreleme) |
| GET | `/api/hizmet/active` | Aktif hizmetler |
| GET | `/api/hizmet/by-group/{grup_kod}` | Grup bazlı liste |
| GET | `/api/hizmet/{hizmet_id}` | Hizmet detayı |
| POST | `/api/hizmet/` | Yeni hizmet oluştur |
| PUT | `/api/hizmet/{hizmet_id}` | Hizmet güncelle |
| DELETE | `/api/hizmet/{hizmet_id}` | Hizmet sil (soft delete) |
| GET | `/api/hizmet/search?q={query}` | Hizmet arama (Kod, Ad) |

---

## 💻 Kod Yapısı

**models.py - Hizmet Model:**
```python
class Hizmet(Base):
    __tablename__ = "Hizmet"
    
    Id = Column(Integer, primary_key=True)
    Kod = Column(String(50), unique=True, nullable=False, index=True)
    Ad = Column(String(200), nullable=False)
    Aciklama = Column(Text, nullable=True)
    MuhasebeKodu = Column(String(50), nullable=True)
    
    # Grup ve birim
    GrupKod = Column(String(50), nullable=True)
    Birim = Column(String(20), nullable=True)
    
    # Fiyat alanları
    Fiyat = Column(Numeric(18, 4), nullable=True)
    ParaBirimi = Column(String(10), nullable=False, default="TRY")
    KdvOrani = Column(Numeric(5, 2), nullable=True)
    
    # İlişkisel alanlar (gelecek FK'ler)
    UnitId = Column(Integer, nullable=True)
    VatRateId = Column(Integer, nullable=True)
    VatExemptionId = Column(Integer, nullable=True)
    GroupId = Column(Integer, nullable=True)
    CategoryId = Column(Integer, nullable=True)
    PricingRuleId = Column(Integer, nullable=True)
    
    # JSON metadata
    MetadataJson = Column(Text, nullable=True)
    
    SiraNo = Column(Integer, nullable=True)
    AktifMi = Column(Boolean, nullable=False, default=True)
    
    # Audit
    CreatedAt = Column(DateTime, nullable=False, default=func.now())
    UpdatedAt = Column(DateTime, onupdate=func.now())
    CreatedBy = Column(Integer, nullable=True)
    UpdatedBy = Column(Integer, nullable=True)
    
    # İlişkiler
    price_list_items = relationship("PriceListItem", back_populates="service")
    work_orders = relationship("WorkOrder", back_populates="service")
    barinma_contracts = relationship("BarinmaContract", back_populates="service_card")
```

---

## 🔧 Geliştirme Geçmişi

### Faz 1: Temel Hizmet Tanımları (Tamamlandı)
- ✅ Hizmet CRUD
- ✅ Kod, Ad, Açıklama, Fiyat alanları
- ✅ Grup bazlı filtreleme

### Faz 2: Metadata Desteği (Tamamlandı)
- ✅ MetadataJson alanı (özel alanlar)
- ✅ JSON parse/validate

### Faz 3: Parametre Entegrasyonu (Planlanan)
- ⏳ UnitId → parameters.units (birim tanımları)
- ⏳ VatRateId → parameters.vat_rates (KDV oranları)
- ⏳ GroupId → parameters.service_groups (hizmet grupları)
- ⏳ PricingRuleId → pricing kuralları

---

## 🔗 Diğer Modüllerle İlişkiler

### Tarife Modülü
```sql
PriceListItem.ServiceId → Hizmet.Id
```

### İş Emri Modülü
```sql
WorkOrder.service_id → Hizmet.Id
WorkOrderItem.service_id → Hizmet.Id
```

### Barınma Modülü
```sql
BarinmaContract.ServiceCardId → Hizmet.Id
```

---

## 📚 Kaynaklar

**İlgili Dosyalar:**
- `backend/aliaport_api/modules/hizmet/models.py`
- `backend/aliaport_api/modules/hizmet/router.py`
- `frontend/src/features/hizmet/components/HizmetSelector.tsx`

**İlgili Runbook'lar:**
- `06_MODUL_TARIFE.md`: Tarife entegrasyonu
- `04_MODUL_ISEMRI.md`: İş emri entegrasyonu

---

## 🆕 YENİ ÖZELLİKLER (25 Kasım 2025)

### Excel Tarife Yapısı Entegrasyonu

Aliaport'un mevcut Excel tarife yapısı backend'e tam uyumlu hale getirildi.

#### Excel Kolonları → Database Mapping

| Excel Kolon | Database Alan | Tip | Açıklama |
|-------------|---------------|-----|----------|
| Kod (A) | `Kod` | String(20) | TMP.001, TMP.002, vb. |
| Ad (B) | `Ad` | String(255) | Hizmet açıklaması |
| GrupIsmi (C) | `GrupKod` | String(100) | ACENTE BOTLARI SAHASI |
| Para (D) | `ParaBirimi` | String(3) | USD, TRY, EUR |
| Birim (E) | `Birim` | String(20) | KG, SEFER, ADET, LITRE, TON, GRT |
| Fiyat (F) | `Fiyat` | Decimal(18,4) | Birim fiyat |
| FiyatModeli (G) | `CalculationType` | Enum | PER_UNIT, X_SECONDARY, vb. |
| ModelParam (H) | `FormulaParams` | JSON | Hesaplama parametreleri |

#### CalculationType Enum

```python
class CalculationType(str, enum.Enum):
    """Hesaplama Tipleri - Excel FiyatModeli"""
    FIXED = "FIXED"                          # Sabit ücret
    PER_UNIT = "PER_UNIT"                    # Birim başı (fiyat × miktar)
    X_SECONDARY = "X_SECONDARY"              # İki boyutlu (ardiye: KG × GÜN)
    PER_BLOCK = "PER_BLOCK"                  # Blok bazlı (forklift)
    BASE_PLUS_INCREMENT = "BASE_PLUS_INCREMENT"  # Baz + artış (liman: 950 + GRT×0.03)
    VEHICLE_4H_RULE = "VEHICLE_4H_RULE"      # Araç 4 saat kuralı
```

#### Yeni Model Alanları

```python
class Hizmet(Base):
    # ... mevcut alanlar ...
    
    # YENİ: Excel Tarife Yapısı Entegrasyonu
    CalculationType = Column(SQLEnum(CalculationType), default=CalculationType.FIXED)
    FormulaParams = Column(JSON, nullable=True)  # Excel ModelParam
    
    # YENİ: İş Emri Gereksinimleri
    RequiresPersonCount = Column(Boolean, default=False)  # Kişi sayısı gerekli mi?
    RequiresVehicleInfo = Column(Boolean, default=False)  # Araç bilgisi gerekli mi?
    RequiresWeightInfo = Column(Boolean, default=False)   # Ağırlık bilgisi gerekli mi?
```

---

### Pricing Engine (Fiyatlandırma Motoru)

#### Kullanım

```python
from modules.hizmet.pricing_engine import PricingEngine

engine = PricingEngine()

# Örnek 1: Forklift (PER_BLOCK)
result = engine.calculate(
    calculation_type=CalculationType.PER_BLOCK,
    base_price=Decimal("80.00"),
    formula_params={"base_weight_ton": 3, "base_time_min": 30},
    input_data={"weight": 5, "minutes": 45},
    currency="USD"
)
# Sonuç: 80 × (5/3) × ceil(45/30) = 80 × 1.67 × 2 = 267.20 USD

# Örnek 2: Ardiye (X_SECONDARY)
result = engine.calculate(
    calculation_type=CalculationType.X_SECONDARY,
    base_price=Decimal("0.03"),
    formula_params={
        "primary_field": "weight",
        "secondary_field": "days",
        "secondary_rounding": "ceil"
    },
    input_data={"weight": 500, "days": 3},
    currency="USD"
)
# Sonuç: 0.03 × 500 KG × 3 GÜN = 45 USD

# Örnek 3: Araç Giriş (VEHICLE_4H_RULE)
result = engine.calculate(
    calculation_type=CalculationType.VEHICLE_4H_RULE,
    base_price=Decimal("15.00"),
    formula_params={"base_minutes": 240},
    input_data={"minutes": 450},
    currency="USD"
)
# Sonuç:
# - İlk 240 dk: 15 USD (kesin)
# - Aşan 210 dk: (15/240) × 210 = 13.125 USD
# - Toplam: 28.125 USD
```

#### Excel Örnekleri

**1. Transpalet (TMP.006)**
```
Excel:
  Kod: TMP.006
  FiyatModeli: PER_UNIT
  Fiyat: 20 USD
  Birim: SAAT

Backend:
  calculation_type = CalculationType.PER_UNIT
  base_price = 20.00
  formula_params = {"unit": "SAAT"}

Hesaplama:
  Input: {"quantity": 3}
  Output: 20 × 3 = 60 USD
```

**2. Forklift (TMP.020)**
```
Excel:
  Kod: TMP.020
  FiyatModeli: PER_BLOCK
  Fiyat: 80 USD
  ModelParam: {
    "base_included": {"weight_ton": 3, "time_min": 30},
    "extra_block": {"time_min": 30}
  }

Backend:
  calculation_type = CalculationType.PER_BLOCK
  base_price = 80.00
  formula_params = {
    "base_weight_ton": 3,
    "base_time_min": 30
  }

Hesaplama:
  Input: {"weight": 5, "minutes": 45}
  Output: 80 × (5/3) × ceil(45/30) = 80 × 1.67 × 2 = 267.20 USD
```

**3. Liman Kullanım (TMP.042)**
```
Excel:
  Kod: TMP.042
  FiyatModeli: BASE_PLUS_INCREMENT
  Fiyat: 950 USD (baz)
  ModelParam: {
    "base_price": 950.0,
    "increment_unit": "GRT",
    "increment_rate": 0.03
  }

Backend:
  calculation_type = CalculationType.BASE_PLUS_INCREMENT
  base_price = 950.00
  formula_params = {
    "increment_unit": "GRT",
    "increment_rate": 0.03
  }

Hesaplama:
  Input: {"grt": 5000}
  Output: 950 + (5000 × 0.03) = 950 + 150 = 1100 USD
```

---

### Tarife Listesi (Versiyonlama)

Her hizmet için tarih bazlı fiyat versiyonlaması.

```python
class TarifeListesi(Base):
    """Tarih bazlı tarife versiyonları"""
    __tablename__ = "TarifeListesi"
    
    Id = Column(Integer, primary_key=True)
    HizmetId = Column(Integer, ForeignKey("Hizmet.Id"))
    
    # Geçerlilik
    ValidFrom = Column(Date, nullable=False)  # Başlangıç
    ValidTo = Column(Date, nullable=True)     # Bitiş (NULL ise aktif)
    
    # Fiyat Override
    OverridePrice = Column(Numeric(18, 4), nullable=True)
    OverrideCurrency = Column(String(3), nullable=True)
    
    IsActive = Column(Boolean, default=True)
    VersionNote = Column(Text)  # "2025 Yaz Tarifesi"
```

**Kullanım:**
```sql
-- 2025 başından beri Transpalet 20 USD
INSERT INTO TarifeListesi (HizmetId, ValidFrom, ValidTo, OverridePrice, VersionNote)
VALUES (6, '2025-01-01', '2025-06-30', 20.00, '2025 İlkbahar Tarifesi');

-- 2025-07-01'den itibaren Transpalet 22 USD
INSERT INTO TarifeListesi (HizmetId, ValidFrom, ValidTo, OverridePrice, VersionNote)
VALUES (6, '2025-07-01', NULL, 22.00, '2025 Yaz Tarifesi');
```

---

### Kişi Sayısı Gereksinimleri

Bazı hizmetler kişi listesi gerektirir (teknik personel transferi, ziyaretçi girişi).

```python
# Hizmet tanımı
hizmet = Hizmet(
    Kod="TMP.017",
    Ad="TEKNİSYEN, KLAS, DPA, ENSPEKTÖR, GÖZETİM PERSONELİ vb.",
    RequiresPersonCount=True  # YENİ
)

# İş emri oluşturulduğunda
work_order = WorkOrder(...)
work_order_item = WorkOrderItem(
    service_code="TMP.017",
    quantity=3  # 3 kişi
)

# Kişi listesi oluştur
for i in range(3):
    person = WorkOrderPerson(
        work_order_id=work_order.id,
        work_order_item_id=work_order_item.id,
        full_name="Ahmet Yılmaz",
        tc_kimlik_no="12345678901"
    )
```

**Güvenlik Entegrasyonu:**
- Güvenlik bu listeyi görür
- Her kişinin kimlik belgesi fotoğrafını çeker
- `WorkOrderPerson.identity_document_id` → `ArchiveDocument.id`
- Giriş onayı verir

---

### Otomatik Fiyatlandırma (Tarife + Kur Entegrasyonu)

Hizmet seçildiğinde fiyat otomatik hesaplanır:

```python
def calculate_service_price(
    hizmet_kod: str,
    tarih: date,
    input_data: dict
) -> dict:
    """
    Otomatik fiyatlandırma
    
    1. Hizmet kartını bul
    2. Geçerli tarife bul (tarih bazlı)
    3. Döviz ise kur çek (Kurlar modülü)
    4. Pricing engine ile hesapla
    5. KDV ekle
    """
    
    # 1. Hizmet
    hizmet = db.query(Hizmet).filter(Hizmet.Kod == hizmet_kod).first()
    
    # 2. Geçerli tarife
    tarife = db.query(TarifeListesi).filter(
        TarifeListesi.HizmetId == hizmet.Id,
        TarifeListesi.ValidFrom <= tarih,
        (TarifeListesi.ValidTo >= tarih) | (TarifeListesi.ValidTo == None),
        TarifeListesi.IsActive == True
    ).first()
    
    fiyat = tarife.OverridePrice if tarife else hizmet.Fiyat
    currency = tarife.OverrideCurrency if tarife else hizmet.ParaBirimi
    
    # 3. Döviz kuru (USD/EUR ise)
    if currency != "TRY":
        from modules.kurlar.router import get_today_rate
        kur_data = get_today_rate(currency_from=currency, currency_to="TRY", date=tarih)
        kur = kur_data["sell_rate"]
    else:
        kur = 1.0
    
    # 4. Pricing engine
    from modules.hizmet.pricing_engine import PricingEngine
    engine = PricingEngine()
    
    result = engine.calculate(
        calculation_type=hizmet.CalculationType,
        base_price=fiyat,
        formula_params=hizmet.FormulaParams,
        input_data=input_data,
        currency=currency
    )
    
    # 5. TL'ye çevir
    subtotal_try = result["subtotal"] * Decimal(str(kur))
    
    # 6. KDV
    kdv_oran = hizmet.KdvOrani / 100
    kdv_tutar = subtotal_try * kdv_oran
    genel_toplam = subtotal_try + kdv_tutar
    
    return {
        "hizmet_kod": hizmet_kod,
        "fiyat_para_birimi": currency,
        "fiyat_baz": float(fiyat),
        "kur": float(kur),
        "hesaplama_detay": result["calculation_details"],
        "ara_toplam": float(result["subtotal"]),
        "ara_toplam_try": float(subtotal_try),
        "kdv_oran": float(hizmet.KdvOrani),
        "kdv_tutar": float(kdv_tutar),
        "genel_toplam": float(genel_toplam),
        "tarife_versiyonu": tarife.VersionNote if tarife else "Baz Fiyat"
    }
```

**Örnek Kullanım:**
```python
# Transpalet 3 saat kullanım
result = calculate_service_price(
    hizmet_kod="TMP.006",
    tarih=date(2025, 11, 25),
    input_data={"quantity": 3}
)

# Sonuç:
{
    "hizmet_kod": "TMP.006",
    "fiyat_para_birimi": "USD",
    "fiyat_baz": 20.0,
    "kur": 32.50,  # O günkü USD alış kuru
    "hesaplama_detay": "20.0 USD × 3 SAAT = 60.0 USD",
    "ara_toplam": 60.0,
    "ara_toplam_try": 1950.0,
    "kdv_oran": 20.0,
    "kdv_tutar": 390.0,
    "genel_toplam": 2340.0,
    "tarife_versiyonu": "2025 Yaz Tarifesi"
}
```

---

## 📊 İş Akışı Diyagramı

```
Hizmet Seçimi (İş Emri/Saha Personel)
    ↓
Kişi Sayısı Gerekli mi?
    ├─► EVET → Kişi listesi formu aç
    │          ├─ Ad Soyad
    │          ├─ TC Kimlik / Pasaport
    │          └─ WorkOrderPerson kaydet
    └─► HAYIR → Direkt devam et
    ↓
Geçerli Tarife Bul (tarih bazlı)
    ├─ ValidFrom <= BUGÜN
    └─ ValidTo >= BUGÜN OR NULL
    ↓
Döviz mi?
    ├─► USD/EUR → Kurlar modülünden kur çek
    │            └─ Kur yoksa → HATA: Önce kur güncellemesi gerekli
    └─► TRY → Kur = 1.0
    ↓
Pricing Engine Hesapla
    ├─ CalculationType'a göre
    ├─ FormulaParams kullan
    └─ input_data (weight, hours, grt, vb.)
    ↓
KDV Ekle (kdv_oran)
    ↓
WorkOrderItem Kaydet
    ├─ unit_price = hesaplanan fiyat (TRY)
    ├─ quantity = miktar
    ├─ total_amount = unit_price × quantity
    ├─ vat_amount = KDV
    └─ grand_total = total_amount + vat_amount
```

---

## 🔐 Güvenlik ve Yetkiler

### Roller

| Rol | Yetki |
|-----|-------|
| `ADMIN` | Tüm işlemler |
| `FINANCE` | Hizmet okuma, tarife okuma |
| `OPERATIONS` | Hizmet okuma, iş emrinde kullanma |
| `PORTAL_USER` | Sadece iş emri oluştururken hizmet seçimi |

### Kısıtlamalar

- Tarife değişikliği: Sadece `ADMIN` ve `FINANCE`
- Hizmet oluşturma/silme: Sadece `ADMIN`
- Fiyat görüntüleme: Tüm yetkili kullanıcılar

---

**Son Güncelleme:** 25 Kasım 2025  
**Güncelleyen:** AI Documentation Agent  
**Versiyon:** 2.0 (Excel Entegrasyonu Eklendi)
