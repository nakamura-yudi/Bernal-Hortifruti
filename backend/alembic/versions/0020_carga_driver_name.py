"""Add driver name to cargas.

Revision ID: 0020_carga_driver_name
Revises: 0019_refresh_token_sessions
Create Date: 2026-04-26 00:00:01
"""

from alembic import op
import sqlalchemy as sa


revision = "0020_carga_driver_name"
down_revision = "0019_refresh_token_sessions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("cargas", sa.Column("driver_name", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("cargas", "driver_name")
