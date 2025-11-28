# TARİFE MODÜLÜ - Teknik Dokümantasyon

## 📋 Modül Özeti

**Modül Adı:** Tarife (Price List Management)  
**Versiyon:** 3.1.0  
**Durum:** ✅ Production Ready  
**Sorumlu Ekip:** Finance & Pricing Team  
**İlgili Modüller:** Hizmet, Kurlar, İş Emri, Barınma  

---

## 🎯 Ne İşe Yarar?

Tarife modülü, **hizmet fiyat listelerini** yönetir. Farklı müşteri grupları, farklı dönemler veya farklı hizmet tipleri için özel fiyatlandırma yapılmasını sağlar.

**Kullanım Senaryoları:**
- **Standart Tarife:** Genel müşteriler için temel fiyat listesi
- **Özel Tarife:** VIP müşteri, toplu alım, sezonluk fiyat
- **Tarih Aralığı:** Yaz/kış sezonu fiyatları
- **Dinamik Fiyatlandırma:** Kur bazlı otomatik güncelleme (USD/EUR)
- **İndirim Kuralları:** %10 Türk bayraklı, %25 gece vardiyası vs.

**İş Akışı:**
```
Hizmet Tanımı (Kod, Ad)
      ↓
Tarife Oluştur (İsim, Geçerlilik Tarihleri)
      ↓
Tarife Kalemleri Ekle (Hizmet + Fiyat + Döviz + KDV)
      ↓
İş Emri / Barınma → Tarife seç → Otomatik fiyat hesapla
```

---

## 🗂️ Veritabanı Yapısı

### Tablo 1: `price_list` (Tarife Başlığı)

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `Id` | Integer | Primary Key | 1, 2, 3... |
| `Code` | String(50) | **Tarife kodu** (unique) | "TARIFE-2025-STANDART" |
| `Name` | String(200) | **Tarife adı** | "2025 Standart Fiyat Listesi" |
| `Description` | Text | Açıklama | "Genel müşteriler için standart tarife" |
| `ValidFrom` | Date | **Geçerlilik başlangıç** | 2025-01-01 |
| `ValidTo` | Date | **Geçerlilik bitiş** (NULL = süresiz) | 2025-12-31 |
| `IsActive` | Boolean | **Aktif mi?** | True |
| `IsDefault` | Boolean | **Varsayılan tarife mi?** | True |
| `Currency` | String(3) | Para birimi | "TRY", "USD", "EUR" |
| `CreatedAt` | DateTime | Kayıt zamanı | 2025-01-01 10:00:00 |
| `UpdatedAt` | DateTime | Son güncelleme | 2025-02-01 14:30:00 |
| `CreatedBy` | Integer | FK → User.Id (oluşturan) | 3 |
| `UpdatedBy` | Integer | FK → User.Id (güncelleyen) | 5 |

**İndeksler:**
- `ix_price_list_code`: (Code) UNIQUE → Tarife kodu
- `ix_price_list_is_active`: (IsActive) → Aktif tarifeler
- `ix_price_list_is_default`: (IsDefault) → Varsayılan tarife

---

### Tablo 2: `price_list_item` (Tarife Kalemleri)

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `Id` | Integer | Primary Key | 1, 2, 3... |
| `PriceListId` | Integer | FK → price_list.Id | 1 |
| `ServiceId` | Integer | FK → Hizmet.Id (hizmet kartı) | 12 |
| `ServiceCode` | String(50) | Hizmet kodu (snapshot) | "SRV-MOTORBOT-CEKME" |
| `ServiceName` | String(200) | Hizmet adı (snapshot) | "Motorbot Gemi Çekme" |
| `UnitPrice` | Decimal(18,4) | **Birim fiyat** | 2500.0000 |
| `Currency` | String(3) | Para birimi | "TRY" |
| `Unit` | String(20) | Birim (SAAT/ADET/TON/M2) | "SAAT" |
| `VatRate` | Decimal(5,2) | KDV oranı (%) | 20.00 |
| `DiscountPercent` | Decimal(5,2) | İndirim % | 0.00 |
| `MinQuantity` | Decimal(10,2) | **Minimum miktar** (kademeli fiyat) | 1.00 |
| `MaxQuantity` | Decimal(10,2) | **Maximum miktar** | NULL (sınırsız) |
| `Notes` | Text | Notlar | "Gece vardiyası +%25" |
| `IsActive` | Boolean | Aktif mi? | True |
| `CreatedAt` | DateTime | Kayıt zamanı | 2025-01-01 10:00:00 |
| `UpdatedAt` | DateTime | Son güncelleme | 2025-02-01 14:30:00 |

**Kademeli Fiyatlandırma Örneği:**
```
Hizmet: "Motorbot Gemi Çekme"

Kalem 1: MinQuantity=1, MaxQuantity=5, UnitPrice=3000 TL/saat   (1-5 saat)
Kalem 2: MinQuantity=6, MaxQuantity=10, UnitPrice=2800 TL/saat  (6-10 saat, %7 indirim)
Kalem 3: MinQuantity=11, MaxQuantity=NULL, UnitPrice=2500 TL/saat (11+ saat, %17 indirim)
```

**İndeksler:**
- `ix_price_list_item_price_list_id`: (PriceListId) → Tarife bazlı sorgular
- `ix_price_list_item_service_id`: (ServiceId) → Hizmet bazlı sorgular
- `ix_price_list_item_is_active`: (IsActive) → Aktif kalemler

---

## 🔌 API Endpoints

### Base URL: `/api/price-list`

| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/price-list/` | Tarife listesi (sayfalı) | `page`, `page_size`, `is_active`, `currency` |
| GET | `/api/price-list/active` | **Aktif tarifeler** | - |
| GET | `/api/price-list/default` | **Varsayılan tarife** | - |
| GET | `/api/price-list/{price_list_id}` | Tarife detayı (items dahil) | `price_list_id` |
| POST | `/api/price-list/` | **Yeni tarife oluştur** | JSON body |
| PUT | `/api/price-list/{price_list_id}` | Tarife güncelle | `price_list_id` + JSON body |
| DELETE | `/api/price-list/{price_list_id}` | Tarife sil | `price_list_id` (Admin only) |
| POST | `/api/price-list/{price_list_id}/items` | **Kalem ekle** | `price_list_id` + JSON body |
| PUT | `/api/price-list/items/{item_id}` | Kalem güncelle | `item_id` + JSON body |
| DELETE | `/api/price-list/items/{item_id}` | Kalem sil | `item_id` |
| GET | `/api/price-list/{price_list_id}/calculate-price` | **Fiyat hesaplama** | `price_list_id`, `service_id`, `quantity` |
| POST | `/api/price-list/bulk-update-prices` | **Toplu fiyat güncelleme** | `price_list_id`, `adjustment_percent` |

### Örnek Request/Response

**POST /api/price-list/ (Yeni Tarife)**
```json
{
  "Code": "TARIFE-2025-STANDART",
  "Name": "2025 Standart Fiyat Listesi",
  "Description": "Genel müşteriler için standart tarife",
  "ValidFrom": "2025-01-01",
  "ValidTo": "2025-12-31",
  "IsActive": true,
  "IsDefault": true,
  "Currency": "TRY"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tarife oluşturuldu",
  "data": {
    "Id": 1,
    "Code": "TARIFE-2025-STANDART",
    "Name": "2025 Standart Fiyat Listesi",
    "ValidFrom": "2025-01-01",
    "ValidTo": "2025-12-31",
    "IsActive": true,
    "IsDefault": true,
    "Currency": "TRY",
    "CreatedAt": "2025-01-01T10:00:00"
  }
}
```

**POST /api/price-list/1/items (Kalem Ekleme)**
```json
{
  "ServiceId": 12,
  "UnitPrice": 2500.00,
  "Currency": "TRY",
  "Unit": "SAAT",
  "VatRate": 20.00,
  "MinQuantity": 1.00,
  "MaxQuantity": null,
  "Notes": "Standart motorbot çekme hizmeti"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tarife kalemi eklendi",
  "data": {
    "Id": 100,
    "PriceListId": 1,
    "ServiceId": 12,
    "ServiceCode": "SRV-MOTORBOT-CEKME",
    "ServiceName": "Motorbot Gemi Çekme",
    "UnitPrice": 2500.00,
    "Currency": "TRY",
    "Unit": "SAAT",
    "VatRate": 20.00,
    "MinQuantity": 1.00,
    "MaxQuantity": null,
    "IsActive": true,
    "CreatedAt": "2025-01-01T10:05:00"
  }
}
```

**GET /api/price-list/1/calculate-price?service_id=12&quantity=8 (Fiyat Hesaplama)**
```json
{
  "success": true,
  "message": "Fiyat hesaplandı (kademeli fiyatlandırma uygulandı)",
  "data": {
    "service_id": 12,
    "service_name": "Motorbot Gemi Çekme",
    "quantity": 8.0,
    "unit": "SAAT",
    "applied_price_item": {
      "Id": 101,
      "UnitPrice": 2800.00,
      "MinQuantity": 6.0,
      "MaxQuantity": 10.0,
      "Notes": "6-10 saat arası %7 indirim"
    },
    "subtotal": 22400.00,
    "vat_amount": 4480.00,
    "total": 26880.00,
    "currency": "TRY"
  }
}
```

**POST /api/price-list/bulk-update-prices (Toplu %10 Artış)**
```json
{
  "price_list_id": 1,
  "adjustment_percent": 10.0,
  "service_ids": [12, 13, 14]  // null ise tüm kalemler
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 kalem fiyatı %10 artırıldı",
  "data": {
    "updated_count": 3,
    "adjustment_percent": 10.0,
    "old_prices": [2500.00, 3000.00, 1500.00],
    "new_prices": [2750.00, 3300.00, 1650.00]
  }
}
```

---

## 💻 Kod Yapısı

### Dosya Organizasyonu
```
backend/aliaport_api/modules/tarife/
├── __init__.py               # Router export
├── models.py                 # PriceList + PriceListItem
├── schemas.py                # Pydantic şemaları
├── router.py                 # FastAPI endpoints
└── services/
    ├── pricing_service.py    # Fiyat hesaplama (kademeli, indirim)
    └── import_export.py      # Excel import/export
```

### Katman Mimarisi
```
[Frontend React] ──────────────┐
[İş Emri Modülü] ─────────────┤
[Barınma Modülü] ─────────────┤
                              ↓
                    [FastAPI Router]
                              ↓
                      [PricingService]
                  (Kademeli fiyat, indirim)
                              ↓
              [PriceList + PriceListItem ORM]
                              ↓
                  ┌───────────┴───────────┐
                  ↓                       ↓
            [Hizmet]                  [Kurlar]
            (Hizmet kartları)      (Döviz çevrimi)
                  ↓                       ↓
                        [SQLite DB]
```

**Önemli Kod Parçaları:**

**models.py - PriceList + PriceListItem:**
```python
# backend/aliaport_api/modules/tarife/models.py

from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from ...config.database import Base

class PriceList(Base):
    __tablename__ = "price_list"
    __table_args__ = {"extend_existing": True}

    Id = Column(Integer, primary_key=True)
    Code = Column(String(50), unique=True, nullable=False, index=True)
    Name = Column(String(200), nullable=False)
    Description = Column(Text, nullable=True)
    ValidFrom = Column(Date, nullable=False)
    ValidTo = Column(Date, nullable=True)
    IsActive = Column(Boolean, nullable=False, default=True, index=True)
    IsDefault = Column(Boolean, nullable=False, default=False, index=True)
    Currency = Column(String(3), nullable=False, default="TRY")
    
    CreatedAt = Column(DateTime, nullable=False, default=func.now())
    UpdatedAt = Column(DateTime, onupdate=func.now())
    CreatedBy = Column(Integer, ForeignKey("User.Id"))
    UpdatedBy = Column(Integer, ForeignKey("User.Id"))
    
    # İlişkiler
    items = relationship("PriceListItem", back_populates="price_list", cascade="all, delete-orphan")
    barinma_contracts = relationship("BarinmaContract", back_populates="price_list")
    
    def is_valid_on_date(self, check_date: date) -> bool:
        """Tarife belirli tarihte geçerli mi?"""
        if not self.IsActive:
            return False
        
        if check_date < self.ValidFrom:
            return False
        
        if self.ValidTo and check_date > self.ValidTo:
            return False
        
        return True


class PriceListItem(Base):
    __tablename__ = "price_list_item"
    __table_args__ = {"extend_existing": True}

    Id = Column(Integer, primary_key=True)
    PriceListId = Column(Integer, ForeignKey("price_list.Id", ondelete="CASCADE"), nullable=False, index=True)
    ServiceId = Column(Integer, ForeignKey("Hizmet.Id", ondelete="RESTRICT"), nullable=False, index=True)
    
    # Snapshot (Hizmet silinse bile korunur)
    ServiceCode = Column(String(50), nullable=True)
    ServiceName = Column(String(200), nullable=True)
    
    # Fiyat bilgileri
    UnitPrice = Column(Numeric(18, 4), nullable=False)
    Currency = Column(String(3), nullable=False, default="TRY")
    Unit = Column(String(20), nullable=True)
    VatRate = Column(Numeric(5, 2), nullable=False, default=20.00)
    DiscountPercent = Column(Numeric(5, 2), default=0.00)
    
    # Kademeli fiyatlandırma
    MinQuantity = Column(Numeric(10, 2), default=1.00)
    MaxQuantity = Column(Numeric(10, 2), nullable=True)  # NULL = sınırsız
    
    Notes = Column(Text, nullable=True)
    IsActive = Column(Boolean, nullable=False, default=True, index=True)
    
    CreatedAt = Column(DateTime, nullable=False, default=func.now())
    UpdatedAt = Column(DateTime, onupdate=func.now())
    
    # İlişkiler
    price_list = relationship("PriceList", back_populates="items")
    service = relationship("Hizmet", back_populates="price_list_items")
    
    def calculate_price(self, quantity: Decimal) -> dict:
        """Miktar bazlı fiyat hesaplama"""
        # Kademeli kontrol
        if self.MinQuantity and quantity < self.MinQuantity:
            raise ValueError(f"Minimum miktar: {self.MinQuantity} {self.Unit}")
        
        if self.MaxQuantity and quantity > self.MaxQuantity:
            raise ValueError(f"Maximum miktar: {self.MaxQuantity} {self.Unit}")
        
        # Ara toplam
        subtotal = quantity * self.UnitPrice
        
        # İndirim
        discount = subtotal * (self.DiscountPercent / 100) if self.DiscountPercent else 0
        
        # Vergi
        taxable = subtotal - discount
        vat = taxable * (self.VatRate / 100)
        
        # Toplam
        total = taxable + vat
        
        return {
            "quantity": float(quantity),
            "unit_price": float(self.UnitPrice),
            "subtotal": float(subtotal),
            "discount_percent": float(self.DiscountPercent or 0),
            "discount_amount": float(discount),
            "vat_rate": float(self.VatRate),
            "vat_amount": float(vat),
            "total": float(total),
            "currency": self.Currency
        }
```

**pricing_service.py - Fiyat Hesaplama Servisi:**
```python
# backend/aliaport_api/modules/tarife/services/pricing_service.py

from decimal import Decimal

class PricingService:
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_service_price(self, price_list_id: int, service_id: int, quantity: Decimal) -> dict:
        """
        Hizmet fiyatı hesaplama (kademeli fiyatlandırma ile)
        
        Örnek:
        1-5 saat: 3000 TL/saat
        6-10 saat: 2800 TL/saat
        11+ saat: 2500 TL/saat
        
        quantity=8 → 2800 TL/saat uygulanır
        """
        # Tarife geçerli mi?
        price_list = self.db.query(PriceList).filter(PriceList.Id == price_list_id).first()
        if not price_list or not price_list.IsActive:
            raise HTTPException(404, "Tarife bulunamadı veya aktif değil")
        
        # İlgili kalemleri al (kademeli fiyatlandırma için MinQuantity sıralı)
        items = self.db.query(PriceListItem).filter(
            PriceListItem.PriceListId == price_list_id,
            PriceListItem.ServiceId == service_id,
            PriceListItem.IsActive == True
        ).order_by(PriceListItem.MinQuantity.asc()).all()
        
        if not items:
            raise HTTPException(404, "Bu hizmet için fiyat tanımı bulunamadı")
        
        # Uygun kademeyi bul
        applicable_item = None
        for item in items:
            min_qty = item.MinQuantity or 0
            max_qty = item.MaxQuantity
            
            if quantity >= min_qty:
                if max_qty is None or quantity <= max_qty:
                    applicable_item = item
                    break
        
        if not applicable_item:
            raise HTTPException(400, f"Miktar {quantity} için uygun fiyat kadamesi bulunamadı")
        
        # Fiyat hesapla
        result = applicable_item.calculate_price(quantity)
        result["applied_price_item"] = {
            "Id": applicable_item.Id,
            "UnitPrice": float(applicable_item.UnitPrice),
            "MinQuantity": float(applicable_item.MinQuantity or 0),
            "MaxQuantity": float(applicable_item.MaxQuantity) if applicable_item.MaxQuantity else None,
            "Notes": applicable_item.Notes
        }
        
        return result
    
    def bulk_update_prices(self, price_list_id: int, adjustment_percent: Decimal, service_ids: list = None):
        """
        Toplu fiyat güncelleme
        
        Örnek: Tüm fiyatları %10 artır
        """
        query = self.db.query(PriceListItem).filter(
            PriceListItem.PriceListId == price_list_id,
            PriceListItem.IsActive == True
        )
        
        if service_ids:
            query = query.filter(PriceListItem.ServiceId.in_(service_ids))
        
        items = query.all()
        
        old_prices = []
        new_prices = []
        
        for item in items:
            old_price = item.UnitPrice
            new_price = old_price * (1 + adjustment_percent / 100)
            
            old_prices.append(float(old_price))
            new_prices.append(float(new_price))
            
            item.UnitPrice = new_price
            item.UpdatedAt = datetime.now()
        
        self.db.commit()
        
        return {
            "updated_count": len(items),
            "adjustment_percent": float(adjustment_percent),
            "old_prices": old_prices,
            "new_prices": new_prices
        }
```

---

## 🔧 Geliştirme Geçmişi

### Faz 1: Temel Tarife Yönetimi (Tamamlandı)
- ✅ PriceList + PriceListItem modeller
- ✅ CRUD endpoints
- ✅ Foreign key entegrasyonları (Hizmet)
- ✅ Tarih bazlı geçerlilik (ValidFrom, ValidTo)
- ✅ Varsayılan tarife (IsDefault)

### Faz 2: Kademeli Fiyatlandırma (Tamamlandı)
- ✅ MinQuantity, MaxQuantity alanları
- ✅ Miktar bazlı fiyat hesaplama
- ✅ `/calculate-price` endpoint
- ✅ Otomatik kademe seçimi

### Faz 3: Toplu İşlemler (Tamamlandı)
- ✅ `/bulk-update-prices` endpoint (%10 artış vs.)
- ✅ Audit log entegrasyonu

### Faz 4: Excel Import/Export (Planlanan)
- ⏳ Excel'den tarife import
- ⏳ Tarife Excel export (print-friendly)
- ⏳ Template dosya oluşturma

### Faz 5: Dinamik Fiyatlandırma (Gelecek)
- ⏳ Kur bazlı otomatik güncelleme (USD → TRY)
- ⏳ Sezonluk fiyat (yaz/kış)
- ⏳ Müşteri grubu bazlı özel tarife

---

## 📊 İş Kuralları ve Validasyonlar

### Tarife Kuralları
1. **Code:** Unique, format TARIFE-YYYY-XXX
2. **ValidFrom:** Zorunlu
3. **ValidTo:** Opsiyonel (NULL = süresiz)
4. **IsDefault:** Sadece 1 tarife varsayılan olabilir
5. **Currency:** TRY, USD, EUR (enum)

### Kalem Kuralları
1. **UnitPrice:** Pozitif sayı
2. **MinQuantity:** Varsayılan 1.00
3. **MaxQuantity:** NULL (sınırsız) veya MinQuantity'den büyük
4. **Kademeli Fiyat:** Aynı hizmet için birden fazla kalem (farklı MinQuantity/MaxQuantity)

### Kademeli Fiyatlandırma Örneği
```python
# Motorbot Çekme Hizmeti (ServiceId=12)

Kalem 1: MinQuantity=1,  MaxQuantity=5,    UnitPrice=3000 TL/saat
Kalem 2: MinQuantity=6,  MaxQuantity=10,   UnitPrice=2800 TL/saat
Kalem 3: MinQuantity=11, MaxQuantity=NULL, UnitPrice=2500 TL/saat

# Fiyat hesaplama
calculate_price(service_id=12, quantity=3)  → 3000 TL/saat (Kalem 1)
calculate_price(service_id=12, quantity=8)  → 2800 TL/saat (Kalem 2)
calculate_price(service_id=12, quantity=15) → 2500 TL/saat (Kalem 3)
```

---

## 🔗 Diğer Modüllerle İlişkiler

### Hizmet Modülü
```sql
PriceListItem.ServiceId → Hizmet.Id
```

### İş Emri Modülü
```sql
WorkOrder → PriceList seçimi → Otomatik fiyat hesaplama
WorkOrderItem.unit_price ← PriceListItem.UnitPrice (kademeli)
```

### Barınma Modülü
```sql
BarinmaContract.PriceListId → PriceList.Id
```

### Kurlar Modülü (Gelecek)
```sql
PriceList.Currency = "USD" → ExchangeRate.Rate → TRY çevrimi
```

---

## 🎨 Frontend Entegrasyonu

### Kullanılan Componentler
```
frontend/src/features/tarife/
├── api/
│   └── tarifeApi.ts                  # API client
├── components/
│   ├── PriceListList.tsx             # Tarife listesi
│   ├── PriceListDetail.tsx           # Detay modal (items dahil)
│   ├── PriceListForm.tsx             # Oluştur/Düzenle formu
│   └── PriceListItemTable.tsx        # Kalem tablosu (inline edit)
├── hooks/
│   └── useTarifeQueries.ts          # React Query hooks
└── types/
    └── tarife.ts                     # TypeScript types
```

**PriceListItemTable.tsx (Kalem Tablosu):**
```typescript
const { data: items } = useQuery(['price-list-items', priceListId], () =>
  fetchPriceListItems(priceListId)
);

return (
  <div>
    <button onClick={addItem}>+ Kalem Ekle</button>
    
    <Table>
      <thead>
        <tr>
          <th>Hizmet Kodu</th>
          <th>Hizmet Adı</th>
          <th>Birim Fiyat</th>
          <th>Birim</th>
          <th>KDV %</th>
          <th>Min Miktar</th>
          <th>Max Miktar</th>
          <th>İndirim %</th>
          <th>İşlem</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.Id}>
            <td>{item.ServiceCode}</td>
            <td>{item.ServiceName}</td>
            <td>
              <Input 
                type="number" 
                value={item.UnitPrice} 
                onChange={(e) => updateItemPrice(item.Id, e.target.value)} 
              />
            </td>
            <td>{item.Unit}</td>
            <td>{item.VatRate}%</td>
            <td>{item.MinQuantity}</td>
            <td>{item.MaxQuantity || '∞'}</td>
            <td>{item.DiscountPercent}%</td>
            <td>
              <button onClick={() => deleteItem(item.Id)}>Sil</button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  </div>
);
```

---

## 🚀 Deployment Notları

### Database Migration
```sql
CREATE TABLE price_list (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Code VARCHAR(50) UNIQUE NOT NULL,
    Name VARCHAR(200) NOT NULL,
    Description TEXT,
    ValidFrom DATE NOT NULL,
    ValidTo DATE,
    IsActive BOOLEAN NOT NULL DEFAULT 1,
    IsDefault BOOLEAN NOT NULL DEFAULT 0,
    Currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME,
    CreatedBy INTEGER,
    UpdatedBy INTEGER
);

CREATE TABLE price_list_item (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    PriceListId INTEGER NOT NULL,
    ServiceId INTEGER NOT NULL,
    ServiceCode VARCHAR(50),
    ServiceName VARCHAR(200),
    UnitPrice DECIMAL(18,4) NOT NULL,
    Currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    Unit VARCHAR(20),
    VatRate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    DiscountPercent DECIMAL(5,2) DEFAULT 0.00,
    MinQuantity DECIMAL(10,2) DEFAULT 1.00,
    MaxQuantity DECIMAL(10,2),
    Notes TEXT,
    IsActive BOOLEAN NOT NULL DEFAULT 1,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME,
    FOREIGN KEY (PriceListId) REFERENCES price_list(Id) ON DELETE CASCADE,
    FOREIGN KEY (ServiceId) REFERENCES Hizmet(Id) ON DELETE RESTRICT
);

CREATE INDEX ix_price_list_code ON price_list(Code);
CREATE INDEX ix_price_list_is_active ON price_list(IsActive);
CREATE INDEX ix_price_list_item_price_list_id ON price_list_item(PriceListId);
CREATE INDEX ix_price_list_item_service_id ON price_list_item(ServiceId);
```

### Varsayılan Tarife Oluşturma
```python
# Deployment sonrası ilk tarife
default_price_list = PriceList(
    Code="TARIFE-2025-STANDART",
    Name="2025 Standart Fiyat Listesi",
    Description="Genel müşteriler için standart tarife",
    ValidFrom=date(2025, 1, 1),
    ValidTo=None,  # Süresiz
    IsActive=True,
    IsDefault=True,
    Currency="TRY"
)

db.add(default_price_list)
db.commit()
```

---

## 🧪 Test Senaryoları

### Unit Tests
```python
def test_create_price_list():
    """Yeni tarife oluşturma"""
    price_list = create_price_list(
        code="TARIFE-2025-STANDART",
        name="2025 Standart",
        valid_from=date(2025, 1, 1)
    )
    
    assert price_list.Code == "TARIFE-2025-STANDART"
    assert price_list.IsActive == True

def test_tiered_pricing():
    """Kademeli fiyatlandırma"""
    # 1-5 saat: 3000 TL, 6-10 saat: 2800 TL, 11+ saat: 2500 TL
    price_list = create_price_list_with_tiers()
    
    # 3 saat → 3000 TL/saat
    result = pricing_service.calculate_service_price(price_list.Id, 12, 3)
    assert result["unit_price"] == 3000.00
    
    # 8 saat → 2800 TL/saat
    result = pricing_service.calculate_service_price(price_list.Id, 12, 8)
    assert result["unit_price"] == 2800.00
    
    # 15 saat → 2500 TL/saat
    result = pricing_service.calculate_service_price(price_list.Id, 12, 15)
    assert result["unit_price"] == 2500.00

def test_bulk_price_update():
    """Toplu %10 artış"""
    price_list = create_price_list_with_items([2500, 3000, 1500])
    
    result = pricing_service.bulk_update_prices(price_list.Id, adjustment_percent=10.0)
    
    assert result["updated_count"] == 3
    assert result["new_prices"] == [2750.00, 3300.00, 1650.00]
```

---

## 📚 Kaynaklar ve Referanslar

### İlgili Dosyalar
- `backend/aliaport_api/modules/tarife/models.py`
- `backend/aliaport_api/modules/tarife/router.py`
- `backend/aliaport_api/modules/tarife/services/pricing_service.py`
- `frontend/src/features/tarife/components/PriceListItemTable.tsx`

### İlgili Runbook'lar
- `04_MODUL_ISEMRI.md`: İş emri entegrasyonu
- `05_MODUL_BARINMA.md`: Barınma entegrasyonu
- `03_MODUL_KURLAR.md`: Döviz çevrimi (gelecek)

---

## 🐛 Bilinen Sorunlar ve Geliştirmeler

### Açık Sorunlar
1. **Excel Import:** Tarife import özelliği eksik
2. **Kur Entegrasyonu:** USD fiyat → TRY otomatik çevrimi yok

### Gelecek Geliştirmeler
1. **Excel İşlemleri:** Import/Export özelliği
2. **Dinamik Fiyat:** Kur bazlı otomatik güncelleme
3. **Sezonluk Tarife:** Yaz/kış fiyat farklılaştırması
4. **Müşteri Grubu Tarife:** VIP müşteri, toplu alım indirimi

---

**Son Güncelleme:** 25 Kasım 2025  
**Güncelleyen:** AI Documentation Agent  
**Versiyon:** 1.0  
**Kademeli Fiyat:** Aktif ✅
