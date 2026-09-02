from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.mock import (
    MockEndpointCreate,
    MockEndpointUpdate,
    MockEndpointResponse,
)
from app.services.mock_service import mock_service

router = APIRouter()


@router.get(
    "",
    response_model=List[MockEndpointResponse],
    status_code=status.HTTP_200_OK,
    summary="List User Mock Endpoints",
    description="Returns a list of all mock endpoints created and owned by the authenticated user.",
)
def list_mock_endpoints(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> List[MockEndpointResponse]:
    return mock_service.list_user_mocks(db=db, user=current_user)


@router.post(
    "",
    response_model=MockEndpointResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Mock Endpoint",
    description="Registers a new mock endpoint belonging strictly to the authenticated user.",
)
def create_mock_endpoint(
    payload: MockEndpointCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> MockEndpointResponse:
    return mock_service.create_user_mock(db=db, user=current_user, data=payload)


@router.get(
    "/{mock_id}",
    response_model=MockEndpointResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Mock Endpoint Details",
    description="Retrieves a specific mock endpoint configuration owned by the authenticated user.",
)
def get_mock_endpoint(
    mock_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> MockEndpointResponse:
    mock = mock_service.get_user_mock(db=db, user=current_user, mock_id=mock_id)
    if not mock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mock endpoint with ID '{mock_id}' not found in your account.",
        )
    return mock


@router.put(
    "/{mock_id}",
    response_model=MockEndpointResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Mock Endpoint",
    description="Updates an existing mock endpoint configuration owned by the authenticated user.",
)
def update_mock_endpoint(
    mock_id: str,
    payload: MockEndpointUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> MockEndpointResponse:
    updated = mock_service.update_user_mock(
        db=db, user=current_user, mock_id=mock_id, data=payload
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mock endpoint with ID '{mock_id}' not found in your account.",
        )
    return updated


@router.delete(
    "/{mock_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Mock Endpoint",
    description="Permanently removes a mock endpoint owned by the authenticated user.",
)
def delete_mock_endpoint(
    mock_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    deleted = mock_service.delete_user_mock(db=db, user=current_user, mock_id=mock_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mock endpoint with ID '{mock_id}' not found in your account.",
        )
    return {"success": True, "message": f"Mock endpoint '{mock_id}' was deleted."}
