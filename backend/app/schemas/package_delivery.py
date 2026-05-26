from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PackageDeliveryCreate(BaseModel):
    producer_id: int
    package_type_id: int
    quantity: float = Field(gt=0)


class PackageDeliveryRead(BaseModel):
    id: int
    producer_id: int
    package_type_id: int
    quantity: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
