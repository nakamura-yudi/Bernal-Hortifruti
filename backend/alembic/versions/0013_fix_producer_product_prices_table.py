"""Fix producer product prices table shape.

Revision ID: 0013_fix_producer_prices
Revises: 0012_company_product_prices
Create Date: 2026-03-05 00:30:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0013_fix_producer_prices"
down_revision = "0012_company_product_prices"
branch_labels = None
depends_on = None


def _table_exists(bind, table_name: str) -> bool:
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


def _create_producer_product_prices_table() -> None:
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


def upgrade() -> None:
    bind = op.get_bind()
    has_new_table = _table_exists(bind, "producer_product_prices")
    has_old_table = _table_exists(bind, "company_product_prices")

    if has_new_table:
        return

    # Cleanup from older implementation before creating the correct table.
    if has_old_table:
        op.drop_table("company_product_prices")

    _create_producer_product_prices_table()


def downgrade() -> None:
    bind = op.get_bind()
    if _table_exists(bind, "producer_product_prices"):
        op.drop_index(
            "ix_producer_product_prices_producer_product",
            table_name="producer_product_prices",
        )
        op.drop_table("producer_product_prices")
