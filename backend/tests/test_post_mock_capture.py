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


def test_post_mock_configured_response_and_minimal_history(client):
    # 1. Register a test user
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

    # 2. Create a POST mock with configured Response JSON
    configured_response = {
        "message": "User created successfully",
        "id": 123,
    }
    create_res = client.post(
        "/api/v1/mocks",
        headers=headers,
        json={
            "name": "Create User Mock",
            "method": "POST",
            "path": "/users",
            "status_code": 201,
            "response_body": json.dumps(configured_response),
        },
    )
    assert create_res.status_code == 201
    mock_data = create_res.json()
    mock_id = mock_data["id"]
    assert mock_data["username"] == "ahmad"
    assert mock_data["mock_url"] == "/mock/ahmad/users"

    # 3. Client sends first POST request with arbitrary data
    client_payload1 = {
        "name": "Ahmad",
        "email": "ahmad@gmail.com",
    }
    client_res1 = client.post(
        "/mock/ahmad/users",
        json=client_payload1,
    )
    assert client_res1.status_code == 201
    assert client_res1.json() == configured_response

    # 4. Client sends second POST request with different arbitrary data
    client_payload2 = {
        "name": "Ali",
        "age": 24,
    }
    client_res2 = client.post(
        "/mock/ahmad/users",
        json=client_payload2,
    )
    assert client_res2.status_code == 201
    assert client_res2.json() == configured_response

    # 5. Fetch request history for the POST mock
    hist_res = client.get(
        f"/api/v1/mocks/{mock_id}/history",
        headers=headers,
    )
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) == 2

    # Verify latest entry: contains received data and time ONLY (plus id, mock_id)
    latest = history[0]
    assert "Ali" in latest["body"]
    assert "created_at" in latest
    # Ensure no headers, query_params, method, status_code in history item
    assert "headers" not in latest
    assert "query_params" not in latest
    assert "method" not in latest
    assert "status_code" not in latest

    # Verify first entry
    first = history[1]
    assert "Ahmad" in first["body"]
    assert "created_at" in first

    # 6. Test clear request history
    clear_res = client.delete(
        f"/api/v1/mocks/{mock_id}/history",
        headers=headers,
    )
    assert clear_res.status_code == 200
    assert clear_res.json()["success"] is True

    hist_after_clear = client.get(
        f"/api/v1/mocks/{mock_id}/history",
        headers=headers,
    )
    assert hist_after_clear.status_code == 200
    assert len(hist_after_clear.json()) == 0


def test_get_mock_does_not_record_history(client):
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Sara",
            "username": "sara",
            "email": "sara@example.com",
            "password": "Password123!",
        },
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/mocks",
        headers=headers,
        json={
            "name": "Get Products",
            "method": "GET",
            "path": "/products",
            "status_code": 200,
            "response_body": json.dumps([{"id": 1, "name": "Desk"}]),
        },
    )
    assert create_res.status_code == 201
    mock_id = create_res.json()["id"]

    get_res = client.get("/mock/sara/products")
    assert get_res.status_code == 200
    assert get_res.json() == [{"id": 1, "name": "Desk"}]

    hist_res = client.get(
        f"/api/v1/mocks/{mock_id}/history",
        headers=headers,
    )
    assert hist_res.status_code == 200
    assert len(hist_res.json()) == 0
