from typing import Dict, Optional, Any, Union
from pydantic import BaseModel, Field, HttpUrl


class HttpRequestPayload(BaseModel):
    method: str = Field(..., description="HTTP Method (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)")
    url: str = Field(..., description="Target Request URL")
    headers: Dict[str, str] = Field(default_factory=dict, description="Request headers key-value map")
    params: Dict[str, str] = Field(default_factory=dict, description="URL query parameters key-value map")
    body: Optional[str] = Field(default=None, description="Raw request body string")
    body_type: str = Field(default="none", description="Body format: none, json, text")
    timeout_seconds: float = Field(default=30.0, ge=1.0, le=120.0, description="Request timeout limit in seconds")


class HttpResponsePayload(BaseModel):
    status_code: int = Field(..., description="HTTP Response status code")
    status_text: str = Field(..., description="HTTP status reason phrase (e.g. OK, Not Found)")
    headers: Dict[str, str] = Field(default_factory=dict, description="Response headers key-value map")
    data: Any = Field(default=None, description="Response body content (parsed JSON object or string)")
    is_json: bool = Field(default=False, description="Whether response body is JSON")
    size_bytes: int = Field(default=0, description="Response content size in bytes")
    elapsed_ms: float = Field(default=0.0, description="Round-trip request time in milliseconds")
    error: Optional[str] = Field(default=None, description="Error message if network/timeout failed")
