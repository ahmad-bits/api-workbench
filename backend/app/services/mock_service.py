import json
import uuid
from typing import Dict, List, Optional, Tuple, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.mock import MockEndpoint
from app.schemas.mock import (
    MockEndpointCreate,
    MockEndpointUpdate,
    MockEndpointResponse,
)


def _format_mock_urls(username: str, path: str) -> Tuple[str, str]:
    clean_path = path if path.startswith("/") else f"/{path}"
    mock_url = f"/mock/{username.lower()}{clean_path}"
    full_url = f"http://127.0.0.1:8000{mock_url}"
    return mock_url, full_url


def _to_response_schema(mock: MockEndpoint, username: str) -> MockEndpointResponse:
    headers_dict = {}
    try:
        if mock.response_headers:
            headers_dict = json.loads(mock.response_headers)
    except Exception:
        headers_dict = {"Content-Type": "application/json"}

    mock_url, full_url = _format_mock_urls(username, mock.path)

    return MockEndpointResponse(
        id=mock.id,
        user_id=mock.user_id,
        username=username,
        name=mock.name,
        method=mock.method,
        path=mock.path,
        status_code=mock.status_code,
        response_headers=headers_dict,
        response_body=mock.response_body or "",
        response_type=mock.response_type or "json",
        description=mock.description,
        mock_url=mock_url,
        full_url=full_url,
        created_at=mock.created_at.isoformat() if mock.created_at else "",
        updated_at=mock.updated_at.isoformat() if mock.updated_at else "",
        call_count=mock.call_count or 0,
    )


class DatabaseMockService:
    """Database-backed Mock API Service managing user-scoped mock endpoints in SQLite."""

    def list_user_mocks(self, db: Session, user: User) -> List[MockEndpointResponse]:
        """Return all mock endpoints belonging strictly to the authenticated user."""
        mocks = (
            db.query(MockEndpoint)
            .filter(MockEndpoint.user_id == user.id)
            .order_by(MockEndpoint.created_at.desc())
            .all()
        )
        return [_to_response_schema(m, user.username) for m in mocks]

    def get_user_mock(
        self, db: Session, user: User, mock_id: str
    ) -> Optional[MockEndpointResponse]:
        """Get single mock endpoint by ID belonging to the authenticated user."""
        mock = (
            db.query(MockEndpoint)
            .filter(MockEndpoint.id == mock_id, MockEndpoint.user_id == user.id)
            .first()
        )
        if not mock:
            return None
        return _to_response_schema(mock, user.username)

    def create_user_mock(
        self, db: Session, user: User, data: MockEndpointCreate
    ) -> MockEndpointResponse:
        """Create and persist a new mock endpoint for the authenticated user."""
        clean_method = data.method.upper().strip()
        clean_path = data.path.strip()
        if not clean_path.startswith("/"):
            clean_path = f"/{clean_path}"
        if len(clean_path) > 1 and clean_path.endswith("/"):
            clean_path = clean_path.rstrip("/")

        # Check for existing duplicate mock endpoint in this user's account
        existing = (
            db.query(MockEndpoint)
            .filter(
                MockEndpoint.user_id == user.id,
                MockEndpoint.method == clean_method,
                MockEndpoint.path == clean_path,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A mock endpoint with method '{clean_method}' and path '{clean_path}' already exists in your account.",
            )

        mock_id = uuid.uuid4().hex[:8]
        # Ensure ID is unique in table
        while db.query(MockEndpoint).filter(MockEndpoint.id == mock_id).first():
            mock_id = uuid.uuid4().hex[:8]

        name = data.name.strip() if data.name and data.name.strip() else f"{clean_method} {clean_path}"
        headers_str = json.dumps(data.response_headers or {"Content-Type": "application/json"})

        db_mock = MockEndpoint(
            id=mock_id,
            user_id=user.id,
            name=name,
            method=clean_method,
            path=clean_path,
            status_code=data.status_code,
            response_headers=headers_str,
            response_body=data.response_body or "",
            response_type=data.response_type or "json",
            description=data.description,
            call_count=0,
        )
        db.add(db_mock)
        db.commit()
        db.refresh(db_mock)

        return _to_response_schema(db_mock, user.username)

    def update_user_mock(
        self, db: Session, user: User, mock_id: str, data: MockEndpointUpdate
    ) -> Optional[MockEndpointResponse]:
        """Update an existing mock endpoint owned by the authenticated user."""
        db_mock = (
            db.query(MockEndpoint)
            .filter(MockEndpoint.id == mock_id, MockEndpoint.user_id == user.id)
            .first()
        )
        if not db_mock:
            return None

        target_method = data.method.upper().strip() if data.method is not None else db_mock.method
        target_path = data.path.strip() if data.path is not None else db_mock.path
        if not target_path.startswith("/"):
            target_path = f"/{target_path}"
        if len(target_path) > 1 and target_path.endswith("/"):
            target_path = target_path.rstrip("/")

        if target_method != db_mock.method or target_path != db_mock.path:
            existing = (
                db.query(MockEndpoint)
                .filter(
                    MockEndpoint.user_id == user.id,
                    MockEndpoint.id != mock_id,
                    MockEndpoint.method == target_method,
                    MockEndpoint.path == target_path,
                )
                .first()
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"A mock endpoint with method '{target_method}' and path '{target_path}' already exists in your account.",
                )

        if data.name is not None:
            db_mock.name = data.name.strip()
        db_mock.method = target_method
        db_mock.path = target_path
        if data.status_code is not None:
            db_mock.status_code = data.status_code
        if data.response_headers is not None:
            db_mock.response_headers = json.dumps(data.response_headers)
        if data.response_body is not None:
            db_mock.response_body = data.response_body
        if data.response_type is not None:
            db_mock.response_type = data.response_type
        if data.description is not None:
            db_mock.description = data.description

        db.commit()
        db.refresh(db_mock)
        return _to_response_schema(db_mock, user.username)

    def delete_user_mock(self, db: Session, user: User, mock_id: str) -> bool:
        """Delete a mock endpoint owned by the authenticated user."""
        db_mock = (
            db.query(MockEndpoint)
            .filter(MockEndpoint.id == mock_id, MockEndpoint.user_id == user.id)
            .first()
        )
        if not db_mock:
            return False

        db.delete(db_mock)
        db.commit()
        return True

    def match_and_serve_public(
        self, db: Session, username: str, incoming_method: str, subpath: str
    ) -> Tuple[Optional[MockEndpoint], Optional[str]]:
        """
        Public mock execution resolver:
        Finds user by username in SQLite, then finds configured Mock endpoint matching path and method.
        Does NOT require authentication!
        Returns (MockEndpoint, error_message).
        """
        clean_user = username.lower().strip()
        user = db.query(User).filter(User.username == clean_user).first()
        if not user or not user.is_active:
            return None, f"No active user found with username '@{username}'."

        # Normalize target subpath
        clean_subpath = subpath.strip()
        if not clean_subpath.startswith("/"):
            clean_subpath = f"/{clean_subpath}" if clean_subpath else "/"

        # Match exact path or path with/without trailing slash
        candidates = [clean_subpath]
        if clean_subpath.endswith("/") and len(clean_subpath) > 1:
            candidates.append(clean_subpath.rstrip("/"))
        elif not clean_subpath.endswith("/"):
            candidates.append(f"{clean_subpath}/")

        # Find mock among candidates
        mock = (
            db.query(MockEndpoint)
            .filter(
                MockEndpoint.user_id == user.id,
                MockEndpoint.path.in_(candidates),
            )
            .first()
        )

        if not mock:
            return None, f"Mock endpoint '{clean_subpath}' not configured under user '@{user.username}'."

        # Validate HTTP method
        if mock.method.upper() != incoming_method.upper():
            return (
                mock,
                f"Method Not Allowed: Mock '{mock.path}' only accepts {mock.method} requests, but received {incoming_method}.",
            )

        # Increment call counter in database
        mock.call_count = (mock.call_count or 0) + 1
        db.commit()

        return mock, None


mock_service = DatabaseMockService()
