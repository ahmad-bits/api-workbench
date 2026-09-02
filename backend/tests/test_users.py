import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from app.core.security import verify_password, get_password_hash

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


def test_password_hashing_security():
    plain = "SuperSecretPassword123!"
    hashed = get_password_hash(plain)

    assert hashed != plain
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_register_user_success(client):
    payload = {
        "name": "Jane Doe",
        "username": "janedoe",
        "email": "jane.doe@example.com",
        "password": "SecurePassword123!",
    }
    response = client.post("/api/v1/users", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["name"] == "Jane Doe"
    assert data["username"] == "janedoe"
    assert data["email"] == "jane.doe@example.com"
    assert data["is_active"] is True
    assert "id" in data
    assert "created_at" in data
    assert "password" not in data
    assert "hashed_password" not in data

    db = TestingSessionLocal()
    db_user = db.query(User).filter(User.email == "jane.doe@example.com").first()
    assert db_user is not None
    assert db_user.hashed_password != "SecurePassword123!"
    assert verify_password("SecurePassword123!", db_user.hashed_password) is True
    db.close()


def test_register_duplicate_username_fails(client):
    client.post(
        "/api/v1/users",
        json={
            "name": "User One",
            "username": "uniquename",
            "email": "user1@example.com",
            "password": "Password123!",
        },
    )

    response = client.post(
        "/api/v1/users",
        json={
            "name": "User Two",
            "username": "uniquename",
            "email": "user2@example.com",
            "password": "Password123!",
        },
    )
    assert response.status_code == 400
    assert "already taken" in response.json()["detail"]


def test_register_duplicate_email_fails(client):
    payload = {
        "name": "Alice Smith",
        "username": "alicesmith",
        "email": "alice@example.com",
        "password": "Password123!",
    }
    first_res = client.post("/api/v1/users", json=payload)
    assert first_res.status_code == 201

    duplicate_payload = {
        "name": "Alice Duplicate",
        "username": "alicedup",
        "email": "alice@example.com",
        "password": "DifferentPassword123!",
    }
    dup_res = client.post("/api/v1/users", json=duplicate_payload)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]


def test_get_user_by_id(client):
    reg = client.post(
        "/api/v1/users",
        json={
            "name": "Query User",
            "username": "queryuser",
            "email": "query@example.com",
            "password": "SecretPassword123!",
        },
    )
    user_id = reg.json()["id"]

    res = client.get(f"/api/v1/users/{user_id}")
    assert res.status_code == 200
    assert res.json()["username"] == "queryuser"


def test_list_users(client):
    client.post(
        "/api/v1/users",
        json={
            "name": "User A",
            "username": "usera",
            "email": "a@example.com",
            "password": "Password123!",
        },
    )
    client.post(
        "/api/v1/users",
        json={
            "name": "User B",
            "username": "userb",
            "email": "b@example.com",
            "password": "Password123!",
        },
    )

    res = client.get("/api/v1/users")
    assert res.status_code == 200
    users = res.json()
    assert len(users) == 2
