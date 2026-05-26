"""SQLAlchemy model definitions for vehicle maintenance records."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Manutencao(Base):
    __tablename__ = "manutencoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    veiculo_id: Mapped[int] = mapped_column(ForeignKey("veiculos.id"), nullable=False)
    tipo_manutencao_id: Mapped[int] = mapped_column(ForeignKey("tipos_manutencao.id"), nullable=False)
    data_realizacao: Mapped[date] = mapped_column(Date, nullable=False)
    km_veiculo: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    valor: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    oficina: Mapped[str | None] = mapped_column(String(150))
    observacoes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    veiculo: Mapped["Veiculo"] = relationship(back_populates="manutencoes")
    tipo_manutencao: Mapped["TipoManutencao"] = relationship(back_populates="manutencoes")
