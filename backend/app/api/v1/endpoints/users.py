from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import (
    UserCreate,
    UserDeleteResponse,
    UserResponse,
    UserUpdate,
)
from app.services import user_service

router = APIRouter()


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    description="Create a new user account with name, email, and password. Passwords are automatically securely hashed.",
)
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account (alias)",
    description="Create a new user account with name, email, and password.",
    include_in_schema=True,
)
def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
) -> UserResponse:
    return user_service.create_user(db=db, user_in=user_in)


@router.get(
    "",
    response_model=List[UserResponse],
    summary="List all user accounts",
    description="Retrieve a paginated list of user accounts.",
)
def list_users(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of records to return"),
    db: Session = Depends(get_db),
) -> List[UserResponse]:
    return user_service.get_users(db=db, skip=skip, limit=limit)


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user account details",
    description="Retrieve account details for a specific user by their ID.",
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
) -> UserResponse:
    user = user_service.get_user_by_id(db=db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found.",
        )
    return user


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update user account details",
    description="Update user name, email, or password. New passwords are automatically hashed.",
)
@router.patch(
    "/{user_id}",
    response_model=UserResponse,
    summary="Partially update user account details",
    description="Update specific fields of a user's account.",
    include_in_schema=False,
)
def update_user_account(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
) -> UserResponse:
    return user_service.update_user(db=db, user_id=user_id, user_in=user_in)


@router.delete(
    "/{user_id}",
    response_model=UserDeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Permanently delete user account",
    description="Permanently delete a user account and associated data from the system.",
)
def delete_user_account(
    user_id: int,
    db: Session = Depends(get_db),
) -> UserDeleteResponse:
    user_service.delete_user_permanently(db=db, user_id=user_id)
    return UserDeleteResponse(
        message="User account and associated data permanently deleted.",
        user_id=user_id,
    )
