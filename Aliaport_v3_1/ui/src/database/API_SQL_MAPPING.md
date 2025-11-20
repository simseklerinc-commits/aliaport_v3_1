# ALIAPORT LİMAN YÖNETİM SİSTEMİ - API & SQL MAPPING

## 📋 Genel Bakış

Bu doküman, Aliaport Liman Yönetim Sistemi'ndeki 9 ana modülün API endpoints'leri ile PostgreSQL tablo yapıları arasındaki eşleşmeyi gösterir.

---

## 1️⃣ CARİ YÖNETİMİ

### SQL Tabloları
- `tmm_cari` - Ana cari tablosu
- `cari_hesap_hareket` - Cari hesap hareketleri

### API Endpoints
```typescript
// /lib/api/cari.ts
cariApi.getAll(params)           → SELECT * FROM tmm_cari
cariApi.getById(id)              → SELECT * FROM tmm_cari WHERE id = ?
cariApi.getByCode(code)          → SELECT * FROM tmm_cari WHERE code = ?
cariApi.getWithStats(id)         → JOIN tmm_cari + invoice (aggregate)
cariApi.create(data)             → INSERT INTO tmm_cari
cariApi.update(id, data)         → UPDATE tmm_cari WHERE id = ?
cariApi.delete(id)               → DELETE FROM tmm_cari WHERE id = ?
cariApi.toggleActive(id)         → UPDATE tmm_cari SET is_active = NOT is_active

cariHareketApi.getByCariId(id)   → SELECT * FROM cari_hesap_hareket WHERE cari_id = ?
cariHareketApi.getBalance(id)    → SUM(amount) FROM cari_hesap_hareket
cariHareketApi.getEkstre(id)     → SELECT * FROM cari_hesap_hareket + balance calc
```

### TypeScript Interface
```typescript
interface Cari {
  id: number;
  code: string;
  title: string;
  type: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  tax_office?: string;
  tax_number?: string;
  // ... diğer alanlar
}
```

---

## 2️⃣ HİZMET KARTLARI

### SQL Tabloları
- `service_card` - Hizmet kartları

### API Endpoints
```typescript
// /lib/api/hizmet.ts
hizmetApi.getAll(params)         → SELECT * FROM service_card
hizmetApi.getById(id)            → SELECT * FROM service_card WHERE id = ?
hizmetApi.getByCode(code)        → SELECT * FROM service_card WHERE code = ?
hizmetApi.getByCategory(cat)     → SELECT * FROM service_card WHERE category = ?
hizmetApi.create(data)           → INSERT INTO service_card
hizmetApi.update(id, data)       → UPDATE service_card WHERE id = ?
hizmetApi.delete(id)             → DELETE FROM service_card WHERE id = ?
```

### TypeScript Interface
```typescript
interface ServiceCard {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  is_active: boolean;
}
```

---

## 3️⃣ TARİFE YÖNETİMİ

### SQL Tabloları
- `price_list` - Tarife başlıkları
- `price_list_item` - Tarife kalemleri (hizmet fiyatları)

### API Endpoints
```typescript
// /lib/api/tarife.ts
tarifeApi.getAll(params)                    → SELECT * FROM price_list
tarifeApi.getById(id)                       → SELECT * FROM price_list WHERE id = ?
tarifeApi.getActive()                       → SELECT * FROM price_list WHERE is_active = TRUE
tarifeApi.getDefault()                      → SELECT * FROM price_list WHERE is_default = TRUE
tarifeApi.getWithItems(id)                  → JOIN price_list + price_list_item + service_card
tarifeApi.create(data)                      → INSERT INTO price_list
tarifeApi.update(id, data)                  → UPDATE price_list WHERE id = ?

tarifeItemApi.getByPriceList(id)            → SELECT * FROM price_list_item WHERE price_list_id = ?
tarifeItemApi.getByServiceCard(id)          → SELECT * FROM price_list_item WHERE service_card_id = ?
tarifeItemApi.createItem(data)              → INSERT INTO price_list_item
tarifeItemApi.updateItem(id, data)          → UPDATE price_list_item WHERE id = ?
```

### TypeScript Interface
```typescript
interface PriceList {
  id: number;
  code: string;
  name: string;
  valid_from: string;
  valid_to?: string;
  currency: string;
  is_active: boolean;
  is_default: boolean;
}

interface PriceListItem {
  id: number;
  price_list_id: number;
  service_card_id: number;
  currency: string;
  unit_price: number;
  is_active: boolean;
}
```

---

## 4️⃣ MOTORBOT YÖNETİMİ

### SQL Tabloları
- `motorbot` - Motorbot master data

### API Endpoints
```typescript
// /lib/api/motorbot.ts
motorbotApi.getAll(params)       → SELECT * FROM motorbot
motorbotApi.getById(id)          → SELECT * FROM motorbot WHERE id = ?
motorbotApi.getByCode(code)      → SELECT * FROM motorbot WHERE code = ?
motorbotApi.getWithContract(id)  → JOIN motorbot + barinma_contract
motorbotApi.getByCari(cariId)    → SELECT * FROM motorbot WHERE owner = ? (via contract)
motorbotApi.create(data)         → INSERT INTO motorbot
motorbotApi.update(id, data)     → UPDATE motorbot WHERE id = ?
motorbotApi.delete(id)           → DELETE FROM motorbot WHERE id = ?
```

### TypeScript Interface
```typescript
interface Motorbot {
  id: number;
  code: string;
  name: string;
  owner?: string;
  length_meters?: number;
  beam_meters?: number;
  draft_meters?: number;
  flag?: string;
  registration_number?: string;
  year_built?: number;
  is_active: boolean;
}
```

---

## 5️⃣ BARINMA SÖZLEŞMELERİ

### SQL Tabloları
- `barinma_contract` - Barınma sözleşmeleri
- `stg_barinma_contract` - Staging view (enriched data)

### API Endpoints
```typescript
// /lib/api/motorbot.ts (barinmaApi)
barinmaApi.getAllContracts(params)     → SELECT * FROM barinma_contract
barinmaApi.getContractById(id)         → SELECT * FROM barinma_contract WHERE id = ?
barinmaApi.getActiveContract(mbId)     → SELECT * FROM barinma_contract WHERE motorbot_id = ? AND is_active = TRUE
barinmaApi.createContract(data)        → INSERT INTO barinma_contract
barinmaApi.updateContract(id, data)    → UPDATE barinma_contract WHERE id = ?
barinmaApi.deleteContract(id)          → DELETE FROM barinma_contract WHERE id = ?
```

### TypeScript Interface
```typescript
interface BarinmaContract {
  id: number;
  contract_number: string;
  motorbot_id: number;
  cari_id: number;
  service_card_id: number;
  price_list_id: number;
  start_date: string;
  end_date?: string;
  unit_price: number;
  currency: string;
  vat_rate: number;
  billing_period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  is_active: boolean;
}
```

---

## 6️⃣ MOTORBOT SEFER YÖNETİMİ

### SQL Tabloları
- `mb_trip` - Motorbot sefer kayıtları (çıkış/dönüş)

### API Endpoints
```typescript
// /lib/api/sefer.ts
seferApi.getAll(params)                → SELECT * FROM mb_trip
seferApi.getById(id)                   → SELECT * FROM mb_trip WHERE id = ?
seferApi.getWithDetails(id)            → JOIN mb_trip + motorbot + cari
seferApi.getByMotorbot(motorbotId)     → SELECT * FROM mb_trip WHERE motorbot_id = ?
seferApi.getActiveDepartures()         → SELECT * FROM mb_trip WHERE status = 'DEPARTED'
seferApi.getUninvoiced(params)         → SELECT * FROM mb_trip WHERE is_invoiced = FALSE AND status = 'RETURNED'
seferApi.getByPeriod(period)           → SELECT * FROM mb_trip WHERE invoice_period = ?
seferApi.createDeparture(data)         ��� INSERT INTO mb_trip (status = 'DEPARTED')
seferApi.recordReturn(id, data)        → UPDATE mb_trip SET status = 'RETURNED', return_* = ?
seferApi.markAsInvoiced(ids, invId)    → UPDATE mb_trip SET is_invoiced = TRUE, invoice_id = ?
seferApi.getStats(params)              → Aggregate queries on mb_trip
seferApi.getInvoicingGroups(params)    → GROUP BY cari_code, invoice_period
```

### TypeScript Interface
```typescript
interface MbTrip {
  id: number;
  motorbot_id: number;
  motorbot_code: string;
  motorbot_name: string;
  motorbot_owner?: string;
  cari_code?: string;
  departure_date: string;
  departure_time: string;
  departure_note?: string;
  return_date?: string;
  return_time?: string;
  return_note?: string;
  duration_minutes?: number;
  status: 'DEPARTED' | 'RETURNED';
  unit_price: number;
  currency: string;
  vat_rate: number;
  vat_amount: number;
  total_price: number;
  is_invoiced: boolean;
  invoice_id?: number;
  invoice_date?: string;
  invoice_period?: string;
}
```

---

## 7️⃣ FATURA YÖNETİMİ

### SQL Tabloları
- `invoice` - Fatura başlıkları
- `invoice_item` - Fatura kalemleri

### API Endpoints
```typescript
// /lib/api/invoice.ts
invoiceApi.getAll(params)           → SELECT * FROM invoice
invoiceApi.getById(id)              → SELECT * FROM invoice WHERE id = ?
invoiceApi.getByNumber(number)      → SELECT * FROM invoice WHERE invoice_number = ?
invoiceApi.getWithItems(id)         → JOIN invoice + invoice_item + service_card
invoiceApi.getByCari(cariId)        → SELECT * FROM invoice WHERE cari_id = ?
invoiceApi.create(data)             → INSERT INTO invoice
invoiceApi.update(id, data)         → UPDATE invoice WHERE id = ?
invoiceApi.updateStatus(id, status) → UPDATE invoice SET status = ?

invoiceApi.getItems(invoiceId)      → SELECT * FROM invoice_item WHERE invoice_id = ?
invoiceApi.createItem(data)         → INSERT INTO invoice_item
invoiceApi.updateItem(id, data)     → UPDATE invoice_item WHERE id = ?
invoiceApi.createBulkItems(data)    → INSERT INTO invoice_item (multiple rows)
```

### TypeScript Interface
```typescript
interface Invoice {
  id: number;
  invoice_number: string;
  invoice_type: 'SALES' | 'PURCHASE';
  invoice_date: string;
  cari_id: number;
  currency: string;
  subtotal: number;
  vat_total: number;
  total: number;
  status: 'DRAFT' | 'APPROVED' | 'SENT' | 'PAID' | 'CANCELLED';
  e_invoice_uuid?: string;
  e_invoice_status?: string;
  e_invoice_sent_at?: string;
}

interface InvoiceItem {
  id: number;
  invoice_id: number;
  service_card_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  currency: string;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  source_type?: string;
  source_id?: number;
}
```

---

## 8️⃣ SİSTEM PARAMETRELERİ

### SQL Tabloları
- `system_parameter` - Sistem parametreleri ve ayarlar

### API Endpoints
```typescript
// /lib/api/parametre.ts
parametreApi.getAll(params)              → SELECT * FROM system_parameter
parametreApi.getById(id)                 → SELECT * FROM system_parameter WHERE id = ?
parametreApi.getByKey(category, key)     → SELECT * FROM system_parameter WHERE category = ? AND key = ?
parametreApi.getByCategory(category)     → SELECT * FROM system_parameter WHERE category = ?
parametreApi.create(data)                → INSERT INTO system_parameter
parametreApi.update(id, data)            → UPDATE system_parameter WHERE id = ?
parametreApi.updateValue(cat, key, val)  → UPDATE system_parameter SET value = ? WHERE category = ? AND key = ?
parametreApi.delete(id)                  → DELETE FROM system_parameter WHERE id = ?
```

### TypeScript Interface
```typescript
interface SystemParameter {
  id: number;
  category: string;
  key: string;
  value: string;
  data_type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  description?: string;
  is_active: boolean;
}
```

### Parametre Kategorileri
- **SYSTEM**: Şirket bilgileri (COMPANY_NAME, TAX_NUMBER, ADDRESS, ...)
- **INVOICE**: Fatura ayarları (DEFAULT_VAT_RATE, DEFAULT_CURRENCY, ...)
- **TRIP**: Sefer ayarları (DEFAULT_UNIT_PRICE, BILLING_DAYS, ...)
- **CONTRACT**: Sözleşme ayarları (AUTO_RENEW, DEFAULT_BILLING_PERIOD, ...)
- **E_INVOICE**: E-Fatura ayarları (ENABLED, TEST_MODE, PROVIDER, ...)

---

## 9️⃣ DÖVİZ KURLARI

### SQL Tabloları
- `exchange_rate` - Döviz kurları

### API Endpoints
```typescript
// /lib/api/kurlar.ts
kurlarApi.getAll(params)                        → SELECT * FROM exchange_rate
kurlarApi.getById(id)                           → SELECT * FROM exchange_rate WHERE id = ?
kurlarApi.getByDate(from, to, date)             → SELECT * FROM exchange_rate WHERE currency_from = ? AND currency_to = ? AND rate_date = ?
kurlarApi.getLatest(from, to)                   → SELECT * FROM exchange_rate WHERE ... ORDER BY rate_date DESC LIMIT 1
kurlarApi.getToday()                            → SELECT * FROM exchange_rate WHERE rate_date = CURRENT_DATE
kurlarApi.getByDateAll(date)                    → SELECT * FROM exchange_rate WHERE rate_date = ?
kurlarApi.create(data)                          → INSERT INTO exchange_rate
kurlarApi.createBulk(rates)                     → INSERT INTO exchange_rate (multiple rows)
kurlarApi.fetchFromTCMB(date)                   → External API call + INSERT INTO exchange_rate
kurlarApi.convert(amount, from, to, date)       → SELECT rate + calculate conversion
```

### TypeScript Interface
```typescript
interface ExchangeRate {
  id: number;
  currency_from: string;
  currency_to: string;
  rate: number;
  rate_date: string;
  source?: string;
  created_at: string;
}
```

---

## 📊 VERİ AKIŞI DİYAGRAMLARI

### Sefer Faturalandırma Süreci
```
1. mb_trip (çıkış kaydı)
   ↓ status = 'DEPARTED'
   
2. mb_trip (dönüş kaydı)
   ↓ status = 'RETURNED', duration_minutes hesaplanır
   
3. mb_trip (faturalandırma kontrolü)
   ↓ invoice_period belirlenir (7, 14, 21, 28, 30)
   ↓ is_invoiced = FALSE olan kayıtlar toplanır
   
4. invoice (fatura oluşturma)
   ↓ INSERT INTO invoice
   ↓ invoice_id alınır
   
5. invoice_item (kalemler ekleme)
   ↓ INSERT INTO invoice_item
   ↓ mb_trip kayıtları source_type='MB_TRIP', source_id=trip.id
   
6. mb_trip (faturalandı işaretleme)
   ↓ UPDATE mb_trip SET is_invoiced = TRUE, invoice_id = ?, invoice_date = ?
```

### Barınma Sözleşme Süreci
```
1. motorbot (motorbot kaydı)
   ↓ INSERT INTO motorbot
   
2. tmm_cari (cari kaydı)
   ↓ INSERT INTO tmm_cari
   
3. service_card (hizmet tanımı)
   ↓ MB-BARINMA-001
   
4. price_list + price_list_item (tarife)
   ↓ Aylık fiyat belirlenir
   
5. barinma_contract (sözleşme)
   ↓ INSERT INTO barinma_contract
   ↓ motorbot_id, cari_id, service_card_id, price_list_id bağlanır
   
6. invoice (aylık faturalandırma - CRON job)
   ↓ Her ay otomatik fatura kesilir
   ↓ barinma_contract bilgileri kullanılır
```

---

## 🔐 GÜVENLİK & PERFORMANS

### İndeksler
Her tablo için kritik alanlarda index'ler tanımlı:
- Primary Keys (id)
- Unique Constraints (code, invoice_number, contract_number)
- Foreign Keys (cari_id, motorbot_id, service_card_id, ...)
- Frequently Queried Fields (is_active, status, rate_date, ...)

### Cascade Rules
- `ON DELETE CASCADE`: cari_hesap_hareket, invoice_item, price_list_item
- `ON DELETE RESTRICT`: barinma_contract, mb_trip (veri kaybını önler)

### Transaction Yönetimi
Kritik işlemler için transaction kullanılmalı:
- Fatura oluşturma (invoice + invoice_item + mb_trip update)
- Sözleşme oluşturma (barinma_contract + ilişkili güncellemeler)
- Toplu faturalandırma (multiple invoices + items + trip updates)

---

## 📝 NOTLAR

1. **Snake_case vs CamelCase**:
   - SQL: snake_case (PostgreSQL convention)
   - TypeScript: camelCase (JavaScript convention)
   - API request/response JSON: camelCase

2. **Tarih Formatları**:
   - SQL DATE: 'YYYY-MM-DD'
   - SQL TIMESTAMP: 'YYYY-MM-DD HH:mm:ss' veya ISO 8601
   - Frontend: ISO 8601 string kullan

3. **Para Birimleri**:
   - SQL: NUMERIC(15, 2) - 2 ondalık basamak
   - TypeScript: number
   - Frontend display: Intl.NumberFormat kullan

4. **Soft Delete**:
   - Şu an hard delete kullanılıyor
   - Gelecekte is_deleted flag eklenebilir

5. **Audit Trail**:
   - created_at, created_by, updated_at, updated_by alanları mevcut
   - Kullanıcı kimliği users tablosundan gelecek

---

## 🚀 DEPLOYMENT ADIMLAR I

1. **Database Setup**:
   ```bash
   psql -U postgres -d aliaport < /database/schema.sql
   ```

2. **Environment Variables**:
   ```
   DATABASE_URL=postgresql://user:pass@localhost:5432/aliaport
   API_BASE_URL=http://localhost:8000/api/v1
   ```

3. **API Backend Deploy**:
   - FastAPI backend başlatılmalı
   - Migration'lar çalıştırılmalı
   - Seed data yüklensin (opsiyonel)

4. **Frontend Deploy**:
   - API endpoints .env dosyasında configure edilmeli
   - Mock data production'da devre dışı bırakılmalı

---

**Son Güncelleme**: 2025-11-19  
**Versiyon**: 1.0  
**Hazırlayan**: Aliaport Development Team
