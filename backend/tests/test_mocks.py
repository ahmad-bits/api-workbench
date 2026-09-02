import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db

# In-memory SQLite for test isolation
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


def test_mock_api_lifecycle_and_scoping(client):
    """Test full Mock API lifecycle with user ownership and scoping."""
    # 1. Register User Ahmad
    ahmad_reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Ahmad",
            "username": "ahmad",
            "email": "ahmad@example.com",
            "password": "Password123!",
        },
    )
    assert ahmad_reg.status_code == 201
    ahmad_token = ahmad_reg.json()["access_token"]

    # 2. Register User Sarah
    sarah_reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Sarah",
            "username": "sarah",
            "email": "sarah@example.com",
            "password": "Password123!",
        },
    )
    assert sarah_reg.status_code == 201
    sarah_token = sarah_reg.json()["access_token"]

    # 3. Ahmad creates a Mock API: GET /users
    mock_payload = {
        "name": "Get Team Users",
        "method": "GET",
        "path": "/users",
        "status_code": 200,
        "response_headers": {"Content-Type": "application/json", "X-Custom": "Ahmad-Mock"},
        "response_body": json.dumps([{"id": 1, "name": "Ahmad"}]),
        "response_type": "json",
    }
    create_res = client.post(
        "/api/v1/mocks",
        headers={"Authorization": f"Bearer {ahmad_token}"},
        json=mock_payload,
    )
    assert create_res.status_code == 201
    mock_data = create_res.json()
    mock_id = mock_data["id"]
    assert mock_data["username"] == "ahmad"
    assert mock_data["mock_url"] == "/mock/ahmad/users"

    # 4. Ahmad tries to create DUPLICATE Mock API: GET /users -> 409 Conflict
    dup_res = client.post(
        "/api/v1/mocks",
        headers={"Authorization": f"Bearer {ahmad_token}"},
        json=mock_payload,
    )
    assert dup_res.status_code == 409
    assert "already exists in your account" in dup_res.json()["detail"]

    # 5. Sarah creates the EXACT SAME Mock API: GET /users -> 201 Created (allowed for different user)
    sarah_create_res = client.post(
        "/api/v1/mocks",
        headers={"Authorization": f"Bearer {sarah_token}"},
        json={
            "name": "Sarah's Team Users",
            "method": "GET",
            "path": "/users",
            "status_code": 200,
            "response_body": json.dumps([{"id": 2, "name": "Sarah"}]),
            "response_type": "json",
        },
    )
    assert sarah_create_res.status_code == 201
    assert sarah_create_res.json()["username"] == "sarah"
    assert sarah_create_res.json()["mock_url"] == "/mock/sarah/users"

    # 6. Ahmad lists his mocks -> 1 mock found
    ahmad_list = client.get(
        "/api/v1/mocks",
        headers={"Authorization": f"Bearer {ahmad_token}"},
    )
    assert ahmad_list.status_code == 200
    assert len(ahmad_list.json()) == 1

    # 7. Sarah lists her mocks -> 1 mock found (her own)
    sarah_list = client.get(
        "/api/v1/mocks",
        headers={"Authorization": f"Bearer {sarah_token}"},
    )
    assert sarah_list.status_code == 200
    assert len(sarah_list.json()) == 1

    # 8. Sarah attempts to delete Ahmad's mock -> 404 Not Found in her account
    sarah_del = client.delete(
        f"/api/v1/mocks/{mock_id}",
        headers={"Authorization": f"Bearer {sarah_token}"},
    )
    assert sarah_del.status_code == 404

    # 9. PUBLIC EXECUTION WITHOUT AUTH: Both users' endpoints work independently
    ahmad_public = client.get("/mock/ahmad/users")
    assert ahmad_public.status_code == 200
    assert ahmad_public.json() == [{"id": 1, "name": "Ahmad"}]
    assert ahmad_public.headers["x-custom"] == "Ahmad-Mock"

    sarah_public = client.get("/mock/sarah/users")
    assert sarah_public.status_code == 200
    assert sarah_public.json() == [{"id": 2, "name": "Sarah"}]

    # 10. Ahmad deletes his account permanently
    del_acc = client.delete(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {ahmad_token}"},
    )
    assert del_acc.status_code == 200

    # 11. After Ahmad's deletion, Ahmad's endpoint is 404, but Sarah's endpoint still works
    public_after_del = client.get("/mock/ahmad/users")
    assert public_after_del.status_code == 404

    sarah_still_works = client.get("/mock/sarah/users")
    assert sarah_still_works.status_code == 200
    assert sarah_still_works.json() == [{"id": 2, "name": "Sarah"}]


def test_mock_api_authentication_and_delay(client):
    """Test Mock API with API Key auth, Bearer Token auth, and custom delay."""
    # 1. Register user
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Dev User",
            "username": "devuser",
            "email": "devuser@example.com",
            "password": "Password123!",
        },
    )
    token = reg.json()["access_token"]
    auth_header = {"Authorization": f"Bearer {token}"}

    # 2. Create Mock with API Key Auth & 50ms delay
    api_key_mock = client.post(
        "/api/v1/mocks",
        headers=auth_header,
        json={
            "name": "Protected by API Key",
            "method": "GET",
            "path": "/protected-apikey",
            "status_code": 200,
            "response_body": json.dumps({"secret": "key-data"}),
            "auth_type": "api_key",
            "auth_header_name": "X-Custom-Key",
            "auth_header_value": "secret-12345",
            "delay_ms": 50,
        },
    )
    assert api_key_mock.status_code == 201

    # Missing API Key -> 401 Unauthorized
    res_no_key = client.get("/mock/devuser/protected-apikey")
    assert res_no_key.status_code == 401

    # Wrong API Key -> 401 Unauthorized
    res_wrong_key = client.get("/mock/devuser/protected-apikey", headers={"X-Custom-Key": "wrong"})
    assert res_wrong_key.status_code == 401

    # Correct API Key -> 200 OK
    res_good_key = client.get("/mock/devuser/protected-apikey", headers={"X-Custom-Key": "secret-12345"})
    assert res_good_key.status_code == 200
    assert res_good_key.json() == {"secret": "key-data"}

    # 3. Create Mock with Bearer Token Auth
    bearer_mock = client.post(
        "/api/v1/mocks",
        headers=auth_header,
        json={
            "name": "Protected by Bearer",
            "method": "POST",
            "path": "/protected-bearer",
            "status_code": 201,
            "response_body": json.dumps({"status": "created"}),
            "auth_type": "bearer",
            "auth_token": "bearer-token-abc",
        },
    )
    assert bearer_mock.status_code == 201

    # Missing Bearer -> 401
    res_no_bearer = client.post("/mock/devuser/protected-bearer")
    assert res_no_bearer.status_code == 401

    # Wrong Bearer -> 401
    res_wrong_bearer = client.post("/mock/devuser/protected-bearer", headers={"Authorization": "Bearer invalid"})
    assert res_wrong_bearer.status_code == 401

    # Correct Bearer -> 201
    res_good_bearer = client.post("/mock/devuser/protected-bearer", headers={"Authorization": "Bearer bearer-token-abc"})
    assert res_good_bearer.status_code == 201
    assert res_good_bearer.json() == {"status": "created"}
