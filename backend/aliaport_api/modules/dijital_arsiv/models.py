"""
DİJİTAL ARŞİV MODÜLÜ - SQLAlchemy Models
ArchiveDocument (Merkezi belge deposu) + PortalUser (Dış müşteri kullanıcıları)
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import enum
import hashlib

from ...config.database import Base


# ============================================
# ENUM TYPES
# ============================================

class DocumentCategory(str, enum.Enum):
    """Belge Kategorisi"""
    WORK_ORDER = "WORK_ORDER"      # İş emri belgesi
    EMPLOYEE = "EMPLOYEE"          # Çalışan belgesi
    VEHICLE = "VEHICLE"            # Araç belgesi
    CARI = "CARI"                  # Cari belgesi
    GENERAL = "GENERAL"            # Genel belge


class DocumentType(str, enum.Enum):
    """Belge Tipi - VisitPro'dan ilham alındı"""
    # İş emri belgeleri
    GUMRUK_IZIN_BELGESI = "GUMRUK_IZIN_BELGESI"      # Gümrük izin belgesi (ZORUNLU)
    MANIFESTO = "MANIFESTO"                           # Manifesto
    KONT_DEPO_CIKAR = "KONT_DEPO_CIKAR"              # Konteyner depo çıkar
    TASIMA_EVRAK = "TASIMA_EVRAK"                     # Taşıma evrakı
    NAVLUN_MAKBUZU = "NAVLUN_MAKBUZU"                # Navlun makbuzu
    BEYANNAME = "BEYANNAME"                           # Beyanname
    KONSINYE_BELGESI = "KONSINYE_BELGESI"            # Konsinye belgesi
    DIGER_EVRAK = "DIGER_EVRAK"                       # Diğer evrak
    
    # Çalışan belgeleri
    EHLIYET = "EHLIYET"                               # Ehliyet (şoför için)
    SRC5 = "SRC5"                                     # SRC-5 belgesi (1 yıl geçerli)
    SGK_ISE_GIRIS = "SGK_ISE_GIRIS"                  # SGK işe giriş belgesi (yeni personel için)
    SIGORTA_LISTESI = "SIGORTA_LISTESI"              # Sigorta listesi (1 yıl)
    EGITIM_SERTIFIKASI = "EGITIM_SERTIFIKASI"        # Eğitim sertifikası
    
    # Araç belgeleri
    ARAC_RUHSAT = "ARAC_RUHSAT"                       # Araç ruhsat
    ARAC_MUAYENE = "ARAC_MUAYENE"                     # Araç muayene (2 yıl geçerli)
    ARAC_SIGORTA = "ARAC_SIGORTA"                     # Araç sigorta (1 yıl geçerli)
    ARAC_TESCIL = "ARAC_TESCIL"                       # Araç tescil
    
    # Cari belgeleri
    VERGI_LEVHASI = "VERGI_LEVHASI"                   # Vergi levhası
    IMZA_SIRKUSU = "IMZA_SIRKUSU"                     # İmza sirküsü
    FAALIYET_BELGESI = "FAALIYET_BELGESI"            # Faaliyet belgesi


class DocumentStatus(str, enum.Enum):
    """Belge Durumu"""
    UPLOADED = "UPLOADED"          # Yüklendi (onay bekliyor)
    APPROVED = "APPROVED"          # Onaylandı
    REJECTED = "REJECTED"          # Reddedildi
    EXPIRED = "EXPIRED"            # Süresi doldu
    ARCHIVED = "ARCHIVED"          # Arşivlendi (eski versiyon)


class WorkOrderApprovalStatus(str, enum.Enum):
    """İş Emri Onay Durumu (WorkOrder extension için)"""
    PENDING = "PENDING"            # Onay bekliyor
    APPROVED = "APPROVED"          # Onaylandı
    REJECTED = "REJECTED"          # Reddedildi


# ============================================
# MODELS
# ============================================

class PortalUser(Base):
    """
    PORTAL KULLANICISI (Dış Müşteri)
    Email/şifre ile giriş, Cari'ye bağlı, İş emri talebi oluşturur
    """
    __tablename__ = "portal_user"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    
    # Cari ilişkisi
    cari_id = Column(Integer, ForeignKey("Cari.Id"), nullable=False, index=True)
    
    # Authentication
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    
    # Profil
    full_name = Column(String(200), nullable=False)
    phone = Column(String(50), nullable=True)
    position = Column(String(100), nullable=True)  # Pozisyon/Görevi

    # SGK entegrasyon verileri
    sgk_last_check_period = Column(String(6), nullable=True)  # YYYYMM
    sgk_is_active_last_period = Column(Boolean, default=False, nullable=False)
    
    # Yetki
    is_admin = Column(Boolean, default=False, nullable=False)  # True: Tüm talepler, False: Sadece kendi
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Şifre yönetimi
    must_change_password = Column(Boolean, default=True, nullable=False)  # İlk giriş zorunlu değiştir
    password_reset_token = Column(String(255), nullable=True, index=True)
    password_reset_expires = Column(DateTime, nullable=True)
    password_changed_at = Column(DateTime, nullable=True)
    
    # Login tracking
    last_login_at = Column(DateTime, nullable=True)
    last_login_ip = Column(String(50), nullable=True)
    login_count = Column(Integer, default=0, nullable=False)
    
    # Sistem
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    # created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # FIXME: users table not exist
    created_by_id = Column(Integer, nullable=True)  # Internal user
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
    
    # Relationships
    cari = relationship("Cari", foreign_keys=[cari_id])
    # created_by = relationship("User", foreign_keys=[created_by_id])  # FIXME: User model not imported
    # work_orders = relationship("WorkOrder", back_populates="portal_user", foreign_keys="WorkOrder.portal_user_id")  # FIXME: portal_user_id ForeignKey eksik
    documents = relationship("ArchiveDocument", back_populates="uploaded_by_portal_user", foreign_keys="ArchiveDocument.uploaded_by_portal_user_id")
    
    def verify_password(self, plain_password: str) -> bool:
        """Şifre doğrulama"""
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.verify(plain_password, self.hashed_password)
    
    def set_password(self, plain_password: str):
        """Şifre hash'leme"""
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.hashed_password = pwd_context.hash(plain_password)
        self.password_changed_at = datetime.utcnow()
        self.must_change_password = False
    
    def record_login(self, ip_address: str = None):
        """Login kaydı"""
        self.last_login_at = datetime.utcnow()
        self.last_login_ip = ip_address
        self.login_count += 1
    
    def has_active_work_orders(self, db) -> bool:
        """Aktif iş emri var mı?"""
        from ..isemri.models import WorkOrderStatus
        return db.query(WorkOrder).filter(
            WorkOrder.portal_user_id == self.id,
            WorkOrder.status.in_([
                WorkOrderStatus.DRAFT,
                WorkOrderStatus.SUBMITTED,
                WorkOrderStatus.APPROVED,
                WorkOrderStatus.SAHADA
            ])
        ).count() > 0


class ArchiveDocument(Base):
    """
    DİJİTAL ARŞİV - MERKEZ BELGE DEPOSU
    Tüm belge tiplerini tutar (polymorphic), versiyon kontrolü, süre takibi
    """
    __tablename__ = "archive_document"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    
    # Belge sınıflandırma
    category = Column(SQLEnum(DocumentCategory), nullable=False, index=True)
    document_type = Column(SQLEnum(DocumentType), nullable=False, index=True)
    
    # İlişkili kayıtlar (polymorphic - sadece biri dolu olur)
    work_order_id = Column(Integer, ForeignKey("work_order.id"), nullable=True, index=True)
    cari_id = Column(Integer, ForeignKey("Cari.Id"), nullable=True, index=True)
    # employee_id = Column(Integer, ForeignKey("employee.id"), nullable=True, index=True)  # Gelecek
    # vehicle_id = Column(Integer, ForeignKey("vehicle.id"), nullable=True, index=True)    # Gelecek
    
    # Dosya bilgileri
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)  # uploads/documents/category/work_order_no/timestamp_filename
    file_size = Column(Integer, nullable=False)  # bytes
    file_type = Column(String(100), nullable=False)  # application/pdf, image/jpeg, vb.
    file_hash = Column(String(64), nullable=False, index=True)  # SHA-256 hash (duplicate kontrolü)
    
    # Versiyon kontrolü
    version = Column(Integer, default=1, nullable=False)
    is_latest_version = Column(Boolean, default=True, nullable=False, index=True)
    previous_version_id = Column(Integer, ForeignKey("archive_document.id"), nullable=True)
    
    # Belge durumu
    status = Column(SQLEnum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False, index=True)
    
    # Onay/Red bilgileri
    # approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # FIXME: users table not exist
    approved_by_id = Column(Integer, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    approval_note = Column(Text, nullable=True)
    
    # rejected_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # FIXME: users table not exist
    rejected_by_id = Column(Integer, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Yükleyen
    # uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # FIXME: users table not exist
    uploaded_by_id = Column(Integer, nullable=True)  # Internal user
    uploaded_by_portal_user_id = Column(Integer, ForeignKey("portal_user.id"), nullable=True)  # Portal user
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Süre sınırlı belgeler (SRC-5: 1 yıl, Araç muayene: 2 yıl, vb.)
    issue_date = Column(DateTime, nullable=True)  # Belge düzenlenme tarihi
    expires_at = Column(DateTime, nullable=True, index=True)  # Geçerlilik bitiş tarihi
    expiry_notification_sent = Column(Boolean, default=False, nullable=False)  # 30 gün uyarısı gönderildi mi?
    
    # Metadata
    description = Column(Text, nullable=True)
    tags = Column(String(500), nullable=True)  # JSON array olarak saklanabilir
    
    # Sistem
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
    
    # Relationships
    work_order = relationship("WorkOrder", foreign_keys=[work_order_id])  # FIXME: back_populates removed - WorkOrder.documents eksik
    cari = relationship("Cari", foreign_keys=[cari_id])
    # approved_by = relationship("User", foreign_keys=[approved_by_id])  # FIXME: User model not imported
    # rejected_by = relationship("User", foreign_keys=[rejected_by_id])  # FIXME: User model not imported
    # uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])  # FIXME: User model not imported
    uploaded_by_portal_user = relationship("PortalUser", foreign_keys=[uploaded_by_portal_user_id], back_populates="documents")
    
    # Versiyon zinciri (linked list)
    previous_version = relationship("ArchiveDocument", remote_side=[id], foreign_keys=[previous_version_id])
    
    # Computed properties
    @property
    def is_expired(self) -> bool:
        """Belge süresi doldu mu?"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
    
    @property
    def days_until_expiry(self) -> int:
        """Süre sonuna kalan gün sayısı"""
        if not self.expires_at:
            return None
        delta = self.expires_at - datetime.utcnow()
        return max(0, delta.days)
    
    @property
    def is_required_for_work_order(self) -> bool:
        """İş emri için zorunlu belge mi?"""
        return self.document_type == DocumentType.GUMRUK_IZIN_BELGESI
    
    @property
    def file_size_mb(self) -> float:
        """Dosya boyutu (MB)"""
        return round(self.file_size / (1024 * 1024), 2)
    
    @staticmethod
    def calculate_file_hash(file_path: str) -> str:
        """Dosya SHA-256 hash hesapla"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()


class PortalEmployee(Base):
    """
    PORTAL FİRMA ÇALIŞANLARI
    Her cari, limana/sahaya gelecek çalışanlarını tanımlar
    Belge yönetimi: SRC5, Sigorta Listesi, Eğitim Sertifikası
    """
    __tablename__ = "portal_employee"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    
    # Cari ilişkisi
    cari_id = Column(Integer, ForeignKey("Cari.Id"), nullable=False, index=True)
    
    # Kişisel Bilgiler
    full_name = Column(String(200), nullable=False)
    tc_kimlik = Column(String(11), nullable=True)  # TC Kimlik No
    pasaport = Column(String(20), nullable=True)   # Pasaport No
    nationality = Column(String(3), default="TUR", nullable=True)  # TR, SY, vb.
    phone = Column(String(20), nullable=True)
    position = Column(String(100), nullable=True)  # Pozisyon/Görevi
    sgk_last_check_period = Column(String(6), nullable=True)  # YYYYMM format
    sgk_is_active_last_period = Column(Boolean, default=False, nullable=False)
    
    # Kimlik Fotoğrafı
    identity_photo_url = Column(String(500), nullable=True)
    
    # Durum
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, nullable=True)  # PortalUser.id veya User.id
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
    updated_by = Column(Integer, nullable=True)
    
    # İlişkiler
    cari = relationship("Cari", foreign_keys=[cari_id])
    documents = relationship("PortalEmployeeDocument", foreign_keys="PortalEmployeeDocument.employee_id", back_populates="employee")
    sgk_periods = relationship("PortalEmployeeSgkPeriod", back_populates="employee")
    sgk_periods = relationship("PortalEmployeeSgkPeriod", back_populates="employee")


class PortalEmployeeSgkPeriod(Base):
    """
    PORTAL ÇALIŞAN SGK DÖNEM KAYITLARI
    Çalışanların dönemsel SGK aktiflik durumlarını saklar.
    Kaynak: HIZMET_LISTESI (SGK hizmet dökümü), MANUEL (yönetici girişi)
    """
    __tablename__ = "portal_employee_sgk_periods"
    __table_args__ = (
        Index('ix_portal_emp_sgk_period_emp_period', 'employee_id', 'period_code'),
        {"extend_existing": True}
    )

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("portal_employee.id"), nullable=False, index=True)
    period_code = Column(String(7), nullable=False)  # "2025-10" formatı
    is_active = Column(Boolean, nullable=False, default=True)
    source = Column(String(20), nullable=False, default="HIZMET_LISTESI")  # HIZMET_LISTESI, MANUEL
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # İlişki
    employee = relationship("PortalEmployee", back_populates="sgk_periods")


class PortalEmployeeDocument(Base):
    """
    PORTAL ÇALIŞAN BELGELERİ
    Şoför Ehliyeti, SRC-5 gibi pozisyona özel belgelerin yönetimi
    Versiyon yönetimi ile audit trail
    """
    __tablename__ = "portal_employee_document"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    
    # İlişkiler
    employee_id = Column(Integer, ForeignKey("portal_employee.id"), nullable=False, index=True)
    cari_id = Column(Integer, ForeignKey("Cari.Id"), nullable=False, index=True)
    
    # Belge Tipi
    document_type = Column(String(50), nullable=False, index=True)  # EHLIYET, SRC5
    
    # Dosya bilgileri
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(100), nullable=False)
    
    # Geçerlilik
    issue_date = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True, index=True)
    
    # Versiyon kontrolü
    version = Column(Integer, default=1, nullable=False)
    is_latest_version = Column(Boolean, default=True, nullable=False, index=True)
    previous_version_id = Column(Integer, ForeignKey("portal_employee_document.id"), nullable=True)
    
    # Audit
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    uploaded_by = Column(Integer, nullable=True)  # PortalUser.id
    
    # İlişkiler
    employee = relationship("PortalEmployee", foreign_keys=[employee_id], back_populates="documents")
    cari = relationship("Cari", foreign_keys=[cari_id])
    
    # Versiyon zinciri
    previous_version = relationship("PortalEmployeeDocument", remote_side=[id], foreign_keys=[previous_version_id])
    
    @property
    def is_expired(self) -> bool:
        """Belge süresi doldu mu?"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at


class PortalVehicle(Base):
    """
    PORTAL ARAÇ TANIMLARI
    Her cari, limana/sahaya getirecek araçları tanımlar
    Belge yönetimi: Ruhsat, Muayene, Sigorta, Tescil
    """
    __tablename__ = "portal_vehicle"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    
    # Cari ilişkisi
    cari_id = Column(Integer, ForeignKey("Cari.Id"), nullable=False, index=True)
    
    # Araç Bilgileri
    plaka = Column(String(20), nullable=False, index=True)
    marka = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    vehicle_type = Column(String(50), nullable=True)  # KAMYON, TIR, FORKLIFT, MOBIL_VINC, vb.
    
    # Ruhsat/Tescil
    ruhsat_sahibi = Column(String(200), nullable=True)
    ruhsat_tarihi = Column(DateTime, nullable=True)
    
    # Durum
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, nullable=True)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
    updated_by = Column(Integer, nullable=True)
    
    # İlişkiler
    cari = relationship("Cari", foreign_keys=[cari_id])


class Notification(Base):
    """
    BİLDİRİM SİSTEMİ
    Portal kullanıcı + internal user için bildirimler
    """
    __tablename__ = "notification"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    
    # Alıcı (birisi dolu olur)
    # user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # FIXME: users table not exist
    user_id = Column(Integer, nullable=True, index=True)
    portal_user_id = Column(Integer, ForeignKey("portal_user.id"), nullable=True, index=True)
    
    # Bildirim
    type = Column(String(50), nullable=False, index=True)  # WORK_ORDER_CREATED, DOCUMENT_APPROVED, vb.
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # İlişkili kayıtlar
    work_order_id = Column(Integer, ForeignKey("work_order.id"), nullable=True)
    document_id = Column(Integer, ForeignKey("archive_document.id"), nullable=True)
    
    # Durum
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)
    
    # Email gönderildi mi?
    email_sent = Column(Boolean, default=False, nullable=False)
    email_sent_at = Column(DateTime, nullable=True)
    
    # Sistem
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    # user = relationship("User", foreign_keys=[user_id])  # FIXME: User model not imported
    portal_user = relationship("PortalUser", foreign_keys=[portal_user_id])
    work_order = relationship("WorkOrder", foreign_keys=[work_order_id])
    document = relationship("ArchiveDocument", foreign_keys=[document_id])


class VehicleDocumentType(Base):
    """
    ARAÇ BELGE TİPLERİ
    Ruhsat, Muayene, Sigorta gibi zorunlu evrakları tanımlar
    """
    __tablename__ = "vehicle_document_type"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    code = Column(String(50), nullable=False, unique=True, index=True)  # RUHSAT, MUAYENE, SIGORTA
    name = Column(String(200), nullable=False)  # "Araç ruhsatı", "Araç muayene belgesi", vb.
    is_required = Column(Boolean, default=True, nullable=False)  # Zorunlu belge mi?
    validity_days = Column(Integer, nullable=True)  # Geçerlilik süresi (gün), NULL=süresiz
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # İlişkiler
    documents = relationship("VehicleDocument", back_populates="doc_type")


class VehicleDocument(Base):
    """
    ARAÇ EVRAKLARI
    Her araç için zorunlu belgelerin takibi
    Durum: MISSING, PENDING, APPROVED, REJECTED, EXPIRED
    """
    __tablename__ = "vehicle_document"
    __table_args__ = (
        Index("ix_vehicle_document_vehicle_type", "vehicle_id", "doc_type_id"),
        {"extend_existing": True}
    )

    id = Column(Integer, primary_key=True)
    
    # İlişkiler
    vehicle_id = Column(Integer, ForeignKey("portal_vehicle.id"), nullable=False, index=True)
    doc_type_id = Column(Integer, ForeignKey("vehicle_document_type.id"), nullable=False, index=True)
    
    # Durum
    status = Column(String(20), nullable=False, default="MISSING", index=True)
    # Değerler: MISSING, PENDING, APPROVED, REJECTED, EXPIRED
    
    # Dosya bilgisi
    file_storage_key = Column(String(500), nullable=True)  # Dijital Arşiv'de relatif yol
    uploaded_at = Column(DateTime, nullable=True)
    uploaded_by_user_id = Column(Integer, nullable=True)  # PortalUser ID
    
    # Onay bilgisi
    approved_at = Column(DateTime, nullable=True)
    approved_by_user_id = Column(Integer, nullable=True)  # Admin/Yetkili ID
    
    # Geçerlilik
    expiry_date = Column(Date, nullable=True)  # Son kullanma tarihi
    
    # Red nedeni
    reject_reason = Column(String(500), nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
    
    # İlişkiler
    vehicle = relationship("PortalVehicle", foreign_keys=[vehicle_id])
    doc_type = relationship("VehicleDocumentType", back_populates="documents")

