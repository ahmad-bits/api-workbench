from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user
from app.core.config import settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, Token, UserProfileUpdate
from app.schemas.user import UserCreate, UserDeleteResponse, UserResponse
from app.services import user_service

router = APIRouter()


@router.post(
    "/login",
    response_model=Token,
    summary="User Login",
    description="Authenticate with email/username and password to receive a cryptographically signed JWT Bearer access token.",
)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
) -> Any:
    """Validate credentials (email or username) and return JWT access token."""
    identifier = login_data.username_or_email or login_data.email or login_data.username or ""
    user = user_service.authenticate_user(
        db=db,
        identifier=identifier,
        password=login_data.password,
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        subject=str(user.id),
        extra_claims={
            "email": user.email,
            "username": user.username,
            "name": user.name,
        },
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="User Registration",
    description="Register a new user account with unique username and email, receiving an access token immediately.",
)
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db),
) -> Any:
    """Create user and return JWT access token."""
    user = user_service.create_user(db=db, user_in=user_in)

    access_token = create_access_token(
        subject=str(user.id),
        extra_claims={
            "email": user.email,
            "username": user.username,
            "name": user.name,
        },
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Retrieve the profile details of the currently authenticated user.",
)
def read_current_user_profile(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Return the profile of the current authenticated user."""
    return current_user


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update current user profile & password",
    description="Update current user name, username, email, or change password with current password verification.",
)
def update_current_user_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Update profile and/or change password for the current user."""
    return user_service.update_user_profile(
        db=db,
        user_id=current_user.id,
        profile_in=profile_in,
    )


@router.delete(
    "/me",
    response_model=UserDeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Permanently delete current account",
    description="Permanently delete the authenticated user's account and associated data including all Mock APIs.",
)
def delete_current_user_account(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Permanently delete the authenticated user."""
    user_id = current_user.id
    user_service.delete_user_permanently(db=db, user_id=user_id)
    return UserDeleteResponse(
        message="Your user account and all associated Mock APIs have been permanently deleted.",
        user_id=user_id,
    )
