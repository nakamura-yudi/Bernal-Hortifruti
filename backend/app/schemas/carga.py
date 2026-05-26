from datetime import date, datetime
from typing import List

from pydantic import BaseModel, ConfigDict, Field


class CargaBase(BaseModel):
    load_date: date
    veiculo_id: int
    km_traveled: float = Field(ge=0)
    fuel_liters: float = Field(ge=0)
    toll_amount: float = Field(ge=0)
    diesel_amount: float = Field(ge=0)
    driver_name: str | None = None
    is_third_party: bool = False
    third_party_freight_value: float = Field(ge=0)
    status: str = "aberta"


class CargaCreate(CargaBase):
    frete_ids: List[int] = []


class CargaRead(CargaBase):
    id: int
    created_at: datetime
    frete_ids: List[int] = []

    model_config = ConfigDict(from_attributes=True)


class CargaStatusUpdate(BaseModel):
    status: str
