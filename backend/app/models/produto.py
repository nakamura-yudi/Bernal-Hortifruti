"""SQLAlchemy model definitions for produto."""

from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.associations import product_services


class Produto(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    default_unit: Mapped[str] = mapped_column(String(50), nullable=False, server_default="caixa")

    freight_items: Mapped[list["FreightItem"]] = relationship(back_populates="product")
    freight_rate: Mapped["FreightServiceRate"] = relationship(back_populates="product", uselist=False)
    services: Mapped[list["Service"]] = relationship(secondary=product_services, back_populates="products")
    producer_prices: Mapped[list["CompanyProductPrice"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
