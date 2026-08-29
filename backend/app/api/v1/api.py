from fastapi import APIRouter
from app.api.v1.endpoints import health, requests, mocks

api_router = APIRouter()
api_router.include_router(health.router, tags=["System"])
api_router.include_router(requests.router, prefix="/requests", tags=["Request Dispatcher"])
api_router.include_router(mocks.router, prefix="/mocks", tags=["Mock API Management"])

