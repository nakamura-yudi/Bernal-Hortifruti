"""Add package_type_components table.

Revision ID: 0027_package_type_components
Revises: 0026_contas_firma
Create Date: 2026-06-07 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0027_package_type_components"
down_revision = "0026_contas_firma"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "package_type_components",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "parent_id",
            sa.Integer(),
            sa.ForeignKey("package_types.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "component_id",
            sa.Integer(),
            sa.ForeignKey("package_types.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False),
        sa.UniqueConstraint("parent_id", "component_id", name="uq_package_type_components"),
        sa.CheckConstraint("parent_id != component_id", name="ck_no_self_component"),
    )
    op.create_index("ix_package_type_components_parent_id", "package_type_components", ["parent_id"])
    op.create_index("ix_package_type_components_component_id", "package_type_components", ["component_id"])


def downgrade() -> None:
    op.drop_index("ix_package_type_components_component_id", "package_type_components")
    op.drop_index("ix_package_type_components_parent_id", "package_type_components")
    op.drop_table("package_type_components")
