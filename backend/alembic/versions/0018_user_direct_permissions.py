"""Add direct user permissions table.

Revision ID: 0018_user_direct_permissions
Revises: 0017_maintenance_domain
Create Date: 2026-03-10 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0018_user_direct_permissions"
down_revision = "0017_maintenance_domain"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_permissions",
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("permission_id", sa.Integer(), sa.ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
    )


def downgrade() -> None:
    op.drop_table("user_permissions")
