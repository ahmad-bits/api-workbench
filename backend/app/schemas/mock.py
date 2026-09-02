from typing import Dict, Optional, Any, List
from pydantic import BaseModel, ConfigDict, Field, field_validator


class MockEndpointBase(BaseModel):
    name: Optional[str] = Field(default=None, description="Human-friendly name for mock endpoint")
    method: str = Field(default="GET", description="HTTP Method (GET, POST, PUT, PATCH, DELETE)")
    path: str = Field(..., description="Target route path, e.g. /users or /api/v1/resource")
    status_code: int = Field(default=200, ge=100, le=599, description="HTTP status code to return (100-599)")
    response_headers: Dict[str, str] = Field(
        default_factory=lambda: {"Content-Type": "application/json"},
        description="Key-value headers map to return in mock response",
    )
    response_body: str = Field(default="{}", description="Response payload (JSON or text)")
    response_type: str = Field(default="json", description="Response type: 'json' or 'text'")
    description: Optional[str] = Field(default=None, description="Optional notes about this mock")
    
    # Authentication fields: 'none', 'api_key', 'bearer'
    auth_type: str = Field(default="none", description="Auth type: 'none', 'api_key', or 'bearer'")
    auth_header_name: Optional[str] = Field(default="X-API-Key", description="Header name for API key auth")
    auth_header_value: Optional[str] = Field(default="", description="Expected secret value for API key auth")
    auth_token: Optional[str] = Field(default="", description="Expected secret token for Bearer auth")

    # Response Delay in milliseconds (>= 0)
    delay_ms: int = Field(default=0, ge=0, description="Response delay in milliseconds (>= 0)")

    @field_validator("method")
    @classmethod
    def validate_method(cls, v: str) -> str:
        clean = v.upper().strip()
        allowed = {"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
        if clean not in allowed:
            raise ValueError(f"Method '{clean}' is not supported. Choose from {', '.join(sorted(allowed))}")
        return clean

    @field_validator("path")
    @classmethod
    def validate_path(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Path cannot be empty.")
        if not clean.startswith("/"):
            clean = f"/{clean}"
        return clean

    @field_validator("response_body")
    @classmethod
    def validate_body(cls, v: str) -> str:
        return v if v is not None else ""

    @field_validator("auth_type")
    @classmethod
    def validate_auth_type(cls, v: Optional[str]) -> str:
        if not v:
            return "none"
        clean = v.lower().strip()
        if clean not in {"none", "api_key", "bearer"}:
            return "none"
        return clean

    @field_validator("delay_ms")
    @classmethod
    def validate_delay_ms(cls, v: Optional[int]) -> int:
        if v is None or v < 0:
            return 0
        return v


class MockEndpointCreate(MockEndpointBase):
    pass


class MockEndpointUpdate(BaseModel):
    name: Optional[str] = None
    method: Optional[str] = None
    path: Optional[str] = None
    status_code: Optional[int] = Field(default=None, ge=100, le=599)
    response_headers: Optional[Dict[str, str]] = None
    response_body: Optional[str] = None
    response_type: Optional[str] = None
    description: Optional[str] = None
    auth_type: Optional[str] = None
    auth_header_name: Optional[str] = None
    auth_header_value: Optional[str] = None
    auth_token: Optional[str] = None
    delay_ms: Optional[int] = Field(default=None, ge=0)

    @field_validator("method")
    @classmethod
    def validate_method(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.upper().strip()
        allowed = {"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
        if clean not in allowed:
            raise ValueError(f"Method '{clean}' is not supported. Choose from {', '.join(sorted(allowed))}")
        return clean

    @field_validator("path")
    @classmethod
    def validate_path(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip()
        if not clean:
            raise ValueError("Path cannot be empty.")
        if not clean.startswith("/"):
            clean = f"/{clean}"
        return clean

    @field_validator("auth_type")
    @classmethod
    def validate_auth_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.lower().strip()
        if clean not in {"none", "api_key", "bearer"}:
            return "none"
        return clean

    @field_validator("delay_ms")
    @classmethod
    def validate_delay_ms(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return None
        if v < 0:
            return 0
        return v


class MockEndpointResponse(MockEndpointBase):
    id: str = Field(..., description="Unique identifier for this mock")
    user_id: int = Field(..., description="Owner user ID")
    username: Optional[str] = Field(default=None, description="Owner username for public endpoint URLs")
    mock_url: str = Field(..., description="Full path to execute mock endpoint, e.g. /mock/{username}/path")
    full_url: Optional[str] = Field(default=None, description="Absolute URL with hostname and port")
    created_at: str = Field(..., description="ISO 8601 creation timestamp")
    updated_at: str = Field(..., description="ISO 8601 update timestamp")
    call_count: int = Field(default=0, description="Total number of requests served by this mock")

    model_config = ConfigDict(from_attributes=True)
