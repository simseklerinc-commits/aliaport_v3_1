# GÜVENLİK MODÜLÜ - Teknik Dokümantasyon

## 📋 Modül Özeti

**Modül Adı:** Güvenlik (Security Gate Management)  
**Versiyon:** 3.1.0  
**Durum:** ✅ Production Ready  
**Sorumlu Ekip:** Security & Operations Team  
**İlgili Modüller:** İş Emri, Motorbot  

---

## 🎯 Ne İşe Yarar?

Güvenlik modülü, **liman giriş/çıkış kapısındaki kontrolleri** yönetir. İş emri bazlı doküman checklist, fotoğraf kaydı ve istisna durumları için PIN yetkilendirmesi sağlar.

**Kullanım Senaryoları:**
- **Giriş Kontrolü:** İş emri onaylı mı? Dokümanlar tamam mı?
- **Checklist:** İş emri tipine göre otomatik checklist (motorbot ruhsatı, vinç izni vs.)
- **Fotoğraf Kaydı:** Giriş/çıkış fotoğrafı
- **İstisna Durumu:** PIN ile yetkilendirme (eksik dokümanla giriş)
- **4 Saat Kontrolü:** Çıkış zamanı - iş emri bitiş > 4 saat → ek ücret

**İş Akışı:**
```
Güvenlik Personeli (Tablet/PC)
      ↓
İş Emri Numarası Girişi
      ↓
İş Emri Durumu Kontrolü (ONAYLANDI mı?)
      ↓
Checklist Kontrolü (Dokümanlar tamam mı?)
      ↓
Fotoğraf Çekimi (opsiyonel)
      ↓
Giriş İzni VER / İstisna PIN ile giriş
      ↓
Çıkış → 4 saat kontrolü → Ek ücret hesapla
```

---

## 🗂️ Veritabanı Yapısı

### Tablo 1: `gatelog` (Giriş/Çıkış Kayıtları)

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `id` | Integer | Primary Key | 1, 2, 3... |
| `work_order_id` | Integer | FK → WorkOrder.Id | 123 |
| `work_order_person_id` | Integer | FK → WorkOrderPerson.id 🆕 | 45 |
| `motorbot_id` | Integer | FK → Motorbot.Id (opsiyonel) | 5 |
| `entry_type` | String(10) | **Giriş/Çıkış** | "GIRIS", "CIKIS" |
| `wo_number` | String(50) | İş emri numarası | "WO-2025-00123" |
| `wo_status` | String(20) | İş emri durumu | "ONAYLANDI", "BEKLEMEDE", "REDDEDILDI" |
| `security_personnel` | String(100) | **Güvenlik personeli** | "Mehmet Demir" |
| `is_approved` | Boolean | **Giriş izni verildi mi?** | True |
| `checklist_complete` | Boolean | **Checklist tamamlandı mı?** | True |
| `checklist_data` | Text | **JSON checklist verileri** | `{"ruhsat": true, "vinc": false}` |
| `is_exception` | Boolean | **İstisna ile mi girildi?** | False |
| `exception_pin` | String(10) | Yetkilendirme PIN (hash'lenmiş) | "abc123..." |
| `exception_reason` | Text | İstisna sebebi | "Acil durum - yangın" |
| `exception_approved_by` | String(100) | İstisna onaylayan | "admin" |
| `photo_url` | String(500) | Giriş/çıkış fotoğrafı | "uploads/gate/photo_123.jpg" |
| `gate_time` | DateTime | **Giriş/çıkış zamanı** | 2025-11-25 08:00:00 |
| **🆕 YENİ ALANLAR (25 Kasım 2025)** |
| `vehicle_plate` | String(20) | **Araç plakası** | "34 ABC 123" |
| `vehicle_type` | String(50) | Araç tipi | "Kamyon", "Minibüs", "Hafif Ticari" |
| `driver_name` | String(200) | Sürücü adı | "Mehmet Yılmaz" |
| `entry_time` | DateTime | **Giriş zamanı (4 saat kuralı)** | 2025-11-25 08:00:00 |
| `exit_time` | DateTime | **Çıkış zamanı (4 saat kuralı)** | 2025-11-25 15:30:00 |
| `duration_minutes` | Integer | **Süre (dakika)** | 450 |
| `base_charge_hours` | Integer | **Baz ücret saati (default=4)** | 4 |
| `extra_minutes` | Integer | **Aşan süre (dakika)** | 210 |
| `extra_charge_calculated` | Decimal(15,2) | **Hesaplanan ek ücret** | 13.125 |
| `identity_documents_uploaded` | Boolean | **Kimlik belgeleri yüklendi mi?** | True |
| `identity_document_count` | Integer | **Yüklenen kimlik belgesi sayısı** | 3 |
| `created_at` | DateTime | Kayıt zamanı | 2025-11-25 08:00:00 |
| `notes` | Text | Notlar | "Hava şartları kötü" |

**entry_type Enum:**
```
GIRIS = "GIRIS"  # Giriş
CIKIS = "CIKIS"  # Çıkış
```

**checklist_data JSON Örneği:**
```json
{
  "is_emri_belgesi": true,
  "motorbot_ruhsati": true,
  "vinc_izni": false,
  "personel_listesi": true,
  "sigorta_belgesi": true
}
```

**🆕 Computed Properties (Python):**
```python
@property
def is_vehicle_entry(self) -> bool:
    """Araç girişi mi?"""
    return self.vehicle_plate is not None

@property
def calculate_duration(self) -> int:
    """Giriş-çıkış süresi (dakika)"""
    if self.entry_time and self.exit_time:
        delta = self.exit_time - self.entry_time
        return int(delta.total_seconds() / 60)
    return 0

@property
def is_over_base_hours(self) -> bool:
    """4 saat aşıldı mı?"""
    base_minutes = (self.base_charge_hours or 4) * 60
    return self.duration_minutes > base_minutes

@property
def calculate_extra_charge(self) -> dict:
    """Ek ücret hesaplama detayı"""
    base_minutes = (self.base_charge_hours or 4) * 60
    actual_minutes = self.duration_minutes or 0
    extra_minutes = max(0, actual_minutes - base_minutes)
    
    return {
        "base_minutes": base_minutes,
        "actual_minutes": actual_minutes,
        "extra_minutes": extra_minutes,
        "needs_extra_charge": extra_minutes > 0
    }
```

---

### Tablo 2: `gate_checklist_item` (Checklist Tanımları)

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `id` | Integer | Primary Key | 1, 2, 3... |
| `wo_type` | String(20) | İş emri tipi | "HIZMET", "MOTORBOT", "BARINMA", "DIGER" |
| `item_label` | String(200) | **Checklist etiketi** | "Motorbot Ruhsatı" |
| `is_required` | Boolean | **Zorunlu mu?** | True |
| `display_order` | Integer | Gösterim sırası | 1, 2, 3... |
| `is_active` | Boolean | Aktif mi? | True |
| `created_at` | DateTime | Kayıt zamanı | 2025-01-01 10:00:00 |
| `updated_at` | DateTime | Son güncelleme | 2025-02-01 14:30:00 |

**Örnek Checklist Tanımları:**
```
wo_type=MOTORBOT:
  1. İş Emri Belgesi (required)
  2. Motorbot Ruhsatı (required)
  3. Personel Listesi (required)
  4. Sigorta Belgesi (required)

wo_type=HIZMET:
  1. İş Emri Belgesi (required)
  2. Vinç İzni (required, sadece vinç hizmetleri için)
  3. Ekipman Listesi (optional)
```

---

## 🔌 API Endpoints

### Base URL: `/api/guvenlik`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/guvenlik/gatelog/` | GateLog listesi |
| GET | `/api/guvenlik/gatelog/by-work-order/{wo_id}` | İş emri bazlı kayıtlar |
| GET | `/api/guvenlik/gatelog/{gatelog_id}` | GateLog detayı |
| POST | `/api/guvenlik/gatelog/check-entry` | **Giriş kontrolü (iş emri doğrulama)** |
| POST | `/api/guvenlik/gatelog/entry` | **Giriş kaydı oluştur** |
| POST | `/api/guvenlik/gatelog/exit` | **Çıkış kaydı oluştur (4 saat kontrolü)** |
| POST | `/api/guvenlik/gatelog/exception-entry` | **İstisna giriş (PIN ile)** |
| GET | `/api/guvenlik/checklist/by-wo-type/{wo_type}` | İş emri tipi bazlı checklist |
| POST | `/api/guvenlik/checklist/` | Yeni checklist item oluştur |

---

## 💻 Kod Yapısı

**models.py - GateLog:**
```python
class GateLog(Base):
    __tablename__ = "gatelog"
    
    id = Column(Integer, primary_key=True, index=True)
    
    work_order_id = Column(Integer, nullable=False)
    motorbot_id = Column(Integer, nullable=True)
    
    entry_type = Column(String(10), nullable=False)  # GIRIS, CIKIS
    wo_number = Column(String(50), nullable=False)
    wo_status = Column(String(20), nullable=False)
    
    security_personnel = Column(String(100), nullable=False)
    
    is_approved = Column(Boolean, default=False)
    checklist_complete = Column(Boolean, default=False)
    checklist_data = Column(Text, nullable=True)  # JSON
    
    is_exception = Column(Boolean, default=False)
    exception_pin = Column(String(10), nullable=True)
    exception_reason = Column(Text, nullable=True)
    exception_approved_by = Column(String(100), nullable=True)
    
    photo_url = Column(String(500), nullable=True)
    gate_time = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
```

**router.py - Giriş Kontrolü:**
```python
@router.post("/gatelog/check-entry")
def check_entry(wo_number: str):
    """İş emri giriş kontrolü"""
    wo = db.query(WorkOrder).filter(WorkOrder.wo_number == wo_number).first()
    
    if not wo:
        return {
            "allowed": False,
            "reason": "İş emri bulunamadı",
            "wo_status": None
        }
    
    if wo.status != "APPROVED":
        return {
            "allowed": False,
            "reason": f"İş emri durumu: {wo.status} (Onaylı değil)",
            "wo_status": wo.status
        }
    
    # Checklist al
    checklist_items = db.query(GateChecklistItem).filter(
        GateChecklistItem.wo_type == wo.wo_type,
        GateChecklistItem.is_active == True
    ).order_by(GateChecklistItem.display_order).all()
    
    return {
        "allowed": True,
        "wo_number": wo.wo_number,
        "wo_type": wo.wo_type,
        "cari_title": wo.cari_title,
        "subject": wo.subject,
        "checklist": [
            {
                "label": item.item_label,
                "is_required": item.is_required
            } for item in checklist_items
        ]
    }

@router.post("/gatelog/exit")
def gate_exit(wo_number: str, security_personnel: str):
    """Çıkış kaydı + 4 saat kontrolü"""
    wo = db.query(WorkOrder).filter(WorkOrder.wo_number == wo_number).first()
    
    exit_time = datetime.now()
    
    # GateLog oluştur
    gate_log = GateLog(
        work_order_id=wo.Id,
        entry_type="CIKIS",
        wo_number=wo_number,
        wo_status=wo.status,
        security_personnel=security_personnel,
        is_approved=True,
        gate_time=exit_time
    )
    
    db.add(gate_log)
    
    # 4 saat kontrolü
    if wo.actual_end_date:
        time_diff = (exit_time - wo.actual_end_date).total_seconds() / 3600
        
        if time_diff > 4:
            # İş emrine security_exit_time kaydet
            wo.security_exit_time = exit_time
            
            # Ek ücret hesapla (örnek: 4 saatten sonra her saat +500 TL)
            extra_hours = int(time_diff - 4)
            extra_charge = extra_hours * 500
            
            return {
                "success": True,
                "message": f"Çıkış kaydedildi. UYARI: 4 saat aşımı ({extra_hours} saat, +{extra_charge} TL ek ücret)"
            }
    
    db.commit()
    return {"success": True, "message": "Çıkış kaydedildi"}
```

---

## 🔧 Geliştirme Geçmişi

### Faz 1: Temel Giriş/Çıkış (Tamamlandı)
- ✅ GateLog CRUD
- ✅ İş emri doğrulama
- ✅ Fotoğraf upload

### Faz 2: Checklist Sistemi (Tamamlandı)
- ✅ GateChecklistItem tanımları
- ✅ İş emri tipi bazlı checklist
- ✅ JSON checklist_data

### Faz 3: İstisna Durumu (Tamamlandı)
- ✅ PIN yetkilendirmesi
- ✅ İstisna sebebi kaydı

### Faz 4: 4 Saat Kontrolü (Tamamlandı)
- ✅ Çıkış zamanı - iş emri bitiş
- ✅ Ek ücret hesaplama

### Faz 5: Tablet Uygulaması (Planlanan)
- ⏳ Güvenlik tablet UI
- ⏳ QR code iş emri okuma
- ⏳ Kamera entegrasyonu

---

## 🆕 YENİ ÖZELLİKLER (25 Kasım 2025)

### 4 Saat Araç Kuralı Detaylandırması

**Kural:** Araç liman sahasına girdiğinde ilk 4 saat baz ücret, fazlası dakika bazlı ek ücret.

#### Hesaplama Formülü

```python
def calculate_vehicle_charge(entry_time, exit_time, base_price_usd=15.0):
    """
    4 saat araç kuralı hesaplama
    
    - İlk 240 dakika (4 saat): Baz ücret (kesin)
    - Aşan her dakika: (base_price / 240) × extra_minutes
    
    Örnek:
      base_price = 15.00 USD
      entry_time = 08:00
      exit_time = 15:30  (7.5 saat = 450 dk)
      
      İlk 240 dk: 15.00 USD
      Aşan 210 dk: (15.00 / 240) × 210 = 13.125 USD
      Toplam: 28.125 USD
    """
    from datetime import timedelta
    from decimal import Decimal
    
    duration = exit_time - entry_time
    duration_minutes = int(duration.total_seconds() / 60)
    
    base_minutes = 240  # 4 saat
    base_price = Decimal(str(base_price_usd))
    
    if duration_minutes <= base_minutes:
        # 4 saat veya altı: sadece baz ücret
        return {
            "duration_minutes": duration_minutes,
            "base_charge": float(base_price),
            "extra_minutes": 0,
            "extra_charge": 0.0,
            "total_charge": float(base_price),
            "breakdown": f"İlk {base_minutes} dk: {base_price} USD"
        }
    else:
        # 4 saatten fazla: baz + ek ücret
        extra_minutes = duration_minutes - base_minutes
        minute_rate = base_price / Decimal(str(base_minutes))
        extra_charge = minute_rate * Decimal(str(extra_minutes))
        total_charge = base_price + extra_charge
        
        return {
            "duration_minutes": duration_minutes,
            "base_charge": float(base_price),
            "extra_minutes": extra_minutes,
            "extra_charge": float(extra_charge),
            "total_charge": float(total_charge),
            "breakdown": f"İlk {base_minutes} dk: {base_price} USD + Fazla {extra_minutes} dk: {extra_charge:.2f} USD = {total_charge:.2f} USD"
        }
```

**Excel Tarife Karşılığı:**
```
Kod: TMP.030
Ad: Araç Giriş Ücreti
Fiyat: 15.00 USD
FiyatModeli: VEHICLE_4H_RULE
ModelParam: {"base_minutes": 240}
```

**GateLog Kaydı:**
```python
# Giriş
gate_log = GateLog(
    work_order_id=123,
    entry_type="GIRIS",
    wo_number="WO-2025-00123",
    vehicle_plate="34 ABC 123",
    vehicle_type="Kamyon",
    driver_name="Mehmet Yılmaz",
    entry_time=datetime(2025, 11, 25, 8, 0, 0),
    base_charge_hours=4,
    security_personnel="Ahmet Demir",
    is_approved=True
)

# Çıkış
gate_log.exit_time = datetime(2025, 11, 25, 15, 30, 0)
gate_log.duration_minutes = 450  # 7.5 saat
gate_log.extra_minutes = 210     # 450 - 240
gate_log.extra_charge_calculated = Decimal("13.125")  # (15/240) × 210

# İş emrine WorkOrderItem ekle
from modules.hizmet.pricing_engine import PricingEngine

result = PricingEngine.calculate(
    calculation_type=CalculationType.VEHICLE_4H_RULE,
    base_price=Decimal("15.00"),
    formula_params={"base_minutes": 240},
    input_data={"minutes": 450},
    currency="USD"
)

# WorkOrderItem
work_order_item = WorkOrderItem(
    work_order_id=123,
    item_type="SERVICE",
    service_code="TMP.030",
    description="Araç Giriş Ücreti - 34 ABC 123 - 7.5 saat",
    quantity=1,
    unit="ARAC",
    unit_price=result["subtotal"] * kur,  # USD → TRY
    total=result["subtotal"] * kur
)
```

---

### Kimlik Belgesi Fotoğrafı Workflow

**Senaryo:** İş emrinde 3 kişi kayıtlı (WorkOrderPerson). Güvenlik her kişinin kimlik belgesini fotoğraflayıp onaylamalı.

#### 1. WorkOrderPerson Listesi (İş Emri Oluşturulduğunda)

```python
# İş emri oluşturuldu (backend)
work_order = WorkOrder(
    wo_number="WO-2025-00123",
    subject="Teknik personel transferi - M/V NEPTUNE"
)

# Hizmet kalemi: TMP.017 (RequiresPersonCount=True)
work_order_item = WorkOrderItem(
    work_order_id=work_order.id,
    service_code="TMP.017",
    quantity=3  # 3 kişi
)

# Kişi listesi
persons = [
    WorkOrderPerson(
        work_order_id=work_order.id,
        work_order_item_id=work_order_item.id,
        full_name="Ahmet Yılmaz",
        tc_kimlik_no="12345678901",
        nationality="TR"
    ),
    WorkOrderPerson(
        work_order_id=work_order.id,
        work_order_item_id=work_order_item.id,
        full_name="John Smith",
        passport_no="US1234567",
        nationality="US"
    ),
    WorkOrderPerson(
        work_order_id=work_order.id,
        work_order_item_id=work_order_item.id,
        full_name="Maria Garcia",
        passport_no="ES7654321",
        nationality="ES"
    )
]
```

#### 2. Güvenlik Tablet UI (Bekleyen Onaylar)

```typescript
// GET /api/security/pending-entries

Response:
[
  {
    "work_order_id": 123,
    "work_order_number": "WO-2025-00123",
    "subject": "Teknik personel transferi - M/V NEPTUNE",
    "cari_title": "ABC Denizcilik A.Ş.",
    "person_count": 3,
    "persons": [
      {
        "id": 1,
        "full_name": "Ahmet Yılmaz",
        "identity_type": "TC_KIMLIK",
        "tc_kimlik_no": "12345678901",
        "nationality": "TR",
        "approved_by_security": false,
        "has_identity_document": false
      },
      {
        "id": 2,
        "full_name": "John Smith",
        "identity_type": "PASAPORT",
        "passport_no": "US1234567",
        "nationality": "US",
        "approved_by_security": false,
        "has_identity_document": false
      },
      {
        "id": 3,
        "full_name": "Maria Garcia",
        "identity_type": "PASAPORT",
        "passport_no": "ES7654321",
        "nationality": "ES",
        "approved_by_security": false,
        "has_identity_document": false
      }
    ]
  }
]

// Tablet UI
<WorkOrderPersonList>
  {persons.map(person => (
    <PersonCard key={person.id}>
      <h3>{person.full_name}</h3>
      <p>{person.identity_type}: {person.tc_kimlik_no || person.passport_no}</p>
      <p>Uyruk: {person.nationality}</p>
      
      {!person.has_identity_document && (
        <Button onClick={() => openCamera(person.id)}>
          📷 Kimlik Fotoğrafı Çek
        </Button>
      )}
      
      {person.has_identity_document && !person.approved_by_security && (
        <Button onClick={() => approveEntry(person.id)}>
          ✅ Giriş Onayı Ver
        </Button>
      )}
      
      {person.approved_by_security && (
        <Badge>✅ Onaylandı - {person.gate_entry_time}</Badge>
      )}
    </PersonCard>
  ))}
</WorkOrderPersonList>
```

#### 3. Kimlik Fotoğrafı Upload

```typescript
// Tablet kameradan fotoğraf çek
const captureIdentityPhoto = async (personId: number) => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const video = document.createElement('video');
  video.srcObject = stream;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, 1920, 1080);
  
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  
  // Upload
  const formData = new FormData();
  formData.append('file', blob, `identity_${personId}_${Date.now()}.jpg`);
  formData.append('work_order_person_id', personId.toString());
  formData.append('document_type', 'IDENTITY_PHOTO');
  
  const response = await api.post('/api/security/upload-identity-photo', formData);
  
  // Backend response:
  // {
  //   "identity_document_id": 789,
  //   "photo_url": "/minio/archive/identity_1_1732541234.jpg"
  // }
};
```

**Backend (security/router.py):**
```python
@router.post("/upload-identity-photo")
@require_auth()
async def upload_identity_photo(
    file: UploadFile,
    work_order_person_id: int = Form(...),
    document_type: str = Form("IDENTITY_PHOTO"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Kimlik belgesi fotoğrafı upload
    
    1. MinIO'ya yükle
    2. ArchiveDocument kaydet
    3. WorkOrderPerson.identity_document_id güncelle
    """
    from modules.dijital_arsiv.services import upload_to_minio
    
    # MinIO upload
    file_data = await file.read()
    minio_path = upload_to_minio(
        file_data=file_data,
        filename=file.filename,
        folder="identity_photos"
    )
    
    # ArchiveDocument kaydet
    archive_doc = ArchiveDocument(
        DocumentType=document_type,
        FileUrl=minio_path,
        FileName=file.filename,
        FileSize=len(file_data),
        UploadedBy=current_user.Id
    )
    db.add(archive_doc)
    db.flush()
    
    # WorkOrderPerson güncelle
    person = db.query(WorkOrderPerson).filter(
        WorkOrderPerson.id == work_order_person_id
    ).first()
    
    person.identity_document_id = archive_doc.Id
    person.identity_photo_url = minio_path
    
    db.commit()
    
    return api_response(
        data={
            "identity_document_id": archive_doc.Id,
            "photo_url": minio_path
        },
        message="Kimlik fotoğrafı yüklendi"
    )
```

#### 4. Giriş Onayı

```python
@router.post("/approve-entry/{work_order_person_id}")
@require_auth()
async def approve_entry(
    work_order_person_id: int,
    security_notes: str = Body(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Güvenlik giriş onayı
    
    1. WorkOrderPerson güncelle (gate_entry_time, approved_by_security)
    2. GateLog oluştur (work_order_person_id FK)
    """
    person = db.query(WorkOrderPerson).filter(
        WorkOrderPerson.id == work_order_person_id
    ).first()
    
    if not person.identity_document_id:
        raise HTTPException(400, "Kimlik belgesi fotoğrafı yüklenmemiş")
    
    # WorkOrderPerson güncelle
    person.gate_entry_time = datetime.now()
    person.approved_by_security = True
    person.approved_by_security_user_id = current_user.Id
    person.security_notes = security_notes
    
    # GateLog oluştur
    gate_log = GateLog(
        work_order_id=person.work_order_id,
        work_order_person_id=person.id,
        entry_type="GIRIS",
        wo_number=person.work_order.wo_number,
        wo_status=person.work_order.status,
        security_personnel=current_user.full_name,
        is_approved=True,
        entry_time=person.gate_entry_time,
        identity_documents_uploaded=True,
        identity_document_count=1
    )
    db.add(gate_log)
    
    db.commit()
    
    return api_response(
        data={
            "person_id": person.id,
            "full_name": person.full_name,
            "gate_entry_time": person.gate_entry_time
        },
        message="Giriş onaylandı"
    )
```

#### 5. Çıkış Onayı

```python
@router.post("/exit/{work_order_person_id}")
@require_auth()
async def approve_exit(
    work_order_person_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Güvenlik çıkış onayı
    
    1. WorkOrderPerson.gate_exit_time güncelle
    2. GateLog güncelle (exit_time, duration_minutes)
    """
    person = db.query(WorkOrderPerson).filter(
        WorkOrderPerson.id == work_order_person_id
    ).first()
    
    if not person.gate_entry_time:
        raise HTTPException(400, "Giriş onayı yapılmamış")
    
    # WorkOrderPerson güncelle
    person.gate_exit_time = datetime.now()
    
    # GateLog güncelle
    gate_log = db.query(GateLog).filter(
        GateLog.work_order_person_id == person.id,
        GateLog.entry_type == "GIRIS"
    ).first()
    
    if gate_log:
        gate_log.exit_time = person.gate_exit_time
        gate_log.duration_minutes = person.duration_minutes  # computed property
    
    db.commit()
    
    return api_response(
        data={
            "person_id": person.id,
            "full_name": person.full_name,
            "gate_entry_time": person.gate_entry_time,
            "gate_exit_time": person.gate_exit_time,
            "duration_minutes": person.duration_minutes
        },
        message="Çıkış onaylandı"
    )
```

---

### Tablet UI Akış Diyagramı

```
Güvenlik Tablet UI (Home Screen)
    ↓
📋 Bekleyen İş Emirleri
    ├─ WO-2025-00123 (3 kişi - 0/3 onaylandı)
    ├─ WO-2025-00124 (1 araç - Onaylandı)
    └─ WO-2025-00125 (2 kişi - 2/2 onaylandı)
    ↓
WO-2025-00123 TIKLA
    ↓
Kişi Listesi (3 kişi)
    ├─ [❌] Ahmet Yılmaz (TC: 12345678901)
    │   └─ [📷 Kimlik Fotoğrafı Çek] butonu
    ├─ [❌] John Smith (Passport: US1234567)
    │   └─ [📷 Kimlik Fotoğrafı Çek] butonu
    └─ [❌] Maria Garcia (Passport: ES7654321)
        └─ [📷 Kimlik Fotoğrafı Çek] butonu
    ↓
Ahmet Yılmaz → [📷 Kimlik Fotoğrafı Çek]
    ↓
Kamera açılır (tablet arka kamera)
    ↓
Kimlik belgesi fotoğrafla → Upload
    ↓
✅ Fotoğraf yüklendi
    ↓
[✅ Giriş Onayı Ver] butonu aktif olur
    ↓
[✅ Giriş Onayı Ver] TIKLA
    ↓
WorkOrderPerson.gate_entry_time = ŞİMDİ
WorkOrderPerson.approved_by_security = True
GateLog oluşturuldu
    ↓
Liste güncellenir:
    ├─ [✅] Ahmet Yılmaz (Giriş: 08:00)
    ├─ [❌] John Smith (Bekliyor...)
    └─ [❌] Maria Garcia (Bekliyor...)
    ↓
(John ve Maria için aynı işlem tekrarlanır)
    ↓
3/3 Onaylandı → İş emri status SAHADA
    ↓
Çıkış zamanı:
    ├─ Ahmet Yılmaz → [🚪 Çıkış Onayı] butonu
    └─ TIKLA → gate_exit_time = ŞİMDİ
```

---

## 🔗 Diğer Modüllerle İlişkiler

### İş Emri Modülü
```sql
GateLog.work_order_id → WorkOrder.Id
GateLog.work_order_person_id → WorkOrderPerson.id
WorkOrder.security_exit_time ← GateLog.gate_time (4 saat kontrolü)
WorkOrderPerson.gate_entry_time ← GateLog.entry_time
WorkOrderPerson.gate_exit_time ← GateLog.exit_time
```

### Dijital Arşiv Modülü
```sql
WorkOrderPerson.identity_document_id → ArchiveDocument.Id
GateLog.photo_url → MinIO storage
```

### Hizmet Modülü
```python
# 4 saat kuralı ile entegre
Hizmet.CalculationType = VEHICLE_4H_RULE
GateLog.extra_charge_calculated → WorkOrderItem.total
```

---

## 📚 Kaynaklar

**İlgili Dosyalar:**
- `backend/aliaport_api/modules/guvenlik/models.py`
- `backend/aliaport_api/modules/guvenlik/router.py`

**İlgili Runbook'lar:**
- `04_MODUL_ISEMRI.md`: İş emri entegrasyonu (security_exit_time)
- `07_MODUL_HIZMET.md`: **Pricing Engine + 4 saat kuralı** 🆕
- `08_MODUL_DIJITAL_ARSIV.md`: **Kimlik belgesi fotoğraf upload** 🆕

---

**Son Güncelleme:** 25 Kasım 2025  
**Güncelleyen:** AI Documentation Agent  
**Versiyon:** 2.0 (4 Saat Kuralı + Kimlik Belgesi Workflow Eklendi)  
**Versiyon:** 1.0
