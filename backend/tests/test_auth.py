from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_login_wrong_password(db_available: None, admin_user: tuple[str, str]) -> None:
    email, _ = admin_user
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_login_success(db_available: None, admin_user: tuple[str, str]) -> None:
    email, password = admin_user
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data.get("token_type") == "bearer"
    assert data.get("expires_in", 0) > 0


def test_admin_ping_without_token(db_available: None) -> None:
    response = client.get("/api/v1/admin/ping")
    assert response.status_code == 401


def test_admin_ping_with_token(db_available: None, admin_user: tuple[str, str]) -> None:
    email, password = admin_user
    token = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    ).json()["access_token"]
    response = client.get(
        "/api/v1/admin/ping",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["scope"] == "admin"


def test_me_with_token(db_available: None, admin_user: tuple[str, str]) -> None:
    email, password = admin_user
    token = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    ).json()["access_token"]
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == email
    assert "admin" in body["roles"]
