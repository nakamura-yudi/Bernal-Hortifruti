"""Create report generation history table.

Revision ID: 0016_report_history
Revises: 0015_package_item_own_pack
Create Date: 2026-03-06 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0016_report_history"
down_revision = "0015_package_item_own_pack"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "report_generations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("report_type", sa.String(length=50), nullable=False),
        sa.Column("parameters", sa.JSON(), nullable=False),
        sa.Column("result_data", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_report_generations_type_created", "report_generations", ["report_type", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_report_generations_type_created", table_name="report_generations")
    op.drop_table("report_generations")
