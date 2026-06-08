"""SQLAlchemy model definitions for contas_firma."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ContaFirma(Base):
    __tablename__ = "contas_firma"

    id: Mapped[int] = mapped_column(primary_key=True)
    firma_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="RESTRICT"), nullable=False)
    carga_id: Mapped[int | None] = mapped_column(ForeignKey("cargas.id", ondelete="SET NULL"))
    descricao: Mapped[str | None] = mapped_column(String(500))
    valor_total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    data_emissao: Mapped[date] = mapped_column(Date, nullable=False)
    data_pagamento: Mapped[date | None] = mapped_column(Date)
    observacao: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    firma: Mapped["Firma"] = relationship(back_populates="contas")
    carga: Mapped["Carga | None"] = relationship(back_populates="contas")
