"""
GÜVENLİK MODÜLÜ - Models
GateLog (Kapı Giriş/Çıkış Kayıtları)
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta

from ...config.database import Base


class GateLog(Base):
    """
    Güvenlik kapı giriş/çıkış kayıtları
    İş emri kontrolü ve doküman checklist
    
    YENİ ÖZELLİKLER (25 Kasım 2025):
    - İş emri entegrasyonu (work_order_id FK)
    - Araç 4 saat kuralı hesaplaması
    - Kimlik belgesi fotoğrafı yükleme
    - WorkOrderPerson entegrasyonu
    """
    __tablename__ = "gatelog"

    id = Column(Integer, primary_key=True, index=True)
    
    # İş Emri İlişkisi (YENİ FK ekle)
    work_order_id = Column(Integer, ForeignKey("work_order.id"), nullable=False, index=True)
    work_order_person_id = Column(Integer, ForeignKey("work_order_person.id"), nullable=True, index=True)  # YENİ
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
    
    # YENİ: Araç Bilgileri (Araç giriş/çıkış için)
    vehicle_plate = Column(String(20), nullable=True, index=True)  # Plaka
    vehicle_type = Column(String(50), nullable=True)  # OTOMOBİL, KAMYONET, KAMYON
    driver_name = Column(String(200), nullable=True)  # Sürücü adı
    
    # YENİ: 4 Saat Kuralı Hesaplamaları
    entry_time = Column(DateTime, nullable=True)  # Giriş zamanı
    exit_time = Column(DateTime, nullable=True)   # Çıkış zamanı
    duration_minutes = Column(Integer, nullable=True)  # Kalış süresi (dakika)
    base_charge_hours = Column(Integer, default=4, nullable=False)  # Kesin ücret saati (default: 4)
    extra_minutes = Column(Integer, default=0, nullable=False)  # 240 dakikayı aşan süre
    extra_charge_calculated = Column(Numeric(15, 2), nullable=True)  # Hesaplanan ek ücret
    
    # YENİ: Kimlik Belgesi Entegrasyonu
    identity_documents_uploaded = Column(Boolean, default=False, nullable=False)  # Kimlik fotoğrafları yüklendi mi?
    identity_document_count = Column(Integer, default=0, nullable=False)  # Yüklenen kimlik sayısı
    
    # Zaman damgaları
    gate_time = Column(DateTime, default=datetime.utcnow)  # Giriş/çıkış zamanı (deprecated - use entry_time/exit_time)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Notlar
    notes = Column(Text, nullable=True)
    
    # YENİ: İlişkiler
    work_order = relationship("WorkOrder", foreign_keys=[work_order_id])
    work_order_person = relationship("WorkOrderPerson", foreign_keys=[work_order_person_id])
    
    # Computed Properties
    @property
    def is_vehicle_entry(self) -> bool:
        """Araç girişi mi?"""
        return self.vehicle_plate is not None
    
    @property
    def calculate_duration(self) -> int:
        """Kalış süresini hesapla (dakika)"""
        if self.entry_time and self.exit_time:
            delta = self.exit_time - self.entry_time
            return int(delta.total_seconds() / 60)
        return 0
    
    @property
    def is_over_base_hours(self) -> bool:
        """4 saati aştı mı?"""
        if self.duration_minutes:
            return self.duration_minutes > (self.base_charge_hours * 60)
        return False
    
    @property
    def calculate_extra_charge(self) -> dict:
        """
        Ek ücret hesapla (4 saat kuralı)
        
        Returns:
            {
                "base_minutes": 240,
                "actual_minutes": 450,
                "extra_minutes": 210,
                "needs_extra_charge": True
            }
        """
        base_minutes = self.base_charge_hours * 60
        actual_minutes = self.duration_minutes or 0
        extra_minutes = max(0, actual_minutes - base_minutes)
        
        return {
            "base_minutes": base_minutes,
            "actual_minutes": actual_minutes,
            "extra_minutes": extra_minutes,
            "needs_extra_charge": extra_minutes > 0
        }
    
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
