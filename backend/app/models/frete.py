"""SQLAlchemy model definitions for frete."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class FreightServiceRate(Base):
    __tablename__ = "freight_service_rates"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), unique=True, nullable=False)
    rate_per_unit: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    product: Mapped["Produto"] = relationship(back_populates="freight_rate")


class Frete(Base):
    __tablename__ = "freights"

    id: Mapped[int] = mapped_column(primary_key=True)
    carga_id: Mapped[int | None] = mapped_column(ForeignKey("cargas.id"))
    producer_id: Mapped[int] = mapped_column(ForeignKey("producers.id"), nullable=False)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    origin_city: Mapped[str] = mapped_column(String(120), nullable=False)
    destination_city: Mapped[str] = mapped_column(String(120), nullable=False)
    own_packaging: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    base_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    packaging_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0")
    service_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0")
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    discount_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    producer: Mapped["Produtor"] = relationship(back_populates="freights")
    company: Mapped["Firma"] = relationship(back_populates="freights")
    carga: Mapped["Carga | None"] = relationship(back_populates="fretes")
    items: Mapped[list["FreightItem"]] = relationship(back_populates="freight", cascade="all, delete-orphan")
    packages: Mapped[list["FreightPackageItem"]] = relationship(
        back_populates="freight", cascade="all, delete-orphan"
    )



class FreightItem(Base):
    __tablename__ = "freight_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    freight_id: Mapped[int] = mapped_column(ForeignKey("freights.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String(30), nullable=False, server_default="caixa")
    unit_rate: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    observation: Mapped[str | None] = mapped_column(String(255))

    freight: Mapped["Frete"] = relationship(back_populates="items")
    product: Mapped["Produto"] = relationship(back_populates="freight_items")
    services: Mapped[list["FreightItemService"]] = relationship(
        back_populates="freight_item", cascade="all, delete-orphan"
    )

    @property
    def service_ids(self) -> list[int]:
        return [service.service_id for service in self.services]


class FreightPackageItem(Base):
    __tablename__ = "freight_package_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    freight_id: Mapped[int] = mapped_column(ForeignKey("freights.id", ondelete="CASCADE"), nullable=False)
    package_type_id: Mapped[int] = mapped_column(ForeignKey("package_types.id"), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    own_packaging: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    freight: Mapped["Frete"] = relationship(back_populates="packages")
    package_type: Mapped["Embalagem"] = relationship(back_populates="freight_packages")


class FreightItemService(Base):
    __tablename__ = "freight_item_services"

    id: Mapped[int] = mapped_column(primary_key=True)
    freight_item_id: Mapped[int] = mapped_column(
        ForeignKey("freight_items.id", ondelete="CASCADE"), nullable=False
    )
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    freight_item: Mapped["FreightItem"] = relationship(back_populates="services")
    service: Mapped["Service"] = relationship()
