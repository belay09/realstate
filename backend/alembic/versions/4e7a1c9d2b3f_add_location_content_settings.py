"""add settings json to location_content

Revision ID: 4e7a1c9d2b3f
Revises: 3c8f1a2b9d0e
Create Date: 2026-05-29

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "4e7a1c9d2b3f"
down_revision: str | None = "3c8f1a2b9d0e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "location_content",
        sa.Column("settings", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("location_content", "settings")
