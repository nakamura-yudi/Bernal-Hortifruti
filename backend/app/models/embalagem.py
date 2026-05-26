"""SQLAlchemy model definitions for embalagem (package type)."""

from __future__ import annotations

from sqlalchemy import Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Embalagem(Base):
    __tablename__ = "package_types"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0")

    freight_packages: Mapped[list["FreightPackageItem"]] = relationship(back_populates="package_type")
    package_deliveries: Mapped[list["PackageDelivery"]] = relationship(
        back_populates="package_type", cascade="all, delete-orphan"
    )
    stock_entries: Mapped[list["PackageStockEntry"]] = relationship(
        back_populates="package_type", cascade="all, delete-orphan"
    )
