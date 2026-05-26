"""SQLAlchemy model definitions for carga."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Carga(Base):
    __tablename__ = "cargas"

    id: Mapped[int] = mapped_column(primary_key=True)
    load_date: Mapped[date] = mapped_column(Date, nullable=False)
    veiculo_id: Mapped[int] = mapped_column(ForeignKey("veiculos.id"), nullable=False)
    km_traveled: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0")
    fuel_liters: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0")
    toll_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0")
    diesel_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0")
    driver_name: Mapped[str | None] = mapped_column(String(255))
    is_third_party: Mapped[bool] = mapped_column(nullable=False, server_default="false")
    third_party_freight_value: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, server_default="0"
    )
    status: Mapped[str] = mapped_column(nullable=False, server_default="aberta")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    veiculo: Mapped["Veiculo"] = relationship(back_populates="cargas")
    fretes: Mapped[list["Frete"]] = relationship(back_populates="carga")

    @property
    def frete_ids(self) -> list[int]:
        return [frete.id for frete in self.fretes]
