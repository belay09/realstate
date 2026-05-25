"""Seed default identity roles.

Revision ID: c4f8a2b91d3e
Revises: 905078751efe
Create Date: 2026-05-15

"""

from alembic import op
import sqlalchemy as sa

revision = "c4f8a2b91d3e"
down_revision = "905078751efe"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text("""
        INSERT INTO roles (id, name, description)
        SELECT gen_random_uuid(), 'admin', 'Platform administrator'
        WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin')
        """)
    )
    op.execute(
        sa.text("""
        INSERT INTO roles (id, name, description)
        SELECT gen_random_uuid(), 'agent', 'Sales agent'
        WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'agent')
        """)
    )


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM roles WHERE name IN ('admin', 'agent')"))
