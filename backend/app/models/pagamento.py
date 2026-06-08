"""SQLAlchemy model definitions for pagamentos."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class LotePagamento(Base):
    __tablename__ = "lotes_pagamento"

    id: Mapped[int] = mapped_column(primary_key=True)
    firma_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="RESTRICT"), nullable=False)
    data_chegada: Mapped[date] = mapped_column(Date, nullable=False)
    observacao: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    firma: Mapped["Firma"] = relationship(back_populates="lotes_pagamento")
    itens: Mapped[list["Pagamento"]] = relationship(back_populates="lote", cascade="all, delete-orphan")


class Pagamento(Base):
    __tablename__ = "pagamentos"

    id: Mapped[int] = mapped_column(primary_key=True)
    lote_id: Mapped[int] = mapped_column(ForeignKey("lotes_pagamento.id", ondelete="CASCADE"), nullable=False)
    produtor_id: Mapped[int | None] = mapped_column(ForeignKey("producers.id", ondelete="RESTRICT"))
    valor: Mapped[float | None] = mapped_column(Numeric(10, 2))
    data_entrega: Mapped[date | None] = mapped_column(Date)
    observacao: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    lote: Mapped["LotePagamento"] = relationship(back_populates="itens")
    produtor: Mapped["Produtor | None"] = relationship(back_populates="pagamentos")
