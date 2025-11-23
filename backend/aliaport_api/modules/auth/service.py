# backend/aliaport_api/modules/auth/service.py
"""
Business logic for authentication operations.
"""
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from .models import User, Role
from .schemas import UserCreate, UserUpdate
from .utils import hash_password, verify_password, create_access_token, create_refresh_token


class AuthService:
    """Authentication service for user management and token operations."""

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """
        Authenticate user by email and password.
        
        Args:
            db: Database session
            email: User email
            password: Plaintext password
        
        Returns:
            User object if credentials are valid, None otherwise
        """
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    def create_user(db: Session, user_create: UserCreate) -> User:
        """
        Create a new user with hashed password and assigned roles.
        
        Args:
            db: Database session
            user_create: User creation payload
        
        Returns:
            Created User object
        
        Raises:
            HTTPException 400: Email already exists
        """
        # Check if email exists
        existing_user = db.query(User).filter(User.email == user_create.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        
        # Hash password
        hashed_password = hash_password(user_create.password)
        
        # Create user
        db_user = User(
            email=user_create.email,
            hashed_password=hashed_password,
            full_name=user_create.full_name,
            is_active=user_create.is_active,
        )
        
        # Assign roles
        if user_create.role_ids:
            roles = db.query(Role).filter(Role.id.in_(user_create.role_ids)).all()
            db_user.roles = roles
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user

    @staticmethod
    def update_user(db: Session, user_id: int, user_update: UserUpdate) -> User:
        """
        Update user information.
        
        Args:
            db: Database session
            user_id: User ID
            user_update: User update payload
        
        Returns:
            Updated User object
        
        Raises:
            HTTPException 404: User not found
            HTTPException 400: Email already exists
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        # Update fields
        update_data = user_update.model_dump(exclude_unset=True)
        
        # Check email uniqueness if email is being updated
        if "email" in update_data and update_data["email"] != user.email:
            existing = db.query(User).filter(User.email == update_data["email"]).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered",
                )
        
        # Hash new password if provided
        if "password" in update_data:
            update_data["hashed_password"] = hash_password(update_data.pop("password"))
        
        # Update role assignments
        if "role_ids" in update_data:
            role_ids = update_data.pop("role_ids")
            roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
            user.roles = roles
        
        # Apply updates
        for key, value in update_data.items():
            setattr(user, key, value)
        
        db.commit()
        db.refresh(user)
        
        return user

    @staticmethod
    def update_last_login(db: Session, user_id: int) -> None:
        """Update user's last_login timestamp."""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.last_login = datetime.utcnow()
            db.commit()

    @staticmethod
    def generate_tokens(user: User) -> dict:
        """
        Generate access and refresh tokens for user.
        
        Args:
            user: User object
        
        Returns:
            Dict with access_token, refresh_token, token_type, expires_in
        """
        # Prepare token payload
        token_data = {
            "user_id": user.id,
            "email": user.email,
            "roles": [role.name for role in user.roles],
        }
        
        # Generate tokens
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token({"user_id": user.id, "email": user.email})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 900,  # 15 minutes in seconds
        }

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def list_users(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        is_active: Optional[bool] = None,
    ) -> List[User]:
        """
        List users with optional filtering.
        
        Args:
            db: Database session
            skip: Pagination offset
            limit: Maximum results
            is_active: Filter by active status
        
        Returns:
            List of User objects
        """
        query = db.query(User)
        
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        
        return query.offset(skip).limit(limit).all()
