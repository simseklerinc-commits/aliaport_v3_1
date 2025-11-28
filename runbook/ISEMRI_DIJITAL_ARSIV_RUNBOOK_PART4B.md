# Aliaport İş Emri ve Dijital Arşiv Modülü - RUNBOOK (Bölüm 4B/5)

**Versiyon:** 2.0  
**Tarih:** 25 Kasım 2025  
**Kapsam:** Teknik Spesifikasyonlar - API Endpoints ve İş Akışları  
**Hazırlayan:** GitHub Copilot + Aliaport Ekibi

---

## 🌐 BÖLÜM 4B: API ENDPOINTS VE İŞ AKIŞLARI

### 4.6. API Endpoint Yapısı

#### 4.6.1. Portal API (Dış Müşteri)

```
BASE_URL: https://api.aliaport.com/v1/portal

Authentication: JWT Bearer Token (portal_user)

Endpoints:
├── /auth
│   ├── POST /login                    # Portal giriş
│   ├── POST /logout                   # Çıkış
│   ├── POST /refresh-token            # Token yenileme
│   ├── POST /change-password          # Şifre değiştirme
│   └── POST /forgot-password          # Şifre sıfırlama talebi
│
├── /work-orders
│   ├── GET  /                         # Taleplerim listesi
│   ├── GET  /{id}                     # Talep detayı
│   ├── POST /                         # Yeni talep oluştur
│   ├── PUT  /{id}                     # Talep güncelle (DRAFT ise)
│   └── DELETE /{id}                   # Talep sil (DRAFT ise)
│
├── /documents
│   ├── POST /upload                   # Belge yükle
│   ├── GET  /{id}                     # Belge detayı
│   ├── GET  /{id}/download            # Belge indir
│   └── POST /{id}/replace             # Belge değiştir (versiyon oluştur)
│
├── /profile
│   ├── GET  /                         # Profil bilgileri
│   └── PUT  /                         # Profil güncelle
│
└── /notifications
    ├── GET  /                         # Bildirimler
    └── PUT  /{id}/read                # Bildirimi okundu işaretle
```

---

#### 4.6.2. Internal API (Aliaport Personeli)

```
BASE_URL: https://api.aliaport.com/v1/internal

Authentication: JWT Bearer Token (internal user + RBAC)

Endpoints:
├── /portal-users
│   ├── GET  /                         # Portal kullanıcıları listesi
│   ├── GET  /{id}                     # Kullanıcı detayı
│   ├── POST /                         # Yeni kullanıcı oluştur
│   ├── PUT  /{id}                     # Kullanıcı güncelle
│   ├── POST /{id}/reset-password      # Şifre sıfırla
│   ├── PUT  /{id}/activate            # Kullanıcı aktif et
│   └── PUT  /{id}/deactivate          # Kullanıcı devre dışı bırak
│
├── /work-orders
│   ├── GET  /                         # Tüm iş emirleri (filtreleme)
│   ├── GET  /{id}                     # İş emri detayı
│   ├── POST /{id}/approve             # İş emrini onayla (belge onayı)
│   ├── POST /{id}/reject              # İş emrini reddet
│   ├── POST /{id}/start               # İş emrini başlat
│   ├── POST /{id}/complete            # İş emrini tamamla
│   ├── POST /{id}/close               # İş emrini kapat (fatura sonrası)
│   └── POST /{id}/items               # Hizmet/kaynak ekle
│
├── /archive
│   ├── GET  /documents                # Belge listesi (durum filtreleme)
│   ├── GET  /documents/{id}           # Belge detayı
│   ├── POST /documents/{id}/approve   # Belge onayla
│   ├── POST /documents/{id}/reject    # Belge reddet
│   ├── GET  /documents/{id}/preview   # Belge önizleme
│   ├── GET  /documents/{id}/versions  # Belge versiyon geçmişi
│   └── GET  /dashboard                # Arşiv özet istatistikler
│
├── /invoices
│   ├── POST /                         # Fatura oluştur (Mikro Jump)
│   ├── GET  /{id}                     # Fatura detayı
│   └── GET  /                         # Fatura listesi
│
└── /notifications
    └── POST /send-bulk                # Toplu bildirim gönder
```

---

### 4.7. Pydantic Schemas

#### 4.7.1. ArchiveDocument Schemas

```python
# backend/aliaport_api/modules/dijital_arsiv/schemas.py

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from .models import DocumentCategory, DocumentType, DocumentStatus

# ────────────────────────────────────────────────────────
# BASE SCHEMAS
# ────────────────────────────────────────────────────────

class DocumentBase(BaseModel):
    """Belge base schema"""
    category: DocumentCategory
    document_type: DocumentType
    description: Optional[str] = None
    tags: Optional[str] = None  # JSON array string

class DocumentCreate(DocumentBase):
    """Belge oluşturma (upload)"""
    work_order_id: Optional[int] = None
    cari_id: Optional[int] = None
    expires_at: Optional[datetime] = None  # Süreli belgeler için

class DocumentUpdate(BaseModel):
    """Belge güncelleme"""
    description: Optional[str] = None
    tags: Optional[str] = None
    expires_at: Optional[datetime] = None

class DocumentApprove(BaseModel):
    """Belge onaylama"""
    approval_note: Optional[str] = Field(None, max_length=500)

class DocumentReject(BaseModel):
    """Belge reddetme"""
    rejection_reason: str = Field(..., max_length=500)
    rejection_detail: str = Field(..., max_length=2000)

# ────────────────────────────────────────────────────────
# RESPONSE SCHEMAS
# ────────────────────────────────────────────────────────

class DocumentResponse(DocumentBase):
    """Belge response (temel)"""
    id: int
    work_order_id: Optional[int]
    cari_id: Optional[int]
    file_name: str
    file_size: int
    file_type: str
    version: int
    is_latest_version: bool
    status: DocumentStatus
    uploaded_at: datetime
    
    # Computed
    file_size_mb: float
    is_expired: bool
    days_until_expiry: Optional[int]
    
    class Config:
        from_attributes = True

class DocumentDetailResponse(DocumentResponse):
    """Belge detay response (full)"""
    file_path: str
    file_hash: Optional[str]
    previous_version_id: Optional[int]
    
    # Onay bilgileri
    approved_by_id: Optional[int]
    approved_at: Optional[datetime]
    approval_note: Optional[str]
    
    # Red bilgileri
    rejected_by_id: Optional[int]
    rejected_at: Optional[datetime]
    rejection_reason: Optional[str]
    rejection_detail: Optional[str]
    
    # Süre bilgileri
    expires_at: Optional[datetime]
    expiry_notification_sent: bool
    
    # Yükleme bilgileri
    uploaded_by_id: Optional[int]
    uploaded_by_portal_user_id: Optional[int]
    
    created_at: datetime
    updated_at: datetime

class DocumentVersionHistory(BaseModel):
    """Belge versiyon geçmişi"""
    version: int
    file_name: str
    file_size_mb: float
    status: DocumentStatus
    uploaded_at: datetime
    uploaded_by: str  # User name or portal user name
    
    # Onay/Red bilgileri
    approved_at: Optional[datetime]
    approved_by: Optional[str]
    rejected_at: Optional[datetime]
    rejected_by: Optional[str]
    rejection_reason: Optional[str]

class DocumentListResponse(BaseModel):
    """Belge listesi response (pagination)"""
    items: List[DocumentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

# ────────────────────────────────────────────────────────
# DASHBOARD/STATISTICS
# ────────────────────────────────────────────────────────

class ArchiveDashboard(BaseModel):
    """Dijital arşiv dashboard özet"""
    # Durum kartları
    missing_documents: int
    pending_approval: int
    rejected: int
    approved: int
    
    # Kategori bazlı
    work_order_documents: int
    employee_documents: int
    vehicle_documents: int
    cari_documents: int
    
    # Süre durumu
    expiring_soon: int  # 30 gün içinde
    expired: int
    
    # Son yüklenenler
    recent_uploads: List[DocumentResponse]
```

---

#### 4.7.2. WorkOrder Schemas (Güncellenmiş)

```python
# backend/aliaport_api/modules/isemri/schemas.py

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from .models import WorkOrderType, WorkOrderStatus, WorkOrderApprovalStatus

# ────────────────────────────────────────────────────────
# BASE SCHEMAS
# ────────────────────────────────────────────────────────

class WorkOrderBase(BaseModel):
    """İş emri base schema"""
    work_order_type: WorkOrderType
    subject: str = Field(..., max_length=500)
    description: Optional[str] = None
    
    # Gemi bilgileri
    vessel_name: str = Field(..., max_length=255)
    imo_number: Optional[str] = Field(None, max_length=20)
    flag: Optional[str] = Field(None, max_length=100)
    gross_tonnage: Optional[int] = None
    
    # Tarihler
    estimated_arrival: datetime
    estimated_departure: Optional[datetime] = None

class WorkOrderCreate(WorkOrderBase):
    """İş emri oluşturma (Portal)"""
    # Portal kullanıcı ise cari_id otomatik alınır
    pass

class WorkOrderUpdate(BaseModel):
    """İş emri güncelleme (DRAFT ise)"""
    subject: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    vessel_name: Optional[str] = Field(None, max_length=255)
    imo_number: Optional[str] = Field(None, max_length=20)
    flag: Optional[str] = Field(None, max_length=100)
    gross_tonnage: Optional[int] = None
    estimated_arrival: Optional[datetime] = None
    estimated_departure: Optional[datetime] = None

class WorkOrderStart(BaseModel):
    """İş emri başlatma (Internal)"""
    started_at: Optional[datetime] = None  # Default: now
    estimated_completion: datetime
    responsible_user_id: int
    notes: Optional[str] = None

class WorkOrderComplete(BaseModel):
    """İş emri tamamlama (Internal)"""
    completed_at: Optional[datetime] = None  # Default: now
    completion_notes: Optional[str] = None

# ────────────────────────────────────────────────────────
# RESPONSE SCHEMAS
# ────────────────────────────────────────────────────────

class WorkOrderResponse(WorkOrderBase):
    """İş emri response (temel)"""
    id: int
    work_order_no: str
    cari_id: int
    portal_user_id: Optional[int]
    status: WorkOrderStatus
    approval_status: WorkOrderApprovalStatus
    created_at: datetime
    
    # Computed
    is_portal_created: bool
    pending_documents_count: int
    approved_documents_count: int
    
    class Config:
        from_attributes = True

class WorkOrderDetailResponse(WorkOrderResponse):
    """İş emri detay response (full)"""
    # Onay bilgileri
    approved_by_id: Optional[int]
    approved_at: Optional[datetime]
    
    # Başlatma bilgileri
    started_by_id: Optional[int]
    started_at: Optional[datetime]
    estimated_completion: Optional[datetime]
    
    # Tamamlama bilgileri
    completed_by_id: Optional[int]
    completed_at: Optional[datetime]
    completion_notes: Optional[str]
    
    # İlişkili veriler
    cari_unvan: str  # Nested
    portal_user_name: Optional[str]  # Nested
    documents: List["DocumentResponse"]  # Nested
    work_order_items: List["WorkOrderItemResponse"]  # Nested
    
    updated_at: datetime

class WorkOrderListResponse(BaseModel):
    """İş emri listesi response (pagination)"""
    items: List[WorkOrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
```

---

#### 4.7.3. PortalUser Schemas

```python
# backend/aliaport_api/modules/portal/schemas.py

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator

# ────────────────────────────────────────────────────────
# AUTH SCHEMAS
# ────────────────────────────────────────────────────────

class PortalLogin(BaseModel):
    """Portal giriş"""
    email: EmailStr
    password: str

class PortalLoginResponse(BaseModel):
    """Portal giriş response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # Seconds
    user: "PortalUserResponse"
    must_change_password: bool

class PasswordChange(BaseModel):
    """Şifre değiştirme"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
    new_password_confirm: str
    
    @validator('new_password_confirm')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Şifreler eşleşmiyor')
        return v
    
    @validator('new_password')
    def password_strength(cls, v):
        """Şifre kuralları kontrol"""
        if not any(c.isupper() for c in v):
            raise ValueError('En az bir büyük harf gerekli')
        if not any(c.islower() for c in v):
            raise ValueError('En az bir küçük harf gerekli')
        if not any(c.isdigit() for c in v):
            raise ValueError('En az bir rakam gerekli')
        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in v):
            raise ValueError('En az bir özel karakter gerekli')
        return v

class ForgotPassword(BaseModel):
    """Şifre sıfırlama talebi"""
    email: EmailStr

class ResetPassword(BaseModel):
    """Şifre sıfırlama"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)
    new_password_confirm: str
    
    @validator('new_password_confirm')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Şifreler eşleşmiyor')
        return v

# ────────────────────────────────────────────────────────
# PORTAL USER SCHEMAS
# ────────────────────────────────────────────────────────

class PortalUserBase(BaseModel):
    """Portal kullanıcı base"""
    email: EmailStr
    full_name: str = Field(..., max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    is_admin: bool = False

class PortalUserCreate(PortalUserBase):
    """Portal kullanıcı oluşturma (Internal)"""
    cari_id: int
    send_welcome_email: bool = True

class PortalUserUpdate(BaseModel):
    """Portal kullanıcı güncelleme"""
    full_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)

class PortalUserResponse(PortalUserBase):
    """Portal kullanıcı response"""
    id: int
    cari_id: int
    cari_unvan: str  # Nested
    is_active: bool
    is_email_verified: bool
    last_login_at: Optional[datetime]
    login_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class PortalUserDetailResponse(PortalUserResponse):
    """Portal kullanıcı detay response"""
    last_login_ip: Optional[str]
    created_by_id: int
    created_by_name: str  # Nested
    updated_at: datetime
    
    # İstatistikler
    total_work_orders: int
    active_work_orders: int
    completed_work_orders: int
```

---

### 4.8. İş Akışı Diyagramları

#### 4.8.1. İş Emri Oluşturma Akışı (Portal)

```
┌─────────────────────────────────────────────────────────────┐
│ PORTAL KULLANICI - İŞ EMRİ OLUŞTURMA                       │
└─────────────────────────────────────────────────────────────┘

1. KULLANICI GİRİŞİ
   │
   ├─► POST /v1/portal/auth/login
   │   Request: {email, password}
   │   Response: {access_token, user, must_change_password}
   │
   └─► İlk giriş ise → POST /v1/portal/auth/change-password
   
2. İŞ EMRİ FORMU DOLDURMA
   │
   └─► POST /v1/portal/work-orders
       Request: {
         work_order_type: "HIZMET",
         subject: "Römorkaj hizmeti",
         vessel_name: "MSC MERAVIGLIA",
         estimated_arrival: "2025-11-27T14:00:00",
         ...
       }
       Response: {
         id: 1234,
         work_order_no: "WO202511025",
         status: "DRAFT",
         approval_status: "PENDING"
       }

3. BELGE YÜKLEME (ZORUNLU: Gümrük İzin Belgesi)
   │
   └─► POST /v1/portal/documents/upload
       Request: FormData {
         work_order_id: 1234,
         category: "WORK_ORDER",
         document_type: "GUMRUK_IZIN_BELGESI",
         file: [binary]
       }
       Response: {
         id: 5678,
         document_type: "GUMRUK_IZIN_BELGESI",
         status: "UPLOADED",
         version: 1
       }
       
       Backend İşlemler:
       ├─► Dosya storage'a kaydet
       ├─► SHA-256 hash hesapla
       ├─► ArchiveDocument oluştur
       └─► WorkOrder güncelle (document ilişkisi)

4. TALEBİ GÖNDERME
   │
   └─► PUT /v1/portal/work-orders/1234
       Request: {status: "PENDING_APPROVAL"}
       
       Backend İşlemler:
       ├─► Zorunlu belge kontrolü (has_required_documents)
       ├─► WorkOrder.status = "PENDING_APPROVAL"
       ├─► WorkOrder.approval_status = "PENDING"
       ├─► Email gönder (müşteriye onay + personele bildirim)
       └─► WebSocket bildirimi (dashboard)

5. SONUÇ
   │
   └─► Response: {
         message: "Talebiniz başarıyla oluşturuldu",
         work_order_no: "WO202511025",
         status: "PENDING_APPROVAL"
       }
```

---

#### 4.8.2. Belge İnceleme ve Onaylama Akışı (Internal)

```
┌─────────────────────────────────────────────────────────────┐
│ ALIAPORT PERSONEL - BELGE ONAYLAMA                         │
└─────────────────────────────────────────────────────────────┘

1. DASHBOARD'DA ONAY BEKLEYENLERİ GÖRME
   │
   └─► GET /v1/internal/archive/dashboard
       Response: {
         pending_approval: 3,
         recent_uploads: [...]
       }

2. ONAY BEKLEYENLERİ LİSTELEME
   │
   └─► GET /v1/internal/archive/documents?status=UPLOADED
       Response: {
         items: [
           {
             id: 5678,
             document_type: "GUMRUK_IZIN_BELGESI",
             work_order_id: 1234,
             file_name: "gumruk_izin.pdf",
             uploaded_at: "2025-11-25T15:45:00"
           }
         ]
       }

3. BELGE ÖNİZLEME
   │
   └─► GET /v1/internal/archive/documents/5678/preview
       Response: PDF Stream (inline display)

4A. BELGE ONAYLAMA
    │
    └─► POST /v1/internal/archive/documents/5678/approve
        Request: {
          approval_note: "Belge incelendi, uygun bulundu"
        }
        
        Backend İşlemler:
        ├─► ArchiveDocument.status = "APPROVED"
        ├─► ArchiveDocument.approved_by_id = current_user.id
        ├─► ArchiveDocument.approved_at = now()
        ├─► ArchiveDocument.approval_note = "..."
        ├─► 
        ├─► WorkOrder kontrolü:
        │   └─► Tüm belgeler onaylandı mı?
        │       └─► YES → WorkOrder.approval_status = "APPROVED"
        │       └─► NO  → WorkOrder.approval_status = "PENDING"
        ├─►
        ├─► Email gönder (müşteriye onay bildirimi)
        └─► WebSocket bildirimi

4B. BELGE REDDETME
    │
    └─► POST /v1/internal/archive/documents/5678/reject
        Request: {
          rejection_reason: "Belge tarihi eski (30 günden fazla)",
          rejection_detail: "Gümrük izin belgesi tarihi 15 Ekim..."
        }
        
        Backend İşlemler:
        ├─► ArchiveDocument.status = "REJECTED"
        ├─► ArchiveDocument.rejected_by_id = current_user.id
        ├─► ArchiveDocument.rejected_at = now()
        ├─► ArchiveDocument.rejection_reason = "..."
        ├─► ArchiveDocument.rejection_detail = "..."
        ├─►
        ├─► WorkOrder.approval_status = "REJECTED"
        ├─►
        ├─► Email gönder (müşteriye red + düzeltme talimatı)
        └─► WebSocket bildirimi

5. SONUÇ
   │
   └─► Response: {
         message: "Belge onaylandı/reddedildi",
         document: {...},
         work_order_approval_status: "APPROVED/REJECTED"
       }
```

---

#### 4.8.3. İş Emri Başlatma ve Tamamlama Akışı (Internal)

```
┌─────────────────────────────────────────────────────────────┐
│ ALIAPORT PERSONEL - İŞ EMRİ YÖNETİMİ                        │
└─────────────────────────────────────────────────────────────┘

1. BAŞLATILMAYA HAZIR İŞ EMİRLERİ
   │
   └─► GET /v1/internal/work-orders?approval_status=APPROVED&status=APPROVED
       Response: {
         items: [
           {
             id: 1234,
             work_order_no: "WO202511025",
             approval_status: "APPROVED",
             status: "APPROVED"
           }
         ]
       }

2. İŞ EMRİNİ BAŞLATMA
   │
   └─► POST /v1/internal/work-orders/1234/start
       Request: {
         started_at: "2025-11-25T16:45:00",
         estimated_completion: "2025-11-27T16:00:00",
         responsible_user_id: 5,
         notes: "2 römorkör atandı"
       }
       
       Backend İşlemler:
       ├─► WorkOrder.status = "IN_PROGRESS"
       ├─► WorkOrder.started_by_id = current_user.id
       ├─► WorkOrder.started_at = request.started_at
       ├─► WorkOrder.estimated_completion = request.estimated_completion
       ├─►
       ├─► Email gönder (müşteriye başlatma bildirimi)
       └─► WebSocket bildirimi

3. HİZMET/KAYNAK EKLEME (WorkOrderItem)
   │
   └─► POST /v1/internal/work-orders/1234/items
       Request: {
         hizmet_id: 10,  # Römorkör hizmeti
         quantity: 2,
         unit_price: 5000,
         notes: "2 römorkör 3 saat görev yaptı"
       }
       
       Backend İşlemler:
       ├─► WorkOrderItem oluştur
       ├─► Toplam tutar hesapla
       └─► WorkOrder.updated_at = now()

4. İŞ EMRİNİ TAMAMLAMA
   │
   └─► POST /v1/internal/work-orders/1234/complete
       Request: {
         completed_at: "2025-11-27T16:00:00",
         completion_notes: "Römorkaj ve pilotaj sorunsuz tamamlandı"
       }
       
       Backend İşlemler:
       ├─► WorkOrderItem kontrolü (en az 1 hizmet olmalı)
       ├─► WorkOrder.status = "COMPLETED"
       ├─► WorkOrder.completed_by_id = current_user.id
       ├─► WorkOrder.completed_at = request.completed_at
       ├─► WorkOrder.completion_notes = request.completion_notes
       ├─►
       ├─► Email gönder (müşteriye tamamlama + toplam tutar)
       └─► WebSocket bildirimi

5. FATURA OLUŞTURMA (Mikro Jump Entegrasyonu)
   │
   └─► POST /v1/internal/invoices
       Request: {
         work_order_id: 1234,
         invoice_date: "2025-11-27",
         payment_terms: 30  # days
       }
       
       Backend İşlemler:
       ├─► WorkOrderItem'ları topla
       ├─► Mikro Jump API çağrısı:
       │   └─► POST https://mikro-api.com/invoices
       │       Request: {
       │         cari_code: "MSC001",
       │         items: [
       │           {description: "Römorkör", qty: 2, price: 5000},
       │           {description: "Pilotaj", qty: 1, price: 3000}
       │         ],
       │         total: 15600
       │       }
       │       Response: {invoice_no: "FAT2025-001234"}
       ├─►
       ├─► Invoice kaydet (database)
       ├─► WorkOrder.status = "CLOSED"
       ├─► WorkOrder.invoice_id = invoice.id
       ├─►
       ├─► Email gönder (müşteriye fatura bildirimi)
       └─► PDF fatura oluştur ve kaydet

6. SONUÇ
   │
   └─► Response: {
         message: "Fatura oluşturuldu",
         invoice_no: "FAT2025-001234",
         total: 15600,
         work_order_status: "CLOSED"
       }
```

---

### 4.9. Entegrasyon Noktaları

#### 4.9.1. File Storage Entegrasyonu

```python
# backend/aliaport_api/core/storage.py

import os
import hashlib
from pathlib import Path
from fastapi import UploadFile
from datetime import datetime

class FileStorage:
    """Dosya depolama yönetimi"""
    
    def __init__(self, base_path: str = "uploads"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    def save_document(self, file: UploadFile, category: str, work_order_no: str = None) -> dict:
        """
        Belgeyi kaydet
        
        Returns:
            {
                'file_path': 'uploads/documents/work_order/WO202511025/gumruk_izin.pdf',
                'file_name': 'gumruk_izin.pdf',
                'file_size': 2621440,  # bytes
                'file_type': 'application/pdf',
                'file_hash': 'a1b2c3...'  # SHA-256
            }
        """
        # Dizin yapısı: uploads/documents/{category}/{work_order_no}/{timestamp}_{filename}
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{file.filename}"
        
        if work_order_no:
            file_dir = self.base_path / "documents" / category.lower() / work_order_no
        else:
            file_dir = self.base_path / "documents" / category.lower()
        
        file_dir.mkdir(parents=True, exist_ok=True)
        file_path = file_dir / safe_filename
        
        # Dosyayı kaydet ve hash hesapla
        file_hash = hashlib.sha256()
        with open(file_path, "wb") as f:
            while chunk := file.file.read(8192):
                f.write(chunk)
                file_hash.update(chunk)
        
        return {
            "file_path": str(file_path),
            "file_name": file.filename,
            "file_size": file_path.stat().st_size,
            "file_type": file.content_type,
            "file_hash": file_hash.hexdigest()
        }
    
    def get_file_path(self, relative_path: str) -> Path:
        """Dosya yolunu döndür"""
        return Path(relative_path)
    
    def delete_file(self, file_path: str):
        """Dosyayı sil"""
        path = Path(file_path)
        if path.exists():
            path.unlink()
```

---

#### 4.9.2. Email Service Entegrasyonu

```python
# backend/aliaport_api/core/email.py

from typing import List
from jinja2 import Template
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class EmailService:
    """Email gönderme servisi"""
    
    def __init__(self, smtp_host: str, smtp_port: int, smtp_user: str, smtp_pass: str):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.smtp_user = smtp_user
        self.smtp_pass = smtp_pass
    
    def send_welcome_email(self, to_email: str, user_name: str, temp_password: str):
        """Karşılama emaili gönder"""
        subject = "Aliağaport Portal Erişim Bilgileri"
        
        template = Template("""
        Sayın {{ user_name }},
        
        Aliağaport İş Emri Takip Sistemi'ne hoş geldiniz.
        
        Giriş Bilgileriniz:
        🌐 Web Adresi: https://app.aliaport.com
        📧 Email: {{ email }}
        🔑 Geçici Şifre: {{ temp_password }}
        
        ⚠️ İlk girişte şifrenizi değiştirmeniz gerekmektedir.
        
        Saygılarımızla,
        Aliağaport
        """)
        
        body = template.render(user_name=user_name, email=to_email, temp_password=temp_password)
        
        self._send_email(to_email, subject, body)
    
    def send_document_approved_email(self, to_email: str, work_order_no: str, document_type: str):
        """Belge onay emaili"""
        # ... template render ...
        pass
    
    def send_document_rejected_email(self, to_email: str, work_order_no: str, 
                                    document_type: str, rejection_reason: str, rejection_detail: str):
        """Belge red emaili"""
        # ... template render ...
        pass
    
    def _send_email(self, to_email: str, subject: str, body: str):
        """Email gönder (SMTP)"""
        msg = MIMEMultipart()
        msg['From'] = self.smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
            server.starttls()
            server.login(self.smtp_user, self.smtp_pass)
            server.send_message(msg)
```

---

#### 4.9.3. Mikro Jump API Entegrasyonu

```python
# backend/aliaport_api/integrations/mikro_jump.py

import requests
from typing import List, Dict
from pydantic import BaseModel

class MikroInvoiceItem(BaseModel):
    """Fatura kalemi"""
    description: str
    quantity: float
    unit_price: float
    vat_rate: float = 20.0  # %20 KDV
    
    @property
    def total(self) -> float:
        return self.quantity * self.unit_price

class MikroJumpClient:
    """Mikro Jump API Client"""
    
    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def create_invoice(self, cari_code: str, items: List[MikroInvoiceItem], 
                      invoice_date: str, payment_terms: int = 30) -> Dict:
        """
        Fatura oluştur
        
        Returns:
            {
                'invoice_no': 'FAT2025-001234',
                'total': 15600.00,
                'status': 'SUCCESS'
            }
        """
        payload = {
            "cari_code": cari_code,
            "invoice_date": invoice_date,
            "payment_terms": payment_terms,
            "items": [
                {
                    "description": item.description,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "vat_rate": item.vat_rate,
                    "total": item.total
                }
                for item in items
            ],
            "subtotal": sum(item.total for item in items),
            "vat_total": sum(item.total * (item.vat_rate / 100) for item in items),
            "grand_total": sum(item.total * (1 + item.vat_rate / 100) for item in items)
        }
        
        response = requests.post(
            f"{self.api_url}/invoices",
            json=payload,
            headers=self.headers,
            timeout=30
        )
        
        response.raise_for_status()
        return response.json()
```

---

## 📊 Özet: Teknik Spesifikasyonlar Tamamlandı

**Part 4A:**
✅ ArchiveDocument modeli ve migration
✅ PortalUser modeli ve migration
✅ WorkOrder güncellemeleri
✅ Cari relationship'leri

**Part 4B:**
✅ Portal API endpoints (12 endpoint)
✅ Internal API endpoints (20+ endpoint)
✅ Pydantic schemas (tüm CRUD operations)
✅ İş akışı diyagramları (3 temel akış)
✅ Entegrasyon noktaları (File Storage, Email, Mikro Jump)

---

## 🔗 Sonraki Bölüm

**BÖLÜM 5: İLERİ SEVİYE ÖZELLİKLER**
- Versiyon kontrolü mekanizması
- Süre sınırlı belgeler (SRC-5, araç sigortası)
- Otomatik bildirimler (scheduler)
- Raporlama ve analitik

---

**Part 4 tamamlandı!** ✅
