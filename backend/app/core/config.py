from pathlib import Path
from typing import List, Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DATABASE_DIR = BACKEND_DIR / "database"
DEFAULT_DATABASE_PATH = DEFAULT_DATABASE_DIR / "api_workbench.db"


class Settings(BaseSettings):
    PROJECT_NAME: str = "API Workbench"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # CORS configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # JWT Authentication configuration
    JWT_SECRET_KEY: str = "supersecretjwtdevelopmentkeypleasereplaceinproduction123456789"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours (1440 minutes)

    # Database configuration
    DATABASE_URL: Optional[str] = None


    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: Optional[str]) -> str:
        if v and v.strip():
            # If user provided a relative sqlite path like sqlite:///./database/api_workbench.db
            # resolve it relative to BACKEND_DIR
            val = v.strip()
            if val.startswith("sqlite:///./") or val.startswith("sqlite:///.\\"):
                rel_path = val.replace("sqlite:///./", "").replace("sqlite:///.\\", "")
                abs_path = (BACKEND_DIR / rel_path).resolve()
                return f"sqlite:///{abs_path.as_posix()}"
            return val
        # Default to SQLite database located in backend/database/api_workbench.db
        return f"sqlite:///{DEFAULT_DATABASE_PATH.as_posix()}"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return [str(item) for item in v]
        return v

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

