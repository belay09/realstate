"""add listing_metadata to property_listings

Revision ID: 3c8f1a2b9d0e
Revises: 2b4c8d9e1f0a
Create Date: 2026-05-29

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "3c8f1a2b9d0e"
down_revision: str | None = "2b4c8d9e1f0a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "property_listings",
        sa.Column("listing_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("property_listings", "listing_metadata")
