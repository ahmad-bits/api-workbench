import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


def test_delete_mock_configured_response_without_resource_data(client):
    # 1. Register test user
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Delete User",
            "username": "deleteuser",
            "email": "deleteuser@example.com",
            "password": "Password123!",
        },
    )
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response_body = {
        "success": True,
        "message": "Resource deleted successfully",
    }

    # 2. Create DELETE mock with only Response JSON
    create_payload = {
        "name": "Delete Article",
        "method": "DELETE",
        "path": "/api/v1/articles/101",
        "status_code": 200,
        "response_body": json.dumps(response_body),
        "response_type": "json",
        "delay_ms": 10,
    }
    create_res = client.post("/api/v1/mocks", headers=headers, json=create_payload)
    assert create_res.status_code == 201, create_res.text
    mock_data = create_res.json()
    mock_id = mock_data["id"]

    # Verify no resource data is attached
    assert mock_data["initial_resource_data"] is None
    assert mock_data["current_resource_data"] is None

    # 3. Send client DELETE request
    del_res = client.delete("/mock/deleteuser/api/v1/articles/101")
    assert del_res.status_code == 200
    assert del_res.json() == response_body

    # 4. Verify NO request history was recorded for DELETE
    history_res = client.get(f"/api/v1/mocks/{mock_id}/history", headers=headers)
    assert history_res.status_code == 200
    assert len(history_res.json()) == 0
