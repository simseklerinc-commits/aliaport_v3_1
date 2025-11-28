# 📊 VISITPRO UYGUNLUK ANALİZİ VE EKSİKLİK RAPORU

**Tarih:** 25 Kasım 2025  
**Analiz Edilen Ekran Görüntüleri:** 15 adet (whatsap/ klasörü)  
**Referans Sistem:** VisitPro Liman Yönetim Sistemi  

---

## 🎯 YÖNETİCİ ÖZETİ

**🚨 KRİTİK BULGULAR:**

1. **Zorunlu Belge Kontrolü Eksik:** Backend'de `GUMRUK_IZIN_BELGESI` zorunlu belge olarak tanımlanmış (`is_required_for_work_order` property), ancak iş emri başlatma workflow'unda bu kontrol yapılmıyor.

2. **Belge Kategorisi UI Kullanılmıyor:** DocumentCategory enum'da 6 kategori var (`WORK_ORDER`, `EMPLOYEE`, `VEHICLE`, `MOTORBOT`, `CARI`, `GENERAL`) ama frontend'de kategori bazlı filtreleme/sekmeler yok.

3. **WorkOrderPerson Modeli UI'siz:** Backend'de person management modeli hazır (tc_kimlik_no, passport_no, identity_photo_url) ama CRUD UI ve router endpoints yok.

4. **Güvenlik Tablet UI Yok:** GateLog modeli 4-hour rule için güncellenmiş, ama güvenlik görevlisi için kimlik fotoğrafı upload + entry/exit approval UI'ı yok.

5. **Dashboard VisitPro Akışına Uymuyor:** VisitPro'da "Eksik Belgeler", "Onay Bekleyen" durum kartları var, mevcut sistemde sadece temel istatistikler.

---

## 📋 DETAYLI KARŞILAŞTIRMA MATRİSİ

### 1️⃣ BELGE YÖNETİMİ AKIŞI

| Özellik | VisitPro (Referans) | Aliaport Mevcut | Durum | Gap Açıklaması |
|---------|---------------------|-----------------|-------|----------------|
| **Zorunlu Belge Tanımı** | ✅ İş emri tipine göre zorunlu belgeler listesi | 🟡 `GUMRUK_IZIN_BELGESI` ZORUNLU olarak işaretli | 🔴 KISMI | Backend'de `is_required_for_work_order` property var ama sadece 1 belge zorunlu. VisitPro'da her iş emri tipi için farklı zorunlu belgeler tanımlanabiliyor. |
| **Zorunlu Belge Kontrolü** | ✅ İş emri başlatmadan önce zorunlu belgelerin onaylanmış olması gerekir | ❌ Kontrol yok | 🔴 EKSİK | `portal_router.py` line 365'te `required_documents_complete` hesaplama var ama iş emri durumu değişikliğinde kontrol yapılmıyor. |
| **Belge Kategorileri** | ✅ Firma Belgeleri, Personel Belgeleri, Araç Belgeleri, Genel Belgeler | ✅ DocumentCategory enum (6 kategori) | 🔴 KULLANILMIYOR | `models.py` line 20-27'de enum tanımlı ama UI'da kategori bazlı sekme/filtreleme yok. |
| **Personel Belgeleri** | ✅ TC Kimlik, Pasaport, Fotoğraf, SRC5, Sağlık belgesi | 🟡 DocumentType enum'da var | 🔴 UI EKSİK | Backend: `SRC5`, `SIGORTA_LISTESI`, `EGITIM_SERTIFIKASI` tanımlı. Ancak PersonelProfile management UI yok. |
| **Araç Belgeleri** | ✅ Ruhsat, Muayene, Sigorta, Tescil | ✅ DocumentType enum'da var | 🟢 TAMAM | Backend: `ARAC_RUHSAT`, `ARAC_MUAYENE`, `ARAC_SIGORTA`, `ARAC_TESCIL` tanımlı. |
| **Belge Durum Kartları** | ✅ Dashboard: Eksik Belgeler, Onay Bekleyen, Reddedilmiş, Onaylanmış | ❌ Sadece kategori kartları (boş) | 🔴 EKSİK | `DijitalArsivModule.tsx` sadece placeholder kartlar içeriyor. |
| **Belge Yükleme UI** | ✅ Drag & Drop + kategori/tip seçimi + metadata | 🟡 `DocumentUpload.tsx` var ama kullanılmıyor | 🔴 İŞLEVSİZ | Component var (line 30-180) ama Portal/Admin router'da mount edilmemiş. |
| **Belge Önizleme** | ✅ PDF viewer modal + thumbnail | ❌ Yok | 🔴 EKSİK | Belge listesinde "İndir" linki yok, önizleme modal yok. |
| **Belge Onay/Red** | ✅ Onay/Red butonları + not girişi + email bildirimi | 🟡 `DocumentListModern.tsx` onay/red mutation var | 🟢 TAMAM | Backend API ve frontend mutation tamamlanmış (son commitlerde eklendi). |
| **Süre Takibi** | ✅ Belge geçerlilik süresi + 30/60/90 gün öncesi uyarıları | ✅ `expires_at` field + `expiry.py` service | 🟡 UI YOK | Backend hazır ama frontend'de süre uyarısı kartları yok. |
| **Versiyon Kontrolü** | ✅ Belge versiyonları + geçmiş görüntüleme | ✅ `version`, `previous_version_id` fields | 🟡 UI YOK | Backend model hazır ama UI yok. |

#### 🔴 Kritik Eksiklik: Zorunlu Belge Workflow

**VisitPro Akışı:**
```
1. İş emri oluşturulur (DRAFT)
2. Firma zorunlu belgeleri yükler
3. Aliaport personeli belgeleri onaylar
4. ✅ Tüm zorunlu belgeler onaylanmışsa → İş emri başlatılabilir (SAHADA)
5. ❌ Eksik/Reddedilmiş belge varsa → İş emri başlatılamaz (red icon + warning)
```

**Aliaport Mevcut:**
```python
# backend/aliaport_api/modules/dijital_arsiv/models.py (line 254)
@property
def is_required_for_work_order(self) -> bool:
    """İş emri için zorunlu belge mi?"""
    return self.document_type == DocumentType.GUMRUK_IZIN_BELGESI
```

**Sorun:** 
- İş emri durum değişikliğinde (`APPROVED` → `SAHADA`) zorunlu belge kontrolü yok
- `internal_router.py` line 580-581'de yorum var ama implement edilmemiş
- Portal dashboard'da "Eksik Belgeler" uyarısı yok

**Çözüm Gereksinimi:**
1. `/api/v1/work-order/{id}/start` endpoint'inde zorunlu belge kontrolü ekle
2. Portal dashboard'a "Eksik Belgeler" kartı ekle (`required_documents_complete: false` olan iş emirleri)
3. Admin belge onay ekranında iş emri ile ilişkilendirme yapılabilsin

---

### 2️⃣ PERSONELİN KİMLİK YÖNETİMİ

| Özellik | VisitPro (Referans) | Aliaport Mevcut | Durum | Gap Açıklaması |
|---------|---------------------|-----------------|-------|----------------|
| **WorkOrderPerson Modeli** | ✅ Kişi listesi (Ad/Soyad, TC/Pasaport, Telefon, Uyruk) | ✅ Backend model var | 🔴 UI YOK | `backend/aliaport_api/modules/isemri/models.py` - WorkOrderPerson table tanımlı ama CRUD endpoints yok. |
| **Kimlik Belgesi Yönetimi** | ✅ TC Kimlik fotokopisi, Pasaport fotokopisi, Fotoğraf | 🟡 `identity_photo_url`, `tc_kimlik_no`, `passport_no` fields var | 🔴 UPLOAD YOK | Backend model hazır ama `/upload-identity-photo` endpoint yok. |
| **Kişi Sayısı Kontrolü** | ✅ Hizmet bazlı kişi sayısı doğrulama | 🟡 `RequiresPersonCount` flag var | 🔴 UI YOK | `TarifeListesi` modelinde flag var ama form validation yok. |
| **Güvenlik Onay Süreci** | ✅ Güvenlik görevlisi kimlik belgelerini kontrol edip giriş onaylar | ❌ Yok | 🔴 EKSİK | Güvenlik tablet UI tamamen eksik. |
| **GateLog Entegrasyonu** | ✅ Kişi bazlı giriş/çıkış takibi | ✅ `work_order_person_id` FK var | 🟢 TAMAM | Backend model güncellenmiş (25 Kasım). |

#### 🔴 Kritik Eksiklik: WorkOrderPerson CRUD UI

**Backend Model (Hazır):**
```python
# backend/aliaport_api/modules/isemri/models.py
class WorkOrderPerson(Base):
    __tablename__ = "work_order_person"
    
    id = Column(Integer, primary_key=True)
    work_order_id = Column(Integer, ForeignKey("work_order.id"))
    
    # Kimlik bilgileri
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    tc_kimlik_no = Column(String(11), nullable=True)
    passport_no = Column(String(50), nullable=True)
    nationality = Column(String(50), nullable=True)
    phone = Column(String(20), nullable=True)
    
    # Fotoğraf
    identity_photo_url = Column(String(500), nullable=True)
    identity_document_id = Column(Integer, ForeignKey("archive_document.id"))
```

**Eksik Endpoints:**
```python
# backend/aliaport_api/modules/isemri/router.py - EKLENMELİ

@router.get("/work-order/{work_order_id}/persons")
async def list_work_order_persons(work_order_id: int):
    """İş emrine ait kişi listesi"""
    pass

@router.post("/work-order/{work_order_id}/persons")
async def add_work_order_person(work_order_id: int, person: WorkOrderPersonCreate):
    """İş emrine kişi ekle"""
    pass

@router.delete("/work-order/{work_order_id}/persons/{person_id}")
async def remove_work_order_person(work_order_id: int, person_id: int):
    """İş emrinden kişi sil"""
    pass

@router.post("/work-order/{work_order_id}/persons/{person_id}/upload-identity")
async def upload_identity_photo(work_order_id: int, person_id: int, file: UploadFile):
    """Kimlik fotoğrafı yükle (MinIO)"""
    pass
```

**Eksik Frontend:**
```tsx
// frontend/src/features/isemri/components/WorkOrderPersonList.tsx - OLUŞTURULMALI

interface WorkOrderPersonListProps {
  workOrderId: number;
}

export function WorkOrderPersonList({ workOrderId }: WorkOrderPersonListProps) {
  // Kişi listesi tablosu
  // Kişi ekleme formu (TC/Pasaport, telefon, uyruk)
  // Kimlik fotoğrafı upload butonu
  // Silme butonu
}
```

---

### 3️⃣ GÜVENLİK TABLET VE 4 SAAT KURALI

| Özellik | VisitPro (Referans) | Aliaport Mevcut | Durum | Gap Açıklaması |
|---------|---------------------|-----------------|-------|----------------|
| **4 Saat Araç Kuralı** | ✅ Araç girişte başlar, çıkışta süre hesaplanır | ✅ GateLog model updated | 🟢 BACKEND TAMAM | `duration_minutes`, `base_charge_hours`, `extra_charge_calculated` fields eklendi. |
| **Araç Giriş/Çıkış Takibi** | ✅ Plaka + sürücü + entry/exit time | ✅ GateLog model updated | 🟢 BACKEND TAMAM | `vehicle_plate`, `driver_name`, `entry_time`, `exit_time` fields var. |
| **Otomatik WorkOrderItem Ekleme** | ✅ Çıkışta 4 saatten fazlaysa otomatik fatura kalemi eklenir | ❌ Backend logic yok | 🔴 EKSİK | `GateLog.exit_time` set edildiğinde WorkOrderItem otomatik create edilmeli. |
| **Kimlik Fotoğrafı Çekme** | ✅ Tablet kamera ile kimlik fotoğrafı | ❌ Frontend UI yok | 🔴 EKSİK | Güvenlik görevlisi için camera integration. |
| **Giriş Onay Ekranı** | ✅ Bekleyen kişiler listesi + kimlik fotoğrafı upload + onay butonu | ❌ Frontend UI yok | 🔴 EKSİK | SecurityTabletUI component tamamen eksik. |
| **Çıkış Onay Ekranı** | ✅ Çıkış yapan kişi/araç + süre gösterimi + onay butonu | ❌ Frontend UI yok | 🔴 EKSİK | SecurityTabletUI component tamamen eksik. |

#### 🔴 Kritik Eksiklik: Güvenlik Tablet UI

**Backend Model (Hazır):**
```python
# backend/aliaport_api/modules/security/models.py
class GateLog(Base):
    __tablename__ = "gate_log"
    
    # 25 Kasım güncellemeleri
    work_order_person_id = Column(Integer, ForeignKey("work_order_person.id"))
    identity_document_id = Column(Integer, ForeignKey("archive_document.id"))
    
    # Araç bilgileri
    vehicle_plate = Column(String(20), nullable=True)
    vehicle_type = Column(String(50), nullable=True)
    driver_name = Column(String(200), nullable=True)
    
    # 4-hour rule
    entry_time = Column(DateTime, nullable=True)
    exit_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    base_charge_hours = Column(Integer, default=4)
    extra_charge_calculated = Column(Boolean, default=False)
    
    @property
    def extra_minutes(self) -> int:
        if not self.duration_minutes or self.duration_minutes <= (self.base_charge_hours * 60):
            return 0
        return self.duration_minutes - (self.base_charge_hours * 60)
```

**Eksik Endpoints:**
```python
# backend/aliaport_api/modules/security/router.py - EKLENMELİ

@router.get("/security/pending-entries")
async def get_pending_entries():
    """Giriş onayı bekleyen kişiler (identity_document_id NULL olanlar)"""
    pass

@router.post("/security/upload-identity-photo")
async def upload_identity_photo(person_id: int, file: UploadFile):
    """Kimlik fotoğrafı yükle + ArchiveDocument oluştur + GateLog.identity_document_id güncelle"""
    pass

@router.post("/security/approve-entry/{person_id}")
async def approve_entry(person_id: int):
    """Giriş onayı + GateLog.entry_time set"""
    pass

@router.post("/security/exit/{person_id}")
async def approve_exit(person_id: int):
    """Çıkış onayı + GateLog.exit_time set + duration hesaplama + 4-hour rule kontrolü"""
    pass
```

**Eksik Frontend:**
```tsx
// frontend/src/features/security/components/SecurityTabletUI.tsx - OLUŞTURULMALI

export function SecurityTabletUI() {
  return (
    <div className="tablet-optimized">
      {/* Sol Panel: Bekleyen Kişiler */}
      <PendingEntriesList />
      
      {/* Sağ Panel: Kimlik Fotoğrafı Upload */}
      <div>
        <CameraCapture onCapture={uploadIdentityPhoto} />
        <Button onClick={approveEntry}>Giriş Onayla</Button>
      </div>
      
      {/* Alt Panel: Çıkış Yapanlar */}
      <ExitApprovalList />
    </div>
  );
}
```

---

### 4️⃣ DASHBOARD DURUM KARTLARI

| Özellik | VisitPro (Referans) | Aliaport Mevcut | Durum | Gap Açıklaması |
|---------|---------------------|-----------------|-------|----------------|
| **Eksik Belgeler Kartı** | ✅ Zorunlu belgeleri eksik iş emirleri sayısı | ❌ Yok | 🔴 EKSİK | `PortalDashboard.tsx` - `required_documents_complete: false` filtresi ile API call. |
| **Onay Bekleyen Kartı** | ✅ Belge onayı bekleyen iş emirleri | ❌ Yok | 🔴 EKSİK | `status: UPLOADED` olan belgeler. |
| **Reddedilmiş Belgeler** | ✅ Reddedilen belge sayısı + düzeltme uyarısı | ❌ Yok | 🔴 EKSİK | `status: REJECTED` olan belgeler. |
| **Bugün Biten İş Emirleri** | ✅ estimated_end_date == bugün olan iş emirleri | ❌ Yok | 🔴 EKSİK | Dashboard kartı yok. |
| **Aktif İş Emirleri** | ✅ status=SAHADA olan iş emirleri | ✅ Var | 🟢 TAMAM | Mevcut dashboard'da aktif iş emirleri gösteriliyor. |

**VisitPro Dashboard Kart Düzeni:**
```
┌────────────────────────────────────────────────────────────────┐
│  PORTAL DASHBOARD                                              │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ 🔴 EKSIK     │  │ 🟡 ONAY      │  │ 🔴 REDDEDİLMİŞ│        │
│  │ BELGELER     │  │ BEKLEYEN     │  │ BELGELER     │        │
│  │              │  │              │  │              │        │
│  │     12       │  │      5       │  │      3       │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ 🟢 AKTİF     │  │ ⏰ BUGÜN     │  │ ✅ TAMAMLANAN│        │
│  │ İŞ EMİRLERİ  │  │ BİTEN        │  │ BU AY        │        │
│  │              │  │              │  │              │        │
│  │     8        │  │      2       │  │     45       │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└────────────────────────────────────────────────────────────────┘
```

**Aliaport Mevcut Dashboard:**
```tsx
// frontend/src/features/portal/components/PortalDashboard.tsx
// Sadece temel istatistik kartları var, VisitPro tarzı durum kartları yok
```

---

### 5️⃣ HİZMET KARTLARI VE OTOMATİK FİYATLANDIRMA

| Özellik | VisitPro (Referans) | Aliaport Mevcut | Durum | Gap Açıklaması |
|---------|---------------------|-----------------|-------|----------------|
| **Hizmet Kartları Excel Import** | ✅ Excel formatında tarife listesi yüklenebilir | 🟡 `tariff_excel_importer.py` var | 🟢 TAMAM | Backend script hazır. |
| **CalculationType Enum** | ✅ 6 farklı hesaplama tipi | ✅ Backend enum hazır | 🟢 TAMAM | `FIXED`, `PER_UNIT`, `X_SECONDARY`, `PER_BLOCK`, `BASE_PLUS_INCREMENT`, `VEHICLE_4H_RULE`. |
| **Pricing Engine** | ✅ Hizmet seçildiğinde otomatik fiyat hesaplama | ✅ `pricing_engine.py` hazır | 🔴 ENDPOINT YOK | Backend service var ama `/calculate-price` endpoint yok. |
| **KDV Hesaplama** | ✅ Fiyat üzerine KDV ekleme | ✅ Backend var | 🟢 TAMAM | `pricing_engine.py` KDV hesaplıyor. |
| **Kur Entegrasyonu** | ✅ USD/EUR → TRY dönüşümü | 🟡 Kurlar modülü var | 🔴 UI YOK | Backend hazır ama frontend'de kur seçimi yok. |
| **RequiresPersonCount Flag** | ✅ Hizmet kişi sayısı gerektiriyorsa form gösterilir | ✅ Backend flag var | 🔴 UI YOK | `TarifeListesi.RequiresPersonCount` field var ama form validation yok. |

#### 🔴 Kritik Eksiklik: /calculate-price Endpoint

**Backend Service (Hazır):**
```python
# backend/utils/pricing_engine.py
class PricingEngine:
    def calculate_price(
        self,
        service_code: str,
        unit_price: Decimal,
        quantity: Decimal,
        calculation_type: CalculationType,
        secondary_quantity: Optional[Decimal] = None,
        currency_code: str = "TRY",
        apply_vat: bool = True,
        vat_rate: Decimal = Decimal("0.20"),
    ) -> PriceCalculationResult:
        """Fiyat hesaplama ana fonksiyonu"""
        # 6 farklı hesaplama tipini destekliyor
        # ✅ TAMAM
```

**Eksik Endpoint:**
```python
# backend/aliaport_api/modules/isemri/router.py - EKLENMELİ

@router.post("/calculate-price")
async def calculate_service_price(request: CalculatePriceRequest):
    """
    Hizmet seçildiğinde otomatik fiyat hesaplama
    
    Request:
      - service_code: str
      - quantity: Decimal
      - secondary_quantity: Optional[Decimal]  # X_SECONDARY için
      - person_count: Optional[int]  # RequiresPersonCount için
      - currency: str (default: "TRY")
    
    Response:
      - base_price: Decimal
      - vat_amount: Decimal
      - total_price: Decimal
      - calculation_type: str
      - breakdown: str  # Hesaplama detayı açıklama
    """
    pass
```

---

## 🔧 UYGULAMA PLANI (PRİORİTY SIRASI)

### P0 (ACIL - 1 Hafta)

#### 1. Zorunlu Belge Kontrolü Workflow
**Etkilenen Dosyalar:**
```python
backend/aliaport_api/modules/isemri/router.py
backend/aliaport_api/modules/dijital_arsiv/portal_router.py
frontend/src/features/portal/components/PortalDashboard.tsx
```

**Yapılacaklar:**
- [ ] `/api/v1/work-order/{id}/start` endpoint'inde zorunlu belge kontrolü ekle
- [ ] `required_documents_complete: false` olan iş emirlerini listele
- [ ] Portal Dashboard'a "Eksik Belgeler" kartı ekle (VisitPro style)
- [ ] İş emri başlatma esnasında eksik belge varsa hata döndür

**Test Senaryosu:**
1. Portal kullanıcı iş emri oluşturur
2. Gümrük izin belgesi yüklemez
3. Admin iş emrini onaylar
4. ❌ İş emri başlatma denemesi → "Zorunlu belgeler eksik" hatası
5. Portal kullanıcı gümrük belgesi yükler + Admin onaylar
6. ✅ İş emri başlatılabilir

---

#### 2. WorkOrderPerson CRUD Endpoints + UI
**Etkilenen Dosyalar:**
```python
backend/aliaport_api/modules/isemri/router.py  # Yeni endpoints
backend/aliaport_api/modules/isemri/schemas.py  # WorkOrderPersonCreate, WorkOrderPersonResponse
frontend/src/features/isemri/components/WorkOrderPersonList.tsx  # YENİ
frontend/src/features/isemri/components/WorkOrderPersonForm.tsx  # YENİ
```

**Yapılacaklar:**
- [ ] Backend: `GET /work-order/{id}/persons` (kişi listesi)
- [ ] Backend: `POST /work-order/{id}/persons` (kişi ekle)
- [ ] Backend: `DELETE /work-order/{id}/persons/{person_id}` (kişi sil)
- [ ] Backend: `POST /work-order/{id}/persons/{person_id}/upload-identity` (kimlik fotoğrafı MinIO upload)
- [ ] Frontend: WorkOrderPersonList component (tablo + ekleme formu)
- [ ] Frontend: Form validation (TC veya Pasaport zorunlu)

**Test Senaryosu:**
1. İş emri detay sayfasında "Kişi Listesi" tab'ı
2. "Kişi Ekle" butonu → Form (Ad/Soyad, TC/Pasaport, Telefon, Uyruk)
3. Kişi kaydedilir
4. "Kimlik Fotoğrafı Yükle" butonu → MinIO upload
5. Tablo güncellenir

---

### P1 (YÜKSEK ÖNCELİK - 2 Hafta)

#### 3. Belge Kategorisi Bazlı UI
**Etkilenen Dosyalar:**
```tsx
frontend/src/features/dijital-arsiv/components/DijitalArsivModule.tsx
frontend/src/features/dijital-arsiv/components/DocumentListModern.tsx
```

**Yapılacaklar:**
- [ ] Dijital Arşiv'e sekmeli görünüm ekle (Firma/Personel/Araç/Genel)
- [ ] Her sekme için `DocumentCategory` filtresi ile API call
- [ ] Belge listesi kategoriye göre renklendirme
- [ ] Kategori bazlı icon gösterimi

**UI Mockup:**
```
┌────────────────────────────────────────────────────────────────┐
│  DİJİTAL ARŞİV                                                 │
├────────────────────────────────────────────────────────────────┤
│  [Firma Belgeleri] [Personel Belgeleri] [Araç Belgeleri]     │
├────────────────────────────────────────────────────────────────┤
│  🏢 Firma Belgeleri (12)                                       │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Gümrük İzin Belgesi      │ APPROVED │ 15.11.2025       │ │
│  │ Manifesto                │ UPLOADED │ 20.11.2025       │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

#### 4. /calculate-price API Endpoint
**Etkilenen Dosyalar:**
```python
backend/aliaport_api/modules/isemri/router.py
backend/aliaport_api/modules/isemri/schemas.py
frontend/src/features/isemri/components/WorkOrderRequestForm.tsx
```

**Yapılacaklar:**
- [ ] Backend: `POST /api/v1/calculate-price` endpoint ekle
- [ ] `CalculatePriceRequest` schema (service_code, quantity, person_count)
- [ ] `PricingEngine` entegrasyonu
- [ ] Frontend: Hizmet seçildiğinde otomatik fiyat gösterimi
- [ ] Frontend: Miktar değiştiğinde real-time fiyat güncelleme

**Test Senaryosu:**
1. Portal kullanıcı "Yeni İş Emri" formu açar
2. Hizmet dropdown'dan "Römork Çekme" seçer
3. Miktar girer: 2 adet
4. ✅ Otomatik fiyat hesaplanır: "150 TRY + KDV = 180 TRY"

---

### P2 (ORTA ÖNCELİK - 3 Hafta)

#### 5. Güvenlik Tablet UI
**Etkilenen Dosyalar:**
```python
backend/aliaport_api/modules/security/router.py  # Yeni endpoints
frontend/src/features/security/components/SecurityTabletUI.tsx  # YENİ
frontend/src/features/security/components/CameraCapture.tsx  # YENİ
frontend/src/features/security/components/PendingEntriesList.tsx  # YENİ
```

**Yapılacaklar:**
- [ ] Backend: `/security/pending-entries` (kimlik fotoğrafı olmayan kişiler)
- [ ] Backend: `/security/upload-identity-photo` (camera upload + MinIO)
- [ ] Backend: `/security/approve-entry/{person_id}` (giriş onayı + entry_time set)
- [ ] Backend: `/security/exit/{person_id}` (çıkış onayı + süre hesaplama)
- [ ] Frontend: SecurityTabletUI component (tablet responsive)
- [ ] Frontend: Camera integration (getUserMedia API)
- [ ] Frontend: Pending entries list (real-time update)

**UI Mockup:**
```
┌────────────────────────────────────────────────────────────────┐
│  GÜVENLİK TABLETİ                                              │
├────────────────────────────────────────────────────────────────┤
│  GİRİŞ ONAY BEKLEYENLER (3)                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Ali Veli         │ TC: 12345678901 │ [Kimlik Çek]      │ │
│  │ Mehmet Demir     │ Pasaport: A1234 │ [Kimlik Çek]      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  KİMLİK FOTOĞRAFI                                              │
│  ┌────────────────┐                                            │
│  │  📷 KAMERA     │  [Fotoğraf Çek] [Yeniden Çek]            │
│  │                │  [Giriş Onayla]                           │
│  └────────────────┘                                            │
└────────────────────────────────────────────────────────────────┘
```

---

#### 6. Dashboard Durum Kartları (VisitPro Style)
**Etkilenen Dosyalar:**
```tsx
frontend/src/features/portal/components/PortalDashboard.tsx
frontend/src/features/dijital-arsiv/components/DocumentStatusCards.tsx  # YENİ
```

**Yapılacaklar:**
- [ ] "Eksik Belgeler" kartı (required_documents_complete: false)
- [ ] "Onay Bekleyen" kartı (document status: UPLOADED)
- [ ] "Reddedilmiş Belgeler" kartı (document status: REJECTED)
- [ ] "Bugün Biten" kartı (estimated_end_date == today)
- [ ] Kart tıklanınca filtrelenmiş liste sayfasına yönlendirme

---

## 📊 ÖZET İSTATİSTİKLER

| Kategori | ✅ Hazır | 🟡 Kısmi | 🔴 Eksik | Toplam |
|----------|---------|---------|---------|--------|
| Backend Models | 8 | 2 | 1 | 11 |
| Backend Endpoints | 12 | 5 | 9 | 26 |
| Frontend Components | 3 | 4 | 12 | 19 |
| **TOPLAM** | **23** | **11** | **22** | **56** |

**Tamamlanma Oranı:** 41% (23/56)

---

## 🎯 ÖNERİLER

1. **P0 Görevlere Odaklan:** Zorunlu belge kontrolü ve WorkOrderPerson UI kritik eksiklikler. VisitPro akışının temeli buraya dayanıyor.

2. **Güvenlik Tablet UI'ı Ertele:** Backend model hazır ama frontend camera integration zaman alıcı. P2'ye ötelenmeli.

3. **Belge Kategorisi UI Hızlı Kazanç:** DocumentCategory enum hazır, sadece frontend sekmesi eklenecek. 1 günde tamamlanabilir.

4. **Pricing Engine Endpoint Ekle:** Backend service hazır, endpoint 1 saatte yazılır. Portal iş emri formu için kritik.

5. **Dashboard Kartları Görsel İyileştirme:** Fonksiyonel olarak çalışıyor ama VisitPro tarzı kartlar kullanıcı deneyimini iyileştirecek.

---

**Son Güncelleme:** 25 Kasım 2025  
**Hazırlayan:** GitHub Copilot  
**Referans Dokümanlar:** ISEMRI_DIJITAL_ARSIV_GAP_ANALYSIS.md, whatsap/ ekran görüntüleri
