-- ALIAPORT LİMAN YÖNETİM SİSTEMİ - PostgreSQL Database Schema
-- 9 ana modül için tablo yapıları
-- Created: 2025-11-19
-- Version: 1.0

-- ============================================
-- 1. CARİ YÖNETİMİ (tmm_cari + cari_hesap_hareket)
-- ============================================

CREATE TABLE IF NOT EXISTS tmm_cari (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('CUSTOMER', 'SUPPLIER', 'BOTH')),
    tax_office VARCHAR(100),
    tax_number VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Türkiye',
    phone VARCHAR(30),
    email VARCHAR(100),
    contact_person VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP,
    updated_by INTEGER
);

CREATE INDEX idx_cari_code ON tmm_cari(code);
CREATE INDEX idx_cari_type ON tmm_cari(type);
CREATE INDEX idx_cari_is_active ON tmm_cari(is_active);

CREATE TABLE IF NOT EXISTS cari_hesap_hareket (
    id SERIAL PRIMARY KEY,
    cari_id INTEGER NOT NULL REFERENCES tmm_cari(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('DEBIT', 'CREDIT')),
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    description TEXT,
    document_type VARCHAR(50),
    document_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
);

CREATE INDEX idx_cari_hareket_cari_id ON cari_hesap_hareket(cari_id);
CREATE INDEX idx_cari_hareket_date ON cari_hesap_hareket(transaction_date);

-- ============================================
-- 2. HİZMET KARTLARI (service_card)
-- ============================================

CREATE TABLE IF NOT EXISTS service_card (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP,
    updated_by INTEGER
);

CREATE INDEX idx_service_card_code ON service_card(code);
CREATE INDEX idx_service_card_category ON service_card(category);
CREATE INDEX idx_service_card_is_active ON service_card(is_active);

-- ============================================
-- 3. TARİFE YÖNETİMİ (price_list + price_list_item)
-- ============================================

CREATE TABLE IF NOT EXISTS price_list (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    valid_from DATE NOT NULL,
    valid_to DATE,
    currency VARCHAR(3) DEFAULT 'TRY',
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP,
    updated_by INTEGER
);

CREATE INDEX idx_price_list_code ON price_list(code);
CREATE INDEX idx_price_list_valid_from ON price_list(valid_from);
CREATE INDEX idx_price_list_is_active ON price_list(is_active);

CREATE TABLE IF NOT EXISTS price_list_item (
    id SERIAL PRIMARY KEY,
    price_list_id INTEGER NOT NULL REFERENCES price_list(id) ON DELETE CASCADE,
    service_card_id INTEGER NOT NULL REFERENCES service_card(id) ON DELETE RESTRICT,
    currency VARCHAR(3) DEFAULT 'TRY',
    unit_price NUMERIC(15, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP,
    updated_by INTEGER,
    UNIQUE(price_list_id, service_card_id)
);

CREATE INDEX idx_price_list_item_price_list_id ON price_list_item(price_list_id);
CREATE INDEX idx_price_list_item_service_card_id ON price_list_item(service_card_id);

-- ============================================
-- 4. MOTORBOT YÖNETİMİ (motorbot)
-- ============================================

CREATE TABLE IF NOT EXISTS motorbot (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(255),
    length_meters NUMERIC(10, 2),
    beam_meters NUMERIC(10, 2),
    draft_meters NUMERIC(10, 2),
    flag VARCHAR(10),
    registration_number VARCHAR(50),
    year_built INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP,
    updated_by INTEGER
);

CREATE INDEX idx_motorbot_code ON motorbot(code);
CREATE INDEX idx_motorbot_is_active ON motorbot(is_active);

-- ============================================
-- 5. BARINMA SÖZLEŞMELERİ (barinma_contract)
-- ============================================

CREATE TABLE IF NOT EXISTS barinma_contract (
    id SERIAL PRIMARY KEY,
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    motorbot_id INTEGER NOT NULL REFERENCES motorbot(id) ON DELETE RESTRICT,
    cari_id INTEGER NOT NULL REFERENCES tmm_cari(id) ON DELETE RESTRICT,
    service_card_id INTEGER NOT NULL REFERENCES service_card(id) ON DELETE RESTRICT,
    price_list_id INTEGER NOT NULL REFERENCES price_list(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE,
    unit_price NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    vat_rate NUMERIC(5, 2) DEFAULT 20.00,
    billing_period VARCHAR(20) DEFAULT 'MONTHLY' CHECK (billing_period IN ('MONTHLY', 'QUARTERLY', 'YEARLY')),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP,
    updated_by INTEGER
);

CREATE INDEX idx_barinma_contract_motorbot_id ON barinma_contract(motorbot_id);
CREATE INDEX idx_barinma_contract_cari_id ON barinma_contract(cari_id);
CREATE INDEX idx_barinma_contract_is_active ON barinma_contract(is_active);

-- Staging table for enriched contract view
CREATE TABLE IF NOT EXISTS stg_barinma_contract (
    id SERIAL PRIMARY KEY,
    contract_number VARCHAR(50),
    motorbot_code VARCHAR(50),
    motorbot_name VARCHAR(255),
    motorbot_owner VARCHAR(255),
    cari_code VARCHAR(50),
    cari_title VARCHAR(255),
    service_code VARCHAR(50),
    service_name VARCHAR(255),
    price_list_code VARCHAR(50),
    price_list_name VARCHAR(255),
    start_date DATE,
    end_date DATE,
    unit_price NUMERIC(15, 2),
    currency VARCHAR(3),
    vat_rate NUMERIC(5, 2),
    billing_period VARCHAR(20),
    is_active BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. MOTORBOT SEFER YÖNETİMİ (mb_trip)
-- ============================================

CREATE TABLE IF NOT EXISTS mb_trip (
    id SERIAL PRIMARY KEY,
    motorbot_id INTEGER NOT NULL REFERENCES motorbot(id) ON DELETE RESTRICT,
    motorbot_code VARCHAR(50) NOT NULL,
    motorbot_name VARCHAR(255) NOT NULL,
    motorbot_owner VARCHAR(255),
    cari_code VARCHAR(50),
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    departure_note TEXT,
    return_date DATE,
    return_time TIME,
    return_note TEXT,
    duration_minutes INTEGER,
    status VARCHAR(20) NOT NULL CHECK (status IN ('DEPARTED', 'RETURNED')),
    unit_price NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    vat_rate NUMERIC(5, 2) DEFAULT 18.00,
    vat_amount NUMERIC(15, 2),
    total_price NUMERIC(15, 2),
    is_invoiced BOOLEAN DEFAULT FALSE,
    invoice_id INTEGER,
    invoice_date DATE,
    invoice_period VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP,
    updated_by INTEGER
);

CREATE INDEX idx_mb_trip_motorbot_id ON mb_trip(motorbot_id);
CREATE INDEX idx_mb_trip_departure_date ON mb_trip(departure_date);
CREATE INDEX idx_mb_trip_status ON mb_trip(status);
CREATE INDEX idx_mb_trip_is_invoiced ON mb_trip(is_invoiced);

-- ============================================
-- 7. FATURA YÖNETİMİ (invoice + invoice_item)
-- ============================================

CREATE TABLE IF NOT EXISTS invoice (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN ('SALES', 'PURCHASE')),
    invoice_date DATE NOT NULL,
    cari_id INTEGER NOT NULL REFERENCES tmm_cari(id) ON DELETE RESTRICT,
    currency VARCHAR(3) DEFAULT 'TRY',
    subtotal NUMERIC(15, 2) NOT NULL,
    vat_total NUMERIC(15, 2) NOT NULL,
    total NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'SENT', 'PAID', 'CANCELLED')),
    e_invoice_uuid VARCHAR(100),
    e_invoice_status VARCHAR(50),
    e_invoice_sent_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP,
    updated_by INTEGER
);

CREATE INDEX idx_invoice_number ON invoice(invoice_number);
CREATE INDEX idx_invoice_cari_id ON invoice(cari_id);
CREATE INDEX idx_invoice_date ON invoice(invoice_date);
CREATE INDEX idx_invoice_status ON invoice(status);

CREATE TABLE IF NOT EXISTS invoice_item (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
    service_card_id INTEGER REFERENCES service_card(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    quantity NUMERIC(15, 3) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    vat_rate NUMERIC(5, 2) DEFAULT 20.00,
    vat_amount NUMERIC(15, 2),
    total_amount NUMERIC(15, 2),
    source_type VARCHAR(50),
    source_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_item_invoice_id ON invoice_item(invoice_id);
CREATE INDEX idx_invoice_item_service_card_id ON invoice_item(service_card_id);

-- ============================================
-- 8. SİSTEM PARAMETRELERİ (system_parameter)
-- ============================================

CREATE TABLE IF NOT EXISTS system_parameter (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    data_type VARCHAR(20) DEFAULT 'STRING' CHECK (data_type IN ('STRING', 'NUMBER', 'BOOLEAN', 'JSON')),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(category, key)
);

CREATE INDEX idx_system_parameter_category ON system_parameter(category);
CREATE INDEX idx_system_parameter_key ON system_parameter(key);

-- ============================================
-- 9. DÖVİZ KURLARI (exchange_rate)
-- ============================================

CREATE TABLE IF NOT EXISTS exchange_rate (
    id SERIAL PRIMARY KEY,
    currency_from VARCHAR(3) NOT NULL,
    currency_to VARCHAR(3) NOT NULL,
    rate NUMERIC(18, 6) NOT NULL,
    rate_date DATE NOT NULL,
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(currency_from, currency_to, rate_date)
);

CREATE INDEX idx_exchange_rate_date ON exchange_rate(rate_date);
CREATE INDEX idx_exchange_rate_from_to ON exchange_rate(currency_from, currency_to);

-- ============================================
-- KULLANICILAR (users)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- VIEWS (Raporlama için)
-- ============================================

-- Cari özet view
CREATE OR REPLACE VIEW v_cari_summary AS
SELECT 
    c.id,
    c.code,
    c.title,
    c.type,
    COUNT(DISTINCT i.id) as total_invoices,
    SUM(CASE WHEN i.invoice_type = 'SALES' THEN i.total ELSE 0 END) as total_sales,
    SUM(CASE WHEN i.invoice_type = 'PURCHASE' THEN i.total ELSE 0 END) as total_purchases,
    MAX(i.invoice_date) as last_invoice_date
FROM tmm_cari c
LEFT JOIN invoice i ON c.id = i.cari_id
GROUP BY c.id, c.code, c.title, c.type;

-- Motorbot sefer özeti
CREATE OR REPLACE VIEW v_motorbot_trip_summary AS
SELECT 
    m.id,
    m.code,
    m.name,
    COUNT(t.id) as total_trips,
    COUNT(CASE WHEN t.status = 'DEPARTED' THEN 1 END) as active_trips,
    COUNT(CASE WHEN t.status = 'RETURNED' THEN 1 END) as completed_trips,
    SUM(CASE WHEN t.status = 'RETURNED' THEN t.total_price ELSE 0 END) as total_revenue,
    MAX(t.departure_date) as last_trip_date
FROM motorbot m
LEFT JOIN mb_trip t ON m.id = t.motorbot_id
GROUP BY m.id, m.code, m.name;

-- ============================================
-- SEED DATA (İlk kurulum için örnek veriler)
-- ============================================

-- Default system parameters
INSERT INTO system_parameter (category, key, value, data_type, description) VALUES
('SYSTEM', 'COMPANY_NAME', 'Aliaport Liman İşletmeleri A.Ş.', 'STRING', 'Şirket adı'),
('SYSTEM', 'TAX_NUMBER', '1234567890', 'STRING', 'Vergi numarası'),
('SYSTEM', 'ADDRESS', 'Marina Blv. No:1, 35940 Çeşme/İzmir', 'STRING', 'Şirket adresi'),
('INVOICE', 'DEFAULT_VAT_RATE', '20', 'NUMBER', 'Varsayılan KDV oranı (%)'),
('INVOICE', 'DEFAULT_CURRENCY', 'TRY', 'STRING', 'Varsayılan para birimi'),
('TRIP', 'DEFAULT_UNIT_PRICE', '10', 'NUMBER', 'Sefer varsayılan birim fiyat (USD)'),
('TRIP', 'BILLING_DAYS', '7,14,21,28,30', 'STRING', 'Faturalama günleri (virgülle ayrılmış)'),
('CONTRACT', 'AUTO_RENEW', 'true', 'BOOLEAN', 'Sözleşme otomatik yenileme')
ON CONFLICT (category, key) DO NOTHING;

-- Default service cards
INSERT INTO service_card (code, name, description, category, unit) VALUES
('MB-SEFER-001', 'Motorbot Sefer Hizmeti', 'Günlük sefer hizmeti - denize çıkış', 'SEFER', 'Adet'),
('MB-BARINMA-001', 'Motorbot Barınma Hizmeti', 'Aylık barınma hizmeti', 'BARINMA', 'Ay'),
('MB-ELEKTRIK-001', 'Elektrik Hizmeti', 'Aylık elektrik tüketimi', 'HİZMET', 'kWh'),
('MB-SU-001', 'Su Hizmeti', 'Aylık su tüketimi', 'HİZMET', 'm³')
ON CONFLICT (code) DO NOTHING;

-- Default price list
INSERT INTO price_list (code, name, description, valid_from, currency, is_active, is_default) VALUES
('TARIFE-2025-STANDART', '2025 Standart Tarife', '2025 yılı standart fiyat listesi', '2025-01-01', 'TRY', TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Price list items
INSERT INTO price_list_item (price_list_id, service_card_id, unit_price, currency)
SELECT 
    (SELECT id FROM price_list WHERE code = 'TARIFE-2025-STANDART'),
    sc.id,
    CASE 
        WHEN sc.code = 'MB-SEFER-001' THEN 10.00
        WHEN sc.code = 'MB-BARINMA-001' THEN 15000.00
        WHEN sc.code = 'MB-ELEKTRIK-001' THEN 5.00
        WHEN sc.code = 'MB-SU-001' THEN 20.00
    END,
    CASE 
        WHEN sc.code = 'MB-SEFER-001' THEN 'USD'
        ELSE 'TRY'
    END
FROM service_card sc
WHERE sc.code IN ('MB-SEFER-001', 'MB-BARINMA-001', 'MB-ELEKTRIK-001', 'MB-SU-001')
ON CONFLICT (price_list_id, service_card_id) DO NOTHING;

-- ============================================
-- COMMENTS (Tablo açıklamaları)
-- ============================================

COMMENT ON TABLE tmm_cari IS 'Cari hesaplar - müşteri ve tedarikçi bilgileri';
COMMENT ON TABLE service_card IS 'Hizmet kartları - sunulan hizmet tanımları';
COMMENT ON TABLE price_list IS 'Fiyat listeleri - tarife başlıkları';
COMMENT ON TABLE price_list_item IS 'Fiyat listesi kalemleri - hizmet fiyatları';
COMMENT ON TABLE motorbot IS 'Motorbot/Tekne master data';
COMMENT ON TABLE barinma_contract IS 'Barınma sözleşmeleri';
COMMENT ON TABLE mb_trip IS 'Motorbot sefer kayıtları - çıkış/dönüş takibi';
COMMENT ON TABLE invoice IS 'Fatura başlıkları';
COMMENT ON TABLE invoice_item IS 'Fatura kalemleri';
COMMENT ON TABLE system_parameter IS 'Sistem parametreleri';
COMMENT ON TABLE exchange_rate IS 'Döviz kurları';

-- ============================================
-- END OF SCHEMA
-- ============================================
