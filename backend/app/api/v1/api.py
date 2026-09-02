from fastapi import APIRouter
from app.api.v1.endpoints import auth, health, requests, mocks, users, saved_apis

api_router = APIRouter()
api_router.include_router(health.router, tags=["System"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["User Accounts"])
api_router.include_router(requests.router, prefix="/requests", tags=["Request Dispatcher"])
api_router.include_router(mocks.router, prefix="/mocks", tags=["Mock API Management"])
api_router.include_router(saved_apis.router, prefix="/saved-apis", tags=["Saved APIs"])
