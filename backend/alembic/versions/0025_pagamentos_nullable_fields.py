"""Make produtor_id and valor nullable in pagamentos.

Revision ID: 0025_pagamentos_nullable_fields
Revises: 0024_pagamentos
Create Date: 2026-06-07 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0025_pagamentos_nullable_fields"
down_revision = "0024_pagamentos"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("pagamentos", "produtor_id", nullable=True)
    op.alter_column("pagamentos", "valor", nullable=True)


def downgrade() -> None:
    op.alter_column("pagamentos", "valor", nullable=False)
    op.alter_column("pagamentos", "produtor_id", nullable=False)
