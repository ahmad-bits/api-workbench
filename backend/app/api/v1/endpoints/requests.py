from fastapi import APIRouter, status
from app.schemas.request import (
    HttpRequestPayload,
    HttpResponsePayload,
    BatchHttpResponsePayload,
)
from app.services.http_dispatcher import http_dispatcher

router = APIRouter()


@router.post(
    "/dispatch",
    response_model=HttpResponsePayload,
    status_code=status.HTTP_200_OK,
    summary="Dispatch Single HTTP Request via Proxy",
    description="Asynchronously executes a single HTTP request from the backend to bypass browser CORS restrictions and captures diagnostics.",
)
async def dispatch_request(payload: HttpRequestPayload) -> HttpResponsePayload:
    """Dispatch a single HTTP request and return response payload with diagnostics."""
    return await http_dispatcher.dispatch(payload)


@router.post(
    "/benchmark",
    response_model=BatchHttpResponsePayload,
    status_code=status.HTTP_200_OK,
    summary="Benchmark Multi-Request HTTP Execution",
    description="Executes the configured HTTP request multiple times (1-100) and returns aggregated performance metrics and status code distribution.",
)
async def benchmark_requests(payload: HttpRequestPayload) -> BatchHttpResponsePayload:
    """Execute configured HTTP request multiple times and return aggregate statistics."""
    return await http_dispatcher.dispatch_batch(payload)
