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


def test_login_with_email_and_username(client):
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Jane Doe",
            "username": "janedoe",
            "email": "jane.doe@example.com",
            "password": "Password123!",
        },
    )
    assert reg_res.status_code == 201

    login_email = client.post(
        "/api/v1/auth/login",
        json={
            "username_or_email": "jane.doe@example.com",
            "password": "Password123!",
        },
    )
    assert login_email.status_code == 200
    assert login_email.json()["user"]["username"] == "janedoe"

    login_username = client.post(
        "/api/v1/auth/login",
        json={
            "username_or_email": "janedoe",
            "password": "Password123!",
        },
    )
    assert login_username.status_code == 200
    assert login_username.json()["user"]["email"] == "jane.doe@example.com"


def test_login_invalid_password(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Auth Tester",
            "username": "authtester",
            "email": "auth@example.com",
            "password": "CorrectPassword",
        },
    )

    res = client.post(
        "/api/v1/auth/login",
        json={
            "username_or_email": "authtester",
            "password": "WrongPassword",
        },
    )
    assert res.status_code == 401
    assert "Incorrect" in res.json()["detail"]


def test_get_current_user_me(client):
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Alex Dev",
            "username": "alexdev",
            "email": "alex@example.com",
            "password": "Password123!",
        },
    )
    token = reg.json()["access_token"]

    res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["username"] == "alexdev"
