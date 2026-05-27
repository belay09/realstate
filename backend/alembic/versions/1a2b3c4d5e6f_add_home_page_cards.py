"""add home page cards table

Revision ID: 1a2b3c4d5e6f
Revises: 7f3e9b6c1a2d
Create Date: 2026-05-27 18:28:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "1a2b3c4d5e6f"
down_revision: str | Sequence[str] | None = "7f3e9b6c1a2d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "home_page_cards",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("card_key", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("tag", sa.String(length=64), nullable=True),
        sa.Column("image_url", sa.String(length=2048), nullable=True),
        sa.Column("to_path", sa.String(length=255), nullable=False, server_default="/"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("card_key"),
    )
    op.create_index(op.f("ix_home_page_cards_card_key"), "home_page_cards", ["card_key"], unique=True)
    op.create_index(op.f("ix_home_page_cards_is_active"), "home_page_cards", ["is_active"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_home_page_cards_is_active"), table_name="home_page_cards")
    op.drop_index(op.f("ix_home_page_cards_card_key"), table_name="home_page_cards")
    op.drop_table("home_page_cards")
