from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PackageStockEntryCreate(BaseModel):
    package_type_id: int
    quantity: float = Field(gt=0)


class PackageStockEntryRead(BaseModel):
    id: int
    package_type_id: int
    quantity: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
