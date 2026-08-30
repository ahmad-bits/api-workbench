from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user
from app.core.config import settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    Token,
    UserProfileUpdate,
    OtpInitiateResponse,
    OtpVerifyRequest,
    OtpResendRequest,
    OtpResendResponse,
)
from app.schemas.user import UserCreate, UserDeleteResponse, UserResponse
from app.services import user_service, otp_service


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
    "/register/request-otp",
    response_model=OtpInitiateResponse,
    status_code=status.HTTP_200_OK,
    summary="Request Email OTP for Registration",
    description="Validate credentials, generate a secure 6-digit OTP, and dispatch verification email. Account is NOT created until verified.",
)
def request_registration_otp(
    user_in: UserCreate,
    db: Session = Depends(get_db),
) -> Any:
    """Validate credentials, reserve username/email, and send OTP verification code."""
    result = otp_service.initiate_registration(db=db, user_in=user_in)
    return OtpInitiateResponse(**result)


@router.post(
    "/register/verify-otp",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Verify Email OTP & Create Account",
    description="Validate the 6-digit OTP received via email, permanently create the user account in SQLite, and return a signed JWT token.",
)
def verify_registration_otp(
    verify_data: OtpVerifyRequest,
    db: Session = Depends(get_db),
) -> Any:
    """Verify 6-digit OTP and create user account."""
    user = otp_service.verify_otp_and_create_user(
        db=db,
        email=verify_data.email,
        otp=verify_data.otp,
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
    "/register/resend-otp",
    response_model=OtpResendResponse,
    status_code=status.HTTP_200_OK,
    summary="Resend Registration Email OTP",
    description="Request a new 6-digit OTP verification code with rate-limiting cooldown protection.",
)
def resend_registration_otp(
    resend_data: OtpResendRequest,
    db: Session = Depends(get_db),
) -> Any:
    """Resend a new 6-digit OTP code to the specified email."""
    result = otp_service.resend_registration_otp(db=db, email=resend_data.email)
    return OtpResendResponse(**result)


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="User Registration (Direct)",
    description="Register a new user account directly (supported for automated API integration).",
)
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db),
) -> Any:
    """Create user directly and return JWT access token."""
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
