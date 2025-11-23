"""
GÜVENLİK MODÜLÜ - Models
GateLog (Kapı Giriş/Çıkış Kayıtları)
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from ...config.database import Base


class GateLog(Base):
    """
    Güvenlik kapı giriş/çıkış kayıtları
    İş emri kontrolü ve doküman checklist
    """
    __tablename__ = "gatelog"

    id = Column(Integer, primary_key=True, index=True)
    
    # İlişkiler
    work_order_id = Column(Integer, nullable=False)  # Foreign key kaldırıldı
    motorbot_id = Column(Integer, nullable=True)  # Foreign key kaldırıldı
    
    # Giriş tipi
    entry_type = Column(String(10), nullable=False)  # GIRIS veya CIKIS
    
    # İş emri bilgileri
    wo_number = Column(String(50), nullable=False)
    wo_status = Column(String(20), nullable=False)  # ONAYLANDI, BEKLEMEDE, REDDEDILDI
    
    # Güvenlik personeli
    security_personnel = Column(String(100), nullable=False)
    
    # Kontrol durumu
    is_approved = Column(Boolean, default=False)  # Giriş izni verildi mi?
    checklist_complete = Column(Boolean, default=False)  # Checklist tamamlandı mı?
    checklist_data = Column(Text, nullable=True)  # JSON formatında checklist verileri
    
    # İstisna durumu
    is_exception = Column(Boolean, default=False)  # İstisna ile mi girildi?
    exception_pin = Column(String(10), nullable=True)  # Yetkilendirme PIN (hash'lenmiş)
    exception_reason = Column(Text, nullable=True)  # İstisna sebebi
    exception_approved_by = Column(String(100), nullable=True)
    
    # Fotoğraf
    photo_url = Column(String(500), nullable=True)  # Giriş/çıkış fotoğrafı
    
    # Zaman damgaları
    gate_time = Column(DateTime, default=datetime.utcnow)  # Giriş/çıkış zamanı
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Notlar
    notes = Column(Text, nullable=True)
    
    # İlişkiler kaldırıldı - gerekirse daha sonra eklenecek
    # work_order = relationship("WorkOrder", backref="gate_logs", foreign_keys=[work_order_id])
    # motorbot = relationship("Motorbot", backref="gate_logs", foreign_keys=[motorbot_id])
    
    def __repr__(self):
        return f"<GateLog {self.id} - {self.entry_type} - {self.wo_number} - {self.gate_time}>"


class GateChecklistItem(Base):
    """
    Kapı kontrol checklist kalemleri
    Her iş emri tipi için farklı checklist tanımları
    """
    __tablename__ = "gate_checklist_item"

    id = Column(Integer, primary_key=True, index=True)
    
    # Checklist tanımı
    wo_type = Column(String(20), nullable=False)  # HIZMET, MOTORBOT, BARINMA, DIGER
    item_label = Column(String(200), nullable=False)  # "İş Emri Belgesi", "Motorbot Ruhsatı"
    is_required = Column(Boolean, default=True)  # Zorunlu mu?
    display_order = Column(Integer, default=0)  # Gösterim sırası
    
    # Durum
    is_active = Column(Boolean, default=True)
    
    # Zaman damgası
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<GateChecklistItem {self.id} - {self.wo_type} - {self.item_label}>"
