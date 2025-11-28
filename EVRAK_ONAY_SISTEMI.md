# Araç Evrak Onay Sistemi - Mimari

## Genel Akış

### Portal (Dış Kullanıcı) Tarafı
1. Firma kullanıcısı portal'de araç evraklarını yükler
2. Belge yüklendiğinde otomatik **PENDING** (Onay Bekliyor) durumuna geçer
3. Kullanıcı sadece kendi evraklarını görüp yükleyebilir
4. **Onay yetkisi YOK**

### Web GUI (İç Kullanıcı - Aliaport Yöneticisi) Tarafı
1. Yöneticiler tüm firmaların yüklediği evrakları görebilir
2. **Onay/Red** işlemi yapabilir:
   - `APPROVED`: Evrak onaylandı → Araç aktif olabilir
   - `REJECTED`: Evrak reddedildi (red nedeni girilir) → Firma tekrar yüklemeli
3. Süresi dolan evraklar otomatik `EXPIRED` olur
4. EXPIRED evraklar tekrar onay gerektirir

## Durum Geçişleri

```
MISSING (Eksik)
   ↓
[Kullanıcı yükler]
   ↓
PENDING (Onay Bekliyor)
   ↓
   ├─→ APPROVED (Onaylandı) ──[Süre dolarsa]──→ EXPIRED ──→ PENDING (Yeni yükleme)
   │
   └─→ REJECTED (Reddedildi) ──[Kullanıcı tekrar yükler]──→ PENDING
```

## Geliştirme Adımları

### Faz 1: Backend Endpoint (✅ Tamamlandı)
- [x] `GET /api/v1/portal/vehicles/{id}/documents` - Evrak listesi
- [x] `POST /api/v1/portal/vehicles/{id}/documents/{type}/upload` - Dosya yükleme
- [x] `check_document_expiry()` scheduled job - Süre dolmuş belgeleri EXPIRED yap
- [ ] `PUT /api/v1/admin/vehicles/documents/{doc_id}/approve` - Onaylama
- [ ] `PUT /api/v1/admin/vehicles/documents/{doc_id}/reject` - Reddetme
- [ ] `GET /api/v1/admin/vehicles/documents/pending` - Onay bekleyen evraklar listesi

### Faz 2: Web GUI Onay Ekranı (TODO)
**Lokasyon:** `frontend/src/features/admin/VehicleDocumentApproval.tsx`

#### Özellikler:
- Tüm firmaların PENDING evraklarını listele
- Firma adı, araç plakası, evrak tipi, yükleme tarihi göster
- Dosya önizleme (PDF/resim)
- **Onayla** butonu → status=APPROVED
- **Reddet** modal → red nedeni textarea + status=REJECTED
- Filtreleme: Firma, evrak tipi, tarih aralığı
- Pagination (sayfalama)

#### API Entegrasyonu:
```typescript
// Onay bekleyen evraklar
GET /api/v1/admin/vehicles/documents/pending
Response: {
  total: number,
  items: [
    {
      id: number,
      vehicle_id: number,
      vehicle_plaka: string,
      cari_name: string,
      doc_type_name: string,
      uploaded_at: string,
      file_storage_key: string
    }
  ]
}

// Onaylama
PUT /api/v1/admin/vehicles/documents/{doc_id}/approve
Body: { expiry_date?: string }

// Reddetme
PUT /api/v1/admin/vehicles/documents/{doc_id}/reject
Body: { reject_reason: string }
```

### Faz 3: Bildirimler (Opsiyonel)
- Portal kullanıcısına email: "Evrakınız onaylandı/reddedildi"
- Admin'e email: "Yeni evrak onay bekliyor"
- Portal'de bildirim badge'i

### Faz 4: Süre Dolumu Otomasyonu (✅ Kısmi Tamamlandı)
- [x] Backend scheduled job: Her gün 00:00'da `check_document_expiry()` çalışıyor
- [x] `compute_vehicle_status()` EXPIRED evrakları "EKSİK_EVRAK" olarak işaretliyor
- [ ] Email hatırlatma: 30/15/7 gün kala uyarı

## Dosya Yapısı

### Backend
```
backend/aliaport_api/
├── modules/dijital_arsiv/
│   ├── models.py                           # VehicleDocument, VehicleDocumentType
│   ├── vehicle_documents.py                # Helper fonksiyonlar
│   ├── portal_employee_router.py           # Portal endpoints (✅)
│   └── admin_vehicle_document_router.py    # Admin onay endpoints (✅)
└── jobs/
    └── document_expiry_job.py              # Scheduled task (✅)
```

### Frontend
```
frontend/src/features/
├── portal/components/
│   └── VehicleDocumentsPanel.tsx           # Portal kullanıcı ekranı (✅)
└── admin/
    ├── VehicleDocumentApproval.tsx         # Admin onay ekranı (✅)
    └── VehicleDocumentNotificationBadge.tsx # Bildirim badge (✅)
```

## Kullanım Kılavuzu

### Web GUI Entegrasyonu

#### 1. Admin Onay Ekranı
```typescript
import { VehicleDocumentApproval } from '@/features/admin/VehicleDocumentApproval';

// Router'a ekle
{
  path: '/admin/vehicle-documents/approval',
  element: <VehicleDocumentApproval />,
  // TODO: Admin permission guard ekle
}
```

#### 2. Bildirim Badge (Ana Ekran/Header)
```typescript
import { VehicleDocumentNotificationBadge } from '@/features/admin/VehicleDocumentNotificationBadge';
import { useNavigate } from 'react-router-dom';

function AppHeader() {
  const navigate = useNavigate();
  
  return (
    <header>
      {/* ... diğer header içeriği */}
      <VehicleDocumentNotificationBadge 
        onNotificationClick={() => navigate('/admin/vehicle-documents/approval')}
      />
    </header>
  );
}
```

#### 3. Yetkilendirme (TODO)
Admin endpoint'lerine erişim için permission kontrolü eklenecek:
```python
# backend/aliaport_api/modules/dijital_arsiv/admin_vehicle_document_router.py

from ...core.auth import get_current_admin_user, require_permissions

@router.get("/pending")
def get_pending_documents(
    current_user = Depends(get_current_admin_user),
    permissions = Depends(require_permissions(["vehicle_documents.approve"]))
):
    ...
```

## Güvenlik
- Portal API: `get_current_portal_user()` dependency - Sadece kendi firmasının evrakları
- Admin API: `get_current_admin_user()` dependency - Tüm evrakları görebilir, onay yetkisi
- File download: Token + ownership kontrolü

## Öneri: İlk Geliştirme
1. ✅ Portal tarafı tamamlandı
2. **Şimdi yapılacak:** Admin onay endpoint'leri ekle
3. **Sonra:** Web GUI'de onay ekranı tasarla
4. **Sonra:** Email bildirimleri

---
**Notlar:**
- KASKO opsiyonel, listede gösterilmiyor (is_required=False)
- RUHSAT, MUAYENE, TRAFIK zorunlu (is_required=True)
- Tarih girişi manuel veya OCR ile (gelecek özellik)
