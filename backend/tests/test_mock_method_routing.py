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


def test_multiple_mocks_same_path_different_methods_routing(client):
    # 1. Register a test user
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Router User",
            "username": "routeruser",
            "email": "routeruser@example.com",
            "password": "Password123!",
        },
    )
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    auth_header = {"Authorization": f"Bearer {token}"}

    shared_path = "/api/v1/resource"

    # 2. Create GET mock
    get_res = client.post(
        "/api/v1/mocks",
        headers=auth_header,
        json={
            "name": "GET Resource",
            "method": "GET",
            "path": shared_path,
            "status_code": 200,
            "response_body": json.dumps({"handled_by": "GET"}),
        },
    )
    assert get_res.status_code == 201

    # 3. Create POST mock
    post_res = client.post(
        "/api/v1/mocks",
        headers=auth_header,
        json={
            "name": "POST Resource",
            "method": "POST",
            "path": shared_path,
            "status_code": 201,
            "response_body": json.dumps({"handled_by": "POST"}),
        },
    )
    assert post_res.status_code == 201
    post_mock_id = post_res.json()["id"]

    # 4. Create PUT mock
    put_res = client.post(
        "/api/v1/mocks",
        headers=auth_header,
        json={
            "name": "PUT Resource",
            "method": "PUT",
            "path": shared_path,
            "status_code": 200,
            "response_body": json.dumps({"handled_by": "PUT"}),
            "initial_resource_data": json.dumps({"name": "Initial Name", "age": 20}),
        },
    )
    assert put_res.status_code == 201
    put_mock_id = put_res.json()["id"]

    # 5. Create PATCH mock
    patch_res = client.post(
        "/api/v1/mocks",
        headers=auth_header,
        json={
            "name": "PATCH Resource",
            "method": "PATCH",
            "path": shared_path,
            "status_code": 200,
            "response_body": json.dumps({"handled_by": "PATCH"}),
            "initial_resource_data": json.dumps({"name": "Patch Initial", "city": "NYC"}),
        },
    )
    assert patch_res.status_code == 201
    patch_mock_id = patch_res.json()["id"]

    # 6. Create DELETE mock
    del_mock_res = client.post(
        "/api/v1/mocks",
        headers=auth_header,
        json={
            "name": "DELETE Resource",
            "method": "DELETE",
            "path": shared_path,
            "status_code": 200,
            "response_body": json.dumps({"handled_by": "DELETE"}),
        },
    )
    assert del_mock_res.status_code == 201

    # 7. Duplicate check: Creating another GET mock on the same path must return 409
    dup_res = client.post(
        "/api/v1/mocks",
        headers=auth_header,
        json={
            "name": "Duplicate GET",
            "method": "GET",
            "path": shared_path,
        },
    )
    assert dup_res.status_code == 409

    # 8. Test GET request routes to GET mock
    client_get = client.get("/mock/routeruser/api/v1/resource")
    assert client_get.status_code == 200
    assert client_get.json() == {"handled_by": "GET"}

    # 9. Test POST request routes to POST mock
    client_post = client.post(
        "/mock/routeruser/api/v1/resource",
        json={"name": "New Item", "price": 99},
    )
    assert client_post.status_code == 201
    assert client_post.json() == {"handled_by": "POST"}

    # Verify history recorded for POST
    post_history = client.get(f"/api/v1/mocks/{post_mock_id}/history", headers=auth_header)
    assert post_history.status_code == 200
    assert len(post_history.json()) == 1
    assert "New Item" in post_history.json()[0]["body"]

    # 10. Test PUT request routes to PUT mock
    client_put = client.put(
        "/mock/routeruser/api/v1/resource",
        json={"name": "Replaced Name", "age": 25, "active": True},
    )
    assert client_put.status_code == 200
    assert client_put.json() == {"handled_by": "PUT"}

    # Verify PUT history recorded
    put_history = client.get(f"/api/v1/mocks/{put_mock_id}/history", headers=auth_header)
    assert len(put_history.json()) == 1

    # 11. Test PATCH request routes to PATCH mock
    client_patch = client.patch(
        "/mock/routeruser/api/v1/resource",
        json={"city": "Boston"},
    )
    assert client_patch.status_code == 200
    assert client_patch.json() == {"handled_by": "PATCH"}

    # Verify PATCH history recorded
    patch_history = client.get(f"/api/v1/mocks/{patch_mock_id}/history", headers=auth_header)
    assert len(patch_history.json()) == 1

    # 12. Test DELETE request routes to DELETE mock
    client_del = client.delete("/mock/routeruser/api/v1/resource")
    assert client_del.status_code == 200
    assert client_del.json() == {"handled_by": "DELETE"}

    # 13. Test an unconfigured method (OPTIONS) returns 405 Method Not Allowed with Allow header
    client_options = client.options("/mock/routeruser/api/v1/resource")
    assert client_options.status_code == 405
    allow_header = client_options.headers.get("Allow", "")
    for expected_method in ["GET", "POST", "PUT", "PATCH", "DELETE"]:
        assert expected_method in allow_header

    # 14. Test an unconfigured path returns 404 Mock Not Found
    client_404 = client.get("/mock/routeruser/api/v1/unknown")
    assert client_404.status_code == 404
