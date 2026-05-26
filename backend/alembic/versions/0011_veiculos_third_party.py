"""Add is_third_party to veiculos.

Revision ID: 0011_veiculos_third_party
Revises: 0010_package_stock_entries
Create Date: 2025-01-12 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0011_veiculos_third_party"
down_revision = "0010_package_stock_entries"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "veiculos",
        sa.Column("is_third_party", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("veiculos", "is_third_party")
