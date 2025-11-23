"""
SAHA PERSONEL MODÜLÜ - Models
WorkLog (Saha Personeli İş Kayıtları)
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from ...config.database import Base


class WorkLog(Base):
    """
    Saha personelinin iş kayıtları
    İş emri veya sefer için yapılan çalışmaların zaman ve hizmet kaydı
    """
    __tablename__ = "worklog"

    id = Column(Integer, primary_key=True, index=True)
    
    # İlişkiler
    work_order_id = Column(Integer, nullable=True)  # Foreign key'i kaldırdık - daha sonra eklenecek
    sefer_id = Column(Integer, nullable=True)  # MB Sefer bağlantısı
    motorbot_id = Column(Integer, nullable=True)  # Foreign key'i kaldırdık
    hizmet_kodu = Column(String(20), nullable=True)  # Hizmet kodu referansı
    
    # Personel bilgisi
    personnel_name = Column(String(100), nullable=False)  # Tablet'te giriş yapan kullanıcı
    
    # Zaman kayıtları
    time_start = Column(DateTime, nullable=False)
    time_end = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)  # Hesaplanan süre (dakika)
    
    # Hizmet detayları
    service_type = Column(String(50), nullable=True)  # BAKIM, TAMIR, TRANSFER, vs
    quantity = Column(Float, default=1.0)
    unit = Column(String(20), default="SAAT")
    
    # Açıklama ve notlar
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
    is_approved = Column(Integer, default=0)  # Admin onayı
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    
    # İlişkiler kaldırıldı - gerekirse daha sonra eklenecek
    # work_order = relationship("WorkOrder", backref="worklogs", foreign_keys=[work_order_id])
    # motorbot = relationship("Motorbot", backref="worklogs", foreign_keys=[motorbot_id])
    
    def __repr__(self):
        return f"<WorkLog {self.id} - {self.personnel_name} - {self.time_start}>"
    
    def calculate_duration(self):
        """Başlangıç ve bitiş zamanından süreyi hesapla"""
        if self.time_start and self.time_end:
            delta = self.time_end - self.time_start
            self.duration_minutes = int(delta.total_seconds() / 60)
        return self.duration_minutes
