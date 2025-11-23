from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from ...config.database import Base

class AuditEvent(Base):
    __tablename__ = "audit_events"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    method = Column(String(10), nullable=False)
    path = Column(String(300), index=True, nullable=False)
    action = Column(String(50), index=True, nullable=True)  # inferred resource action
    resource = Column(String(50), index=True, nullable=True)
    entity_id = Column(Integer, nullable=True)
    status_code = Column(Integer, nullable=False)
    duration_ms = Column(Integer, nullable=True)
    roles = Column(String(200), nullable=True)  # comma separated
    ip = Column(String(64), nullable=True)
    user_agent = Column(String(300), nullable=True)
    extra = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
