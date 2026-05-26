"""SQLAlchemy model definitions for veiculo (frota)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Veiculo(Base):
    __tablename__ = "veiculos"

    id: Mapped[int] = mapped_column(primary_key=True)
    plate: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    model: Mapped[str] = mapped_column(String(120), nullable=False)
    brand: Mapped[str] = mapped_column(String(120), nullable=False)
    year: Mapped[int] = mapped_column(nullable=False)
    type: Mapped[str] = mapped_column(String(40), nullable=False)
    current_km: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0")
    status: Mapped[str] = mapped_column(String(40), nullable=False, server_default="ativo")
    is_third_party: Mapped[bool] = mapped_column(nullable=False, server_default="false")
    notes: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    cargas: Mapped[list["Carga"]] = relationship(back_populates="veiculo")
    manutencoes: Mapped[list["Manutencao"]] = relationship(back_populates="veiculo")
