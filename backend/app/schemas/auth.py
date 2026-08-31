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


class OtpInitiateResponse(BaseModel):
    """Response returned when OTP registration is successfully initiated."""
    message: str = Field(..., description="Success message")
    email: str = Field(..., description="Email address the verification code was sent to")
    resend_cooldown_seconds: int = Field(60, description="Cooldown seconds before another OTP can be requested")
    expires_in_minutes: int = Field(10, description="Minutes until the verification code expires")


class OtpVerifyRequest(BaseModel):
    """Payload to verify email OTP and complete account registration."""
    email: EmailStr = Field(..., description="Registered email address")
    otp: str = Field(..., min_length=4, max_length=10, description="6-digit verification code")

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Verification code is required.")
        return clean


class OtpResendRequest(BaseModel):
    """Payload to request a new OTP verification code."""
    email: EmailStr = Field(..., description="Registered email address to resend OTP to")


class OtpResendResponse(BaseModel):
    """Response returned when a new OTP code is resent."""
    message: str = Field(..., description="Status message")
    email: str = Field(..., description="Email address the code was sent to")
    resend_cooldown_seconds: int = Field(60, description="Cooldown seconds before another code can be requested")
    expires_in_minutes: int = Field(10, description="Minutes until code expires")


class ForgotPasswordRequest(BaseModel):
    """Payload to request a password reset OTP."""
    username_or_email: str = Field(..., description="Registered username or email address")

    @field_validator("username_or_email")
    @classmethod
    def validate_identifier(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Please provide a username or email address.")
        return clean


class VerifyPasswordResetOtpRequest(BaseModel):
    """Payload to verify password reset OTP."""
    email: EmailStr = Field(..., description="Email address for the password reset")
    otp: str = Field(..., min_length=4, max_length=10, description="6-digit verification code")

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Verification code is required.")
        return clean


class VerifyPasswordResetOtpResponse(BaseModel):
    """Response returned after successfully verifying reset OTP."""
    message: str = Field(..., description="Status message")
    reset_token: str = Field(..., description="Temporary token used to authorize the actual password reset")


class ResetPasswordRequest(BaseModel):
    """Payload to finalize password reset."""
    email: EmailStr = Field(..., description="Email address for the password reset")
    reset_token: str = Field(..., description="Temporary reset token obtained from OTP verification")
    new_password: str = Field(..., min_length=6, max_length=128, description="New password")

