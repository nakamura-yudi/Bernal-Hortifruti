"""Add own_packaging flag to freights.

Revision ID: 0014_freights_own_packaging
Revises: 0013_fix_producer_prices
Create Date: 2026-03-05 01:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0014_freights_own_packaging"
down_revision = "0013_fix_producer_prices"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "freights",
        sa.Column("own_packaging", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("freights", "own_packaging")
