# backend/aliaport_api/modules/auth/dependencies.py
"""
FastAPI dependencies for authentication and authorization.
"""
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ...config.database import get_db
from .models import User
from ...core.error_codes import ErrorCode, get_http_status_for_error
from ...core.responses import error_response
from .utils import verify_token
from .schemas import TokenData

# OAuth2 bearer token scheme (Authorization: Bearer <token>)
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency to extract and validate current user from JWT access token.
    
    Raises:
        HTTPException 401: Invalid token or user not found
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=get_http_status_for_error(ErrorCode.UNAUTHORIZED),
        detail=error_response(
            code=ErrorCode.UNAUTHORIZED,
            message="Kimlik doğrulama gerekli",
            details={"reason": "invalid_token"}
        ),
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decode and verify token
    payload = verify_token(token, token_type="access")
    if payload is None:
        raise credentials_exception
    
    user_id: Optional[int] = payload.get("user_id")
    if user_id is None:
        raise credentials_exception
    
    # Fetch user from database
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency to ensure user is active.
    
    Raises:
        HTTPException 403: User is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.AUTH_USER_INACTIVE),
            detail=error_response(
                code=ErrorCode.AUTH_USER_INACTIVE,
                message="Kullanıcı pasif durumda",
                details={"user_id": current_user.id}
            )
        )
    return current_user


def require_role(required_roles: List[str]):
    """
    Dependency factory for role-based access control.
    
    Usage:
        @router.get("/admin", dependencies=[Depends(require_role(["SISTEM_YONETICISI"]))])
    
    Args:
        required_roles: List of role names (e.g., ["SISTEM_YONETICISI", "OPERASYON"])
    
    Returns:
        Dependency function that checks user roles
    """
    async def role_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        # Superuser bypasses all role checks
        if current_user.is_superuser:
            return current_user

        user_roles = {role.name for role in current_user.roles}
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(
                status_code=get_http_status_for_error(ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS),
                detail=error_response(
                    code=ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
                    message="Gerekli rol yok",
                    details={"required_roles": required_roles, "user_roles": list(user_roles)}
                )
            )

        return current_user
    
    return role_checker


def require_permission(resource: str, action: str, allow_any: bool = False):
    """
    Dependency factory for permission-based access control.
    
    Supports both single and multiple permission checks. When allow_any=True,
    user needs at least ONE of the specified permissions.
    
    Usage:
        # Single permission check
        @router.post("/cari", dependencies=[Depends(require_permission("cari", "write"))])
        
        # Multiple permissions (any one of them)
        @router.get("/dashboard", dependencies=[Depends(require_permission("dashboard", "read,admin", allow_any=True))])
        
        # Wildcard action (supports resource:*)
        @router.get("/admin", dependencies=[Depends(require_permission("admin", "*"))])
    
    Args:
        resource: Resource name (e.g., "cari", "motorbot", "admin")
        action: Action name (e.g., "read", "write", "delete") or comma-separated list for multiple
        allow_any: If True and action contains multiple values, allows ANY match; if False, requires ALL
    
    Returns:
        Dependency function that checks user permissions with built-in caching
        
    OpenAPI Response Examples:
        - 403 when user lacks required permission
        - Error envelope with ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS
    """
    async def permission_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        # Superuser bypasses all permission checks
        if current_user.is_superuser:
            return current_user

        # Parse action(s) - support comma-separated list
        actions = [a.strip() for a in action.split(",")] if "," in action else [action]
        required_permissions = [f"{resource}:{act}" for act in actions]
        
        # Build user permission set (cache-friendly)
        user_permissions = set()
        for role in current_user.roles:
            for perm in role.permissions:
                user_permissions.add(perm.name)
                # Also support wildcard permissions (e.g., admin:*)
                if perm.action == "*":
                    user_permissions.add(f"{perm.resource}:*")
        
        # Check for wildcard match
        wildcard_permission = f"{resource}:*"
        if wildcard_permission in user_permissions:
            return current_user
        
        # Check required permissions
        matched = [perm for perm in required_permissions if perm in user_permissions]
        
        if allow_any:
            # ANY mode: at least one match required
            if matched:
                return current_user
        else:
            # ALL mode: all permissions required
            if len(matched) == len(required_permissions):
                return current_user

        # Permission denied
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS),
            detail=error_response(
                code=ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
                message="İzin eksik",
                details={
                    "required_permissions": required_permissions,
                    "user_permissions": list(user_permissions),
                    "mode": "any" if allow_any else "all"
                }
            )
        )
    
    return permission_checker
