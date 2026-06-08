"""Create contas_firma table.

Revision ID: 0026_contas_firma
Revises: 0025_pagamentos_nullable_fields
Create Date: 2026-06-07 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0026_contas_firma"
down_revision = "0025_pagamentos_nullable_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "contas_firma",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("firma_id", sa.Integer(), sa.ForeignKey("companies.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("carga_id", sa.Integer(), sa.ForeignKey("cargas.id", ondelete="SET NULL"), nullable=True),
        sa.Column("descricao", sa.String(500), nullable=True),
        sa.Column("valor_total", sa.Numeric(10, 2), nullable=False),
        sa.Column("data_emissao", sa.Date(), nullable=False),
        sa.Column("data_pagamento", sa.Date(), nullable=True),
        sa.Column("observacao", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_contas_firma_firma_id", "contas_firma", ["firma_id"])
    op.create_index("ix_contas_firma_carga_id", "contas_firma", ["carga_id"])
    op.create_index("ix_contas_firma_data_emissao", "contas_firma", ["data_emissao"])
    op.create_index("ix_contas_firma_data_pagamento", "contas_firma", ["data_pagamento"])


def downgrade() -> None:
    op.drop_index("ix_contas_firma_data_pagamento", "contas_firma")
    op.drop_index("ix_contas_firma_data_emissao", "contas_firma")
    op.drop_index("ix_contas_firma_carga_id", "contas_firma")
    op.drop_index("ix_contas_firma_firma_id", "contas_firma")
    op.drop_table("contas_firma")
