"""SGK entegrasyonuna ait SQLAlchemy modelleri."""
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ...config.database import Base


class SgkPeriodCheck(Base):
    """SGK PDF yükleri ve dönem kontrol kayıtları."""
    __tablename__ = "sgk_period_check"

    id = Column(Integer, primary_key=True)
    firma_id = Column(Integer, ForeignKey("Cari.Id"), nullable=False, index=True)
    period = Column(String(6), nullable=False, index=True)  # YYYYMM
    storage_key = Column(String(500), nullable=False)  # Dosya sistemi relative path
    file_size = Column(Integer, nullable=False)
    checksum = Column(String(128), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(20), nullable=False, default="OK")  # OK, FAILED_PARSE
    matched_employee_count = Column(Integer, nullable=False, default=0)
    missing_employee_count = Column(Integer, nullable=False, default=0)
    extra_in_sgk_count = Column(Integer, nullable=False, default=0)

    firma = relationship("Cari", foreign_keys=[firma_id])
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_user_id])

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"<SgkPeriodCheck {self.period} firma={self.firma_id} status={self.status}>"
