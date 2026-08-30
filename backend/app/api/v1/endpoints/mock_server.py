from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import json
from app.db.session import get_db
from app.services.mock_service import mock_service

mock_execution_router = APIRouter()


@mock_execution_router.api_route(
    "/{username}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    summary="Execute Mock Endpoint (Root)",
    include_in_schema=False,
)
@mock_execution_router.api_route(
    "/{username}/{subpath:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    summary="Execute Mock Endpoint (Username + Path)",
    include_in_schema=False,
)
def handle_mock_request(
    username: str,
    request: Request,
    subpath: str = "",
    db: Session = Depends(get_db),
):
    """
    Publicly accessible mock execution engine.
    Dynamically receives requests to /mock/{username}/{subpath}, looks up the mock
    in SQLite, and returns the configured response without requiring authentication.
    Continues to work after user logout.
    """
    method = request.method.upper()
    mock, error_msg = mock_service.match_and_serve_public(
        db=db, username=username, incoming_method=method, subpath=subpath
    )

    if not mock:
        return JSONResponse(
            status_code=404,
            content={
                "error": "Mock Not Found",
                "detail": error_msg or f"No mock endpoint found for username '{username}' and path '/{subpath}'.",
                "username": username,
                "path": f"/{subpath}",
            },
        )

    if error_msg:
        return JSONResponse(
            status_code=405,
            content={
                "error": "Method Not Allowed",
                "detail": error_msg,
                "configured_method": mock.method,
                "received_method": method,
                "username": username,
                "path": mock.path,
            },
            headers={"Allow": mock.method},
        )

    resp_headers = {}
    try:
        if mock.response_headers:
            resp_headers = json.loads(mock.response_headers)
    except Exception:
        resp_headers = {"Content-Type": "application/json"}

    media_type = resp_headers.get(
        "Content-Type",
        "application/json" if mock.response_type == "json" else "text/plain",
    )

    # HEAD request returns status and headers without payload
    if method == "HEAD":
        return Response(
            content=b"",
            status_code=mock.status_code,
            headers=resp_headers,
            media_type=media_type,
        )

    # JSON response rendering
    if mock.response_type == "json":
        try:
            parsed_json = json.loads(mock.response_body)
            return JSONResponse(
                content=parsed_json,
                status_code=mock.status_code,
                headers=resp_headers,
            )
        except Exception:
            return Response(
                content=mock.response_body.encode("utf-8"),
                status_code=mock.status_code,
                headers=resp_headers,
                media_type="application/json",
            )

    # Plain text / other content
    return Response(
        content=mock.response_body.encode("utf-8"),
        status_code=mock.status_code,
        headers=resp_headers,
        media_type=media_type,
    )
