# İŞ EMRİ MODÜLÜ - Teknik Dokümantasyon

## 📋 Modül Özeti

**Modül Adı:** İş Emri (Work Order Management)  
**Versiyon:** 3.1.0  
**Durum:** ✅ Production Ready + Portal Entegrasyonu Planlı  
**Sorumlu Ekip:** Operations & Portal Team  
**İlgili Modüller:** Cari, Motorbot, Barınma, Saha Personel, Güvenlik  

---

## 🎯 Ne İşe Yarar?

İş Emri modülü, **liman operasyonları için merkezi iş takibi sistemi**dir. Müşterilerden gelen talepleri (portal veya manuel), operasyonel işlere (sahada yapılan hizmet) dönüştürüp, faturalandırma sürecine kadar yönetir.

**Kullanım Senaryoları:**
1. **Motorbot Hizmeti:** Gemi çekme, kılavuzluk (MbTrip ile entegre)
2. **Barınma Hizmeti:** Rıhtım kullanımı, iskele kiralama (BarinmaContract ile entegre)
3. **Genel Hizmet:** Vinç, römorkör, yükleme-boşaltma
4. **Diğer İşler:** Özel talep, bakım-onarım, lojistik destek

**Portal İş Akışı (Yeni):**
```
Portal Kullanıcı (Cari) → İş emri talebi oluştur (DRAFT)
                       ↓
            Aliaport Personel → Talep onay/red (APPROVED/REJECTED)
                       ↓
                  APPROVED → Sahaya iş emri gönder (SAHADA)
                       ↓
            Saha Ekibi → İş tamamla (TAMAMLANDI)
                       ↓
            Muhasebe → Fatura kes (FATURALANDI → KAPANDI)

REJECTED → Portal kullanıcı düzenle → Tekrar gönder (SUBMITTED)
```

**Manuel İş Akışı (Mevcut):**
```
Aliaport Personel → Direkt iş emri oluştur (APPROVED)
                 ↓
              SAHADA → TAMAMLANDI → FATURALANDI → KAPANDI
```

---

## 🗂️ Veritabanı Yapısı

### Tablo 1: `WorkOrder` (Ana İş Emri)

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `Id` | Integer | Primary Key | 1, 2, 3... |
| `wo_number` | String(50) | **İş emri numarası** (auto-generated) | "WO-2025-00123" |
| `cari_id` | Integer | FK → Cari.Id (müşteri/firma) | 45 |
| `cari_code` | String(20) | Cari kodu (hızlı arama) | "FRM001" |
| `cari_title` | String(255) | Cari ünvanı (snapshot) | "ABC Denizcilik A.Ş." |
| `wo_type` | Enum | İş türü (HIZMET/MOTORBOT/BARINMA/DIGER) | "MOTORBOT" |
| `service_id` | Integer | FK → Hizmet.Id (opsiyonel, HIZMET tipinde) | 12 |
| `service_code` | String(20) | Hizmet kodu (snapshot) | "SRV-VINC-01" |
| `action` | String(100) | Yapılacak işlem (serbest metin) | "Gemi çekme - Rıhtıma yanaştırma" |
| `subject` | String(255) | **İş konusu (başlık)** | "M/V NEPTUNE - Rıhtım Yanaşma" |
| `description` | Text | **Detaylı açıklama** | "105 metre boyunda konteyner gemisi..." |
| `priority` | Enum | Öncelik (DUSUK/NORMAL/YUKSEK/ACİL) | "YUKSEK" |
| `status` | Enum | **8 durum:** DRAFT, SUBMITTED, APPROVED, REJECTED, SAHADA, TAMAMLANDI, FATURALANDI, KAPANDI | "SAHADA" |
| `rejection_reason` | Text | Ret nedeni (REJECTED ise dolu) | "Eksik doküman - vinç ruhsatı yok" |
| `planned_start_date` | DateTime | Planlanan başlangıç | 2025-11-25 08:00:00 |
| `planned_end_date` | DateTime | Planlanan bitiş | 2025-11-25 14:00:00 |
| `actual_start_date` | DateTime | Gerçek başlangıç | 2025-11-25 08:15:00 |
| `actual_end_date` | DateTime | Gerçek bitiş | 2025-11-25 13:45:00 |
| `is_cabatoge_tr_flag` | Boolean | **Türk bayraklı gemi (%10 indirim)** | True |
| `apply_rule_addons` | Boolean | **Tarife kurallarını uygula** | True |
| `security_exit_time` | DateTime | **Güvenlik çıkış saati (4 saat kontrolü)** | 2025-11-25 17:45:00 |
| `attached_letter_approved` | Boolean | **Ekli yazı onaylandı (vinç izni)** | True |
| `total_amount` | Decimal(15,2) | Toplam tutar (TL) | 12500.00 |
| `currency` | String(3) | Para birimi | "TRY" |
| `invoice_number` | String(50) | Fatura numarası (FATURALANDI sonrası) | "FTR-2025-00456" |
| `invoice_date` | Date | Fatura tarihi | 2025-11-26 |
| `completed_date` | DateTime | Tamamlanma tarihi | 2025-11-25 13:45:00 |
| `CreatedAt` | DateTime | Kayıt zamanı | 2025-11-24 10:00:00 |
| `UpdatedAt` | DateTime | Son güncelleme | 2025-11-25 14:00:00 |
| `CreatedBy` | Integer | FK → User.Id (oluşturan) | 3 |
| `UpdatedBy` | Integer | FK → User.Id (güncelleyen) | 5 |

**Özel Alanlar Açıklaması:**

**1. is_cabatoge_tr_flag:**
- Kabotaj yasası: Türk limanları arası taşıma sadece Türk bayraklı gemilerle
- Türk bayraklı gemiye **%10 indirim** uygulanır
- Motorbot hizmetlerinde kullanılır

**2. apply_rule_addons:**
- Tarife modülünde tanımlı fiyatlandırma kurallarını uygula
- Örnek: "Gece vardiyası +%25", "Hafta sonu +%50"
- False ise manuel fiyat girişi

**3. security_exit_time:**
- Güvenlik çıkış kapısında zaman damgası
- 4 saat kuralı: İş emri bitiş - güvenlik çıkış > 4 saat ise ek ücret
- GateLog ile entegre

**4. attached_letter_approved:**
- Vinç, forklift gibi tehlikeli ekipman için izin belgesi
- True olmadan iş emri başlatılamaz (SAHADA'ya geçemez)

---

### Tablo 2: `WorkOrderItem` (İş Emri Kalemleri)

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `Id` | Integer | Primary Key | 1, 2, 3... |
| `work_order_id` | Integer | FK → WorkOrder.Id | 123 |
| `item_type` | Enum | **Kalem tipi (WORKLOG/RESOURCE/SERVICE)** | "WORKLOG" |
| `sequence` | Integer | Sıra numarası | 1, 2, 3... |
| `description` | Text | Kalem açıklaması | "Motorbot M123 - 2 saat çekme" |
| `resource_id` | Integer | FK → Motorbot.Id veya Ekipman.Id | 5 |
| `resource_code` | String(20) | Kaynak kodu (snapshot) | "MB-001" |
| `service_id` | Integer | FK → Hizmet.Id | 12 |
| `service_code` | String(20) | Hizmet kodu (snapshot) | "SRV-MOTORBOT" |
| `work_log_id` | Integer | FK → WorkLog.Id (saha personel) | 78 |
| `quantity` | Decimal(10,2) | Miktar | 2.00 |
| `unit` | String(20) | Birim (SAAT/ADET/TON/M2) | "SAAT" |
| `unit_price` | Decimal(15,2) | Birim fiyat (TL) | 2500.00 |
| `discount_percent` | Decimal(5,2) | İndirim % | 10.00 |
| `tax_percent` | Decimal(5,2) | KDV % | 20.00 |
| `subtotal` | Decimal(15,2) | Ara toplam (quantity × unit_price) | 5000.00 |
| `discount_amount` | Decimal(15,2) | İndirim tutarı | 500.00 |
| `tax_amount` | Decimal(15,2) | KDV tutarı | 900.00 |
| `total` | Decimal(15,2) | **Toplam (subtotal - discount + tax)** | 5400.00 |
| `is_invoiced` | Boolean | Faturalandı mı? | True |
| `invoice_line_id` | Integer | FK → InvoiceLine.Id (gelecek) | NULL |
| `start_time` | DateTime | Başlangıç zamanı (WORKLOG için) | 2025-11-25 08:15:00 |
| `end_time` | DateTime | Bitiş zamanı (WORKLOG için) | 2025-11-25 10:15:00 |
| `notes` | Text | Notlar | "Hava şartları iyiydi" |
| `CreatedAt` | DateTime | Kayıt zamanı | 2025-11-25 08:00:00 |
| `UpdatedAt` | DateTime | Son güncelleme | 2025-11-25 10:30:00 |

**item_type Açıklaması:**
- **WORKLOG:** Saha personel çalışma saati (WorkLog entegrasyonu)
- **RESOURCE:** Ekipman kullanımı (motorbot, vinç, römorkör)
- **SERVICE:** Hizmet kartı (Hizmet modülünden gelen standart hizmet)

---

### Tablo 3: `WorkOrderPerson` (İş Emri Kişi Listesi) 🆕

**Amaç:** Bazı hizmetler kişi sayısı gerektirir (teknik personel transferi, ziyaretçi girişi, enspektör ulaşımı). Bu tablo her iş emri için kimlik bilgilerini saklar ve güvenlik modülü ile entegre çalışır.

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `id` | Integer | Primary Key | 1, 2, 3... |
| `work_order_id` | Integer | FK → WorkOrder.Id | 123 |
| `work_order_item_id` | Integer | FK → WorkOrderItem.Id (opsiyonel) | 45 |
| `full_name` | String(200) | **Ad Soyad** | "Ahmet Yılmaz" |
| `tc_kimlik_no` | String(11) | **TC Kimlik Numarası** (Türk vatandaşı) | "12345678901" |
| `passport_no` | String(20) | **Pasaport Numarası** (yabancı) | "A1234567" |
| `nationality` | String(100) | Uyruk | "TR", "DE", "US" |
| `phone` | String(20) | Telefon | "+905551234567" |
| `identity_document_id` | Integer | FK → ArchiveDocument.Id (kimlik belgesi fotoğrafı) | 789 |
| `identity_photo_url` | String(500) | Kimlik belgesi fotoğrafı URL (MinIO) | "/minio/archive/identity_123.jpg" |
| `gate_entry_time` | DateTime | **Güvenlik giriş zamanı** | 2025-11-25 08:00:00 |
| `gate_exit_time` | DateTime | **Güvenlik çıkış zamanı** | 2025-11-25 17:30:00 |
| `approved_by_security` | Boolean | **Güvenlik onayı verildi mi?** | True |
| `approved_by_security_user_id` | Integer | FK → User.Id (güvenlik personeli) | 5 |
| `security_notes` | Text | Güvenlik notları | "Kimlik belgesi kontrolü yapıldı" |
| `created_at` | DateTime | Kayıt zamanı | 2025-11-25 07:00:00 |
| `updated_at` | DateTime | Son güncelleme | 2025-11-25 08:00:00 |

**Computed Properties:**
```python
@property
def duration_minutes(self) -> int:
    """Saha içinde kalma süresi (dakika)"""
    if self.gate_entry_time and self.gate_exit_time:
        delta = self.gate_exit_time - self.gate_entry_time
        return int(delta.total_seconds() / 60)
    return 0

@property
def has_identity_document(self) -> bool:
    """Kimlik belgesi fotoğrafı yüklendi mi?"""
    return self.identity_document_id is not None

@property
def identity_type(self) -> str:
    """Kimlik belgesi tipi"""
    if self.tc_kimlik_no:
        return "TC_KIMLIK"
    elif self.passport_no:
        return "PASAPORT"
    return "BILINMIYOR"
```

**Kullanım Senaryosu:**
```python
# Örnek: TEKNİSYEN, KLAS, DPA, ENSPEKTÖR transferi (3 kişi)

# 1. İş emri oluştur
work_order = WorkOrder(
    wo_type="HIZMET",
    subject="Teknik personel transferi - M/V NEPTUNE",
    cari_id=45
)

# 2. Hizmet kalemi ekle (TMP.017 - Teknisyen transferi)
work_order_item = WorkOrderItem(
    work_order_id=work_order.id,
    service_code="TMP.017",
    service_id=17,
    quantity=3,  # 3 kişi
    unit="KISI"
)

# 3. Kişi listesi ekle
persons = [
    WorkOrderPerson(
        work_order_id=work_order.id,
        work_order_item_id=work_order_item.id,
        full_name="Ahmet Yılmaz",
        tc_kimlik_no="12345678901",
        nationality="TR",
        phone="+905551234567"
    ),
    WorkOrderPerson(
        work_order_id=work_order.id,
        work_order_item_id=work_order_item.id,
        full_name="John Smith",
        passport_no="US1234567",
        nationality="US",
        phone="+15551234567"
    ),
    WorkOrderPerson(
        work_order_id=work_order.id,
        work_order_item_id=work_order_item.id,
        full_name="Maria Garcia",
        passport_no="ES7654321",
        nationality="ES",
        phone="+34555123456"
    )
]

# 4. Güvenlik onayı (tablet UI)
# - Güvenlik her kişinin kimlik fotoğrafını çeker (Dijital Arşiv entegrasyonu)
# - identity_document_id güncellenir
# - approved_by_security = True
# - gate_entry_time işaretlenir

# 5. Çıkış (tablet UI)
# - gate_exit_time işaretlenir
# - duration_minutes otomatik hesaplanır
```

**Güvenlik Entegrasyonu:**
- Güvenlik personeli tablette bu listeyi görür
- Her kişinin kimlik belgesini fotoğraflar → MinIO'ya yükler → `identity_document_id` günceller
- Giriş onayı verir → `gate_entry_time` işaretlenir
- Çıkış onayı verir → `gate_exit_time` işaretlenir
- GateLog tablosunda `work_order_person_id` FK ile bağlanır

**Frontend UI:**
```typescript
// İş emri oluştururken
<HizmetSelector onChange={handleServiceSelect} />

{selectedService?.RequiresPersonCount && (
  <PersonCountForm
    count={workOrderItem.quantity}
    onPersonAdd={(person) => addPersonToList(person)}
  />
)}

// Kişi formu
<Form>
  <Input name="full_name" label="Ad Soyad *" />
  <Select name="identity_type" options={["TC Kimlik", "Pasaport"]} />
  {identityType === "TC Kimlik" ? (
    <Input name="tc_kimlik_no" label="TC Kimlik No (11 haneli)" maxLength={11} />
  ) : (
    <Input name="passport_no" label="Pasaport Numarası" />
  )}
  <Input name="nationality" label="Uyruk" />
  <Input name="phone" label="Telefon" />
</Form>
```

---

### Enums (Python)

```python
# backend/aliaport_api/modules/isemri/models.py

class WorkOrderType(str, Enum):
    HIZMET = "HIZMET"        # Genel hizmet
    MOTORBOT = "MOTORBOT"    # Motorbot hizmeti
    BARINMA = "BARINMA"      # Barınma hizmeti
    DIGER = "DIGER"          # Diğer

class WorkOrderStatus(str, Enum):
    DRAFT = "DRAFT"                # Taslak (portal kullanıcı)
    SUBMITTED = "SUBMITTED"        # Onaya gönderildi (portal)
    APPROVED = "APPROVED"          # Onaylandı (personel tarafından)
    REJECTED = "REJECTED"          # Reddedildi
    SAHADA = "SAHADA"              # Sahada devam ediyor
    TAMAMLANDI = "TAMAMLANDI"      # Tamamlandı
    FATURALANDI = "FATURALANDI"    # Faturalandı
    KAPANDI = "KAPANDI"            # Kapatıldı

class WorkOrderPriority(str, Enum):
    DUSUK = "DUSUK"        # Düşük
    NORMAL = "NORMAL"      # Normal
    YUKSEK = "YUKSEK"      # Yüksek
    ACIL = "ACIL"          # Acil

class WorkOrderItemType(str, Enum):
    WORKLOG = "WORKLOG"    # Saha personel çalışma saati
    RESOURCE = "RESOURCE"  # Ekipman (motorbot, vinç...)
    SERVICE = "SERVICE"    # Hizmet kartı
```

---

## 🔌 API Endpoints

### Base URL: `/api/work-order`

| Method | Endpoint | Açıklama | Auth | Parametreler |
|--------|----------|----------|------|--------------|
| GET | `/api/work-order/` | İş emri listesi (sayfalı) | ✅ | `page`, `page_size`, `status`, `wo_type`, `cari_id`, `date_from`, `date_to` |
| GET | `/api/work-order/pending-approval` | **Onay bekleyen iş emirleri** (Portal) | ✅ Admin | - |
| GET | `/api/work-order/my-requests` | **Benim taleplerim** (Portal kullanıcı) | ✅ Portal | - |
| GET | `/api/work-order/archived` | Arşivlenmiş iş emirleri (30 gün+) | ✅ | - |
| GET | `/api/work-order/{wo_id}` | İş emri detayı (items dahil) | ✅ | `wo_id` |
| POST | `/api/work-order/` | **Yeni iş emri oluştur** | ✅ | JSON body |
| POST | `/api/work-order/portal-request` | **Portal talep oluştur (DRAFT)** | ✅ Portal | JSON body |
| PUT | `/api/work-order/{wo_id}` | İş emri güncelle | ✅ | `wo_id` + JSON body |
| PUT | `/api/work-order/{wo_id}/submit` | **Onaya gönder (DRAFT → SUBMITTED)** | ✅ Portal | `wo_id` |
| PUT | `/api/work-order/{wo_id}/approve` | **Onayla (SUBMITTED → APPROVED)** | ✅ Admin | `wo_id` |
| PUT | `/api/work-order/{wo_id}/reject` | **Reddet (SUBMITTED → REJECTED)** | ✅ Admin | `wo_id`, `rejection_reason` |
| PUT | `/api/work-order/{wo_id}/start` | **Sahaya gönder (APPROVED → SAHADA)** | ✅ | `wo_id` |
| PUT | `/api/work-order/{wo_id}/complete` | **Tamamla (SAHADA → TAMAMLANDI)** | ✅ | `wo_id`, `actual_end_date` |
| PUT | `/api/work-order/{wo_id}/invoice` | **Faturala (TAMAMLANDI → FATURALANDI)** | ✅ | `wo_id`, `invoice_number`, `invoice_date` |
| PUT | `/api/work-order/{wo_id}/close` | **Kapat (FATURALANDI → KAPANDI)** | ✅ Admin | `wo_id` |
| DELETE | `/api/work-order/{wo_id}` | İş emri sil (soft delete) | ✅ Admin | `wo_id` |
| POST | `/api/work-order/{wo_id}/items` | Kalem ekle | ✅ | `wo_id` + JSON body |
| PUT | `/api/work-order/items/{item_id}` | Kalem güncelle | ✅ | `item_id` + JSON body |
| DELETE | `/api/work-order/items/{item_id}` | Kalem sil | ✅ | `item_id` |
| GET | `/api/work-order/{wo_id}/calculate-total` | **Toplam tutarı hesapla** | ✅ | `wo_id` |

### Örnek Request/Response

**POST /api/work-order/portal-request (Portal Kullanıcı Talep)**
```json
{
  "wo_type": "MOTORBOT",
  "subject": "M/V NEPTUNE - Rıhtıma Yanaşma",
  "description": "105 metre konteyner gemisi, 15.000 ton, rıhtım 3'e yanaştırılacak",
  "action": "Gemi çekme ve yanaştırma",
  "priority": "YUKSEK",
  "planned_start_date": "2025-11-26T08:00:00",
  "planned_end_date": "2025-11-26T10:00:00",
  "is_cabatoge_tr_flag": true,
  "items": [
    {
      "item_type": "RESOURCE",
      "description": "Motorbot MB-001 - 2 saat",
      "quantity": 2.0,
      "unit": "SAAT"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "İş emri talebi oluşturuldu. Onay bekleniyor.",
  "data": {
    "Id": 123,
    "wo_number": "WO-2025-00123",
    "status": "DRAFT",
    "cari_id": 45,
    "cari_title": "ABC Denizcilik A.Ş.",
    "subject": "M/V NEPTUNE - Rıhtıma Yanaşma",
    "CreatedAt": "2025-11-25T14:30:00",
    "items_count": 1
  }
}
```

**PUT /api/work-order/123/approve (Personel Onay)**
```json
{
  "approval_notes": "Onaylandı - Motorbot MB-001 tahsis edildi"
}
```

**Response:**
```json
{
  "success": true,
  "message": "İş emri onaylandı. Sahaya gönderilebilir.",
  "data": {
    "Id": 123,
    "status": "APPROVED",
    "UpdatedAt": "2025-11-25T14:35:00"
  }
}
```

**PUT /api/work-order/123/reject (Personel Red)**
```json
{
  "rejection_reason": "Eksik doküman - Gemi manifestosu ve vinç ruhsatı gerekli"
}
```

**Response:**
```json
{
  "success": true,
  "message": "İş emri reddedildi. Portal kullanıcı düzenleme yapabilir.",
  "data": {
    "Id": 123,
    "status": "REJECTED",
    "rejection_reason": "Eksik doküman - Gemi manifestosu ve vinç ruhsatı gerekli",
    "can_edit": true
  }
}
```

**GET /api/work-order/pending-approval (Dashboard)**
```json
{
  "success": true,
  "message": "3 iş emri onay bekliyor",
  "data": {
    "count": 3,
    "items": [
      {
        "Id": 123,
        "wo_number": "WO-2025-00123",
        "cari_title": "ABC Denizcilik",
        "subject": "M/V NEPTUNE - Rıhtıma Yanaşma",
        "priority": "YUKSEK",
        "status": "SUBMITTED",
        "planned_start_date": "2025-11-26T08:00:00",
        "CreatedAt": "2025-11-25T14:30:00"
      }
    ]
  }
}
```

---

## 💻 Kod Yapısı

### Dosya Organizasyonu
```
backend/aliaport_api/modules/isemri/
├── __init__.py               # Router export
├── models.py                 # WorkOrder + WorkOrderItem
├── schemas.py                # Pydantic şemaları (Create/Update/Response)
├── router.py                 # FastAPI endpoints
└── business_logic.py         # İş kuralları, hesaplamalar

backend/aliaport_api/modules/isemri/services/
├── workflow_service.py       # Durum geçişleri (state machine)
├── pricing_service.py        # Fiyat hesaplama, tarife kuralları
└── portal_service.py         # Portal özel işlemler
```

### Katman Mimarisi
```
[Portal User] ──────────────────────┐
[Aliaport Staff] ───────────────────┤
                                    ↓
                          [FastAPI Router]
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
          [WorkflowService]              [PricingService]
          (State transitions)            (Tarife, indirim)
                    ↓                               ↓
                          [WorkOrder ORM]
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓               ↓               ↓
               [Cari]        [Motorbot]      [Barınma]
                    ↓               ↓               ↓
                          [SQLite DB]
```

**Önemli Kod Parçaları:**

**models.py - WorkOrder Model:**
```python
# backend/aliaport_api/modules/isemri/models.py

from sqlalchemy import Column, Integer, String, Text, Decimal, Boolean, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from enum import Enum

class WorkOrderType(str, Enum):
    HIZMET = "HIZMET"
    MOTORBOT = "MOTORBOT"
    BARINMA = "BARINMA"
    DIGER = "DIGER"

class WorkOrderStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SAHADA = "SAHADA"
    TAMAMLANDI = "TAMAMLANDI"
    FATURALANDI = "FATURALANDI"
    KAPANDI = "KAPANDI"

class WorkOrder(Base):
    __tablename__ = "WorkOrder"
    
    Id = Column(Integer, primary_key=True, index=True)
    wo_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # Cari bilgileri (snapshot)
    cari_id = Column(Integer, ForeignKey("Cari.Id"), nullable=False)
    cari_code = Column(String(20))
    cari_title = Column(String(255))
    
    # İş detayları
    wo_type = Column(SQLEnum(WorkOrderType), nullable=False)
    service_id = Column(Integer, ForeignKey("Hizmet.Id"))
    service_code = Column(String(20))
    action = Column(String(100))
    subject = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Öncelik ve durum
    priority = Column(SQLEnum(WorkOrderPriority), default=WorkOrderPriority.NORMAL)
    status = Column(SQLEnum(WorkOrderStatus), default=WorkOrderStatus.DRAFT, index=True)
    rejection_reason = Column(Text)
    
    # Zaman planlama
    planned_start_date = Column(DateTime)
    planned_end_date = Column(DateTime)
    actual_start_date = Column(DateTime)
    actual_end_date = Column(DateTime)
    
    # Özel alanlar
    is_cabatoge_tr_flag = Column(Boolean, default=False)  # Türk bayraklı %10 indirim
    apply_rule_addons = Column(Boolean, default=True)     # Tarife kuralları uygula
    security_exit_time = Column(DateTime)                 # 4 saat kontrolü
    attached_letter_approved = Column(Boolean, default=False)  # Vinç izni
    
    # Mali bilgiler
    total_amount = Column(Decimal(15, 2), default=0)
    currency = Column(String(3), default="TRY")
    invoice_number = Column(String(50))
    invoice_date = Column(DateTime)
    completed_date = Column(DateTime)
    
    # Audit
    CreatedAt = Column(DateTime, default=datetime.now)
    UpdatedAt = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    CreatedBy = Column(Integer, ForeignKey("User.Id"))
    UpdatedBy = Column(Integer, ForeignKey("User.Id"))
    
    # İlişkiler
    cari = relationship("Cari", back_populates="work_orders")
    items = relationship("WorkOrderItem", back_populates="work_order", cascade="all, delete-orphan")
    service = relationship("Hizmet", back_populates="work_orders")
    
    def generate_wo_number(self) -> str:
        """Auto-generate WO-2025-00123"""
        year = datetime.now().year
        # Son WO numarasını al, +1 yap
        last_wo = db.query(WorkOrder).filter(
            WorkOrder.wo_number.like(f"WO-{year}-%")
        ).order_by(WorkOrder.Id.desc()).first()
        
        if last_wo:
            last_num = int(last_wo.wo_number.split("-")[-1])
            new_num = last_num + 1
        else:
            new_num = 1
        
        return f"WO-{year}-{new_num:05d}"
    
    def can_transition_to(self, new_status: WorkOrderStatus) -> bool:
        """Durum geçiş kontrolü (state machine)"""
        transitions = {
            WorkOrderStatus.DRAFT: [WorkOrderStatus.SUBMITTED, WorkOrderStatus.APPROVED],
            WorkOrderStatus.SUBMITTED: [WorkOrderStatus.APPROVED, WorkOrderStatus.REJECTED],
            WorkOrderStatus.APPROVED: [WorkOrderStatus.SAHADA, WorkOrderStatus.REJECTED],
            WorkOrderStatus.REJECTED: [WorkOrderStatus.SUBMITTED],  # Düzenle → tekrar gönder
            WorkOrderStatus.SAHADA: [WorkOrderStatus.TAMAMLANDI],
            WorkOrderStatus.TAMAMLANDI: [WorkOrderStatus.FATURALANDI],
            WorkOrderStatus.FATURALANDI: [WorkOrderStatus.KAPANDI],
            WorkOrderStatus.KAPANDI: []  # Son durum
        }
        
        return new_status in transitions.get(self.status, [])
```

**workflow_service.py - Durum Geçişleri:**
```python
# backend/aliaport_api/modules/isemri/services/workflow_service.py

class WorkflowService:
    def __init__(self, db: Session):
        self.db = db
    
    def submit_for_approval(self, wo_id: int, user: User) -> WorkOrder:
        """Portal kullanıcı: DRAFT → SUBMITTED"""
        wo = self.db.query(WorkOrder).filter(WorkOrder.Id == wo_id).first()
        
        if not wo:
            raise HTTPException(404, "İş emri bulunamadı")
        
        # Portal kullanıcı sadece kendi iş emirlerini gönderebilir
        if wo.cari_id != user.cari_id:
            raise HTTPException(403, "Sadece kendi iş emirlerinizi gönderebilirsiniz")
        
        if wo.status != WorkOrderStatus.DRAFT:
            raise HTTPException(400, f"DRAFT durumundaki iş emirleri gönderilebilir (mevcut: {wo.status})")
        
        # Validasyonlar
        if not wo.subject or not wo.description:
            raise HTTPException(400, "Konu ve açıklama zorunludur")
        
        if not wo.items or len(wo.items) == 0:
            raise HTTPException(400, "En az 1 kalem eklenmelidir")
        
        wo.status = WorkOrderStatus.SUBMITTED
        wo.UpdatedAt = datetime.now()
        wo.UpdatedBy = user.Id
        
        self.db.commit()
        self.db.refresh(wo)
        
        # Email gönder (personele bildirim)
        self.send_approval_email(wo)
        
        return wo
    
    def approve(self, wo_id: int, user: User, notes: str = None) -> WorkOrder:
        """Personel: SUBMITTED → APPROVED"""
        wo = self.db.query(WorkOrder).filter(WorkOrder.Id == wo_id).first()
        
        if not wo:
            raise HTTPException(404, "İş emri bulunamadı")
        
        # Sadece admin/personel onaylayabilir
        if not user.has_permission("isemri:approve"):
            raise HTTPException(403, "İş emri onaylama yetkiniz yok")
        
        if wo.status != WorkOrderStatus.SUBMITTED:
            raise HTTPException(400, f"Sadece SUBMITTED durumundaki iş emirleri onaylanabilir")
        
        wo.status = WorkOrderStatus.APPROVED
        wo.UpdatedAt = datetime.now()
        wo.UpdatedBy = user.Id
        
        # Audit log
        self.db.add(AuditLog(
            event_type="WORK_ORDER_APPROVED",
            entity_type="WorkOrder",
            entity_id=wo.Id,
            user_id=user.Id,
            details={"wo_number": wo.wo_number, "notes": notes}
        ))
        
        self.db.commit()
        self.db.refresh(wo)
        
        # Email gönder (portal kullanıcıya bildirim)
        self.send_approval_notification_email(wo)
        
        return wo
    
    def reject(self, wo_id: int, user: User, rejection_reason: str) -> WorkOrder:
        """Personel: SUBMITTED → REJECTED"""
        wo = self.db.query(WorkOrder).filter(WorkOrder.Id == wo_id).first()
        
        if not wo:
            raise HTTPException(404, "İş emri bulunamadı")
        
        if not user.has_permission("isemri:approve"):
            raise HTTPException(403, "İş emri reddetme yetkiniz yok")
        
        if wo.status != WorkOrderStatus.SUBMITTED:
            raise HTTPException(400, "Sadece SUBMITTED durumundaki iş emirleri reddedilebilir")
        
        if not rejection_reason or len(rejection_reason) < 10:
            raise HTTPException(400, "Ret nedeni en az 10 karakter olmalıdır")
        
        wo.status = WorkOrderStatus.REJECTED
        wo.rejection_reason = rejection_reason
        wo.UpdatedAt = datetime.now()
        wo.UpdatedBy = user.Id
        
        self.db.commit()
        self.db.refresh(wo)
        
        # Email gönder (portal kullanıcıya)
        self.send_rejection_notification_email(wo)
        
        return wo
```

**pricing_service.py - Fiyat Hesaplama:**
```python
# backend/aliaport_api/modules/isemri/services/pricing_service.py

class PricingService:
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_total(self, wo: WorkOrder) -> Decimal:
        """İş emri toplam tutarını hesapla"""
        total = Decimal(0)
        
        for item in wo.items:
            # Ara toplam
            subtotal = item.quantity * item.unit_price
            
            # İndirim
            discount = subtotal * (item.discount_percent / 100) if item.discount_percent else 0
            
            # Vergi (KDV)
            taxable = subtotal - discount
            tax = taxable * (item.tax_percent / 100) if item.tax_percent else 0
            
            # Kalem toplamı
            item.subtotal = subtotal
            item.discount_amount = discount
            item.tax_amount = tax
            item.total = subtotal - discount + tax
            
            total += item.total
        
        # Türk bayraklı indirim (%10)
        if wo.is_cabatoge_tr_flag:
            total = total * Decimal(0.90)
        
        # Tarife kuralları (gece vardiyası, hafta sonu vs.)
        if wo.apply_rule_addons:
            total = self.apply_pricing_rules(wo, total)
        
        wo.total_amount = total
        self.db.commit()
        
        return total
    
    def apply_pricing_rules(self, wo: WorkOrder, base_total: Decimal) -> Decimal:
        """Tarife modülünden kuralları uygula"""
        # Örnek kurallar
        multiplier = Decimal(1.0)
        
        # Gece vardiyası (22:00 - 06:00) → +%25
        if wo.planned_start_date:
            hour = wo.planned_start_date.hour
            if hour >= 22 or hour < 6:
                multiplier += Decimal(0.25)
        
        # Hafta sonu (Cumartesi/Pazar) → +%50
        if wo.planned_start_date and wo.planned_start_date.weekday() in [5, 6]:
            multiplier += Decimal(0.50)
        
        # Acil işlem → +%30
        if wo.priority == WorkOrderPriority.ACIL:
            multiplier += Decimal(0.30)
        
        return base_total * multiplier
```

---

## 🔧 Geliştirme Geçmişi

### Faz 1: Temel İş Emri (Tamamlandı)
- ✅ WorkOrder + WorkOrderItem modeller
- ✅ CRUD endpoints
- ✅ 8 durum state machine
- ✅ Cari, Hizmet entegrasyonu

### Faz 2: Özel Alanlar (Tamamlandı)
- ✅ is_cabatoge_tr_flag (Türk bayraklı %10 indirim)
- ✅ apply_rule_addons (tarife kuralları)
- ✅ security_exit_time (4 saat kontrolü)
- ✅ attached_letter_approved (vinç izni)

### Faz 3: Portal Entegrasyonu (Planlanan) ⏳
- ⏳ Portal kullanıcı auth (email + password)
- ⏳ DRAFT → SUBMITTED → APPROVED/REJECTED workflow
- ⏳ `/portal-request` endpoint
- ⏳ `/pending-approval` dashboard (personel)
- ⏳ `/my-requests` liste (portal kullanıcı)
- ⏳ Email notifications (onay/red bildirimleri)

### Faz 4: Arşivleme (Planlanan)
- ⏳ 30 gün sonra otomatik arşiv (KAPANDI durumu)
- ⏳ `/archived` endpoint
- ⏳ "Arşivi Göster" checkbox (frontend)

### Faz 5: Fatura Entegrasyonu (Gelecek)
- ⏳ Invoice modülü ile ilişki
- ⏳ FATURALANDI → Invoice.Id foreign key
- ⏳ WorkOrderItem → InvoiceLine mapping

---

## 📊 İş Kuralları ve Validasyonlar

### Durum Geçiş Kuralları (State Machine)
```
DRAFT ──────────┐
                ↓
            SUBMITTED ──────┐
                ↓           ↓
            APPROVED    REJECTED ──┐
                ↓           ↑       │
            SAHADA          │←──────┘ (Düzenle → tekrar gönder)
                ↓
            TAMAMLANDI
                ↓
            FATURALANDI
                ↓
            KAPANDI (Final)
```

**Yetki Kontrolü:**
- **DRAFT → SUBMITTED:** Sadece portal kullanıcı (kendi iş emirleri)
- **SUBMITTED → APPROVED/REJECTED:** Sadece admin/personel (isemri:approve izni)
- **APPROVED → SAHADA:** Personel (isemri:manage izni)
- **SAHADA → TAMAMLANDI:** Saha ekibi (isemri:complete izni)
- **TAMAMLANDI → FATURALANDI:** Muhasebe (isemri:invoice izni)
- **FATURALANDI → KAPANDI:** Admin (isemri:close izni)

### Validasyon Kuralları
1. **subject:** Zorunlu, min 5 karakter
2. **description:** Zorunlu, min 20 karakter (portal talep)
3. **items:** En az 1 kalem (portal talep)
4. **planned_start_date:** Bugün veya gelecek tarih
5. **planned_end_date:** planned_start_date'den sonra
6. **rejection_reason:** Red ediliyorsa zorunlu (min 10 karakter)
7. **attached_letter_approved:** Vinç/forklift işlerinde True olmalı

### Özel Kural: 4 Saat Kontrolü
```python
# Güvenlik çıkış saati ile iş emri bitiş arasındaki fark > 4 saat ise ek ücret

if wo.security_exit_time and wo.actual_end_date:
    time_diff = (wo.security_exit_time - wo.actual_end_date).total_seconds() / 3600
    
    if time_diff > 4:
        # Ek ücret ekle (örnek: 4 saatten sonra her saat +500 TL)
        extra_hours = int(time_diff - 4)
        extra_charge = extra_hours * 500
        
        # WorkOrderItem olarak ekle
        db.add(WorkOrderItem(
            work_order_id=wo.Id,
            item_type=WorkOrderItemType.SERVICE,
            description=f"Bekleme ücreti ({extra_hours} saat)",
            quantity=extra_hours,
            unit="SAAT",
            unit_price=500,
            total=extra_charge
        ))
```

---

## 🔗 Diğer Modüllerle İlişkiler

### Cari Modülü
```sql
WorkOrder.cari_id → Cari.Id
WorkOrder.cari_code, cari_title (snapshot, Cari silinse bile korunur)
```

### Motorbot Modülü
```sql
WorkOrder.wo_type = 'MOTORBOT'
WorkOrderItem.resource_id → Motorbot.Id (motorbot tahsisi)
```

### Barınma Modülü
```sql
WorkOrder.wo_type = 'BARINMA'
WorkOrderItem.resource_id → BarinmaContract.Id (rıhtım kullanımı)
```

### Saha Personel (WorkLog)
```sql
WorkOrderItem.item_type = 'WORKLOG'
WorkOrderItem.work_log_id → WorkLog.Id
WorkOrderItem.start_time, end_time (çalışma saatleri)
```

### Güvenlik (GateLog)
```sql
WorkOrder.security_exit_time ← GateLog.exit_time (4 saat kontrolü için)
```

### Kurlar Modülü
```sql
WorkOrder.invoice_date → ExchangeRate.RateDate (döviz kuru çevrimi)
```

---

## 🎨 Frontend Entegrasyonu

### Kullanılan Componentler
```
frontend/src/features/isemri/
├── api/
│   └── isemriApi.ts                    # API client
├── components/
│   ├── WorkOrderList.tsx               # İş emri listesi
│   ├── WorkOrderDetail.tsx             # Detay modal
│   ├── PortalRequestForm.tsx           # Portal talep formu
│   ├── ApprovalQueue.tsx               # Onay bekleyen iş emirleri (dashboard)
│   ├── MyRequests.tsx                  # Benim taleplerim (portal kullanıcı)
│   └── WorkOrderStatusBadge.tsx        # Status badge (8 durum, renk kodlu)
├── hooks/
│   └── useIsemriQueries.ts            # React Query hooks
└── types/
    └── isemri.ts                       # TypeScript types
```

### Portal Kullanıcı Arayüzü (Planlanan)

**PortalRequestForm.tsx:**
```typescript
// Portal kullanıcı sadece talep formu görür

<Form onSubmit={handleSubmit}>
  {/* İş Türü */}
  <Select name="wo_type" options={["MOTORBOT", "BARINMA", "HIZMET", "DIGER"]} />
  
  {/* Başlık */}
  <Input name="subject" required minLength={5} placeholder="Örn: M/V NEPTUNE - Rıhtıma Yanaşma" />
  
  {/* Açıklama */}
  <Textarea name="description" required minLength={20} rows={6} />
  
  {/* Planlanan Tarih */}
  <DateTimePicker name="planned_start_date" min={new Date()} />
  <DateTimePicker name="planned_end_date" />
  
  {/* Öncelik */}
  <Select name="priority" options={["NORMAL", "YUKSEK", "ACIL"]} />
  
  {/* Türk Bayraklı Gemi */}
  <Checkbox name="is_cabatoge_tr_flag" label="Türk bayraklı gemi (%10 indirim)" />
  
  {/* Kalem Ekleme */}
  <ItemsTable>
    <button onClick={addItem}>+ Kalem Ekle</button>
    {items.map(item => (
      <ItemRow>
        <Input name="description" placeholder="Örn: Motorbot 2 saat" />
        <Input name="quantity" type="number" step="0.01" />
        <Select name="unit" options={["SAAT", "ADET", "TON"]} />
        <button onClick={() => removeItem(item.id)}>Sil</button>
      </ItemRow>
    ))}
  </ItemsTable>
  
  {/* Submit */}
  <div className="flex gap-2">
    <Button type="submit" variant="primary">Taslak Olarak Kaydet (DRAFT)</Button>
    <Button type="button" onClick={submitForApproval}>Onaya Gönder (SUBMITTED)</Button>
  </div>
</Form>
```

**ApprovalQueue.tsx (Personel Dashboard):**
```typescript
// Personel: Onay bekleyen iş emirlerini görür

const { data: pendingWorkOrders } = useQuery(['pending-approval'], () =>
  fetchPendingApproval()
);

return (
  <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
    <h3 className="text-lg font-bold">⚠️ Onay Bekleyen İş Emirleri</h3>
    <p className="text-sm text-gray-600">{pendingWorkOrders.count} talep bekliyor</p>
    
    <Table>
      <thead>
        <tr>
          <th>İş Emri No</th>
          <th>Müşteri</th>
          <th>Konu</th>
          <th>Öncelik</th>
          <th>Talep Tarihi</th>
          <th>İşlem</th>
        </tr>
      </thead>
      <tbody>
        {pendingWorkOrders.items.map(wo => (
          <tr key={wo.Id}>
            <td>{wo.wo_number}</td>
            <td>{wo.cari_title}</td>
            <td>{wo.subject}</td>
            <td>
              <Badge color={wo.priority === 'ACIL' ? 'red' : 'yellow'}>
                {wo.priority}
              </Badge>
            </td>
            <td>{formatDate(wo.CreatedAt)}</td>
            <td>
              <button onClick={() => openDetailModal(wo.Id)} className="text-blue-600">
                İncele
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  </div>
);
```

**WorkOrderDetail.tsx (Detay Modal):**
```typescript
// İş emri detayı (items dahil) + Onay/Red butonları

const { data: workOrder } = useQuery(['work-order', woId], () =>
  fetchWorkOrderDetail(woId)
);

return (
  <Modal>
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{workOrder.wo_number}</h2>
        <WorkOrderStatusBadge status={workOrder.status} />
      </div>
      
      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label className="text-sm text-gray-600">Müşteri</label>
          <p className="font-medium">{workOrder.cari_title}</p>
        </div>
        <div>
          <label className="text-sm text-gray-600">Öncelik</label>
          <p className="font-medium">{workOrder.priority}</p>
        </div>
        <div className="col-span-2">
          <label className="text-sm text-gray-600">Konu</label>
          <p className="font-medium">{workOrder.subject}</p>
        </div>
        <div className="col-span-2">
          <label className="text-sm text-gray-600">Açıklama</label>
          <p className="text-gray-700">{workOrder.description}</p>
        </div>
      </div>
      
      {/* Items Table */}
      <h3 className="text-lg font-bold mt-6">Kalemler</h3>
      <Table>
        <thead>
          <tr>
            <th>Açıklama</th>
            <th>Miktar</th>
            <th>Birim</th>
            <th>Birim Fiyat</th>
            <th>Toplam</th>
          </tr>
        </thead>
        <tbody>
          {workOrder.items.map(item => (
            <tr key={item.Id}>
              <td>{item.description}</td>
              <td>{item.quantity}</td>
              <td>{item.unit}</td>
              <td>{formatCurrency(item.unit_price)}</td>
              <td>{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      {/* Total */}
      <div className="text-right mt-4">
        <p className="text-2xl font-bold text-green-600">
          Toplam: {formatCurrency(workOrder.total_amount)} {workOrder.currency}
        </p>
      </div>
      
      {/* Actions (status=SUBMITTED ise) */}
      {workOrder.status === 'SUBMITTED' && (
        <div className="flex gap-2 mt-6">
          <Button onClick={() => approve(woId)} variant="success">
            ✅ Onayla
          </Button>
          <Button onClick={() => openRejectModal(woId)} variant="danger">
            ❌ Reddet
          </Button>
        </div>
      )}
      
      {/* Rejection Reason (status=REJECTED ise) */}
      {workOrder.status === 'REJECTED' && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-6">
          <h4 className="font-bold text-red-700">Red Nedeni:</h4>
          <p className="text-red-600">{workOrder.rejection_reason}</p>
        </div>
      )}
    </div>
  </Modal>
);
```

---

## 🚀 Deployment Notları

### Database Migration
```sql
-- WorkOrder tablosu oluşturma
CREATE TABLE WorkOrder (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    wo_number VARCHAR(50) UNIQUE NOT NULL,
    cari_id INTEGER NOT NULL,
    cari_code VARCHAR(20),
    cari_title VARCHAR(255),
    wo_type VARCHAR(20) CHECK (wo_type IN ('HIZMET', 'MOTORBOT', 'BARINMA', 'DIGER')),
    service_id INTEGER,
    service_code VARCHAR(20),
    action VARCHAR(100),
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) CHECK (priority IN ('DUSUK', 'NORMAL', 'YUKSEK', 'ACIL')) DEFAULT 'NORMAL',
    status VARCHAR(20) CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'SAHADA', 'TAMAMLANDI', 'FATURALANDI', 'KAPANDI')) DEFAULT 'DRAFT',
    rejection_reason TEXT,
    planned_start_date DATETIME,
    planned_end_date DATETIME,
    actual_start_date DATETIME,
    actual_end_date DATETIME,
    is_cabatoge_tr_flag BOOLEAN DEFAULT 0,
    apply_rule_addons BOOLEAN DEFAULT 1,
    security_exit_time DATETIME,
    attached_letter_approved BOOLEAN DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'TRY',
    invoice_number VARCHAR(50),
    invoice_date DATETIME,
    completed_date DATETIME,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreatedBy INTEGER,
    UpdatedBy INTEGER,
    FOREIGN KEY (cari_id) REFERENCES Cari(Id),
    FOREIGN KEY (service_id) REFERENCES Hizmet(Id),
    FOREIGN KEY (CreatedBy) REFERENCES User(Id),
    FOREIGN KEY (UpdatedBy) REFERENCES User(Id)
);

-- İndeksler
CREATE INDEX ix_workorder_wo_number ON WorkOrder(wo_number);
CREATE INDEX ix_workorder_status ON WorkOrder(status);
CREATE INDEX ix_workorder_cari_id ON WorkOrder(cari_id);
CREATE INDEX ix_workorder_created_at ON WorkOrder(CreatedAt);
```

### Monitoring
```python
# Prometheus metrikleri
from prometheus_client import Counter, Histogram

isemri_created_counter = Counter(
    'isemri_created_total',
    'Oluşturulan iş emri sayısı',
    ['wo_type', 'status']
)

isemri_approval_duration = Histogram(
    'isemri_approval_duration_seconds',
    'SUBMITTED → APPROVED/REJECTED süresi'
)

# Kullanım
isemri_created_counter.labels(wo_type='MOTORBOT', status='DRAFT').inc()
```

---

## 🧪 Test Senaryoları

### Unit Tests
```python
# tests/test_isemri.py

def test_create_portal_request():
    """Portal kullanıcı talep oluşturma"""
    response = client.post("/api/work-order/portal-request", json={
        "wo_type": "MOTORBOT",
        "subject": "Test İş Emri",
        "description": "Bu bir test iş emridir, detaylı açıklama burada",
        "priority": "NORMAL",
        "planned_start_date": "2025-12-01T08:00:00",
        "items": [
            {"item_type": "RESOURCE", "description": "Motorbot 2 saat", "quantity": 2, "unit": "SAAT"}
        ]
    }, headers={"Authorization": f"Bearer {portal_user_token}"})
    
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["status"] == "DRAFT"
    assert data["wo_number"].startswith("WO-2025-")

def test_submit_for_approval():
    """DRAFT → SUBMITTED"""
    wo = create_work_order(status="DRAFT", cari_id=portal_user.cari_id)
    
    response = client.put(f"/api/work-order/{wo.Id}/submit", headers={"Authorization": f"Bearer {portal_user_token}"})
    
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "SUBMITTED"

def test_approve():
    """Personel onay: SUBMITTED → APPROVED"""
    wo = create_work_order(status="SUBMITTED")
    
    response = client.put(f"/api/work-order/{wo.Id}/approve", json={
        "approval_notes": "Onaylandı"
    }, headers={"Authorization": f"Bearer {admin_token}"})
    
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "APPROVED"

def test_reject():
    """Personel red: SUBMITTED → REJECTED"""
    wo = create_work_order(status="SUBMITTED")
    
    response = client.put(f"/api/work-order/{wo.Id}/reject", json={
        "rejection_reason": "Eksik doküman - Gemi manifestosu gerekli"
    }, headers={"Authorization": f"Bearer {admin_token}"})
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "REJECTED"
    assert data["rejection_reason"] is not None

def test_cabatoge_discount():
    """Türk bayraklı gemi %10 indirim"""
    wo = create_work_order(is_cabatoge_tr_flag=True)
    add_item(wo, quantity=10, unit_price=1000)  # 10 × 1000 = 10000
    
    total = pricing_service.calculate_total(wo)
    
    assert total == Decimal(9000)  # 10000 × 0.90 = 9000
```

### Integration Tests
- Portal kullanıcı → talep → onay → sahada → tamamlandı → faturalandı (end-to-end)
- 4 saat kontrolü (security_exit_time)
- Email notifications (onay/red bildirimleri)

---

## 📚 Kaynaklar ve Referanslar

### İlgili Dosyalar
- `backend/aliaport_api/modules/isemri/models.py`
- `backend/aliaport_api/modules/isemri/router.py`
- `backend/aliaport_api/modules/isemri/services/workflow_service.py`
- `backend/aliaport_api/modules/isemri/services/pricing_service.py`
- `frontend/src/features/isemri/components/PortalRequestForm.tsx`

### İlgili Runbook'lar
- `DEPLOYMENT_RUNBOOK.md`: Production deployment (Faz 7: Portal kurulumu)
- `01_MODUL_CARI.md`: Cari entegrasyonu
- `02_MODUL_MOTORBOT.md`: Motorbot entegrasyonu

---

## 🆕 OTOMATİK FİYATLANDIRMA AKIŞI (25 Kasım 2025)

### Tarife + Kur Entegrasyonu

İş emri oluşturulurken hizmet fiyatları otomatik hesaplanır:

**1. Hizmet Seçimi**
```python
# Frontend: Hizmet kartı seçildi
selected_service = {
    "Kod": "TMP.006",
    "Ad": "Transpalet Kullanımı",
    "Fiyat": 20.00,
    "ParaBirimi": "USD",
    "Birim": "SAAT",
    "CalculationType": "PER_UNIT",
    "FormulaParams": {"unit": "SAAT"},
    "RequiresPersonCount": False
}

# Backend: Geçerli tarife kontrolü
from modules.hizmet.services import get_active_tariff

tarife = get_active_tariff(
    hizmet_kod="TMP.006",
    tarih=date.today()
)

# Tarife override varsa kullan
fiyat = tarife.OverridePrice if tarife else selected_service["Fiyat"]
currency = tarife.OverrideCurrency if tarife else selected_service["ParaBirimi"]
```

**2. Kur Çevirme (USD/EUR → TRY)**
```python
from modules.kurlar.services import get_today_rate

if currency != "TRY":
    kur_data = get_today_rate(
        currency_from=currency,
        currency_to="TRY",
        date=date.today()
    )
    kur = kur_data["sell_rate"]
else:
    kur = 1.0

# Örnek: USD = 32.50 TL
```

**3. Pricing Engine Hesaplama**
```python
from modules.hizmet.pricing_engine import PricingEngine

engine = PricingEngine()

result = engine.calculate(
    calculation_type=selected_service["CalculationType"],
    base_price=Decimal(str(fiyat)),
    formula_params=selected_service["FormulaParams"],
    input_data={"quantity": 3},  # 3 saat
    currency=currency
)

# Sonuç:
# {
#   "subtotal": 60.0,  # 20 × 3
#   "calculation_details": "20.0 USD × 3 SAAT = 60.0 USD",
#   "breakdown": {...},
#   "currency": "USD"
# }
```

**4. TL'ye Çevirme + KDV**
```python
subtotal_usd = result["subtotal"]  # 60.0 USD
subtotal_try = subtotal_usd * Decimal(str(kur))  # 60.0 × 32.50 = 1950.0 TL

kdv_oran = selected_service.get("KdvOrani", 20)  # %20
kdv_tutar = subtotal_try * (Decimal(kdv_oran) / 100)  # 1950 × 0.20 = 390 TL
genel_toplam = subtotal_try + kdv_tutar  # 1950 + 390 = 2340 TL
```

**5. WorkOrderItem Kaydet**
```python
work_order_item = WorkOrderItem(
    work_order_id=work_order.id,
    item_type="SERVICE",
    service_id=selected_service["Id"],
    service_code=selected_service["Kod"],
    description=f"{selected_service['Ad']} - {result['calculation_details']}",
    quantity=Decimal("3"),
    unit="SAAT",
    unit_price=subtotal_try / Decimal("3"),  # 1950 / 3 = 650 TL/saat
    subtotal=subtotal_try,  # 1950 TL
    tax_percent=Decimal(str(kdv_oran)),  # 20
    tax_amount=kdv_tutar,  # 390 TL
    total=genel_toplam  # 2340 TL
)
```

**6. WorkOrder Total Güncelle**
```python
def update_work_order_total(work_order_id: int):
    """Tüm kalemlerin toplamını hesapla"""
    items = db.query(WorkOrderItem).filter(
        WorkOrderItem.work_order_id == work_order_id
    ).all()
    
    total = sum(item.total for item in items)
    
    # Cabotage discount (%10 Türk bayraklı gemi)
    if work_order.is_cabatoge_tr_flag:
        total = total * Decimal("0.90")
    
    work_order.total_amount = total
    work_order.currency = "TRY"
    db.commit()
```

---

### Kompleks Hesaplama Örnekleri

#### Örnek 1: Forklift (PER_BLOCK)
```python
# Excel Tarife:
# TMP.020 - Forklift Kullanımı
# Fiyat: 80 USD
# FiyatModeli: PER_BLOCK
# ModelParam: {"base_weight_ton": 3, "base_time_min": 30}

# İş emri kalem:
quantity_input = {
    "weight": 5,      # 5 ton
    "minutes": 45     # 45 dakika
}

# Hesaplama:
result = engine.calculate(
    calculation_type=CalculationType.PER_BLOCK,
    base_price=Decimal("80.00"),
    formula_params={"base_weight_ton": 3, "base_time_min": 30},
    input_data=quantity_input,
    currency="USD"
)

# Sonuç:
# 80 × (5/3) × ceil(45/30) = 80 × 1.67 × 2 = 267.20 USD
# Kur: 32.50 TL
# TL: 267.20 × 32.50 = 8684.00 TL
# KDV (%20): 1736.80 TL
# TOPLAM: 10420.80 TL
```

#### Örnek 2: Ardiye (X_SECONDARY - KG × GÜN)
```python
# Excel Tarife:
# TMP.025 - Ardiye Hizmeti
# Fiyat: 0.03 USD
# FiyatModeli: X_SECONDARY
# ModelParam: {
#   "primary_field": "weight",
#   "secondary_field": "days",
#   "secondary_rounding": "ceil"
# }

# İş emri kalem:
quantity_input = {
    "weight": 500,    # 500 KG
    "days": 3         # 3 gün
}

# Hesaplama:
result = engine.calculate(
    calculation_type=CalculationType.X_SECONDARY,
    base_price=Decimal("0.03"),
    formula_params={
        "primary_field": "weight",
        "secondary_field": "days",
        "secondary_rounding": "ceil"
    },
    input_data=quantity_input,
    currency="USD"
)

# Sonuç:
# 0.03 × 500 KG × 3 GÜN = 45.00 USD
# Kur: 32.50 TL
# TL: 45.00 × 32.50 = 1462.50 TL
# KDV (%20): 292.50 TL
# TOPLAM: 1755.00 TL
```

#### Örnek 3: Araç Giriş (VEHICLE_4H_RULE - 4 Saat Kuralı)
```python
# Excel Tarife:
# TMP.030 - Araç Giriş Ücreti
# Fiyat: 15.00 USD
# FiyatModeli: VEHICLE_4H_RULE
# ModelParam: {"base_minutes": 240}

# İş emri kalem:
quantity_input = {
    "minutes": 450    # 7.5 saat (450 dakika)
}

# Hesaplama:
result = engine.calculate(
    calculation_type=CalculationType.VEHICLE_4H_RULE,
    base_price=Decimal("15.00"),
    formula_params={"base_minutes": 240},
    input_data=quantity_input,
    currency="USD"
)

# Sonuç:
# İlk 240 dk: 15.00 USD (kesin)
# Aşan 210 dk: (15.00 / 240) × 210 = 13.125 USD
# Toplam: 15.00 + 13.125 = 28.125 USD
# Kur: 32.50 TL
# TL: 28.125 × 32.50 = 914.06 TL
# KDV (%20): 182.81 TL
# TOPLAM: 1096.87 TL

# Güvenlik entegrasyonu:
gate_log = GateLog(
    work_order_id=work_order.id,
    work_order_person_id=None,  # Araç (sürücü opsiyonel)
    vehicle_plate="34 ABC 123",
    entry_time=datetime(2025, 11, 25, 8, 0, 0),
    exit_time=datetime(2025, 11, 25, 15, 30, 0),  # 7.5 saat
    duration_minutes=450,
    base_charge_hours=4,
    extra_minutes=210,
    extra_charge_calculated=Decimal("13.125")
)
```

---

### API Endpoint: Otomatik Fiyatlandırma

```python
# backend/aliaport_api/modules/isemri/router.py

@router.post("/work-order/calculate-price")
@require_auth()
async def calculate_service_price(
    request: CalculatePriceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Hizmet fiyatını otomatik hesapla
    
    Request Body:
    {
        "hizmet_kod": "TMP.006",
        "tarih": "2025-11-25",
        "input_data": {"quantity": 3}
    }
    
    Response:
    {
        "hizmet_kod": "TMP.006",
        "fiyat_para_birimi": "USD",
        "fiyat_baz": 20.0,
        "kur": 32.50,
        "hesaplama_detay": "20.0 USD × 3 SAAT = 60.0 USD",
        "ara_toplam": 60.0,
        "ara_toplam_try": 1950.0,
        "kdv_oran": 20.0,
        "kdv_tutar": 390.0,
        "genel_toplam": 2340.0,
        "tarife_versiyonu": "2025 Yaz Tarifesi"
    }
    """
    from modules.hizmet.services import calculate_service_price
    
    result = calculate_service_price(
        hizmet_kod=request.hizmet_kod,
        tarih=request.tarih,
        input_data=request.input_data
    )
    
    return api_response(data=result, message="Fiyat hesaplandı")
```

**Frontend Kullanımı:**
```typescript
// İş emri oluştururken hizmet seçildiğinde
const handleServiceSelect = async (service: Service) => {
  const response = await api.post('/work-order/calculate-price', {
    hizmet_kod: service.Kod,
    tarih: workOrder.planned_start_date,
    input_data: {
      quantity: 3  // Kullanıcıdan miktar girişi
    }
  });
  
  const price = response.data;
  
  // WorkOrderItem formunu doldur
  setWorkOrderItem({
    service_code: price.hizmet_kod,
    description: price.hesaplama_detay,
    quantity: 3,
    unit: service.Birim,
    unit_price: price.ara_toplam_try / 3,
    subtotal: price.ara_toplam_try,
    tax_percent: price.kdv_oran,
    tax_amount: price.kdv_tutar,
    total: price.genel_toplam
  });
};
```

---

### Güvenlik Onay Akışı

**WorkOrderPerson → GateLog Entegrasyonu:**

```python
# 1. İş emri oluşturuldu (3 kişi)
work_order = WorkOrder(...)
persons = [WorkOrderPerson(...), WorkOrderPerson(...), WorkOrderPerson(...)]

# 2. Güvenlik tablet UI - Kişi listesi
GET /api/security/pending-entries

Response:
[
  {
    "work_order_id": 123,
    "work_order_number": "WO-2025-00123",
    "persons": [
      {"id": 1, "full_name": "Ahmet Yılmaz", "tc_kimlik_no": "12345678901", "approved_by_security": False},
      {"id": 2, "full_name": "John Smith", "passport_no": "US1234567", "approved_by_security": False},
      {"id": 3, "full_name": "Maria Garcia", "passport_no": "ES7654321", "approved_by_security": False}
    ]
  }
]

# 3. Güvenlik onayı (kimlik fotoğrafı + giriş)
POST /api/security/approve-entry
{
  "work_order_person_id": 1,
  "identity_photo": <base64_image>,
  "security_notes": "Kimlik kontrolü yapıldı"
}

# Backend:
# - identity_photo → MinIO'ya yükle
# - ArchiveDocument kaydet
# - WorkOrderPerson.identity_document_id güncelle
# - WorkOrderPerson.gate_entry_time = NOW
# - WorkOrderPerson.approved_by_security = True
# - GateLog oluştur (work_order_person_id FK)

# 4. Çıkış onayı
PUT /api/security/exit/{work_order_person_id}

# Backend:
# - WorkOrderPerson.gate_exit_time = NOW
# - GateLog.exit_time = NOW
# - GateLog.duration_minutes = (exit - entry) / 60
```

---

### İlgili Runbook'lar
- `DEPLOYMENT_RUNBOOK.md`: Production deployment (Faz 7: Portal kurulumu)
- `01_MODUL_CARI.md`: Cari entegrasyonu
- `02_MODUL_MOTORBOT.md`: Motorbot entegrasyonu
- `07_MODUL_HIZMET.md`: **Pricing Engine detayları** 🆕
- `10_MODUL_GUVENLIK.md`: **GateLog + 4 saat kuralı** 🆕
- `03_MODUL_KURLAR.md`: Kur entegrasyonu

---

## 🐛 Bilinen Sorunlar ve Geliştirmeler

### Açık Sorunlar
1. **Email Service:** SMTP konfigürasyonu yapılmadı (onay/red bildirimleri)
2. **Arşivleme:** 30 gün sonrası otomatik arşiv mekanizması eksik
3. **4 Saat Kontrolü:** GateLog entegrasyonu tamamlanmadı

### Gelecek Geliştirmeler (Faz 3: Portal)
1. ✅ **Portal Auth:** Email + password (admin-created users)
2. ✅ **Portal Request Form:** DRAFT → SUBMITTED workflow
3. ✅ **Approval Queue:** Personel dashboard (pending count)
4. ✅ **My Requests:** Portal kullanıcı kendi talepleri
5. ⏳ **Email Notifications:** SMTP2GO ile onay/red bildirimleri
6. ⏳ **Archive:** 30 gün+ KAPANDI iş emirleri

### Gelecek Geliştirmeler (Faz 4: Fatura)
- Invoice modülü ile tam entegrasyon
- WorkOrderItem → InvoiceLine otomatik mapping
- E-fatura/e-arşiv UBL export (daha sonra)

---

**Son Güncelleme:** 25 Kasım 2025  
**Güncelleyen:** AI Documentation Agent  
**Versiyon:** 2.0 (WorkOrderPerson + Otomatik Fiyatlandırma Eklendi)  
**Portal Durum:** Planlanan (Faz 3)

