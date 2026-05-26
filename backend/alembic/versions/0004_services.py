"""Add services and product/service associations.

Revision ID: 0004_services
Revises: 0003_unique_documents
Create Date: 2025-01-12 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0004_services"
down_revision = "0003_unique_documents"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "services",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.UniqueConstraint("name", name="uq_services_name"),
    )

    op.create_table(
        "product_services",
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("service_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("product_id", "service_id"),
    )

    op.create_table(
        "freight_item_services",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("freight_item_id", sa.Integer(), nullable=False),
        sa.Column("service_id", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.ForeignKeyConstraint(["freight_item_id"], ["freight_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"]),
    )

    op.add_column("freights", sa.Column("service_amount", sa.Numeric(10, 2), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("freights", "service_amount")
    op.drop_table("freight_item_services")
    op.drop_table("product_services")
    op.drop_table("services")
