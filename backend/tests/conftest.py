import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import SessionLocal, engine
from app.main import app
from app.models.identity import Role, User


@pytest.fixture(scope="session")
def db_available() -> None:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except OSError as exc:
        pytest.skip(f"Database unreachable: {exc}")
    except Exception as exc:
        pytest.skip(f"Database unavailable: {exc}")


@pytest.fixture
def admin_user(db_available: None) -> tuple[str, str]:
    email = f"auth_test_{uuid.uuid4().hex[:12]}@example.com"
    password = "test-secret-password-1"
    db: Session = SessionLocal()
    try:
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if admin_role is None:
            admin_role = Role(name="admin", description="Test seed")
            db.add(admin_role)
            db.flush()

        user = User(
            email=email,
            password_hash=hash_password(password),
            full_name="Auth Test Admin",
            is_active=True,
        )
        user.roles.append(admin_role)
        db.add(user)
        db.commit()
        yield email, password
    finally:
        db.query(User).filter(User.email == email).delete(synchronize_session=False)
        db.commit()
        db.close()


@pytest.fixture
def admin_auth_headers(admin_user: tuple[str, str]) -> dict[str, str]:
    email, password = admin_user
    client = TestClient(app)
    token = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
