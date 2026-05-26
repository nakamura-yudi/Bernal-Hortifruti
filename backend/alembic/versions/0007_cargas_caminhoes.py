"""Add cargas, caminhoes, and link fretes to cargas.

Revision ID: 0007_cargas_caminhoes
Revises: 0006_state_registration
Create Date: 2025-01-12 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0007_cargas_caminhoes"
down_revision = "0006_state_registration"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "caminhoes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("plate", sa.String(length=20), nullable=False),
        sa.Column("description", sa.String(length=255)),
        sa.UniqueConstraint("plate", name="uq_caminhoes_plate"),
    )

    op.create_table(
        "cargas",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("load_date", sa.Date(), nullable=False),
        sa.Column("caminhao_id", sa.Integer(), nullable=False),
        sa.Column("km_traveled", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("fuel_liters", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("toll_amount", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("diesel_amount", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("is_third_party", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("third_party_freight_value", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["caminhao_id"], ["caminhoes.id"]),
    )

    op.add_column("freights", sa.Column("carga_id", sa.Integer()))
    op.create_foreign_key("fk_freights_cargas", "freights", "cargas", ["carga_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint("fk_freights_cargas", "freights", type_="foreignkey")
    op.drop_column("freights", "carga_id")
    op.drop_table("cargas")
    op.drop_table("caminhoes")
