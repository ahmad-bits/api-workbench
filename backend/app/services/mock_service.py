import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.mock import MockEndpoint, MockRequestHistory
from app.schemas.mock import (
    MockEndpointCreate,
    MockEndpointUpdate,
    MockEndpointResponse,
    MockRequestHistoryItem,
)


def _format_mock_urls(username: str, path: str) -> Tuple[str, str]:
    clean_path = path if path.startswith("/") else f"/{path}"
    mock_url = f"/mock/{username.lower()}{clean_path}"
    full_url = f"http://127.0.0.1:8000{mock_url}"
    return mock_url, full_url


def _to_response_schema(
    mock: MockEndpoint, username: str, history_count: int = 0
) -> MockEndpointResponse:
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
        auth_type=mock.auth_type or "none",
        auth_header_name=mock.auth_header_name or "X-API-Key",
        auth_header_value=mock.auth_header_value or "",
        auth_token=mock.auth_token or "",
        delay_ms=mock.delay_ms or 0,
        initial_resource_data=mock.initial_resource_data,
        current_resource_data=mock.current_resource_data if mock.current_resource_data is not None else mock.initial_resource_data,
        mock_url=mock_url,
        full_url=full_url,
        created_at=mock.created_at.isoformat() if mock.created_at else "",
        updated_at=mock.updated_at.isoformat() if mock.updated_at else "",
        call_count=mock.call_count or 0,
        history_count=history_count,
    )


class DatabaseMockService:
    def list_user_mocks(self, db: Session, user: User) -> List[MockEndpointResponse]:
        mocks = (
            db.query(MockEndpoint)
            .filter(MockEndpoint.user_id == user.id)
            .order_by(MockEndpoint.created_at.desc())
            .all()
        )
        tracked_mock_ids = [m.id for m in mocks if m.method in {"POST", "PUT", "PATCH"}]
        history_counts: Dict[str, int] = {}
        if tracked_mock_ids:
            counts = (
                db.query(MockRequestHistory.mock_id, func.count(MockRequestHistory.id))
                .filter(MockRequestHistory.mock_id.in_(tracked_mock_ids))
                .group_by(MockRequestHistory.mock_id)
                .all()
            )
            history_counts = {mock_id: count for mock_id, count in counts}

        return [
            _to_response_schema(m, user.username, history_counts.get(m.id, 0))
            for m in mocks
        ]

    def get_user_mock(
        self, db: Session, user: User, mock_id: str
    ) -> Optional[MockEndpointResponse]:
        mock = (
            db.query(MockEndpoint)
            .filter(MockEndpoint.id == mock_id, MockEndpoint.user_id == user.id)
            .first()
        )
        if not mock:
            return None
        h_count = 0
        if mock.method in {"POST", "PUT", "PATCH"}:
            h_count = (
                db.query(func.count(MockRequestHistory.id))
                .filter(MockRequestHistory.mock_id == mock.id)
                .scalar()
                or 0
            )
        return _to_response_schema(mock, user.username, h_count)

    def create_user_mock(
        self, db: Session, user: User, data: MockEndpointCreate
    ) -> MockEndpointResponse:
        clean_method = data.method.upper().strip()
        clean_path = data.path.strip()
        if not clean_path.startswith("/"):
            clean_path = f"/{clean_path}"
        if len(clean_path) > 1 and clean_path.endswith("/"):
            clean_path = clean_path.rstrip("/")

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
        while db.query(MockEndpoint).filter(MockEndpoint.id == mock_id).first():
            mock_id = uuid.uuid4().hex[:8]

        name = data.name.strip() if data.name and data.name.strip() else f"{clean_method} {clean_path}"
        headers_str = json.dumps(data.response_headers or {"Content-Type": "application/json"})

        auth_type = (data.auth_type or "none").lower().strip()
        if auth_type not in {"none", "api_key", "bearer"}:
            auth_type = "none"

        auth_header_name = data.auth_header_name.strip() if data.auth_header_name else "X-API-Key"
        auth_header_value = data.auth_header_value.strip() if data.auth_header_value else ""
        auth_token = data.auth_token.strip() if data.auth_token else ""
        delay_ms = max(0, int(data.delay_ms or 0))

        status_code = data.status_code
        response_body = data.response_body or ""
        initial_resource_data = data.initial_resource_data
        current_resource_data = data.current_resource_data

        if clean_method == "POST":
            if not status_code:
                status_code = 201
            if not response_body.strip():
                response_body = json.dumps({"success": True, "message": "Request captured successfully"})
        elif clean_method in {"PUT", "PATCH"}:
            if not response_body.strip():
                response_body = json.dumps({"success": True, "message": f"{clean_method} processed successfully"})
        elif clean_method == "DELETE":
            if not status_code:
                status_code = 200
            if not response_body.strip():
                response_body = json.dumps({"success": True, "message": "Resource deleted successfully"})

        db_mock = MockEndpoint(
            id=mock_id,
            user_id=user.id,
            name=name,
            method=clean_method,
            path=clean_path,
            status_code=status_code,
            response_headers=headers_str,
            response_body=response_body,
            response_type=data.response_type or "json",
            description=data.description,
            auth_type=auth_type,
            auth_header_name=auth_header_name,
            auth_header_value=auth_header_value,
            auth_token=auth_token,
            delay_ms=delay_ms,
            initial_resource_data=initial_resource_data,
            current_resource_data=current_resource_data,
            call_count=0,
        )
        db.add(db_mock)
        db.commit()
        db.refresh(db_mock)

        return _to_response_schema(db_mock, user.username)

    def update_user_mock(
        self, db: Session, user: User, mock_id: str, data: MockEndpointUpdate
    ) -> Optional[MockEndpointResponse]:
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
        if data.auth_type is not None:
            clean_auth = data.auth_type.lower().strip()
            db_mock.auth_type = clean_auth if clean_auth in {"none", "api_key", "bearer"} else "none"
        if data.auth_header_name is not None:
            db_mock.auth_header_name = data.auth_header_name.strip() if data.auth_header_name else "X-API-Key"
        if data.auth_header_value is not None:
            db_mock.auth_header_value = data.auth_header_value.strip() if data.auth_header_value else ""
        if data.auth_token is not None:
            db_mock.auth_token = data.auth_token.strip() if data.auth_token else ""
        if data.delay_ms is not None:
            db_mock.delay_ms = max(0, int(data.delay_ms))
        if data.initial_resource_data is not None:
            db_mock.initial_resource_data = data.initial_resource_data
            if db_mock.current_resource_data is None:
                db_mock.current_resource_data = data.initial_resource_data
        if data.current_resource_data is not None:
            db_mock.current_resource_data = data.current_resource_data

        db.commit()
        db.refresh(db_mock)
        return _to_response_schema(db_mock, user.username)

    def reset_resource_data(
        self, db: Session, user: User, mock_id: str
    ) -> Optional[MockEndpointResponse]:
        db_mock = (
            db.query(MockEndpoint)
            .filter(MockEndpoint.id == mock_id, MockEndpoint.user_id == user.id)
            .first()
        )
        if not db_mock:
            return None
        db_mock.current_resource_data = db_mock.initial_resource_data
        db.commit()
        db.refresh(db_mock)
        return _to_response_schema(db_mock, user.username)

    def delete_user_mock(self, db: Session, user: User, mock_id: str) -> bool:
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
        clean_user = username.lower().strip()
        user = db.query(User).filter(User.username == clean_user).first()
        if not user or not user.is_active:
            return None, f"No active user found with username '@{username}'."

        clean_subpath = subpath.strip()
        if not clean_subpath.startswith("/"):
            clean_subpath = f"/{clean_subpath}" if clean_subpath else "/"

        candidates = [clean_subpath]
        if clean_subpath.endswith("/") and len(clean_subpath) > 1:
            candidates.append(clean_subpath.rstrip("/"))
        elif not clean_subpath.endswith("/"):
            candidates.append(f"{clean_subpath}/")

        # 1. Match both path AND HTTP method
        mock = (
            db.query(MockEndpoint)
            .filter(
                MockEndpoint.user_id == user.id,
                MockEndpoint.path.in_(candidates),
                func.upper(MockEndpoint.method) == incoming_method.upper(),
            )
            .first()
        )

        if mock:
            mock.call_count = (mock.call_count or 0) + 1
            db.commit()
            return mock, None

        # 2. Check if the path exists with other HTTP methods to return 405 Method Not Allowed
        other_mocks = (
            db.query(MockEndpoint)
            .filter(
                MockEndpoint.user_id == user.id,
                MockEndpoint.path.in_(candidates),
            )
            .all()
        )

        if other_mocks:
            allowed_methods = sorted(list({m.method.upper() for m in other_mocks}))
            allow_str = ", ".join(allowed_methods)
            first_mock = other_mocks[0]
            first_mock.allow_header = allow_str
            return (
                first_mock,
                f"Method Not Allowed: Mock '{first_mock.path}' only accepts {allow_str} requests, but received {incoming_method}.",
            )

        return None, f"Mock endpoint '{clean_subpath}' not configured under user '@{user.username}'."

    def _format_history_timestamp(self, dt: Any) -> str:
        if not dt:
            return ""
        if isinstance(dt, datetime):
            m = dt.strftime("%b")
            day = dt.day
            hour = dt.strftime("%I").lstrip("0") or "12"
            minute = dt.strftime("%M")
            ampm = dt.strftime("%p")
            return f"{m} {day}, {dt.year}, {hour}:{minute} {ampm}"
        try:
            clean_str = str(dt).replace("T", " ").split(".")[0]
            parsed = datetime.strptime(clean_str, "%Y-%m-%d %H:%M:%S")
            m = parsed.strftime("%b")
            day = parsed.day
            hour = parsed.strftime("%I").lstrip("0") or "12"
            minute = parsed.strftime("%M")
            ampm = parsed.strftime("%p")
            return f"{m} {day}, {parsed.year}, {hour}:{minute} {ampm}"
        except Exception:
            return str(dt)

    def record_request(
        self,
        db: Session,
        mock_id: str,
        body: str,
    ) -> MockRequestHistory:
        entry_id = uuid.uuid4().hex[:12]
        entry = MockRequestHistory(
            id=entry_id,
            mock_id=mock_id,
            body=body,
            created_at=datetime.now(),
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    # Maintain alias for backwards compatibility
    record_post_request = record_request

    def update_resource_state(
        self,
        db: Session,
        mock: MockEndpoint,
        incoming_data: Any,
        method: str,
    ) -> str:
        """
        Updates the current_resource_data of a PUT or PATCH mock.
        - PUT: Replaces current_resource_data with incoming_data.
        - PATCH: Merges incoming_data into current_resource_data (updating only provided fields).
        Keeps initial_resource_data untouched.
        """
        clean_method = method.upper().strip()
        if clean_method == "PUT":
            if isinstance(incoming_data, (dict, list)):
                updated_str = json.dumps(incoming_data, indent=2)
            else:
                updated_str = str(incoming_data) if incoming_data is not None else "{}"
            mock.current_resource_data = updated_str
            db.commit()
            db.refresh(mock)
            return updated_str

        elif clean_method == "PATCH":
            # Start from existing current_resource_data or initial_resource_data
            base_str = mock.current_resource_data or mock.initial_resource_data or "{}"
            try:
                base_dict = json.loads(base_str)
            except Exception:
                base_dict = {}

            if isinstance(base_dict, dict) and isinstance(incoming_data, dict):
                # Update only the fields provided in incoming_data
                base_dict.update(incoming_data)
                updated_str = json.dumps(base_dict, indent=2)
            elif isinstance(incoming_data, (dict, list)):
                updated_str = json.dumps(incoming_data, indent=2)
            else:
                updated_str = str(incoming_data)

            mock.current_resource_data = updated_str
            db.commit()
            db.refresh(mock)
            return updated_str

        return mock.current_resource_data or ""

    def clear_resource_state(
        self,
        db: Session,
        mock: MockEndpoint,
    ) -> None:
        """
        Clears the current_resource_data of a stateful DELETE mock.
        """
        mock.current_resource_data = ""
        db.commit()
        db.refresh(mock)

    def get_mock_history(
        self, db: Session, user: User, mock_id: str
    ) -> List[MockRequestHistoryItem]:
        mock = (
            db.query(MockEndpoint)
            .filter(MockEndpoint.id == mock_id, MockEndpoint.user_id == user.id)
            .first()
        )
        if not mock:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Mock endpoint with ID '{mock_id}' not found in your account.",
            )

        entries = (
            db.query(MockRequestHistory)
            .filter(MockRequestHistory.mock_id == mock_id)
            .order_by(MockRequestHistory.created_at.desc())
            .all()
        )

        return [
            MockRequestHistoryItem(
                id=entry.id,
                mock_id=entry.mock_id,
                body=entry.body or "",
                created_at=self._format_history_timestamp(entry.created_at),
            )
            for entry in entries
        ]

    def clear_mock_history(self, db: Session, user: User, mock_id: str) -> bool:
        mock = (
            db.query(MockEndpoint)
            .filter(MockEndpoint.id == mock_id, MockEndpoint.user_id == user.id)
            .first()
        )
        if not mock:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Mock endpoint with ID '{mock_id}' not found in your account.",
            )

        db.query(MockRequestHistory).filter(MockRequestHistory.mock_id == mock_id).delete()
        db.commit()
        return True


mock_service = DatabaseMockService()
