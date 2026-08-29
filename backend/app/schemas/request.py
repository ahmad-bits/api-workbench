from typing import Dict, Optional, Any, List
from pydantic import BaseModel, Field


class HttpRequestPayload(BaseModel):
    method: str = Field(..., description="HTTP Method (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)")
    url: str = Field(..., description="Target Request URL")
    headers: Dict[str, str] = Field(default_factory=dict, description="Request headers key-value map")
    params: Dict[str, str] = Field(default_factory=dict, description="URL query parameters key-value map")
    body: Optional[str] = Field(default=None, description="Raw request body string")
    body_type: str = Field(default="none", description="Body format: none, json, text")
    timeout_seconds: float = Field(default=30.0, ge=1.0, le=120.0, description="Request timeout limit in seconds")
    request_count: int = Field(default=1, ge=1, le=100, description="Number of times to execute request (1-100)")


class HttpResponsePayload(BaseModel):
    status_code: int = Field(..., description="HTTP Response status code")
    status_text: str = Field(..., description="HTTP status reason phrase (e.g. OK, Not Found)")
    headers: Dict[str, str] = Field(default_factory=dict, description="Response headers key-value map")
    data: Any = Field(default=None, description="Response body content (parsed JSON object or string)")
    is_json: bool = Field(default=False, description="Whether response body is JSON")
    size_bytes: int = Field(default=0, description="Response content size in bytes")
    elapsed_ms: float = Field(default=0.0, description="Round-trip request time in milliseconds")
    error: Optional[str] = Field(default=None, description="Error message if network/timeout failed")


class StatusCodeStat(BaseModel):
    status_code: int = Field(..., description="HTTP status code (e.g. 200, 404, 500)")
    status_text: str = Field(..., description="HTTP status reason phrase")
    count: int = Field(..., description="Number of responses with this status code")
    percentage: float = Field(..., description="Percentage of total requests resulting in this code")


class BenchmarkStats(BaseModel):
    total_requests: int = Field(..., description="Total number of requests executed")
    successful_requests: int = Field(..., description="Number of successful requests (2xx or non-error 3xx)")
    failed_requests: int = Field(..., description="Number of failed requests (4xx, 5xx, or network errors)")
    success_rate: float = Field(..., description="Percentage of requests that succeeded (0-100)")
    avg_latency_ms: float = Field(..., description="Average round-trip latency in milliseconds")
    min_latency_ms: float = Field(..., description="Minimum round-trip latency in milliseconds")
    max_latency_ms: float = Field(..., description="Maximum round-trip latency in milliseconds")
    status_code_distribution: Dict[int, int] = Field(
        default_factory=dict, description="Map of status code to count"
    )
    status_codes: List[StatusCodeStat] = Field(
        default_factory=list, description="Ordered list of status code distributions with details"
    )


class BatchHttpResponsePayload(BaseModel):
    stats: BenchmarkStats = Field(..., description="Aggregated benchmark statistics")
    results: List[HttpResponsePayload] = Field(
        default_factory=list, description="Individual results for each request"
    )
    latest_response: HttpResponsePayload = Field(
        ..., description="The most recent response payload for inspecting data/headers"
    )
