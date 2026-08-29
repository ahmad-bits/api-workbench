from typing import List
from fastapi import APIRouter, HTTPException, status
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
    summary="List all Mock Endpoints",
    description="Returns a list of all configured mock endpoints sorted by creation date.",
)
async def list_mock_endpoints() -> List[MockEndpointResponse]:
    return await mock_service.list_mocks()


@router.post(
    "",
    response_model=MockEndpointResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Mock Endpoint",
    description="Registers a new mock endpoint with custom HTTP method, path, response code, headers, and body.",
)
async def create_mock_endpoint(payload: MockEndpointCreate) -> MockEndpointResponse:
    return await mock_service.create_mock(payload)


@router.get(
    "/{mock_id}",
    response_model=MockEndpointResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Mock Endpoint Details",
    description="Retrieves a specific mock endpoint configuration by ID.",
)
async def get_mock_endpoint(mock_id: str) -> MockEndpointResponse:
    mock = await mock_service.get_mock(mock_id)
    if not mock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mock endpoint with ID '{mock_id}' not found.",
        )
    return mock


@router.put(
    "/{mock_id}",
    response_model=MockEndpointResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Mock Endpoint",
    description="Updates an existing mock endpoint configuration.",
)
async def update_mock_endpoint(
    mock_id: str, payload: MockEndpointUpdate
) -> MockEndpointResponse:
    updated = await mock_service.update_mock(mock_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mock endpoint with ID '{mock_id}' not found.",
        )
    return updated


@router.delete(
    "/{mock_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Mock Endpoint",
    description="Removes a mock endpoint from the mock server.",
)
async def delete_mock_endpoint(mock_id: str):
    deleted = await mock_service.delete_mock(mock_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mock endpoint with ID '{mock_id}' not found.",
        )
    return {"success": True, "message": f"Mock endpoint '{mock_id}' was deleted."}
