from datetime import datetime
from typing import Optional
import re
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_-]{3,30}$")


class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120, description="User full name")
    username: str = Field(
        ...,
        min_length=3,
        max_length=30,
        description="Unique username (3-30 chars, alphanumeric, hyphens, underscores)",
    )
    email: EmailStr = Field(..., description="User email address")

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        clean = v.strip().lower()
        if not USERNAME_REGEX.match(clean):
            raise ValueError(
                "Username must be between 3 and 30 characters and contain only letters, numbers, hyphens (-), and underscores (_)."
            )
        return clean


class UserCreate(UserBase):
    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
        description="Password for the new account (minimum 6 characters)",
    )


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=120, description="Updated full name")
    username: Optional[str] = Field(None, min_length=3, max_length=30, description="Updated username")
    email: Optional[EmailStr] = Field(None, description="Updated email address")
    password: Optional[str] = Field(
        None,
        min_length=6,
        max_length=128,
        description="Updated password (minimum 6 characters)",
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


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserDeleteResponse(BaseModel):
    message: str
    user_id: int
