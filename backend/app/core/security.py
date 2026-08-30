from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import hashlib
import hmac
import secrets
import bcrypt
import jwt
from app.core.config import settings


def get_password_hash(password: str) -> str:
    """Hash a plaintext password securely using bcrypt."""
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored bcrypt hash."""
    try:
        plain_bytes = plain_password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(
    subject: Union[str, Any],
    extra_claims: Optional[Dict[str, Any]] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Generate a cryptographically signed JWT access token.
    - subject: Identifies the subject (e.g. user_id as string or email)
    - extra_claims: Optional dictionary with custom claims (e.g. email, name)
    - expires_delta: Optional custom expiry duration
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }

    if extra_claims:
        to_encode.update(extra_claims)

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT access token.
    Raises jwt.PyJWTError (e.g. ExpiredSignatureError, InvalidTokenError) if invalid.
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )


def generate_otp(digits: int = 6) -> str:
    """Generate a cryptographically secure random numeric OTP (e.g., 6 digits)."""
    upper_bound = 10 ** digits
    num = secrets.randbelow(upper_bound)
    return f"{num:0{digits}d}"


def hash_otp(otp: str, email: str = "") -> str:
    """
    Hash a numeric OTP using HMAC-SHA256 with secret key and email salt
    so it is never stored as plaintext in the database.
    """
    key = settings.JWT_SECRET_KEY.encode("utf-8")
    msg = f"{email.lower().strip()}:{otp.strip()}".encode("utf-8")
    return hmac.new(key, msg, hashlib.sha256).hexdigest()


def verify_otp(plain_otp: str, hashed_otp: str, email: str = "") -> bool:
    """
    Constant-time comparison of plain OTP against stored HMAC-SHA256 hash.
    """
    try:
        calculated_hash = hash_otp(plain_otp, email=email)
        return hmac.compare_digest(calculated_hash, hashed_otp)
    except Exception:
        return False


