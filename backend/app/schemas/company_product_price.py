from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CompanyProductPriceCreate(BaseModel):
    producer_id: int
    product_id: int
    unit_price: float = Field(gt=0)
    unit: str = "caixa"


class CompanyProductPriceUpdate(BaseModel):
    producer_id: int
    product_id: int
    unit_price: float = Field(gt=0)
    unit: str = "caixa"


class CompanyProductPriceRead(CompanyProductPriceCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
