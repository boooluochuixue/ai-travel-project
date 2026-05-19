"""Add hotel JSON column to itinerary_days

Revision ID: 20260519_163338
Revises:
Create Date: 2026-05-19 16:33:38.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import JSON

revision: str = "20260519_163338"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "itinerary_days",
        sa.Column(
            "hotel",
            JSON,
            nullable=True,
            comment='Hotel recommendation: {name, address, rating, price_level, cost_per_night, room_type, note}',
        ),
    )


def downgrade() -> None:
    op.drop_column("itinerary_days", "hotel")
