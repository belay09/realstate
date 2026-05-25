"""Create or update an admin user (assigns the `admin` role)."""

from __future__ import annotations

import argparse
import sys

from sqlalchemy.orm import Session, selectinload

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.identity import Role, User


def _admin_role(db: Session) -> Role:
    role = db.query(Role).filter(Role.name == "admin").first()
    if role is None:
        print(
            "Error: role 'admin' not found. Run Alembic migrations (including seed roles).",
            file=sys.stderr,
        )
        sys.exit(1)
    return role


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create a new admin user or update an existing user's password and admin role.",
    )
    parser.add_argument("--email", required=True, help="Login email (stored lowercased)")
    parser.add_argument("--password", required=True, help="Plain password (hashed before storage)")
    parser.add_argument(
        "--full-name",
        default="Administrator",
        dest="full_name",
        help="Display name (default: Administrator)",
    )
    args = parser.parse_args()

    email = args.email.strip().lower()
    if not email:
        print("Error: empty email.", file=sys.stderr)
        sys.exit(1)

    db = SessionLocal()
    try:
        admin = _admin_role(db)
        user = (
            db.query(User)
            .options(selectinload(User.roles))
            .filter(User.email == email)
            .first()
        )
        if user is None:
            user = User(
                email=email,
                password_hash=hash_password(args.password),
                full_name=args.full_name.strip() or None,
                is_active=True,
            )
            user.roles.append(admin)
            db.add(user)
            db.commit()
            print(f"Created admin user: {email}")
            return

        user.password_hash = hash_password(args.password)
        user.full_name = args.full_name.strip() or user.full_name
        user.is_active = True
        role_names = {r.name for r in user.roles}
        if "admin" not in role_names:
            user.roles.append(admin)
        db.commit()
        print(f"Updated admin user (password + admin role): {email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
