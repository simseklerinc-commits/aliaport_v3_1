# BARINMA MODÜLÜ - Teknik Dokümantasyon

## 📋 Modül Özeti

**Modül Adı:** Barınma (Berth/Accommodation Contract Management)  
**Versiyon:** 3.1.0  
**Durum:** ✅ Production Ready  
**Sorumlu Ekip:** Operations & Finance Team  
**İlgili Modüller:** Motorbot, Cari, Hizmet, Tarife, İş Emri  

---

## 🎯 Ne İşe Yarar?

Barınma modülü, **motorbot konaklama kontratlarını** yönetir. Müşteriler (Cari) motorbot veya diğer ekipmanlarını limanda belirli bir süre barındırmak için kontrat yapar. Bu kontratlar, **aylık/çeyreklik/yıllık** faturalama ile devam eder.

**Kullanım Senaryoları:**
- **Motorbot Konaklama:** M/V ABC şirketinin 2 motorbotu 1 yıllık kontratla rıhtımda
- **Açık Uçlu Kontrat:** Başlangıç tarihi var, bitiş yok (süresiz konaklama)
- **Fiyat Listesi Bağlantısı:** Tarife modülünden otomatik fiyat güncelleme
- **Hizmet Kartı:** Standart hizmet tanımından gelen fiyat
- **Faturalama:** Aylık/çeyreklik/yıllık otomatik fatura oluşturma

**İş Akışı:**
```
Cari (Müşteri) + Motorbot seçimi
            ↓
  Hizmet Kartı (Barınma hizmeti)
            ↓
  Tarife seçimi (fiyat listesi)
            ↓
  Kontrat oluşturma (StartDate, EndDate, UnitPrice)
            ↓
  Faturalama (MONTHLY/QUARTERLY/YEARLY)
            ↓
  İş emri ile entegrasyon (BARINMA tipi)
```

---

## 🗂️ Veritabanı Yapısı

### Tablo: `barinma_contract`

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `Id` | Integer | Primary Key | 1, 2, 3... |
| `ContractNumber` | String(50) | **Kontrat numarası** (unique) | "BAR-2025-00123" |
| `MotorbotId` | Integer | FK → motorbot.Id (konaklayan motorbot) | 5 |
| `CariId` | Integer | FK → Cari.Id (müşteri) | 45 |
| `ServiceCardId` | Integer | FK → Hizmet.Id (hizmet kartı) | 12 |
| `PriceListId` | Integer | FK → PriceList.Id (tarife) | 3 |
| `StartDate` | Date | **Kontrat başlangıç tarihi** | 2025-01-01 |
| `EndDate` | Date | **Kontrat bitiş tarihi** (NULL = açık uçlu) | 2026-01-01 |
| `UnitPrice` | Decimal(15,2) | **Birim fiyat** (aylık/çeyreklik/yıllık) | 15000.00 |
| `Currency` | String(3) | Para birimi | "TRY", "USD" |
| `VatRate` | Decimal(5,2) | **KDV oranı** (%) | 20.00 |
| `BillingPeriod` | String(20) | **Faturalama periyodu** | "MONTHLY", "QUARTERLY", "YEARLY" |
| `IsActive` | Boolean | **Aktif mi?** | True |
| `Notes` | Text | Notlar | "Rıhtım 3, sol taraf" |
| `CreatedAt` | DateTime | Kayıt zamanı | 2025-01-01 10:00:00 |
| `UpdatedAt` | DateTime | Son güncelleme | 2025-02-01 14:30:00 |
| `CreatedBy` | Integer | FK → User.Id (oluşturan) | 3 |
| `UpdatedBy` | Integer | FK → User.Id (güncelleyen) | 5 |

**BillingPeriod Enum:**
```python
MONTHLY = "MONTHLY"     # Aylık faturalama
QUARTERLY = "QUARTERLY" # Çeyreklik (3 ayda bir)
YEARLY = "YEARLY"       # Yıllık
```

**İndeksler:**
- `ix_barinma_contract_number`: (ContractNumber) UNIQUE → Kontrat numarası
- `ix_barinma_motorbot_id`: (MotorbotId) → Motorbot bazlı sorgular
- `ix_barinma_cari_id`: (CariId) → Müşteri bazlı sorgular
- `ix_barinma_is_active`: (IsActive) → Aktif kontratlar

**Foreign Key Davranışı:**
```sql
FOREIGN KEY (MotorbotId) REFERENCES motorbot(Id) ON DELETE RESTRICT
FOREIGN KEY (CariId) REFERENCES Cari(Id) ON DELETE RESTRICT
FOREIGN KEY (ServiceCardId) REFERENCES Hizmet(Id) ON DELETE RESTRICT
FOREIGN KEY (PriceListId) REFERENCES price_list(Id) ON DELETE RESTRICT
```
→ **RESTRICT:** Motorbot, Cari, Hizmet silinirse kontrat silinemez (veri kaybını önler)

---

## 🔌 API Endpoints

### Base URL: `/api/barinma-contract`

| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/barinma-contract/` | Kontrat listesi (sayfalı) | `page`, `page_size`, `is_active`, `motorbot_id`, `cari_id` |
| GET | `/api/barinma-contract/active` | **Aktif kontratlar** | - |
| GET | `/api/barinma-contract/expiring-soon` | **Yakında bitecek kontratlar** (30 gün) | `days` (varsayılan 30) |
| GET | `/api/barinma-contract/{contract_id}` | Kontrat detayı | `contract_id` |
| POST | `/api/barinma-contract/` | **Yeni kontrat oluştur** | JSON body |
| PUT | `/api/barinma-contract/{contract_id}` | Kontrat güncelle | `contract_id` + JSON body |
| PUT | `/api/barinma-contract/{contract_id}/renew` | **Kontrat yenileme** | `contract_id`, `new_end_date`, `new_unit_price` |
| PUT | `/api/barinma-contract/{contract_id}/deactivate` | **Kontrat sonlandır** | `contract_id`, `reason` |
| DELETE | `/api/barinma-contract/{contract_id}` | Kontrat sil | `contract_id` (Admin only) |
| GET | `/api/barinma-contract/{contract_id}/invoices` | **Fatura geçmişi** | `contract_id` |
| POST | `/api/barinma-contract/{contract_id}/generate-invoice` | **Manuel fatura oluştur** | `contract_id`, `billing_month` |

### Örnek Request/Response

**POST /api/barinma-contract/ (Yeni Kontrat)**
```json
{
  "ContractNumber": "BAR-2025-00123",
  "MotorbotId": 5,
  "CariId": 45,
  "ServiceCardId": 12,
  "PriceListId": 3,
  "StartDate": "2025-01-01",
  "EndDate": "2026-01-01",
  "UnitPrice": 15000.00,
  "Currency": "TRY",
  "VatRate": 20.00,
  "BillingPeriod": "MONTHLY",
  "Notes": "Rıhtım 3, sol taraf - 24 saat elektrik"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Barınma kontratı oluşturuldu",
  "data": {
    "Id": 123,
    "ContractNumber": "BAR-2025-00123",
    "MotorbotId": 5,
    "motorbot_name": "Motorbot M-123",
    "CariId": 45,
    "cari_title": "ABC Denizcilik A.Ş.",
    "StartDate": "2025-01-01",
    "EndDate": "2026-01-01",
    "UnitPrice": 15000.00,
    "Currency": "TRY",
    "BillingPeriod": "MONTHLY",
    "IsActive": true,
    "CreatedAt": "2025-01-01T10:00:00"
  }
}
```

**GET /api/barinma-contract/expiring-soon?days=30 (Yakında Bitecekler)**
```json
{
  "success": true,
  "message": "30 gün içinde 5 kontrat sona erecek",
  "data": {
    "count": 5,
    "items": [
      {
        "Id": 123,
        "ContractNumber": "BAR-2025-00123",
        "motorbot_name": "Motorbot M-123",
        "cari_title": "ABC Denizcilik",
        "StartDate": "2025-01-01",
        "EndDate": "2025-12-31",
        "days_remaining": 28,
        "UnitPrice": 15000.00,
        "Currency": "TRY"
      }
    ]
  }
}
```

**PUT /api/barinma-contract/123/renew (Kontrat Yenileme)**
```json
{
  "new_end_date": "2027-01-01",
  "new_unit_price": 18000.00,
  "notes": "Yenileme - %20 fiyat artışı"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kontrat yenilendi. Yeni bitiş tarihi: 2027-01-01",
  "data": {
    "Id": 123,
    "EndDate": "2027-01-01",
    "UnitPrice": 18000.00,
    "UpdatedAt": "2025-11-25T14:00:00"
  }
}
```

---

## 💻 Kod Yapısı

### Dosya Organizasyonu
```
backend/aliaport_api/modules/barinma/
├── __init__.py               # Router export
├── models.py                 # BarinmaContract modeli
├── schemas.py                # Pydantic şemaları
├── router.py                 # FastAPI endpoints
└── services/
    ├── billing_service.py    # Faturalama işlemleri
    └── contract_service.py   # Kontrat yönetimi
```

### Katman Mimarisi
```
[Frontend React] ────────────────┐
[APScheduler Job (monthly)] ────┤
                                 ↓
                       [FastAPI Router]
                                 ↓
                   ┌─────────────┴─────────────┐
                   ↓                           ↓
         [ContractService]           [BillingService]
         (Kontrat CRUD)              (Fatura oluşturma)
                   ↓                           ↓
                       [BarinmaContract ORM]
                                 ↓
           ┌─────────────────────┼─────────────────────┐
           ↓                     ↓                     ↓
      [Motorbot]             [Cari]              [Hizmet]
           ↓                     ↓                     ↓
                       [SQLite DB]
```

**Önemli Kod Parçaları:**

**models.py - BarinmaContract Model:**
```python
# backend/aliaport_api/modules/barinma/models.py

from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, Text, Date, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ...config.database import Base

class BarinmaContract(Base):
    __tablename__ = "barinma_contract"
    __table_args__ = {"extend_existing": True}

    Id = Column(Integer, primary_key=True)
    ContractNumber = Column(String(50), unique=True, nullable=False, index=True)
    
    # Foreign Keys
    MotorbotId = Column(Integer, ForeignKey("motorbot.Id", ondelete="RESTRICT"), nullable=False, index=True)
    CariId = Column(Integer, ForeignKey("Cari.Id", ondelete="RESTRICT"), nullable=False, index=True)
    ServiceCardId = Column(Integer, ForeignKey("Hizmet.Id", ondelete="RESTRICT"), nullable=False)
    PriceListId = Column(Integer, ForeignKey("price_list.Id", ondelete="RESTRICT"), nullable=False)
    
    # Date Range
    StartDate = Column(Date, nullable=False)
    EndDate = Column(Date, nullable=True)  # NULL = open-ended contract
    
    # Pricing
    UnitPrice = Column(Numeric(15, 2), nullable=False)
    Currency = Column(String(3), nullable=False, default="TRY")
    VatRate = Column(Numeric(5, 2), nullable=False, default=20.00)
    
    # Billing Configuration
    BillingPeriod = Column(String(20), nullable=False, default="MONTHLY")
    
    # Status & Notes
    IsActive = Column(Boolean, nullable=False, default=True, index=True)
    Notes = Column(Text, nullable=True)
    
    # Audit Fields
    CreatedAt = Column(DateTime, nullable=False, default=func.now())
    UpdatedAt = Column(DateTime, onupdate=func.now())
    CreatedBy = Column(Integer, ForeignKey("User.Id"))
    UpdatedBy = Column(Integer, ForeignKey("User.Id"))
    
    # İlişkiler
    motorbot = relationship("Motorbot", back_populates="contracts")
    cari = relationship("Cari", back_populates="barinma_contracts")
    service_card = relationship("Hizmet", back_populates="barinma_contracts")
    price_list = relationship("PriceList", back_populates="barinma_contracts")
    
    def generate_contract_number(self) -> str:
        """Auto-generate BAR-2025-00123"""
        year = datetime.now().year
        last_contract = db.query(BarinmaContract).filter(
            BarinmaContract.ContractNumber.like(f"BAR-{year}-%")
        ).order_by(BarinmaContract.Id.desc()).first()
        
        if last_contract:
            last_num = int(last_contract.ContractNumber.split("-")[-1])
            new_num = last_num + 1
        else:
            new_num = 1
        
        return f"BAR-{year}-{new_num:05d}"
    
    def is_expiring_soon(self, days: int = 30) -> bool:
        """Kontrat yakında bitiyor mu? (30 gün içinde)"""
        if not self.EndDate:
            return False  # Açık uçlu kontrat
        
        today = datetime.now().date()
        delta = (self.EndDate - today).days
        return 0 < delta <= days
    
    def calculate_total_with_vat(self) -> Decimal:
        """KDV dahil toplam tutar"""
        return self.UnitPrice * (1 + self.VatRate / 100)
```

**billing_service.py - Faturalama Servisi:**
```python
# backend/aliaport_api/modules/barinma/services/billing_service.py

from datetime import datetime, timedelta
from decimal import Decimal

class BillingService:
    def __init__(self, db: Session):
        self.db = db
    
    def generate_monthly_invoices(self):
        """
        Aylık otomatik fatura oluşturma (APScheduler job)
        Her ayın 1'inde çalışır
        """
        today = datetime.now().date()
        
        # Aktif kontratları al (MONTHLY faturalama)
        active_contracts = self.db.query(BarinmaContract).filter(
            BarinmaContract.IsActive == True,
            BarinmaContract.BillingPeriod == "MONTHLY",
            BarinmaContract.StartDate <= today
        ).all()
        
        invoices_created = 0
        
        for contract in active_contracts:
            # Kontrat bittiyse atla
            if contract.EndDate and contract.EndDate < today:
                continue
            
            # Fatura oluştur
            invoice = self.create_invoice_for_contract(contract, today)
            if invoice:
                invoices_created += 1
        
        logger.info(f"📄 {invoices_created} fatura oluşturuldu (Barınma kontratları)")
        return invoices_created
    
    def create_invoice_for_contract(self, contract: BarinmaContract, billing_date: date):
        """Kontrat için fatura oluştur"""
        # Fatura kaydı oluştur (Invoice modülü ile entegrasyon)
        invoice = Invoice(
            InvoiceNumber=self.generate_invoice_number(),
            CariId=contract.CariId,
            InvoiceDate=billing_date,
            DueDate=billing_date + timedelta(days=30),  # 30 gün vade
            Currency=contract.Currency,
            TotalAmount=contract.UnitPrice,
            VatAmount=contract.UnitPrice * (contract.VatRate / 100),
            GrandTotal=contract.calculate_total_with_vat(),
            Notes=f"Barınma kontratı: {contract.ContractNumber}"
        )
        
        self.db.add(invoice)
        
        # Fatura kalemi ekle
        invoice_line = InvoiceLine(
            InvoiceId=invoice.Id,
            Description=f"Barınma hizmeti - {contract.motorbot.Adi} ({contract.BillingPeriod})",
            Quantity=1,
            UnitPrice=contract.UnitPrice,
            VatRate=contract.VatRate,
            Total=contract.calculate_total_with_vat()
        )
        
        self.db.add(invoice_line)
        self.db.commit()
        
        logger.info(f"✅ Fatura oluşturuldu: {invoice.InvoiceNumber} (Kontrat: {contract.ContractNumber})")
        return invoice
    
    def generate_invoice_number(self) -> str:
        """Auto-generate INV-2025-00123"""
        year = datetime.now().year
        last_invoice = self.db.query(Invoice).filter(
            Invoice.InvoiceNumber.like(f"INV-{year}-%")
        ).order_by(Invoice.Id.desc()).first()
        
        if last_invoice:
            last_num = int(last_invoice.InvoiceNumber.split("-")[-1])
            new_num = last_num + 1
        else:
            new_num = 1
        
        return f"INV-{year}-{new_num:05d}"
```

**contract_service.py - Kontrat Yönetimi:**
```python
# backend/aliaport_api/modules/barinma/services/contract_service.py

class ContractService:
    def __init__(self, db: Session):
        self.db = db
    
    def renew_contract(self, contract_id: int, new_end_date: date, new_unit_price: Decimal = None):
        """Kontrat yenileme"""
        contract = self.db.query(BarinmaContract).filter(BarinmaContract.Id == contract_id).first()
        
        if not contract:
            raise HTTPException(404, "Kontrat bulunamadı")
        
        # Yeni bitiş tarihi eskisinden sonra olmalı
        if contract.EndDate and new_end_date <= contract.EndDate:
            raise HTTPException(400, "Yeni bitiş tarihi mevcut bitiş tarihinden sonra olmalıdır")
        
        # Güncelle
        contract.EndDate = new_end_date
        if new_unit_price:
            contract.UnitPrice = new_unit_price
        contract.UpdatedAt = datetime.now()
        
        # Audit log
        self.db.add(AuditLog(
            event_type="CONTRACT_RENEWED",
            entity_type="BarinmaContract",
            entity_id=contract.Id,
            details={
                "contract_number": contract.ContractNumber,
                "old_end_date": str(contract.EndDate),
                "new_end_date": str(new_end_date),
                "new_unit_price": float(new_unit_price) if new_unit_price else None
            }
        ))
        
        self.db.commit()
        self.db.refresh(contract)
        
        return contract
    
    def deactivate_contract(self, contract_id: int, reason: str):
        """Kontrat sonlandırma"""
        contract = self.db.query(BarinmaContract).filter(BarinmaContract.Id == contract_id).first()
        
        if not contract:
            raise HTTPException(404, "Kontrat bulunamadı")
        
        if not contract.IsActive:
            raise HTTPException(400, "Kontrat zaten pasif")
        
        contract.IsActive = False
        contract.EndDate = datetime.now().date()  # Bugün bitir
        contract.Notes = f"{contract.Notes}\n\nSonlandırma: {reason}"
        contract.UpdatedAt = datetime.now()
        
        self.db.commit()
        self.db.refresh(contract)
        
        return contract
```

---

## 🔧 Geliştirme Geçmişi

### Faz 1: Temel Kontrat Yönetimi (Tamamlandı)
- ✅ BarinmaContract model ve tablo
- ✅ CRUD endpoints
- ✅ Foreign key entegrasyonları (Motorbot, Cari, Hizmet, Tarife)
- ✅ Unique constraint (ContractNumber)
- ✅ Açık uçlu kontrat desteği (EndDate NULL)

### Faz 2: Faturalama (Tamamlandı)
- ✅ BillingPeriod (MONTHLY/QUARTERLY/YEARLY)
- ✅ Otomatik fatura oluşturma (APScheduler job)
- ✅ `generate_monthly_invoices()` metodu
- ✅ Invoice modülü ile entegrasyon

### Faz 3: Kontrat Yönetimi (Tamamlandı)
- ✅ `/renew` endpoint (kontrat yenileme)
- ✅ `/deactivate` endpoint (kontrat sonlandırma)
- ✅ `/expiring-soon` endpoint (yakında bitecekler)
- ✅ Audit log entegrasyonu

### Faz 4: Frontend Modernizasyonu (Planlanan)
- ⏳ Kontrat listesi (grid view)
- ⏳ Kontrat detay modal
- ⏳ Yenileme formu
- ⏳ Dashboard widget (yakında bitenler)

---

## 📊 İş Kuralları ve Validasyonlar

### Kontrat Kuralları
1. **ContractNumber:** Unique, format BAR-YYYY-XXXXX
2. **StartDate:** Bugün veya gelecek tarih
3. **EndDate:** NULL (açık uçlu) veya StartDate'den sonra
4. **UnitPrice:** Pozitif sayı
5. **BillingPeriod:** MONTHLY, QUARTERLY, YEARLY (enum)

### Faturalama Kuralları
```python
# MONTHLY: Her ayın 1'inde
if today.day == 1 and contract.BillingPeriod == "MONTHLY":
    create_invoice()

# QUARTERLY: Her 3 ayda bir (Ocak, Nisan, Temmuz, Ekim)
if today.day == 1 and today.month in [1, 4, 7, 10] and contract.BillingPeriod == "QUARTERLY":
    create_invoice()

# YEARLY: Her yılın StartDate ayında
if today.day == 1 and today.month == contract.StartDate.month and contract.BillingPeriod == "YEARLY":
    create_invoice()
```

### Foreign Key RESTRICT Davranışı
```
Motorbot sil → BarinmaContract var → HATA (Önce kontrat sonlandır)
Cari sil → BarinmaContract var → HATA (Önce kontrat sonlandır)
Hizmet sil → BarinmaContract var → HATA (Önce kontrat sonlandır)
```

---

## 🔗 Diğer Modüllerle İlişkiler

### Motorbot Modülü
```sql
BarinmaContract.MotorbotId → Motorbot.Id
```

### Cari Modülü
```sql
BarinmaContract.CariId → Cari.Id
```

### Hizmet Modülü
```sql
BarinmaContract.ServiceCardId → Hizmet.Id (standart hizmet fiyatı)
```

### Tarife Modülü
```sql
BarinmaContract.PriceListId → PriceList.Id (fiyat listesi)
```

### İş Emri Modülü
```sql
WorkOrder.wo_type = 'BARINMA'
WorkOrder.items → BarinmaContract referansı (iş emri oluşturma)
```

---

## 🎨 Frontend Entegrasyonu

### Kullanılan Componentler
```
frontend/src/features/barinma/
├── api/
│   └── barinmaApi.ts                  # API client
├── components/
│   ├── ContractList.tsx               # Kontrat listesi
│   ├── ContractDetail.tsx             # Detay modal
│   ├── ContractForm.tsx               # Oluştur/Düzenle formu
│   └── ExpiringContracts.tsx          # Yakında bitenler widget
├── hooks/
│   └── useBarinmaQueries.ts          # React Query hooks
└── types/
    └── barinma.ts                     # TypeScript types
```

**ContractList.tsx:**
```typescript
const { data: contracts } = useQuery(['barinma-contracts', filters], () =>
  fetchContracts(filters)
);

return (
  <Table>
    <thead>
      <tr>
        <th>Kontrat No</th>
        <th>Motorbot</th>
        <th>Müşteri</th>
        <th>Başlangıç</th>
        <th>Bitiş</th>
        <th>Fiyat</th>
        <th>Periyot</th>
        <th>Durum</th>
      </tr>
    </thead>
    <tbody>
      {contracts.map(contract => (
        <tr key={contract.Id}>
          <td>{contract.ContractNumber}</td>
          <td>{contract.motorbot_name}</td>
          <td>{contract.cari_title}</td>
          <td>{formatDate(contract.StartDate)}</td>
          <td>{contract.EndDate ? formatDate(contract.EndDate) : 'Açık Uçlu'}</td>
          <td>{formatCurrency(contract.UnitPrice, contract.Currency)}</td>
          <td><Badge>{contract.BillingPeriod}</Badge></td>
          <td>
            <Badge color={contract.IsActive ? 'green' : 'red'}>
              {contract.IsActive ? 'Aktif' : 'Pasif'}
            </Badge>
          </td>
        </tr>
      ))}
    </tbody>
  </Table>
);
```

---

## 🚀 Deployment Notları

### APScheduler Job (Otomatik Faturalama)
```python
# backend/aliaport_api/core/scheduler.py

from apscheduler.schedulers.background import BackgroundScheduler
import pytz

scheduler = BackgroundScheduler(timezone=pytz.timezone('Europe/Istanbul'))

# Her ayın 1'inde saat 09:00'da çalış
scheduler.add_job(
    billing_service.generate_monthly_invoices,
    trigger='cron',
    day=1,
    hour=9,
    minute=0,
    id='barinma_monthly_billing',
    replace_existing=True
)

scheduler.start()
```

### Database Migration
```sql
CREATE TABLE barinma_contract (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ContractNumber VARCHAR(50) UNIQUE NOT NULL,
    MotorbotId INTEGER NOT NULL,
    CariId INTEGER NOT NULL,
    ServiceCardId INTEGER NOT NULL,
    PriceListId INTEGER NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE,
    UnitPrice DECIMAL(15,2) NOT NULL,
    Currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    VatRate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    BillingPeriod VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    IsActive BOOLEAN NOT NULL DEFAULT 1,
    Notes TEXT,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME,
    CreatedBy INTEGER,
    UpdatedBy INTEGER,
    FOREIGN KEY (MotorbotId) REFERENCES motorbot(Id) ON DELETE RESTRICT,
    FOREIGN KEY (CariId) REFERENCES Cari(Id) ON DELETE RESTRICT,
    FOREIGN KEY (ServiceCardId) REFERENCES Hizmet(Id) ON DELETE RESTRICT,
    FOREIGN KEY (PriceListId) REFERENCES price_list(Id) ON DELETE RESTRICT
);

CREATE INDEX ix_barinma_contract_number ON barinma_contract(ContractNumber);
CREATE INDEX ix_barinma_motorbot_id ON barinma_contract(MotorbotId);
CREATE INDEX ix_barinma_cari_id ON barinma_contract(CariId);
CREATE INDEX ix_barinma_is_active ON barinma_contract(IsActive);
```

---

## 🧪 Test Senaryoları

### Unit Tests
```python
def test_create_contract():
    """Yeni kontrat oluşturma"""
    contract = create_barinma_contract(
        motorbot_id=5,
        cari_id=45,
        start_date=date(2025, 1, 1),
        end_date=date(2026, 1, 1),
        unit_price=15000.00
    )
    
    assert contract.ContractNumber.startswith("BAR-2025-")
    assert contract.IsActive == True

def test_open_ended_contract():
    """Açık uçlu kontrat (EndDate NULL)"""
    contract = create_barinma_contract(
        motorbot_id=5,
        cari_id=45,
        start_date=date(2025, 1, 1),
        end_date=None
    )
    
    assert contract.EndDate is None
    assert contract.is_expiring_soon() == False

def test_renew_contract():
    """Kontrat yenileme"""
    contract = create_barinma_contract(end_date=date(2025, 12, 31))
    
    renewed = contract_service.renew_contract(
        contract.Id,
        new_end_date=date(2027, 1, 1),
        new_unit_price=18000.00
    )
    
    assert renewed.EndDate == date(2027, 1, 1)
    assert renewed.UnitPrice == 18000.00
```

---

## 📚 Kaynaklar ve Referanslar

### İlgili Dosyalar
- `backend/aliaport_api/modules/barinma/models.py`
- `backend/aliaport_api/modules/barinma/router.py`
- `backend/aliaport_api/modules/barinma/services/billing_service.py`
- `frontend/src/features/barinma/components/ContractList.tsx`

### İlgili Runbook'lar
- `02_MODUL_MOTORBOT.md`: Motorbot entegrasyonu
- `01_MODUL_CARI.md`: Cari entegrasyonu
- `04_MODUL_ISEMRI.md`: İş emri entegrasyonu

---

## 🐛 Bilinen Sorunlar ve Geliştirmeler

### Açık Sorunlar
1. **Invoice Modülü:** Fatura entegrasyonu kısmen tamamlandı (InvoiceLine mapping eksik)
2. **Otomatik Yenileme:** Kontrat bitiminde otomatik yenileme önerisi yok

### Gelecek Geliştirmeler
1. **Otomatik Uyarı:** Kontrat 30 gün önce bitmeden email/SMS bildirim
2. **Dashboard Widget:** Ana ekranda yakında bitecek kontratlar
3. **Toplu İşlem:** Çoklu kontrat yenileme/sonlandırma
4. **Excel Export:** Kontrat listesi Excel çıktısı

---

**Son Güncelleme:** 25 Kasım 2025  
**Güncelleyen:** AI Documentation Agent  
**Versiyon:** 1.0  
**Faturalama Durum:** Aktif (APScheduler ile otomatik)
