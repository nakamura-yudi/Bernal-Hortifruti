"""SQLAlchemy model definitions for produtor."""

from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Produtor(Base):
    __tablename__ = "producers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    document: Mapped[str | None] = mapped_column(String(30), unique=True)
    state_registration: Mapped[str | None] = mapped_column(String(30))
    city: Mapped[str | None] = mapped_column(String(120))
    contact: Mapped[str | None] = mapped_column(String(120))

    freights: Mapped[list["Frete"]] = relationship(back_populates="producer")
    package_deliveries: Mapped[list["PackageDelivery"]] = relationship(
        back_populates="producer", cascade="all, delete-orphan"
    )
    product_prices: Mapped[list["CompanyProductPrice"]] = relationship(
        back_populates="producer", cascade="all, delete-orphan"
    )
