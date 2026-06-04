"""add location_promotions

Revision ID: 8d2f4a1c0b9e
Revises: 4e7a1c9d2b3f
Create Date: 2026-05-29

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "8d2f4a1c0b9e"
down_revision: Union[str, None] = "4e7a1c9d2b3f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "location_promotions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("location_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("discount_percent", sa.Numeric(precision=8, scale=4), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_location_promotions_company_id"),
        "location_promotions",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_location_promotions_kind"), "location_promotions", ["kind"], unique=False
    )
    op.create_index(
        op.f("ix_location_promotions_is_active"),
        "location_promotions",
        ["is_active"],
        unique=False,
    )
    op.create_index(
        op.f("ix_location_promotions_starts_at"),
        "location_promotions",
        ["starts_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_location_promotions_ends_at"), "location_promotions", ["ends_at"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_location_promotions_ends_at"), table_name="location_promotions")
    op.drop_index(op.f("ix_location_promotions_starts_at"), table_name="location_promotions")
    op.drop_index(op.f("ix_location_promotions_is_active"), table_name="location_promotions")
    op.drop_index(op.f("ix_location_promotions_kind"), table_name="location_promotions")
    op.drop_index(op.f("ix_location_promotions_company_id"), table_name="location_promotions")
    op.drop_table("location_promotions")
