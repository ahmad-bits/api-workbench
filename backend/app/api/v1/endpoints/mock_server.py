from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse
import json
from app.services.mock_service import mock_service

mock_execution_router = APIRouter()


@mock_execution_router.api_route(
    "/{mock_id}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    summary="Execute Mock Endpoint (Base)",
    include_in_schema=False,
)
@mock_execution_router.api_route(
    "/{mock_id}/{subpath:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    summary="Execute Mock Endpoint (With Subpath)",
    include_in_schema=False,
)
async def handle_mock_request(mock_id: str, request: Request, subpath: str = ""):
    """
    Dynamically receives and executes mock requests matching configured HTTP methods,
    returning custom status codes, headers, and payloads.
    """
    method = request.method.upper()
    mock, error_msg = await mock_service.match_and_serve(mock_id, method, subpath)

    if not mock:
        return JSONResponse(
            status_code=404,
            content={
                "error": "Mock Not Found",
                "detail": error_msg or f"No mock endpoint found with ID '{mock_id}'.",
                "mock_id": mock_id,
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
                "mock_id": mock_id,
            },
            headers={"Allow": mock.method},
        )

    resp_headers = dict(mock.response_headers or {})
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
