# backend/aliaport_api/modules/auth/router.py
"""
Authentication endpoints: login, logout, refresh, user management.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...config.database import get_db
from ...core.responses import success_response, error_response
from .schemas import (
    UserLogin,
    UserCreate,
    UserUpdate,
    UserResponse,
    TokenResponse,
    TokenRefresh,
)
from .service import AuthService
from .dependencies import get_current_active_user, get_current_user, require_role
from .models import User
from .utils import verify_token

from fastapi.routing import APIRoute

router = APIRouter(prefix="/auth", tags=["Authentication"])

from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address)


# ============================================
# Public Endpoints (No Auth Required)
# ============================================

@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/minute")
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    """
    Login endpoint: authenticate user and return JWT tokens.
    
    - **email**: User email address
    - **password**: User password
    
    Returns:
        - access_token: Short-lived JWT (15 minutes)
        - refresh_token: Long-lived JWT (7 days)
        - token_type: "bearer"
        - expires_in: Access token expiry in seconds
    """
    # Authenticate user
    user = AuthService.authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    
    # Update last login
    AuthService.update_last_login(db, user.id)
    
    # Generate tokens
    tokens = AuthService.generate_tokens(user)
    
    return TokenResponse(**tokens)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("30/minute")
async def refresh_token(
    refresh_data: TokenRefresh,
    db: Session = Depends(get_db),
):
    """
    Refresh access token using refresh token.
    
    - **refresh_token**: Valid refresh token
    
    Returns:
        New access and refresh tokens
    """
    # Verify refresh token
    payload = verify_token(refresh_data.refresh_token, token_type="refresh")
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user
    user_id = payload.get("user_id")
    user = AuthService.get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    
    # Generate new tokens
    tokens = AuthService.generate_tokens(user)
    
    return TokenResponse(**tokens)


# ============================================
# Protected Endpoints (Auth Required)
# ============================================

@router.post("/logout")
@limiter.limit("60/minute")
async def logout(
    current_user: User = Depends(get_current_active_user),
):
    """
    Logout endpoint (client should discard tokens).
    
    Note: JWT tokens are stateless, so logout is handled client-side.
    Server doesn't maintain token blacklist in this implementation.
    """
    return success_response(
        data={"message": "Logged out successfully"},
        message=f"User {current_user.email} logged out",
    )


@router.get("/me", response_model=UserResponse)
@limiter.limit("120/minute")
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
):
    """Get current authenticated user information."""
    return current_user


# ============================================
# Admin Endpoints (Role-Based)
# ============================================

@router.post(
    "/users",
    response_model=UserResponse,
    dependencies=[Depends(require_role(["SISTEM_YONETICISI"]))],
)
@limiter.limit("30/minute")
async def create_user(
    user_create: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create a new user (admin only).
    
    Requires role: SISTEM_YONETICISI
    """
    user = AuthService.create_user(db, user_create)
    return user


@router.get(
    "/users",
    response_model=List[UserResponse],
    dependencies=[Depends(require_role(["SISTEM_YONETICISI"]))],
)
@limiter.limit("60/minute")
async def list_users(
    skip: int = 0,
    limit: int = 50,
    is_active: bool = None,
    db: Session = Depends(get_db),
):
    """
    List all users (admin only).
    
    Requires role: SISTEM_YONETICISI
    """
    users = AuthService.list_users(db, skip=skip, limit=limit, is_active=is_active)
    return users


@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
    dependencies=[Depends(require_role(["SISTEM_YONETICISI"]))],
)
@limiter.limit("60/minute")
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
):
    """
    Get user by ID (admin only).
    
    Requires role: SISTEM_YONETICISI
    """
    user = AuthService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.put(
    "/users/{user_id}",
    response_model=UserResponse,
    dependencies=[Depends(require_role(["SISTEM_YONETICISI"]))],
)
@limiter.limit("30/minute")
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
):
    """
    Update user (admin only).
    
    Requires role: SISTEM_YONETICISI
    """
    user = AuthService.update_user(db, user_id, user_update)
    return user
