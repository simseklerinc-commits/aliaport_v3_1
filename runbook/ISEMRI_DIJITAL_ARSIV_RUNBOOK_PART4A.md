# Aliaport İş Emri ve Dijital Arşiv Modülü - RUNBOOK (Bölüm 4A/5)

**Versiyon:** 2.0  
**Tarih:** 25 Kasım 2025  
**Kapsam:** Teknik Spesifikasyonlar - Database Schema ve Modeller  
**Hazırlayan:** GitHub Copilot + Aliaport Ekibi

---

## 🗄️ BÖLÜM 4A: DATABASE SCHEMA VE MODELLER

### 4.1. Genel Veritabanı Yapısı

#### 4.1.1. Yeni ve Güncellenen Tablolar

```
Yeni Tablolar:
├── archive_document (Dijital arşiv merkezi)
├── portal_user (Portal kullanıcıları)
└── document_version_history (Belge versiyon geçmişi)

Güncellenecek Tablolar:
├── work_order (approval_status, portal_user_id eklenmeli)
└── user (portal_access flag eklenmeli)

İlişkili Mevcut Tablolar:
├── cari (Müşteri firmaları)
├── work_order_item (Hizmetler/kaynaklar)
└── hizmet (Hizmet tanımları)
```

---

### 4.2. ArchiveDocument Modeli

#### 4.2.1. Model Tanımı (SQLAlchemy)

```python
# backend/aliaport_api/modules/dijital_arsiv/models.py

from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from aliaport_api.database import Base
import enum

class DocumentCategory(str, enum.Enum):
    """Belge kategorileri"""
    WORK_ORDER = "WORK_ORDER"        # İş emri belgeleri
    EMPLOYEE = "EMPLOYEE"            # Çalışan belgeleri
    VEHICLE = "VEHICLE"              # Araç belgeleri
    CARI = "CARI"                    # Cari firma belgeleri
    GENERAL = "GENERAL"              # Genel belgeler

class DocumentType(str, enum.Enum):
    """Belge tipleri"""
    # İş Emri Belgeleri
    GUMRUK_IZIN_BELGESI = "GUMRUK_IZIN_BELGESI"  # Gümrük izin belgesi (ZORUNLU)
    MANIFESTO = "MANIFESTO"                       # Manifesto
    BILL_OF_LADING = "BILL_OF_LADING"            # Konşimento
    ARRIVAL_NOTICE = "ARRIVAL_NOTICE"            # Arrival notice
    PROFORMA_INVOICE = "PROFORMA_INVOICE"        # Proforma fatura
    CUSTOMS_DECLARATION = "CUSTOMS_DECLARATION"  # Gümrük beyannamesi
    
    # Çalışan Belgeleri (Gelecek)
    SRC5 = "SRC5"                                # Liman güvenlik kartı (SÜRELİ - 1 yıl)
    SIGORTA_LISTESI = "SIGORTA_LISTESI"          # SGK sigorta belgesi (SÜRELİ - 1 yıl)
    NUFUS_CUZDANI = "NUFUS_CUZDANI"              # Nüfus cüzdanı fotokopisi
    
    # Araç Belgeleri (Gelecek)
    ARAC_RUHSAT = "ARAC_RUHSAT"                  # Araç ruhsat belgesi
    ARAC_MUAYENE = "ARAC_MUAYENE"                # Araç muayene belgesi (SÜRELİ - 2 yıl)
    ARAC_SIGORTA = "ARAC_SIGORTA"                # Araç trafik sigortası (SÜRELİ - 1 yıl)
    
    # Cari Belgeleri (Gelecek)
    VERGI_LEVHASI = "VERGI_LEVHASI"              # Vergi levhası
    IMZA_SIRKULERI = "IMZA_SIRKULERI"            # İmza sirküleri
    TICARET_SICIL_GAZETESI = "TICARET_SICIL_GAZETESI"  # Ticaret sicil gazetesi

class DocumentStatus(str, enum.Enum):
    """Belge durumları"""
    UPLOADED = "UPLOADED"      # Yüklendi (onay bekliyor)
    APPROVED = "APPROVED"      # Onaylandı
    REJECTED = "REJECTED"      # Reddedildi
    EXPIRED = "EXPIRED"        # Süresi doldu
    ARCHIVED = "ARCHIVED"      # Arşivlendi (eski versiyon)

class ArchiveDocument(Base):
    """
    Dijital Arşiv - Merkezi belge deposu
    
    Tüm belge tiplerini (iş emri, çalışan, araç, cari) 
    merkezi bir yapıda saklar.
    """
    __tablename__ = "archive_document"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Kategorilendirme
    category = Column(Enum(DocumentCategory), nullable=False, index=True)
    document_type = Column(Enum(DocumentType), nullable=False, index=True)
    
    # İlişkiler (Polymorphic - hangi modüle ait?)
    work_order_id = Column(Integer, ForeignKey("work_order.id"), nullable=True, index=True)
    # employee_id = Column(Integer, ForeignKey("employee.id"), nullable=True, index=True)  # Gelecek
    # vehicle_id = Column(Integer, ForeignKey("vehicle.id"), nullable=True, index=True)    # Gelecek
    cari_id = Column(Integer, ForeignKey("cari.id"), nullable=True, index=True)
    
    # Dosya Bilgileri
    file_name = Column(String(255), nullable=False)           # Orijinal dosya adı
    file_path = Column(String(500), nullable=False)           # Storage path (uploads/documents/...)
    file_size = Column(Integer, nullable=False)               # Byte cinsinden
    file_type = Column(String(50), nullable=False)            # MIME type (application/pdf, image/jpeg)
    file_hash = Column(String(64), nullable=True)             # SHA-256 hash (duplicate kontrolü)
    
    # Versiyon Kontrolü
    version = Column(Integer, default=1, nullable=False)      # Belge versiyonu
    is_latest_version = Column(Boolean, default=True, nullable=False, index=True)
    previous_version_id = Column(Integer, ForeignKey("archive_document.id"), nullable=True)
    
    # Durum
    status = Column(Enum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False, index=True)
    
    # Onay Bilgileri
    approved_by_id = Column(Integer, ForeignKey("user.id"), nullable=True)    # Onaylayan personel
    approved_at = Column(DateTime, nullable=True)
    approval_note = Column(Text, nullable=True)                                # Onay/Red notu
    
    rejected_by_id = Column(Integer, ForeignKey("user.id"), nullable=True)    # Reddeden personel
    rejected_at = Column(DateTime, nullable=True)
    rejection_reason = Column(String(500), nullable=True)                      # Red sebebi (dropdown)
    rejection_detail = Column(Text, nullable=True)                             # Detaylı açıklama
    
    # Süre Takibi (Süreli belgeler için)
    expires_at = Column(DateTime, nullable=True, index=True)                   # Geçerlilik bitiş tarihi
    expiry_notification_sent = Column(Boolean, default=False)                  # Süre sonu bildirimi gönderildi mi?
    
    # Yükleme Bilgileri
    uploaded_by_id = Column(Integer, ForeignKey("user.id"), nullable=True)    # Internal kullanıcı
    uploaded_by_portal_user_id = Column(Integer, ForeignKey("portal_user.id"), nullable=True)  # Portal kullanıcı
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Metadata
    description = Column(Text, nullable=True)                                  # Belge açıklaması
    tags = Column(String(500), nullable=True)                                  # Arama için etiketler (JSON array)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    work_order = relationship("WorkOrder", back_populates="documents", foreign_keys=[work_order_id])
    cari = relationship("Cari", back_populates="documents", foreign_keys=[cari_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    rejected_by = relationship("User", foreign_keys=[rejected_by_id])
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])
    uploaded_by_portal_user = relationship("PortalUser", foreign_keys=[uploaded_by_portal_user_id])
    previous_version = relationship("ArchiveDocument", remote_side=[id], foreign_keys=[previous_version_id])
    
    # Computed Properties
    @property
    def is_expired(self) -> bool:
        """Belge süresi doldu mu?"""
        if self.expires_at is None:
            return False
        return datetime.utcnow() > self.expires_at
    
    @property
    def days_until_expiry(self) -> int | None:
        """Süre sonuna kaç gün kaldı?"""
        if self.expires_at is None:
            return None
        delta = self.expires_at - datetime.utcnow()
        return delta.days if delta.days >= 0 else 0
    
    @property
    def is_required_for_work_order(self) -> bool:
        """İş emri için zorunlu belge mi?"""
        return self.document_type == DocumentType.GUMRUK_IZIN_BELGESI
    
    @property
    def file_size_mb(self) -> float:
        """Dosya boyutu (MB)"""
        return round(self.file_size / (1024 * 1024), 2)
    
    def __repr__(self):
        return f"<ArchiveDocument {self.id}: {self.document_type.value} - {self.status.value}>"
```

---

#### 4.2.2. Database Migration (Alembic)

```python
# backend/aliaport_api/migrations/versions/xxxx_add_archive_document.py

"""add archive document table

Revision ID: xxxx
Revises: yyyy
Create Date: 2025-11-25 10:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers
revision = 'xxxx'
down_revision = 'yyyy'
branch_labels = None
depends_on = None

def upgrade():
    # Create archive_document table
    op.create_table(
        'archive_document',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('category', sa.Enum('WORK_ORDER', 'EMPLOYEE', 'VEHICLE', 'CARI', 'GENERAL', 
                                      name='documentcategory'), nullable=False),
        sa.Column('document_type', sa.Enum(
            'GUMRUK_IZIN_BELGESI', 'MANIFESTO', 'BILL_OF_LADING', 'ARRIVAL_NOTICE', 
            'PROFORMA_INVOICE', 'CUSTOMS_DECLARATION',
            'SRC5', 'SIGORTA_LISTESI', 'NUFUS_CUZDANI',
            'ARAC_RUHSAT', 'ARAC_MUAYENE', 'ARAC_SIGORTA',
            'VERGI_LEVHASI', 'IMZA_SIRKULERI', 'TICARET_SICIL_GAZETESI',
            name='documenttype'), nullable=False),
        sa.Column('work_order_id', sa.Integer(), nullable=True),
        sa.Column('cari_id', sa.Integer(), nullable=True),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('file_type', sa.String(length=50), nullable=False),
        sa.Column('file_hash', sa.String(length=64), nullable=True),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('is_latest_version', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('previous_version_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('UPLOADED', 'APPROVED', 'REJECTED', 'EXPIRED', 'ARCHIVED', 
                                   name='documentstatus'), nullable=False, server_default='UPLOADED'),
        sa.Column('approved_by_id', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('approval_note', sa.Text(), nullable=True),
        sa.Column('rejected_by_id', sa.Integer(), nullable=True),
        sa.Column('rejected_at', sa.DateTime(), nullable=True),
        sa.Column('rejection_reason', sa.String(length=500), nullable=True),
        sa.Column('rejection_detail', sa.Text(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('expiry_notification_sent', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('uploaded_by_id', sa.Integer(), nullable=True),
        sa.Column('uploaded_by_portal_user_id', sa.Integer(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tags', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['approved_by_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['cari_id'], ['cari.id'], ),
        sa.ForeignKeyConstraint(['previous_version_id'], ['archive_document.id'], ),
        sa.ForeignKeyConstraint(['rejected_by_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['uploaded_by_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['uploaded_by_portal_user_id'], ['portal_user.id'], ),
        sa.ForeignKeyConstraint(['work_order_id'], ['work_order.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_archive_document_category', 'archive_document', ['category'])
    op.create_index('ix_archive_document_document_type', 'archive_document', ['document_type'])
    op.create_index('ix_archive_document_work_order_id', 'archive_document', ['work_order_id'])
    op.create_index('ix_archive_document_cari_id', 'archive_document', ['cari_id'])
    op.create_index('ix_archive_document_status', 'archive_document', ['status'])
    op.create_index('ix_archive_document_is_latest_version', 'archive_document', ['is_latest_version'])
    op.create_index('ix_archive_document_expires_at', 'archive_document', ['expires_at'])
    op.create_index('ix_archive_document_uploaded_at', 'archive_document', ['uploaded_at'])

def downgrade():
    op.drop_index('ix_archive_document_uploaded_at', table_name='archive_document')
    op.drop_index('ix_archive_document_expires_at', table_name='archive_document')
    op.drop_index('ix_archive_document_is_latest_version', table_name='archive_document')
    op.drop_index('ix_archive_document_status', table_name='archive_document')
    op.drop_index('ix_archive_document_cari_id', table_name='archive_document')
    op.drop_index('ix_archive_document_work_order_id', table_name='archive_document')
    op.drop_index('ix_archive_document_document_type', table_name='archive_document')
    op.drop_index('ix_archive_document_category', table_name='archive_document')
    op.drop_table('archive_document')
```

---

### 4.3. PortalUser Modeli

#### 4.3.1. Model Tanımı

```python
# backend/aliaport_api/modules/portal/models.py

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from aliaport_api.database import Base
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class PortalUser(Base):
    """
    Portal Kullanıcısı (Dış Müşteri)
    
    Cari firmalarının web/mobil portal üzerinden 
    iş emri talebi oluşturabilmesi için kullanıcı modeli.
    """
    __tablename__ = "portal_user"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Kullanıcı Bilgileri
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    
    # Cari İlişkisi
    cari_id = Column(Integer, ForeignKey("cari.id"), nullable=False, index=True)
    
    # Rol (Basit - 2 seviye)
    is_admin = Column(Boolean, default=False, nullable=False)
    # is_admin = True  → Firmanın TÜM taleplerini görebilir
    # is_admin = False → SADECE kendi oluşturduğu talepleri görebilir
    
    # Durum
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_email_verified = Column(Boolean, default=False, nullable=False)
    
    # Şifre Yönetimi
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)
    must_change_password = Column(Boolean, default=True, nullable=False)  # İlk giriş zorunlu değiştirme
    
    # Login Tracking
    last_login_at = Column(DateTime, nullable=True)
    last_login_ip = Column(String(45), nullable=True)  # IPv6 için 45 karakter
    login_count = Column(Integer, default=0, nullable=False)
    
    # Oluşturma Bilgileri
    created_by_id = Column(Integer, ForeignKey("user.id"), nullable=False)  # Hangi Aliaport personeli oluşturdu
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    cari = relationship("Cari", back_populates="portal_users")
    created_by = relationship("User", foreign_keys=[created_by_id])
    work_orders = relationship("WorkOrder", back_populates="portal_user")
    uploaded_documents = relationship("ArchiveDocument", back_populates="uploaded_by_portal_user")
    
    # Methods
    def verify_password(self, plain_password: str) -> bool:
        """Şifre doğrulama"""
        return pwd_context.verify(plain_password, self.hashed_password)
    
    def set_password(self, plain_password: str):
        """Şifre hashleyip kaydetme"""
        self.hashed_password = pwd_context.hash(plain_password)
    
    def record_login(self, ip_address: str = None):
        """Giriş kaydı"""
        self.last_login_at = datetime.utcnow()
        self.last_login_ip = ip_address
        self.login_count += 1
    
    @property
    def has_active_work_orders(self) -> bool:
        """Aktif iş emri var mı?"""
        return any(wo.status in ["DRAFT", "PENDING_APPROVAL", "APPROVED", "IN_PROGRESS"] 
                  for wo in self.work_orders)
    
    def __repr__(self):
        return f"<PortalUser {self.id}: {self.email} ({self.cari.unvan if self.cari else 'No Cari'})>"
```

---

#### 4.3.2. Database Migration

```python
# backend/aliaport_api/migrations/versions/xxxx_add_portal_user.py

"""add portal user table

Revision ID: xxxx
Revises: yyyy
Create Date: 2025-11-25 11:00:00

"""
from alembic import op
import sqlalchemy as sa

revision = 'xxxx'
down_revision = 'yyyy'
branch_labels = None
depends_on = None

def upgrade():
    # Create portal_user table
    op.create_table(
        'portal_user',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('cari_id', sa.Integer(), nullable=False),
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('is_email_verified', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('password_reset_token', sa.String(length=255), nullable=True),
        sa.Column('password_reset_expires', sa.DateTime(), nullable=True),
        sa.Column('must_change_password', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('last_login_at', sa.DateTime(), nullable=True),
        sa.Column('last_login_ip', sa.String(length=45), nullable=True),
        sa.Column('login_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_by_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['cari_id'], ['cari.id'], ),
        sa.ForeignKeyConstraint(['created_by_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_portal_user_email', 'portal_user', ['email'], unique=True)
    op.create_index('ix_portal_user_cari_id', 'portal_user', ['cari_id'])
    op.create_index('ix_portal_user_is_active', 'portal_user', ['is_active'])

def downgrade():
    op.drop_index('ix_portal_user_is_active', table_name='portal_user')
    op.drop_index('ix_portal_user_cari_id', table_name='portal_user')
    op.drop_index('ix_portal_user_email', table_name='portal_user')
    op.drop_table('portal_user')
```

---

### 4.4. WorkOrder Model Güncellemesi

#### 4.4.1. Eklenecek Kolonlar

```python
# backend/aliaport_api/modules/isemri/models.py içine eklenecek

class WorkOrderApprovalStatus(str, enum.Enum):
    """İş emri onay durumu (Belge onayı için)"""
    PENDING = "PENDING"          # Onay bekliyor (belgeler inceleniyor)
    APPROVED = "APPROVED"        # Onaylandı (belgeler tamam, iş emri başlatılabilir)
    REJECTED = "REJECTED"        # Reddedildi (belgeler uygun değil)

# WorkOrder modeline eklenecek kolonlar:

class WorkOrder(Base):
    __tablename__ = "work_order"
    
    # ... mevcut kolonlar ...
    
    # YENİ KOLONLAR:
    
    # Portal İlişkisi
    portal_user_id = Column(Integer, ForeignKey("portal_user.id"), nullable=True, index=True)
    # NULL ise internal oluşturulmuş, değilse portal kullanıcı oluşturmuş
    
    # Onay Durumu (Belge bazlı)
    approval_status = Column(
        Enum(WorkOrderApprovalStatus), 
        default=WorkOrderApprovalStatus.PENDING, 
        nullable=False, 
        index=True
    )
    approved_by_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    
    # İş Emri Başlatma
    started_by_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    started_at = Column(DateTime, nullable=True)
    estimated_completion = Column(DateTime, nullable=True)  # Tahmini bitiş
    
    # İş Emri Tamamlama
    completed_by_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    completed_at = Column(DateTime, nullable=True)
    completion_notes = Column(Text, nullable=True)
    
    # Relationships
    portal_user = relationship("PortalUser", back_populates="work_orders", foreign_keys=[portal_user_id])
    documents = relationship("ArchiveDocument", back_populates="work_order", cascade="all, delete-orphan")
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    started_by = relationship("User", foreign_keys=[started_by_id])
    completed_by = relationship("User", foreign_keys=[completed_by_id])
    
    # Computed Properties
    @property
    def is_portal_created(self) -> bool:
        """Portal kullanıcı tarafından mı oluşturuldu?"""
        return self.portal_user_id is not None
    
    @property
    def has_required_documents(self) -> bool:
        """Zorunlu belgeler yüklendi mi?"""
        # Gümrük İzin Belgesi zorunlu
        has_gumruk = any(
            doc.document_type == DocumentType.GUMRUK_IZIN_BELGESI 
            and doc.is_latest_version 
            and doc.status == DocumentStatus.APPROVED
            for doc in self.documents
        )
        return has_gumruk
    
    @property
    def pending_documents_count(self) -> int:
        """Onay bekleyen belge sayısı"""
        return sum(
            1 for doc in self.documents 
            if doc.is_latest_version and doc.status == DocumentStatus.UPLOADED
        )
    
    @property
    def approved_documents_count(self) -> int:
        """Onaylanmış belge sayısı"""
        return sum(
            1 for doc in self.documents 
            if doc.is_latest_version and doc.status == DocumentStatus.APPROVED
        )
```

---

#### 4.4.2. Migration (WorkOrder Güncelleme)

```python
# backend/aliaport_api/migrations/versions/xxxx_update_work_order_for_portal.py

"""update work order for portal integration

Revision ID: xxxx
Revises: yyyy
Create Date: 2025-11-25 12:00:00

"""
from alembic import op
import sqlalchemy as sa

revision = 'xxxx'
down_revision = 'yyyy'
branch_labels = None
depends_on = None

def upgrade():
    # Add approval_status enum
    op.execute("CREATE TYPE workorderapprovalstatus AS ENUM ('PENDING', 'APPROVED', 'REJECTED')")
    
    # Add new columns to work_order
    op.add_column('work_order', sa.Column('portal_user_id', sa.Integer(), nullable=True))
    op.add_column('work_order', sa.Column('approval_status', 
                  sa.Enum('PENDING', 'APPROVED', 'REJECTED', name='workorderapprovalstatus'),
                  nullable=False, server_default='PENDING'))
    op.add_column('work_order', sa.Column('approved_by_id', sa.Integer(), nullable=True))
    op.add_column('work_order', sa.Column('approved_at', sa.DateTime(), nullable=True))
    op.add_column('work_order', sa.Column('started_by_id', sa.Integer(), nullable=True))
    op.add_column('work_order', sa.Column('started_at', sa.DateTime(), nullable=True))
    op.add_column('work_order', sa.Column('estimated_completion', sa.DateTime(), nullable=True))
    op.add_column('work_order', sa.Column('completed_by_id', sa.Integer(), nullable=True))
    op.add_column('work_order', sa.Column('completed_at', sa.DateTime(), nullable=True))
    op.add_column('work_order', sa.Column('completion_notes', sa.Text(), nullable=True))
    
    # Create foreign keys
    op.create_foreign_key('fk_work_order_portal_user', 'work_order', 'portal_user', ['portal_user_id'], ['id'])
    op.create_foreign_key('fk_work_order_approved_by', 'work_order', 'user', ['approved_by_id'], ['id'])
    op.create_foreign_key('fk_work_order_started_by', 'work_order', 'user', ['started_by_id'], ['id'])
    op.create_foreign_key('fk_work_order_completed_by', 'work_order', 'user', ['completed_by_id'], ['id'])
    
    # Create indexes
    op.create_index('ix_work_order_portal_user_id', 'work_order', ['portal_user_id'])
    op.create_index('ix_work_order_approval_status', 'work_order', ['approval_status'])

def downgrade():
    op.drop_index('ix_work_order_approval_status', table_name='work_order')
    op.drop_index('ix_work_order_portal_user_id', table_name='work_order')
    op.drop_constraint('fk_work_order_completed_by', 'work_order', type_='foreignkey')
    op.drop_constraint('fk_work_order_started_by', 'work_order', type_='foreignkey')
    op.drop_constraint('fk_work_order_approved_by', 'work_order', type_='foreignkey')
    op.drop_constraint('fk_work_order_portal_user', 'work_order', type_='foreignkey')
    op.drop_column('work_order', 'completion_notes')
    op.drop_column('work_order', 'completed_at')
    op.drop_column('work_order', 'completed_by_id')
    op.drop_column('work_order', 'estimated_completion')
    op.drop_column('work_order', 'started_at')
    op.drop_column('work_order', 'started_by_id')
    op.drop_column('work_order', 'approved_at')
    op.drop_column('work_order', 'approved_by_id')
    op.drop_column('work_order', 'approval_status')
    op.drop_column('work_order', 'portal_user_id')
    op.execute("DROP TYPE workorderapprovalstatus")
```

---

### 4.5. Cari Model Güncellemesi

```python
# backend/aliaport_api/modules/cari/models.py içine relationship eklenmeli

class Cari(Base):
    __tablename__ = "cari"
    
    # ... mevcut kolonlar ...
    
    # YENİ RELATIONSHIPS:
    portal_users = relationship("PortalUser", back_populates="cari", cascade="all, delete-orphan")
    documents = relationship("ArchiveDocument", back_populates="cari", foreign_keys="ArchiveDocument.cari_id")
    
    # Computed Properties
    @property
    def active_portal_users_count(self) -> int:
        """Aktif portal kullanıcı sayısı"""
        return sum(1 for user in self.portal_users if user.is_active)
    
    @property
    def has_pending_work_orders(self) -> bool:
        """Onay bekleyen iş emirleri var mı?"""
        return any(
            wo.approval_status == WorkOrderApprovalStatus.PENDING 
            for wo in self.work_orders
        )
```

---

## 🔗 Sonraki Bölüm

**BÖLÜM 4B: API ENDPOINTS VE İŞ AKIŞLARI**
- REST API endpoint'leri
- Pydantic schemas
- İş akışı diyagramları
- Entegrasyon noktaları

---

**Devam edecek...**
