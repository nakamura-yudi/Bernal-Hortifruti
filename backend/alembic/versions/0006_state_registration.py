"""Add state registration to producers and companies.

Revision ID: 0006_state_registration
Revises: 0005_package_deliveries
Create Date: 2025-01-12 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0006_state_registration"
down_revision = "0005_package_deliveries"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("producers", sa.Column("state_registration", sa.String(length=30), nullable=True))
    op.add_column("companies", sa.Column("state_registration", sa.String(length=30), nullable=True))


def downgrade() -> None:
    op.drop_column("companies", "state_registration")
    op.drop_column("producers", "state_registration")
