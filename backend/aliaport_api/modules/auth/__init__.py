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
if not os.getenv("ALEMBIC_RUNNING"):
    try:
        from .router import router as auth_router  # type: ignore
    except Exception:
        # SlowAPI veya FastAPI context'i uygun değilse router yüklenmesin
        auth_router = None
else:
    auth_router = None  # Alembic ortamında route'lar yüklenmesin
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
