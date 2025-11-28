# SAHA PERSONEL MODÜLÜ - Teknik Dokümantasyon

## 📋 Modül Özeti

**Modül Adı:** Saha Personel (Field Personnel - WorkLog)  
**Versiyon:** 3.1.0  
**Durum:** ✅ Production Ready  
**Sorumlu Ekip:** Operations & Tablet Team  
**İlgili Modüller:** İş Emri, Motorbot, Sefer  

---

## 🎯 Ne İşe Yarar?

Saha Personel modülü, **sahada çalışan personelin iş kayıtlarını** tablet üzerinden toplar. İş emri veya sefer için yapılan çalışmaların zaman, hizmet ve fotoğraf kaydını tutar.

**Kullanım Senaryoları:**
- **Tablet Giriş:** Saha personeli tablet'ten giriş yapar
- **İş Başlat:** İş emri/sefer seçer, başlangıç zamanı kaydeder
- **Fotoğraf Çek:** İş süresince fotoğraf çeker (opsiyonel)
- **İş Bitir:** Bitiş zamanı, süre otomatik hesaplanır
- **Admin Onay:** Ofis personeli worklog'u onaylar → Fatura kalemine dönüşür

**İş Akışı:**
```
Saha Personeli (Tablet)
      ↓
İş Emri/Sefer Seç
      ↓
Başlat (time_start) → Çalış → Bitir (time_end)
      ↓
Fotoğraf Ekle (opsiyonel)
      ↓
Admin Onay → İş emri kalemine ekle (WorkOrderItem)
```

---

## 🗂️ Veritabanı Yapısı

### Tablo: `worklog`

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `id` | Integer | Primary Key | 1, 2, 3... |
| `work_order_id` | Integer | FK → WorkOrder.Id (opsiyonel) | 123 |
| `sefer_id` | Integer | FK → MbTrip.Id (opsiyonel) | 45 |
| `motorbot_id` | Integer | FK → Motorbot.Id (opsiyonel) | 5 |
| `hizmet_kodu` | String(20) | Hizmet kodu referansı | "SRV-MOTORBOT" |
| `personnel_name` | String(100) | **Personel adı** | "Ahmet Yılmaz" |
| `time_start` | DateTime | **Başlangıç zamanı** | 2025-11-25 08:00:00 |
| `time_end` | DateTime | **Bitiş zamanı** | 2025-11-25 10:30:00 |
| `duration_minutes` | Integer | **Süre (dakika)** | 150 |
| `service_type` | String(50) | Hizmet tipi | "BAKIM", "TAMIR", "TRANSFER" |
| `quantity` | Float | Miktar | 2.5 |
| `unit` | String(20) | Birim | "SAAT" |
| `description` | Text | Açıklama | "Motorbot M-123 bakım işlemi" |
| `notes` | Text | Notlar | "Hava şartları iyiydi" |
| `photo_url` | String(500) | Fotoğraf URL | "uploads/worklogs/photo_123.jpg" |
| `created_at` | DateTime | Kayıt zamanı | 2025-11-25 08:00:00 |
| `updated_at` | DateTime | Son güncelleme | 2025-11-25 10:30:00 |
| `created_by` | String(100) | Oluşturan (tablet user) | "ahmet.yilmaz" |
| `is_processed` | Integer | **İşlendi mi?** (0/1) | 0 (beklemede) |
| `is_approved` | Integer | **Onaylandı mı?** (0/1) | 0 (onay bekliyor) |
| `approved_by` | String(100) | Onaylayan admin | "admin" |
| `approved_at` | DateTime | Onay zamanı | 2025-11-25 11:00:00 |

**İş Akışı Durumları:**
```
is_processed=0, is_approved=0  → Beklemede (yeni oluşturuldu)
is_processed=0, is_approved=1  → Onaylandı (admin onayı)
is_processed=1, is_approved=1  → İşlendi (WorkOrderItem'e eklendi)
```

**İndeksler:**
- `ix_worklog_work_order_id`: (work_order_id) → İş emri bazlı sorgular
- `ix_worklog_sefer_id`: (sefer_id) → Sefer bazlı sorgular
- `ix_worklog_is_processed`: (is_processed) → Bekleyen kayıtlar

---

## 🔌 API Endpoints

### Base URL: `/api/saha/worklog`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/saha/worklog/` | WorkLog listesi (sayfalı) |
| GET | `/api/saha/worklog/pending` | **Onay bekleyen kayıtlar** |
| GET | `/api/saha/worklog/by-work-order/{wo_id}` | İş emri bazlı liste |
| GET | `/api/saha/worklog/{worklog_id}` | WorkLog detayı |
| POST | `/api/saha/worklog/` | **Yeni worklog oluştur (tablet)** |
| PUT | `/api/saha/worklog/{worklog_id}` | WorkLog güncelle |
| PUT | `/api/saha/worklog/{worklog_id}/approve` | **Admin onay** |
| PUT | `/api/saha/worklog/{worklog_id}/process` | **İş emrine ekle** |
| DELETE | `/api/saha/worklog/{worklog_id}` | WorkLog sil |
| POST | `/api/saha/worklog/{worklog_id}/upload-photo` | Fotoğraf yükle |

---

## 💻 Kod Yapısı

**models.py:**
```python
class WorkLog(Base):
    __tablename__ = "worklog"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # İlişkiler (Foreign key kaldırıldı - daha sonra eklenecek)
    work_order_id = Column(Integer, nullable=True)
    sefer_id = Column(Integer, nullable=True)
    motorbot_id = Column(Integer, nullable=True)
    hizmet_kodu = Column(String(20), nullable=True)
    
    # Personel bilgisi
    personnel_name = Column(String(100), nullable=False)
    
    # Zaman kayıtları
    time_start = Column(DateTime, nullable=False)
    time_end = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    
    # Hizmet detayları
    service_type = Column(String(50), nullable=True)
    quantity = Column(Float, default=1.0)
    unit = Column(String(20), default="SAAT")
    
    # Açıklama
    description = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Fotoğraf
    photo_url = Column(String(500), nullable=True)
    
    # Sistem alanları
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100), nullable=True)
    
    # İşlenme durumu
    is_processed = Column(Integer, default=0)  # 0: Beklemede, 1: İşlendi
    is_approved = Column(Integer, default=0)   # Admin onayı
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    
    def calculate_duration(self):
        """Süre hesapla"""
        if self.time_start and self.time_end:
            delta = self.time_end - self.time_start
            self.duration_minutes = int(delta.total_seconds() / 60)
        return self.duration_minutes
```

**router.py - Admin Onay:**
```python
@router.put("/{worklog_id}/approve")
def approve_worklog(worklog_id: int, user: User = Depends(get_current_user)):
    """Admin worklog onayı"""
    if not user.has_permission("worklog:approve"):
        raise HTTPException(403, "Onay yetkiniz yok")
    
    worklog = db.query(WorkLog).filter(WorkLog.id == worklog_id).first()
    if not worklog:
        raise HTTPException(404, "WorkLog bulunamadı")
    
    worklog.is_approved = 1
    worklog.approved_by = user.username
    worklog.approved_at = datetime.now()
    
    db.commit()
    return {"success": True, "message": "WorkLog onaylandı"}

@router.put("/{worklog_id}/process")
def process_worklog(worklog_id: int, user: User = Depends(get_current_user)):
    """WorkLog'u iş emrine ekle (WorkOrderItem oluştur)"""
    worklog = db.query(WorkLog).filter(WorkLog.id == worklog_id).first()
    if not worklog or worklog.is_approved == 0:
        raise HTTPException(400, "WorkLog onaylanmamış")
    
    # WorkOrderItem oluştur
    item = WorkOrderItem(
        work_order_id=worklog.work_order_id,
        item_type="WORKLOG",
        description=f"{worklog.personnel_name} - {worklog.description}",
        work_log_id=worklog.id,
        quantity=worklog.duration_minutes / 60,  # Dakika → Saat
        unit="SAAT",
        start_time=worklog.time_start,
        end_time=worklog.time_end
    )
    
    db.add(item)
    worklog.is_processed = 1
    db.commit()
    
    return {"success": True, "message": "WorkLog iş emrine eklendi"}
```

---

## 🔧 Geliştirme Geçmişi

### Faz 1: Temel WorkLog (Tamamlandı)
- ✅ WorkLog CRUD
- ✅ Zaman kaydı (time_start, time_end, duration)
- ✅ Fotoğraf upload

### Faz 2: Onay Mekanizması (Tamamlandı)
- ✅ is_approved, approved_by alanları
- ✅ Admin onay endpoint
- ✅ İş emrine ekleme (process)

### Faz 3: Tablet Uygulaması (Planlanan)
- ⏳ Tablet login
- ⏳ İş emri/sefer seçimi
- ⏳ Kamera entegrasyonu
- ⏳ Offline mode (sync sonra)

---

## 🆕 YENİ ÖZELLİKLER (25 Kasım 2025)

### Aktif İş Emri Görüntüleme

**Amaç:** Saha personeli sadece SAHADA durumundaki (aktif) iş emirlerini görebilmeli ve bu iş emirlerine dinamik olarak ek kalem ekleyebilmeli.

#### API Endpoint: GET /active-work-orders

```python
# backend/aliaport_api/modules/saha_personel/router.py

@router.get("/active-work-orders")
@require_auth()
async def get_active_work_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Sadece SAHADA durumundaki iş emirlerini listele
    
    Response:
    [
      {
        "id": 123,
        "wo_number": "WO-2025-00123",
        "subject": "M/V NEPTUNE - Rıhtım Yanaşma",
        "cari_title": "ABC Denizcilik A.Ş.",
        "status": "SAHADA",
        "actual_start_date": "2025-11-25T08:00:00",
        "planned_end_date": "2025-11-25T18:00:00",
        "items": [
          {
            "id": 45,
            "service_code": "TMP.006",
            "description": "Transpalet 3 saat",
            "quantity": 3,
            "unit": "SAAT",
            "total": 2340.0
          }
        ]
      }
    ]
    """
    from modules.isemri.models import WorkOrder, WorkOrderItem
    
    work_orders = db.query(WorkOrder).filter(
        WorkOrder.status == "SAHADA"
    ).order_by(
        WorkOrder.actual_start_date.desc()
    ).all()
    
    result = []
    for wo in work_orders:
        items = db.query(WorkOrderItem).filter(
            WorkOrderItem.work_order_id == wo.Id
        ).all()
        
        result.append({
            "id": wo.Id,
            "wo_number": wo.wo_number,
            "subject": wo.subject,
            "cari_title": wo.cari_title,
            "status": wo.status,
            "actual_start_date": wo.actual_start_date,
            "planned_end_date": wo.planned_end_date,
            "items": [
                {
                    "id": item.Id,
                    "service_code": item.service_code,
                    "description": item.description,
                    "quantity": float(item.quantity) if item.quantity else 0,
                    "unit": item.unit,
                    "total": float(item.total) if item.total else 0
                }
                for item in items
            ]
        })
    
    return api_response(data=result, message=f"{len(result)} aktif iş emri bulundu")
```

**Frontend Kullanımı (Tablet UI):**
```typescript
// Saha personeli tablet dashboard
const ActiveWorkOrdersList = () => {
  const { data: workOrders } = useQuery({
    queryKey: ['active-work-orders'],
    queryFn: () => api.get('/field-personnel/active-work-orders')
  });
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {workOrders?.data.map(wo => (
        <Card key={wo.id}>
          <CardHeader>
            <Badge variant="warning">SAHADA</Badge>
            <h3>{wo.wo_number}</h3>
            <p className="text-sm text-gray-600">{wo.subject}</p>
          </CardHeader>
          <CardBody>
            <div className="text-sm">
              <p><strong>Müşteri:</strong> {wo.cari_title}</p>
              <p><strong>Başlangıç:</strong> {formatDate(wo.actual_start_date)}</p>
              <p><strong>Planlanan Bitiş:</strong> {formatDate(wo.planned_end_date)}</p>
            </div>
            
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Kalemler ({wo.items.length})</h4>
              {wo.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm py-1 border-b">
                  <span>{item.description}</span>
                  <span>{item.quantity} {item.unit} - {formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </CardBody>
          <CardFooter>
            <Button onClick={() => openAddItemForm(wo.id)}>
              ➕ Ek Kalem Ekle
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
```

---

### Dinamik Kalem Ekleme (Ek Kalem)

**Amaç:** Saha personeli aktif iş emrine anlık olarak yeni hizmet kalemi ekleyebilmeli. Fiyat otomatik hesaplanmalı (Tarife + Kur entegrasyonu).

#### API Endpoint: POST /add-item/{work_order_id}

```python
# backend/aliaport_api/modules/saha_personel/router.py

@router.post("/add-item/{work_order_id}")
@require_auth()
async def add_item_to_work_order(
    work_order_id: int,
    request: AddItemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Aktif iş emrine ek kalem ekle (otomatik fiyatlandırma ile)
    
    Request Body:
    {
        "hizmet_kod": "TMP.006",
        "input_data": {"quantity": 2},
        "persons": [  // Opsiyonel - RequiresPersonCount=True ise
            {
                "full_name": "Ahmet Yılmaz",
                "tc_kimlik_no": "12345678901",
                "nationality": "TR"
            }
        ]
    }
    
    Response:
    {
        "work_order_item_id": 78,
        "pricing": {
            "subtotal": 1300.0,
            "kdv": 260.0,
            "total": 1560.0
        }
    }
    """
    from modules.isemri.models import WorkOrder, WorkOrderItem, WorkOrderPerson
    from modules.hizmet.models import Hizmet
    from modules.hizmet.pricing_engine import PricingEngine
    from modules.kurlar.services import get_today_rate
    from datetime import date
    from decimal import Decimal
    
    # 1. İş emri kontrolü
    work_order = db.query(WorkOrder).filter(WorkOrder.Id == work_order_id).first()
    if not work_order:
        raise HTTPException(404, "İş emri bulunamadı")
    
    if work_order.status != "SAHADA":
        raise HTTPException(400, f"İş emri SAHADA durumunda değil (mevcut: {work_order.status})")
    
    # 2. Hizmet kartı bilgisi
    hizmet = db.query(Hizmet).filter(Hizmet.Kod == request.hizmet_kod).first()
    if not hizmet:
        raise HTTPException(404, f"Hizmet bulunamadı: {request.hizmet_kod}")
    
    # 3. Geçerli tarife bul
    from modules.hizmet.models import TarifeListesi
    tarife = db.query(TarifeListesi).filter(
        TarifeListesi.HizmetId == hizmet.Id,
        TarifeListesi.ValidFrom <= date.today(),
        (TarifeListesi.ValidTo >= date.today()) | (TarifeListesi.ValidTo == None),
        TarifeListesi.IsActive == True
    ).first()
    
    fiyat = tarife.OverridePrice if tarife else hizmet.Fiyat
    currency = tarife.OverrideCurrency if tarife else hizmet.ParaBirimi
    
    # 4. Kur çevirme
    if currency != "TRY":
        kur_data = get_today_rate(currency_from=currency, currency_to="TRY", date=date.today())
        kur = kur_data["sell_rate"]
    else:
        kur = 1.0
    
    # 5. Pricing Engine
    engine = PricingEngine()
    result = engine.calculate(
        calculation_type=hizmet.CalculationType,
        base_price=fiyat,
        formula_params=hizmet.FormulaParams,
        input_data=request.input_data,
        currency=currency
    )
    
    subtotal_try = result["subtotal"] * Decimal(str(kur))
    kdv_oran = hizmet.KdvOrani / 100
    kdv_tutar = subtotal_try * kdv_oran
    genel_toplam = subtotal_try + kdv_tutar
    
    # 6. WorkOrderItem kaydet
    work_order_item = WorkOrderItem(
        work_order_id=work_order_id,
        item_type="SERVICE",
        service_id=hizmet.Id,
        service_code=hizmet.Kod,
        description=f"{hizmet.Ad} - {result['calculation_details']}",
        quantity=request.input_data.get("quantity", 1),
        unit=hizmet.Birim,
        unit_price=subtotal_try / Decimal(str(request.input_data.get("quantity", 1))),
        subtotal=subtotal_try,
        tax_percent=hizmet.KdvOrani,
        tax_amount=kdv_tutar,
        total=genel_toplam
    )
    db.add(work_order_item)
    db.flush()
    
    # 7. Kişi listesi kaydet (RequiresPersonCount=True ise)
    if hizmet.RequiresPersonCount and request.persons:
        for person_data in request.persons:
            person = WorkOrderPerson(
                work_order_id=work_order_id,
                work_order_item_id=work_order_item.Id,
                full_name=person_data["full_name"],
                tc_kimlik_no=person_data.get("tc_kimlik_no"),
                passport_no=person_data.get("passport_no"),
                nationality=person_data.get("nationality"),
                phone=person_data.get("phone")
            )
            db.add(person)
    
    # 8. WorkOrder total güncelle
    items = db.query(WorkOrderItem).filter(
        WorkOrderItem.work_order_id == work_order_id
    ).all()
    total = sum(item.total for item in items)
    
    if work_order.is_cabatoge_tr_flag:
        total = total * Decimal("0.90")
    
    work_order.total_amount = total
    
    db.commit()
    
    return api_response(
        data={
            "work_order_item_id": work_order_item.Id,
            "pricing": {
                "subtotal": float(subtotal_try),
                "kdv": float(kdv_tutar),
                "total": float(genel_toplam),
                "calculation_details": result["calculation_details"]
            },
            "work_order_total": float(total)
        },
        message="Kalem eklendi"
    )
```

**Pydantic Schemas:**
```python
# backend/aliaport_api/modules/saha_personel/schemas.py

class PersonInput(BaseModel):
    full_name: str
    tc_kimlik_no: Optional[str] = None
    passport_no: Optional[str] = None
    nationality: Optional[str] = None
    phone: Optional[str] = None

class AddItemRequest(BaseModel):
    hizmet_kod: str
    input_data: dict  # {"quantity": 2} veya {"weight": 500, "days": 3}
    persons: Optional[List[PersonInput]] = None
```

**Frontend Kullanımı:**
```typescript
// Ek kalem ekleme formu
const AddItemForm = ({ workOrderId, onSuccess }) => {
  const [selectedService, setSelectedService] = useState(null);
  const [persons, setPersons] = useState([]);
  
  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/hizmet')
  });
  
  const { mutate: addItem } = useMutation({
    mutationFn: (data) => api.post(`/field-personnel/add-item/${workOrderId}`, data),
    onSuccess: (response) => {
      toast.success(`Kalem eklendi: ${response.data.pricing.total} TL`);
      onSuccess();
    }
  });
  
  const handleServiceSelect = async (service) => {
    setSelectedService(service);
    
    // Otomatik fiyat hesapla (preview)
    const response = await api.post('/work-order/calculate-price', {
      hizmet_kod: service.Kod,
      tarih: new Date().toISOString().split('T')[0],
      input_data: { quantity: 1 }
    });
    
    console.log('Estimated price:', response.data);
  };
  
  const handleSubmit = () => {
    const input_data = {
      quantity: parseFloat(formData.quantity)
    };
    
    // Kişi sayısı gerekli mi?
    const requestData = {
      hizmet_kod: selectedService.Kod,
      input_data,
      persons: selectedService.RequiresPersonCount ? persons : undefined
    };
    
    addItem(requestData);
  };
  
  return (
    <Form onSubmit={handleSubmit}>
      <Select
        label="Hizmet Seç"
        options={services?.data || []}
        onChange={handleServiceSelect}
        getOptionLabel={(s) => `${s.Kod} - ${s.Ad}`}
      />
      
      {selectedService && (
        <>
          <Input
            label={`Miktar (${selectedService.Birim})`}
            type="number"
            name="quantity"
            defaultValue={1}
          />
          
          {selectedService.RequiresPersonCount && (
            <PersonListInput
              count={formData.quantity}
              value={persons}
              onChange={setPersons}
            />
          )}
          
          <Button type="submit">Ekle</Button>
        </>
      )}
    </Form>
  );
};
```

---

### Kullanım Senaryosu: Saha Personeli İş Akışı

```
1. Saha Personeli Tablet Açar
   └─ GET /field-personnel/active-work-orders
      Response: [WO-2025-00123, WO-2025-00124, ...]

2. "WO-2025-00123" İş Emrini Seçer
   └─ Mevcut kalemler:
      - TMP.006: Transpalet 3 saat (2340 TL)
      - TMP.020: Forklift 2 blok (10420 TL)

3. "➕ Ek Kalem Ekle" Butonuna Tıklar
   └─ Hizmet listesi açılır (Autocomplete)

4. "TMP.017 - Teknisyen Transferi" Seçer
   └─ RequiresPersonCount=True olduğu için kişi formu açılır

5. Kişi Listesi Girer:
   ├─ Ahmet Yılmaz (TC: 12345678901)
   ├─ John Smith (Passport: US1234567)
   └─ Miktar: 2 kişi

6. "Ekle" Butonuna Tıklar
   └─ POST /field-personnel/add-item/123
      Request:
      {
        "hizmet_kod": "TMP.017",
        "input_data": {"quantity": 2},
        "persons": [
          {"full_name": "Ahmet Yılmaz", "tc_kimlik_no": "12345678901"},
          {"full_name": "John Smith", "passport_no": "US1234567"}
        ]
      }

7. Backend İşlemleri:
   ├─ Tarife bul (TMP.017 = 50 USD/kişi)
   ├─ Kur çek (USD = 32.50 TL)
   ├─ Pricing Engine: 50 × 2 = 100 USD = 3250 TL
   ├─ KDV ekle (%20): 650 TL
   ├─ WorkOrderItem kaydet (total = 3900 TL)
   ├─ WorkOrderPerson kaydet (2 kişi)
   └─ WorkOrder.total_amount güncelle

8. Response:
   {
     "work_order_item_id": 78,
     "pricing": {
       "subtotal": 3250.0,
       "kdv": 650.0,
       "total": 3900.0,
       "calculation_details": "50.0 USD × 2 KISI = 100.0 USD"
     },
     "work_order_total": 16660.0
   }

9. Toast Gösterilir:
   "✅ Kalem eklendi: 3900 TL"

10. İş emri listesi güncellenir (yeni kalem görünür)
```

---

## 🔗 Diğer Modüllerle İlişkiler

### İş Emri Modülü
```sql
WorkLog.work_order_id → WorkOrder.Id
WorkOrderItem.work_log_id → WorkLog.id
```

### Motorbot/Sefer Modülü
```sql
WorkLog.motorbot_id → Motorbot.Id
WorkLog.sefer_id → MbTrip.Id
```

---

## 📚 Kaynaklar

**İlgili Dosyalar:**
- `backend/aliaport_api/modules/saha/models.py`
- `backend/aliaport_api/modules/saha/router.py`
- `frontend/src/features/saha/components/WorkLogList.tsx`

**İlgili Runbook'lar:**
- `04_MODUL_ISEMRI.md`: İş emri entegrasyonu
- `07_MODUL_HIZMET.md`: **Pricing Engine + Otomatik Fiyatlandırma** 🆕
- `10_MODUL_GUVENLIK.md`: Güvenlik onay entegrasyonu

---

**Son Güncelleme:** 25 Kasım 2025  
**Güncelleyen:** AI Documentation Agent  
**Versiyon:** 2.0 (Aktif İş Emri Görüntüleme + Dinamik Kalem Ekleme Eklendi)
