"""Add status to cargas.

Revision ID: 0009_cargas_status
Revises: 0008_veiculos_cargas
Create Date: 2025-01-12 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0009_cargas_status"
down_revision = "0008_veiculos_cargas"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE cargas ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'aberta'"
    )


def downgrade() -> None:
    op.drop_column("cargas", "status")
