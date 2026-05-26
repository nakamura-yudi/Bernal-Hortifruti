"""Add veiculos and link cargas to veiculos.

Revision ID: 0008_veiculos_cargas
Revises: 0007_cargas_caminhoes
Create Date: 2025-01-12 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0008_veiculos_cargas"
down_revision = "0007_cargas_caminhoes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "veiculos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("plate", sa.String(length=20), nullable=False),
        sa.Column("model", sa.String(length=120), nullable=False),
        sa.Column("brand", sa.String(length=120), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(length=40), nullable=False),
        sa.Column("current_km", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="ativo"),
        sa.Column("notes", sa.String(length=255)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("plate", name="uq_veiculos_plate"),
    )

    op.add_column("cargas", sa.Column("veiculo_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_cargas_veiculos", "cargas", "veiculos", ["veiculo_id"], ["id"])

    with op.batch_alter_table("cargas") as batch_op:
        batch_op.drop_column("caminhao_id")

    op.drop_table("caminhoes")

    # Keep nullable to avoid migration failures if existing cargas exist.
    op.add_column(
        "cargas",
        sa.Column("status", sa.String(length=20), nullable=False, server_default="aberta"),
    )


def downgrade() -> None:
    op.create_table(
        "caminhoes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("plate", sa.String(length=20), nullable=False),
        sa.Column("description", sa.String(length=255)),
        sa.UniqueConstraint("plate", name="uq_caminhoes_plate"),
    )

    op.add_column("cargas", sa.Column("caminhao_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_cargas_caminhoes", "cargas", "caminhoes", ["caminhao_id"], ["id"])

    with op.batch_alter_table("cargas") as batch_op:
        batch_op.drop_constraint("fk_cargas_veiculos", type_="foreignkey")
        batch_op.drop_column("veiculo_id")

    op.drop_table("veiculos")

    op.alter_column("cargas", "caminhao_id", nullable=False)
