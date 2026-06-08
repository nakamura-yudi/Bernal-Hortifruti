"""Create lotes_pagamento and pagamentos tables.

Revision ID: 0024_pagamentos
Revises: 0023_audit_log_details
Create Date: 2026-06-07 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0024_pagamentos"
down_revision = "0023_audit_log_details"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "lotes_pagamento",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("firma_id", sa.Integer(), sa.ForeignKey("companies.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("data_chegada", sa.Date(), nullable=False),
        sa.Column("observacao", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_lotes_pagamento_firma_id", "lotes_pagamento", ["firma_id"])
    op.create_index("ix_lotes_pagamento_data_chegada", "lotes_pagamento", ["data_chegada"])

    op.create_table(
        "pagamentos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("lote_id", sa.Integer(), sa.ForeignKey("lotes_pagamento.id", ondelete="CASCADE"), nullable=False),
        sa.Column("produtor_id", sa.Integer(), sa.ForeignKey("producers.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("valor", sa.Numeric(10, 2), nullable=False),
        sa.Column("data_entrega", sa.Date(), nullable=True),
        sa.Column("observacao", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_pagamentos_lote_id", "pagamentos", ["lote_id"])
    op.create_index("ix_pagamentos_produtor_id", "pagamentos", ["produtor_id"])


def downgrade() -> None:
    op.drop_index("ix_pagamentos_produtor_id", "pagamentos")
    op.drop_index("ix_pagamentos_lote_id", "pagamentos")
    op.drop_table("pagamentos")

    op.drop_index("ix_lotes_pagamento_data_chegada", "lotes_pagamento")
    op.drop_index("ix_lotes_pagamento_firma_id", "lotes_pagamento")
    op.drop_table("lotes_pagamento")
