from pydantic import BaseModel, ConfigDict, Field


class EmbalagemBase(BaseModel):
    name: str
    unit_price: float


class PackageTypeComponentIn(BaseModel):
    component_id: int
    quantity: float = Field(gt=0)


class PackageTypeComponentRead(BaseModel):
    id: int
    component_id: int
    component_name: str
    quantity: float

    model_config = ConfigDict(from_attributes=True)


class EmbalagemCreate(EmbalagemBase):
    components: list[PackageTypeComponentIn] = []


class EmbalagemRead(EmbalagemBase):
    id: int
    components: list[PackageTypeComponentRead] = []

    model_config = ConfigDict(from_attributes=True)
