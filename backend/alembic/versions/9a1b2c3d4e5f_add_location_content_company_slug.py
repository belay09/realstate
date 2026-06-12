"""add company_slug to location_content

Revision ID: 9a1b2c3d4e5f
Revises: 8d2f4a1c0b9e
Create Date: 2026-05-29

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "9a1b2c3d4e5f"
down_revision: Union[str, None] = "8d2f4a1c0b9e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TEMER_LOCATION_IDS = (
    "sarbet",
    "aware-area",
    "ayat-area",
    "gelan-area",
    "garment-area",
    "piyassa-area",
)


def upgrade() -> None:
    op.add_column(
        "location_content",
        sa.Column("company_slug", sa.String(length=64), nullable=True),
    )
    op.create_index(
        "ix_location_content_company_slug",
        "location_content",
        ["company_slug"],
    )

    conn = op.get_bind()
    for location_id in TEMER_LOCATION_IDS:
        conn.execute(
            sa.text(
                "UPDATE location_content SET company_slug = :slug "
                "WHERE location_id = :location_id"
            ),
            {"slug": "temer-properties", "location_id": location_id},
        )
    conn.execute(
        sa.text(
            "UPDATE location_content SET company_slug = :slug "
            "WHERE company_slug IS NULL"
        ),
        {"slug": "ayat-real-estate"},
    )
    conn.execute(
        sa.text(
            "UPDATE location_content SET title = 'Ayat area' "
            "WHERE location_id = 'ayat-area' AND kind = 'apartment' "
            "AND company_slug = 'temer-properties'"
        )
    )
    op.alter_column("location_content", "company_slug", nullable=False)


def downgrade() -> None:
    op.drop_index("ix_location_content_company_slug", table_name="location_content")
    op.drop_column("location_content", "company_slug")
