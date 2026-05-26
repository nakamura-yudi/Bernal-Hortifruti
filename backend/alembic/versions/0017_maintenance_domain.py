"""Add maintenance types and maintenance records.

Revision ID: 0017_maintenance_domain
Revises: 0016_report_history
Create Date: 2026-03-08 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0017_maintenance_domain"
down_revision = "0016_report_history"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tipos_manutencao",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=120), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("periodicidade_km", sa.Integer(), nullable=True),
        sa.Column("periodicidade_dias", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nome"),
    )
    op.create_table(
        "manutencoes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("veiculo_id", sa.Integer(), nullable=False),
        sa.Column("tipo_manutencao_id", sa.Integer(), nullable=False),
        sa.Column("data_realizacao", sa.Date(), nullable=False),
        sa.Column("km_veiculo", sa.Numeric(10, 2), nullable=False),
        sa.Column("valor", sa.Numeric(10, 2), nullable=False),
        sa.Column("oficina", sa.String(length=150), nullable=True),
        sa.Column("observacoes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["tipo_manutencao_id"], ["tipos_manutencao.id"]),
        sa.ForeignKeyConstraint(["veiculo_id"], ["veiculos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_manutencoes_data_realizacao", "manutencoes", ["data_realizacao"])


def downgrade() -> None:
    op.drop_index("ix_manutencoes_data_realizacao", table_name="manutencoes")
    op.drop_table("manutencoes")
    op.drop_table("tipos_manutencao")
