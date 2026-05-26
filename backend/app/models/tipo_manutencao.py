"""SQLAlchemy model definitions for maintenance types."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TipoManutencao(Base):
    __tablename__ = "tipos_manutencao"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    descricao: Mapped[str | None] = mapped_column(Text)
    periodicidade_km: Mapped[int | None] = mapped_column(Integer)
    periodicidade_dias: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    manutencoes: Mapped[list["Manutencao"]] = relationship(back_populates="tipo_manutencao")
