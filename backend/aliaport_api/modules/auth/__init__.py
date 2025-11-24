# backend/aliaport_api/modules/auth/__init__.py
"""
Authentication & Authorization Module
--------------------------------------
JWT token-based authentication with RBAC (Role-Based Access Control).
"""

from .models import User, Role, Permission
import os
from .schemas import (
    UserLogin,
    UserCreate,
    UserUpdate,
    UserResponse,
    TokenResponse,
    RoleResponse,
)
# Router import koşullu yapılır; Alembic migration sırasında gereksiz ve hata üretebilir.
try:
    # Alembic ortamında da testler için router yüklenmesine izin veriyoruz.
    from .router import router as auth_router  # type: ignore
except Exception:
    auth_router = None
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
