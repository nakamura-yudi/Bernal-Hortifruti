"""SQLAlchemy model for package deliveries to producers."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PackageDelivery(Base):
    __tablename__ = "package_deliveries"

    id: Mapped[int] = mapped_column(primary_key=True)
    producer_id: Mapped[int] = mapped_column(ForeignKey("producers.id"), nullable=False)
    package_type_id: Mapped[int] = mapped_column(ForeignKey("package_types.id"), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    producer: Mapped["Produtor"] = relationship(back_populates="package_deliveries")
    package_type: Mapped["Embalagem"] = relationship(back_populates="package_deliveries")
