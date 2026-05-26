"""Add package deliveries to producers.

Revision ID: 0005_package_deliveries
Revises: 0004_services
Create Date: 2025-01-12 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0005_package_deliveries"
down_revision = "0004_services"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "package_deliveries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("producer_id", sa.Integer(), nullable=False),
        sa.Column("package_type_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["producer_id"], ["producers.id"]),
        sa.ForeignKeyConstraint(["package_type_id"], ["package_types.id"]),
    )


def downgrade() -> None:
    op.drop_table("package_deliveries")
