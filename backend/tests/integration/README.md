# Integration Tests - Backend Lifecycle Scenarios

## 📋 Overview

Integration testleri, birden fazla modülün birlikte çalışmasını ve gerçek iş akışlarını test eder. Unit testlerden farklı olarak, tam API endpoint'leri üzerinden veritabanı işlemlerini ve modüller arası etkileşimleri doğrular.

## 🎯 Test Senaryoları

### 1. Cari → WorkOrder Lifecycle (`test_cari_workorder_lifecycle.py`)

**Senaryo**: Cari oluşturulması, iş emri atanması, ilişki kısıtları

**Test Akışı**:
1. Yeni cari oluştur (POST `/cari/`)
2. Cari için iş emri oluştur (POST `/isemri/workorders`)
3. İş emrine kalemler ekle (POST `/isemri/workorder-items`)
4. İş emrini onayla (PATCH `/isemri/workorders/{id}`)
5. Cariyi silmeye çalış → **409 Conflict** (ilişkili WorkOrder var)
6. İş emrini sil (DELETE `/isemri/workorders/{id}`)
7. Cariyi tekrar sil → **200 OK**

**Test Edilen Özellikler**:
- ✅ Cari-WorkOrder ilişki kısıtı (409 error code)
- ✅ Birden fazla iş emri durumunda cascade delete kontrolü
- ✅ Pasif cari için de iş emri oluşturulabilmesi
- ✅ İş emri silindikten sonra cari silinebilmesi

### 2. Motorbot → Sefer Lifecycle (`test_motorbot_sefer_lifecycle.py`)

**Senaryo**: Motorbot seferi planlama, başlatma, tamamlama

**Test Akışı**:
1. Müşteri cari oluştur
2. Motorbot oluştur (POST `/motorbot/`)
3. Sefer planla - PLANLANDI (POST `/motorbot/sefer`)
4. Seferi başlat - DEVAM_EDIYOR (PATCH `/motorbot/sefer/{id}`)
5. Seferi tamamla - TAMAMLANDI (PATCH `/motorbot/sefer/{id}`)
6. Tamamlanan seferleri sorgula (GET `/motorbot/sefer?durum=TAMAMLANDI`)

**Test Edilen Özellikler**:
- ✅ Durum geçişleri (PLANLANDI → DEVAM_EDIYOR → TAMAMLANDI)
- ✅ Sefer iptal workflow (IPTAL durumu)
- ✅ Aynı motorbot için çakışan seferler (kapasite kontrolü)
- ✅ Sefer süre hesaplamaları (başlangıç-bitiş)

### 3. Tarife → WorkOrder Application (`test_tarife_application_lifecycle.py`)

**Senaryo**: Fiyat listesi oluşturma ve iş emrine uygulama

**Test Akışı**:
1. Fiyat listesi oluştur (POST `/tarife/pricelists`)
2. Fiyat listesine kalemler ekle (POST `/tarife/pricelist-items`)
3. Cari ve iş emri oluştur
4. Fiyat listesindeki kalemleri iş emrine uygula
5. Toplam tutarı doğrula

**Test Edilen Özellikler**:
- ✅ Geçerlilik tarihi kontrolü (başlangıç-bitiş)
- ✅ Para birimi tutarlılığı (PriceList ↔ WorkOrder)
- ✅ Minimum miktar kontrolü
- ✅ Fiyat listesi uygulaması ve tutar hesaplama

## 🚀 Testleri Çalıştırma

### Tüm Integration Testleri
```bash
cd backend
.venv\Scripts\python -m pytest tests/integration/ -v
```

### Spesifik Test Dosyası
```bash
.venv\Scripts\python -m pytest tests/integration/test_cari_workorder_lifecycle.py -v
```

### Tek Test Senaryosu
```bash
.venv\Scripts\python -m pytest tests/integration/test_cari_workorder_lifecycle.py::TestCariWorkOrderLifecycle::test_complete_cari_workorder_lifecycle -v
```

### Coverage ile
```bash
.venv\Scripts\python -m pytest tests/integration/ --cov=aliaport_api --cov-report=html
```

## 📝 Test Yapısı

```
backend/tests/
├── integration/
│   ├── test_cari_workorder_lifecycle.py    # 3 test
│   ├── test_motorbot_sefer_lifecycle.py    # 5 test
│   └── test_tarife_application_lifecycle.py # 4 test
├── unit/                                    # Unit testler
└── conftest.py                              # Pytest fixtures
```

## 🔧 Fixtures (conftest.py)

### Database Fixtures
- `db`: Her test için fresh in-memory SQLite database
- `client`: FastAPI TestClient with DB injection

### Auth Fixtures
- `admin_user`: Admin kullanıcı (email: admin@aliaport.com, password: Admin123!)
- `auth_headers`: JWT Bearer token içeren headers dict

### Sample Data Fixtures
- `sample_cari`: Test cari kaydı
- `sample_work_order`: Test iş emri
- `sample_motorbot`: Test motorbot
- `sample_hizmet`: Test hizmet
- `sample_parametre`: Test parametre

### Factory Functions
- `create_cari(db, **kwargs)`: Dinamik cari oluşturma
- `create_work_order(db, cari, **kwargs)`: Dinamik iş emri oluşturma

## ⚙️ Pytest Markers

```python
@pytest.mark.integration  # Integration test
@pytest.mark.slow         # Yavaş çalışan test (skip ile atlanabilir)
```

**Kullanım**:
```bash
# Sadece integration testleri çalıştır
pytest -m integration

# Slow testleri atla
pytest -m "not slow"
```

## 📊 Örnek Test Çıktısı

```
tests/integration/test_cari_workorder_lifecycle.py::TestCariWorkOrderLifecycle::test_complete_cari_workorder_lifecycle PASSED
tests/integration/test_cari_workorder_lifecycle.py::TestCariWorkOrderLifecycle::test_multiple_workorders_prevent_cari_deletion PASSED
tests/integration/test_motorbot_sefer_lifecycle.py::TestMotorbotSeferLifecycle::test_complete_sefer_lifecycle PASSED

========================= 12 passed in 5.23s =========================
```

## 🐛 Debugging Integration Tests

### Verbose Output
```bash
pytest tests/integration/ -vv --tb=short
```

### Print SQL Queries
```bash
pytest tests/integration/ -s --log-cli-level=DEBUG
```

### Stop on First Failure
```bash
pytest tests/integration/ -x
```

### Run Failed Tests Only
```bash
pytest tests/integration/ --lf
```

## 📐 Test Design Patterns

### 1. AAA Pattern (Arrange-Act-Assert)
```python
def test_example(client, auth_headers):
    # Arrange - veri hazırlığı
    payload = {"CariKod": "TEST-001", ...}
    
    # Act - işlem gerçekleştir
    response = client.post("/cari/", json=payload, headers=auth_headers)
    
    # Assert - doğrula
    assert response.status_code == 201
    assert response.json()["data"]["CariKod"] == "TEST-001"
```

### 2. Given-When-Then
```python
def test_cari_deletion_guard(client, auth_headers):
    # Given: Cari ve WorkOrder mevcut
    cari = create_cari_with_workorder()
    
    # When: Cari silinmeye çalışılır
    response = client.delete(f"/cari/{cari_id}", headers=auth_headers)
    
    # Then: 409 Conflict döner
    assert response.status_code == 409
    assert "CARI_DELETE_HAS_RELATIONS" in response.json()["error_code"]
```

### 3. Lifecycle Validation
```python
# PLANLANDI → DEVAM_EDIYOR → TAMAMLANDI durum zinciri
def test_sefer_status_transitions(client, auth_headers, sample_motorbot):
    # Create: PLANLANDI
    sefer = create_sefer(durum="PLANLANDI")
    
    # Update: → DEVAM_EDIYOR
    update1 = client.patch(f"/motorbot/sefer/{sefer_id}", json={"Durum": "DEVAM_EDIYOR"})
    assert update1.json()["data"]["Durum"] == "DEVAM_EDIYOR"
    
    # Update: → TAMAMLANDI
    update2 = client.patch(f"/motorbot/sefer/{sefer_id}", json={"Durum": "TAMAMLANDI"})
    assert update2.json()["data"]["Durum"] == "TAMAMLANDI"
```

## ✨ Best Practices

1. **Isolation**: Her test bağımsız çalışmalı (fresh database)
2. **Cleanup**: Fixtures otomatik cleanup yapıyor (teardown)
3. **Naming**: Test adları senaryoyu açıklamalı (`test_complete_cari_workorder_lifecycle`)
4. **Assertions**: Hem status code hem de response data doğrula
5. **Error Messages**: Assert'lerde açıklayıcı mesajlar kullan
6. **Coverage**: Integration testler kritik akışları kapsamalı

## 🔗 İlişkili Dosyalar

- Backend Routes: `backend/aliaport_api/modules/*/router.py`
- Models: `backend/aliaport_api/modules/*/models.py`
- Schemas: `backend/aliaport_api/modules/*/schemas.py`
- Error Codes: `backend/aliaport_api/core/error_codes.py`

## 📝 Notlar

**UYARI**: Integration testler gerçek API endpoint path'lerini kullanır. Testler başarısız olursa:

1. Endpoint path'lerini kontrol et (`/cari/` vs `/api/cari/`)
2. Response formatını kontrol et (`.json()["data"]` vs `.json()`)
3. Router registration'ı kontrol et (`main.py` içinde)
4. Field name'leri kontrol et (model Turkish field names)

**TODO**: 
- [ ] Endpoint path discovery otomasyonu
- [ ] API documentation sync (OpenAPI specs)
- [ ] Test data factories genişletme
- [ ] Performance benchmarking ekleme
