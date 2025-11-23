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
    DRAFT = "DRAFT"              # Taslak
    SUBMITTED = "SUBMITTED"      # Gönderildi
    APPROVED = "APPROVED"        # Onaylandı
    SAHADA = "SAHADA"           # Sahada
    TAMAMLANDI = "TAMAMLANDI"   # Tamamlandı
    FATURALANDI = "FATURALANDI" # Faturalandı
    KAPANDI = "KAPANDI"         # Kapatıldı
    REJECTED = "REJECTED"        # Reddedildi


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
    security_exit_time = Column(DateTime, nullable=True)  # Güvenlik çıkış anı
    attached_letter_approved = Column(Boolean, default=False)  # Dış vinç dilekçe onayı
    
    # Notlar
    notes = Column(Text, nullable=True)
    
    # Sistem
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
