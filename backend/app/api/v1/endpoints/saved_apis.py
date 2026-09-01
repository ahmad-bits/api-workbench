from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.saved_api import (
    SavedApiCreate,
    SavedApiUpdate,
    SavedApiResponse,
    SavedApiOpenResponse,
)
from app.services.saved_api_service import saved_api_service

router = APIRouter()


@router.get(
    "",
    response_model=List[SavedApiResponse],
    status_code=status.HTTP_200_OK,
    summary="List User Saved APIs",
    description="Returns all saved API configurations owned strictly by the authenticated user with masked API keys.",
)
def list_saved_apis(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> List[SavedApiResponse]:
    """Retrieve all saved APIs owned by current user."""
    return saved_api_service.list_user_saved_apis(db=db, user=current_user)


@router.post(
    "",
    response_model=SavedApiResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save New API",
    description="Saves a new API configuration. If provided, the API key is encrypted securely at rest.",
)
def create_saved_api(
    payload: SavedApiCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> SavedApiResponse:
    """Save a new API configuration for current user."""
    return saved_api_service.create_saved_api(
        db=db, user=current_user, api_in=payload
    )


@router.get(
    "/{api_id}",
    response_model=SavedApiResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Saved API Details",
    description="Retrieves a specific saved API configuration with masked key.",
)
def get_saved_api(
    api_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> SavedApiResponse:
    """Get single saved API metadata by ID."""
    return saved_api_service.get_saved_api(
        db=db, user=current_user, api_id=api_id
    )


@router.get(
    "/{api_id}/open",
    response_model=SavedApiOpenResponse,
    status_code=status.HTTP_200_OK,
    summary="Open Saved API in Workbench",
    description="Retrieves the saved API URL along with the decrypted plain API key to load directly into the API testing workbench.",
)
def open_saved_api_for_workbench(
    api_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> SavedApiOpenResponse:
    """Retrieve saved API with decrypted key for workbench testing."""
    return saved_api_service.get_saved_api_for_open(
        db=db, user=current_user, api_id=api_id
    )


@router.put(
    "/{api_id}",
    response_model=SavedApiResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Saved API",
    description="Updates an existing saved API configuration.",
)
def update_saved_api(
    api_id: str,
    payload: SavedApiUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> SavedApiResponse:
    """Update saved API owned by current user."""
    return saved_api_service.update_saved_api(
        db=db, user=current_user, api_id=api_id, api_in=payload
    )


@router.delete(
    "/workspace/{workspace_name}",
    status_code=status.HTTP_200_OK,
    summary="Delete Workspace Saved APIs",
    description="Permanently deletes all saved APIs belonging to a specific workspace/category owned by the authenticated user.",
)
def delete_saved_apis_by_workspace(
    workspace_name: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Delete all saved APIs in a workspace category owned by current user."""
    deleted_count = saved_api_service.delete_saved_apis_by_workspace(
        db=db, user=current_user, workspace_name=workspace_name
    )
    return {
        "success": True,
        "message": f"Deleted {deleted_count} saved API endpoint(s) from workspace '{workspace_name}'.",
        "deleted_count": deleted_count,
        "workspace": workspace_name,
    }


@router.delete(
    "/{api_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Saved API",
    description="Permanently deletes a saved API owned by the authenticated user.",
)
def delete_saved_api(
    api_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Delete a saved API owned by current user."""
    saved_api_service.delete_saved_api(
        db=db, user=current_user, api_id=api_id
    )
    return {
        "success": True,
        "message": f"Saved API '{api_id}' was successfully deleted.",
        "id": api_id,
    }
