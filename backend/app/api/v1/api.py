from fastapi import APIRouter
from app.api.v1.endpoints import health, requests

api_router = APIRouter()
api_router.include_router(health.router, tags=["System"])
api_router.include_router(requests.router, prefix="/requests", tags=["Request Dispatcher"])
