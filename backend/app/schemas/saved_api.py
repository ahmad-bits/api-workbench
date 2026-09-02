from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class SavedApiBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120, description="Human-friendly name for this API")
    url: str = Field(..., min_length=1, max_length=1000, description="Target API endpoint URL")
    category: Optional[str] = Field(default="General", max_length=120, description="Workspace or category name")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("API name cannot be empty.")
        return clean

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("API URL cannot be empty.")
        if not (clean.startswith("http://") or clean.startswith("https://")):
            clean = f"https://{clean}"
        return clean


class SavedApiCreate(SavedApiBase):
    api_key: Optional[str] = Field(
        default=None,
        description="Optional API key. Will be encrypted at rest and never exposed in list responses.",
    )


class SavedApiUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=120)
    url: Optional[str] = Field(default=None, max_length=1000)
    category: Optional[str] = Field(default=None, max_length=120)
    api_key: Optional[str] = Field(
        default=None,
        description="Updated API key (if provided). Pass empty string '' to remove existing API key.",
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip()
        if not clean:
            raise ValueError("API name cannot be empty.")
        return clean

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip()
        if not clean:
            raise ValueError("API URL cannot be empty.")
        if not (clean.startswith("http://") or clean.startswith("https://")):
            clean = f"https://{clean}"
        return clean


class SavedApiResponse(SavedApiBase):
    id: str = Field(..., description="Unique UUID for this saved API")
    user_id: int = Field(..., description="Owner user ID")
    has_api_key: bool = Field(default=False, description="Whether an encrypted API key is saved")
    api_key_masked: Optional[str] = Field(
        default=None,
        description="Masked representation of API key for display (e.g. ••••••••)",
    )
    created_at: str = Field(..., description="ISO 8601 creation timestamp")
    updated_at: str = Field(..., description="ISO 8601 update timestamp")

    model_config = ConfigDict(from_attributes=True)


class SavedApiOpenResponse(BaseModel):
    id: str = Field(..., description="Unique UUID for this saved API")
    name: str = Field(..., description="API name")
    url: str = Field(..., description="Target API endpoint URL")
    category: Optional[str] = Field(default="General", description="Workspace or category name")
    api_key: Optional[str] = Field(
        default=None,
        description="Decrypted plain API key delivered exclusively to the owner for tester loading",
    )
    has_api_key: bool = Field(default=False, description="Whether an API key is attached")

    model_config = ConfigDict(from_attributes=True)
