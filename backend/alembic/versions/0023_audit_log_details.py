"""Add details column to audit_logs.

Revision ID: 0023_audit_log_details
Revises: 0022_audit_log
Create Date: 2026-05-27 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0023_audit_log_details"
down_revision = "0022_audit_log"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("audit_logs", sa.Column("details", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("audit_logs", "details")
