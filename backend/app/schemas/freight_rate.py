from pydantic import BaseModel, ConfigDict


class FreightRateCreate(BaseModel):
    product_id: int
    rate_per_unit: float


class FreightRateRead(FreightRateCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
