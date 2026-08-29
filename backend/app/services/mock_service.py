import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any
from app.schemas.mock import (
    MockEndpointCreate,
    MockEndpointUpdate,
    MockEndpointResponse,
)


class MockService:
    """In-memory Mock API Server service managing mock endpoints and handling requests."""

    def __init__(self):
        self._mocks: Dict[str, MockEndpointResponse] = {}
        self._lock = asyncio.Lock()
        self._seed_default_mocks()

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _build_urls(self, mock_id: str, path: str) -> Tuple[str, str]:
        clean_path = path if path.startswith("/") else f"/{path}"
        mock_url = f"/mock/{mock_id}{clean_path}"
        full_url = f"http://127.0.0.1:8000{mock_url}"
        return mock_url, full_url

    def _seed_default_mocks(self):
        """Seed initial practical mock endpoints for developer preview."""
        # 1. Users List GET Mock
        users_id = "users_demo"
        u_mock_url, u_full_url = self._build_urls(users_id, "/users")
        self._mocks[users_id] = MockEndpointResponse(
            id=users_id,
            name="Get Users List",
            method="GET",
            path="/users",
            status_code=200,
            response_headers={
                "Content-Type": "application/json",
                "X-Mock-Engine": "API-Workbench-v1",
            },
            response_body=json.dumps(
                [
                    {"id": 1, "name": "Ahmad", "role": "Full-Stack Engineer", "status": "active"},
                    {"id": 2, "name": "Ali", "role": "Frontend Specialist", "status": "active"},
                    {"id": 3, "name": "Sarah", "role": "DevOps Engineer", "status": "away"},
                ],
                indent=2,
            ),
            response_type="json",
            description="Returns sample team users dataset with roles and statuses",
            mock_url=u_mock_url,
            full_url=u_full_url,
            created_at=self._now_iso(),
            updated_at=self._now_iso(),
            call_count=0,
        )

        # 2. Auth Login POST Mock
        auth_id = "auth_demo"
        a_mock_url, a_full_url = self._build_urls(auth_id, "/auth/login")
        self._mocks[auth_id] = MockEndpointResponse(
            id=auth_id,
            name="Authenticate User",
            method="POST",
            path="/auth/login",
            status_code=200,
            response_headers={
                "Content-Type": "application/json",
                "X-Mock-Engine": "API-Workbench-v1",
            },
            response_body=json.dumps(
                {
                    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_token_workbench",
                    "user": {
                        "id": 1,
                        "email": "developer@workbench.local",
                        "name": "Ahmad",
                    },
                    "expires_in": 3600,
                },
                indent=2,
            ),
            response_type="json",
            description="Mock authentication session response returning JWT token",
            mock_url=a_mock_url,
            full_url=a_full_url,
            created_at=self._now_iso(),
            updated_at=self._now_iso(),
            call_count=0,
        )

    async def list_mocks(self) -> List[MockEndpointResponse]:
        """Return all mock endpoints sorted with newest first."""
        async with self._lock:
            # Sort by created_at desc
            return sorted(
                list(self._mocks.values()),
                key=lambda m: m.created_at,
                reverse=True,
            )

    async def get_mock(self, mock_id: str) -> Optional[MockEndpointResponse]:
        """Get single mock endpoint by ID."""
        async with self._lock:
            return self._mocks.get(mock_id)

    async def create_mock(self, data: MockEndpointCreate) -> MockEndpointResponse:
        """Create a new mock endpoint."""
        async with self._lock:
            mock_id = uuid.uuid4().hex[:8]
            # Ensure unique id
            while mock_id in self._mocks:
                mock_id = uuid.uuid4().hex[:8]

            name = data.name.strip() if data.name and data.name.strip() else f"{data.method} {data.path}"
            mock_url, full_url = self._build_urls(mock_id, data.path)
            now = self._now_iso()

            mock_endpoint = MockEndpointResponse(
                id=mock_id,
                name=name,
                method=data.method,
                path=data.path,
                status_code=data.status_code,
                response_headers=data.response_headers or {"Content-Type": "application/json"},
                response_body=data.response_body,
                response_type=data.response_type or "json",
                description=data.description,
                mock_url=mock_url,
                full_url=full_url,
                created_at=now,
                updated_at=now,
                call_count=0,
            )

            self._mocks[mock_id] = mock_endpoint
            return mock_endpoint

    async def update_mock(self, mock_id: str, data: MockEndpointUpdate) -> Optional[MockEndpointResponse]:
        """Update an existing mock endpoint."""
        async with self._lock:
            existing = self._mocks.get(mock_id)
            if not existing:
                return None

            new_method = data.method if data.method is not None else existing.method
            new_path = data.path if data.path is not None else existing.path
            new_name = data.name if data.name is not None else existing.name
            new_status_code = data.status_code if data.status_code is not None else existing.status_code
            new_headers = data.response_headers if data.response_headers is not None else existing.response_headers
            new_body = data.response_body if data.response_body is not None else existing.response_body
            new_type = data.response_type if data.response_type is not None else existing.response_type
            new_desc = data.description if data.description is not None else existing.description

            mock_url, full_url = self._build_urls(mock_id, new_path)

            updated = MockEndpointResponse(
                id=mock_id,
                name=new_name,
                method=new_method,
                path=new_path,
                status_code=new_status_code,
                response_headers=new_headers,
                response_body=new_body,
                response_type=new_type,
                description=new_desc,
                mock_url=mock_url,
                full_url=full_url,
                created_at=existing.created_at,
                updated_at=self._now_iso(),
                call_count=existing.call_count,
            )

            self._mocks[mock_id] = updated
            return updated

    async def delete_mock(self, mock_id: str) -> bool:
        """Delete a mock endpoint."""
        async with self._lock:
            if mock_id in self._mocks:
                del self._mocks[mock_id]
                return True
            return False

    async def match_and_serve(
        self, mock_id: str, incoming_method: str, subpath: str
    ) -> Tuple[Optional[MockEndpointResponse], Optional[str]]:
        """
        Lookup mock by ID and validate HTTP method.
        Returns (mock_endpoint, error_message).
        """
        async with self._lock:
            mock = self._mocks.get(mock_id)
            if not mock:
                return None, f"Mock endpoint with ID '{mock_id}' was not found."

            if mock.method.upper() != incoming_method.upper():
                return (
                    mock,
                    f"Method Not Allowed: Mock '{mock_id}' only accepts {mock.method} requests, but received {incoming_method}.",
                )

            # Increment call count
            mock.call_count += 1
            return mock, None


mock_service = MockService()
