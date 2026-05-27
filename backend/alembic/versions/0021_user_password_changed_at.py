"""Add password_changed_at to users.

Revision ID: 0021_user_password_changed_at
Revises: 0020_carga_driver_name
Create Date: 2026-05-26 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0021_user_password_changed_at"
down_revision = "0020_carga_driver_name"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("password_changed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "password_changed_at")
