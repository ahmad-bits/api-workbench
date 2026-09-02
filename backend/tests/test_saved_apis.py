import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.saved_api import SavedApi

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


def test_saved_api_lifecycle_with_encrypted_key(client):
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Alex Developer",
            "username": "alex",
            "email": "alex@example.com",
            "password": "Password123!",
        },
    )
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    secret_key = "sk_live_very_secret_api_token_999"
    create_res = client.post(
        "/api/v1/saved-apis",
        headers=headers,
        json={
            "name": "Stripe Payments API",
            "url": "https://api.stripe.com/v1/charges",
            "api_key": secret_key,
        },
    )
    assert create_res.status_code == 201
    data = create_res.json()
    api_id = data["id"]
    assert data["name"] == "Stripe Payments API"
    assert data["url"] == "https://api.stripe.com/v1/charges"
    assert data["has_api_key"] is True
    assert data["api_key_masked"] == "••••••••"
    assert "api_key" not in data or data.get("api_key") is None

    db = TestingSessionLocal()
    raw_record = db.query(SavedApi).filter(SavedApi.id == api_id).first()
    assert raw_record is not None
    assert raw_record.encrypted_api_key is not None
    assert raw_record.encrypted_api_key != secret_key
    assert "sk_live" not in raw_record.encrypted_api_key
    db.close()

    list_res = client.get("/api/v1/saved-apis", headers=headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) == 1
    assert items[0]["id"] == api_id
    assert items[0]["api_key_masked"] == "••••••••"
    assert items[0]["has_api_key"] is True

    open_res = client.get(f"/api/v1/saved-apis/{api_id}/open", headers=headers)
    assert open_res.status_code == 200
    open_data = open_res.json()
    assert open_data["id"] == api_id
    assert open_data["name"] == "Stripe Payments API"
    assert open_data["url"] == "https://api.stripe.com/v1/charges"
    assert open_data["api_key"] == secret_key
    assert open_data["has_api_key"] is True

    update_res = client.put(
        f"/api/v1/saved-apis/{api_id}",
        headers=headers,
        json={
            "name": "Stripe Charges API V2",
            "url": "https://api.stripe.com/v2/charges",
        },
    )
    assert update_res.status_code == 200
    up_data = update_res.json()
    assert up_data["name"] == "Stripe Charges API V2"
    assert up_data["url"] == "https://api.stripe.com/v2/charges"
    assert up_data["has_api_key"] is True

    del_res = client.delete(f"/api/v1/saved-apis/{api_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    get_del = client.get(f"/api/v1/saved-apis/{api_id}", headers=headers)
    assert get_del.status_code == 404


def test_saved_api_optional_key_behavior(client):
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Taylor",
            "username": "taylor",
            "email": "taylor@example.com",
            "password": "Password123!",
        },
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/saved-apis",
        headers=headers,
        json={
            "name": "JSONPlaceholder Posts",
            "url": "https://jsonplaceholder.typicode.com/posts",
        },
    )
    assert create_res.status_code == 201
    data = create_res.json()
    assert data["has_api_key"] is False
    assert data["api_key_masked"] is None

    open_res = client.get(f"/api/v1/saved-apis/{data['id']}/open", headers=headers)
    assert open_res.status_code == 200
    assert open_res.json()["api_key"] is None
    assert open_res.json()["has_api_key"] is False


def test_saved_api_user_isolation(client):
    reg_a = client.post(
        "/api/v1/auth/register",
        json={"name": "Alice", "username": "alice", "email": "alice@test.com", "password": "Password123!"},
    )
    token_a = reg_a.json()["access_token"]

    reg_b = client.post(
        "/api/v1/auth/register",
        json={"name": "Bob", "username": "bob", "email": "bob@test.com", "password": "Password123!"},
    )
    token_b = reg_b.json()["access_token"]

    create_res = client.post(
        "/api/v1/saved-apis",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "name": "Alice Private API",
            "url": "https://alice-corp.com/api",
            "api_key": "alice_secret_token_123",
        },
    )
    alice_api_id = create_res.json()["id"]

    bob_list = client.get(
        "/api/v1/saved-apis",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert bob_list.status_code == 200
    assert len(bob_list.json()) == 0

    bob_get = client.get(
        f"/api/v1/saved-apis/{alice_api_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert bob_get.status_code == 404

    bob_open = client.get(
        f"/api/v1/saved-apis/{alice_api_id}/open",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert bob_open.status_code == 404

    bob_put = client.put(
        f"/api/v1/saved-apis/{alice_api_id}",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"name": "Hacked Name"},
    )
    assert bob_put.status_code == 404

    bob_del = client.delete(
        f"/api/v1/saved-apis/{alice_api_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert bob_del.status_code == 404


def test_delete_workspace_deletes_all_endpoints(client):
    reg = client.post(
        "/api/v1/auth/register",
        json={"name": "Sarah", "username": "sarah", "email": "sarah@test.com", "password": "Password123!"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    client.post(
        "/api/v1/saved-apis",
        headers=headers,
        json={"name": "Match Stats", "url": "https://pubg.api/stats", "category": "PUBG"},
    )
    client.post(
        "/api/v1/saved-apis",
        headers=headers,
        json={"name": "Player Profile", "url": "https://pubg.api/player", "category": "PUBG"},
    )

    client.post(
        "/api/v1/saved-apis",
        headers=headers,
        json={"name": "General Endpoint", "url": "https://api.example.com", "category": "General"},
    )

    list_res = client.get("/api/v1/saved-apis", headers=headers)
    assert len(list_res.json()) == 3

    del_res = client.delete("/api/v1/saved-apis/workspace/PUBG", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["deleted_count"] == 2

    remaining_res = client.get("/api/v1/saved-apis", headers=headers)
    items = remaining_res.json()
    assert len(items) == 1
    assert items[0]["name"] == "General Endpoint"
