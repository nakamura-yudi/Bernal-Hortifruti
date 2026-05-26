from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict, Field, field_validator


class FreightItemCreate(BaseModel):
    product_id: int
    quantity: float = Field(gt=0)
    unit: str = "caixa"
    observation: str | None = None
    service_ids: List[int] = []


class FreightPackageItemCreate(BaseModel):
    package_type_id: int
    quantity: float = Field(gt=0)
    own_packaging: bool = False


class FreteCreate(BaseModel):
    producer_id: int
    company_id: int
    carga_id: int | None = None
    origin_city: str | None = None
    destination_city: str | None = None
    own_packaging: bool = False
    items: List[FreightItemCreate]
    packages: List[FreightPackageItemCreate] = []
    total_amount: float | None = None

    @field_validator("items")
    @classmethod
    def validate_items(cls, value: List[FreightItemCreate]) -> List[FreightItemCreate]:
        if not value:
            raise ValueError("At least one product item is required")
        return value


class FreightItemRead(BaseModel):
    id: int
    product_id: int
    quantity: float
    unit: str
    unit_rate: float
    observation: str | None = None
    service_ids: List[int] = []

    model_config = ConfigDict(from_attributes=True)


class FreightPackageItemRead(BaseModel):
    id: int
    package_type_id: int
    quantity: float
    own_packaging: bool = False
    unit_price: float

    model_config = ConfigDict(from_attributes=True)


class FreteRead(BaseModel):
    id: int
    carga_id: int | None = None
    producer_id: int
    company_id: int
    origin_city: str
    destination_city: str
    own_packaging: bool = False
    base_amount: float
    packaging_amount: float
    service_amount: float
    total_amount: float
    discount_amount: float
    created_at: datetime
    items: List[FreightItemRead] = []
    packages: List[FreightPackageItemRead] = []

    model_config = ConfigDict(from_attributes=True)
