import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.saved_api import SavedApi

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


def test_saved_api_lifecycle_with_encrypted_key(client):
    """Test creating, listing, opening, updating, and deleting a Saved API with encryption."""
    # 1. Register User
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

    # 2. Save API with optional API key
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
    # Never expose plain key in standard response
    assert "api_key" not in data or data.get("api_key") is None

    # 3. Verify in SQLite that the stored key is encrypted (not plaintext)
    db = TestingSessionLocal()
    raw_record = db.query(SavedApi).filter(SavedApi.id == api_id).first()
    assert raw_record is not None
    assert raw_record.encrypted_api_key is not None
    assert raw_record.encrypted_api_key != secret_key
    assert "sk_live" not in raw_record.encrypted_api_key
    db.close()

    # 4. List Saved APIs -> masked key returned
    list_res = client.get("/api/v1/saved-apis", headers=headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) == 1
    assert items[0]["id"] == api_id
    assert items[0]["api_key_masked"] == "••••••••"
    assert items[0]["has_api_key"] is True

    # 5. Open in Workbench -> retrieves decrypted plain key exclusively for tester
    open_res = client.get(f"/api/v1/saved-apis/{api_id}/open", headers=headers)
    assert open_res.status_code == 200
    open_data = open_res.json()
    assert open_data["id"] == api_id
    assert open_data["name"] == "Stripe Payments API"
    assert open_data["url"] == "https://api.stripe.com/v1/charges"
    assert open_data["api_key"] == secret_key
    assert open_data["has_api_key"] is True

    # 6. Update Saved API (change name and URL)
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

    # 7. Delete Saved API
    del_res = client.delete(f"/api/v1/saved-apis/{api_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 8. Verify deleted -> 404
    get_del = client.get(f"/api/v1/saved-apis/{api_id}", headers=headers)
    assert get_del.status_code == 404


def test_saved_api_optional_key_behavior(client):
    """Test saving an API without an API key (optional key)."""
    # 1. Register
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

    # 2. Save API without API key
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

    # 3. Open -> key is None
    open_res = client.get(f"/api/v1/saved-apis/{data['id']}/open", headers=headers)
    assert open_res.status_code == 200
    assert open_res.json()["api_key"] is None
    assert open_res.json()["has_api_key"] is False


def test_saved_api_user_isolation(client):
    """Test strict user isolation: User B cannot view, open, edit, or delete User A's saved APIs."""
    # 1. Register User A
    reg_a = client.post(
        "/api/v1/auth/register",
        json={"name": "Alice", "username": "alice", "email": "alice@test.com", "password": "Password123!"},
    )
    token_a = reg_a.json()["access_token"]

    # 2. Register User B
    reg_b = client.post(
        "/api/v1/auth/register",
        json={"name": "Bob", "username": "bob", "email": "bob@test.com", "password": "Password123!"},
    )
    token_b = reg_b.json()["access_token"]

    # 3. Alice saves an API with secret key
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

    # 4. Bob lists saved APIs -> 0 returned
    bob_list = client.get(
        "/api/v1/saved-apis",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert bob_list.status_code == 200
    assert len(bob_list.json()) == 0

    # 5. Bob tries to get Alice's API -> 404 Not Found
    bob_get = client.get(
        f"/api/v1/saved-apis/{alice_api_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert bob_get.status_code == 404

    # 6. Bob tries to open / decrypt Alice's API -> 404 Not Found
    bob_open = client.get(
        f"/api/v1/saved-apis/{alice_api_id}/open",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert bob_open.status_code == 404

    # 7. Bob tries to update Alice's API -> 404 Not Found
    bob_put = client.put(
        f"/api/v1/saved-apis/{alice_api_id}",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"name": "Hacked Name"},
    )
    assert bob_put.status_code == 404

    # 8. Bob tries to delete Alice's API -> 404 Not Found
    bob_del = client.delete(
        f"/api/v1/saved-apis/{alice_api_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert bob_del.status_code == 404
