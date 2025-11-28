"""
İŞ EMRİ MODÜLÜ - SQLAlchemy Models
WorkOrder (Ana iş emri) + WorkOrderItem (Kalemler)
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from ...config.database import Base


# ============================================
# ENUM TYPES
# ============================================

class WorkOrderType(str, enum.Enum):
    """İş Emri Tipi"""
    HIZMET = "HIZMET"
    MOTORBOT = "MOTORBOT"
    BARINMA = "BARINMA"
    DIGER = "DIGER"


class WorkOrderPriority(str, enum.Enum):
    """Öncelik Seviyesi"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class WorkOrderStatus(str, enum.Enum):
    """İş Emri Durumu"""
    DRAFT = "DRAFT"                      # Taslak
    SUBMITTED = "SUBMITTED"              # Gönderildi (onay bekliyor)
    PENDING_APPROVAL = "PENDING_APPROVAL"  # Belge onayı bekliyor
    APPROVED = "APPROVED"                # Onaylandı (başlatılabilir)
    IN_PROGRESS = "IN_PROGRESS"          # İşlemde (başlatıldı)
    COMPLETED = "COMPLETED"              # Tamamlandı
    INVOICED = "INVOICED"                # Faturalandı
    CLOSED = "CLOSED"                    # Kapatıldı
    REJECTED = "REJECTED"                # Reddedildi
    SAHADA = "SAHADA"                   # Sahada (legacy - kullanılmayacak)
    TAMAMLANDI = "TAMAMLANDI"           # Tamamlandı (legacy)
    FATURALANDI = "FATURALANDI"         # Faturalandı (legacy)
    KAPANDI = "KAPANDI"                 # Kapatıldı (legacy)


class WorkOrderItemType(str, enum.Enum):
    """İş Emri Kalem Tipi"""
    WORKLOG = "WORKLOG"     # Zamana dayalı kayıt (saat hesabı)
    RESOURCE = "RESOURCE"   # Kaynak kullanımı (forklift, transpalet, vb)
    SERVICE = "SERVICE"     # Hizmet kartı


# ============================================
# MODELS
# ============================================

class WorkOrder(Base):
    """
    İŞ EMRİ ANA TABLO
    Motorbot, Hizmet, Barınma ve diğer iş emirleri
    """
    __tablename__ = "work_order"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    wo_number = Column(String(50), unique=True, nullable=False, index=True)  # İş emri numarası
    
    # Cari bilgileri (Foreign Key YOK - sadece kod ve başlık)
    cari_id = Column(Integer, nullable=False)
    cari_code = Column(String(20), nullable=False, index=True)
    cari_title = Column(String(255), nullable=False)
    
    # Talep eden kullanıcı
    requester_user_id = Column(Integer, nullable=True)
    requester_user_name = Column(String(100), nullable=True)
    
    # Portal kullanıcı (dış müşteri talebi ise)
    # ORIGINAL: portal_user_id = Column(Integer, ForeignKey("portal_user.id"), nullable=True, index=True)
    # TEMPORARY: ForeignKey devre dışı - circular dependency çözülene kadar
    portal_user_id = Column(Integer, nullable=True, index=True)
    
    # İş emri detayları
    type = Column(SQLEnum(WorkOrderType), nullable=False, index=True)
    service_code = Column(String(50), nullable=True)  # Hizmet kartı kodu (opsiyonel)
    action = Column(String(100), nullable=True)  # ARAÇ_GİRİŞ, FORKLIFT, vb. (opsiyonel)
    subject = Column(String(120), nullable=False)  # Başlık
    description = Column(Text, nullable=True)  # Açıklama (max 500)
    
    # Öncelik ve zamanlama
    priority = Column(SQLEnum(WorkOrderPriority), default=WorkOrderPriority.MEDIUM, nullable=False)
    planned_start = Column(DateTime, nullable=True)
    planned_end = Column(DateTime, nullable=True)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    
    # İş emri başlatma ve tamamlama
    # ORIGINAL: started_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # TEMPORARY: ForeignKey devre dışı - circular dependency çözülene kadar
    started_by_id = Column(Integer, nullable=True)
    started_at = Column(DateTime, nullable=True)
    estimated_completion = Column(DateTime, nullable=True)
    
    # ORIGINAL: completed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # TEMPORARY: ForeignKey devre dışı
    completed_by_id = Column(Integer, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    completion_notes = Column(Text, nullable=True)
    
    # Dijital arşiv onay durumu
    approval_status = Column(String(20), nullable=True, index=True)  # PENDING, APPROVED, REJECTED
    # ORIGINAL: approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # TEMPORARY: ForeignKey devre dışı
    approved_by_id = Column(Integer, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Durum
    status = Column(SQLEnum(WorkOrderStatus), default=WorkOrderStatus.DRAFT, nullable=False, index=True)
    
    # İş emri özellikleri
    gate_required = Column(Boolean, default=False)  # Güvenlik tableti gerekli mi?
    saha_kayit_yetkisi = Column(Boolean, default=True)  # Saha WorkLog yazabilir mi?
    attachments_count = Column(Integer, default=0)
    has_signature = Column(Boolean, default=False)
    
    # Özel durumlar
    is_cabatoge_tr_flag = Column(Boolean, default=False)  # Türk bayraklı & kabotaj indirim
    apply_rule_addons = Column(Boolean, default=True)  # Kural kaynaklı ek ücretleri uygula
    # İlişkiler (lazy="raise" prevents accidental N+1 queries)
    items = relationship(
        "WorkOrderItem",
        back_populates="work_order",
        cascade="all, delete-orphan",
        lazy="raise"  # Forces explicit eager loading (dev safety)
    )
    
    # Dijital arşiv ilişkileri - TEMPORARILY COMMENTED OUT (circular import issues)
    # portal_user = relationship("PortalUser", foreign_keys=[portal_user_id], back_populates="work_orders")
    # documents = relationship("ArchiveDocument", back_populates="work_order", foreign_keys="ArchiveDocument.work_order_id")
    # approved_by = relationship("User", foreign_keys=[approved_by_id])
    # started_by = relationship("User", foreign_keys=[started_by_id])
    # completed_by = relationship("User", foreign_keys=[completed_by_id])
    
    # Computed properties
    @property
    def is_portal_created(self) -> bool:
        """Portal kullanıcı tarafından mı oluşturuldu?"""
        return self.portal_user_id is not None
    
    @property
    def has_required_documents(self, db) -> bool:
        """Zorunlu belgeler yüklendi mi?"""
        from ..dijital_arsiv.models import ArchiveDocument, DocumentType, DocumentStatus
        
        # GUMRUK_IZIN_BELGESI zorunlu
        return db.query(ArchiveDocument).filter(
            ArchiveDocument.work_order_id == self.id,
            ArchiveDocument.document_type == DocumentType.GUMRUK_IZIN_BELGESI,
            ArchiveDocument.status == DocumentStatus.APPROVED,
            ArchiveDocument.is_latest_version == True
        ).count() > 0
    
    @property
    def pending_documents_count(self) -> int:
        """Onay bekleyen belge sayısı"""
        from ..dijital_arsiv.models import ArchiveDocument, DocumentStatus
        from ...config.database import get_db
        
        db = next(get_db())
        try:
            return db.query(ArchiveDocument).filter(
                ArchiveDocument.work_order_id == self.id,
                ArchiveDocument.status == DocumentStatus.UPLOADED,
                ArchiveDocument.is_latest_version == True
            ).count()
        finally:
            db.close()
    
    # Sistem alanları
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, nullable=True)
    created_by_name = Column(String(100), nullable=True)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
    updated_by = Column(Integer, nullable=True)
    updated_by_name = Column(String(100), nullable=True)
    
    # İlişkiler (lazy="raise" prevents accidental N+1 queries)
    items = relationship(
        "WorkOrderItem",
        back_populates="work_order",
        cascade="all, delete-orphan",
        lazy="raise"  # Forces explicit eager loading (dev safety)
    )


class WorkOrderItem(Base):
    """
    İŞ EMRİ KALEMLERİ
    WorkLog (zamana dayalı), Resource (kaynak), Service (hizmet kartı)
    """
    __tablename__ = "work_order_item"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    work_order_id = Column(Integer, ForeignKey("work_order.id"), nullable=False, index=True)
    wo_number = Column(String(50), nullable=False, index=True)
    
    # Kalem tipi
    item_type = Column(SQLEnum(WorkOrderItemType), nullable=False)
    
    # Kaynak bilgileri (WORKLOG veya RESOURCE için)
    resource_code = Column(String(50), nullable=True)  # FORKLIFT-01, TRANSPALET-02, vb.
    resource_name = Column(String(100), nullable=True)
    
    # Hizmet kartı (SERVICE için)
    service_code = Column(String(50), nullable=True)
    service_name = Column(String(100), nullable=True)
    
    # Zaman bilgileri (WORKLOG için)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)  # Süre (dakika)
    
    # Miktar ve fiyat
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)  # SAAT, ADET, KG, vb.
    unit_price = Column(Float, nullable=False)
    currency = Column(String(3), default="TRY", nullable=False)
    
    # Tutar hesaplamaları
    total_amount = Column(Float, nullable=False)  # quantity * unit_price
    vat_rate = Column(Float, default=20, nullable=False)
    vat_amount = Column(Float, nullable=False)
    grand_total = Column(Float, nullable=False)  # total_amount + vat_amount
    
    # Notlar
    notes = Column(Text, nullable=True)
    
    # Faturalama
    is_invoiced = Column(Boolean, default=False, index=True)
    invoice_id = Column(Integer, nullable=True)
    
    # Sistem
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, nullable=True)
    created_by_name = Column(String(100), nullable=True)
    
    # İlişkiler (lazy="raise" prevents accidental N+1 queries)
    work_order = relationship(
        "WorkOrder",
        back_populates="items",
        lazy="raise"  # Forces explicit eager loading (dev safety)
    )


class WorkOrderPerson(Base):
    """
    İŞ EMRİ KİŞİ LİSTESİ
    
    Hizmet kartlarında kişi sayısı gerekli olan işlemler için
    personel listesi ve kimlik bilgileri.
    
    Kullanım Senaryoları:
    - Teknik personel transferi (her kişi için kimlik bilgisi)
    - Gemi adamı giriş/çıkış (pasaport kontrolü)
    - Ziyaretçi girişi (TC kimlik no)
    
    Güvenlik Entegrasyonu:
    - Güvenlik bu listeyi görür
    - Kimlik belgesi fotoğrafı çeker (identity_document_id)
    - Giriş/çıkış saati kaydeder
    - Onay verir
    """
    __tablename__ = "work_order_person"
    __table_args__ = {"extend_existing": True}
    
    id = Column(Integer, primary_key=True, index=True)
    
    # İş Emri İlişkileri
    work_order_id = Column(Integer, ForeignKey("work_order.id"), nullable=False, index=True)
    work_order_item_id = Column(Integer, ForeignKey("work_order_item.id"), nullable=True, index=True)  # Hangi kalem için
    
    # Kişi Bilgileri
    full_name = Column(String(200), nullable=False)  # Ad Soyad
    tc_kimlik_no = Column(String(11), nullable=True, index=True)  # TC Kimlik No (11 haneli)
    passport_no = Column(String(20), nullable=True, index=True)   # Pasaport No
    nationality = Column(String(3), nullable=True)  # Uyruk (ISO 3166 Alpha-3: TUR, USA, vb.)
    phone = Column(String(20), nullable=True)  # Telefon
    
    # Kimlik Belgesi (Dijital Arşiv Entegrasyonu)
    identity_document_id = Column(Integer, ForeignKey("archive_document.id"), nullable=True)
    identity_photo_url = Column(String(500), nullable=True)  # Fotoğraf URL (deprecated - use identity_document_id)
    
    # Güvenlik Onayı
    gate_entry_time = Column(DateTime, nullable=True)  # Giriş saati
    gate_exit_time = Column(DateTime, nullable=True)   # Çıkış saati
    approved_by_security = Column(Boolean, default=False, nullable=False, index=True)
    # ORIGINAL: approved_by_security_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # TEMPORARY: ForeignKey devre dışı
    approved_by_security_user_id = Column(Integer, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    security_notes = Column(Text, nullable=True)  # Güvenlik notları
    
    # Durum
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    # ORIGINAL: created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    # TEMPORARY: ForeignKey devre dışı
    created_by = Column(Integer, nullable=True)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
    # ORIGINAL: updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    # TEMPORARY: ForeignKey devre dışı
    updated_by = Column(Integer, nullable=True)
    
    # İlişkiler - HEPSİ KALDIRILDI (ForeignKey hatası nedeniyle)
    # work_order = relationship("WorkOrder", foreign_keys=[work_order_id])
    # work_order_item = relationship("WorkOrderItem", foreign_keys=[work_order_item_id])
    # identity_document = relationship("ArchiveDocument", foreign_keys=[identity_document_id])
    # approved_by_user = relationship("User", foreign_keys=[approved_by_security_user_id])
    
    # Computed properties
    @property
    def duration_minutes(self) -> int:
        """Kalış süresi (dakika)"""
        if self.gate_entry_time and self.gate_exit_time:
            delta = self.gate_exit_time - self.gate_entry_time
            return int(delta.total_seconds() / 60)
        return 0
    
    @property
    def has_identity_document(self) -> bool:
        """Kimlik belgesi yüklendi mi?"""
        return self.identity_document_id is not None
    
    @property
    def identity_type(self) -> str:
        """Kimlik tipi (TC/PASSPORT)"""
        if self.tc_kimlik_no:
            return "TC"
        elif self.passport_no:
            return "PASSPORT"
        return "UNKNOWN"


class WorkOrderEmployee(Base):
    """
    İŞ EMRİ - PORTAL ÇALIŞAN İLİŞKİSİ
    
    Portal'dan iş emri oluştururken firma çalışanlarından seçim yapılır.
    Bu tablo iş emrinde hangi firma çalışanlarının görevli olduğunu tutar.
    
    WorkOrderPerson'dan farkı:
    - WorkOrderPerson: Personel transferi hizmeti için (her seferinde manuel girilir)
    - WorkOrderEmployee: Firma çalışanları master datasından seçilir (tekrar kullanılabilir)
    """
    __tablename__ = "work_order_employee"
    __table_args__ = {"extend_existing": True}
    
    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_order.id"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("portal_employee.id"), nullable=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    

class WorkOrderVehicle(Base):
    """
    İŞ EMRİ - PORTAL ARAÇ İLİŞKİSİ
    
    Portal'dan iş emri oluştururken firma araçlarından seçim yapılır.
    """
    __tablename__ = "work_order_vehicle"
    __table_args__ = {"extend_existing": True}
    
    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_order.id"), nullable=False, index=True)
    vehicle_id = Column(Integer, ForeignKey("portal_vehicle.id"), nullable=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
