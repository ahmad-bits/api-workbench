import asyncio
import json
import logging
from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.mock_service import mock_service

logger = logging.getLogger(__name__)
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
async def handle_mock_request(
    username: str,
    request: Request,
    subpath: str = "",
    db: Session = Depends(get_db),
):
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
        allow_methods = getattr(mock, "allow_header", mock.method)
        return JSONResponse(
            status_code=405,
            content={
                "error": "Method Not Allowed",
                "detail": error_msg,
                "configured_method": allow_methods,
                "received_method": method,
                "username": username,
                "path": mock.path,
            },
            headers={"Allow": allow_methods},
        )

    auth_type = (mock.auth_type or "none").lower()
    auth_failed = False
    auth_error_detail = ""
    if auth_type == "api_key":
        header_name = mock.auth_header_name or "X-API-Key"
        expected_key = mock.auth_header_value or ""
        incoming_key = request.headers.get(header_name)
        if not incoming_key or incoming_key != expected_key:
            auth_failed = True
            auth_error_detail = f"Missing or invalid API key in '{header_name}' header."
    elif auth_type == "bearer":
        expected_token = mock.auth_token or ""
        auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            auth_failed = True
            auth_error_detail = "Missing or invalid Bearer token in 'Authorization' header."
        else:
            incoming_token = auth_header[7:].strip()
            if incoming_token != expected_token:
                auth_failed = True
                auth_error_detail = "Invalid Bearer token."

    if auth_failed:
        return JSONResponse(
            status_code=401,
            content={
                "error": "Unauthorized",
                "detail": auth_error_detail,
                "username": username,
                "path": mock.path,
            },
        )

    if mock.delay_ms and mock.delay_ms > 0:
        await asyncio.sleep(mock.delay_ms / 1000.0)

    # Capture request history for POST, PUT, and PATCH (store received data + timestamp)
    body_str = ""
    if mock.method in {"POST", "PUT", "PATCH"}:
        try:
            body_bytes = await request.body()
            body_str = body_bytes.decode("utf-8", errors="replace")
        except Exception:
            body_str = ""
        try:
            mock_service.record_request(
                db=db,
                mock_id=mock.id,
                body=body_str,
            )
        except Exception as ex:
            logger.error(f"Failed to record request history for mock {mock.id}: {ex}")
            db.rollback()

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

    if method == "HEAD":
        return Response(
            content=b"",
            status_code=mock.status_code,
            headers=resp_headers,
            media_type=media_type,
        )

    # For POST mocks with no predefined response body, return default capture response
    if mock.method == "POST" and (not mock.response_body or not mock.response_body.strip()):
        return JSONResponse(
            content={
                "success": True,
                "message": "Request captured successfully",
                "mock_id": mock.id,
            },
            status_code=mock.status_code,
            headers=resp_headers,
        )

    # For PUT / PATCH mocks with no predefined response body, return the current resource data
    if mock.method in {"PUT", "PATCH"} and (not mock.response_body or not mock.response_body.strip()):
        try:
            cur_data = json.loads(mock.current_resource_data or "{}")
            return JSONResponse(
                content=cur_data,
                status_code=mock.status_code,
                headers=resp_headers,
            )
        except Exception:
            return JSONResponse(
                content={"success": True, "message": f"{mock.method} processed successfully"},
                status_code=mock.status_code,
                headers=resp_headers,
            )

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

    return Response(
        content=mock.response_body.encode("utf-8"),
        status_code=mock.status_code,
        headers=resp_headers,
        media_type=media_type,
    )
