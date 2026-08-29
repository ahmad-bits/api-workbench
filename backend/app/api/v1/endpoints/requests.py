from fastapi import APIRouter, status
from app.schemas.request import HttpRequestPayload, HttpResponsePayload
from app.services.http_dispatcher import http_dispatcher

router = APIRouter()


@router.post(
    "/dispatch",
    response_model=HttpResponsePayload,
    status_code=status.HTTP_200_OK,
    summary="Dispatch HTTP Request via Proxy",
    description="Asynchronously executes an HTTP request from the backend to bypass browser CORS restrictions and captures diagnostics.",
)
async def dispatch_request(payload: HttpRequestPayload) -> HttpResponsePayload:
    """Dispatch an HTTP request and return response payload with diagnostics."""
    return await http_dispatcher.dispatch(payload)
