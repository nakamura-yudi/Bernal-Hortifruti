"""Add unique constraints for producer/company documents.

Revision ID: 0003_unique_documents
Revises: 0002_freight_domain
Create Date: 2025-01-12 00:00:00
"""

from alembic import op


revision = "0003_unique_documents"
down_revision = "0002_freight_domain"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint("uq_producers_document", "producers", ["document"])
    op.create_unique_constraint("uq_companies_document", "companies", ["document"])


def downgrade() -> None:
    op.drop_constraint("uq_companies_document", "companies", type_="unique")
    op.drop_constraint("uq_producers_document", "producers", type_="unique")
