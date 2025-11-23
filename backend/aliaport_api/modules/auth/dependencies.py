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
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
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
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
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
        
        # Check if user has any of the required roles
        user_roles = {role.name for role in current_user.roles}
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {', '.join(required_roles)}",
            )
        
        return current_user
    
    return role_checker


def require_permission(resource: str, action: str):
    """
    Dependency factory for permission-based access control.
    
    Usage:
        @router.post("/cari", dependencies=[Depends(require_permission("cari", "write"))])
    
    Args:
        resource: Resource name (e.g., "cari", "motorbot")
        action: Action name (e.g., "read", "write", "delete")
    
    Returns:
        Dependency function that checks user permissions
    """
    async def permission_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        # Superuser bypasses all permission checks
        if current_user.is_superuser:
            return current_user
        
        # Check if user has the required permission through any role
        required_permission = f"{resource}:{action}"
        for role in current_user.roles:
            for perm in role.permissions:
                if perm.name == required_permission:
                    return current_user
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Missing permission: {required_permission}",
        )
    
    return permission_checker
