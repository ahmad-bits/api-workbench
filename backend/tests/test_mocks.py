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

    # 4. Ahmad lists his mocks -> 1 mock found
    ahmad_list = client.get(
        "/api/v1/mocks",
        headers={"Authorization": f"Bearer {ahmad_token}"},
    )
    assert ahmad_list.status_code == 200
    assert len(ahmad_list.json()) == 1

    # 5. Sarah lists her mocks -> 0 mocks found (strict isolation)
    sarah_list = client.get(
        "/api/v1/mocks",
        headers={"Authorization": f"Bearer {sarah_token}"},
    )
    assert sarah_list.status_code == 200
    assert len(sarah_list.json()) == 0

    # 6. Sarah attempts to delete Ahmad's mock -> 404 Not Found in her account
    sarah_del = client.delete(
        f"/api/v1/mocks/{mock_id}",
        headers={"Authorization": f"Bearer {sarah_token}"},
    )
    assert sarah_del.status_code == 404

    # 7. PUBLIC EXECUTION WITHOUT AUTH: Anyone can send requests to /mock/ahmad/users
    public_res = client.get("/mock/ahmad/users")
    assert public_res.status_code == 200
    assert public_res.json() == [{"id": 1, "name": "Ahmad"}]
    assert public_res.headers["x-custom"] == "Ahmad-Mock"

    # 8. Ahmad deletes his account permanently
    del_acc = client.delete(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {ahmad_token}"},
    )
    assert del_acc.status_code == 200

    # 9. After account deletion, the public mock endpoint /mock/ahmad/users returns 404
    public_after_del = client.get("/mock/ahmad/users")
    assert public_after_del.status_code == 404
