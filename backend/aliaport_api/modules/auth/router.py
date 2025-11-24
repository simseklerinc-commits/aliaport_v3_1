# backend/aliaport_api/modules/auth/router.py
"""
Authentication endpoints: login, logout, refresh, user management.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
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
    PasswordResetRequest,
    PasswordResetConfirm,
)
from .service import AuthService
from .dependencies import get_current_active_user, get_current_user, require_role, require_permission
from .models import User
from .utils import verify_token

from fastapi.routing import APIRoute

router = APIRouter(tags=["Authentication"])

from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address)


# ============================================
# Public Endpoints (No Auth Required)
# ============================================

@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")  # Daha sıkı: brute force denemelerini azaltmak için
async def login(
    request: Request,
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    """
    Login endpoint: authenticate user and return JWT tokens.
    
    - **email**: User email address
    - **password**: User password (optional - if not provided, auto-login)
    
    Returns:
        - access_token: Short-lived JWT (15 minutes)
        - refresh_token: Long-lived JWT (7 days)
        - token_type: "bearer"
        - expires_in: Access token expiry in seconds
    """
    # Şifresiz giriş: email varsa otomatik login
    user = None
    
    if not credentials.password:
        # Şifresiz giriş - email ile bul
        user = db.query(User).filter(User.email == credentials.email).first()
    else:
        # Normal giriş
        user = AuthService.authenticate_user(db, credentials.email, credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
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
    request: Request,
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
    request: Request,
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
    request: Request,
    current_user: User = Depends(get_current_active_user),
):
    """Get current authenticated user information."""
    return current_user


@router.get("/me/permissions")
@limiter.limit("120/minute")
async def get_current_user_permissions(
    request: Request,
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current user's full permission list.
    
    Returns all permissions granted through roles.
    Useful for frontend RBAC components.
    """
    permissions = set()
    
    for role in current_user.roles:
        for perm in role.permissions:
            permissions.add(perm.name)
    
    return success_response(
        data={
            "user_id": current_user.id,
            "email": current_user.email,
            "is_superuser": current_user.is_superuser,
            "roles": [{"id": r.id, "name": r.name} for r in current_user.roles],
            "permissions": sorted(list(permissions))
        }
    )


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
    request: Request,
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
    request: Request,
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
    request: Request,
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
    request: Request,
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


# ============================================
# Permission-Based Example Endpoints
# ============================================

@router.post(
    "/admin/roles/assign",
    dependencies=[Depends(require_permission("admin", "write"))],
    responses={
        403: {
            "description": "Permission denied",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "error": {
                            "code": "AUTH_INSUFFICIENT_PERMISSIONS",
                            "message": "İzin eksik",
                            "details": {
                                "required_permissions": ["admin:write"],
                                "user_permissions": ["cari:read", "cari:write"],
                                "mode": "all"
                            }
                        }
                    }
                }
            }
        }
    }
)
@limiter.limit("20/minute")
async def assign_role_to_user(
    request: Request,
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Assign a role to a user (requires admin:write permission).
    
    This endpoint demonstrates permission-based access control.
    Only users with 'admin:write' permission (or admin:* wildcard) can access.
    
    Requires permission: admin:write
    """
    from .models import User, Role
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role not in user.roles:
        user.roles.append(role)
        db.commit()
    
    return success_response(
        data={"user_id": user_id, "role_id": role_id, "role_name": role.name},
        message=f"Role '{role.name}' assigned to user {user.email}"
    )


@router.get(
    "/admin/permissions/check",
    dependencies=[Depends(require_permission("admin", "read,write", allow_any=True))],
)
@limiter.limit("60/minute")
async def check_permissions_example(
    request: Request,
    current_user: User = Depends(get_current_active_user),
):
    """
    Check current user's permissions (requires admin:read OR admin:write).
    
    This endpoint demonstrates multi-permission check with allow_any=True.
    User needs either 'admin:read' OR 'admin:write' permission.
    
    Requires permission: admin:read OR admin:write (any)
    """
    user_perms = []
    for role in current_user.roles:
        for perm in role.permissions:
            user_perms.append(perm.name)
    
    return success_response(
        data={
            "user_id": current_user.id,
            "email": current_user.email,
            "roles": [r.name for r in current_user.roles],
            "permissions": user_perms,
            "is_superuser": current_user.is_superuser
        }
    )


# ============================================
# Password Reset Endpoints
# ============================================

@router.post("/request-reset")
@limiter.limit("5/hour")  # Şifre sıfırlama isteği (IP bazlı) kötüye kullanımı engelle
async def request_password_reset(
    request: Request,
    reset_request: PasswordResetRequest,
    db: Session = Depends(get_db),
):
    """
    Request password reset email.
    
    Sends reset token to user's email if account exists.
    Always returns success (even if email not found) to prevent email enumeration.
    
    Rate limit: 5 requests per hour per IP
    """
    from .models import PasswordResetToken
    from .utils import generate_reset_token, create_reset_token_expiry
    from ...utils.email import send_password_reset_email
    from ...core.error_codes import ErrorCode, get_http_status_for_error
    
    # Find user by email
    user = db.query(User).filter(User.email == reset_request.email).first()
    
    if user:
        # Generate reset token
        token = generate_reset_token()
        expires_at = create_reset_token_expiry(hours=1)
        
        # Save token to database
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at
        )
        db.add(reset_token)
        db.commit()
        
        # Send email
        send_password_reset_email(
            email=user.email,
            reset_token=token,
            user_name=user.full_name or ""
        )
    
    # Always return success (prevent email enumeration)
    return success_response(
        data={"message": "If the email exists, a password reset link has been sent"},
        message="Şifre sıfırlama bağlantısı gönderildi (e-posta kayıtlıysa)"
    )


@router.post("/reset-password")
@limiter.limit("10/hour")  # Token kullanımı için makul üst sınır
async def reset_password(
    request: Request,
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db),
):
    """
    Reset password using token.
    
    Validates token and updates user password.
    Token is single-use and expires after 1 hour.
    """
    from .models import PasswordResetToken
    from .utils import hash_password
    from ...utils.email import send_password_changed_notification
    from ...core.error_codes import ErrorCode, get_http_status_for_error
    from datetime import datetime, timezone
    
    # Find token
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == reset_data.token
    ).first()
    
    if not reset_token:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.AUTH_PASSWORD_RESET_TOKEN_INVALID),
            detail=error_response(
                code=ErrorCode.AUTH_PASSWORD_RESET_TOKEN_INVALID,
                message="Geçersiz şifre sıfırlama bağlantısı",
            )
        )
    
    # Check if token is expired
    if reset_token.is_expired():
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.AUTH_PASSWORD_RESET_TOKEN_EXPIRED),
            detail=error_response(
                code=ErrorCode.AUTH_PASSWORD_RESET_TOKEN_EXPIRED,
                message="Şifre sıfırlama bağlantısının süresi dolmuş",
                details={"expires_at": reset_token.expires_at.isoformat()}
            )
        )
    
    # Check if token already used
    if reset_token.is_used():
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.AUTH_PASSWORD_RESET_TOKEN_USED),
            detail=error_response(
                code=ErrorCode.AUTH_PASSWORD_RESET_TOKEN_USED,
                message="Bu bağlantı zaten kullanılmış",
            )
        )
    
    # Get user
    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.AUTH_USER_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.AUTH_USER_NOT_FOUND,
                message="Kullanıcı bulunamadı",
            )
        )
    
    # Update password
    user.hashed_password = hash_password(reset_data.new_password)
    
    # Mark token as used
    reset_token.used_at = datetime.now(timezone.utc)
    
    db.commit()
    
    # Send confirmation email
    send_password_changed_notification(
        email=user.email,
        user_name=user.full_name or ""
    )
    
    return success_response(
        data={"message": "Password updated successfully"},
        message="Şifre başarıyla güncellendi"
    )

# TODO(RATE_LIMITS.md):
# - Politika tablosu: endpoint, limit, rationale
# - Kimlikli vs kimliksiz anahtar stratejisi (main.py auth_aware_key_func)
# - Öneri: Kritik yazma operasyonlarına ek daha düşük limitler (örn. /auth/users, /api/work-order oluşturma)

