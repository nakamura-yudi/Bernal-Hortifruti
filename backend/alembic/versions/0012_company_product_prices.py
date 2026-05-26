"""Create producer product prices.

Revision ID: 0012_company_product_prices
Revises: 0011_veiculos_third_party
Create Date: 2026-03-05 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0012_company_product_prices"
down_revision = "0011_veiculos_third_party"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "producer_product_prices",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("producer_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("unit", sa.String(length=50), nullable=False, server_default="caixa"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["producer_id"], ["producers.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("producer_id", "product_id", name="uq_producer_product_price"),
    )
    op.create_index(
        "ix_producer_product_prices_producer_product",
        "producer_product_prices",
        ["producer_id", "product_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_producer_product_prices_producer_product", table_name="producer_product_prices")
    op.drop_table("producer_product_prices")
