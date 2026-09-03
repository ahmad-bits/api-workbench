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


def test_put_mock_resource_replacement_and_history(client):
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Ahmad",
            "username": "ahmad",
            "email": "ahmad@example.com",
            "password": "Password123!",
        },
    )
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response_body = {
        "message": "Resource updated successfully",
        "status": "ok",
    }

    # 1. Create PUT mock
    create_payload = {
        "name": "Update Profile PUT",
        "method": "PUT",
        "path": "/users/profile",
        "status_code": 200,
        "response_body": json.dumps(response_body),
        "response_type": "json",
    }
    res = client.post("/api/v1/mocks", headers=headers, json=create_payload)
    assert res.status_code == 201, res.text
    mock_data = res.json()
    mock_id = mock_data["id"]

    # 2. Client sends PUT request
    client_payload = {
        "name": "Ahmad Ali",
        "email": "new@gmail.com",
        "age": 21,
    }
    mock_url = "/mock/ahmad/users/profile"
    put_res = client.put(mock_url, json=client_payload)
    assert put_res.status_code == 200, put_res.text
    assert put_res.json() == response_body

    # 3. Verify Request History contains received data & timestamp
    hist_res = client.get(f"/api/v1/mocks/{mock_id}/history", headers=headers)
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) == 1
    assert json.loads(history[0]["body"]) == client_payload
    assert bool(history[0]["created_at"])


def test_patch_mock_partial_update_and_history(client):
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Ahmad",
            "username": "ahmad",
            "email": "ahmad@example.com",
            "password": "Password123!",
        },
    )
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response_body = {
        "message": "Resource patched successfully",
    }

    # 1. Create PATCH mock
    create_payload = {
        "name": "Patch Profile",
        "method": "PATCH",
        "path": "/users/profile-patch",
        "status_code": 200,
        "response_body": json.dumps(response_body),
        "response_type": "json",
    }
    res = client.post("/api/v1/mocks", headers=headers, json=create_payload)
    assert res.status_code == 201, res.text
    mock_data = res.json()
    mock_id = mock_data["id"]

    # 2. Client sends PATCH request with only 'email'
    client_payload = {
        "email": "new@gmail.com",
    }
    mock_url = "/mock/ahmad/users/profile-patch"
    patch_res = client.patch(mock_url, json=client_payload)
    assert patch_res.status_code == 200, patch_res.text
    assert patch_res.json() == response_body

    # 3. Verify Request History contains received partial data
    hist_res = client.get(f"/api/v1/mocks/{mock_id}/history", headers=headers)
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) == 1
    assert json.loads(history[0]["body"]) == client_payload
