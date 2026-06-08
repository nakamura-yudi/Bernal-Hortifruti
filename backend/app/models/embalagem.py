"""SQLAlchemy model definitions for embalagem (package type)."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PackageTypeComponent(Base):
    __tablename__ = "package_type_components"
    __table_args__ = (
        UniqueConstraint("parent_id", "component_id", name="uq_package_type_components"),
        CheckConstraint("parent_id != component_id", name="ck_no_self_component"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    parent_id: Mapped[int] = mapped_column(ForeignKey("package_types.id", ondelete="CASCADE"), nullable=False)
    component_id: Mapped[int] = mapped_column(ForeignKey("package_types.id", ondelete="CASCADE"), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    parent: Mapped["Embalagem"] = relationship(
        back_populates="components", foreign_keys=[parent_id]
    )
    component: Mapped["Embalagem"] = relationship(
        back_populates="used_in", foreign_keys=[component_id]
    )


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
    components: Mapped[list["PackageTypeComponent"]] = relationship(
        back_populates="parent",
        foreign_keys="PackageTypeComponent.parent_id",
        cascade="all, delete-orphan",
    )
    used_in: Mapped[list["PackageTypeComponent"]] = relationship(
        back_populates="component",
        foreign_keys="PackageTypeComponent.component_id",
    )
