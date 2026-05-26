"""Add package stock entries.

Revision ID: 0010_package_stock_entries
Revises: 0009_cargas_status
Create Date: 2025-01-12 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0010_package_stock_entries"
down_revision = "0009_cargas_status"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "package_stock_entries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("package_type_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["package_type_id"], ["package_types.id"]),
    )


def downgrade() -> None:
    op.drop_table("package_stock_entries")
