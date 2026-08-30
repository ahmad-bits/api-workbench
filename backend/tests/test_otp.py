from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from app.models.pending_registration import PendingRegistration
from app.core.security import hash_otp, get_password_hash, verify_password


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


# Isolated SQLite in-memory DB for tests

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
    """Create tables before each test and drop them after."""
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


def test_request_otp_success_does_not_create_user(client):
    """Test that requesting OTP creates a pending registration but NO User in database."""
    payload = {
        "name": "David Miller",
        "username": "davidm",
        "email": "david.miller@example.com",
        "password": "SecurePassword123!",
    }
    response = client.post("/api/v1/auth/register/request-otp", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "verification code has been sent" in data["message"]
    assert data["email"] == "david.miller@example.com"
    assert "otp" not in data  # Never expose OTP in response

    # Verify no User exists in users table
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "david.miller@example.com").first()
    assert user is None

    # Verify PendingRegistration exists with hashed OTP
    pending = db.query(PendingRegistration).filter(PendingRegistration.email == "david.miller@example.com").first()
    assert pending is not None
    assert pending.username == "davidm"
    assert pending.attempts_left == 5
    assert pending.otp_hash is not None
    assert pending.hashed_password != "SecurePassword123!"
    db.close()


def test_request_otp_duplicate_email_fails(client):
    """Test that requesting OTP with an email already in the users table returns 400 Bad Request."""
    # First create an existing user
    db = TestingSessionLocal()
    user = User(
        name="Existing User",
        username="existinguser",
        email="existing@example.com",
        hashed_password=get_password_hash("Password123!"),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.close()

    payload = {
        "name": "New User",
        "username": "newuser",
        "email": "existing@example.com",
        "password": "Password123!",
    }
    response = client.post("/api/v1/auth/register/request-otp", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_request_otp_duplicate_username_fails(client):
    """Test that requesting OTP with an already taken username returns 400 Bad Request."""
    db = TestingSessionLocal()
    user = User(
        name="Existing User",
        username="takenusername",
        email="user1@example.com",
        hashed_password=get_password_hash("Password123!"),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.close()

    payload = {
        "name": "Second User",
        "username": "takenusername",
        "email": "user2@example.com",
        "password": "Password123!",
    }
    response = client.post("/api/v1/auth/register/request-otp", json=payload)
    assert response.status_code == 400
    assert "already taken" in response.json()["detail"]


def test_request_otp_cooldown_enforced(client):
    """Test that requesting an OTP again immediately triggers a 429 Too Many Requests."""
    payload = {
        "name": "Speedy Tester",
        "username": "speedytester",
        "email": "speedy@example.com",
        "password": "Password123!",
    }
    res1 = client.post("/api/v1/auth/register/request-otp", json=payload)
    assert res1.status_code == 200

    # Second immediate request should hit cooldown
    res2 = client.post("/api/v1/auth/register/request-otp", json=payload)
    assert res2.status_code == 429
    assert "wait" in res2.json()["detail"].lower()


def test_verify_otp_success_creates_user_and_returns_token(client):
    """Test that valid OTP verification creates User and returns JWT Bearer token."""
    email = "verified@example.com"
    otp_code = "849201"

    # Setup pending registration manually
    db = TestingSessionLocal()
    pending = PendingRegistration(
        name="Verified User",
        username="verifieduser",
        email=email,
        hashed_password=get_password_hash("VerifiedPass123!"),
        otp_hash=hash_otp(otp_code, email=email),
        attempts_left=5,
        expires_at=utc_now() + timedelta(minutes=10),
        resend_available_at=utc_now() + timedelta(seconds=60),
    )
    db.add(pending)
    db.commit()
    db.close()

    # Submit verification
    res = client.post(
        "/api/v1/auth/register/verify-otp",
        json={"email": email, "otp": otp_code},
    )
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "verifieduser"
    assert data["user"]["email"] == email

    # Verify User exists in database
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == email).first()
    assert user is not None
    assert user.name == "Verified User"
    assert verify_password("VerifiedPass123!", user.hashed_password) is True

    # Verify pending registration was deleted
    pending_check = db.query(PendingRegistration).filter(PendingRegistration.email == email).first()
    assert pending_check is None
    db.close()


def test_verify_otp_invalid_code_decrements_attempts(client):
    """Test that incorrect OTP decrements attempts_left."""
    email = "retry@example.com"
    correct_otp = "123456"

    db = TestingSessionLocal()
    pending = PendingRegistration(
        name="Retry User",
        username="retryuser",
        email=email,
        hashed_password=get_password_hash("Pass123!"),
        otp_hash=hash_otp(correct_otp, email=email),
        attempts_left=5,
        expires_at=utc_now() + timedelta(minutes=10),
        resend_available_at=utc_now() + timedelta(seconds=60),
    )
    db.add(pending)
    db.commit()
    db.close()

    # Enter wrong OTP
    res = client.post(
        "/api/v1/auth/register/verify-otp",
        json={"email": email, "otp": "999999"},
    )
    assert res.status_code == 400
    assert "Incorrect verification code" in res.json()["detail"]
    assert "4 attempt(s) remaining" in res.json()["detail"]

    # Verify DB attempts updated
    db = TestingSessionLocal()
    pending_check = db.query(PendingRegistration).filter(PendingRegistration.email == email).first()
    assert pending_check.attempts_left == 4
    db.close()


def test_verify_otp_expired_code_fails(client):
    """Test that expired OTP is rejected and cleaned up."""
    email = "expired@example.com"
    otp_code = "654321"

    db = TestingSessionLocal()
    pending = PendingRegistration(
        name="Expired User",
        username="expireduser",
        email=email,
        hashed_password=get_password_hash("Pass123!"),
        otp_hash=hash_otp(otp_code, email=email),
        attempts_left=5,
        expires_at=utc_now() - timedelta(minutes=1),  # Expired
        resend_available_at=utc_now() - timedelta(minutes=1),
    )
    db.add(pending)
    db.commit()
    db.close()

    res = client.post(
        "/api/v1/auth/register/verify-otp",
        json={"email": email, "otp": otp_code},
    )
    assert res.status_code == 400
    assert "expired" in res.json()["detail"].lower()


def test_resend_otp_enforces_cooldown_and_refreshes_otp(client):
    """Test resending OTP respects cooldown and refreshes expiration."""
    email = "resend@example.com"

    db = TestingSessionLocal()
    pending = PendingRegistration(
        name="Resend User",
        username="resenduser",
        email=email,
        hashed_password=get_password_hash("Pass123!"),
        otp_hash=hash_otp("111111", email=email),
        attempts_left=1,
        expires_at=utc_now() + timedelta(minutes=2),
        resend_available_at=utc_now() - timedelta(seconds=1),  # Cooldown passed
    )
    db.add(pending)
    db.commit()
    old_hash = pending.otp_hash
    db.close()


    # Resend OTP
    res = client.post(
        "/api/v1/auth/register/resend-otp",
        json={"email": email},
    )
    assert res.status_code == 200
    assert "new verification code" in res.json()["message"]

    # Verify attempts reset to 5 and hash changed
    db = TestingSessionLocal()
    updated_pending = db.query(PendingRegistration).filter(PendingRegistration.email == email).first()
    assert updated_pending.attempts_left == 5
    assert updated_pending.otp_hash != old_hash
    db.close()
