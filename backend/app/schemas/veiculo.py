from datetime import datetime

from pydantic import BaseModel, ConfigDict


class VeiculoBase(BaseModel):
    plate: str
    model: str
    brand: str
    year: int
    type: str
    current_km: float
    status: str
    is_third_party: bool = False
    notes: str | None = None


class VeiculoCreate(VeiculoBase):
    pass


class VeiculoRead(VeiculoBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
