"""add location content tables

Revision ID: 7f3e9b6c1a2d
Revises: c4f8a2b91d3e
Create Date: 2026-05-27 15:18:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "7f3e9b6c1a2d"
down_revision: str | Sequence[str] | None = "c4f8a2b91d3e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "location_content",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("location_id", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("subtitle", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("video_url", sa.String(length=2048), nullable=True),
        sa.Column("cards", sa.JSON(), nullable=False),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.true()),
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
        sa.UniqueConstraint("kind", "location_id", name="uq_location_content_kind_location"),
    )
    op.create_index(op.f("ix_location_content_is_public"), "location_content", ["is_public"], unique=False)
    op.create_index(op.f("ix_location_content_kind"), "location_content", ["kind"], unique=False)
    op.create_index(op.f("ix_location_content_location_id"), "location_content", ["location_id"], unique=False)

    op.create_table(
        "location_media",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "location_content_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("url", sa.String(length=2048), nullable=False),
        sa.Column("media_type", sa.String(length=16), nullable=False),
        sa.Column("caption", sa.String(length=512), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["location_content_id"],
            ["location_content.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_location_media_location_content_id"),
        "location_media",
        ["location_content_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_location_media_location_content_id"), table_name="location_media")
    op.drop_table("location_media")
    op.drop_index(op.f("ix_location_content_location_id"), table_name="location_content")
    op.drop_index(op.f("ix_location_content_kind"), table_name="location_content")
    op.drop_index(op.f("ix_location_content_is_public"), table_name="location_content")
    op.drop_table("location_content")
