# backend/aliaport_api/modules/audit/utils.py
"""Utility functions for persisting audit events."""
from typing import Optional
from fastapi import Request, Response
from sqlalchemy.orm import Session
from ...config.database import SessionLocal
from ..auth.utils import verify_token
from ..auth.models import User
from .models import AuditEvent
import time

METHOD_ACTION_MAP = {
    "GET": "read",
    "POST": "create",
    "PUT": "update",
    "PATCH": "update",
    "DELETE": "delete"
}

def infer_resource_and_action(path: str, method: str) -> (Optional[str], Optional[str]):
    # Expect paths like /api/<resource>/... ; strip leading / and split
    parts = [p for p in path.split('/') if p]
    resource = None
    action = METHOD_ACTION_MAP.get(method.upper())
    if len(parts) >= 2 and parts[0] == 'api':
        resource = parts[1]
    elif len(parts) >= 1:
        resource = parts[0]
    return resource, action

def persist_audit_event(request: Request, response: Response, duration_ms: int) -> None:
    """Persist an audit event for an HTTP request. Safe-fail (never raises)."""
    try:
        auth_header = request.headers.get('Authorization')
        user_id = None
        roles_str = None
        db: Session = SessionLocal()
        user: Optional[User] = None
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]
            payload = verify_token(token, token_type='access')
            if payload and payload.get('user_id'):
                user_id = payload['user_id']
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    roles_str = ','.join(r.name for r in user.roles)
        resource, action = infer_resource_and_action(str(request.url.path), request.method)
        ip = request.client.host if request.client else None
        user_agent = request.headers.get('User-Agent')
        event = AuditEvent(
            user_id=user_id,
            method=request.method,
            path=str(request.url.path),
            action=action,
            resource=resource,
            status_code=response.status_code,
            duration_ms=duration_ms,
            roles=roles_str,
            ip=ip,
            user_agent=user_agent,
        )
        db.add(event)
        db.commit()
    except Exception:
        # Silent fail: we don't want auditing to break request flow.
        try:
            db.rollback()
        except Exception:
            pass
    finally:
        try:
            db.close()
        except Exception:
            pass

def persist_business_event(event_type: str, description: str, user_id: Optional[int], entity_type: Optional[str], entity_id: Optional[int], details: Optional[dict]):
    """Persist business event into audit_events table with type mapping."""
    try:
        db: Session = SessionLocal()
        roles_str = None
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                roles_str = ','.join(r.name for r in user.roles)
        event = AuditEvent(
            user_id=user_id,
            method='BUS',
            path=f'/business/{event_type}',
            action='business',
            resource=entity_type,
            entity_id=entity_id,
            status_code=200,
            duration_ms=None,
            roles=roles_str,
            ip=None,
            user_agent=None,
            extra={
                'description': description,
                'details': details or {}
            }
        )
        db.add(event)
        db.commit()
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass
    finally:
        try:
            db.close()
        except Exception:
            pass
