"""Create freight domain tables.

Revision ID: 0002_freight_domain
Revises: 0001_create_rbac_tables
Create Date: 2025-01-12 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_freight_domain"
down_revision = "0001_create_rbac_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "producers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("document", sa.String(length=30), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("contact", sa.String(length=120), nullable=True),
    )

    op.create_table(
        "companies",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("document", sa.String(length=30), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("contact", sa.String(length=120), nullable=True),
    )

    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("default_unit", sa.String(length=50), nullable=False, server_default="caixa"),
    )

    op.create_table(
        "package_types",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False, server_default="0"),
    )

    op.create_table(
        "freight_service_rates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("rate_per_unit", sa.Numeric(10, 2), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.UniqueConstraint("product_id", name="uq_freight_rate_product"),
    )

    op.create_table(
        "freights",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("producer_id", sa.Integer(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("origin_city", sa.String(length=120), nullable=False),
        sa.Column("destination_city", sa.String(length=120), nullable=False),
        sa.Column("base_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("packaging_amount", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("total_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("discount_amount", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["producer_id"], ["producers.id"]),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
    )

    op.create_table(
        "freight_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("freight_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False),
        sa.Column("unit", sa.String(length=30), nullable=False, server_default="caixa"),
        sa.Column("unit_rate", sa.Numeric(10, 2), nullable=False),
        sa.Column("observation", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(["freight_id"], ["freights.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
    )

    op.create_table(
        "freight_package_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("freight_id", sa.Integer(), nullable=False),
        sa.Column("package_type_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.ForeignKeyConstraint(["freight_id"], ["freights.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["package_type_id"], ["package_types.id"]),
    )


def downgrade() -> None:
    op.drop_table("freight_package_items")
    op.drop_table("freight_items")
    op.drop_table("freights")
    op.drop_table("freight_service_rates")
    op.drop_table("package_types")
    op.drop_table("products")
    op.drop_table("companies")
    op.drop_table("producers")
