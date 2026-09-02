import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import generate_otp, hash_otp, verify_otp, get_password_hash
from app.models.pending_registration import PendingRegistration
from app.models.user import User
from app.schemas.user import UserCreate, USERNAME_REGEX
from app.services.email_service import validate_and_normalize_email, send_otp_email

logger = logging.getLogger(__name__)


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_naive_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def get_pending_registration_by_email(db: Session, email: str) -> PendingRegistration | None:
    return db.query(PendingRegistration).filter(
        PendingRegistration.email == email.lower().strip()
    ).first()


def get_pending_registration_by_username(db: Session, username: str) -> PendingRegistration | None:
    return db.query(PendingRegistration).filter(
        PendingRegistration.username == username.lower().strip()
    ).first()


def initiate_registration(db: Session, user_in: UserCreate) -> Dict[str, Any]:
    normalized_email = validate_and_normalize_email(user_in.email)

    normalized_username = user_in.username.lower().strip()
    if not USERNAME_REGEX.match(normalized_username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be between 3 and 30 characters and contain only letters, numbers, hyphens (-), and underscores (_).",
        )

    existing_user_email = db.query(User).filter(User.email == normalized_email).first()
    if existing_user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    existing_user_name = db.query(User).filter(User.username == normalized_username).first()
    if existing_user_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The username '{normalized_username}' is already taken. Please choose another.",
        )

    pending_by_user = get_pending_registration_by_username(db, normalized_username)
    if pending_by_user and pending_by_user.email != normalized_email:
        if to_naive_utc(pending_by_user.expires_at) > utc_now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The username '{normalized_username}' is currently reserved. Please choose another or try again later.",
            )
        else:
            db.delete(pending_by_user)
            db.commit()

    existing_pending = get_pending_registration_by_email(db, normalized_email)
    now = utc_now()
    if existing_pending:
        resend_time = to_naive_utc(existing_pending.resend_available_at)
        if resend_time and resend_time > now:
            remaining_seconds = int((resend_time - now).total_seconds())
            if remaining_seconds > 0:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"A verification code was recently sent. Please wait {remaining_seconds} seconds before requesting a new code.",
                )

    otp = generate_otp(6)
    otp_hash_val = hash_otp(otp, email=normalized_email)
    hashed_pwd = get_password_hash(user_in.password)

    expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    resend_available_at = now + timedelta(seconds=settings.OTP_RESEND_COOLDOWN_SECONDS)

    if existing_pending:
        existing_pending.name = user_in.name.strip()
        existing_pending.username = normalized_username
        existing_pending.hashed_password = hashed_pwd
        existing_pending.otp_hash = otp_hash_val
        existing_pending.attempts_left = settings.OTP_MAX_ATTEMPTS
        existing_pending.expires_at = expires_at
        existing_pending.resend_available_at = resend_available_at
        existing_pending.updated_at = now
    else:
        pending_record = PendingRegistration(
            name=user_in.name.strip(),
            username=normalized_username,
            email=normalized_email,
            hashed_password=hashed_pwd,
            otp_hash=otp_hash_val,
            attempts_left=settings.OTP_MAX_ATTEMPTS,
            expires_at=expires_at,
            resend_available_at=resend_available_at,
        )
        db.add(pending_record)

    db.commit()

    send_otp_email(
        to_email=normalized_email,
        to_name=user_in.name.strip(),
        otp=otp,
    )

    return {
        "message": f"A 6-digit verification code has been sent to {normalized_email}.",
        "email": normalized_email,
        "resend_cooldown_seconds": settings.OTP_RESEND_COOLDOWN_SECONDS,
        "expires_in_minutes": settings.OTP_EXPIRE_MINUTES,
    }


def verify_otp_and_create_user(db: Session, email: str, otp: str) -> User:
    normalized_email = email.lower().strip()
    clean_otp = str(otp).strip()

    if not clean_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter the 6-digit verification code.",
        )

    pending = get_pending_registration_by_email(db, normalized_email)
    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending registration found for this email address. Please start registration again.",
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

    if db.query(User).filter(User.email == pending.email).first():
        db.delete(pending)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    if db.query(User).filter(User.username == pending.username).first():
        db.delete(pending)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The username '{pending.username}' is already taken.",
        )

    new_user = User(
        name=pending.name,
        username=pending.username,
        email=pending.email,
        hashed_password=pending.hashed_password,
        is_active=True,
    )
    db.add(new_user)
    db.delete(pending)
    db.commit()
    db.refresh(new_user)

    logger.info(f"Successfully verified email and created user account: {new_user.username} ({new_user.email})")
    return new_user


def resend_registration_otp(db: Session, email: str) -> Dict[str, Any]:
    normalized_email = email.lower().strip()
    pending = get_pending_registration_by_email(db, normalized_email)

    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending registration found for this email address. Please initiate registration first.",
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
    pending.attempts_left = settings.OTP_MAX_ATTEMPTS
    pending.expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    pending.resend_available_at = now + timedelta(seconds=settings.OTP_RESEND_COOLDOWN_SECONDS)
    pending.updated_at = now

    db.commit()

    send_otp_email(
        to_email=normalized_email,
        to_name=pending.name,
        otp=new_otp,
    )

    return {
        "message": f"A new verification code has been sent to {normalized_email}.",
        "email": normalized_email,
        "resend_cooldown_seconds": settings.OTP_RESEND_COOLDOWN_SECONDS,
        "expires_in_minutes": settings.OTP_EXPIRE_MINUTES,
    }
