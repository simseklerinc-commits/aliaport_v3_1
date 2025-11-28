# backend/aliaport_api/modules/auth/schemas.py
"""
Pydantic schemas for authentication endpoints.
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime


# ============================================
# User Schemas
# ============================================

class UserLogin(BaseModel):
    """Login credentials."""
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserCreate(BaseModel):
    """User creation payload."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: Optional[str] = Field(None, max_length=200)
    role_ids: Optional[List[int]] = Field(default_factory=list)
    is_active: bool = True

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Basic password strength validation."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserUpdate(BaseModel):
    """User update payload."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, max_length=200)
    password: Optional[str] = Field(None, min_length=8, max_length=100)
    is_active: Optional[bool] = None
    role_ids: Optional[List[int]] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class RoleResponse(BaseModel):
    """Role response schema."""
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    """User response (no password)."""
    id: int
    email: str
    full_name: Optional[str] = None
    is_active: bool
    is_superuser: bool
    roles: List[RoleResponse] = []
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================
# Token Schemas
# ============================================

class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds (900 for 15min)


class TokenRefresh(BaseModel):
    """Token refresh request."""
    refresh_token: str


class TokenData(BaseModel):
    """Decoded JWT token data."""
    user_id: int
    email: str
    roles: List[str] = []
    exp: int  # expiration timestamp


# ============================================
# Password Reset Schemas
# ============================================

class PasswordResetRequest(BaseModel):
    """Password reset request (email only)."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation with new password."""
    token: str = Field(..., min_length=32)
    new_password: str = Field(..., min_length=8, max_length=100)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Basic password strength validation."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v
