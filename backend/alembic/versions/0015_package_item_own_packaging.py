"""Add own_packaging to freight package items.

Revision ID: 0015_package_item_own_pack
Revises: 0014_freights_own_packaging
Create Date: 2026-03-05 01:20:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0015_package_item_own_pack"
down_revision = "0014_freights_own_packaging"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "freight_package_items",
        sa.Column("own_packaging", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("freight_package_items", "own_packaging")
