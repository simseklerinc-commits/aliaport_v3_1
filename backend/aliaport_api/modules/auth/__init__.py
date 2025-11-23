# backend/aliaport_api/modules/auth/__init__.py
"""
Authentication & Authorization Module
--------------------------------------
JWT token-based authentication with RBAC (Role-Based Access Control).
"""

from .models import User, Role, Permission
from .schemas import (
    UserLogin,
    UserCreate,
    UserUpdate,
    UserResponse,
    TokenResponse,
    RoleResponse,
)
from .router import router as auth_router
from .dependencies import get_current_user, get_current_active_user, require_role

__all__ = [
    "User",
    "Role",
    "Permission",
    "UserLogin",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "TokenResponse",
    "RoleResponse",
    "auth_router",
    "get_current_user",
    "get_current_active_user",
    "require_role",
]
