from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import UserProfileUpdate
from app.schemas.user import UserCreate, UserUpdate


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email.lower().strip()).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username.lower().strip()).first()


def get_user_by_identifier(db: Session, identifier: str) -> Optional[User]:
    clean_id = identifier.lower().strip()
    return db.query(User).filter(
        or_(User.email == clean_id, User.username == clean_id)
    ).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()


def authenticate_user(db: Session, identifier: str, password: str) -> Optional[User]:
    user = get_user_by_identifier(db, identifier)
    if not user:
        return None
    if not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_user(db: Session, user_in: UserCreate) -> User:
    normalized_email = user_in.email.lower().strip()
    normalized_username = user_in.username.lower().strip()

    existing_username = get_user_by_username(db, normalized_username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The username '{normalized_username}' is already taken. Please choose another.",
        )

    existing_email = get_user_by_email(db, normalized_email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    hashed_password = get_password_hash(user_in.password)

    db_user = User(
        name=user_in.name.strip(),
        username=normalized_username,
        email=normalized_email,
        hashed_password=hashed_password,
        is_active=True,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user_in: UserUpdate) -> User:
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found.",
        )

    if user_in.username is not None:
        normalized_username = user_in.username.lower().strip()
        if normalized_username != user.username:
            existing_user = get_user_by_username(db, normalized_username)
            if existing_user and existing_user.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"The username '{normalized_username}' is already taken.",
                )
            user.username = normalized_username

    if user_in.email is not None:
        normalized_email = user_in.email.lower().strip()
        if normalized_email != user.email:
            existing = get_user_by_email(db, normalized_email)
            if existing and existing.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This email address is already in use by another account.",
                )
            user.email = normalized_email

    if user_in.name is not None:
        user.name = user_in.name.strip()

    if user_in.password is not None:
        user.hashed_password = get_password_hash(user_in.password)

    db.commit()
    db.refresh(user)
    return user


def update_user_profile(db: Session, user_id: int, profile_in: UserProfileUpdate) -> User:
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found.",
        )

    if profile_in.username is not None:
        normalized_username = profile_in.username.lower().strip()
        if normalized_username != user.username:
            existing_username = get_user_by_username(db, normalized_username)
            if existing_username and existing_username.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"The username '{normalized_username}' is already taken.",
                )
            user.username = normalized_username

    if profile_in.email is not None:
        normalized_email = profile_in.email.lower().strip()
        if normalized_email != user.email:
            existing = get_user_by_email(db, normalized_email)
            if existing and existing.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This email address is already in use by another account.",
                )
            user.email = normalized_email

    if profile_in.name is not None:
        user.name = profile_in.name.strip()

    if profile_in.new_password is not None:
        if not profile_in.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required to set a new password.",
            )
        if not verify_password(profile_in.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect.",
            )
        user.hashed_password = get_password_hash(profile_in.new_password)

    db.commit()
    db.refresh(user)
    return user


def delete_user_permanently(db: Session, user_id: int) -> bool:
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found.",
        )

    db.delete(user)
    db.commit()
    return True
