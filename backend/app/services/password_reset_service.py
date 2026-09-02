import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import generate_otp, hash_otp, verify_otp, get_password_hash
from app.models.password_reset import PasswordResetOtp
from app.models.user import User
from app.services.email_service import send_otp_email
from app.services.user_service import get_user_by_identifier

logger = logging.getLogger(__name__)


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_naive_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def get_password_reset_otp_by_email(db: Session, email: str) -> PasswordResetOtp | None:
    return db.query(PasswordResetOtp).filter(
        PasswordResetOtp.email == email.lower().strip()
    ).first()


def request_password_reset_otp(db: Session, identifier: str) -> Dict[str, Any]:
    user = get_user_by_identifier(db, identifier)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with that email or username.",
        )
    
    normalized_email = user.email.lower().strip()
    existing_request = get_password_reset_otp_by_email(db, normalized_email)
    
    now = utc_now()
    if existing_request:
        resend_time = to_naive_utc(existing_request.resend_available_at)
        if resend_time and resend_time > now:
            remaining_seconds = int((resend_time - now).total_seconds())
            if remaining_seconds > 0:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"A verification code was recently sent. Please wait {remaining_seconds} seconds before requesting a new code.",
                )

    otp = generate_otp(6)
    otp_hash_val = hash_otp(otp, email=normalized_email)

    expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    resend_available_at = now + timedelta(seconds=settings.OTP_RESEND_COOLDOWN_SECONDS)

    if existing_request:
        existing_request.otp_hash = otp_hash_val
        existing_request.reset_token_hash = None
        existing_request.is_verified = False
        existing_request.attempts_left = settings.OTP_MAX_ATTEMPTS
        existing_request.expires_at = expires_at
        existing_request.resend_available_at = resend_available_at
        existing_request.updated_at = now
    else:
        pending_record = PasswordResetOtp(
            email=normalized_email,
            otp_hash=otp_hash_val,
            attempts_left=settings.OTP_MAX_ATTEMPTS,
            expires_at=expires_at,
            resend_available_at=resend_available_at,
        )
        db.add(pending_record)

    db.commit()

    send_otp_email(
        to_email=normalized_email,
        to_name=user.name,
        otp=otp,
    )

    return {
        "message": f"A 6-digit verification code has been sent to your email.",
        "email": normalized_email,
        "resend_cooldown_seconds": settings.OTP_RESEND_COOLDOWN_SECONDS,
        "expires_in_minutes": settings.OTP_EXPIRE_MINUTES,
    }


def verify_password_reset_otp(db: Session, email: str, otp: str) -> str:
    normalized_email = email.lower().strip()
    clean_otp = str(otp).strip()

    if not clean_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter the 6-digit verification code.",
        )

    pending = get_password_reset_otp_by_email(db, normalized_email)
    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No password reset request found. Please initiate the request again.",
        )

    now = utc_now()

    expiry_time = to_naive_utc(pending.expires_at)
    if expiry_time and expiry_time < now:
        db.delete(pending)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new verification code.",
        )

    if pending.attempts_left <= 0:
        db.delete(pending)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded. Please request a new verification code.",
        )

    is_valid = verify_otp(plain_otp=clean_otp, hashed_otp=pending.otp_hash, email=normalized_email)
    if not is_valid:
        pending.attempts_left -= 1
        db.commit()
        if pending.attempts_left <= 0:
            db.delete(pending)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect verification code. No attempts remaining. Please request a new code.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incorrect verification code. {pending.attempts_left} attempt(s) remaining.",
        )

    reset_token = secrets.token_urlsafe(32)
    pending.reset_token_hash = hash_otp(reset_token, email=normalized_email)
    pending.is_verified = True
    db.commit()

    return reset_token


def reset_password(db: Session, email: str, reset_token: str, new_password: str) -> None:
    normalized_email = email.lower().strip()
    
    pending = get_password_reset_otp_by_email(db, normalized_email)
    if not pending or not pending.is_verified or not pending.reset_token_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token. Please verify your OTP again.",
        )
        
    now = utc_now()
    expiry_time = to_naive_utc(pending.expires_at)
    if expiry_time and expiry_time < now:
        db.delete(pending)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset session has expired. Please start over.",
        )
        
    is_valid_token = verify_otp(plain_otp=reset_token, hashed_otp=pending.reset_token_hash, email=normalized_email)
    if not is_valid_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token.",
        )

    user = get_user_by_identifier(db, normalized_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
        
    user.hashed_password = get_password_hash(new_password)
    db.delete(pending)
    db.commit()


def resend_password_reset_otp(db: Session, email: str) -> Dict[str, Any]:
    normalized_email = email.lower().strip()
    pending = get_password_reset_otp_by_email(db, normalized_email)

    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No password reset request found. Please initiate the request again.",
        )

    now = utc_now()

    resend_time = to_naive_utc(pending.resend_available_at)
    if resend_time and resend_time > now:
        remaining_seconds = int((resend_time - now).total_seconds())
        if remaining_seconds > 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining_seconds} seconds before requesting a new code.",
            )

    new_otp = generate_otp(6)
    pending.otp_hash = hash_otp(new_otp, email=normalized_email)
    pending.reset_token_hash = None
    pending.is_verified = False
    pending.attempts_left = settings.OTP_MAX_ATTEMPTS
    pending.expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    pending.resend_available_at = now + timedelta(seconds=settings.OTP_RESEND_COOLDOWN_SECONDS)
    pending.updated_at = now

    db.commit()
    
    user = get_user_by_identifier(db, normalized_email)

    send_otp_email(
        to_email=normalized_email,
        to_name=user.name if user else "Developer",
        otp=new_otp,
    )

    return {
        "message": f"A new verification code has been sent to your email.",
        "email": normalized_email,
        "resend_cooldown_seconds": settings.OTP_RESEND_COOLDOWN_SECONDS,
        "expires_in_minutes": settings.OTP_EXPIRE_MINUTES,
    }
