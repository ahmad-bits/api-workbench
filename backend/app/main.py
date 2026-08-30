from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.api.v1.endpoints.mock_server import mock_execution_router
from app.core.config import settings
from app.db.init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for application startup and shutdown."""
    # Automatically initialize SQLite database directory and tables on startup
    init_db()
    yield


def create_application() -> FastAPI:
    """FastAPI application factory."""
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="A centralized developer workbench for building, testing, and debugging APIs.",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )


    # Set up CORS middleware with flexible dev origins & regex
    cors_origins = settings.BACKEND_CORS_ORIGINS if settings.BACKEND_CORS_ORIGINS else ["http://localhost:5173", "http://127.0.0.1:5173"]
    application.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API router
    application.include_router(api_router, prefix=settings.API_V1_STR)

    # Include Mock Server execution router
    application.include_router(mock_execution_router, prefix="/mock", tags=["Mock Execution Server"])


    @application.get("/", tags=["Root"])
    async def root():
        return {
            "message": f"Welcome to {settings.PROJECT_NAME} API",
            "docs": "/docs",
            "version": settings.VERSION,
            "status": "online",
        }

    return application


app = create_application()
