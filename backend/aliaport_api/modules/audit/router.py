from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ...config.database import get_db
from .models import AuditEvent
from ..auth.dependencies import get_current_active_user, require_role

router = APIRouter(prefix="/api/audit", tags=["Audit"])

@router.get("/events")
async def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    user_id: Optional[int] = Query(None),
    resource: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    status_code: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _admin = Depends(require_role(["SISTEM_YONETICISI"]))
):
    q = db.query(AuditEvent)
    if user_id is not None:
        q = q.filter(AuditEvent.user_id == user_id)
    if resource:
        q = q.filter(AuditEvent.resource == resource)
    if action:
        q = q.filter(AuditEvent.action == action)
    if status_code is not None:
        q = q.filter(AuditEvent.status_code == status_code)
    total = q.count()
    items = q.order_by(AuditEvent.id.desc()).offset((page-1)*page_size).limit(page_size).all()
    return {
        "success": True,
        "data": {
            "items": [
                {
                    "id": e.id,
                    "user_id": e.user_id,
                    "method": e.method,
                    "path": e.path,
                    "resource": e.resource,
                    "action": e.action,
                    "entity_id": e.entity_id,
                    "status_code": e.status_code,
                    "roles": e.roles,
                    "duration_ms": e.duration_ms,
                    "ip": e.ip,
                    "created_at": e.created_at.isoformat(),
                } for e in items
            ],
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1)//page_size
        },
        "meta": {"timestamp": __import__("datetime").datetime.utcnow().isoformat()}
    }
