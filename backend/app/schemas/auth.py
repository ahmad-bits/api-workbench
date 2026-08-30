from typing import Optional
import re
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator
from app.schemas.user import UserResponse, USERNAME_REGEX


class LoginRequest(BaseModel):
    """Payload for user login supporting either username or email."""
    username_or_email: Optional[str] = Field(
        None, description="Registered username or email address"
    )
    email: Optional[EmailStr] = Field(None, description="Email alias")
    username: Optional[str] = Field(None, description="Username alias")
    password: str = Field(..., min_length=1, max_length=128, description="Account password")

    @model_validator(mode="after")
    def validate_identifier(self) -> "LoginRequest":
        identifier = self.username_or_email or self.email or self.username
        if not identifier or not str(identifier).strip():
            raise ValueError("Please provide a username or email address.")
        self.username_or_email = str(identifier).strip()
        return self


class Token(BaseModel):
    """OAuth2 compatible Bearer token response."""
    access_token: str = Field(..., description="Signed JWT Bearer token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Token validity in seconds")
    user: UserResponse = Field(..., description="Authenticated user profile")

    model_config = ConfigDict(from_attributes=True)


class TokenPayload(BaseModel):
    """Decoded JWT payload."""
    sub: Optional[str] = None
    exp: Optional[int] = None
    email: Optional[str] = None
    username: Optional[str] = None
    name: Optional[str] = None


class UserProfileUpdate(BaseModel):
    """Schema for updating current user profile and password."""
    name: Optional[str] = Field(None, min_length=1, max_length=120, description="Updated full name")
    username: Optional[str] = Field(None, min_length=3, max_length=30, description="Updated username")
    email: Optional[EmailStr] = Field(None, description="Updated email address")
    current_password: Optional[str] = Field(
        None,
        min_length=1,
        max_length=128,
        description="Current account password (required when changing password)",
    )
    new_password: Optional[str] = Field(
        None,
        min_length=6,
        max_length=128,
        description="New password (minimum 6 characters)",
    )

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip().lower()
        if not USERNAME_REGEX.match(clean):
            raise ValueError(
                "Username must be between 3 and 30 characters and contain only letters, numbers, hyphens (-), and underscores (_)."
            )
        return clean
