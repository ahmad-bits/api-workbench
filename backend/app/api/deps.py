from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import TokenPayload
from app.services import user_service

# OAuth2 scheme for Swagger UI and automatic token parsing
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency to extract and validate the JWT Bearer token from the Authorization header.
    Returns the authenticated User database model or raises HTTP 401 Unauthorized.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or missing token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    try:
        payload = decode_access_token(token)
        user_id_str: Optional[str] = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
        token_data = TokenPayload(
            sub=user_id_str,
            exp=payload.get("exp"),
            email=payload.get("email"),
            name=payload.get("name"),
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception

    user = user_service.get_user_by_id(db, user_id=user_id)
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account.",
        )
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Validate that the current user is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account.",
        )
    return current_user
