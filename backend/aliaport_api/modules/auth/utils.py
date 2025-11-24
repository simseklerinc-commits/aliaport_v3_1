# backend/aliaport_api/modules/auth/utils.py
"""
Password hashing, JWT token utilities for authentication.
"""
import os
from datetime import datetime, timedelta
import uuid
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from jose import JWTError, jwt

# ============================================
# Password Hashing (bcrypt)
# ============================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ============================================
# JWT Token Utilities
# ============================================

# Load from environment (fallback for dev)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CHANGE_ME_IN_PRODUCTION_c8f9a3b2e1d4f7a6")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # 15 minutes
REFRESH_TOKEN_EXPIRE_DAYS = 7  # 7 days


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token (default: 15min expiry).

    Adds unique jti and issued-at (iat) to ensure refreshed tokens differ even if generated in same second.
    """
    to_encode = data.copy()
    now = datetime.utcnow()
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access", "iat": now, "jti": uuid.uuid4().hex})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT refresh token (default: 7 days expiry) with jti and iat for uniqueness."""
    to_encode = data.copy()
    now = datetime.utcnow()
    expire = now + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "type": "refresh", "iat": now, "jti": uuid.uuid4().hex})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and verify a JWT token. Raises JWTError if invalid."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def verify_token(token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
    """
    Verify token type and expiration. Returns payload if valid, None otherwise.
    
    Args:
        token: JWT token string
        token_type: "access" or "refresh"
    
    Returns:
        Token payload dict if valid, None if invalid
    """
    try:
        payload = decode_token(token)
        if payload.get("type") != token_type:
            return None
        return payload
    except JWTError:
        return None


# ============================================
# Password Reset Token Utilities
# ============================================

def generate_reset_token() -> str:
    """
    Generate a secure random token for password reset.
    Uses UUID4 for cryptographic randomness.
    
    Returns:
        64-character hex token
    """
    return uuid.uuid4().hex + uuid.uuid4().hex  # 64 chars


def create_reset_token_expiry(hours: int = 1) -> datetime:
    """
    Create expiration datetime for password reset token.
    
    Args:
        hours: Token validity in hours (default: 1 hour)
    
    Returns:
        Expiration datetime (UTC)
    """
    return datetime.utcnow() + timedelta(hours=hours)
