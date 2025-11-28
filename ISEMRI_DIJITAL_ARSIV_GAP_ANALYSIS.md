# İŞ EMRİ VE DİJİTAL ARŞİV GAP ANALYSIS

**Tarih:** 25 Kasım 2025  
**Kapsam:** Runbook Gereksinimleri vs Mevcut İmplementasyon  
**Amaç:** Eksiklikleri belirleyip fazlara ayrılmış implementasyon planı oluşturmak

---

## 📊 GENEL DURUM

### Runbook Dokümanları
- ✅ `ISEMRI_DIJITAL_ARSIV_RUNBOOK_PART1.md` - Genel Bakış ve Mimari
- ✅ `ISEMRI_DIJITAL_ARSIV_RUNBOOK_PART2.md` - Portal Kullanıcı Rehberi
- ✅ `ISEMRI_DIJITAL_ARSIV_RUNBOOK_PART3A.md` - Dashboard ve Kullanıcı Yönetimi
- ✅ `ISEMRI_DIJITAL_ARSIV_RUNBOOK_PART3B.md` - Belge İnceleme ve Onaylama
- ✅ `ISEMRI_DIJITAL_ARSIV_RUNBOOK_PART3C.md` - İş Emri Başlatma ve Yönetim
- ✅ `ISEMRI_DIJITAL_ARSIV_RUNBOOK_PART4A.md` - Database Schema
- ✅ `ISEMRI_DIJITAL_ARSIV_RUNBOOK_PART4B.md` - API Endpoints
- ✅ `ISEMRI_DIJITAL_ARSIV_RUNBOOK_PART5.md` - İleri Seviye Özellikler

### ⚠️ YENİ GEREKSİNİMLER (25 Kasım 2025)
Bu analiz güncellenmiştir. Eklenen kritik özellikler:

#### 🆕 Backend İmplementasyonu TAMAMLANDI

**1. Hizmet Kartları - Excel Tarife Entegrasyonu**
- ✅ `CalculationType` enum (6 hesaplama tipi): FIXED, PER_UNIT, X_SECONDARY, PER_BLOCK, BASE_PLUS_INCREMENT, VEHICLE_4H_RULE
- ✅ `FormulaParams` JSON field (Excel ModelParam)
- ✅ `TarifeListesi` table (tarih bazlı versiyonlama)
- ✅ `RequiresPersonCount`, `RequiresVehicleInfo`, `RequiresWeightInfo` flags
- ✅ `EXCEL_CALCULATION_TYPE_MAPPING` dictionary (Excel import için)

**2. Pricing Engine**
- ✅ `backend/aliaport_api/modules/hizmet/pricing_engine.py` oluşturuldu
- ✅ 6 calculation method: `_calculate_fixed`, `_calculate_per_unit`, `_calculate_x_secondary`, `_calculate_per_block`, `_calculate_base_plus_increment`, `_calculate_vehicle_4h_rule`
- ✅ Automatic tariff + exchange rate integration
- ✅ KDV calculation support
- ✅ Detailed calculation breakdown

**3. WorkOrderPerson (Kimlik Yönetimi)**
- ✅ `backend/aliaport_api/modules/isemri/models.py` - WorkOrderPerson table
- ✅ Identity fields: `tc_kimlik_no`, `passport_no`, `identity_document_id`, `identity_photo_url`
- ✅ Security approval fields: `gate_entry_time`, `gate_exit_time`, `approved_by_security`
- ✅ Computed properties: `duration_minutes`, `has_identity_document`, `identity_type`

**4. GateLog Enhancements (4 Saat Kuralı)**
- ✅ `backend/aliaport_api/modules/guvenlik/models.py` güncellendi
- ✅ New FK: `work_order_person_id` → WorkOrderPerson
- ✅ Vehicle tracking: `vehicle_plate`, `vehicle_type`, `driver_name`
- ✅ 4-hour rule fields: `entry_time`, `exit_time`, `duration_minutes`, `base_charge_hours`, `extra_minutes`, `extra_charge_calculated`
- ✅ Identity tracking: `identity_documents_uploaded`, `identity_document_count`
- ✅ Computed properties: `is_vehicle_entry`, `calculate_duration`, `is_over_base_hours`, `calculate_extra_charge`

**5. Runbook Dokümantasyonu**
- ✅ `runbook/07_MODUL_HIZMET.md` - Excel tarife yapısı, CalculationType enum, TarifeListesi, PricingEngine examples
- ✅ `runbook/04_MODUL_ISEMRI.md` - WorkOrderPerson table, automatic pricing flow, security approval workflow
- ✅ `runbook/10_MODUL_GUVENLIK.md` - 4-hour vehicle rule, identity photo upload workflow, tablet UI flow

#### ⏳ BEKLEYEN İMPLEMENTASYONLAR

**Frontend (P1 Öncelik)**
- ❌ `frontend/src/features/hizmet/` - Service selection form with person count input
- ❌ `frontend/src/features/isemri/` - WorkOrderPerson list management (identity input)
- ❌ `frontend/src/features/guvenlik/` - Security tablet UI (camera integration, identity photo capture)
- ❌ `frontend/src/features/saha_personel/` - Active work order viewing + dynamic item addition

**Backend Router Extensions (P1 Öncelik)**
- ❌ `backend/aliaport_api/modules/hizmet/router.py` - Add `/calculate-price` endpoint
- ❌ `backend/aliaport_api/modules/isemri/router.py` - Add `/work-order/{id}/persons` CRUD endpoints
- ❌ `backend/aliaport_api/modules/guvenlik/router.py` - Add `/upload-identity-photo`, `/approve-entry/{person_id}`, `/exit/{person_id}` endpoints
- ❌ `backend/aliaport_api/modules/saha_personel/router.py` - Add `/active-work-orders`, `/add-item-to-work-order` endpoints

**Database Migration (P1 Öncelik)**
- ❌ Alembic migration: Add CalculationType, FormulaParams to Hizmet table
- ❌ Alembic migration: Create TarifeListesi table
- ❌ Alembic migration: Create WorkOrderPerson table
- ❌ Alembic migration: Add new fields to GateLog table

**Excel Integration Utilities (P2 Öncelik)**
- ❌ `backend/aliaport_api/modules/hizmet/excel_importer.py` - Excel tariff import script using EXCEL_CALCULATION_TYPE_MAPPING
- ❌ Data seed script with sample tariffs from Excel

### Mevcut Backend Yapısı
```
backend/aliaport_api/modules/
├── isemri/
│   ├── models.py          ✅ WorkOrder + WorkOrderItem + WorkOrderPerson (8 durum) 🆕
│   ├── schemas.py         ✅ Pydantic schemas
│   ├── router.py          ⚠️ CRUD endpoints (WorkOrderPerson CRUD eksik)
│   └── ...
├── dijital_arsiv/
│   ├── models.py          ✅ ArchiveDocument model
│   ├── schemas.py         ✅ Document schemas
│   ├── internal_router.py ✅ Internal API
│   ├── portal_router.py   ✅ Portal API
│   ├── services.py        ✅ Business logic
│   ├── expiry.py          ✅ Süre kontrolü
│   └── analytics.py       ✅ Raporlama
├── hizmet/                ✅ Hizmet kartları + Pricing Engine 🆕
│   ├── models.py          ✅ CalculationType enum + TarifeListesi 🆕
│   ├── pricing_engine.py  ✅ 6 calculation methods 🆕
│   └── router.py          ⚠️ /calculate-price endpoint eksik
├── guvenlik/              ✅ Güvenlik modülü + 4 saat kuralı 🆕
│   ├── models.py          ✅ GateLog enhanced (work_order_person_id FK, vehicle, 4-hour rule) 🆕
│   └── router.py          ⚠️ Kimlik fotoğrafı upload endpoints eksik
├── saha_personel/         ✅ Saha personel (mevcut)
│   ├── models.py          ✅ WorkLog
│   └── router.py          ⚠️ Aktif iş emri görüntüleme + ek kalem ekleme eksik
├── tarife/                ⚠️ TarifeListesi hizmet modülü altında (hizmet/models.py)
│   └── (hizmet modülüne entegre edildi) 🆕
```

### Mevcut Frontend Yapısı
```
frontend/src/features/
├── isemri/
│   ├── components/
│   │   ├── IsemriModule.tsx      ✅ Temel liste görünümü
│   │   ├── IsemriListModern.tsx  ✅ Modern liste komponenti
│   │   └── IsemriForm.tsx        ✅ Form bileşeni
│   ├── hooks/
│   │   └── useIsemri.ts          ✅ CRUD hooks
│   ├── api/
│   │   └── isemriApi.ts          ✅ API client
│   ├── types/
│   │   └── isemri.types.ts       ✅ TypeScript types
│   └── index.ts
├── dijital-arsiv/
│   ├── components/
│   │   └── DijitalArsivModule.tsx ⚠️ Sadece placeholder kategoriler
│   └── index.ts
```

---

## 🔍 GAP ANALYSIS MATRISI

### 1️⃣ İŞ EMRİ MODÜLÜ

| Özellik | Runbook | Mevcut | Durum | Öncelik |
|---------|---------|--------|-------|---------|
| **UI/UX** |
| Dashboard Kart Görünümü | ✅ 4 kart (Onay Bekleyen, Eksik Belgeler, Aktif, Bugün Biten) | ✅ 4 stats kartı var | 🟡 KISMI - Tasarım farklı | P2 |
| Hızlı Filtreler | ✅ Durum, Cari, Tarih filtreleri + arama | ❌ Yok | 🔴 EKSİK | P1 |
| İş Emri Detay Sayfası | ✅ Tam ekran modal/sayfa | ❌ Yok | 🔴 EKSİK | P1 |
| İş Emri Başlatma Ekranı | ✅ Detaylı başlatma formu (Fiili başlangıç, sorumlu personel, notlar) | ❌ Yok | 🔴 EKSİK | P1 |
| State Machine UI | ✅ Durum geçişleri için butonlar (BAŞLAT, TAMAMLA, FATURA OLUŞTUR) | ❌ Yok | 🔴 EKSİK | P1 |
| Timeline/Zaman Çizelgesi | ✅ İş emri geçmişi timeline | ❌ Yok | 🔴 EKSİK | P3 |
| Öncelik Badge Tasarımı | ✅ 4 renk (DÜŞÜK/NORMAL/YÜKSEK/ACİL) | ✅ Var ama basit | 🟡 KISMI | P3 |
| **İş Akışı (Workflow)** |
| Portal Kullanıcı Desteği | ✅ Portal user id, DRAFT/SUBMITTED durumları | ❌ Backend hazır, frontend yok | 🔴 EKSİK | P1 |
| Onay/Red Süreci | ✅ APPROVED/REJECTED + rejection_reason | ❌ Backend hazır, UI yok | 🔴 EKSİK | P1 |
| İş Emri Başlatma | ✅ APPROVED → SAHADA geçişi | ❌ UI yok | 🔴 EKSİK | P1 |
| İş Emri Tamamlama | ✅ SAHADA → TAMAMLANDI + actual_end_date | ❌ UI yok | 🔴 EKSİK | P1 |
| Faturalama | ✅ TAMAMLANDI → FATURALANDI + invoice_number | ❌ UI yok | 🔴 EKSİK | P2 |
| **Veri İlişkileri** |
| Cari Entegrasyonu | ✅ Cari seçimi + snapshot (CariCode, CariTitle) | ✅ API hazır, form yok | 🟡 KISMI | P1 |
| Hizmet Entegrasyonu | ✅ Service dropdown | ❌ Form yok | 🔴 EKSİK | P2 |
| WorkOrderItem Yönetimi | ✅ CRUD + WORKLOG/RESOURCE/SERVICE tipleri | ✅ API hazır, UI yok | 🔴 EKSİK | P2 |
| **🆕 WorkOrderPerson (Kişi Listesi - 25 Kasım)** |
| WorkOrderPerson CRUD | ✅ Backend table oluşturuldu | ❌ Frontend yok | 🔴 EKSİK | P1 |
| Kişi Listesi Formu | ✅ Ad/Soyad, TC Kimlik/Pasaport, Uyruk, Telefon | ❌ UI yok | 🔴 EKSİK | P1 |
| Hizmet Bazlı Kişi Sayısı Kontrolü | ✅ Hizmet.RequiresPersonCount flag | ❌ Form validation yok | 🔴 EKSİK | P1 |
| WorkOrderPerson → GateLog Entegrasyon | ✅ GateLog.work_order_person_id FK | ✅ Backend hazır | 🟢 TAMAM | P1 |
| **🆕 Otomatik Fiyatlandırma (25 Kasım)** |
| Tarih Bazlı Tarife Yönetimi | ✅ TarifeListesi table (ValidFrom/ValidTo) | ❌ UI yok | 🔴 EKSİK | P1 |
| Pricing Engine Entegrasyonu | ✅ 6 calculation type (FIXED, PER_UNIT, X_SECONDARY, PER_BLOCK, BASE_PLUS_INCREMENT, VEHICLE_4H_RULE) | ✅ Backend hazır (pricing_engine.py) | 🟢 TAMAM | P1 |
| Kur Entegrasyonu (USD/EUR → TRY) | ✅ Kurlar modülü entegrasyonu | ❌ Frontend calculate_price API call yok | 🔴 EKSİK | P1 |
| KDV Hesaplama | ✅ Otomatik KDV ekleme | ✅ Backend hazır | 🟢 TAMAM | P1 |
| `/calculate-price` API Endpoint | ✅ Hizmet seçildiğinde fiyat hesaplama | ❌ Endpoint yok | 🔴 EKSİK | P1 |
| Excel Tariff Import | ✅ EXCEL_CALCULATION_TYPE_MAPPING dictionary | ❌ Import script yok | 🔴 EKSİK | P2 |
| **Belge Yönetimi** |
| İş Emrine Belge Ekleme | ✅ Upload + ArchiveDocument entegrasyonu | ❌ Upload UI yok | 🔴 EKSİK | P1 |
| Zorunlu Belge Kontrolü | ✅ Gümrük belgesi kontrolü (has_required_documents) | ❌ Backend logic yok | 🔴 EKSİK | P1 |
| Belge Onay Durumu Gösterimi | ✅ İş emrinde eksik belge uyarısı | ❌ UI yok | 🔴 EKSİK | P1 |
| **Bildirimler** |
| Email Bildirimleri | ✅ İş emri başlatıldı/tamamlandı/reddedildi | ❌ Yok | 🔴 EKSİK | P2 |
| In-App Bildirimler | ✅ Dashboard'da öncelikli işlemler | ❌ Yok | 🔴 EKSİK | P2 |

**İş Emri Modülü Özet:**
- ✅ **Hazır:** Backend CRUD, basic UI (liste + stats), WorkOrderPerson table, Pricing Engine
- 🟢 **YENI (25 Kasım):** CalculationType enum, TarifeListesi, GateLog entegrasyonu, WorkOrderPerson model
- 🟡 **Kısmi:** Stats kartları var ama tasarım basit
- 🔴 **Eksik:** State machine UI, detay sayfası, başlatma/tamamlama formu, belge entegrasyonu, filtreler, WorkOrderPerson CRUD UI, /calculate-price endpoint

---

### 2️⃣ DİJİTAL ARŞİV MODÜLÜ

| Özellik | Runbook | Mevcut | Durum | Öncelik |
|---------|---------|--------|-------|---------|
| **UI/UX** |
| Durum Kartları (VisitPro Style) | ✅ 4 kart (Eksik/Onay Bekleyen/Reddedilmiş/Onaylanmış) | ❌ Sadece kategori kartları var | 🔴 EKSİK | P1 |
| Ana Arşiv Ekranı | ✅ Durum kartları + arama + filtreler | ❌ Sadece boş placeholder | 🔴 EKSİK | P1 |
| Belge Listesi | ✅ Tablo görünümü + filtreleme | ❌ Yok | 🔴 EKSİK | P1 |
| Belge Önizleme | ✅ PDF viewer modal | ❌ Yok | 🔴 EKSİK | P1 |
| Belge Onaylama/Red UI | ✅ Onay/Red butonları + not girişi | ❌ Yok | 🔴 EKSİK | P1 |
| Kategori Bazlı Görünüm | ✅ İş Emri/Personel/Araç/Cari gruplandırması | ⚠️ Kategoriler var ama içi boş | 🔴 EKSİK | P2 |
| **Belge Yükleme** |
| Drag & Drop Upload | ✅ Çoklu dosya yükleme | ❌ Yok | 🔴 EKSİK | P1 |
| Belge Metadata Formu | ✅ DocumentType, açıklama, süre bilgisi | ❌ Yok | 🔴 EKSİK | P1 |
| Progress Bar | ✅ Yükleme ilerlemesi | ❌ Yok | 🔴 EKSİK | P2 |
| **Belge Yönetimi** |
| Onay Süreci | ✅ UPLOADED → APPROVED/REJECTED | ❌ Backend hazır, UI yok | 🔴 EKSİK | P1 |
| Versiyon Kontrolü | ✅ version, is_latest_version, previous_version_id | ❌ Backend hazır, UI yok | 🔴 EKSİK | P3 |
| Versiyon Geçmişi Görüntüleme | ✅ Timeline gösterimi | ❌ Yok | 🔴 EKSİK | P3 |
| Süre Takibi | ✅ expires_at, süresi dolan belge uyarıları | ✅ Backend hazır (expiry.py) | 🟡 KISMI - UI yok | P2 |
| **Arama ve Filtreleme** |
| Kategori Filtresi | ✅ WORK_ORDER/EMPLOYEE/VEHICLE/CARI | ❌ UI yok | 🔴 EKSİK | P1 |
| Durum Filtresi | ✅ UPLOADED/APPROVED/REJECTED/EXPIRED | ❌ UI yok | 🔴 EKSİK | P1 |
| Tarih Aralığı Filtresi | ✅ Yüklenme tarihi, onay tarihi | ❌ UI yok | 🔴 EKSİK | P2 |
| Tam Metin Arama | ✅ Dosya adı + açıklama + tags | ❌ UI yok | 🔴 EKSİK | P2 |
| **Portal Kullanıcı Özellikleri** |
| Portal Kullanıcı Belge Yükleme | ✅ uploaded_by_portal_user_id | ✅ Backend hazır | 🟡 KISMI - Portal UI yok | P1 |
| Müşteriye Özel Görünüm | ✅ Sadece kendi belgelerini görebilme | ❌ Portal frontend yok | 🔴 EKSİK | P1 |
| **Raporlama** |
| Belge İstatistikleri | ✅ analytics.py - kategori/durum bazlı | ✅ Backend hazır | 🟡 KISMI - UI yok | P3 |
| Süre Dolan Belgeler Raporu | ✅ expiry.py - check_expirations | ✅ Backend hazır | 🟡 KISMI - UI yok | P3 |
| Eksik Belge Raporu | ✅ İş emri başına zorunlu belge kontrolü | ❌ Backend logic kısmi | 🔴 EKSİK | P2 |

**Dijital Arşiv Modülü Özet:**
- ✅ **Hazır:** Backend models, routers, services, expiry logic
- 🟡 **Kısmi:** Kategori kartları placeholder olarak var
- 🔴 **Eksik:** Tüm UI (durum kartları, liste, önizleme, upload, onay süreci)

---

### 3️⃣ PORTAL KULLANICI ÖZELLİKLERİ (YENİ)

| Özellik | Runbook | Mevcut | Durum | Öncelik |
|---------|---------|--------|-------|---------|
| **Portal Frontend (Müşteri Arayüzü)** |
| Portal Giriş Sayfası | ✅ Email + Şifre | ❌ Yok | 🔴 EKSİK | P1 |
| İlk Giriş Şifre Değiştirme | ✅ Zorunlu şifre değiştirme | ❌ Yok | 🔴 EKSİK | P1 |
| Portal Dashboard | ✅ Aktif talepler, bekleyen onaylar | ❌ Yok | 🔴 EKSİK | P1 |
| İş Emri Talebi Oluşturma | ✅ Detaylı form + belge yükleme | ❌ Yok | 🔴 EKSİK | P1 |
| Talep Takibi | ✅ Durum timeline, bildirimler | ❌ Yok | 🔴 EKSİK | P1 |
| Belgelerimi Görüntüleme | ✅ Sadece kendi belgeleri | ❌ Yok | 🔴 EKSİK | P1 |
| **Portal Backend** |
| PortalUser Modeli | ✅ portal_user tablosu | ❌ Backend'de yok | 🔴 EKSİK | P1 |
| Portal Authentication | ✅ Email + Password | ❌ Yok | 🔴 EKSİK | P1 |
| Portal User CRUD | ✅ Aliaport personeli yönetir | ❌ Yok | 🔴 EKSİK | P1 |

**Portal Özet:**
- ✅ **Hazır:** Kavramsal olarak tasarlandı
- 🔴 **Eksik:** Hem frontend hem backend tam olarak yok (dijital_arsiv/portal_router.py var ama PortalUser modeli yok)

---

### 4️⃣ GÜVENLİK MODÜLÜ (25 Kasım 2025 Eklendi)

| Özellik | Runbook | Mevcut | Durum | Öncelik |
|---------|---------|--------|-------|---------|
| **🆕 4 Saat Araç Kuralı** |
| GateLog Vehicle Tracking | ✅ vehicle_plate, vehicle_type, driver_name | ✅ Backend model updated | 🟢 TAMAM | P1 |
| Entry/Exit Time Tracking | ✅ entry_time, exit_time, duration_minutes | ✅ Backend model updated | 🟢 TAMAM | P1 |
| 4-Hour Rule Calculation | ✅ base_charge_hours (default=4), extra_minutes, extra_charge_calculated | ✅ Backend model + computed properties | 🟢 TAMAM | P1 |
| VEHICLE_4H_RULE Integration | ✅ Pricing Engine ile entegre | ✅ pricing_engine.py | 🟢 TAMAM | P1 |
| GateLog → WorkOrderItem Auto-Add | ✅ Çıkışta otomatik iş emri kalemi ekleme | ❌ Backend logic yok | 🔴 EKSİK | P1 |
| **🆕 Kimlik Belgesi Yönetimi** |
| WorkOrderPerson FK | ✅ work_order_person_id → WorkOrderPerson.id | ✅ Backend model updated | 🟢 TAMAM | P1 |
| Identity Document Upload | ✅ identity_document_id → ArchiveDocument.id | ✅ Backend model ready | 🟡 KISMI - Endpoint yok | P1 |
| `/upload-identity-photo` Endpoint | ✅ MinIO upload + ArchiveDocument kayıt | ❌ Endpoint yok | 🔴 EKSİK | P1 |
| `/approve-entry/{person_id}` Endpoint | ✅ Gate entry approval + identity check | ❌ Endpoint yok | 🔴 EKSİK | P1 |
| `/exit/{person_id}` Endpoint | ✅ Gate exit + duration calculation | ❌ Endpoint yok | 🔴 EKSİK | P1 |
| Identity Documents Tracking | ✅ identity_documents_uploaded, identity_document_count | ✅ Backend model updated | 🟢 TAMAM | P1 |
| **🆕 Güvenlik Tablet UI** |
| Pending Entries List | ✅ WorkOrderPerson listesi (onay bekleyenler) | ❌ Frontend yok | 🔴 EKSİK | P1 |
| Camera Integration | ✅ Tablet kamera ile kimlik fotoğrafı çekme | ❌ Frontend yok | 🔴 EKSİK | P1 |
| Identity Photo Preview | ✅ Çekilen fotoğrafı önizleme + yeniden çek | ❌ Frontend yok | 🔴 EKSİK | P1 |
| Approve Entry Button | ✅ Giriş onayı butonu (kimlik yüklendiğinde aktif) | ❌ Frontend yok | 🔴 EKSİK | P1 |
| Exit Approval Button | ✅ Çıkış onayı butonu + süre gösterimi | ❌ Frontend yok | 🔴 EKSİK | P1 |
| **Mevcut Özellikler (Runbook'ta var)** |
| GateLog CRUD | ✅ Giriş/çıkış kayıtları | ✅ Backend + basic UI var | 🟡 KISMI | P2 |
| Checklist Sistemi | ✅ İş emri tipi bazlı checklist | ✅ Backend hazır, UI basit | 🟡 KISMI | P2 |
| İstisna PIN Girişi | ✅ PIN ile eksik dokümanla giriş | ✅ Backend hazır, UI yok | 🟡 KISMI | P3 |

**Güvenlik Modülü Özet:**
- ✅ **Hazır:** GateLog model enhanced (4-hour rule + vehicle + person FK), computed properties
- 🟢 **YENI (25 Kasım):** work_order_person_id FK, vehicle tracking, 4-hour rule fields, identity tracking
- 🟡 **Kısmi:** Backend hazır ama endpoints eksik
- 🔴 **Eksik:** `/upload-identity-photo`, `/approve-entry`, `/exit` endpoints, tablet UI (camera + person list)

---

### 5️⃣ SAHA PERSONEL MODÜLÜ (25 Kasım 2025 - Ek Kalem Özelliği)

| Özellik | Runbook | Mevcut | Durum | Öncelik |
|---------|---------|--------|-------|---------|
| **🆕 Aktif İş Emri Görüntüleme** |
| Saha Personel Dashboard | ✅ Sadece SAHADA durumundaki iş emirleri | ❌ UI yok | 🔴 EKSİK | P1 |
| İş Emri Listesi (Mobil Uyumlu) | ✅ Kart görünümü (responsive) | ❌ UI yok | 🔴 EKSİK | P1 |
| `/active-work-orders` Endpoint | ✅ status=SAHADA filtresi | ❌ Endpoint yok | 🔴 EKSİK | P1 |
| **🆕 Dinamik Kalem Ekleme** |
| Hizmet Seçim Formu | ✅ Hizmet kartları dropdown + autocomplete | ❌ UI yok | 🔴 EKSİK | P1 |
| Otomatik Fiyatlandırma Entegrasyonu | ✅ `/calculate-price` API call | ❌ UI yok | 🔴 EKSİK | P1 |
| Kişi Sayısı Girişi | ✅ RequiresPersonCount ise kişi listesi formu | ❌ UI yok | 🔴 EKSİK | P1 |
| `/add-item-to-work-order` Endpoint | ✅ WorkOrderItem POST with auto-pricing | ❌ Endpoint yok | 🔴 EKSİK | P1 |
| Eklenen Kalem Konfirmasyonu | ✅ Toast + liste güncelleme | ❌ UI yok | 🔴 EKSİK | P1 |
| **Mevcut Özellikler** |
| WorkLog CRUD | ✅ Çalışma saati kaydı | ✅ Backend hazır | 🟡 KISMI - UI basit | P2 |
| Saha Rapor Oluşturma | ✅ Fotoğraf + not ekleme | ❌ UI yok | 🔴 EKSİK | P3 |

**Saha Personel Modülü Özet:**
- ✅ **Hazır:** WorkLog model (çalışma saati takibi)
- 🔴 **Eksik:** Aktif iş emri görüntüleme, ek kalem ekleme formu, endpoints

---

## 📈 ÖNCELİK SKORLAMASI (25 Kasım 2025 Güncellendi)

### P1 (Kritik - Temel İşlevsellik)
1. **🆕 Pricing Engine API Endpoint** - `/calculate-price` endpoint (hizmet seçildiğinde otomatik fiyatlandırma)
2. **🆕 WorkOrderPerson CRUD UI** - Kişi listesi formu (kimlik bilgileri + kişi sayısı kontrolü)
3. **🆕 Güvenlik Tablet Endpoints** - `/upload-identity-photo`, `/approve-entry`, `/exit` endpoints
4. **İş Emri State Machine UI** - İş akışı olmadan sistem kullanılamaz
5. **Dijital Arşiv Durum Kartları** - Belge takibi için gerekli
6. **Belge Yükleme UI** - Temel işlevsellik
7. **Belge Onay/Red UI** - İş akışının tamamlanması için gerekli
8. **İş Emri Detay Sayfası** - Detay görüntüleme zorunlu
9. **Hızlı Filtreler** - Kullanılabilirlik için kritik

### P2 (Önemli - Operasyonel Etkinlik)
1. **🆕 Excel Tariff Import Script** - Mevcut Excel tarife yapısını import etme
2. **Email Bildirimleri** - Kullanıcı deneyimi için önemli
3. **WorkOrderItem Yönetimi** - Faturalandırma için gerekli
4. **Faturalama UI** - İş sürecinin son adımı
5. **Süre Takibi UI** - Uyumluluk için önemli
6. **Hizmet Entegrasyonu** - Veri bütünlüğü

### P3 (İyileştirme - Gelişmiş Özellikler)
1. **Timeline/Zaman Çizelgesi** - Görsel iyileştirme
2. **Versiyon Kontrolü UI** - Gelişmiş özellik
3. **Raporlama Dashboard** - Analitik
4. **In-App Bildirimler** - Kullanıcı deneyimi

---

## 🎯 FAZLARA AYRILMIŞ İMPLEMENTASYON PLANI

### FAZ 1: TEMEL İŞ AKIŞI VE DURUM YÖNETİMİ (2-3 Hafta)

**Amaç:** İş emri ve belge yönetiminin temel iş akışını tamamlamak

#### 1.1. İş Emri Detay Sayfası ve State Machine
**Etkilenen Dosyalar:**
```
frontend/src/features/isemri/
├── components/
│   ├── IsemriDetail.tsx                  [YENİ]
│   ├── IsemriStateMachine.tsx            [YENİ]
│   ├── IsemriStartForm.tsx               [YENİ]
│   ├── IsemriCompleteForm.tsx            [YENİ]
│   └── IsemriModule.tsx                  [GÜNCELLE - detay linkini ekle]
├── hooks/
│   ├── useIsemriActions.ts               [YENİ - state transitions]
│   └── useIsemri.ts                      [GÜNCELLE]
└── api/
    └── isemriApi.ts                      [GÜNCELLE - start/complete endpoints]
```

**Backend Endpoints Eklenecek:**
```python
# backend/aliaport_api/modules/isemri/router.py
POST /work-order/{id}/start          # APPROVED → SAHADA
POST /work-order/{id}/complete       # SAHADA → TAMAMLANDI
POST /work-order/{id}/approve        # SUBMITTED → APPROVED
POST /work-order/{id}/reject         # SUBMITTED → REJECTED

# 🆕 25 Kasım 2025 - Yeni Endpoints
POST /work-order/calculate-price     # Otomatik fiyatlandırma (tarife + kur entegrasyonu)
GET  /work-order/{id}/persons        # İş emri kişi listesi
POST /work-order/{id}/persons        # Kişi ekleme
PUT  /work-order/persons/{person_id} # Kişi güncelleme
DELETE /work-order/persons/{person_id} # Kişi silme

# backend/aliaport_api/modules/guvenlik/router.py
POST /security/upload-identity-photo  # Kimlik belgesi fotoğrafı upload (MinIO + ArchiveDocument)
POST /security/approve-entry/{person_id} # Giriş onayı (WorkOrderPerson + GateLog)
POST /security/exit/{person_id}       # Çıkış onayı (duration_minutes hesaplama)
GET  /security/pending-entries        # Onay bekleyen kişiler (WorkOrderPerson listesi)

# backend/aliaport_api/modules/saha_personel/router.py
GET  /field-personnel/active-work-orders # Sadece SAHADA durumundaki iş emirleri
POST /field-personnel/add-item/{work_order_id} # Aktif iş emrine ek kalem ekleme
```

**UI Komponenti Özellikleri:**
- IsemriDetail: Tüm iş emri bilgileri + timeline + durum geçişleri
- IsemriStateMachine: Mevcut duruma göre kullanılabilir aksiyon butonları
- IsemriStartForm: Fiili başlangıç tarihi + sorumlu personel + notlar
- IsemriCompleteForm: Fiili bitiş tarihi + tamamlanma notları
- **🆕 WorkOrderPersonList:** Kişi listesi tablosu (ad/soyad, TC/pasaport, uyruk, güvenlik onayı)
- **🆕 WorkOrderPersonForm:** Kişi ekleme/düzenleme formu (kimlik tipi seçimi)

**Kabul Kriterleri:**
- ✅ İş emri detay sayfası tüm alanları göstermeli
- ✅ Durum geçişleri butona tıklayarak yapılabilmeli
- ✅ Her durum geçişinde backend'e istek gitmeli
- ✅ Başarılı geçişler toast ile bildirilmeli
- **🆕 ✅ Hizmet seçildiğinde `/calculate-price` API call ile otomatik fiyat hesaplanmalı**
- **🆕 ✅ `RequiresPersonCount=True` ise kişi listesi formu açılmalı**
- **🆕 ✅ Kişi listesi CRUD tam çalışmalı**

---

#### 1.2. Dijital Arşiv Durum Kartları ve Liste
**Etkilenen Dosyalar:**
```
frontend/src/features/dijital-arsiv/
├── components/
│   ├── DijitalArsivModule.tsx            [GÜNCELLE - durum kartları]
│   ├── DijitalArsivStatusCards.tsx       [YENİ]
│   ├── DijitalArsivList.tsx              [YENİ]
│   ├── DijitalArsivFilters.tsx           [YENİ]
│   └── DijitalArsivPreview.tsx           [YENİ - PDF modal]
├── hooks/
│   ├── useDijitalArsiv.ts                [YENİ]
│   └── useDijitalArsivStats.ts           [YENİ]
├── api/
│   └── dijitalArsivApi.ts                [YENİ]
└── types/
    └── dijitalArsiv.types.ts             [YENİ]
```

**UI Komponenti Özellikleri:**
- DijitalArsivStatusCards: 4 kart (🟡 Eksik, 🔴 Onay Bekleyen, ❌ Red, ✅ Onaylanmış)
- DijitalArsivList: Tablo görünümü + satır detayı
- DijitalArsivFilters: Kategori, durum, tarih, arama
- DijitalArsivPreview: PDF viewer (react-pdf kullan)

**Kabul Kriterleri:**
- ✅ Durum kartlarında sayılar backend'den gelmeli
- ✅ Liste filtrelenebilir ve sıralanabilir olmalı
- ✅ PDF önizleme modal açılmalı
- ✅ Responsive tasarım

---

#### 1.3. Belge Yükleme ve Onay/Red
**Etkilenen Dosyalar:**
```
frontend/src/features/dijital-arsiv/
├── components/
│   ├── DijitalArsivUpload.tsx            [YENİ - drag & drop]
│   ├── DijitalArsivApprovalForm.tsx      [YENİ]
│   └── DijitalArsivRejectForm.tsx        [YENİ]
├── hooks/
│   └── useDijitalArsivMutations.ts       [YENİ]
```

**Backend Endpoints Eklenecek:**
```python
# backend/aliaport_api/modules/dijital_arsiv/internal_router.py
POST /archive/upload                      # Belge yükleme
POST /archive/{id}/approve                # Onaylama
POST /archive/{id}/reject                 # Reddetme
```

**UI Komponenti Özellikleri:**
- DijitalArsivUpload: react-dropzone ile drag & drop
- DijitalArsivApprovalForm: Onay notu + tarih
- DijitalArsivRejectForm: Red nedeni dropdown + detaylı açıklama

**Kabul Kriterleri:**
- ✅ Çoklu dosya yükleme desteklenmeli
- ✅ Upload progress bar gösterilmeli
- ✅ Onay/Red işlemleri backend'e kaydedilmeli
- ✅ İşlem sonrası liste güncellenmeli

---

#### 1.4. İş Emri - Belge Entegrasyonu
**Etkilenen Dosyalar:**
```
frontend/src/features/isemri/
├── components/
│   ├── IsemriDetail.tsx                  [GÜNCELLE - belge bölümü ekle]
│   └── IsemriDocumentList.tsx            [YENİ]

backend/aliaport_api/modules/isemri/
├── router.py                             [GÜNCELLE - has_required_documents check]
└── services.py                           [YENİ - belge kontrol logic]
```

**Backend Business Logic:**
```python
# backend/aliaport_api/modules/isemri/services.py
def check_required_documents(work_order_id: int) -> dict:
    """
    İş emri için zorunlu belgeleri kontrol et
    Return: {
        "has_required": bool,
        "missing_documents": [DocumentType, ...],
        "uploaded_documents": [...]
    }
    """
```

**Kabul Kriterleri:**
- ✅ İş emri detayında belgeler listelenebilmeli
- ✅ Eksik belgeler kırmızı uyarı ile gösterilmeli
- ✅ İş emri başlatma butonu belge kontrolü yapmalı
- ✅ Gümrük belgesi yoksa başlatma engellenebilmeli

---

### FAZ 2: GELİŞMİŞ İŞ AKIŞI VE CRUD İŞLEMLERİ (2 Hafta)

**Amaç:** Tam CRUD işlevselliği ve iş akışı iyileştirmeleri

#### 2.1. İş Emri Oluşturma/Düzenleme Form
**Etkilenen Dosyalar:**
```
frontend/src/features/isemri/
├── components/
│   ├── IsemriForm.tsx                    [GÜNCELLE - tam form]
│   ├── IsemriCariSelect.tsx              [YENİ]
│   └── IsemriServiceSelect.tsx           [YENİ]
```

**Form Alanları:**
- Cari seçimi (searchable dropdown)
- İş emri tipi (HIZMET/MOTORBOT/BARINMA/DIGER)
- Hizmet seçimi (service_id)
- Konu + açıklama
- Öncelik + planlı tarihler
- Türk bayraklı gemi (is_cabatoge_tr_flag)

#### 2.2. WorkOrderItem Yönetimi
**Etkilenen Dosyalar:**
```
frontend/src/features/isemri/
├── components/
│   ├── IsemriItemList.tsx                [YENİ]
│   ├── IsemriItemForm.tsx                [YENİ]
│   └── IsemriDetail.tsx                  [GÜNCELLE - items tab]
```

**Özellikler:**
- Item ekleme/düzenleme/silme
- WORKLOG/RESOURCE/SERVICE tip seçimi
- Miktar × Birim fiyat hesaplama
- KDV hesaplama

#### 2.3. Faturalama UI
**Etkilenen Dosyalar:**
```
frontend/src/features/isemri/
├── components/
│   └── IsemriInvoiceForm.tsx             [YENİ]

backend/aliaport_api/modules/isemri/
└── router.py                             [GÜNCELLE - invoice endpoint]
```

**Özellikler:**
- TAMAMLANDI → FATURALANDI geçişi
- Fatura numarası + tarihi girişi
- Fatura detayları görüntüleme

---

### FAZ 3: FİLTRELEME, ARAMA VE BİLDİRİMLER (1-2 Hafta)

**Amaç:** Kullanıcı deneyimini iyileştirmek

#### 3.1. Gelişmiş Filtreleme
**Etkilenen Dosyalar:**
```
frontend/src/features/isemri/
├── components/
│   ├── IsemriFilters.tsx                 [YENİ]
│   └── IsemriModule.tsx                  [GÜNCELLE]

frontend/src/features/dijital-arsiv/
├── components/
│   └── DijitalArsivFilters.tsx           [GÜNCELLE - tarih aralığı ekle]
```

**Özellikler:**
- Multi-select filtreler
- Tarih aralığı seçici (date range picker)
- URL query params ile durum paylaşımı
- Filter badge'leri

#### 3.2. Email Bildirimleri
**Etkilenen Dosyalar:**
```
backend/aliaport_api/
├── core/
│   ├── email.py                          [YENİ - email service]
│   └── email_templates/                  [YENİ - HTML templates]
│       ├── work_order_started.html
│       ├── work_order_completed.html
│       ├── work_order_approved.html
│       └── work_order_rejected.html
├── modules/isemri/
│   └── router.py                         [GÜNCELLE - email triggers]
```

**Email Senaryoları:**
1. İş emri başlatıldı (müşteriye)
2. İş emri tamamlandı (müşteriye)
3. İş emri onaylandı (müşteriye)
4. İş emri reddedildi (müşteriye + nedeni)
5. Belge onaylandı/reddedildi

#### 3.3. Dashboard İyileştirmeleri
**Etkilenen Dosyalar:**
```
frontend/src/features/isemri/
├── components/
│   ├── IsemriDashboard.tsx               [YENİ]
│   ├── IsemriPriorityList.tsx            [YENİ - öncelikli işlemler]
│   └── IsemriTrendChart.tsx              [YENİ - haftalık trend]
```

**Özellikler:**
- Öncelikli işlemler kartı
- Haftalık trend grafiği (Chart.js veya Recharts)
- Bugünkü istatistikler

---

### FAZ 4: PORTAL KULLANICI VE İLERİ SEVİYE ÖZELLİKLER (3 Hafta)

**Amaç:** Portal frontend ve gelişmiş özellikler

#### 4.1. PortalUser Backend
**Etkilenen Dosyalar:**
```
backend/aliaport_api/modules/
├── portal_user/                          [YENİ MODÜL]
│   ├── models.py                         [YENİ - PortalUser model]
│   ├── schemas.py                        [YENİ]
│   ├── router.py                         [YENİ]
│   └── services.py                       [YENİ]
└── auth/
    └── dependencies.py                   [GÜNCELLE - portal auth]
```

**PortalUser Model:**
```python
class PortalUser(Base):
    id: int
    cari_id: int  # FK to Cari
    email: str
    password_hash: str
    first_name: str
    last_name: str
    phone: str
    is_admin: bool  # Portal admin (firma bazında)
    is_active: bool
    must_change_password: bool
    last_login: datetime
    created_by: int  # FK to User (Aliaport personel)
```

#### 4.2. Portal Frontend (Müşteri Arayüzü)
**Etkilenen Dosyalar:**
```
frontend/src/
├── features/portal/                      [YENİ]
│   ├── auth/
│   │   ├── PortalLogin.tsx
│   │   └── PortalChangePassword.tsx
│   ├── dashboard/
│   │   └── PortalDashboard.tsx
│   ├── work-orders/
│   │   ├── PortalWorkOrderCreate.tsx
│   │   ├── PortalWorkOrderList.tsx
│   │   └── PortalWorkOrderTrack.tsx
│   └── documents/
│       ├── PortalDocumentUpload.tsx
│       └── PortalDocumentList.tsx
└── App.tsx                               [GÜNCELLE - portal route]
```

**Özellikler:**
- Portal giriş + şifre değiştirme
- Portal dashboard (sadece kendi talepleri)
- İş emri talebi oluşturma
- Belge yükleme
- Talep takibi

#### 4.3. Versiyon Kontrolü UI
**Etkilenen Dosyalar:**
```
frontend/src/features/dijital-arsiv/
├── components/
│   ├── DijitalArsivVersionHistory.tsx    [YENİ]
│   └── DijitalArsivVersionCompare.tsx    [YENİ]
```

**Özellikler:**
- Belge versiyon geçmişi timeline
- İki versiyon karşılaştırma (side-by-side PDF)

#### 4.4. Süre Takibi UI
**Etkilenen Dosyalar:**
```
frontend/src/features/dijital-arsiv/
├── components/
│   ├── DijitalArsivExpiryAlerts.tsx      [YENİ]
│   └── DijitalArsivModule.tsx            [GÜNCELLE - süre uyarıları]
```

**Özellikler:**
- Süresi yaklaşan belgeler uyarısı
- Süresi dolan belgeler raporu
- Otomatik bildirimler (backend: expiry.py)

#### 4.5. Raporlama ve Analitik
**Etkilenen Dosyalar:**
```
frontend/src/features/
├── isemri/
│   └── components/IsemriReports.tsx      [YENİ]
└── dijital-arsiv/
    └── components/DijitalArsivReports.tsx [YENİ]
```

**Özellikler:**
- İş emri özet raporu (tarih aralığı)
- Belge durum raporu
- Eksik belge raporu
- CSV/Excel export

---

## 📋 FAZ BAZLI İŞ DAĞILIMI

### Faz 1: Temel İş Akışı (P1)
**Süre:** 2-3 Hafta  
**Takım:** 2 Frontend + 1 Backend Developer

| Görev | Frontend | Backend | Süre |
|-------|----------|---------|------|
| İş Emri Detay + State Machine | ✅ | ✅ | 5 gün |
| Dijital Arşiv Durum Kartları | ✅ | - | 3 gün |
| Belge Yükleme + Onay/Red | ✅ | ✅ | 4 gün |
| İş Emri - Belge Entegrasyonu | ✅ | ✅ | 3 gün |
| Test + Bug Fix | ✅ | ✅ | 3 gün |

**Deliverables:**
- ✅ İş emri başlatma/tamamlama çalışıyor
- ✅ Belgeler yüklenip onaylanabiliyor
- ✅ Eksik belge kontrolü yapılıyor

---

### Faz 2: Gelişmiş İş Akışı (P1-P2)
**Süre:** 2 Hafta  
**Takım:** 2 Frontend + 1 Backend Developer

| Görev | Frontend | Backend | Süre |
|-------|----------|---------|------|
| İş Emri Form (Tam CRUD) | ✅ | - | 3 gün |
| WorkOrderItem Yönetimi | ✅ | ✅ | 4 gün |
| Faturalama UI | ✅ | ✅ | 2 gün |
| Test + Bug Fix | ✅ | ✅ | 2 gün |

**Deliverables:**
- ✅ Tam CRUD işlevselliği
- ✅ WorkOrderItem ekleme/düzenleme
- ✅ Faturalama süreci tamamlanıyor

---

### Faz 3: Kullanıcı Deneyimi (P2)
**Süre:** 1-2 Hafta  
**Takım:** 1 Frontend + 1 Backend Developer

| Görev | Frontend | Backend | Süre |
|-------|----------|---------|------|
| Gelişmiş Filtreler | ✅ | - | 2 gün |
| Email Bildirimleri | - | ✅ | 3 gün |
| Dashboard İyileştirmeleri | ✅ | - | 2 gün |
| Test + Bug Fix | ✅ | ✅ | 2 gün |

**Deliverables:**
- ✅ Filtreler ve arama çalışıyor
- ✅ Email bildirimleri gidiyor
- ✅ Dashboard görsel olarak zengin

---

### Faz 4: Portal ve İleri Özellikler (P1-P3)
**Süre:** 3 Hafta  
**Takım:** 2 Frontend + 1 Backend Developer

| Görev | Frontend | Backend | Süre |
|-------|----------|---------|------|
| PortalUser Backend | - | ✅ | 3 gün |
| Portal Frontend | ✅ | - | 7 gün |
| Versiyon Kontrolü UI | ✅ | - | 2 gün |
| Süre Takibi UI | ✅ | - | 2 gün |
| Raporlama | ✅ | ✅ | 3 gün |
| Test + Bug Fix | ✅ | ✅ | 3 gün |

**Deliverables:**
- ✅ Portal kullanıcıları sisteme girebiliyor
- ✅ Portal'dan iş emri talebi oluşturulabiliyor
- ✅ Versiyon kontrolü çalışıyor
- ✅ Raporlar alınabiliyor

---

## 🎯 TOPLAM SÜRE TAHMİNİ

| Faz | Süre | Bağımlılık |
|-----|------|------------|
| Faz 1 | 2-3 hafta | Yok (başlangıç) |
| Faz 2 | 2 hafta | Faz 1 tamamlanmalı |
| Faz 3 | 1-2 hafta | Faz 2 tamamlanmalı (paralel yapılabilir) |
| Faz 4 | 3 hafta | Faz 1-2 tamamlanmalı |

**Toplam:** 8-10 hafta (2-2.5 ay)

**Not:** Faz 3 ve Faz 4'ün bir kısmı paralel yapılabilir.

---

## 📦 TEKNOLOJİ STACK ÖNERİLERİ

### Frontend Kütüphaneleri
```json
{
  "dependencies": {
    "react-dropzone": "^14.2.3",        // Drag & drop upload
    "react-pdf": "^7.5.1",              // PDF önizleme
    "date-fns": "^2.30.0",              // Tarih işlemleri
    "recharts": "^2.9.0",               // Grafikler
    "react-hook-form": "^7.48.2",       // Form yönetimi
    "zod": "^3.22.4",                   // Schema validation
    "@tanstack/react-query": "^5.8.4"   // Server state management (opsiyonel)
  }
}
```

### Backend Kütüphaneleri
```python
# requirements.txt
fastapi-mail==1.4.1          # Email gönderimi
jinja2==3.1.2                # Email template'leri
python-multipart==0.0.6      # File upload
PyPDF2==3.0.1                # PDF işlemleri (opsiyonel)
```

---

## ✅ KABUL KRİTERLERİ (Genel)

### Faz 1 Tamamlanma Kriterleri
- [ ] Kullanıcı iş emri başlatabilmeli
- [ ] Kullanıcı iş emri tamamlayabilmeli
- [ ] Kullanıcı belge yükleyebilmeli
- [ ] Kullanıcı belge onaylayabilmeli/reddedebilmeli
- [ ] Eksik belge uyarısı gösterilmeli
- [ ] Tüm state geçişleri backend'e kaydedilmeli

### Faz 2 Tamamlanma Kriterleri
- [ ] Kullanıcı iş emri oluşturabilmeli (full form)
- [ ] Kullanıcı iş emri düzenleyebilmeli
- [ ] Kullanıcı WorkOrderItem ekleyebilmeli
- [ ] Kullanıcı fatura oluşturabilmeli

### Faz 3 Tamamlanma Kriterleri
- [ ] Kullanıcı iş emirlerini filtreleyebilmeli
- [ ] Kullanıcı belgeleri arayabilmeli
- [ ] Email bildirimleri gönderilmeli
- [ ] Dashboard trend grafikleri gösterilmeli

### Faz 4 Tamamlanma Kriterleri
- [ ] Portal kullanıcısı giriş yapabilmeli
- [ ] Portal kullanıcısı iş emri talebi oluşturabilmeli
- [ ] Portal kullanıcısı belgelerini görüntüleyebilmeli
- [ ] Versiyon geçmişi görüntülenebilmeli
- [ ] Raporlar alınabilmeli

---

## 🚨 RİSKLER VE ÖNLEMLER

| Risk | Olasılık | Etki | Önlem |
|------|----------|------|-------|
| PDF önizleme performans sorunu | Orta | Yüksek | react-pdf yerine iframe kullan |
| Dosya yükleme timeout | Düşük | Yüksek | Chunk upload implementasyonu |
| Email spam filtresi | Orta | Orta | SPF/DKIM/DMARC yapılandırması |
| Portal auth güvenlik | Yüksek | Kritik | JWT + refresh token + rate limiting |
| Database migration hatası | Düşük | Kritik | Alembic ile kontrollü migration |

---

## 📝 NOTLAR

1. **Mevcut Kod Kalitesi:** Backend modelleri ve router'lar iyi durumda. Frontend temel yapı var ancak UI eksik.

2. **Runbook Uyumluluğu:** Runbook dokümanları çok detaylı ve kaliteli. ASCII art UI tasarımları implementasyon için iyi referans.

3. **Öncelikli Konu:** Portal kullanıcı sistemi tamamen yeni bir modül. Faz 4'e kadar ertelenebilir ancak iş akışı için kritik.

4. **Test Stratejisi:** Her faz sonunda UAT (User Acceptance Testing) yapılmalı.

5. **Deployment:** Her faz sonunda staging'e deploy edilip test edilebilir.

---

**SON GÜNCELLEME:** 25 Kasım 2025  
**HAZIRLIYAN:** GitHub Copilot  
**ONAYLAYAN:** Aliaport Ekibi (Onay bekliyor)
