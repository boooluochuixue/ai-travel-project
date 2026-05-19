"""Add hotel_options JSON column to itinerary_days

Revision ID: 20260519_164500
Revises: 20260519_163338
Create Date: 2026-05-19 16:45:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import JSON

revision: str = "20260519_164500"
down_revision: Union[str, None] = "20260519_163338"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "itinerary_days",
        sa.Column(
            "hotel_options",
            JSON,
            nullable=True,
            comment='[{name, address, rating, price_level, cost_per_night, room_type, note}, ...]',
        ),
    )


def downgrade() -> None:
    op.drop_column("itinerary_days", "hotel_options")
