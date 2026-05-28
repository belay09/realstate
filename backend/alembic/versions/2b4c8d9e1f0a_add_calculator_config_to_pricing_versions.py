"""add calculator_config to pricing_versions

Revision ID: 2b4c8d9e1f0a
Revises: 1a2b3c4d5e6f
Create Date: 2026-05-27 18:45:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "2b4c8d9e1f0a"
down_revision: str | Sequence[str] | None = "1a2b3c4d5e6f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "pricing_versions",
        sa.Column("calculator_config", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("pricing_versions", "calculator_config")
