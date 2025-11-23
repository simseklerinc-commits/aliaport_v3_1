# Aliaport Liman Yönetim Sistemi - Database Dokümantasyonu

## 📂 Dosya Yapısı

```
/database/
├── schema.sql              # PostgreSQL tablo tanımları (CREATE TABLE)
├── API_SQL_MAPPING.md      # API endpoints ↔ SQL tabloları eşleştirme
└── README.md               # Bu dosya
```

## 🗄️ Veritabanı Mimarisi

### Genel Bakış
Aliaport Liman Yönetim Sistemi **9 ana modül** üzerine kurulmuştur:

| # | Modül | SQL Tabloları | API Dosyası | TypeScript Interface |
|---|-------|---------------|-------------|---------------------|
| 1 | Cari Yönetimi | `tmm_cari`, `cari_hesap_hareket` | `/lib/api/cari.ts` | `Cari`, `CariHesapHareket` |
| 2 | Hizmet Kartları | `service_card` | `/lib/api/hizmet.ts` | `ServiceCard` |
| 3 | Tarife Yönetimi | `price_list`, `price_list_item` | `/lib/api/tarife.ts` | `PriceList`, `PriceListItem` |
| 4 | Motorbot Yönetimi | `motorbot` | `/lib/api/motorbot.ts` | `Motorbot` |
| 5 | Barınma Sözleşmeleri | `barinma_contract`, `stg_barinma_contract` | `/lib/api/motorbot.ts` | `BarinmaContract` |
| 6 | Sefer Yönetimi | `mb_trip` | `/lib/api/sefer.ts` | `MbTrip` |
| 7 | Fatura Yönetimi | `invoice`, `invoice_item` | `/lib/api/invoice.ts` | `Invoice`, `InvoiceItem` |
| 8 | Sistem Parametreleri | `system_parameter` | `/lib/api/parametre.ts` | `SystemParameter` |
| 9 | Döviz Kurları | `exchange_rate` | `/lib/api/kurlar.ts` | `ExchangeRate` |

### Destekleyici Tablolar
- `users` - Kullanıcı yönetimi
- `v_cari_summary` - Cari özet view
- `v_motorbot_trip_summary` - Motorbot sefer özet view

## 🔧 Kurulum

### 1. PostgreSQL Kurulumu

```bash
# PostgreSQL yükleyin (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# PostgreSQL servisini başlatın
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Database Oluşturma

```bash
# PostgreSQL'e bağlanın
sudo -u postgres psql

# Database oluşturun
CREATE DATABASE aliaport;
CREATE USER aliaport_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE aliaport TO aliaport_user;
\q
```

### 3. Schema Yükleme

```bash
# Schema dosyasını çalıştırın
psql -U aliaport_user -d aliaport -f schema.sql

# Veya PostgreSQL içinden:
# \i /path/to/schema.sql
```

### 4. Doğrulama

```sql
-- Tabloları listeleyin
\dt

-- Tablo yapısını görüntüleyin
\d tmm_cari

-- Seed data kontrolü
SELECT * FROM service_card;
SELECT * FROM system_parameter;
```

## 📊 Veritabanı İlişkileri

### Ana İlişkiler

```
tmm_cari (1) ──┬──< (N) cari_hesap_hareket
                ├──< (N) barinma_contract
                └──< (N) invoice

motorbot (1) ──┬──< (N) barinma_contract
               └──< (N) mb_trip

service_card (1) ──┬──< (N) price_list_item
                   ├──< (N) invoice_item
                   └──< (N) barinma_contract

price_list (1) ──┬──< (N) price_list_item
                 └──< (N) barinma_contract

invoice (1) ────< (N) invoice_item
            └─── (0..N) mb_trip (via invoice_id)
```

### Foreign Key Cascade Rules

**ON DELETE CASCADE** (Alt kayıtlar otomatik silinir):
- `cari_hesap_hareket` → `tmm_cari`
- `invoice_item` → `invoice`
- `price_list_item` → `price_list`

**ON DELETE RESTRICT** (Alt kayıt varsa üst kayıt silinemez):
- `barinma_contract` → `motorbot`, `tmm_cari`, `service_card`, `price_list`
- `mb_trip` → `motorbot`
- `invoice` → `tmm_cari`

## 🔑 Önemli Alanlar

### Unique Constraints
- `tmm_cari.code` - Cari kodu benzersiz
- `motorbot.code` - Motorbot kodu benzersiz
- `service_card.code` - Hizmet kodu benzersiz
- `price_list.code` - Tarife kodu benzersiz
- `invoice.invoice_number` - Fatura numarası benzersiz
- `barinma_contract.contract_number` - Sözleşme numarası benzersiz
- `system_parameter.(category, key)` - Parametre kategori+key benzersiz
- `exchange_rate.(currency_from, currency_to, rate_date)` - Kur benzersiz

### Enum Fields
- `tmm_cari.type`: 'CUSTOMER', 'SUPPLIER', 'BOTH'
- `mb_trip.status`: 'DEPARTED', 'RETURNED'
- `invoice.invoice_type`: 'SALES', 'PURCHASE'
- `invoice.status`: 'DRAFT', 'APPROVED', 'SENT', 'PAID', 'CANCELLED'
- `barinma_contract.billing_period`: 'MONTHLY', 'QUARTERLY', 'YEARLY'
- `system_parameter.data_type`: 'STRING', 'NUMBER', 'BOOLEAN', 'JSON'

## 💾 Seed Data

Schema dosyası aşağıdaki başlangıç verilerini içerir:

### Sistem Parametreleri (8 adet)
- Şirket bilgileri (COMPANY_NAME, TAX_NUMBER, ADDRESS)
- Fatura varsayılanları (DEFAULT_VAT_RATE, DEFAULT_CURRENCY)
- Sefer ayarları (DEFAULT_UNIT_PRICE, BILLING_DAYS)
- Sözleşme ayarları (AUTO_RENEW)

### Hizmet Kartları (4 adet)
- MB-SEFER-001: Motorbot Sefer Hizmeti
- MB-BARINMA-001: Motorbot Barınma Hizmeti
- MB-ELEKTRIK-001: Elektrik Hizmeti
- MB-SU-001: Su Hizmeti

### Tarife (1 adet)
- TARIFE-2025-STANDART: 2025 yılı standart fiyat listesi
  - MB-SEFER-001: $10.00
  - MB-BARINMA-001: ₺15,000.00
  - MB-ELEKTRIK-001: ₺5.00/kWh
  - MB-SU-001: ₺20.00/m³

## 📈 Views (Görünümler)

### v_cari_summary
Cari hesap özet bilgileri:
- Toplam fatura sayısı
- Toplam satış/alış tutarları
- Son fatura tarihi

### v_motorbot_trip_summary
Motorbot sefer özeti:
- Toplam sefer sayısı
- Aktif seferler
- Tamamlanan seferler
- Toplam gelir
- Son sefer tarihi

## 🔍 Örnek Sorgular

### 1. Faturalanmamış Seferler
```sql
SELECT 
    t.id,
    t.motorbot_code,
    t.motorbot_name,
    t.cari_code,
    t.departure_date,
    t.total_price
FROM mb_trip t
WHERE t.status = 'RETURNED'
  AND t.is_invoiced = FALSE
ORDER BY t.departure_date;
```

### 2. Aktif Sözleşmeler
```sql
SELECT 
    bc.contract_number,
    m.code AS motorbot_code,
    m.name AS motorbot_name,
    c.code AS cari_code,
    c.title AS cari_title,
    bc.unit_price,
    bc.currency,
    bc.billing_period
FROM barinma_contract bc
JOIN motorbot m ON bc.motorbot_id = m.id
JOIN tmm_cari c ON bc.cari_id = c.id
WHERE bc.is_active = TRUE
  AND (bc.end_date IS NULL OR bc.end_date > CURRENT_DATE);
```

### 3. Aylık Fatura Özeti
```sql
SELECT 
    DATE_TRUNC('month', i.invoice_date) AS month,
    COUNT(*) AS invoice_count,
    SUM(i.subtotal) AS subtotal,
    SUM(i.vat_total) AS vat_total,
    SUM(i.total) AS total
FROM invoice i
WHERE i.invoice_type = 'SALES'
  AND i.status IN ('APPROVED', 'SENT', 'PAID')
GROUP BY DATE_TRUNC('month', i.invoice_date)
ORDER BY month DESC;
```

### 4. Cari Bakiyesi
```sql
SELECT 
    c.code,
    c.title,
    SUM(CASE 
        WHEN h.transaction_type = 'DEBIT' THEN h.amount 
        ELSE -h.amount 
    END) AS balance
FROM tmm_cari c
LEFT JOIN cari_hesap_hareket h ON c.id = h.cari_id
WHERE c.id = 1
GROUP BY c.id, c.code, c.title;
```

## 🛠️ Bakım İşlemleri

### Vacuum & Analyze
```sql
-- Tüm tabloları optimize et
VACUUM ANALYZE;

-- Belirli bir tablo
VACUUM ANALYZE tmm_cari;
```

### Index Yeniden Oluşturma
```sql
-- Tüm indexleri yeniden oluştur
REINDEX DATABASE aliaport;

-- Belirli bir tablo
REINDEX TABLE mb_trip;
```

### Yedekleme
```bash
# Tam yedek
pg_dump -U aliaport_user -d aliaport -f aliaport_backup_$(date +%Y%m%d).sql

# Sadece şema
pg_dump -U aliaport_user -d aliaport --schema-only -f aliaport_schema.sql

# Sadece veri
pg_dump -U aliaport_user -d aliaport --data-only -f aliaport_data.sql
```

### Geri Yükleme
```bash
# SQL dosyasından geri yükle
psql -U aliaport_user -d aliaport -f aliaport_backup.sql
```

## 📊 Performans İzleme

### Yavaş Sorguları Bulma
```sql
-- pg_stat_statements extension gerekli
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_time DESC
LIMIT 10;
```

### Tablo Boyutları
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Index Kullanımı
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## 🔐 Güvenlik

### Kullanıcı Yetkilendirmesi
```sql
-- Read-only kullanıcı
CREATE USER aliaport_readonly WITH PASSWORD 'readonly_pass';
GRANT CONNECT ON DATABASE aliaport TO aliaport_readonly;
GRANT USAGE ON SCHEMA public TO aliaport_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO aliaport_readonly;

-- Application kullanıcı (read/write)
CREATE USER aliaport_app WITH PASSWORD 'app_pass';
GRANT CONNECT ON DATABASE aliaport TO aliaport_app;
GRANT USAGE ON SCHEMA public TO aliaport_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO aliaport_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO aliaport_app;
```

### Row Level Security (RLS)
```sql
-- Örnek: Kullanıcı sadece kendi kayıtlarını görebilir
ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoice_isolation_policy ON invoice
    USING (created_by = current_user_id());
```

## 📞 Destek

Sorun veya soru için:
- **Email**: dev@aliaport.com
- **Docs**: `/database/API_SQL_MAPPING.md`
- **Schema**: `/database/schema.sql`

---

**Versiyon**: 1.0  
**Son Güncelleme**: 2025-11-19  
**PostgreSQL Versiyon**: 14+
